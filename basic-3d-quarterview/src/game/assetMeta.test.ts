// The asset info file loader: which URLs it asks, how, and what "no info" covers.
import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { loadAssetMeta, metaUrlOf, resetAssetMeta } from './assetMeta';

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
    answer((_, init) => new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))));
    const t0 = Date.now();
    expect(await loadAssetMeta(LIB, 30)).toBeNull();
    expect(Date.now() - t0).toBeLessThan(1000);
    expect(await loadAssetMeta(LIB.replace('sword', 'axe'), 30)).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
