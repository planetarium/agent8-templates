#!/usr/bin/env node
// PixelVfx playback harness: builds a throwaway copy of 2d-phaser-basic whose MainScene is ./MainScene.ts, serves it and the
// sheets from two origins (sheets with CORS, like the library host), and drives it with Playwright.
//
//   node experiments/pixelvfx/harness/run.mjs --work <scratch-dir> (--lib <agent8-library-dir> | --base-url <sheets url>)
//
// --lib serves <lib>/assets/2d/vfx/pixelfx locally; --base-url plays straight from a host (e.g. the library URL after sync).
// --compare-lib <dir> also serves a second sheet set with the same names (e.g. trimmed sheets from trim-sheets.mjs) and
// checks that every sheet draws the same pixels at the same place from both, plain and flipped.
// Playwright is resolved from PW_NODE_MODULES (a node_modules dir that has playwright) or the normal module path.
// Writes <work>/result.json and screenshots <work>/*.png.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync, readdirSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..", "..");
const args = process.argv.slice(2);
const arg = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);
const work = resolve(arg("--work") ?? "");
const lib = arg("--lib") && resolve(arg("--lib"));
if (!arg("--work") || (!lib && !arg("--base-url"))) {
  console.error("usage: run.mjs --work <dir> (--lib <agent8-library-dir> | --base-url <url>)");
  process.exit(1);
}
const require = createRequire(process.env.PW_NODE_MODULES ? join(process.env.PW_NODE_MODULES, "x.js") : import.meta.url);
const { chromium } = require("playwright");

const APP_PORT = 4310, SHEET_PORT = 4311, DEV_PORT = 4312, COMPARE_PORT = 4313;
const compareLib = arg("--compare-lib") && resolve(arg("--compare-lib"));
const baseUrl = arg("--base-url") ?? `http://127.0.0.1:${SHEET_PORT}/pixelfx`;

// 1. Throwaway app: the template + harness scene + sheets.ts pointing at baseUrl.
const app = join(work, "app");
mkdirSync(work, { recursive: true });
rmSync(app, { recursive: true, force: true });
cpSync(join(ROOT, "2d-phaser-basic"), app, { recursive: true, filter: (p) => !/[\\/](dist|node_modules)([\\/]|$)/.test(p) });
execSync("bun install", { cwd: app, stdio: "inherit" });
const sheetsLib = lib ?? arg("--sheets-lib");
if (sheetsLib) execSync(`node "${join(ROOT, "scripts", "pixelvfx", "generate.mjs")}" "${sheetsLib}" --base-url "${baseUrl}" --out "${app}"`, { stdio: "inherit" });
else {
  // No library checkout: keep the template's generated table, only repoint the base URL.
  const f = join(app, "src", "game", "vfx", "sheets.ts");
  writeFileSync(f, readFileSync(f, "utf8").replace(/export const VFX_BASE_URL = '[^']*';/, `export const VFX_BASE_URL = '${baseUrl}';`));
}
cpSync(join(HERE, "MainScene.ts"), join(app, "src", "game", "scenes", "MainScene.ts"));
execSync("bun run build", { cwd: app, stdio: "inherit" });
const js = readdirSync(join(app, "dist", "assets")).filter((f) => f.endsWith(".js")).map((f) => readFileSync(join(app, "dist", "assets", f)));
const bundle = { jsBytes: js.reduce((a, b) => a + b.length, 0), jsGzip: js.reduce((a, b) => a + gzipSync(b).length, 0) };
// The 64 MB warning is development-only: absent from the production bundle, present in a development build.
const WARN_TEXT = "of GPU memory (over 64 MB";
bundle.devWarningInProduction = js.some((b) => b.includes(WARN_TEXT));
// vite build keeps import.meta.env.DEV false unless NODE_ENV is development too.
execSync("bunx vite build --mode development --outDir dist-dev", { cwd: app, stdio: "inherit", env: { ...process.env, NODE_ENV: "development" } });

// 2. Two static servers: the app, and the sheets with Access-Control-Allow-Origin (like the library host).
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".json": "application/json", ".svg": "image/svg+xml" };
const serve = (port, rootDir, prefix = "", cors = false) =>
  new Promise((ok) => {
    const s = createServer((req, res) => {
      const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
      let file = join(rootDir, path.startsWith(prefix) ? path.slice(prefix.length) : path);
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
      if (cors) res.setHeader("Access-Control-Allow-Origin", "*");
      if (!existsSync(file)) return res.writeHead(404).end();
      res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
    }).listen(port, "127.0.0.1", () => ok(s));
  });
const servers = [await serve(APP_PORT, join(app, "dist")), await serve(DEV_PORT, join(app, "dist-dev"))];
if (lib) servers.push(await serve(SHEET_PORT, join(lib, "assets", "2d", "vfx", "pixelfx"), "/pixelfx", true));
const compareUrl = `http://127.0.0.1:${COMPARE_PORT}/pixelfx`;
if (compareLib) servers.push(await serve(COMPARE_PORT, join(compareLib, "assets", "2d", "vfx", "pixelfx"), "/pixelfx", true));

