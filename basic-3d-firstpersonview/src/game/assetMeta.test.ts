// The asset info file loader: which URLs it asks, how, and what "no info" covers.
import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { latestAssetMeta, loadAssetMeta, META_TIMEOUT_MS, metaUrlOf, peekAssetMeta, resetAssetMeta, subscribeAssetMeta } from './assetMeta';

const LIB = 'https://agent8-games.verse8.io/assets/3d/objects/weapons melee/sword.glb';
// a generated asset: {wallet}/mcp-uploads/, whatever comes below
const WALLET = '0x1A2b3C4d5E6f7890aBcDeF1234567890abCDef12';
const GEN = `https://agent8-games.verse8.io/${WALLET}/mcp-uploads/static-assets/static-3d-9f3c.glb`;
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

describe('generated folder URLs ({wallet}/mcp-uploads/)', () => {
  const HOST = 'https://agent8-games.verse8.io';
  test('path + .meta.json, query and hash dropped, whatever the wallet folder is called', () => {
    expect(metaUrlOf(GEN)).toBe(`${GEN}.meta.json`);
    expect(metaUrlOf(`${GEN}?v=2#x`)).toBe(`${GEN}.meta.json`);
    expect(metaUrlOf(`${HOST}/seungbae/mcp-uploads/a16-probe-20261120.glb`)).toBe(`${HOST}/seungbae/mcp-uploads/a16-probe-20261120.glb.meta.json`);
  });
  test('only the prefix is matched: any folder or file name below it', () => {
    expect(metaUrlOf(`${HOST}/${WALLET}/mcp-uploads/sword.glb`)).toBe(`${HOST}/${WALLET}/mcp-uploads/sword.glb.meta.json`);
    expect(metaUrlOf(`${HOST}/${WALLET}/mcp-uploads/a/b c/Sword.GLB`)).toBe(`${HOST}/${WALLET}/mcp-uploads/a/b%20c/Sword.GLB.meta.json`);
    // the 3D → 3d rule is the library's: a generated path keeps its case
    expect(metaUrlOf(`${HOST}/${WALLET}/mcp-uploads/3D/sword.glb`)).toBe(`${HOST}/${WALLET}/mcp-uploads/3D/sword.glb.meta.json`);
    expect(metaUrlOf(`${HOST}/3D/mcp-uploads/sword.glb`)).toBe(`${HOST}/3D/mcp-uploads/sword.glb.meta.json`);
  });
  test('the wallet folder is exactly one path segment', () => {
    expect(metaUrlOf(`${HOST}/mcp-uploads/sword.glb`)).toBeNull(); // none
    expect(metaUrlOf(`${HOST}//mcp-uploads/sword.glb`)).toBeNull(); // empty
    expect(metaUrlOf(`${HOST}/a/b/mcp-uploads/sword.glb`)).toBeNull(); // two
    expect(metaUrlOf(`${HOST}/${WALLET}/other/mcp-uploads/sword.glb`)).toBeNull();
  });
  test('another host, another folder, the folder itself: no info file', () => {
    expect(metaUrlOf(`https://example.com/${WALLET}/mcp-uploads/sword.glb`)).toBeNull();
    expect(metaUrlOf(`https://agent8-games.verse8.io.example.com/${WALLET}/mcp-uploads/sword.glb`)).toBeNull();
    expect(metaUrlOf(`http://agent8-games.verse8.io/${WALLET}/mcp-uploads/sword.glb`)).toBeNull();
    expect(metaUrlOf(`${HOST}/${WALLET}/uploads/sword.glb`)).toBeNull();
    expect(metaUrlOf(`${HOST}/${WALLET}/mcp-uploads-old/sword.glb`)).toBeNull();
    expect(metaUrlOf(`${HOST}/${WALLET}/MCP-Uploads/sword.glb`)).toBeNull();
    expect(metaUrlOf(`${HOST}/${WALLET}/mcp-uploads`)).toBeNull();
    expect(metaUrlOf(`${HOST}/${WALLET}/mcp-uploads/`)).toBeNull();
    expect(metaUrlOf(`${HOST}/${WALLET}/sword.glb`)).toBeNull();
    expect(metaUrlOf(`${HOST}/assetsX/sword.glb`)).toBeNull();
  });
  test('asked like a library URL: revalidating, once per URL; a 404 is a kept "no info"', async () => {
    answer(() => json('not found', 404));
    expect(await loadAssetMeta(GEN)).toBeNull();
    expect(await loadAssetMeta(GEN)).toBeNull();
    expect(calls.map((c) => c.url)).toEqual([`${GEN}.meta.json`]);
    expect(calls[0].init?.cache).toBe('no-cache');
    expect(peekAssetMeta(GEN)).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });
  test('a generated info file with fewer keys (v and grip) is read as it is', async () => {
    const meta = { v: 1 as const, grip: { kind: 'gun', point: [0, 0, 0], forward: [1, 0, 0], up: [0, 1, 0], lengthM: 0.8, review: 'low' } };
    answer(() => json(meta));
    expect(await loadAssetMeta(GEN)).toEqual(meta);
    expect(peekAssetMeta(GEN)).toEqual(meta);
  });
});

