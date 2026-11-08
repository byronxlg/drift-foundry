import * as G from './game.js';

const KEY = 'drift-foundry/save';
const $ = (sel, el = document) => el.querySelector(sel);
const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

const params = new URLSearchParams(location.search);
const skin = params.get('skin') === 'b' ? 'b' : 'a';
document.documentElement.dataset.skin = skin;

let s;
let sheetQueue = [];
function load() {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try { s = G.deserialize(raw); } catch {
      localStorage.setItem(KEY + '.broken.' + Date.now(), raw);
      s = G.newState();
      sheetQueue.push({ title: 'Save could not be read', body: 'A fresh foundry was started. The old save was kept in this browser in case it can be recovered.' });
    }
  } else s = G.newState();
  if (params.has('demo')) demo(params.get('demo'));
  const away = (Date.now() - s.saved) / 1000;
  const sum = G.catchUp(s, away);
  if (sum) sheetQueue.push(awaySheet(sum));
}
function save() { s.saved = Date.now(); localStorage.setItem(KEY, G.serialize(s)); }

// ?demo=3 seeds a mid-game state for screenshots and review; never touches a real save
function demo(phase) {
  s = G.newState();
  const p = Number(phase) || 3;
  const plan = [
    { drill: 4, smelter: 3 },
    { drill: 18, smelter: 15, coaldrill: 4, burner: 6, press: 6, drawer: 6 },
    { drill: 22, smelter: 20, coaldrill: 9, burner: 6, press: 10, drawer: 12, quarry: 14, kiln: 9, assembler: 7, turbine: 5 },
    { drill: 36, smelter: 45, coaldrill: 12, burner: 6, press: 11, drawer: 24, quarry: 15, kiln: 10, assembler: 8, turbine: 22, quartzdrill: 8, refinery: 8, fabricator: 14 },
  ][Math.min(p, 4) - 1] || {};
  s.phase = p - 1; Object.assign(s.built, plan);
  if (p >= 3) Object.assign(s.upgrades, { bits: true, hotblast: true, shifts: true });
  for (let i = 0; i < 900; i++) G.tick(s, 1);
  const rem = G.remaining(s);
  for (const k in rem) s.delivered[k] = Math.floor(G.PHASES[s.phase].need[k] * (0.25 + 0.4 * Math.random()));
  s.playSeconds = [240, 1500, 3600, 9000][Math.min(p, 4) - 1];
  window.__demo = true;
}

function awaySheet(sum) {
  const lines = Object.entries(sum.gained).filter(([k]) => G.ITEMS[k]).sort((a, b) => G.ITEMS[b[0]].tier - G.ITEMS[a[0]].tier).slice(0, 6)
    .map(([k, v]) => `${G.ITEMS[k].name} +${G.fmt(v)}`);
  const cap = sum.capped ? ` The shift counts ${G.fmtTime(sum.seconds)} of it${s.upgrades.shifts ? '' : '; Night shift raises that to 8 h'}.` : '';
  return { title: `Away ${G.fmtTime(sum.away)}`, body: `The foundry kept running.${cap}`, list: lines };
}

// ---------- static frame ----------
const app = $('#app');
app.innerHTML = `
<header class="bar">
  <svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="11 3.4"/><circle cx="16" cy="16" r="3" fill="var(--accent)"/></svg>
  <h1>Drift Foundry</h1>
  <div class="power" id="power"><span class="pw-label">Power</span><span class="pw-num"></span><span class="pw-meter"><i></i></span></div>
</header>
<main>
  <section class="focus" id="focus">
    <div class="seg-head"><div><p class="seg-count"></p><h2 class="seg-name"></h2><p class="seg-blurb"></p><p class="seg-pct"></p></div>
      <svg class="ring" viewBox="0 0 120 120" aria-hidden="true"></svg></div>
    <div class="segbar" aria-hidden="true"></div>
    <ul class="needs"></ul>
    <div class="next"><p class="next-why"><b class="next-tag">Next</b> <span></span></p><button class="btn primary next-btn"></button></div>
    <button class="btn deliver" id="deliver">Deliver to the ring</button>
  </section>
  <section class="tapzone" id="tapzone"><button class="btn tap" id="tap">Mine ore <b>+1</b></button><p class="tap-hint">Tap to dig. Build an ore drill to stop tapping.</p></section>
  <section class="factory"><h3>Factory</h3><div id="lines"></div></section>
  <section class="stock"><h3>Stock</h3><div id="stock" class="stockgrid"></div></section>
  <section class="research" id="researchSec"><h3>Research</h3><div id="research"></div></section>
  <footer class="foot"><span id="clock"></span><button class="link" id="reset">New game</button></footer>
</main>
<div class="sheet" id="sheet" hidden><div class="sheet-card"><h2></h2><p></p><ul></ul><button class="btn primary" id="sheetOk">Carry on</button></div></div>`;

