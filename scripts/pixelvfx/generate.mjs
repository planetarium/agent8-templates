#!/usr/bin/env node
// Generates the PixelVfx helper for the Phaser templates from the agent8-library pixelfx metadata.
//
//   node scripts/pixelvfx/generate.mjs <agent8-library-dir> [--base-url <url>] [--out <template-dir> ...] [--only a,b,c] [--check]
//
// Reads <agent8-library-dir>/assets/2d/vfx/pixelfx/<category>/metadata.json (+ each sheet's JSON for impact timing) and
// writes into every template:
//   src/game/vfx/PixelVfx.ts  copied from scripts/pixelvfx/PixelVfx.ts
//   src/game/vfx/sheets.ts    VFX_BASE_URL, VfxName, one table per category
//   docs/vfx-sheets.md        usage, which sheet when, rules, sheets by category
// --base-url defaults to the library URL; pass another one to point a local copy at a local server or at public/.
// --check writes nothing and exits 1 if any of those files differ from what would be generated (line endings ignored).

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const DEFAULT_BASE_URL = "https://agent8-games.verse8.io/assets/2d/vfx/pixelfx";
const DEFAULT_OUT = ["2d-phaser-basic", "2d-phaser-sprite-character-gravity", "2d-phaser4-basic", "2d-phaser4-sprite-character-gravity"];

// Full-screen effects are drawn as a whole 320x180 scene rather than around an anchor point. metadata.screenSpace wins;
// this is the fallback for metadata that does not carry it.
const SCREEN_SPACE = new Set(["weather"]);

// "Which sheet when", in the words users write: request -> sheets + what to add in code. Names missing from the library
// are dropped (a row with no sheet left is dropped too, unless it is a code-only row with an empty list).
const WHEN = [
  ["“punchy”, “impactful”, “satisfying hit”, a sword or punch lands", ["hit-spark", "crit-hit"], "`hitStop` is only for sheets with impact frames (`hit-flash`, `heavy-landing`, `shield-block`, `level-up`); for `hit-spark`/`crit-hit` do a 60–90 ms hit stop in game code + camera shake + white flash"],
  ["A bullet or arrow hits", ["bullet-impact"], "camera shake"],
  ["Enemy dies, “pop”, “burst”, “vanish”", ["cartoon-pow", "small-explosion", "poof"], "`plasma-explosion` for energy/sci-fi; camera shake"],
  ["Block, parry", ["shield-block"], ""],
  ["Pick up, “collect”, “sparkle”, “rewarding”", ["collect-burst"], "floating “+1” text and a HUD counter bounce"],
  ["Coin, gem or heart lying in the world", ["coin-spin", "gem-spin", "heart-pickup"], "loops; destroy on pickup"],
  ["Coin flies into a HUD counter", ["coin-collect"], ""],
  ["Heal, “restore”, “magical” buff", ["heal"], "`follow` the character; HP bar tween"],
  ["Level up, combo", ["level-up", "combo-counter"], "screen flash"],
  ["Stunned, poisoned", ["stunned", "poisoned"], "loops; `follow` the character"],
  ["Fireball, projectile in flight", ["fireball"], "loops; `flip` when moving left"],
  ["Torch, campfire", ["torch", "campfire"], "loops"],
  ["Rain, snow, “weather”", ["rain", "snow", "rain-splash", "ripples"], "rain/snow are full-screen (no x, y); `rain-splash`/`ripples` on the ground"],
  ["Sound effects", [], "not a sheet: use the project's audio tools and sfx path"],
];

