// node --test test/pixelvfx.test.mjs
// Runs scripts/pixelvfx/generate.mjs on a small fixture library and checks what it writes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const GENERATE = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "pixelvfx", "generate.mjs");

// name, category, loop, screenSpace, hits
const FIXTURE = [
  ["hit-spark", "impacts", false, false, []],
  ["shield-block", "impacts", false, false, [{ t: 0.005, freeze: 0.09 }, { t: 0.3, freeze: 0.05 }]],
  ["coin-spin", "pickups", true, false, []],
  ["rain", "weather", true, true, []],
  ["iris", "transitions", false, true, []],
];

function makeLibrary(root) {
  const byCat = {};
  for (const [name, cat, loop, screenSpace, hits] of FIXTURE) {
    const dir = join(root, "assets", "2d", "vfx", "pixelfx", cat);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${name}.json`), JSON.stringify({ frames: [], meta: { size: { w: 64, h: 32 }, pixelfx: { act: { hits } } } }));
    (byCat[cat] ??= {})[`${name}.png`] = {
      description: `Use for: testing ${name}. ${name} - pixel art VFX sprite sheet (${cat}). A test sheet. Keywords: test.`,
      metadata: { fps: 30, loop, frames: 4, frameWidth: 32, frameHeight: 16, pivot: [16, 15], gpuBytes: 8192, screenSpace, frameData: `${name}.json` },
    };
  }
  for (const [cat, meta] of Object.entries(byCat)) writeFileSync(join(root, "assets", "2d", "vfx", "pixelfx", cat, "metadata.json"), JSON.stringify(meta));
}

function run(...args) {
  return spawnSync(process.execPath, [GENERATE, ...args], { encoding: "utf8" });
}

test("generate writes sheets.ts, docs and the helper from the metadata", (t) => {
  const tmp = mkdtempSync(join(tmpdir(), "pixelvfx-"));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const lib = join(tmp, "lib"), out = join(tmp, "template");
  makeLibrary(lib);

  const r = run(lib, "--out", out, "--base-url", "https://example.test/fx/");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /which-sheet-when: not in the library, dropped: .*crit-hit/);

  const sheets = readFileSync(join(out, "src", "game", "vfx", "sheets.ts"), "utf8");
  assert.match(sheets, /export const VFX_BASE_URL = 'https:\/\/example\.test\/fx';/);
  const rows = Object.fromEntries([...sheets.matchAll(/^  '([^']+)': \{ (.*) \},$/gm)].map((m) => [m[1], m[2]]));
  assert.deepEqual(Object.keys(rows).sort(), FIXTURE.map((f) => f[0]).sort());
  for (const [name, cat, loop, screenSpace, hits] of FIXTURE) {
    assert.match(rows[name], new RegExp(`path: '${cat}/${name}'`));
    assert.match(rows[name], new RegExp(`loop: ${loop}`));
    assert.match(rows[name], new RegExp(`screenSpace: ${screenSpace}`));
    assert.match(rows[name], /gpuBytes: 8192/);
    assert.match(rows[name], new RegExp(`hits: \\[${hits.map((h) => `\\{ t: ${h.t}, freeze: ${h.freeze} \\}`).join(", ")}\\]`));
  }
  assert.match(sheets, /export type VfxName = /);

  const docs = readFileSync(join(out, "docs", "vfx-sheets.md"), "utf8");
  const frames = (name) => docs.match(new RegExp(`^\\| \`${name}\` \\|.*\\| 4, ([^|]+) \\|`, "m"))?.[1].trim();
  assert.equal(frames("hit-spark"), "one-shot");
  assert.equal(frames("coin-spin"), "loop");
  assert.equal(frames("rain"), "loop, full-screen");
  assert.equal(frames("iris"), "one-shot, full-screen");
  assert.match(docs, /Sheets with impact frames: `shield-block`\./);
  assert.match(docs, /\| `hit-spark` \| testing hit-spark\. \|/);
  // Rows whose sheets are all missing are dropped; the code-only sound row stays.
  assert.doesNotMatch(docs, /Torch, campfire/);
  assert.match(docs, /\| Sound effects \| — \|/);

  assert.equal(readFileSync(join(out, "src", "game", "vfx", "PixelVfx.ts"), "utf8"), readFileSync(join(dirname(GENERATE), "PixelVfx.ts"), "utf8"));
});

test("--check passes on fresh output and fails on a changed or missing file", (t) => {
  const tmp = mkdtempSync(join(tmpdir(), "pixelvfx-"));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const lib = join(tmp, "lib"), out = join(tmp, "template");
  makeLibrary(lib);
  execFileSync(process.execPath, [GENERATE, lib, "--out", out]);

  assert.equal(run(lib, "--out", out, "--check").status, 0);
  // Line endings alone do not count.
  const docs = join(out, "docs", "vfx-sheets.md");
  writeFileSync(docs, readFileSync(docs, "utf8").replace(/\n/g, "\r\n"));
  assert.equal(run(lib, "--out", out, "--check").status, 0);
  writeFileSync(docs, "edited by hand\n");
  const r = run(lib, "--out", out, "--check");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /stale: .*vfx-sheets\.md/);
  rmSync(join(out, "src", "game", "vfx", "sheets.ts"));
  assert.equal(run(lib, "--out", out, "--check").status, 1);
});

test("the library path works before or after --check and after value options", (t) => {
  const tmp = mkdtempSync(join(tmpdir(), "pixelvfx-"));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const lib = join(tmp, "lib"), out = join(tmp, "template");
  makeLibrary(lib);
  assert.equal(run("--out", out, lib).status, 0);
  assert.equal(run("--check", lib, "--out", out).status, 0);
  assert.equal(run(lib, "--check", "--out", out).status, 0);
  assert.equal(run("--out", out, "--check", lib).status, 0);
  writeFileSync(join(out, "docs", "vfx-sheets.md"), "edited by hand\n");
  assert.equal(run("--check", lib, "--out", out).status, 1);
  assert.equal(run(lib, "--check", "--out", out).status, 1);
});

test("--only keeps the named sheets and rejects unknown names", (t) => {
  const tmp = mkdtempSync(join(tmpdir(), "pixelvfx-"));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const lib = join(tmp, "lib"), out = join(tmp, "template");
  makeLibrary(lib);
  assert.equal(run(lib, "--out", out, "--only", "rain,hit-spark").status, 0);
  const sheets = readFileSync(join(out, "src", "game", "vfx", "sheets.ts"), "utf8");
  assert.deepEqual([...sheets.matchAll(/^  '([^']+)':/gm)].map((m) => m[1]).sort(), ["hit-spark", "rain"]);
  assert.notEqual(run(lib, "--out", out, "--only", "nope").status, 0);
});