// production lines: grouping buildings by what they feed
const LINES = [
  { name: 'Ore and ingots', b: ['drill', 'smelter'] },
  { name: 'Power', b: ['coaldrill', 'burner', 'turbine', 'solar'] },
  { name: 'Plate and wire', b: ['press', 'drawer'] },
  { name: 'Stone and frames', b: ['quarry', 'kiln', 'assembler'] },
  { name: 'Quartz and circuits', b: ['quartzdrill', 'refinery', 'fabricator'] },
  { name: 'Motors', b: ['motorworks'] },
];

const swatch = (k) => `<i class="sw sw-${k}"></i>`;
function costHTML(cost) {
  return Object.entries(cost).map(([k, v]) => `<span class="c ${s.stock[k] >= v ? '' : 'short'}">${swatch(k)}${G.fmt(v)}</span>`).join('');
}
function outputOf(b) { return Object.keys(G.BUILDINGS[b].out)[0]; }

let shape = '';
function rebuild() {
  const lines = $('#lines'); lines.innerHTML = '';
  for (const L of LINES) {
    const bs = L.b.filter((b) => G.isBuildingUnlocked(s, b));
    if (!bs.length) continue;
    const g = h('div', 'line'); g.append(h('h4', '', L.name));
    for (const b of bs) {
      const B = G.BUILDINGS[b];
      const row = h('div', 'brow'); row.dataset.b = b;
      const ins = Object.entries(B.in).map(([k, v]) => `${swatch(k)}${G.ITEMS[k].name.toLowerCase()}`).join(' + ');
      const out = B.gen ? `${B.gen} MW` : Object.keys(B.out).map((k) => `${swatch(k)}${G.ITEMS[k].name.toLowerCase()}`).join('');
      row.innerHTML = `<div class="b-main"><span class="b-name">${B.name}</span><span class="b-n"></span>
        <span class="b-recipe">${ins ? ins + ' <span class="arrow">to</span> ' : ''}${out}</span><span class="b-state"></span></div>
        <div class="b-act"><button class="btn build"><span class="b-cost"></span></button><button class="tog" aria-label="Stand by">Stand by</button></div>`;
      $('.build', row).onclick = () => { if (G.build(s, b)) { flash(row); render(); } };
      $('.tog', row).onclick = () => { G.toggle(s, b); render(); };
      g.append(row);
    }
    lines.append(g);
  }
  const res = $('#research'); res.innerHTML = '';
  for (const u in G.UPGRADES) {
    if (!G.isUpgradeUnlocked(s, u)) continue;
    const U = G.UPGRADES[u];
    const row = h('div', 'urow'); row.dataset.u = u;
    row.innerHTML = `<div><span class="u-name">${U.name}</span><span class="u-text">${U.text}</span></div><button class="btn buy"></button>`;
    $('.buy', row).onclick = () => { if (G.buyUpgrade(s, u)) render(); };
    res.append(row);
  }
  $('#researchSec').hidden = !res.children.length;
  const st = $('#stock'); st.innerHTML = '';
  for (const k in G.ITEMS) {
    const d = h('div', 'sitem'); d.dataset.k = k;
    d.innerHTML = `${swatch(k)}<span class="s-name">${G.ITEMS[k].name}</span><span class="s-n"></span><span class="s-r"></span>`;
    st.append(d);
  }
  ringSVG();
}

