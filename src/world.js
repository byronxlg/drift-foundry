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
export function newWorld(seed = (Math.random() * 2 ** 31) | 0, mode = '') {
  const w = { v: 1, seed, items: [], belts: [], poles: [] };
  if (mode === 'lines') { w.mode = 'lines'; w.lines = []; }
  return w;
}
export const isLines = (s) => !!(s.world && s.world.mode === 'lines');
export function loadWorld(raw) {
  if (!raw || raw.v !== 1 || !Number.isInteger(raw.seed) || !Array.isArray(raw.items)) throw new Error('bad world');
  const w = newWorld(raw.seed, raw.mode);
  const used = new Set(HUB);
  const okI = (i) => Number.isInteger(i) && i >= 0 && i < N * N && !used.has(i);
  const num = (o) => { const r = {}; for (const k in o || {}) if (G.ITEMS[k] && Number.isFinite(o[k]) && o[k] > 0) r[k] = o[k]; return r; };
  for (const it of raw.items) if (it && G.BUILDINGS[it.b] && okI(it.i)) {
    used.add(it.i); const o = { b: it.b, i: it.i, off: !!it.off };
    if (w.mode) { o.buf = num(it.buf); o.held = Number.isFinite(it.held) && it.held > 0 ? it.held : 0; }
    w.items.push(o);
  }
  if (!w.mode) for (const i of raw.belts || []) if (okI(i)) { used.add(i); w.belts.push(i); }
  for (const i of raw.poles || []) if (okI(i)) { used.add(i); w.poles.push(i); }
  if (w.mode) {
    const at = new Set(w.items.map((it) => it.i)); const seen = new Set();
    for (const l of raw.lines || []) if (l && at.has(l.a) && (at.has(l.b) || l.b === HUBT) && l.a !== l.b && !seen.has(l.a + ':' + l.b)) { seen.add(l.a + ':' + l.b); w.lines.push({ a: l.a, b: l.b }); }
  }
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
  const lines = isLines(s); const outs = new Map(); const ins = new Map();
  if (lines) for (const l of w.lines) { (outs.get(l.a) || outs.set(l.a, []).get(l.a)).push(l); (ins.get(l.b) || ins.set(l.b, []).get(l.b)).push(l); }
  for (const it of w.items) {
    placed[it.b]++;
    const B = G.BUILDINGS[it.b];
    if (lines) {
      it.buf ||= {}; it.held ||= 0;
      it.st = it.off ? 'off' : (B.power && !cov[it.i]) ? 'nopower' : 'on';
      const from = new Set((ins.get(it.i) || []).map((l) => outItem(w.items[occ[l.a]].b)));
      const miss = Object.keys(B.in).find((k) => !from.has(k));
      it.need = miss ? 'noin:' + miss : (outItem(it.b) && !(outs.get(it.i) || []).length) ? 'noout' : '';
    } else it.st = it.off ? 'off' : !conn[it.i] ? 'unlinked' : (B.power && !cov[it.i]) ? 'nopower' : 'on';
    if (it.st === 'on') s.built[it.b]++;
  }
  s.off = {};
  hide(s, 'placed', placed);
  const order = lines ? w.items.filter((it) => !G.BUILDINGS[it.b].gen).sort((a, b) => G.BUILD_ORDER.indexOf(a.b) - G.BUILD_ORDER.indexOf(b.b)) : null;
  hide(s, '_w', { grid, occ, conn, hubDist, next, cov, sources, live, R: revealR(s), outs, ins, order, gen: (s._w ? s._w.gen : 0) + 1, flow: lines ? flowTick : null });
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
  if (b === 'pole') s.world.poles.push(i); else s.world.items.push(isLines(s) ? { b, i, off: false, buf: {}, held: 0 } : { b, i, off: false });
  recompute(s);
  if (b !== 'pole' && isLines(s)) autoLink(s, i);
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
  else if (o >= 0) { const b = w.items[o].b; const back = refundOf(s, b); for (const k in back) s.stock[k] += back[k]; w.items.splice(o, 1); if (w.lines) w.lines = w.lines.filter((l) => l.a !== i && l.b !== i); }
  else return false;
  recompute(s);
  return true;
}

