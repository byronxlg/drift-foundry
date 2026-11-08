// Drift Foundry builder: the spatial layer. Pure, no DOM. Used by src/build.js and sim/balance.mjs.
//
// The economy in game.js stays the source of truth. This module owns the map (nodes, placed
// buildings, belts, power poles) and, after every change, writes the effective building counts
// into s.built: a building counts only when it is on the Hub network and, if it draws power,
// inside power reach. s.placed holds what is on the map, which is what costs grow with.
import * as G from './game.js';

export const N = 64; // map is N x N tiles
export const C = 32; // hub centre tile
export const HUB = [];
for (let y = C - 1; y <= C + 1; y++) for (let x = C - 1; x <= C + 1; x++) HUB.push(y * N + x);
// Radius of rock surveyed, by segment being built (index = s.phase). The rock opens as segments close.
export const REVEAL = [9.5, 14.5, 20.5, 26.5, 31.5, 31.5];
export const revealR = (s) => REVEAL[Math.min(s.phase, REVEAL.length - 1)];
export const ITEM_OF = ['', 'ore', 'coal', 'stone', 'quartz'];
export const EXTRACTS = { drill: 'ore', coaldrill: 'coal', quarry: 'stone', quartzdrill: 'quartz' };
// Power reach in tiles (centre to centre). The Hub's own reactor covers the first ore field.
export const REACH = { hub: 7.5, burner: 4.5, turbine: 6.5, solar: 5.5, pole: 5.5 };
export const POLE = { name: 'Power pole', phase: 2, cost: {} }; // poles are free: reach is the constraint, not price
export const REFUND = 0.5;

const xy = (i) => [i % N, (i / N) | 0];
export const dist = (i) => { const [x, y] = xy(i); return Math.hypot(x - C, y - C); };
const dij = (a, b) => { const [ax, ay] = xy(a); const [bx, by] = xy(b); return Math.hypot(ax - bx, ay - by); };
export const isHub = (i) => HUB.includes(i);
function nb4(i) {
  const x = i % N; const y = (i / N) | 0; const out = [];
  if (x > 0) out.push(i - 1); if (x < N - 1) out.push(i + 1);
  if (y > 0) out.push(i - N); if (y < N - 1) out.push(i + N);
  return out;
}
export const neighbours = nb4;

// ---------- the rock: resource nodes, deterministic from the seed ----------
// [phase they appear in, item code, tiles, min distance, max distance]
const PATCHES = [
  [1, 1, 7, 3, 6.6], [1, 1, 7, 3, 6.6], [1, 1, 7, 3, 6.6],
  [2, 1, 8, 10, 13.8], [2, 1, 8, 10, 13.8], [2, 2, 7, 10, 13.8], [2, 2, 7, 10, 13.8],
  [3, 3, 7, 15, 19.8], [3, 3, 7, 15, 19.8], [3, 3, 7, 15, 19.8], [3, 1, 8, 15, 19.8], [3, 1, 8, 15, 19.8], [3, 2, 6, 15, 19.8],
  [4, 4, 6, 21, 25.8], [4, 4, 6, 21, 25.8], [4, 4, 6, 21, 25.8], [4, 1, 7, 21, 25.8],
  [5, 1, 8, 27, 30.8], [5, 2, 7, 27, 30.8], [5, 4, 6, 27, 30.8], [5, 3, 7, 27, 30.8],
];
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const nodeCache = new Map();
export function nodes(seed) {
  if (nodeCache.has(seed)) return nodeCache.get(seed);
  const r = rng(seed);
  const grid = new Int8Array(N * N);
  const owner = new Int16Array(N * N).fill(-1);
  const groups = {};
  PATCHES.forEach((p, k) => { (groups[p[3]] ||= []).push(k); });
  for (const ks of Object.values(groups)) {
    const base = r() * Math.PI * 2;
    ks.forEach((k, j) => {
      const [, item, n, dmin, dmax] = PATCHES[k];
      const ok = (i) => { const d = dist(i); if (d < dmin || d > dmax || grid[i] || isHub(i)) return false;
        const x = i % N; const y = (i / N) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const o = (y + dy) * N + x + dx; if (owner[o] >= 0 && owner[o] !== k) return false; }
        return true; };
      for (let attempt = 0; attempt < 12; attempt++) {
        const a = base + (j / ks.length) * Math.PI * 2 + (r() - 0.5) * 0.5 + attempt * 0.37;
        const d = (dmin + dmax) / 2;
        const start = Math.round(C + Math.sin(a) * d) * N + Math.round(C + Math.cos(a) * d);
        if (!ok(start)) continue;
        const blob = [start]; owner[start] = k; grid[start] = item;
        for (let tries = 0; blob.length < n && tries < 200; tries++) {
          const from = blob[(r() * blob.length) | 0]; const cand = nb4(from)[(r() * 4) | 0];
          if (cand !== undefined && ok(cand)) { blob.push(cand); owner[cand] = k; grid[cand] = item; }
        }
        break;
      }
    });
  }
  nodeCache.set(seed, grid);
  return grid;
}