function ringSVG() {
  const svg = $('.ring'); const n = G.PHASES.length; const r = 46; const gap = 6;
  let out = '';
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 360 + gap / 2 - 90; const a1 = ((i + 1) / n) * 360 - gap / 2 - 90;
    const p = (a) => [60 + r * Math.cos((a * Math.PI) / 180), 60 + r * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = p(a0); const [x1, y1] = p(a1);
    out += `<path class="track" d="M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}"/>`;
    out += `<path class="arc arc-${i}" d="M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}" pathLength="100"/>`;
  }
  out += `<text x="60" y="58" class="ring-pct"></text><text x="60" y="76" class="ring-sub">of segment</text>`;
  svg.innerHTML = out;
  $('.segbar').innerHTML = G.PHASES.map((p, i) => `<span class="sb sb-${i}"><i></i><em>${i + 1} ${p.name}</em></span>`).join('');
}

function flash(el) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }

// What to build next: the slowest ring item, followed upstream through any starved input.
const producerOf = {};
for (const b of G.BUILD_ORDER) for (const k of Object.keys(G.BUILDINGS[b].out)) producerOf[k] ??= b;
function advice() {
  const st = s.stats;
  if (G.unlockedPhase(s) >= 2 && (st.powerFactor < 0.98 || st.demand > G.powerCapacity(s) * 0.95)) {
    const gen = ['solar', 'turbine', 'burner'].find((g) => G.isBuildingUnlocked(s, g));
    const fuel = G.BUILDINGS[gen].in.coal && st.demand < G.powerCapacity(s) && s.stock.coal < 5;
    return fuel ? { b: 'coaldrill', why: 'Generators are out of coal.' }
      : { b: gen, why: `Power is short: ${G.fmt(st.demand)} MW wanted, ${G.fmt(G.powerCapacity(s))} MW built.` };
  }
  const rem = G.remaining(s); const gross = G.grossRates(s);
  let worst = null; let eta = -1;
  for (const [k, v] of Object.entries(rem)) { if (v <= 0) continue; const e = v / (gross[k] + 1e-6); if (e > eta) { eta = e; worst = k; } }
  if (!worst) return null;
  let b = producerOf[worst]; let why = `${G.ITEMS[worst].name} is the slowest part of this segment.`;
  for (let i = 0; i < 5; i++) {
    const ins = Object.keys(G.BUILDINGS[b].in);
    const unfed = ins.find((k) => producerOf[k] && s.built[producerOf[k]] === 0);
    if (unfed) { why = `Nothing makes ${G.ITEMS[unfed].name.toLowerCase()} yet.`; b = producerOf[unfed]; continue; }
    if (s.built[b] === 0) break;
    if (!ins.length || (st.util[b] ?? 1) > 0.9) break;
    ins.sort((x, y) => s.stock[x] / G.BUILDINGS[b].in[x] - s.stock[y] / G.BUILDINGS[b].in[y]);
    why = `${G.BUILDINGS[b].name}s are waiting on ${G.ITEMS[ins[0]].name.toLowerCase()}.`;
    b = producerOf[ins[0]];
  }
  return { b, why };
}

