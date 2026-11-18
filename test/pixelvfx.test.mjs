// node --test test/pixelvfx.test.mjs
// Runs scripts/pixelvfx/sync.mjs into a temporary template and checks what it writes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "pixelvfx");
const SYNC = join(HERE, "sync.mjs");
const FILES = [
  ["PixelVfx.ts", "src/game/vfx/PixelVfx.ts"],
  ["effects.ts", "src/game/vfx/effects.ts"],
  ["vfx-sheets.md", "docs/vfx-sheets.md"],
];

function run(...args) {
  return spawnSync(process.execPath, [SYNC, ...args], { encoding: "utf8" });
}

function tempTemplate(t) {
  const tmp = mkdtempSync(join(tmpdir(), "pixelvfx-"));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  return join(tmp, "template");
}

test("sync copies the helper, the empty effects file and the guide", (t) => {
  const out = tempTemplate(t);
  const r = run("--out", out);
  assert.equal(r.status, 0, r.stderr);
  for (const [src, dest] of FILES) assert.equal(readFileSync(join(out, dest), "utf8"), readFileSync(join(HERE, src), "utf8"));
});

test("the guide points at the search and carries no effect list", () => {
  const docs = readFileSync(join(HERE, "vfx-sheets.md"), "utf8");
  assert.match(docs, /search_resources_vectordb_items/);
  assert.match(docs, /\/vfx\/pixelfx\//);
  assert.match(docs, /pixel art VFX sprite sheet/);
  assert.doesNotMatch(docs, /Sheets by category/);
});

test("--check passes on fresh output and fails on a changed or missing file", (t) => {
  const out = tempTemplate(t);
  assert.equal(run("--out", out).status, 0);
  assert.equal(run("--out", out, "--check").status, 0);
  // Line endings alone do not count.
  const docs = join(out, "docs", "vfx-sheets.md");
  writeFileSync(docs, readFileSync(docs, "utf8").replace(/\n/g, "\r\n"));
  assert.equal(run("--check", "--out", out).status, 0);
  writeFileSync(docs, "edited by hand\n");
  const r = run("--out", out, "--check");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /stale: .*vfx-sheets\.md/);
  assert.equal(run("--out", out).status, 0);
  rmSync(join(out, "src", "game", "vfx", "effects.ts"));
  assert.equal(run("--out", out, "--check").status, 1);
});

test("a library path (the old generator's argument) is rejected", (t) => {
  const out = tempTemplate(t);
  const r = run("../agent8-library", "--out", out);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /no library path/);
});