describe('loadAssetMeta', () => {
  test('asks only library and generated folder URLs, revalidating every load, once per URL', async () => {
    answer(() => json({ v: 1, tags: ['weapons melee'] }));
    expect(await loadAssetMeta('https://cdn.example.com/generated/sword.glb')).toBeNull();
    expect(calls).toHaveLength(0);
    expect(await loadAssetMeta(LIB)).toEqual({ v: 1, tags: ['weapons melee'] });
    await loadAssetMeta(LIB);
    expect(calls).toHaveLength(1);
    expect(calls[0].init?.cache).toBe('no-cache');
  });
  test('404, network / CORS error, bad JSON, another v: no info, no warning', async () => {
    for (const r of [
      () => json('not found', 404),
      () => Promise.reject(new TypeError('Failed to fetch')),
      () => json('{oops'),
      () => json({ v: 2, grip: {} }),
      () => json([1]),
    ]) {
      resetAssetMeta();
      answer(r);
      expect(await loadAssetMeta(LIB)).toBeNull();
    }
    expect(warn).not.toHaveBeenCalled();
  });
  test('slower than the time limit: no info, one warning', async () => {
    // the time limit by hand, not by the wall clock: the timer's callback is kept and fired here
    const realSet = globalThis.setTimeout,
      realClear = globalThis.clearTimeout;
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
    expect(metaUrlOf('https://agent8-games.verse8.io/assets/3D/Objects/3D/Sword.glb')).toBe(
      'https://agent8-games.verse8.io/assets/3d/Objects/3D/Sword.glb.meta.json',
    );
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

describe('subscribers hear when an answer is stored', () => {
  test('first request fails in passing, a later one succeeds: the subscriber is told and reads the new value', async () => {
    let told = 0;
    const off = subscribeAssetMeta(() => told++);
    answer(() => Promise.reject(new TypeError('Failed to fetch')));
    expect(await loadAssetMeta(LIB)).toBeNull(); // what a character got on its first render
    expect(told).toBe(0); // nothing stored: still unknown
    expect(peekAssetMeta(LIB)).toBeUndefined();
    answer(() => json({ v: 1, grip: { kind: 'gun' } }));
    await loadAssetMeta(LIB); // someone else asks again (the held weapon, on its mount)
    expect(told).toBe(1);
    expect(peekAssetMeta(LIB)).toEqual({ v: 1, grip: { kind: 'gun' } });
    off();
    await loadAssetMeta(LIB.replace('sword', 'axe'));
    expect(told).toBe(1); // unsubscribed
  });
  test('a stored "no info" (404) is an answer too', async () => {
    let told = 0;
    subscribeAssetMeta(() => told++);
    answer(() => json('not found', 404));
    await loadAssetMeta(LIB);
    expect(told).toBe(1);
    expect(peekAssetMeta(LIB)).toBeNull();
  });
});

describe('every reader uses the stored answer once there is one', () => {
  test('a reader whose own request failed in passing gets the file a later request stored', async () => {
    answer(() => Promise.reject(new TypeError('Failed to fetch')));
    const first = await loadAssetMeta(LIB); // the held weapon's own request, kept for its mount
    expect(first).toBeNull();
    expect(latestAssetMeta(LIB, first)).toBeNull(); // nothing stored yet: what it got
    answer(() => json({ v: 1, grip: { kind: 'gun' } }));
    await loadAssetMeta(LIB); // another character mounts and asks again
    expect(latestAssetMeta(LIB, first)).toEqual({ v: 1, grip: { kind: 'gun' } });
  });
  test('a stored "no info" stays no info; a URL that has no info file is null without a request', async () => {
    answer(() => json('not found', 404));
    const first = await loadAssetMeta(LIB);
    expect(latestAssetMeta(LIB, first)).toBeNull();
    expect(latestAssetMeta('https://cdn.example.com/generated/sword.glb', null)).toBeNull();
    expect(calls).toHaveLength(1);
  });
});
