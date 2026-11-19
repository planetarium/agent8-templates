// Shape-only grip estimate: the fallback for a weapon whose asset info file has no grip.
// Right for about a third of the library's weapons on every count (grip point within 3 cm,
// forward within 10°, up within 15°) and for two thirds on direction alone — the info file wins.
// Canonical weapon frame: grip point = origin, +Z = muzzle / tip / head,
// +Y = up (gun: sights side; melee: the edge / striking face), +X = Y × Z.
// Input: triangles in the authored space of the GLB scene (node transforms applied).
import * as THREE from 'three';

export type Kind = 'gun' | 'melee';
export type Vec = [number, number, number];

export type Estimate = {
  fwd: Vec; // canonical +Z in authored space (unit)
  up: Vec; // canonical +Y in authored space (unit)
  grip: Vec; // authored space
  length: number; // extent along fwd, authored units
};

const V = (a: Vec) => new THREE.Vector3(...a);
const A = (v: THREE.Vector3): Vec => [v.x, v.y, v.z];

/** Deterministic area-weighted surface samples. */
export function sampleSurface(pos: Float32Array, n = 24000): Float32Array {
  const tris = pos.length / 9;
  const cum = new Float64Array(tris);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let total = 0;
  for (let i = 0; i < tris; i++) {
    a.fromArray(pos, i * 9); b.fromArray(pos, i * 9 + 3); c.fromArray(pos, i * 9 + 6);
    total += b.sub(a).cross(c.sub(a)).length() / 2;
    cum[i] = total;
  }
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  const out = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) {
    const r = rnd() * total;
    let lo = 0, hi = tris - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < r) lo = m + 1; else hi = m; }
    let u = rnd(), v = rnd();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    for (let d = 0; d < 3; d++) {
      const p0 = pos[lo * 9 + d], p1 = pos[lo * 9 + 3 + d], p2 = pos[lo * 9 + 6 + d];
      out[k * 3 + d] = p0 + u * (p1 - p0) + v * (p2 - p0);
    }
  }
  return out;
}

function extent(pts: Float32Array, d: THREE.Vector3) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < pts.length; i += 3) {
    const s = pts[i] * d.x + pts[i + 1] * d.y + pts[i + 2] * d.z;
    if (s < lo) lo = s; if (s > hi) hi = s;
  }
  return { lo, hi, len: hi - lo };
}

/** Eigenvectors of a symmetric 3×3 (Jacobi), sorted by eigenvalue desc. */
function eig3(m: number[][]): THREE.Vector3[] {
  const a = m.map((r) => r.slice());
  const v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let it = 0; it < 50; it++) {
    let p = 0, q = 1;
    for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) if (Math.abs(a[i][j]) > Math.abs(a[p][q])) { p = i; q = j; }
    if (Math.abs(a[p][q]) < 1e-12) break;
    const th = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]);
    const c = Math.cos(th), s = Math.sin(th);
    for (let k = 0; k < 3; k++) { const x = a[k][p], y = a[k][q]; a[k][p] = c * x - s * y; a[k][q] = s * x + c * y; }
    for (let k = 0; k < 3; k++) { const x = a[p][k], y = a[q][k]; a[p][k] = c * x - s * y; a[q][k] = s * x + c * y; }
    for (let k = 0; k < 3; k++) { const x = v[k][p], y = v[k][q]; v[k][p] = c * x - s * y; v[k][q] = s * x + c * y; }
  }
  const idx = [0, 1, 2].sort((i, j) => a[j][j] - a[i][i]);
  return idx.map((i) => new THREE.Vector3(v[0][i], v[1][i], v[2][i]).normalize());
}

function cov(pts: Float32Array, proj?: (p: THREE.Vector3) => THREE.Vector3) {
  const n = pts.length / 3;
  const mean = new THREE.Vector3();
  const p = new THREE.Vector3();
  const get = (i: number) => { p.fromArray(pts, i * 3); return proj ? proj(p) : p; };
  for (let i = 0; i < n; i++) mean.add(get(i));
  mean.divideScalar(n);
  const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < n; i++) {
    const d = get(i).clone().sub(mean).toArray();
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) m[r][c] += d[r] * d[c];
  }
  return m;
}