export function setOff(s, i, off) { const o = s._w.occ[i]; if (o >= 0) { s.world.items[o].off = off; recompute(s); } }

// ---------- auto layout: used by the balance bot, by ?demo= seeds and to lay out an old save ----------
// Picks the cheapest valid tile for b: on the network and in power reach if possible, otherwise the
// nearest one, then lays the belt and the poles that make it count. Returns the tile or -1.
export function autoPlace(s, b, { free = false } = {}) {
  if (isLines(s)) return autoPlaceLines(s, b, free);
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
export function layOut(s, counts, seed, mode = '') {
  s.world = newWorld(seed, mode); recompute(s);
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

// ---------- supply lines (piece 4, #19364885; docs/design.md "Supply lines") ----------
export const HUBT = C * N + C;
export const BUF = 6; // input buffer, in cycles of the recipe
export const HOLD = 4; // output a producer can hold when nothing takes it, in cycles
export const outItem = (b) => Object.keys(G.BUILDINGS[b].out)[0] || '';
const ST = new WeakMap(); // per machine and per line flow stats; not saved
export const stat = (o) => { let x = ST.get(o); if (!x) { x = { u: 0, get: {}, r: 0, m: 0 }; ST.set(o, x); } return x; };
const itemAt = (s, i) => { const o = s._w.occ[i]; return o >= 0 ? s.world.items[o] : null; };
export const want = (s, it, k) => G.speed(s, it.b) * (G.BUILDINGS[it.b].in[k] || 0) / G.BUILDINGS[it.b].time;
export const rateOut = (s, it) => { const B = G.BUILDINGS[it.b]; const k = outItem(it.b); return k ? G.speed(s, it.b) * B.out[k] / B.time : 0; };

// Why a line from tile a to tile b cannot be laid, or ''.
export function whyNotLink(s, a, b) {
  const A = itemAt(s, a);
  if (!A) return a >= 0 && s._w.occ[a] === -2 ? 'Lines end at the Hub: start at a machine.' : 'Start a line at a machine.';
  const k = outItem(A.b);
  if (!k) return `${G.BUILDINGS[A.b].name}s make power, not items.`;
  if (isHub(b)) b = HUBT;
  if (b === a) return 'That is the same machine.';
  const B = b === HUBT ? null : itemAt(s, b);
  if (b !== HUBT && !B) return 'Drop the line on a machine or the Hub.';
  if (B && !G.BUILDINGS[B.b].in[k]) return `${G.BUILDINGS[B.b].name}s do not use ${G.ITEMS[k].name.toLowerCase()}.`;
  if (s.world.lines.some((l) => l.a === a && l.b === b)) return 'Already linked.';
  return '';
}
export function link(s, a, b) {
  const why = whyNotLink(s, a, b); if (why) return { ok: false, why };
  s.world.lines.push({ a, b: isHub(b) ? HUBT : b }); recompute(s); return { ok: true };
}
export function unlink(s, l) { const k = s.world.lines.indexOf(l); if (k >= 0) { s.world.lines.splice(k, 1); recompute(s); } }

// Auto-link a just-placed machine: inputs from the nearest producers until they cover its want
// (at most two per input), output to the Hub (coal to the nearest generator, else the Hub).
export function autoLink(s, i) {
  const it = itemAt(s, i); if (!it) return;
  const B = G.BUILDINGS[it.b]; const w = s.world; let n = 0;
  for (const k of Object.keys(B.in)) {
    const need = want(s, it, k);
    const prods = w.items.filter((p) => outItem(p.b) === k).sort((p, q) => dij(p.i, i) - dij(q.i, i));
    let got = 0; let links = 0;
    for (const p of prods) {
      if (links >= 2 || got >= need) break;
      const machinesOut = (s._w.outs.get(p.i) || []).filter((l) => l.b !== HUBT).length;
      got += rateOut(s, p) / (machinesOut + 1);
      if (!whyNotLink(s, p.i, i)) { w.lines.push({ a: p.i, b: i }); links++; n++; recompute(s); }
    }
  }
  const k = outItem(it.b);
  if (k) {
    let to = HUBT;
    if (k === 'coal') { const gens = w.items.filter((g) => G.BUILDINGS[g.b].in.coal).sort((p, q) => ((s._w.ins.get(p.i) || []).length - (s._w.ins.get(q.i) || []).length) || dij(p.i, i) - dij(q.i, i)); if (gens.length) to = gens[0].i; }
    if (!whyNotLink(s, i, to)) { w.lines.push({ a: i, b: to }); n++; recompute(s); }
    // and the nearest machine that has no line of this item, else the hungriest one
    const inOf = (u, x) => (s._w.ins.get(u.i) || []).filter((l) => itemAt(s, l.a) && outItem(itemAt(s, l.a).b) === x).length;
    const users = w.items.filter((u) => G.BUILDINGS[u.b].in[k] && !whyNotLink(s, i, u.i));
    const hungry = users.filter((u) => u.need === 'noin:' + k).sort((p, q) => dij(p.i, i) - dij(q.i, i))[0]
      || users.filter((u) => u.st === 'on' && !G.BUILDINGS[u.b].gen && (stat(u).get[k] || 0) < want(s, u, k) * 0.7).filter((u) => inOf(u, k) < 3).sort((p, q) => inOf(p, k) - inOf(q, k) || (stat(p).get[k] || 0) / want(s, p, k) - (stat(q).get[k] || 0) / want(s, q, k))[0];
    if (hungry) { w.lines.push({ a: i, b: hungry.i }); n++; }
  }
  if (n) recompute(s);
}

// Route of a line over the map, for drawing and hit tests: one elbow, across then down, from the
// producer to the consumer (or the nearest Hub tile). Lines run under machines, never round them,
// so a route is always short and never fails.
export function route(s, l) {
  let b = l.b;
  if (b === HUBT) b = HUB.reduce((m, h) => (dij(h, l.a) < dij(m, l.a) ? h : m), HUB[0]);
  const path = [l.a]; let i = l.a; const bx = b % N; const by = (b / N) | 0;
  while (i % N !== bx) { i += Math.sign(bx - (i % N)); path.push(i); }
  while (((i / N) | 0) !== by) { i += Math.sign(by - ((i / N) | 0)) * N; path.push(i); }
  return path;
}

// One step of the flow. Generators burn coal from their buffers; then every machine, producers
// first, runs as far as its buffers and its room allow, and hands its output down its lines.
function flowTick(s, dt) {
  const d = s._w; const w = s.world; const pm = s.upgrades.overclock ? G.UPGRADES.overclock.powerMult : 1;
  const before = { ...s.stock }; const a = Math.min(1, dt / 4); // stats smoothing over about 4 s
  let demand = 0;
  for (const it of w.items) { const B = G.BUILDINGS[it.b]; if (B.power && it.st === 'on' && !s.off[it.b]) demand += B.power * pm; }
  let supply = G.CORE_MW; const genU = {}; const genN = {};
  for (const it of w.items) {
    const B = G.BUILDINGS[it.b]; if (!B.gen || it.st !== 'on' || s.off[it.b]) continue;
    let u = 1;
    if (B.in.coal) {
      const wantC = (dt / B.time) * B.in.coal;
      const loadFrac = Math.min(1, Math.max(0, (demand - supply) / B.gen));
      const need = wantC * loadFrac; const used = Math.min(need, it.buf.coal || 0);
      it.buf.coal = (it.buf.coal || 0) - used;
      supply += B.gen * (need > 0 ? (used / need) * loadFrac : 0);
      u = need > 0 ? used / wantC : 0;
      const st = stat(it); st.get.coal = st.get.coal * (1 - a) + (used / dt) * a;
    } else supply += B.gen;
    const st = stat(it); st.u = st.u * (1 - a) + u * a;
    genU[it.b] = (genU[it.b] || 0) + u; genN[it.b] = (genN[it.b] || 0) + 1;
  }
  const pf = demand > 0 ? Math.min(1, supply / demand) : 1;
  const util = {}; const cnt = {};
  for (const it of d.order) {
    const B = G.BUILDINGS[it.b]; const k = outItem(it.b); const st = stat(it);
    const recv = {}; for (const x in B.in) recv[x] = 0;
    if (it.st === 'on' && !s.off[it.b]) {
      const full = G.speed(s, it.b) * dt / B.time;
      let cycles = full * (it.b === 'coaldrill' || !B.power ? 1 : pf);
      for (const [x, v] of Object.entries(B.in)) cycles = Math.min(cycles, (it.buf[x] || 0) / v);
      if (k) cycles = Math.min(cycles, Math.max(0, HOLD * B.out[k] - it.held) / B.out[k]);
      for (const [x, v] of Object.entries(B.in)) it.buf[x] -= cycles * v;
      if (k) { it.held += cycles * B.out[k]; s.made[k] += cycles * B.out[k]; }
      const u = full > 0 ? cycles / full : 0; st.u = st.u * (1 - a) + u * a;
      util[it.b] = (util[it.b] || 0) + u; cnt[it.b] = (cnt[it.b] || 0) + 1;
    } else st.u *= 1 - a;
    if (k && it.held > 1e-9) send(s, it, k, dt);
  }
  // received rates, for wanted vs getting
  for (const it of w.items) { const st = stat(it); for (const x in G.BUILDINGS[it.b].in) { if (x === 'coal' && G.BUILDINGS[it.b].gen) continue; st.get[x] = (st.get[x] || 0) * (1 - a) + ((st.m_in && st.m_in[x]) || 0) / dt * a; } st.m_in = null; }
  for (const l of w.lines) { const st = stat(l); st.r = st.r * (1 - a) + (st.m / dt) * a; st.m = 0; }
  for (const b in G.BUILDINGS) s.stats.util[b] = G.BUILDINGS[b].gen ? (genN[b] ? genU[b] / genN[b] : 0) : (cnt[b] ? util[b] / cnt[b] : 0);
  for (const x in G.ITEMS) {
    if (s.stock[x] < 1e-9) s.stock[x] = 0;
    const r = (s.stock[x] - before[x]) / dt;
    s.stats.rate[x] = s.stats.rate[x] === undefined ? r : s.stats.rate[x] * 0.8 + r * 0.2;
  }
  s.stats.powerFactor = pf; s.stats.supply = supply; s.stats.demand = demand;
  s.playSeconds += dt;
}
// Water-fill the held output over the lines to machines, the Hub takes what is left.
function send(s, it, k, dt) {
  const d = s._w; const outs = d.outs.get(it.i); if (!outs) return;
  let left = it.held; let open = []; let hub = null;
  for (const l of outs) { if (l.b === HUBT) hub = l; else { const t = s.world.items[d.occ[l.b]]; if (t) open.push([l, t]); } }
  for (let pass = 0; pass < 4 && left > 1e-9 && open.length; pass++) {
    const share = left / open.length; const still = [];
    for (const [l, t] of open) {
      const room = BUF * G.BUILDINGS[t.b].in[k] - (t.buf[k] || 0);
      const g = Math.max(0, Math.min(share, room));
      if (g > 0) { t.buf[k] = (t.buf[k] || 0) + g; left -= g; stat(l).m += g; const ts = stat(t); (ts.m_in ||= {})[k] = (ts.m_in[k] || 0) + g; }
      if (room - g > 1e-9) still.push([l, t]);
    }
    open = still;
  }
  if (hub && left > 0) { s.stock[k] += left; stat(hub).m += left; left = 0; }
  it.held = left;
}

// ---------- the bot and auto layout, lines mode ----------
function autoPlaceLines(s, b, free) {
  const d = s._w; const B = G.BUILDINGS[b]; const w = s.world;
  const firstIn = Object.keys(B.in)[0];
  const src = firstIn ? w.items.filter((p) => outItem(p.b) === firstIn).sort((p, q) => dist(p.i) - dist(q.i)) : [];
  const anchor = src.length ? src[Math.min(src.length - 1, (w.items.filter((x) => x.b === b).length) % Math.max(1, Math.min(4, src.length)))].i : HUBT;
  let best = -1; let bs = Infinity;
  for (let i = 0; i < N * N; i++) {
    if (whyNot(s, b, i)) continue;
    let sc = dij(i, anchor) + dist(i) * 0.3;
    if (B.power && !d.cov[i]) sc += 6 + 3 * Math.min(...d.sources.map((x) => Math.max(0, dij(x.i, i) - x.r)));
    if (sc < bs) { bs = sc; best = i; }
  }
  if (best < 0) return -1;
  if (!free) pay(s, G.buildingCost(s, b));
  w.items.push({ b, i: best, off: false, buf: {}, held: 0 });
  recompute(s); autoLink(s, best);
  if (B.power && !s._w.cov[best]) powerTo(s, best, free);
  return best;
}
// The one line that would help most, or null: a machine with no line out goes to the Hub, a
// machine missing an input or short of one for a while gets the producer of it with the fewest
// lines out, a backed-up producer gets the Hub. Advice offers it; the bot lays it.
export function suggestLink(s) {
  const w = s.world; const d = s._w; let best = null;
  const outs = (i) => (d.outs.get(i) || []).length;
  for (const it of w.items) {
    if (it.st === 'off') continue;
    const B = G.BUILDINGS[it.b]; const k = outItem(it.b); const nm = B.name;
    if (it.need === 'noout') { const to = k === 'coal' ? (w.items.find((g) => G.BUILDINGS[g.b].in.coal && !whyNotLink(s, it.i, g.i)) || { i: HUBT }).i : HUBT;
      if (!whyNotLink(s, it.i, to)) return { a: it.i, b: to, why: `${nm} has no line out. Link it to the ${to === HUBT ? 'Hub' : G.BUILDINGS[itemAt(s, to).b].name.toLowerCase()}.` }; }
    if (best || it.st !== 'on') continue;
    const st = stat(it);
    for (const x of Object.keys(B.in)) {
      const missing = it.need === 'noin:' + x;
      const short = missing || ((it.buf[x] || 0) < B.in[x] && (B.gen ? st.u < 0.5 && s.stats.powerFactor < 0.99 : (st.get[x] || 0) < want(s, it, x) * 0.7));
      if (!short) continue;
      const p = w.items.filter((q) => outItem(q.b) === x && !whyNotLink(s, q.i, it.i)).sort((q, r) => outs(q.i) - outs(r.i) || dij(q.i, it.i) - dij(r.i, it.i))[0];
      if (p && (d.ins.get(it.i) || []).length < 8) { best = { a: p.i, b: it.i, why: missing ? `${nm} has no ${G.ITEMS[x].name.toLowerCase()} coming in. Link a ${G.BUILDINGS[p.b].name.toLowerCase()} to it.` : `${nm} is short of ${G.ITEMS[x].name.toLowerCase()}. Link another ${G.BUILDINGS[p.b].name.toLowerCase()} to it.` }; break; }
    }
    if (!best && k && k !== 'coal' && it.held >= HOLD * B.out[k] - 1e-6 && !whyNotLink(s, it.i, HUBT)) best = { a: it.i, b: HUBT, why: `${nm} is backed up: nothing takes its ${G.ITEMS[k].name.toLowerCase()}. Link it to the Hub.` };
  }
  return best;
}
// What the bot does each check in lines mode: the suggested link, up to max times.
export function tendLines(s, max = 1) {
  let n = 0;
  for (; n < max; n++) { const l = suggestLink(s); if (!l) break; s.world.lines.push({ a: l.a, b: l.b }); recompute(s); }
  return n;
}