function render() {
  const sig = `${s.phase}|${Object.keys(s.upgrades).length}`;
  if (sig !== shape) { shape = sig; rebuild(); }
  const st = s.stats; const done = s.phase >= G.PHASES.length;
  // power
  const cap = G.powerCapacity(s);
  $('#power .pw-num').textContent = `${G.fmt(st.demand)} / ${G.fmt(cap)} MW`;
  $('#power i').style.width = `${Math.min(100, (st.demand / cap) * 100)}%`;
  $('#power').classList.toggle('short', st.powerFactor < 0.98);
  // focus
  const P = G.PHASES[Math.min(s.phase, G.PHASES.length - 1)];
  $('.seg-count').textContent = done ? 'Ring complete' : `Segment ${s.phase + 1} of ${G.PHASES.length}`;
  $('.seg-name').textContent = done ? 'Ready to leave' : P.name;
  $('.seg-blurb').textContent = done ? `Built in ${G.fmtTime(s.done)} of play.` : P.blurb;
  const rem = G.remaining(s); const gross = G.grossRates(s);
  let tot = 0; let have = 0;
  const needs = $('.needs'); needs.innerHTML = '';
  for (const [k, need] of Object.entries(done ? {} : P.need)) {
    const got = need - rem[k]; tot += need; have += got;
    const inStock = Math.min(Math.floor(s.stock[k]), rem[k]);
    const eta = rem[k] <= inStock ? 'ready' : gross[k] > 0.001 ? `about ${G.fmtTime((rem[k] - inStock) / gross[k])}` : 'not being made';
    const li = h('li', rem[k] <= 0 ? 'met' : '');
    li.innerHTML = `${swatch(k)}<span class="n-name">${G.ITEMS[k].name}</span><span class="n-num">${G.fmt(got)}<small> / ${G.fmt(need)}</small></span>
      <span class="n-bar"><i style="width:${(got / need) * 100}%"></i><b style="width:${(Math.min(need, got + inStock) / need) * 100}%"></b></span><span class="n-eta">${rem[k] <= 0 ? 'delivered' : `${G.fmt(inStock)} in stock, ${eta}`}</span>`;
    needs.append(li);
  }
  const frac = done ? 1 : tot ? have / tot : 0;
  $('.ring-pct').textContent = `${Math.floor(frac * 100)}%`;
  $('.seg-pct').textContent = done ? '' : `${Math.floor(frac * 100)}% of this segment delivered`;
  for (let i = 0; i < G.PHASES.length; i++) {
    const f = i < s.phase ? 1 : i === s.phase ? frac : 0;
    $(`.arc-${i}`).style.strokeDasharray = `${f * 100} 100`;
    $(`.arc-${i}`).classList.toggle('now', i === s.phase);
    $(`.sb-${i} i`).style.width = `${f * 100}%`;
    $(`.sb-${i}`).classList.toggle('now', i === s.phase);
    $(`.sb-${i}`).classList.toggle("done", i < s.phase);
  }
  const deliverable = Object.entries(rem).some(([k, v]) => v > 0 && s.stock[k] >= 1);
  $('#deliver').disabled = !deliverable; $('#deliver').hidden = done;
  const adv = done ? null : advice();
  $('.next').hidden = !adv;
  if (adv) {
    $('.next-why span').textContent = adv.why;
    const c = G.buildingCost(s, adv.b);
    const btn = $('.next-btn');
    btn.innerHTML = `Build ${G.BUILDINGS[adv.b].name.toLowerCase()} <span class="cost">${costHTML(c)}</span>`;
    btn.disabled = !G.canAfford(s, c);
    btn.onclick = () => { G.build(s, adv.b); render(); };
  }
  // tap zone
  $('#tapzone').classList.toggle('early', s.phase === 0 && s.built.drill < 3);
  // building rows
  for (const row of document.querySelectorAll('.brow')) {
    const b = row.dataset.b; const B = G.BUILDINGS[b]; const n = s.built[b];
    $('.b-n', row).textContent = `x${n}`;
    const c = G.buildingCost(s, b);
    $('.b-cost', row).innerHTML = costHTML(c);
    $('.build', row).disabled = !G.canAfford(s, c);
    const tog = $('.tog', row); tog.hidden = !n; tog.textContent = s.off[b] ? 'Start' : 'Stand by';
    let state = ''; let cls = '';
    const u = st.util[b] ?? 0;
    if (!n) state = 'none built';
    else if (s.off[b]) { state = 'on stand-by'; cls = 'idle'; }
    else if (B.gen) { state = B.in.coal ? (u > 0.01 || st.demand <= 10 ? `${G.fmt(B.gen * n)} MW` : 'no coal') : `${G.fmt(B.gen * n)} MW`; cls = B.in.coal && u <= 0.01 && st.demand > 10 ? 'bad' : ''; }
    else if (st.powerFactor < 0.98) { state = `power ${Math.floor(st.powerFactor * 100)}%`; cls = 'bad'; }
    else if (u < 0.9 && !Object.keys(B.in).length) { state = 'starting'; }
    else if (u < 0.9) {
      const starve = Object.keys(B.in).sort((x, y) => s.stock[x] - s.stock[y])[0];
      state = `${Math.floor(u * 100)}%, short of ${G.ITEMS[starve].name.toLowerCase()}`; cls = 'warn';
    } else {
      const k = outputOf(b); const r = n * G.speed(s, b) * B.out[k] / B.time;
      state = `${G.fmt(r)} ${G.ITEMS[k].name.toLowerCase()}/s`; cls = 'ok';
    }
    const se = $('.b-state', row); se.textContent = state; se.className = `b-state ${cls}`;
    row.classList.toggle('hint', !!adv && adv.b === b);
  }
  for (const row of document.querySelectorAll('.urow')) {
    const u = row.dataset.u; const btn = $('.buy', row);
    if (s.upgrades[u]) { btn.textContent = 'Done'; btn.disabled = true; row.classList.add('owned'); }
    else { btn.innerHTML = costHTML(G.UPGRADES[u].cost); btn.disabled = !G.canAfford(s, G.UPGRADES[u].cost); }
  }
  for (const d of document.querySelectorAll('.sitem')) {
    const k = d.dataset.k; const seen = s.made[k] > 0;
    d.hidden = !seen;
    $('.s-n', d).textContent = G.fmt(s.stock[k]);
    const r = st.rate[k] || 0;
    const re = $('.s-r', d); re.textContent = Math.abs(r) < 0.05 ? 'steady' : `${r > 0 ? '+' : ''}${G.fmt(r)}/s`;
    re.className = `s-r ${r < -0.05 ? 'neg' : r > 0.05 ? 'pos' : ''}`;
  }
  $('#clock').textContent = `Played ${G.fmtTime(s.playSeconds)}`;
}