const AXES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];

/** Direction of max extent among authored axes and PCA axes; authored axes win within 3 %. */
function pickAxis(pts: Float32Array, cands: THREE.Vector3[], authored: THREE.Vector3[]) {
  let best = cands[0], bestLen = -1;
  for (const d of cands) { const l = extent(pts, d).len; if (l > bestLen) { bestLen = l; best = d; } }
  let a: THREE.Vector3 | null = null, aLen = -1;
  for (const d of authored) { const l = extent(pts, d).len; if (l > aLen) { aLen = l; a = d; } }
  return a && aLen >= 0.97 * bestLen ? { dir: a.clone(), snapped: true } : { dir: best.clone(), snapped: false };
}

type Prof = { lo: number; hi: number; n: number; tmin: number; tmax: number; wmin: number; wmax: number; tsum: number; wsum: number };

export function estimate(pos: Float32Array, kind: Kind): Estimate {
  const pts = sampleSurface(pos);
  const n = pts.length / 3;
  // 1. long axis
  const pca = eig3(cov(pts));
  const L = pickAxis(pts, pca, AXES);
  const l = L.dir;
  // 2. secondary axis: max extent in the plane ⟂ l
  const perp = (d: THREE.Vector3) => d.clone().addScaledVector(l, -d.dot(l));
  const pca2 = eig3(cov(pts, (p) => perp(p))).map(perp).filter((d) => d.length() > 0.5).map((d) => d.normalize());
  const auth2 = AXES.filter((d) => Math.abs(d.dot(l)) < 0.2).map((d) => perp(d).normalize());
  const H = pickAxis(pts, pca2.length ? pca2 : auth2, auth2);
  const h = H.dir;
  const w = new THREE.Vector3().crossVectors(l, h).normalize();
  h.crossVectors(w, l).normalize();

  const S = new Float32Array(n), T = new Float32Array(n), W = new Float32Array(n);
  const p = new THREE.Vector3();
  let smin = Infinity, smax = -Infinity, tmin = Infinity, tmax = -Infinity;
  for (let i = 0; i < n; i++) {
    p.fromArray(pts, i * 3);
    S[i] = p.dot(l); T[i] = p.dot(h); W[i] = p.dot(w);
    smin = Math.min(smin, S[i]); smax = Math.max(smax, S[i]);
    tmin = Math.min(tmin, T[i]); tmax = Math.max(tmax, T[i]);
  }
  const len = smax - smin;
  const height = tmax - tmin;
  const NB = 40;
  const bins: Prof[] = Array.from({ length: NB }, (_, k) => ({
    lo: smin + (len * k) / NB, hi: smin + (len * (k + 1)) / NB, n: 0,
    tmin: Infinity, tmax: -Infinity, wmin: Infinity, wmax: -Infinity, tsum: 0, wsum: 0,
  }));
  const binOf = (s: number) => Math.min(NB - 1, Math.max(0, Math.floor(((s - smin) / len) * NB)));
  for (let i = 0; i < n; i++) {
    const b = bins[binOf(S[i])];
    b.n++; b.tsum += T[i]; b.wsum += W[i];
    b.tmin = Math.min(b.tmin, T[i]); b.tmax = Math.max(b.tmax, T[i]);
    b.wmin = Math.min(b.wmin, W[i]); b.wmax = Math.max(b.wmax, W[i]);
  }
  // empty bins: copy the neighbour (thin gaps)
  for (let k = 0; k < NB; k++) if (!bins[k].n) {
    const nb = bins[k - 1]?.n ? bins[k - 1] : bins[k + 1];
    if (nb) Object.assign(bins[k], { tmin: nb.tmin, tmax: nb.tmax, wmin: nb.wmin, wmax: nb.wmax, tsum: (nb.tsum / Math.max(1, nb.n)), wsum: nb.wsum / Math.max(1, nb.n), n: 0 });
  }
  const tc = (b: Prof) => (b.n ? b.tsum / b.n : b.tsum);
  const wc = (b: Prof) => (b.n ? b.wsum / b.n : b.wsum);

  let fwdSign = 1, upSign = 1;
  let gripS = 0, gripT = 0, gripW = 0;

  if (kind === 'gun') {
    // muzzle = thinner end (barrel tip vs stock / grip)
    const E = Math.max(2, Math.round(NB * 0.12));
    const hgt = (b: Prof) => b.tmax - b.tmin;
    const endA = bins.slice(0, E).reduce((s, b) => s + hgt(b), 0) / E;
    const endB = bins.slice(NB - E).reduce((s, b) => s + hgt(b), 0) / E;
    fwdSign = endB < endA ? 1 : -1;
    // up = flatter side of the profile (grip / magazine / stock drop hang below)
    const mid = bins.slice(Math.round(NB * 0.1), Math.round(NB * 0.9));
    const sd = (xs: number[]) => { const m = xs.reduce((s, x) => s + x, 0) / xs.length; return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length); };
    const sdTop = sd(mid.map((b) => b.tmax)), sdBot = sd(mid.map((b) => b.tmin));
    upSign = sdTop <= sdBot ? 1 : -1;
    // work in "down depth": d = how far below the top a bin reaches (in up-signed t)
    const up = (t: number) => t * upSign;
    const ord = fwdSign > 0 ? bins : bins.slice().reverse(); // rear → front
    const bottoms = ord.map((b) => (upSign > 0 ? b.tmin : -b.tmax)); // lowest point, up-signed
    const sorted = bottoms.slice().sort((x, y) => x - y);
    const R = sorted[Math.floor(sorted.length * 0.5)]; // receiver bottom level (median)
    const top = Math.max(...ord.map((b) => up(upSign > 0 ? b.tmax : b.tmin)));
    const thr = R - 0.12 * height;
    const runs: [number, number][] = [];
    for (let k = 0; k < NB; k++) {
      if (bottoms[k] < thr) {
        if (runs.length && runs[runs.length - 1][1] === k - 1) runs[runs.length - 1][1] = k; else runs.push([k, k]);
      }
    }
    // runs are indexed rear (0) → front; a run touching the rear end with others present is the stock
    let cand = runs.filter((r) => !(r[0] === 0 && runs.length > 1));
    cand = cand.filter((r) => (r[0] + r[1]) / 2 < NB * 0.6);
    let pick: [number, number] | null = cand.length ? cand[0] : null; // rear-most remaining
    let wrist = false;
    if (!pick && runs.length && runs[0][0] === 0) { pick = [runs[0][1], Math.min(NB - 1, runs[0][1] + 1)]; wrist = true; }
    if (!pick) pick = [Math.round(NB * 0.25), Math.round(NB * 0.3)];
    const toBin = (k: number) => (fwdSign > 0 ? k : NB - 1 - k);
    const sLo = Math.min(bins[toBin(pick[0])].lo, bins[toBin(pick[1])].lo);
    const sHi = Math.max(bins[toBin(pick[0])].hi, bins[toBin(pick[1])].hi);
    const runBottom = Math.min(...bottoms.slice(pick[0], pick[1] + 1));
    const depth = R - runBottom;
    const bandHi = wrist ? top : R, bandLo = wrist ? R - depth * 0.5 : R - 0.45 * depth;
    let cs = 0, cw = 0, cn = 0;
    for (let i = 0; i < n; i++) {
      const u = up(T[i]);
      if (S[i] >= sLo && S[i] <= sHi && u <= bandHi && u >= bandLo) { cs += S[i]; cw += W[i]; cn++; }
    }
    gripS = cn ? cs / cn : (sLo + sHi) / 2;
    gripW = cn ? cw / cn : 0;
    gripT = (wrist ? (R + runBottom) / 2 + 0.25 * depth : R - 0.3 * depth) * upSign;
  } else {
    // width per bin (largest cross extent)
    const wid = bins.map((b) => Math.max(b.tmax - b.tmin, b.wmax - b.wmin));
    const maxW = Math.max(...wid);
    const kMax = wid.indexOf(maxW);
    const nearA = kMax < NB / 2; // max near the low end (bin 0)
    const short = nearA ? wid.slice(0, kMax) : wid.slice(kMax + 1).reverse(); // ordered from the end inward
    const shortLen = short.length / NB;
    const shortMean = short.length ? short.reduce((s, x) => s + x, 0) / short.length : 0;
    const endW = short.length ? short[0] : 0;
    const midW = short.length ? short[Math.floor(short.length / 2)] : 0;
    const tapers = endW < 0.5 * midW;
    const guard = shortLen >= 0.08 && shortLen <= 0.45 && shortMean < 0.4 * maxW && !tapers;
    const aspect = len / maxW;
    // +Z: guard type → away from the handle (the short side); head type → toward the head
    const towardHigh = guard ? nearA : !nearA;
    fwdSign = towardHigh ? 1 : -1;
    const butt = fwdSign > 0 ? smin : smax;
    if (guard) {
      const guardS = (bins[kMax].lo + bins[kMax].hi) / 2;
      gripS = (butt + guardS) / 2;
    } else {
      const frac = aspect > 8 && len > 3 * maxW ? 0.33 : 0.1;
      gripS = butt + fwdSign * frac * len;
    }
    const gb = bins[binOf(gripS)];
    gripT = tc(gb); gripW = wc(gb);
    // +Y: the edge = thinner side (in w) of the head / blade region
    const region = guard
      ? bins.filter((b) => (b.lo - (bins[kMax].lo)) * fwdSign > 0)
      : bins.filter((_, k) => Math.abs(k - kMax) <= NB * 0.1);
    let tLo = Infinity, tHi = -Infinity;
    for (const b of region) { tLo = Math.min(tLo, b.tmin); tHi = Math.max(tHi, b.tmax); }
    const rs = Math.min(...region.map((b) => b.lo)), re = Math.max(...region.map((b) => b.hi));
    const band = 0.15 * (tHi - tLo);
    const th = (pred: (t: number) => boolean) => {
      // mean thickness in w over bins, for samples in the band
      const per = new Map<number, [number, number]>();
      for (let i = 0; i < n; i++) if (S[i] >= rs && S[i] <= re && pred(T[i])) {
        const k = binOf(S[i]);
        const e = per.get(k) ?? [Infinity, -Infinity];
        per.set(k, [Math.min(e[0], W[i]), Math.max(e[1], W[i])]);
      }
      const v = [...per.values()].map(([a, b]) => b - a);
      return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
    };
    const thHi = th((t) => t > tHi - band), thLo = th((t) => t < tLo + band);
    const center = gripT;
    const reachHi = tHi - center, reachLo = center - tLo;
    // the thinner edge when the two sides differ clearly, else the side that reaches farther
    if (Math.abs(thHi - thLo) > 0.15 * Math.max(thHi, thLo)) upSign = thHi < thLo ? 1 : -1;
    else upSign = reachHi >= reachLo ? 1 : -1;
  }
  const fwd = l.clone().multiplyScalar(fwdSign);
  const upv = h.clone().multiplyScalar(upSign);
  const grip = l.clone().multiplyScalar(gripS).addScaledVector(h, gripT).addScaledVector(w, gripW);
  return { fwd: A(fwd), up: A(upv), grip: A(grip), length: len };
}

/** Matrix authored → canonical (grip origin, +Z fwd, +Y up), scaled to `meters` along fwd. */
export function canonMatrix(fwd: Vec, up: Vec, grip: Vec, scale: number): THREE.Matrix4 {
  const f = V(fwd).normalize();
  const u = V(up).addScaledVector(f, -V(up).dot(f)).normalize();
  const x = new THREE.Vector3().crossVectors(u, f);
  const rot = new THREE.Matrix4().makeBasis(x, u, f).transpose(); // rows x,u,f
  const m = new THREE.Matrix4().makeScale(scale, scale, scale).multiply(rot).multiply(new THREE.Matrix4().makeTranslation(-grip[0], -grip[1], -grip[2]));
  return m;
}
