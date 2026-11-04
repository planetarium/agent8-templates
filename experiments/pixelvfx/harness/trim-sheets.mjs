#!/usr/bin/env node
// Makes a trimmed copy of a pixelfx sheet set, to check the helper against trimmed frames before the library ships them.
//
//   node experiments/pixelvfx/harness/trim-sheets.mjs <agent8-library-dir> <out-dir>
//
// Every frame is cropped to its non-transparent pixels and the crops are shelf-packed into a new PNG no wider than the
// original. The JSON gets trimmed / spriteSourceSize / sourceSize like TexturePacker output, and metadata.json gets
// trimmed: true, the new sheetWidth/sheetHeight and gpuBytes. Writes <out-dir>/assets/2d/vfx/pixelfx/<category>/...
// Playwright comes from PW_NODE_MODULES or the normal module path (the browser does the PNG work).

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const [lib, outDir] = process.argv.slice(2).map((p) => p && resolve(p));
if (!lib || !outDir) {
  console.error("usage: trim-sheets.mjs <agent8-library-dir> <out-dir>");
  process.exit(1);
}
const require = createRequire(process.env.PW_NODE_MODULES ? join(process.env.PW_NODE_MODULES, "x.js") : import.meta.url);
const { chromium } = require("playwright");

const SRC = join(lib, "assets", "2d", "vfx", "pixelfx");
const DEST = join(outDir, "assets", "2d", "vfx", "pixelfx");
mkdirSync(DEST, { recursive: true });
for (const f of ["LICENSE", "NOTICE.md"]) if (existsSync(join(SRC, f))) cpSync(join(SRC, f), join(DEST, f));

const browser = await chromium.launch();
const page = await browser.newPage();
const summary = [];
for (const cat of readdirSync(SRC, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  mkdirSync(join(DEST, cat), { recursive: true });
  const meta = JSON.parse(readFileSync(join(SRC, cat, "metadata.json"), "utf8"));
  for (const [file, e] of Object.entries(meta)) {
    if (!file.endsWith(".png")) continue;
    const name = file.slice(0, -4);
    const json = JSON.parse(readFileSync(join(SRC, cat, `${name}.json`), "utf8"));
    const png = readFileSync(join(SRC, cat, file)).toString("base64");
    const before0 = json.meta.size.w * json.meta.size.h * 4;
    const r = await page.evaluate(async ({ png, frames, maxW }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const src = document.createElement("canvas");
      src.width = img.width; src.height = img.height;
      const sctx = src.getContext("2d", { willReadFrequently: true });
      sctx.drawImage(img, 0, 0);
      const all = sctx.getImageData(0, 0, img.width, img.height).data;
      const boxes = frames.map((f) => {
        let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
        for (let y = 0; y < f.frame.h; y++) for (let x = 0; x < f.frame.w; x++) {
          if (all[((f.frame.y + y) * img.width + f.frame.x + x) * 4 + 3] === 0) continue;
          if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
        }
        // An empty frame keeps a 1x1 transparent crop.
        return x1 < 0 ? { x: 0, y: 0, w: 1, h: 1 } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
      });
      // Shelf pack in frame order.
      let cx = 0, cy = 0, rowH = 0, width = 0;
      const at = boxes.map((b) => {
        if (cx + b.w > maxW) { cx = 0; cy += rowH; rowH = 0; }
        const p = { x: cx, y: cy };
        cx += b.w; rowH = Math.max(rowH, b.h); width = Math.max(width, cx);
        return p;
      });
      const height = cy + rowH;
      const out = document.createElement("canvas");
      out.width = width; out.height = height;
      const octx = out.getContext("2d");
      boxes.forEach((b, i) => octx.drawImage(src, frames[i].frame.x + b.x, frames[i].frame.y + b.y, b.w, b.h, at[i].x, at[i].y, b.w, b.h));
      return { boxes, at, width, height, png: out.toDataURL("image/png").split(",")[1] };
    }, { png, frames: json.frames, maxW: json.meta.size.w });

    json.frames = json.frames.map((f, i) => {
      const b = r.boxes[i], p = r.at[i];
      const trimmed = b.w !== f.sourceSize.w || b.h !== f.sourceSize.h;
      return { ...f, frame: { x: p.x, y: p.y, w: b.w, h: b.h }, trimmed, spriteSourceSize: { x: b.x, y: b.y, w: b.w, h: b.h }, sourceSize: f.sourceSize };
    });
    json.meta.size = { w: r.width, h: r.height };
    writeFileSync(join(DEST, cat, file), Buffer.from(r.png, "base64"));
    writeFileSync(join(DEST, cat, `${name}.json`), JSON.stringify(json));
    const before = e.metadata.gpuBytes ?? before0;
    e.metadata = { ...e.metadata, trimmed: true, sheetWidth: r.width, sheetHeight: r.height, gpuBytes: r.width * r.height * 4 };
    summary.push({ name, before, after: e.metadata.gpuBytes });
  }
  writeFileSync(join(DEST, cat, "metadata.json"), JSON.stringify(meta, null, 2));
}
await browser.close();
const mb = (b) => (b / 1048576).toFixed(1);
console.log(`${summary.length} sheets trimmed -> ${DEST}`);
for (const s of summary) console.log(`${s.name} ${s.before ? mb(s.before) + " -> " : ""}${mb(s.after)} MB`);