// ---------- world state ----------
export function newWorld(seed = (Math.random() * 2 ** 31) | 0) {
  return { v: 1, seed, items: [], belts: [], poles: [] };
}
export function loadWorld(raw) {
  if (!raw || raw.v !== 1 || !Number.isInteger(raw.seed) || !Array.isArray(raw.items)) throw new Error('bad world');
  const w = newWorld(raw.seed);
  const used = new Set(HUB);
  const okI = (i) => Number.isInteger(i) && i >= 0 && i < N * N && !used.has(i);
  for (const it of raw.items) if (it && G.BUILDINGS[it.b] && okI(it.i)) { used.add(it.i); w.items.push({ b: it.b, i: it.i, off: !!it.off }); }
  for (const i of raw.belts || []) if (okI(i)) { used.add(i); w.belts.push(i); }
  for (const i of raw.poles || []) if (okI(i)) { used.add(i); w.poles.push(i); }
  return w;
}

const hide = (s, k, v) => Object.defineProperty(s, k, { value: v, enumerable: false, writable: true, configurable: true });
export const derived = (s) => s._w;

// Rebuild everything derived from the map: occupancy, the Hub network, power reach, counts.
export function recompute(s) {
  const w = s.world; const grid = nodes(w.seed);
  const occ = new Int32Array(N * N).fill(-1); // -1 free, -2 hub, -3 belt, -4 pole, >=0 item index
  for (const i of HUB) occ[i] = -2;
  for (const i of w.belts) occ[i] = -3;
  for (const i of w.poles) occ[i] = -4;
  w.items.forEach((it, k) => { occ[it.i] = k; });
  // the Hub network: belts and touching machines, flooded from the Hub
  const conn = new Uint8Array(N * N); const hubDist = new Int32Array(N * N).fill(-1);
  const q = [...HUB]; for (const i of HUB) { conn[i] = 1; hubDist[i] = 0; }
  for (let h = 0; h < q.length; h++) {
    const i = q[h];
    for (const j of nb4(i)) if (!conn[j] && (occ[j] === -3 || occ[j] >= 0)) { conn[j] = 1; hubDist[j] = hubDist[i] + 1; q.push(j); }
  }
  // belt flow: each belt points at its neighbour nearest the Hub
  const next = new Int32Array(N * N).fill(-1);
  for (const i of w.belts) {
    if (!conn[i]) continue;
    let best = -1;
    for (const j of nb4(i)) if (conn[j] && (occ[j] === -3 || occ[j] === -2) && hubDist[j] < hubDist[i] && (best < 0 || hubDist[j] < hubDist[best])) best = j;
    if (best < 0) for (const j of nb4(i)) if (conn[j] && hubDist[j] < hubDist[i]) best = j;
    next[i] = best;
  }
  // power: Hub, connected generators, then poles chained from anything live
  const sources = [{ i: C * N + C, r: REACH.hub, kind: 'hub' }];
  w.items.forEach((it) => { if (G.BUILDINGS[it.b].gen && conn[it.i] && !it.off) sources.push({ i: it.i, r: REACH[it.b] || 4.5, kind: it.b }); });
  const live = new Set(); let grew = true;
  while (grew) {
    grew = false;
    for (const p of w.poles) if (!live.has(p) && sources.some((src) => dij(src.i, p) <= src.r)) { live.add(p); sources.push({ i: p, r: REACH.pole, kind: 'pole' }); grew = true; }
  }
  const cov = new Uint8Array(N * N);
  for (const src of sources) {
    const [sx, sy] = xy(src.i); const R = Math.floor(src.r);
    for (let y = Math.max(0, sy - R); y <= Math.min(N - 1, sy + R); y++) for (let x = Math.max(0, sx - R); x <= Math.min(N - 1, sx + R); x++) if (Math.hypot(x - sx, y - sy) <= src.r) cov[y * N + x] = 1;
  }
  const placed = {}; for (const b in G.BUILDINGS) { placed[b] = 0; s.built[b] = 0; }
  for (const it of w.items) {
    placed[it.b]++;
    const B = G.BUILDINGS[it.b];
    it.st = it.off ? 'off' : !conn[it.i] ? 'unlinked' : (B.power && !cov[it.i]) ? 'nopower' : 'on';
    if (it.st === 'on') s.built[it.b]++;
  }
  s.off = {};
  hide(s, 'placed', placed);
  hide(s, '_w', { grid, occ, conn, hubDist, next, cov, sources, live, R: revealR(s) });
  return s._w;
}