const args = process.argv.slice(2);
const opt = (flag) => {
  const values = [];
  for (let i = 0; i < args.length; i++) if (args[i] === flag && args[i + 1]) values.push(args[++i]);
  return values;
};
// Options that take a value; boolean flags such as --check do not, so `--check <lib>` and `<lib> --check` both work.
const VALUE_OPTIONS = new Set(["--base-url", "--out", "--only"]);
const lib = args.find((a, i) => !a.startsWith("--") && !VALUE_OPTIONS.has(args[i - 1]));
if (!lib) {
  console.error("usage: node scripts/pixelvfx/generate.mjs <agent8-library-dir> [--base-url <url>] [--out <template-dir> ...]");
  process.exit(1);
}
const SRC = join(resolve(lib), "assets", "2d", "vfx", "pixelfx");
if (!existsSync(SRC)) throw new Error(`no pixelfx sheets at ${SRC}`);
const baseUrl = (opt("--base-url")[0] ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
const outs = (opt("--out").length ? opt("--out") : DEFAULT_OUT).map((d) => resolve(ROOT, d));
// --only a,b,c keeps just those sheets (e.g. a staging zip that ships a few sheets in public/).
const only = opt("--only").length ? new Set(opt("--only").join(",").split(",").map((n) => n.trim()).filter(Boolean)) : null;

const categories = readdirSync(SRC, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const byName = new Map();
const sheets = [];
for (const cat of categories) {
  const metaFile = join(SRC, cat, "metadata.json");
  if (!existsSync(metaFile)) continue;
  const meta = JSON.parse(readFileSync(metaFile, "utf8"));
  for (const [file, e] of Object.entries(meta)) {
    if (!file.endsWith(".png")) continue;
    const name = file.slice(0, -4);
    if (only && !only.has(name)) continue;
    if (byName.has(name)) throw new Error(`duplicate effect name '${name}' in ${byName.get(name).cat} and ${cat}`);
    const m = e.metadata;
    const json = JSON.parse(readFileSync(join(SRC, cat, m.frameData ?? `${name}.json`), "utf8"));
    const hits = (json.meta?.pixelfx?.act?.hits ?? []).map((h) => ({ t: h.t, freeze: h.freeze }));
    // GPU memory of the uploaded sheet (RGBA8). Older metadata has no gpuBytes: derive it from the sheet size.
    const size = json.meta?.size ?? {};
    const gpuBytes = m.gpuBytes ?? (m.sheetWidth ?? size.w) * (m.sheetHeight ?? size.h) * 4;
    if (!Number.isFinite(gpuBytes)) throw new Error(`no gpuBytes or sheet size for '${name}'`);
    const screenSpace = m.screenSpace ?? SCREEN_SPACE.has(cat);
    const s = { cat, name, m, hits, gpuBytes, screenSpace, ...summary(e.description, cat) };
    byName.set(name, s);
    sheets.push(s);
  }
}
if (!sheets.length) throw new Error(`no sheets in ${SRC}`);
if (only) for (const n of only) if (!byName.has(n)) throw new Error(`--only: no sheet named '${n}'`);

// "[Use for: when to use it. ]Title - pixel art VFX sprite sheet (cat). What it shows: details. Keywords: a, b. ..."
function summary(description, cat) {
  const useFor = description.match(/^Use for: (.*?\.)\s/)?.[1];
  const body = description.split(`(${cat}). `)[1] ?? description;
  const what = body.split(" Keywords:")[0];
  let short = what.split(/[:.](\s|$)/)[0];
  if (short.length > 90) short = short.slice(0, 90).replace(/\s+\S*$/, "") + "…";
  const keywords = (body.match(/Keywords: ([^.]*)\./)?.[1] ?? "").split(",").map((k) => k.trim()).filter(Boolean);
  return { short, keywords, useFor };
}

const ident = (cat) => cat.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
const typeName = (cat) => cat.replace(/(^|[^a-zA-Z0-9]+)([a-zA-Z0-9])/g, (_, __, c) => c.toUpperCase()) + "Vfx";
const row = (s) =>
  `  '${s.name}': { path: '${s.cat}/${s.name}', frameWidth: ${s.m.frameWidth}, frameHeight: ${s.m.frameHeight}, ` +
  `pivot: [${s.m.pivot.join(", ")}], loop: ${s.m.loop}, fps: ${s.m.fps}, frames: ${s.m.frames}, ` +
  `screenSpace: ${s.screenSpace}, gpuBytes: ${s.gpuBytes}, hits: [${s.hits.map((h) => `{ t: ${h.t}, freeze: ${h.freeze} }`).join(", ")}] },`;

const sheetsTs = `// Generated by scripts/pixelvfx/generate.mjs from the agent8-library pixelfx metadata. Do not edit by hand.

export const VFX_BASE_URL = '${baseUrl}';

export interface VfxSheet {
  /** <category>/<name>, under VFX_BASE_URL. */
  path: string;
  frameWidth: number;
  frameHeight: number;
  /** Ground/anchor point inside a frame, in px. */
  pivot: [number, number];
  loop: boolean;
  fps: number;
  frames: number;
  /** Full-screen overlay (weather): covers the camera instead of standing at x, y. */
  screenSpace: boolean;
  /** GPU memory of the loaded sheet, in bytes. */
  gpuBytes: number;
  /** Impact frames: t seconds after start, freeze seconds long. */
  hits: { t: number; freeze: number }[];
}
${categories
  .filter((cat) => sheets.some((s) => s.cat === cat))
  .map((cat) => {
    const list = sheets.filter((s) => s.cat === cat);
    return `
export type ${typeName(cat)} = ${list.map((s) => `'${s.name}'`).join(" | ")};
export const ${ident(cat)}: Record<${typeName(cat)}, VfxSheet> = {
${list.map(row).join("\n")}
};`;
  })
  .join("\n")}

export type VfxName = ${[...new Set(sheets.map((s) => typeName(s.cat)))].join(" | ")};
export const SHEETS: Record<VfxName, VfxSheet> = { ${[...new Set(sheets.map((s) => `...${ident(s.cat)}`))].join(", ")} };
`;

const when = WHEN.map(([moment, names, note]) => [moment, names.filter((n) => byName.has(n)), note, !names.length]).filter(([, names, , codeOnly]) => names.length || codeOnly);
const missing = WHEN.flatMap(([, names]) => names).filter((n) => !byName.has(n));
if (missing.length) console.warn(`which-sheet-when: not in the library, dropped: ${missing.join(", ")}`);

const loopWord = (s) => `${s.m.loop ? "loop" : "one-shot"}${s.screenSpace ? ", full-screen" : ""}`;
const withHits = sheets.filter((s) => s.hits.length).map((s) => `\`${s.name}\``);
const docs = `# Pixel art VFX (PixelVfx)

Read this before writing any effect.

\`\`\`ts
import { PixelVfx } from '../vfx/PixelVfx';                       // in src/game/scenes/*.ts
PixelVfx.preload(this, ['hit-spark', 'small-explosion']);          // in preload(): only the effects this scene plays
PixelVfx.play(this, 'hit-spark', enemy.x, enemy.y, { scale: 2 });  // anywhere after: plays standing at x, y
\`\`\`

\`src/game/vfx/PixelVfx.ts\` plays ${sheets.length} pre-rendered pixel art effect sheets (pixelfx, MIT) from the Agent8 asset
library: origin at the sheet's pivot, right fps, loop or one-shot, crisp pixels, cleanup. \`play()\` returns the sprite:
**one-shots destroy themselves**, **loops** run until you call \`sprite.destroy()\` (keep the returned sprite).

## What is a sheet, what is code

- **World effects → PixelVfx**: hits, explosions, deaths, pickups, heals and buffs, status, projectiles, weather.
- **UI feedback and screen effects → code** (tweens, graphics, camera effects): tap glows, ripples, scale bounces,
  floating number text, vignettes, screen flashes, camera shake. Do not force a sheet onto UI.
- They usually go together: a hit = \`hit-spark\` sheet + hit stop + camera shake + flash; a pickup = \`collect-burst\`
  sheet + floating "+1" text + counter bounce. Do not hand-draw the world part either.
- Skip the sheets only if the **user** asked for a smooth vector, realistic/HD or painted look (or gave art in that
  style), or asked you to draw the effects yourself / leave them out. A style you picked yourself is not a reason.

## Which sheet when

| The user asks for | Sheets | Add in code |
|---|---|---|
${when.map(([moment, names, note, codeOnly]) => `| ${moment} | ${codeOnly ? "—" : names.map((n) => `\`${n}\``).join(", ")} | ${note} |`).join("\n")}

## Rules

1. Size an effect only with the \`scale\` option. It is a whole number (1, 2, 3); the pixels stay crisp.
2. Never call \`setDisplaySize\` / \`displayWidth\` / \`displayHeight\` on a PixelVfx sprite. The template's setDisplaySize
   rule does not apply to effects; resizing to a pixel size blurs them and breaks the pivot.
3. \`x, y\` is where the effect stands: the feet of a character, the bottom of a blast, the contact point of a hit.
4. Glow is baked into alpha, so effects read best over darker backgrounds; over very light ones they look faint.
5. Sheets with impact frames (\`hits\` in \`sheets.ts\`) can hit-stop: \`{ hitStop: true }\` pauses the effect on them,
   \`{ hitStop: (ms) => … }\` also lets you freeze your game for that long. ${withHits.length ? `Sheets with impact frames: ${withHits.join(", ")}.` : "No sheet here has impact frames."}
   On any other sheet \`hitStop\` does nothing (a development warning says so): do the hit stop in game code.
6. Full-screen effects (weather, transitions, nuke-style blasts) use a lot of mobile GPU memory (GPU MB below): at most
   one per scene, load it when needed (\`play()\` loads a sheet that was not preloaded), and it is freed when the scene ends.
7. Never tween a PixelVfx sprite's \`scale\`/\`scaleX\`/\`scaleY\` (Game.ts converts scale tweens to displayWidth, so scale 2 →
   tween 3 becomes 6×); for a size pop tween \`displayWidth\` to \`frameWidth * k\` and \`displayHeight\` to \`frameHeight * k\`.
8. PixelVfx sheets load from \`VFX_BASE_URL\` in \`sheets.ts\` and are the platform's own assets — they are the one exception
   to "declare every URL in src/assets.json".

Options: \`scale\`, \`depth\` (default 1000), \`flip\` (directional effects face right; flip when facing left),
\`follow\` (an object; \`x, y\` become offsets from it, and the effect goes when the object is destroyed), \`repeat\`
(override loop/one-shot; any finite repeat also removes the effect when it ends), \`hitStop\`, \`keep\`. Full-screen sheets (\`rain\`) ignore x, y and cover the camera at any zoom.
Sheets are freed when the scene that loaded them shuts down; pass \`{ keep: true }\` to \`preload\`/\`play\` to keep them.
In development a console warning appears when the loaded sheets pass 64 MB of GPU memory.

## Sheets by category (${sheets.length})

Size is one frame in px; pivot is the anchor point inside it; GPU MB is the memory the loaded sheet takes.
${categories
  .filter((cat) => sheets.some((s) => s.cat === cat))
  .map((cat) => `
### ${cat}

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
${sheets
  .filter((s) => s.cat === cat)
  .map((s) => `| \`${s.name}\` | ${s.useFor ?? `${s.short}${s.keywords.length ? ` (${s.keywords.join(", ")})` : ""}`} | ${s.m.frameWidth}x${s.m.frameHeight} | ${s.m.frames}, ${loopWord(s)} | ${s.m.pivot.join(", ")} | ${(s.gpuBytes / 1048576).toFixed(1)} |`)
  .join("\n")}`)
  .join("\n")}
`;

const helper = readFileSync(join(HERE, "PixelVfx.ts"), "utf8");
const files = outs.flatMap((out) => [
  [join(out, "src", "game", "vfx", "PixelVfx.ts"), helper],
  [join(out, "src", "game", "vfx", "sheets.ts"), sheetsTs],
  [join(out, "docs", "vfx-sheets.md"), docs],
]);

if (args.includes("--check")) {
  const lf = (t) => t.replace(/\r\n/g, "\n");
  const stale = files.filter(([f, text]) => !existsSync(f) || lf(readFileSync(f, "utf8")) !== lf(text)).map(([f]) => f);
  for (const f of stale) console.error(`stale: ${f}`);
  console.log(stale.length ? `${stale.length} generated file(s) out of date; run node scripts/pixelvfx/generate.mjs <lib>` : `${files.length} generated files up to date`);
  process.exit(stale.length ? 1 : 0);
}

for (const [f, text] of files) {
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, text);
}
console.log(`${sheets.length} sheets in ${categories.length} categories, base ${baseUrl} -> ${outs.join(", ")}`);
