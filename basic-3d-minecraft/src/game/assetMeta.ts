// Asset info files. An asset can have `<asset url path>.meta.json` next to it on the CDN: for a
// library asset the metadata the library sync stores for that file, plus `v: 1`; for a generated
// asset the same format with fewer keys (agent8-library contract). Read it by the asset URL at
// runtime; never copy its values into assets.json or code.
// - Only URLs on META_HOST under the library folder (`/assets/`) or a generated folder
//   (`/{wallet}/mcp-uploads/`, `{wallet}` = exactly one path segment) are asked; any other URL
//   (other hosts, other folders) is "no info" without a request. Nothing below those two
//   prefixes (folder or file names) is looked at. Most generated assets have no info file: 404.
// - Always revalidated (`cache: 'no-cache'`): a fixed value reaches the game on the next load.
// - 404 / CORS / network error / bad JSON / another `v` = "no info" (null), silently. A request
//   slower than META_TIMEOUT_MS is "no info" too, with one console warning.
// - An answer (the file, 404, bad JSON, another `v`) is kept for the page's life. A failure that
//   may pass (network error, time limit, 5xx) is "no info" for whoever asked, and forgotten: the
//   next component that mounts asks again.
// - Library info files live under lower-case `/assets/3d/` only; old `/assets/3D/` asset URLs (still
//   served, and what search returned before 2026-11-18) are asked there.
// - Unknown keys are kept and ignored (keys are only ever added; `v` stays 1).
import { useEffect, useSyncExternalStore } from 'react';

export type AssetMeta = { v: 1; tags?: string[]; [key: string]: unknown };

/** The host whose assets have info files. */
export const META_HOST = 'https://agent8-games.verse8.io';
/** The library folder: every registered asset has an info file. */
const LIBRARY = '/assets/';
/** A generated folder: any one path segment (the user's wallet address), then `mcp-uploads/`. */
const GENERATED = /^\/[^/]+\/mcp-uploads\/./;
export const META_TIMEOUT_MS = 4000;

/** The info file URL of an asset (path + `.meta.json`, query / hash dropped), or null when its URL has none. */
export function metaUrlOf(assetUrl: string): string | null {
  let u: URL;
  try {
    u = new URL(assetUrl);
  } catch {
    return null;
  }
  if (u.origin !== META_HOST) return null;
  const path = u.pathname;
  if (path.startsWith(LIBRARY)) {
    const rest = path.slice(LIBRARY.length);
    return `${META_HOST}${LIBRARY}${rest.startsWith('3D/') ? `3d/${rest.slice(3)}` : rest}.meta.json`;
  }
  // generated folders keep their path as it is (the 3D → 3d rule is the library's)
  return GENERATED.test(path) ? `${META_HOST}${path}.meta.json` : null;
}

const cache = new Map<string, Promise<AssetMeta | null>>();
/** Results that have arrived, by info file URL. */
const settled = new Map<string, AssetMeta | null>();
/** Told whenever an answer is stored in `settled` (subscribeAssetMeta). */
const listeners = new Set<() => void>();
// one shared promise: React's `use` reads a settled promise it has seen before without suspending again
const NONE: Promise<AssetMeta | null> = Promise.resolve(null);
let warnedSlow = false;

function parse(j: unknown): AssetMeta | null {
  if (!j || typeof j !== 'object' || Array.isArray(j) || (j as { v?: unknown }).v !== 1) return null;
  const tags = (j as { tags?: unknown }).tags;
  if (tags !== undefined && !(Array.isArray(tags) && tags.every((t) => typeof t === 'string'))) return { ...(j as AssetMeta), tags: undefined };
  return j as AssetMeta;
}

/** A failure that may pass: the request is forgotten so a later mount asks again. */
const RETRY: unique symbol = Symbol('retry');

/**
 * The info file of an asset, read once per page load per URL. Resolves to null when there is
 * none. After a network error, the time limit or a 5xx it resolves to null too, but the next call
 * asks again — so keep the promise you got (a parent's useMemo) instead of calling this on every
 * render of a component that suspends on it.
 */
export function loadAssetMeta(assetUrl: string, timeoutMs = META_TIMEOUT_MS): Promise<AssetMeta | null> {
  const url = metaUrlOf(assetUrl);
  if (!url) return NONE;
  let p = cache.get(url);
  if (!p) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const asked: Promise<AssetMeta | null> = fetch(url, { cache: 'no-cache', signal: ctrl.signal })
      .then<string | typeof RETRY | null>((r) => (r.ok ? r.text() : r.status >= 500 ? RETRY : null))
      .catch((): typeof RETRY => {
        if (ctrl.signal.aborted && !warnedSlow) {
          warnedSlow = true;
          console.warn(`asset info file took over ${timeoutMs} ms, going on without it: ${url}`);
        }
        return RETRY;
      })
      .finally(() => clearTimeout(timer))
      .then((body) => {
        if (body === RETRY) {
          if (cache.get(url) === asked) cache.delete(url);
          return null;
        }
        let m: AssetMeta | null = null;
        try {
          m = typeof body === 'string' ? parse(JSON.parse(body)) : null;
        } catch {
          // bad JSON: no info
        }
        settled.set(url, m);
        for (const fn of [...listeners]) fn();
        return m;
      });
    p = asked;
    cache.set(url, p);
  }
  return p;
}

/** The info file if it has already been read: the value, null for "no info", undefined while it is still on its way (or never asked). */
export function peekAssetMeta(assetUrl: string): AssetMeta | null | undefined {
  const url = metaUrlOf(assetUrl);
  if (!url) return null;
  return settled.get(url);
}

/**
 * Calls `fn` whenever an info file's answer is stored (any URL — read yours with peekAssetMeta).
 * Whoever asked: a request another component made later counts too. Returns the unsubscribe.
 */
export function subscribeAssetMeta(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * What a component that already got `first` from its own request should use now: the stored
 * answer once there is one (its own, or a later request by anyone that succeeded after its own
 * failed in passing), else what it got.
 */
export function latestAssetMeta(assetUrl: string, first: AssetMeta | null): AssetMeta | null {
  const stored = peekAssetMeta(assetUrl);
  return stored === undefined ? first : stored;
}

/**
 * React: the stored answer for an asset (null while there is none), re-rendering when one is
 * stored. It asks nothing itself — every reader of info files goes through this, so all of them
 * see an answer the moment any of them gets it.
 */
export function useStoredAssetMeta(assetUrl: string | undefined): AssetMeta | null {
  const read = () => (assetUrl ? (peekAssetMeta(assetUrl) ?? null) : null);
  return useSyncExternalStore(subscribeAssetMeta, read, read);
}

/**
 * React, without suspending: null until the info file arrives, then re-renders with it. For
 * choices that must not hold up the first frame (which clips a character plays). It asks once per
 * mount; after a failure that may pass it stays null until an answer is stored — by the next
 * mount, or by another component asking again (the held weapon does) — and then re-renders.
 */
export function useAssetMetaWhenRead(assetUrl: string | undefined): AssetMeta | null {
  const meta = useStoredAssetMeta(assetUrl);
  useEffect(() => {
    if (assetUrl && peekAssetMeta(assetUrl) === undefined) void loadAssetMeta(assetUrl);
  }, [assetUrl]);
  return meta;
}

/** Tests only: forget what was read (and who listens). */
export function resetAssetMeta() {
  cache.clear();
  settled.clear();
  listeners.clear();
  warnedSlow = false;
}
