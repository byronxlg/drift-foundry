// Balance bot: plays Drift Foundry the way an attentive person would and reports phase times.
// node sim/balance.mjs [checkEverySeconds=15] [tapsPerSecond=3]
import * as G from '../src/game.js';
import * as W from '../src/world.js';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const period = Number(args[0] || 15);
const taps = Number(args[1] || 3);
const s = G.newState(0);
// Default: the bot plays the map with supply lines (places on nodes, links machines, chains poles).
// --abstract: the count-only engine model. --lines is accepted and ignored (lines are the game).
const spatial = !process.argv.includes('--abstract');
const seed = Number((process.argv.find((a) => a.startsWith('--seed=')) || '--seed=7').slice(7));
const lines = spatial;
if (spatial) { s.world = W.newWorld(seed); W.recompute(s); }
const build = (b) => (spatial ? W.autoBuild(s, b) : G.build(s, b));
const producerOf = {};
for (const b of G.BUILD_ORDER) for (const k of Object.keys(G.BUILDINGS[b].out)) producerOf[k] ??= b;

function unlockedGen() {
  return ['solar', 'turbine', 'burner'].find((g) => G.isBuildingUnlocked(s, g));
}

function cap(item) { // capacity per second for an item: made at full speed, eaten at full speed
  let made = 0; let eaten = 0;
  for (const b of G.BUILD_ORDER) {
    const B = G.BUILDINGS[b]; const r = s.built[b] * G.speed(s, b) / B.time;
    made += r * (B.out[item] || 0); eaten += r * (B.in[item] || 0);
  }
  return { made, eaten };
}
function walk(b) {
  for (let i = 0; i < 6; i++) {
    const ins = Object.keys(G.BUILDINGS[b].in).filter((k) => k !== 'coal');
    const short = ins.map((k) => [k, cap(k)]).filter(([, c]) => c.made < c.eaten * 1.02 || c.made === 0)
      .sort((a, c) => a[1].made / (a[1].eaten || 1) - c[1].made / (c[1].eaten || 1));
    if (!short.length) return b;
    b = producerOf[short[0][0]];
  }
  return b;
}

function target() {
  const st = s.stats;
  if (st.demand > G.powerCapacity(s) * 0.85 || st.powerFactor < 0.99) {
    if (G.unlockedPhase(s) < 2) return null;
    const g = unlockedGen();
    const G2 = G.BUILDINGS[g];
    if (st.powerFactor < 0.99 && s.stock.coal < 20 && G.powerCapacity(s) > st.demand) return 'coaldrill';
    return g;
  }
  const rem = G.remaining(s);
  const gross = G.grossRates(s);
  let worst = null; let eta = -1;
  for (const [k, v] of Object.entries(rem)) {
    if (v <= 0) continue;
    const e = v / (gross[k] + 1e-6);
    if (e > eta) { eta = e; worst = k; }
  }
  if (!worst) return null;
  return walk(producerOf[worst]);
}

const marks = [];
let last = 0; let builds = 0;
const reserve = {};
const starved = new Proxy({}, { get: (o, k) => o[k] ?? 0 });
while (!s.done && s.playSeconds < 20 * 3600) {
  if (G.unlockedPhase(s) === 1) for (let i = 0; i < taps; i++) G.tap(s);
  G.tick(s, 1);
  if (s.playSeconds - last < period) continue;
  last = s.playSeconds;
  if (spatial) W.repair(s);
  if (lines) W.tendLines(s, Number(process.env.TEND || 1));
  for (const u in G.UPGRADES) G.buyUpgrade(s, u);
  for (const b in s.off) delete s.off[b];
  let t = target();
  for (let i = 0; i < 4 && t; i++) {
    const cost = G.buildingCost(s, t);
    if (build(t)) { builds++; for (const k in cost) starved[k] = 0; continue; }
    // can't afford: make sure something produces what is missing
    const missing = Object.keys(cost).find((k) => s.stock[k] < cost[k]);
    for (const k in reserve) delete reserve[k];
    Object.assign(reserve, cost);
    // stand by whatever eats the missing item so it can pile up (a person would do the same)
    if (++starved[missing] > 3) for (const b of G.BUILD_ORDER) if (G.BUILDINGS[b].in[missing] && b !== t) s.off[b] = true;
    if (G.grossRates(s)[missing] < 0.05) t = walk(producerOf[missing]); else break;
  }
  const rem = G.remaining(s);
  for (const k of Object.keys(rem)) {
    const n = Math.floor(s.stock[k] - (reserve[k] || 0));
    if (n > 0) { const keep = s.stock[k] - n; s.stock[k] = n; G.deliver(s, k); s.stock[k] += keep; }
  }
  if (s.phase > marks.length) marks.push({ phase: G.PHASES[marks.length].name, at: s.playSeconds, builds: { ...s.built } });
}
let prev = 0;
for (const m of marks) {
  console.log(`${m.phase.padEnd(8)} done at ${G.fmtTime(m.at).padStart(8)}  (+${G.fmtTime(m.at - prev)})  ${Object.entries(m.builds).filter(([, v]) => v).map(([k, v]) => k + ':' + v).join(' ')}`);
  prev = m.at;
}
if (spatial && process.env.DEBUG) console.log(JSON.stringify(s.world.items.filter((it) => it.st !== "on").map((it) => [it.b, it.st, Math.round(W.dist(it.i))])), JSON.stringify(s.placed), JSON.stringify(s.built), JSON.stringify(Object.fromEntries(Object.entries(s.stock).map(([k,v])=>[k,Math.round(v)]))));
if (lines) console.log(`lines: ${s.world.lines.length}, to the Hub ${s.world.lines.filter((l) => l.b === W.HUBT).length}`);
if (spatial) console.log(`map: ${s.world.items.length} machines, ${s.world.poles.length} poles, ${s.world.items.filter((it) => it.st !== 'on').length} not counting`);
console.log(s.done ? `finished in ${G.fmtTime(s.done)}, ${builds} builds` : `not finished after ${G.fmtTime(s.playSeconds)}; phase ${s.phase} remaining ${JSON.stringify(G.remaining(s))}`);
if (process.env.DEBUG) console.log(JSON.stringify({ built: s.built, stock: Object.fromEntries(Object.entries(s.stock).map(([k, v]) => [k, Math.round(v)])), util: s.stats.util, sup: s.stats.supply, dem: s.stats.demand, reserve }, null, 0));
