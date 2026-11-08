// Drift Foundry: pure game logic. No DOM. Used by the UI and by sim/balance.mjs.

export const ITEMS = {
  ore: { name: 'Ore', tier: 0 },
  coal: { name: 'Coal', tier: 0 },
  stone: { name: 'Stone', tier: 0 },
  quartz: { name: 'Quartz', tier: 0 },
  ingot: { name: 'Ingot', tier: 1 },
  plate: { name: 'Plate', tier: 1 },
  wire: { name: 'Wire', tier: 1 },
  concrete: { name: 'Concrete', tier: 1 },
  silica: { name: 'Silica', tier: 1 },
  frame: { name: 'Frame', tier: 2 },
  circuit: { name: 'Circuit', tier: 2 },
  motor: { name: 'Motor', tier: 3 },
};

// time: seconds per cycle at 100%. power: MW drawn while running. gen: MW made per running unit.
// Order matters: the tick runs extractors first, then makers by tier.
export const BUILDINGS = {
  drill:     { name: 'Ore drill',    phase: 1, in: {}, out: { ore: 1 }, time: 1, power: 1, cost: { ore: 10 } },
  smelter:   { name: 'Smelter',      phase: 1, in: { ore: 2 }, out: { ingot: 1 }, time: 2, power: 2, cost: { ore: 25 } },
  coaldrill: { name: 'Coal drill',   phase: 2, in: {}, out: { coal: 1 }, time: 1, power: 1, cost: { ingot: 20 } },
  burner:    { name: 'Burner',       phase: 2, in: { coal: 1 }, out: {}, time: 2, gen: 12, cost: { ingot: 40 } },
  press:     { name: 'Press',        phase: 2, in: { ingot: 2 }, out: { plate: 1 }, time: 2, power: 3, cost: { ingot: 45 } },
  drawer:    { name: 'Wire drawer',  phase: 2, in: { ingot: 1 }, out: { wire: 2 }, time: 2, power: 3, cost: { ingot: 30, plate: 10 } },
  quarry:    { name: 'Quarry',       phase: 3, in: {}, out: { stone: 1 }, time: 1, power: 2, cost: { plate: 30, ingot: 30 } },
  kiln:      { name: 'Kiln',         phase: 3, in: { stone: 3 }, out: { concrete: 1 }, time: 2, power: 4, cost: { plate: 40, wire: 40 } },
  assembler: { name: 'Assembler',    phase: 3, in: { plate: 2, wire: 6 }, out: { frame: 1 }, time: 4, power: 8, cost: { plate: 80, wire: 120 } },
  turbine:   { name: 'Turbine',      phase: 3, in: { coal: 1 }, out: {}, time: 1, gen: 45, cost: { frame: 10, concrete: 40 } },
  quartzdrill:{ name: 'Quartz drill', phase: 4, in: {}, out: { quartz: 1 }, time: 1, power: 3, cost: { frame: 10, concrete: 40 } },
  refinery:  { name: 'Refinery',     phase: 4, in: { quartz: 2 }, out: { silica: 1 }, time: 2, power: 6, cost: { frame: 15, concrete: 60 } },
  fabricator:{ name: 'Fabricator',   phase: 4, in: { silica: 1, wire: 3, plate: 1 }, out: { circuit: 1 }, time: 4, power: 12, cost: { frame: 30, concrete: 100, plate: 100 } },
  solar:     { name: 'Solar field',  phase: 5, in: {}, out: {}, time: 1, gen: 30, cost: { circuit: 25, frame: 25 } },
  motorworks:{ name: 'Motor works',  phase: 5, in: { frame: 1, circuit: 2, ingot: 4 }, out: { motor: 1 }, time: 8, power: 30, cost: { circuit: 40, frame: 40, concrete: 200 } },
};
export const BUILD_ORDER = Object.keys(BUILDINGS);
export const COST_GROWTH = 1.13;
export const CORE_MW = 10; // the lander's own reactor