export const revealed = (s, i) => dist(i) <= revealR(s);
export const nodeAt = (s, i) => ITEM_OF[nodes(s.world.seed)[i]] || '';
export const isPoleUnlocked = (s) => G.unlockedPhase(s) >= POLE.phase;

// Why b cannot go on tile i, or '' if it can (cost is checked separately).
export function whyNot(s, b, i) {
  const d = s._w;
  if (i < 0 || i >= N * N || !revealed(s, i)) return 'Not surveyed yet. The rock opens as the ring grows.';
  if (d.occ[i] !== -1) return d.occ[i] === -2 ? 'That is the Hub.' : 'Something is already there.';
  const node = nodeAt(s, i);
  if (b === 'pole') return node ? 'Keep nodes for drills.' : '';
  if (EXTRACTS[b] && node !== EXTRACTS[b]) return `${G.BUILDINGS[b].name} goes on ${EXTRACTS[b] === 'ore' ? 'an' : 'a'} ${G.ITEMS[EXTRACTS[b]].name.toLowerCase()} node.`;
  if (!EXTRACTS[b] && node) return 'Keep nodes for drills.';
  return '';
}
export function shortOf(s, cost) {
  const k = Object.keys(cost).find((x) => s.stock[x] < cost[x]);
  return k ? `Short of ${G.ITEMS[k].name.toLowerCase()}: ${G.fmt(s.stock[k])} of ${G.fmt(cost[k])}.` : '';
}
const pay = (s, cost) => { for (const [k, v] of Object.entries(cost)) s.stock[k] -= v; };

export function place(s, b, i) {
  if (b !== 'pole' && !G.isBuildingUnlocked(s, b)) return { ok: false, why: 'Not unlocked yet.' };
  if (b === 'pole' && !isPoleUnlocked(s)) return { ok: false, why: 'Power poles open with the Spine.' };
  const why = whyNot(s, b, i); if (why) return { ok: false, why };
  const cost = b === 'pole' ? POLE.cost : G.buildingCost(s, b);
  if (!G.canAfford(s, cost)) return { ok: false, why: shortOf(s, cost) };
  pay(s, cost);
  if (b === 'pole') s.world.poles.push(i); else s.world.items.push({ b, i, off: false });
  recompute(s);
  return { ok: true };
}

// Lay belts on every free surveyed tile of a path. Belts are free.
export function placeBelts(s, path) {
  let n = 0;
  for (const i of path) if (revealed(s, i) && s._w.occ[i] === -1 && !s._w.grid[i]) { s.world.belts.push(i); s._w.occ[i] = -3; n++; }
  if (n) recompute(s);
  return n;
}

export function refundOf(s, b) {
  const n = s.placed[b] - 1; const out = {};
  for (const [k, v] of Object.entries(G.BUILDINGS[b].cost)) out[k] = Math.floor(v * G.COST_GROWTH ** Math.max(0, n) * REFUND);
  return out;
}

export function demolish(s, i) {
  const o = s._w.occ[i]; const w = s.world;
  if (o === -3) w.belts.splice(w.belts.indexOf(i), 1);
  else if (o === -4) w.poles.splice(w.poles.indexOf(i), 1);
  else if (o >= 0) { const b = w.items[o].b; const back = refundOf(s, b); for (const k in back) s.stock[k] += back[k]; w.items.splice(o, 1); }
  else return false;
  recompute(s);
  return true;
}

