// The asset info file loader: which URLs it asks, how, and what "no info" covers.
import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { loadAssetMeta, META_TIMEOUT_MS, metaUrlOf, peekAssetMeta, resetAssetMeta } from './assetMeta';

const LIB = 'https://agent8-games.verse8.io/assets/3d/objects/weapons melee/sword.glb';
const realFetch = globalThis.fetch;
let calls: { url: string; init?: RequestInit }[] = [];
let warn: ReturnType<typeof spyOn>;

function answer(fn: (url: string, init?: RequestInit) => Promise<Response>) {
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return fn(url, init);
  }) as typeof fetch;
}
const json = (body: unknown, status = 200) => Promise.resolve(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }));

beforeEach(() => {
  resetAssetMeta();
  calls = [];
  warn = spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  globalThis.fetch = realFetch;
  warn.mockRestore();
});

describe('metaUrlOf', () => {
  test('library URLs: path + .meta.json, query and hash dropped', () => {
    expect(metaUrlOf(LIB)).toBe('https://agent8-games.verse8.io/assets/3d/objects/weapons%20melee/sword.glb.meta.json');
    expect(metaUrlOf(`${LIB}?v=2#x`)).toBe('https://agent8-games.verse8.io/assets/3d/objects/weapons%20melee/sword.glb.meta.json');
  });
  test('any other URL has no info file', () => {
    expect(metaUrlOf('https://example.com/assets/sword.glb')).toBeNull();
    expect(metaUrlOf('https://agent8-games.verse8.io/other/sword.glb')).toBeNull();
    expect(metaUrlOf('/models/sword.glb')).toBeNull();
    expect(metaUrlOf('not a url')).toBeNull();
  });
});

describe('loadAssetMeta', () => {
  test('asks only library URLs, revalidating every load, once per URL', async () => {
    answer(() => json({ v: 1, tags: ['weapons melee'] }));
    expect(await loadAssetMeta('https://cdn.example.com/generated/sword.glb')).toBeNull();
    expect(calls).toHaveLength(0);
    expect(await loadAssetMeta(LIB)).toEqual({ v: 1, tags: ['weapons melee'] });
    await loadAssetMeta(LIB);
    expect(calls).toHaveLength(1);
    expect(calls[0].init?.cache).toBe('no-cache');
  });
  test('404, network / CORS error, bad JSON, another v: no info, no warning', async () => {
    for (const r of [() => json('not found', 404), () => Promise.reject(new TypeError('Failed to fetch')), () => json('{oops'), () => json({ v: 2, grip: {} }), () => json([1])]) {
      resetAssetMeta();
      answer(r);
      expect(await loadAssetMeta(LIB)).toBeNull();
    }
    expect(warn).not.toHaveBeenCalled();
  });
  test('slower than the time limit: no info, one warning', async () => {
    // the time limit by hand, not by the wall clock: the timer's callback is kept and fired here
    const realSet = globalThis.setTimeout, realClear = globalThis.clearTimeout;
    const timers: { fn: () => void; ms: number }[] = [];
    globalThis.setTimeout = ((fn: () => void, ms: number) => timers.push({ fn, ms })) as unknown as typeof setTimeout;
    globalThis.clearTimeout = (() => {}) as typeof clearTimeout;
    try {
      answer((_, init) => new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))));
      const slow = loadAssetMeta(LIB);
      const slow2 = loadAssetMeta(LIB.replace('sword', 'axe'));
      expect(timers.map((t) => t.ms)).toEqual([META_TIMEOUT_MS, META_TIMEOUT_MS]);
      for (const t of timers) t.fn(); // the limit passes
      expect(await slow).toBeNull();
      expect(await slow2).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.setTimeout = realSet;
      globalThis.clearTimeout = realClear;
    }
  });
});

describe('what is kept for the page and what is asked again', () => {
  test('an answer is kept: the file, 404, bad JSON, another v — one request however often it is asked', async () => {
    for (const r of [() => json({ v: 1 }), () => json('not found', 404), () => json('{oops'), () => json({ v: 2 })]) {
      resetAssetMeta();
      calls = [];
      answer(r);
      const first = await loadAssetMeta(LIB);
      expect(await loadAssetMeta(LIB)).toEqual(first);
      expect(calls).toHaveLength(1);
      expect(peekAssetMeta(LIB)).toEqual(first); // settled: null means "no info", for good
    }
  });
  test('a failure that may pass (network error, 5xx) is no info now and asked again next time', async () => {
    for (const fail of [() => Promise.reject(new TypeError('Failed to fetch')), () => json('bad gateway', 502)]) {
      resetAssetMeta();
      calls = [];
      answer(fail);
      const first = loadAssetMeta(LIB);
      expect(loadAssetMeta(LIB)).toBe(first); // while it is on its way: the same request
      expect(await first).toBeNull();
      expect(peekAssetMeta(LIB)).toBeUndefined(); // not settled
      answer(() => json({ v: 1, grip: { kind: 'gun' } }));
      expect(await loadAssetMeta(LIB)).toEqual({ v: 1, grip: { kind: 'gun' } });
      expect(calls).toHaveLength(2);
    }
  });
});

describe('old upper-case /assets/3D/ URLs', () => {
  test('the info file is asked under lower-case /assets/3d/, where the library writes it', () => {
    expect(metaUrlOf('https://agent8-games.verse8.io/assets/3D/weapons/ak47.glb')).toBe('https://agent8-games.verse8.io/assets/3d/weapons/ak47.glb.meta.json');
    // only that path segment: the rest of the path keeps its case
    expect(metaUrlOf('https://agent8-games.verse8.io/assets/3D/Objects/3D/Sword.glb')).toBe('https://agent8-games.verse8.io/assets/3d/Objects/3D/Sword.glb.meta.json');
    expect(metaUrlOf('https://agent8-games.verse8.io/assets/2D/x.png')).toBe('https://agent8-games.verse8.io/assets/2D/x.png.meta.json');
  });
  test('both spellings share one request', async () => {
    answer(() => json({ v: 1 }));
    await loadAssetMeta('https://agent8-games.verse8.io/assets/3D/weapons/ak47.glb');
    await loadAssetMeta('https://agent8-games.verse8.io/assets/3d/weapons/ak47.glb');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://agent8-games.verse8.io/assets/3d/weapons/ak47.glb.meta.json');
  });
});