// The Ring: five segments delivered in order. Finishing one unlocks the next phase.
export const PHASES = [
  { name: 'Anchor', blurb: 'Pin the ring to the rock.', need: { ingot: 300 } },
  { name: 'Spine', blurb: 'A plated spine around the equator.', need: { ingot: 1200, plate: 800, wire: 1500 } },
  { name: 'Lattice', blurb: 'Frames and poured concrete to hold the spine.', need: { frame: 1500, concrete: 6000 } },
  { name: 'Nerve', blurb: 'Wire the ring so it can steer.', need: { circuit: 3000, frame: 2500, wire: 12000 } },
  { name: 'Engine', blurb: 'Motors to spin the ring up and leave.', need: { motor: 9000, circuit: 15000, concrete: 80000 } },
];

export const UPGRADES = {
  bits:      { name: 'Hardened bits',  phase: 2, text: 'Ore and coal drills +50%', cost: { ingot: 300, plate: 100 }, mult: { drill: 1.5, coaldrill: 1.5 } },
  hotblast:  { name: 'Hot blast',      phase: 2, text: 'Smelters +50%', cost: { plate: 300, wire: 300 }, mult: { smelter: 1.5 } },
  shifts:    { name: 'Night shift',    phase: 2, text: 'Away time counts up to 8 h, not 2 h', cost: { plate: 200, wire: 200 } },
  dies:      { name: 'Progressive dies', phase: 3, text: 'Presses and drawers +50%', cost: { frame: 150, concrete: 300 }, mult: { press: 1.5, drawer: 1.5 } },
  jigs:      { name: 'Assembly jigs',  phase: 3, text: 'Assemblers and kilns +50%', cost: { frame: 400, concrete: 800 }, mult: { assembler: 1.5, kiln: 1.5 } },
  overclock: { name: 'Overclock',      phase: 4, text: 'Everything +25%, power use +40%', cost: { circuit: 500, frame: 800 }, all: 1.25, powerMult: 1.4 },
  deepcore:  { name: 'Deep core',      phase: 4, text: 'All drills and the quarry +100%', cost: { circuit: 1200, concrete: 4000 }, mult: { drill: 2, coaldrill: 2, quarry: 2, quartzdrill: 2 } },
  lines:     { name: 'Line balancing', phase: 5, text: 'Fabricators and motor works +60%', cost: { circuit: 3000, motor: 200 }, mult: { fabricator: 1.6, motorworks: 1.6 } },
};

export const TAP_ORE = 1;

export function newState(now = Date.now()) {
  const s = {
    v: 1,
    phase: 0, // index into PHASES of the segment being built
    stock: {}, delivered: {}, built: {}, upgrades: {}, off: {}, // off: building types on standby
    made: {}, // lifetime production, for the end screen
    started: now, saved: now, playSeconds: 0, done: null,
    stats: { rate: {}, util: {}, powerFactor: 1, supply: CORE_MW, demand: 0 },
  };
  for (const k in ITEMS) { s.stock[k] = 0; s.made[k] = 0; }
  for (const k in BUILDINGS) s.built[k] = 0;
  return s;
}

export const unlockedPhase = (s) => s.phase + 1; // phase numbers are 1-based
export const isBuildingUnlocked = (s, b) => BUILDINGS[b].phase <= unlockedPhase(s);
export const isUpgradeUnlocked = (s, u) => UPGRADES[u].phase <= unlockedPhase(s);

export function buildingCost(s, b) {
  // In the builder, s.placed counts what is on the map; s.built is what is connected and powered.
  const n = s.placed ? s.placed[b] : s.built[b];
  const out = {};
  for (const [k, v] of Object.entries(BUILDINGS[b].cost)) out[k] = Math.ceil(v * COST_GROWTH ** n);
  return out;
}

