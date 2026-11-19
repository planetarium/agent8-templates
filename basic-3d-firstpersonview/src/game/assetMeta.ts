// Asset info files. A library asset has `<asset url path>.meta.json` next to it on the CDN: the
// metadata the library sync stores for that file, plus `v: 1` (agent8-library contract). Read it
// by the asset URL at runtime; never copy its values into assets.json or code.
// - Only URLs under META_PREFIXES are asked; any other URL (generated assets, other hosts) is
//   "no info" without a request.
// - Always revalidated (`cache: 'no-cache'`): a fixed value reaches the game on the next load.
// - 404 / CORS / network error / bad JSON / another `v` = "no info" (null), silently. A request
//   slower than META_TIMEOUT_MS is "no info" too, with one console warning.
// - Unknown keys are kept and ignored (keys are only ever added; `v` stays 1).
import { use, useEffect, useState } from 'react';

export type AssetMeta = { v: 1; tags?: string[]; [key: string]: unknown };

/** URL prefixes that have info files. */
export const META_PREFIXES = ['https://agent8-games.verse8.io/assets/'];
export const META_TIMEOUT_MS = 4000;

/** The info file URL of an asset (path + `.meta.json`, query / hash dropped), or null when its URL has none. */
export function metaUrlOf(assetUrl: string): string | null {
  let u: URL;
  try {
    u = new URL(assetUrl);
  } catch {
    return null;
  }
  const base = u.origin + u.pathname;
  if (!META_PREFIXES.some((p) => base.startsWith(p))) return null;
  return `${base}.meta.json`;
}

const cache = new Map<string, Promise<AssetMeta | null>>();
/** Results that have arrived, by info file URL. */
const settled = new Map<string, AssetMeta | null>();
// one shared promise: React's `use` reads a settled promise it has seen before without suspending again
const NONE: Promise<AssetMeta | null> = Promise.resolve(null);
let warnedSlow = false;

function parse(j: unknown): AssetMeta | null {
  if (!j || typeof j !== 'object' || Array.isArray(j) || (j as { v?: unknown }).v !== 1) return null;
  const tags = (j as { tags?: unknown }).tags;
  if (tags !== undefined && !(Array.isArray(tags) && tags.every((t) => typeof t === 'string'))) return { ...(j as AssetMeta), tags: undefined };
  return j as AssetMeta;
}

/** The info file of an asset, read once per page load per URL. Resolves to null when there is none. */
export function loadAssetMeta(assetUrl: string, timeoutMs = META_TIMEOUT_MS): Promise<AssetMeta | null> {
  const url = metaUrlOf(assetUrl);
  if (!url) return NONE;
  let p = cache.get(url);
  if (!p) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    p = fetch(url, { cache: 'no-cache', signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then(parse)
      .catch(() => {
        if (ctrl.signal.aborted && !warnedSlow) {
          warnedSlow = true;
          console.warn(`asset info file took over ${timeoutMs} ms, going on without it: ${url}`);
        }
        return null;
      })
      .finally(() => clearTimeout(timer))
      .then((m) => {
        settled.set(url, m);
        return m;
      });
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

/** React: suspends (like useGLTF) until the info file is read; null when there is none. */
export function useAssetMeta(assetUrl: string): AssetMeta | null {
  return use(loadAssetMeta(assetUrl));
}

/**
 * React, without suspending: null until the info file arrives, then re-renders with it. For
 * choices that must not hold up the first frame (which clips a character plays).
 */
export function useAssetMetaWhenRead(assetUrl: string | undefined): AssetMeta | null {
  const [, arrived] = useState(0);
  const now = assetUrl ? peekAssetMeta(assetUrl) : null;
  useEffect(() => {
    if (!assetUrl || now !== undefined) return;
    let live = true;
    loadAssetMeta(assetUrl).then(() => live && arrived((n) => n + 1));
    return () => {
      live = false;
    };
  }, [assetUrl, now]);
  return now ?? null;
}

/** Tests only: forget what was read. */
export function resetAssetMeta() {
  cache.clear();
  settled.clear();
  warnedSlow = false;
}