function showSheet() {
  if (!sheetQueue.length || !$('#sheet').hidden) return;
  const m = sheetQueue.shift();
  $('#sheet h2').textContent = m.title; $('#sheet p').textContent = m.body;
  $('#sheet ul').innerHTML = (m.list || []).map((x) => `<li>${x}</li>`).join('');
  $('#sheetOk').textContent = m.ok || 'Carry on';
  $('#sheet').hidden = false;
}
$('#sheetOk').onclick = () => { $('#sheet').hidden = true; showSheet(); };

function phaseDone(prev) {
  if (s.phase >= G.PHASES.length) {
    sheetQueue.push({ title: 'The ring is whole', body: `All five segments are in. The rock leaves orbit after ${G.fmtTime(s.done)} of play.`, list: ['Ingots made: ' + G.fmt(s.made.ingot), 'Circuits made: ' + G.fmt(s.made.circuit), 'Motors made: ' + G.fmt(s.made.motor)], ok: 'Look at it' });
  } else {
    const fresh = G.BUILD_ORDER.filter((b) => G.BUILDINGS[b].phase === s.phase + 1).map((b) => G.BUILDINGS[b].name);
    const ups = Object.keys(G.UPGRADES).filter((u) => G.UPGRADES[u].phase === s.phase + 1).map((u) => G.UPGRADES[u].name + ' (research)');
    sheetQueue.push({ title: `${G.PHASES[prev].name} is in place`, body: `Next: ${G.PHASES[s.phase].name}. ${G.PHASES[s.phase].blurb}`, list: [...fresh.map((x) => 'New: ' + x), ...ups] });
  }
  showSheet();
}

$('#deliver').onclick = () => { const p = s.phase; if (G.deliver(s)) phaseDone(p); render(); save(); };
$('#tap').onclick = (e) => { G.tap(s); flash(e.currentTarget); render(); };
$('#reset').onclick = () => {
  if (!confirm('Start a new foundry? This one will be gone.')) return;
  localStorage.removeItem(KEY); s = G.newState(); shape = ''; render(); save();
};

load();
render();
showSheet();
let lastT = performance.now(); let acc = 0; let lastSave = 0; let lastRender = 0;
function frame(t) {
  const dt = Math.min(1, (t - lastT) / 1000); lastT = t; acc += dt;
  while (acc >= 0.25) { G.tick(s, 0.25); acc -= 0.25; }
  if (t - lastRender > 250) { render(); lastRender = t; }
  if (!window.__demo && t - lastSave > 5000) { save(); lastSave = t; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange', () => {
  if (window.__demo) return;
  if (document.hidden) save();
  else {
    const sum = G.catchUp(s, (Date.now() - s.saved) / 1000);
    lastT = performance.now();
    if (sum && sum.away > 60) { sheetQueue.push(awaySheet(sum)); showSheet(); }
    save();
  }
});