export const canAfford = (s, cost) => Object.entries(cost).every(([k, v]) => s.stock[k] >= v);
function pay(s, cost) { for (const [k, v] of Object.entries(cost)) s.stock[k] -= v; }

export function build(s, b) {
  if (!isBuildingUnlocked(s, b)) return false;
  const c = buildingCost(s, b);
  if (!canAfford(s, c)) return false;
  pay(s, c); s.built[b] += 1; return true;
}

export function buyUpgrade(s, u) {
  if (s.upgrades[u] || !isUpgradeUnlocked(s, u)) return false;
  if (!canAfford(s, UPGRADES[u].cost)) return false;
  pay(s, UPGRADES[u].cost); s.upgrades[u] = true; return true;
}

export function toggle(s, b) { s.off[b] = !s.off[b]; }

export function tap(s) { s.stock.ore += TAP_ORE; s.made.ore += TAP_ORE; }

export function speed(s, b) {
  let m = 1;
  for (const u in s.upgrades) {
    const U = UPGRADES[u];
    if (U.mult && U.mult[b]) m *= U.mult[b];
    if (U.all && !BUILDINGS[b].gen) m *= U.all;
  }
  return m;
}
const powerMult = (s) => (s.upgrades.overclock ? UPGRADES.overclock.powerMult : 1);

export function remaining(s) {
  const p = PHASES[s.phase];
  if (!p) return {};
  const out = {};
  for (const [k, v] of Object.entries(p.need)) out[k] = Math.max(0, v - (s.delivered[k] || 0));
  return out;
}

// Send everything useful from stock into the ring. Returns true if the segment completed.
export function deliver(s, item) {
  const rem = remaining(s);
  const keys = item ? [item] : Object.keys(rem);
  for (const k of keys) {
    const n = Math.min(Math.floor(s.stock[k]), rem[k] || 0);
    if (n > 0) { s.stock[k] -= n; s.delivered[k] = (s.delivered[k] || 0) + n; }
  }
  return checkPhase(s);
}

export function checkPhase(s) {
  if (!PHASES[s.phase]) return false;
  if (Object.values(remaining(s)).every((v) => v <= 0)) {
    s.phase += 1; s.delivered = {};
    if (s.phase >= PHASES.length && !s.done) s.done = s.playSeconds;
    return true;
  }
  return false;
}

// Advance the factory by dt seconds. Power first, then extractors and makers in order;
// each maker runs as far as its inputs allow. Rates and utilisation are recorded for the UI.
export function tick(s, dt) {
  if (s._w && s._w.flow) { s._w.flow(s, dt); return; } // supply lines: world.js runs the flow
  const pm = powerMult(s);
  let demand = 0;
  for (const b of BUILD_ORDER) { const B = BUILDINGS[b]; if (B.power && !s.off[b]) demand += B.power * pm * s.built[b]; }
  let supply = CORE_MW;
  const before = { ...s.stock };
  for (const b of BUILD_ORDER) {
    const B = BUILDINGS[b]; const n = s.built[b];
    if (!B.gen || !n || s.off[b]) continue;
    let frac = 1;
    if (B.in.coal) {
      const want = (n * dt / B.time) * B.in.coal;
      // generators burn only what the load needs
      const loadFrac = Math.min(1, Math.max(0, (demand - supply) / (n * B.gen)));
      const need = want * loadFrac;
      const used = Math.min(need, s.stock.coal);
      s.stock.coal -= used;
      frac = need > 0 ? (used / need) * loadFrac : 0;
      s.stats.util[b] = need > 0 ? used / want : 0;
      supply += n * B.gen * frac;
    } else {
      supply += n * B.gen; s.stats.util[b] = 1;
    }
  }
  const pf = demand > 0 ? Math.min(1, supply / demand) : 1;
  for (const b of BUILD_ORDER) {
    const B = BUILDINGS[b]; const n = s.built[b];
    if (B.gen) continue;
    if (!n || s.off[b]) { s.stats.util[b] = 0; continue; }
    const possible = n * pf * speed(s, b) * dt / B.time;
    let cycles = possible;
    for (const [k, v] of Object.entries(B.in)) cycles = Math.min(cycles, s.stock[k] / v);
    for (const [k, v] of Object.entries(B.in)) s.stock[k] -= cycles * v;
    for (const [k, v] of Object.entries(B.out)) { s.stock[k] += cycles * v; s.made[k] += cycles * v; }
    s.stats.util[b] = (n * speed(s, b) * dt / B.time) > 0 ? cycles / (n * speed(s, b) * dt / B.time) : 0;
  }
  for (const k in ITEMS) {
    if (s.stock[k] < 1e-9) s.stock[k] = 0;
    const r = (s.stock[k] - before[k]) / dt;
    s.stats.rate[k] = s.stats.rate[k] === undefined ? r : s.stats.rate[k] * 0.8 + r * 0.2;
  }
  s.stats.powerFactor = pf; s.stats.supply = supply; s.stats.demand = demand;
  s.playSeconds += dt;
}