// 3. Drive it.
const browser = await chromium.launch();
const result = { baseUrl, compareLib, bundle, runs: [] };
const open = async (query, viewport, shot, after, { port = APP_PORT, base = baseUrl } = {}) => {
  const page = await browser.newPage({ viewport });
  const errors = [], warnings = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => (m.type() === "error" ? errors : m.type() === "warning" ? warnings : []).push(m.text()));
  const failed = [];
  page.on("requestfailed", (r) => failed.push(r.url()));
  page.on("response", (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
  await page.goto(`http://127.0.0.1:${port}/?base=${encodeURIComponent(base)}&${query}`);
  await page.waitForFunction(() => window.__vfx?.shotReady, null, { timeout: 120000 });
  await page.screenshot({ path: join(work, `${shot}.png`) });
  if (after) await after(page);
  await page.waitForFunction(() => window.__vfx?.done, null, { timeout: 120000 });
  const r = await page.evaluate(() => window.__vfx);
  const run = { query, port, base, viewport, ...r, errors, failed, warnings: warnings.filter((w) => w.includes("PixelVfx")) };
  result.runs.push(run);
  await page.close();
  return run;
};
const extra = (name, ok, detail = "") => result.runs.push({ query: "harness", checks: [{ name, ok, detail }], errors: [], failed: [], loadErrors: [], coverage: [] });

// --batch N plays the set N sheets at a time (a 244-sheet set does not fit GPU memory at once).
const table = readFileSync(join(app, "src", "game", "vfx", "sheets.ts"), "utf8");
const gpu = [...table.matchAll(/^  '([^']+)': \{.*gpuBytes: (\d+)/gm)].map((m) => ({ name: m[1], bytes: Number(m[2]) }));
const batch = Number(arg("--batch") ?? gpu.length);
const slices = [];
for (let from = 0; from < gpu.length; from += batch) slices.push({ from, count: batch, bytes: gpu.slice(from, from + batch).reduce((a, s) => a + s.bytes, 0) });
for (const s of slices) await open(`mode=all&from=${s.from}&count=${s.count}`, { width: 1600, height: 900 }, slices.length > 1 ? `all-sheets-${s.from}` : "all-sheets");
for (const z of [0.5, 1, 2]) await open(`mode=rain&zoom=${z}`, { width: 1280, height: 720 }, `rain-zoom-${z}`);
// Zoom and canvas size changing after play: the overlay re-fits.
await open("mode=rain&zoom=1", { width: 1280, height: 720 }, "rain-zoom-1-then-0.5-resized", async (page) => {
  await page.evaluate(() => window.__vfxSetZoom(0.5));
  await page.waitForTimeout(150);
  await page.evaluate(() => window.__vfxMeasure("zoom 1 -> 0.5 after play"));
  await page.setViewportSize({ width: 900, height: 1000 });
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__vfxMeasure("resized to 900x1000"));
  await page.screenshot({ path: join(work, "rain-zoom-1-then-0.5-resized.png") });
});

// Freed with the scene, and loaded at runtime when not preloaded.
await open("mode=release", { width: 1280, height: 720 }, "release");
await open("mode=lazy", { width: 1280, height: 720 }, "lazy");

// Development build: loading every sheet passes 64 MB and warns once; the production run above did not warn.
const prodWarnings = result.runs.flatMap((r) => r.warnings);
// The heaviest slice (+ the four option-check sheets the scene also loads) should pass 64 MB.
const heavy = slices.reduce((a, b) => (b.bytes > a.bytes ? b : a));
const dev = await open(`mode=all&from=${heavy.from}&count=${heavy.count}`, { width: 1600, height: 900 }, "all-sheets-dev", null, { port: DEV_PORT });
extra("dev build warns once over 64 MB", dev.warnings.length === (heavy.bytes > 64 * 1048576 ? 1 : 0) && heavy.bytes > 64 * 1048576, `${(heavy.bytes / 1048576).toFixed(0)} MB slice: ${dev.warnings[0] ?? "no warning"}`);
extra("production build never warns and has no warning text", prodWarnings.length === 0 && !bundle.devWarningInProduction, `${prodWarnings.length} warnings`);

// Same pixels at the same place from the full and the compared (trimmed) sheets.
if (compareLib) {
  for (const flip of ["0", "1"]) {
    const a = await open(`mode=pivot&flip=${flip}`, { width: 1920, height: 1080 }, `pivot-full-flip${flip}`);
    const b = await open(`mode=pivot&flip=${flip}`, { width: 1920, height: 1080 }, `pivot-trimmed-flip${flip}`, null, { base: compareUrl });
    for (const ca of a.cells) {
      const cb = b.cells.find((c) => c.name === ca.name);
      extra(`trimmed draws like full (${ca.name}${flip === "1" ? ", flip" : ""})`, !!cb && cb.hash === ca.hash && JSON.stringify(cb.box) === JSON.stringify(ca.box), `full ${JSON.stringify(ca.box)} trimmed ${JSON.stringify(cb?.box)}`);
    }
  }
  // The trimmed set also passes the playback checks.
  await open("mode=all", { width: 1600, height: 900 }, "all-sheets-trimmed", null, { base: compareUrl });
}

await browser.close();
servers.forEach((s) => s.close());
writeFileSync(join(work, "result.json"), JSON.stringify(result, null, 2));

const checks = result.runs.flatMap((r) => r.checks);
const bad = checks.filter((c) => !c.ok);
const errs = result.runs.flatMap((r) => [...r.errors, ...r.failed, ...(r.loadErrors ?? [])]);
console.log(`bundle ${bundle.jsBytes} B (gzip ${bundle.jsGzip} B); checks ${checks.length - bad.length}/${checks.length} ok; errors ${errs.length}`);
for (const c of bad) console.log(`FAIL ${c.name}: ${c.detail}`);
for (const e of errs) console.log(`ERROR ${e}`);
for (const r of result.runs) for (const c of r.coverage ?? []) console.log(JSON.stringify(c));
for (const w of new Set(result.runs.flatMap((r) => r.warnings ?? []))) console.log(`WARN ${w}`);
process.exit(bad.length || errs.length ? 1 : 0);