export function setOff(s, i, off) { const o = s._w.occ[i]; if (o >= 0) { s.world.items[o].off = off; recompute(s); } }

// ---------- auto layout: used by the balance bot, by ?demo= seeds and to lay out an old save ----------
// Picks the cheapest valid tile for b: on the network and in power reach if possible, otherwise the
// nearest one, then lays the belt and the poles that make it count. Returns the tile or -1.
export function autoPlace(s, b, { free = false } = {}) {
  const d = s._w; const R = revealR(s);
  // distance from the network over free, node-less, surveyed tiles
  const dnet = new Int32Array(N * N).fill(-1); const pred = new Int32Array(N * N).fill(-1); const q = [];
  for (let i = 0; i < N * N; i++) if (d.conn[i]) { dnet[i] = 0; q.push(i); }
  for (let h = 0; h < q.length; h++) {
    const i = q[h];
    for (const j of nb4(i)) if (dnet[j] < 0 && d.occ[j] === -1 && !d.grid[j] && dist(j) <= R) { dnet[j] = dnet[i] + 1; pred[j] = i; q.push(j); }
  }
  const B = G.BUILDINGS[b];
  let best = -1; let bestScore = Infinity; let via = -1;
  for (let i = 0; i < N * N; i++) {
    if (whyNot(s, b, i)) continue;
    let link = Infinity; let from = -1;
    for (const j of nb4(i)) if (dnet[j] >= 0 && dnet[j] < link) { link = dnet[j]; from = j; }
    if (from < 0) continue;
    let score = link * 2;
    if (B.power && !d.cov[i]) score += 6 + 3 * Math.min(...d.sources.map((src) => Math.max(0, dij(src.i, i) - src.r)));
    if (B.gen) score += d.cov[i] ? 3 : 0; // generators push the grid outward
    score += dist(i) * 0.05;
    if (score < bestScore) { bestScore = score; best = i; via = from; }
  }
  if (best < 0) return -1;
  if (!free) pay(s, G.buildingCost(s, b));
  s.world.items.push({ b, i: best, off: false });
  const path = [];
  for (let j = via; j >= 0 && dnet[j] > 0; j = pred[j]) path.push(j);
  for (const j of path) s.world.belts.push(j);
  recompute(s);
  if (B.power && !s._w.cov[best]) powerTo(s, best, free);
  return best;
}

function powerTo(s, target, free) {
  for (let step = 0; step < 10 && !s._w.cov[target]; step++) {
    if (!free && (!isPoleUnlocked(s) || !G.canAfford(s, POLE.cost))) return;
    const d = s._w;
    const src = d.sources.reduce((a, c) => (dij(c.i, target) - c.r < dij(a.i, target) - a.r ? c : a));
    let best = -1; let bd = Infinity;
    const [sx, sy] = xy(src.i); const Rr = Math.floor(src.r);
    for (let y = Math.max(0, sy - Rr); y <= Math.min(N - 1, sy + Rr); y++) for (let x = Math.max(0, sx - Rr); x <= Math.min(N - 1, sx + Rr); x++) {
      const i = y * N + x;
      if (dij(i, src.i) > src.r || whyNot(s, 'pole', i)) continue;
      const dd = dij(i, target); if (dd < bd) { bd = dd; best = i; }
    }
    if (best < 0) return;
    if (!free) pay(s, POLE.cost);
    s.world.poles.push(best); recompute(s);
  }
}

// Build b the way the bot does: afford, auto-place. Mirrors G.build for the builder.
export function autoBuild(s, b) {
  if (!G.isBuildingUnlocked(s, b) || !G.canAfford(s, G.buildingCost(s, b))) return false;
  return autoPlace(s, b) >= 0;
}

// Lay out counts (from an old list-mode save or a demo seed) on a fresh map, free of charge.
export function layOut(s, counts, seed) {
  s.world = newWorld(seed); recompute(s);
  const order = G.BUILD_ORDER.filter((b) => counts[b]);
  let left = true;
  while (left) {
    left = false;
    for (const b of order) if (s.placed[b] < counts[b]) { if (autoPlace(s, b, { free: true }) >= 0) left = true; }
  }
  return s;
}

// Power any placed machine left outside reach (the bot calls this each check; poles cost ingot).
export function repair(s) {
  for (const it of s.world.items) if (it.st === 'nopower') powerTo(s, it.i, false);
}
