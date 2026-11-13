// config.ts must stay a leaf of the import graph. Game modules import it
// (player.ts, state.ts, and world.ts when a map reads PLAYER.spawn), and
// App.tsx loads it first; if config.ts reached back into them, the module
// that imports config would run before config finished and crash at start
// ("Cannot access 'PLAYER' before initialization").
import { describe, expect, test } from 'bun:test';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const SRC = resolve(import.meta.dir, '..');
const CONFIG = join(SRC, 'config.ts');

/** Runtime imports of a module (type-only imports are erased, so they do not count). */
function imports(file: string): string[] {
  const text = readFileSync(file, 'utf8');
  const out: string[] = [];
  for (const m of text.matchAll(/^\s*(import|export)\s+(type\s+)?[^;]*?from\s+['"]([^'"]+)['"]/gm)) {
    if (!m[2]) out.push(m[3]);
  }
  for (const m of text.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)) out.push(m[1]);
  return out;
}

function resolveLocal(from: string, spec: string): string | null {
  const base = resolve(dirname(from), spec);
  for (const f of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]) if (existsSync(f) && f.match(/\.tsx?$/)) return f;
  return null;
}

/** Every module config.ts loads, transitively: local files (relative to src/) and packages. */
function configGraph() {
  const files = new Set<string>();
  const packages = new Set<string>();
  const walk = (file: string) => {
    for (const spec of imports(file)) {
      if (!spec.startsWith('.')) {
        packages.add(spec);
        continue;
      }
      const f = resolveLocal(file, spec);
      if (!f || files.has(f)) continue;
      files.add(f);
      walk(f);
    }
  };
  walk(CONFIG);
  return { files: [...files].map((f) => f.slice(SRC.length + 1)), packages: [...packages] };
}

describe('config.ts is a leaf', () => {
  test('config.ts loads no game logic, components or packages (only plain data files)', () => {
    const { files, packages } = configGraph();
    expect(packages).toEqual([]);
    expect(files.filter((f) => !/^game\/\w+Presets\.ts$/.test(f))).toEqual([]);
  });

  const world = join(SRC, 'game', 'world.ts');
  test.skipIf(!existsSync(world))('a world.ts that imports config and reads PLAYER at load does not crash when config loads first', async () => {
    // Copy src/, make world.ts read PLAYER at module load like a map that moves the spawn, then load in App order.
    const dir = mkdtempSync(join(tmpdir(), 'r3f-import-order-'));
    try {
      cpSync(SRC, dir, { recursive: true });
      const copy = join(dir, 'game', 'world.ts');
      writeFileSync(
        copy,
        `${readFileSync(copy, 'utf8')}\nimport { PLAYER as __PLAYER } from '../config';\nexport const __spawnY = __PLAYER.spawn[1];\n`,
      );
      const config = await import(join(dir, 'config.ts'));
      const w = await import(copy);
      expect(w.__spawnY).toBe(config.PLAYER.spawn[1]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
