#!/usr/bin/env node
// Copies the PixelVfx helper and its guide into the Phaser 2D templates, so every template carries the same files.
//
//   node scripts/pixelvfx/sync.mjs [--out <template-dir> ...] [--check]
//
// Writes into every template (default: 2d-phaser-basic, 2d-phaser-sprite-character-gravity):
//   src/game/vfx/PixelVfx.ts  from scripts/pixelvfx/PixelVfx.ts
//   src/game/vfx/effects.ts   from scripts/pixelvfx/effects.ts (empty; the agent fills it with search results)
//   docs/vfx-sheets.md        from scripts/pixelvfx/vfx-sheets.md
// There is no effect list in the templates: agents find effects with the resource search, so effects added to the
// asset library need no template change.
// --check writes nothing and exits 1 if any of those files differ from the source (line endings ignored).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const DEFAULT_OUT = ["2d-phaser-basic", "2d-phaser-sprite-character-gravity"];
const SOURCES = [
  ["PixelVfx.ts", ["src", "game", "vfx", "PixelVfx.ts"]],
  ["effects.ts", ["src", "game", "vfx", "effects.ts"]],
  ["vfx-sheets.md", ["docs", "vfx-sheets.md"]],
];
const USAGE = "usage: node scripts/pixelvfx/sync.mjs [--out <template-dir> ...] [--check]";

const args = process.argv.slice(2);
const outArgs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--check") continue;
  if (args[i] === "--out" && args[i + 1]) {
    outArgs.push(args[++i]);
    continue;
  }
  // The old generator took an agent8-library path; the effect list it built is gone.
  console.error(`unknown argument '${args[i]}' (no library path is needed any more)\n${USAGE}`);
  process.exit(1);
}
const outs = (outArgs.length ? outArgs : DEFAULT_OUT).map((d) => resolve(ROOT, d));

const files = outs.flatMap((out) => SOURCES.map(([src, dest]) => [join(out, ...dest), readFileSync(join(HERE, src), "utf8")]));

if (args.includes("--check")) {
  const lf = (t) => t.replace(/\r\n/g, "\n");
  const stale = files.filter(([f, text]) => !existsSync(f) || lf(readFileSync(f, "utf8")) !== lf(text)).map(([f]) => f);
  for (const f of stale) console.error(`stale: ${f}`);
  console.log(stale.length ? `${stale.length} file(s) out of date; run npm run pixelvfx:sync` : `${files.length} files up to date`);
  process.exit(stale.length ? 1 : 0);
}

for (const [f, text] of files) {
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, text);
}
console.log(`PixelVfx -> ${outs.join(", ")}`);