// Gross production per second per item at current utilisation, ignoring consumption.
export function grossRates(s) {
  if (s._w && s._w.flow) { const r = {}; for (const k in ITEMS) r[k] = Math.max(0, s.stats.rate[k] || 0); return r; } // what reaches the Hub
  const out = {};
  for (const k in ITEMS) out[k] = 0;
  for (const b of BUILD_ORDER) {
    const B = BUILDINGS[b];
    for (const [k, v] of Object.entries(B.out)) out[k] += s.built[b] * speed(s, b) * (s.stats.util[b] || 0) * (s.stats.powerFactor || 1) * v / B.time;
  }
  return out;
}

export function powerCapacity(s) {
  let mw = CORE_MW;
  for (const b of BUILD_ORDER) if (BUILDINGS[b].gen && !s.off[b]) mw += BUILDINGS[b].gen * s.built[b];
  return mw;
}

export const offlineCap = (s) => (s.upgrades.shifts ? 8 : 2) * 3600;

// Catch up on time away. Simulated in coarse steps; returns a summary for the welcome-back sheet.
export function catchUp(s, seconds) {
  const secs = Math.min(seconds, offlineCap(s));
  if (secs < 5) return null;
  const startMade = { ...s.made };
  const step = secs > 3600 ? 5 : 1;
  let t = 0;
  while (t < secs) { const d = Math.min(step, secs - t); tick(s, d); t += d; }
  const gained = {};
  for (const k in ITEMS) { const g = s.made[k] - startMade[k]; if (g >= 1) gained[k] = g; }
  return { seconds: secs, away: seconds, capped: seconds > secs, gained };
}

export function serialize(s) { return JSON.stringify({ ...s, stats: undefined }); }
export function deserialize(str) {
  const raw = JSON.parse(str);
  if (!raw || raw.v !== 1) throw new Error('unknown save');
  const s = newState(raw.started);
  for (const key of ['phase', 'started', 'saved', 'playSeconds', 'done']) if (key in raw) s[key] = raw[key];
  for (const key of ['stock', 'delivered', 'built', 'upgrades', 'made', 'off']) Object.assign(s[key], raw[key] || {});
  for (const k in s.stock) if (!Number.isFinite(s.stock[k]) || s.stock[k] < 0) s.stock[k] = 0;
  return s;
}

export function fmt(n) {
  if (!Number.isFinite(n)) return '0';
  const a = Math.abs(n);
  if (a < 10) return (Math.floor(n * 10) / 10).toString();
  if (a < 10000) return Math.floor(n).toLocaleString('en-US');
  const units = ['k', 'M', 'B', 'T'];
  let u = -1; let x = a; // 10000 and up: 10.0k
  while (x >= 1000 && u < units.length - 1) { x /= 1000; u++; }
  return (n < 0 ? '-' : '') + (x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : Math.floor(x)) + units[u];
}

export function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60); const s = sec % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}
