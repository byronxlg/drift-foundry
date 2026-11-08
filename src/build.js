// Drift Foundry builder (preview, ?ui=build): a full-screen top-down map of the rock.
import * as G from './game.js';
import * as W from './world.js';

const KEY = 'drift-foundry/build';
const OLD = 'drift-foundry/save';
const N = W.N;
const $ = (sel, el = document) => el.querySelector(sel);
const params = new URLSearchParams(location.search);
const COL = {
  ore: '#b8735a', coal: '#7d838b', stone: '#c2ab84', quartz: '#a8e0dc', ingot: '#d4dde6', plate: '#5fa3e0',
  wire: '#e6a04a', concrete: '#b0a696', silica: '#7fd0bd', frame: '#a493f0', circuit: '#47c47f', motor: '#f06a55',
};
const T = { fog: '#0b0e10', rock: '#242c33', rock2: '#283139', seam: '#171c21', dim: '#121619', accent: '#ff9a2e', power: '#59c8ff', ok: '#6fdc8c', warn: '#ffc23d', bad: '#ff6b5b', ink: '#eef1f3', mute: '#a3afb9', metal: '#343e47', belt: '#3d464f' };
const KIND = { drill: 'x', coaldrill: 'x', quarry: 'x', quartzdrill: 'x', smelter: 'f', kiln: 'f', refinery: 'f', burner: 'g', turbine: 'g', solar: 's' };
const outItem = (b) => Object.keys(G.BUILDINGS[b].out)[0];
const colOf = (b) => (G.BUILDINGS[b].gen ? T.power : COL[outItem(b)]);
const BAND = 'Barlow Condensed, Barlow, system-ui, sans-serif';

// ---------- load and save ----------
let s; const sheetQueue = [];
function fresh() { s = G.newState(); s.world = W.newWorld(); W.recompute(s); }
function load() {
  const raw = localStorage.getItem(KEY);
  if (params.has('demo')) return demo(Number(params.get('demo')) || 3);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      s = G.deserialize(raw);
      try { s.world = W.loadWorld(parsed.world); W.recompute(s); } catch {
        W.layOut(s, parsed.built || {}, (parsed.world && parsed.world.seed) || undefined);
        sheetQueue.push({ title: 'Map rebuilt', body: 'The map part of the save could not be read, so your machines were laid out again around the Hub.' });
      }
    } catch {
      localStorage.setItem(KEY + '.broken.' + Date.now(), raw);
      fresh();
      sheetQueue.push({ title: 'Save could not be read', body: 'A fresh rock was surveyed. The old save was kept in this browser in case it can be recovered.' });
    }
  } else if (localStorage.getItem(OLD)) {
    try {
      const old = G.deserialize(localStorage.getItem(OLD));
      s = old; W.layOut(s, { ...old.built });
      sheetQueue.push({ title: 'Your foundry, on the map', body: 'Your list-screen save was laid out on the rock, every machine on a belt to the Hub. The list save is untouched.' });
    } catch { fresh(); }
  } else fresh();
  const sum = G.catchUp(s, (Date.now() - s.saved) / 1000);
  if (sum && sum.away > 60) sheetQueue.push(awaySheet(sum));
}
function save() { if (window.__demo) return; s.saved = Date.now(); localStorage.setItem(KEY, G.serialize(s)); }

// ?demo=1..4 seeds a factory for review; never touches a save
function demo(p) {
  s = G.newState();
  const plan = [
    { drill: 5, smelter: 4 },
    { drill: 14, smelter: 12, coaldrill: 4, burner: 5, press: 5, drawer: 5 },
    { drill: 22, smelter: 20, coaldrill: 9, burner: 6, press: 10, drawer: 12, quarry: 14, kiln: 9, assembler: 7, turbine: 5 },
    { drill: 36, smelter: 45, coaldrill: 12, burner: 6, press: 11, drawer: 24, quarry: 15, kiln: 10, assembler: 8, turbine: 22, quartzdrill: 8, refinery: 8, fabricator: 14 },
  ][Math.min(p, 4) - 1];
  s.phase = Math.min(p, 4) - 1;
  if (p >= 3) Object.assign(s.upgrades, { bits: true, hotblast: true, shifts: true });
  W.layOut(s, plan, 20261108);
  for (let i = 0; i < 900; i++) G.tick(s, 1);
  const P = G.PHASES[s.phase]; let k = 0;
  for (const it in P.need) s.delivered[it] = Math.floor(P.need[it] * [0.62, 0.38, 0.5][k++ % 3]);
  s.playSeconds = [240, 1500, 3600, 9000][Math.min(p, 4) - 1];
  window.__demo = true;
}

function awaySheet(sum) {
  const lines = Object.entries(sum.gained).sort((a, b) => G.ITEMS[b[0]].tier - G.ITEMS[a[0]].tier).slice(0, 6).map(([k, v]) => `${G.ITEMS[k].name} +${G.fmt(v)}`);
  const cap = sum.capped ? ` The shift counts ${G.fmtTime(sum.seconds)} of it${s.upgrades.shifts ? '' : '; Night shift raises that to 8 h'}.` : '';
  return { title: `Away ${G.fmtTime(sum.away)}`, body: `The foundry kept running.${cap}`, list: lines };
}

// ---------- frame ----------
document.body.innerHTML = `
<canvas id="map" aria-label="Map of the rock"></canvas>
<header class="hud">
  <div class="goal">
    <svg class="ring" viewBox="0 0 40 40" aria-hidden="true"></svg>
    <div class="seg"><b class="seg-name"></b><span class="seg-of"></span></div>
    <div class="pw" id="power"><span class="pw-num"></span><span class="pw-bar"><i></i></span></div>
  </div>
  <ul class="needs"></ul>
  <div class="act"><button class="advice" id="advice"><b>Next</b><span class="adv-text"></span><span class="adv-cost"></span></button><button class="deliver" id="deliver">Deliver</button></div>
</header>
<p class="hint" id="hint" hidden></p>
<div class="toast" id="toast" hidden></div>
<section class="drawer" id="drawer" hidden><div class="dr-body"></div></section>
<footer class="dock">
  <div class="tools">
    <button data-tool="" class="tool on">Inspect</button><button data-tool="belt" class="tool">Belt</button><button data-tool="pole" class="tool">Pole</button><button data-tool="remove" class="tool">Remove</button>
    <span class="gap"></span><button class="tool" id="resBtn">Research</button><button class="tool" id="menuBtn">Menu</button>
  </div>
  <div class="strip" id="strip"></div>
  <div class="cards" id="cards"></div>
</footer>
<div class="sheet" id="sheet" hidden><div class="sheet-card"><h2></h2><p></p><ul></ul><button class="btn primary" id="sheetOk">Carry on</button></div></div>`;

const cv = $('#map'); const ctx = cv.getContext('2d');
let vw = 0; let vh = 0; let dpr = 1;
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1); vw = innerWidth; vh = innerHeight;
  cv.width = vw * dpr; cv.height = vh * dpr; cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
}
addEventListener('resize', resize); resize();

// camera: x, y in tile units at the screen centre of the free area; z = CSS px per tile
const cam = { x: W.C + 0.5, y: W.C + 0.5, z: 28, tz: null };
function viewBox() { // the map area between HUD and dock
  const top = $('.hud').getBoundingClientRect().bottom; const bot = $('.dock').getBoundingClientRect().top;
  return { top, bot, cy: (top + bot) / 2 };
}
function fitZoom(R) { const v = viewBox(); return Math.max(18, Math.min(56, Math.min(vw, v.bot - v.top) / (2 * R + 2))); }
const toScreen = (tx, ty) => [(tx - cam.x) * cam.z + vw / 2, (ty - cam.y) * cam.z + viewBox().cy];
function toTile(px, py) { const v = viewBox(); const tx = Math.floor((px - vw / 2) / cam.z + cam.x); const ty = Math.floor((py - v.cy) / cam.z + cam.y); return tx < 0 || ty < 0 || tx >= N || ty >= N ? -1 : ty * N + tx; }
function centreOn(i) { cam.x = (i % N) + 0.5; cam.y = ((i / N) | 0) + 0.5; }

// ---------- state for the UI ----------
let tool = ''; // '' inspect, building key, 'belt', 'pole', 'remove'
let sel = -1; let drawer = ''; let beltPath = null; const flashes = []; const floaters = [];
function setTool(t) {
  tool = t; if (t) { sel = -1; if (drawer === 'inspect') closeDrawer(); }
  for (const b of document.querySelectorAll('.tool[data-tool]')) b.classList.toggle('on', b.dataset.tool === (G.BUILDINGS[t] ? '__' : t));
  for (const c of document.querySelectorAll('.card')) { c.classList.toggle('on', c.dataset.b === t); if (c.dataset.b === t) c.scrollIntoView({ inline: 'nearest', block: 'nearest' }); }
  renderHint();
}
function renderHint() {
  const h = $('#hint');
  const txt = G.BUILDINGS[tool] ? (W.EXTRACTS[tool] ? `Tap a lit ${G.ITEMS[W.EXTRACTS[tool]].name.toLowerCase()} node to place it.` : `Tap a lit tile to place a ${G.BUILDINGS[tool].name.toLowerCase()}. Brighter tiles are on the network and powered.`)
    : tool === 'belt' ? 'Drag from the Hub or a machine to lay belt. Two fingers to move the map.'
      : tool === 'pole' ? 'Tap inside the blue reach to extend power. Poles are free.'
        : tool === 'remove' ? 'Tap a machine, belt or pole to remove it. Machines refund half.' : '';
  h.hidden = !txt; h.innerHTML = txt ? `<span>${txt}</span><button class="x" aria-label="Done">Done</button>` : '';
  if (txt) $('.x', h).onclick = () => setTool('');
}
function toast(msg, bad) { const t = $('#toast'); t.textContent = msg; t.className = 'toast' + (bad ? ' bad' : ''); t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2200); }
const swatch = (k) => `<i class="sw" style="background:${COL[k]}"></i>`;
const costHTML = (cost) => Object.entries(cost).map(([k, v]) => `<span class="c${s.stock[k] >= v ? '' : ' short'}">${swatch(k)}${G.fmt(v)}</span>`).join('') || '<span class="c">free</span>';

// ---------- status ----------
function status(it) {
  const B = G.BUILDINGS[it.b]; const st = s.stats; const u = st.util[it.b] ?? 0;
  if (it.st === 'off') return ['Stood by', 'idle'];
  if (it.st === 'unlinked') return ['Not on a belt to the Hub', 'bad'];
  if (it.st === 'nopower') return ['Outside power reach', 'bad'];
  if (B.gen) return B.in.coal && u <= 0.01 && st.demand > G.CORE_MW && s.stock.coal < 1 ? ['No coal', 'bad'] : [`Running, up to ${B.gen} MW`, 'ok'];
  if (st.powerFactor < 0.98) return [`Power short, running at ${Math.floor(st.powerFactor * 100)}%`, 'warn'];
  const ins = Object.keys(B.in);
  if (ins.length && u < 0.9) { const k = ins.sort((x, y) => s.stock[x] / B.in[x] - s.stock[y] / B.in[y])[0]; return [`Starved: short of ${G.ITEMS[k].name.toLowerCase()} (${Math.floor(u * 100)}%)`, 'warn']; }
  return ['Running', 'ok'];
}
const stColour = { ok: T.ok, warn: T.warn, bad: T.bad, idle: T.mute };

// ---------- advice ----------
const producerOf = {};
for (const b of G.BUILD_ORDER) for (const k of Object.keys(G.BUILDINGS[b].out)) producerOf[k] ??= b;
function advice() {
  if (s.phase >= G.PHASES.length) return null;
  const items = s.world.items;
  const unl = items.filter((it) => it.st === 'unlinked');
  if (unl.length) return { kind: 'belt', at: unl[0].i, why: `${unl.length} machine${unl.length > 1 ? 's are' : ' is'} not on a belt to the Hub. Draw one.` };
  const np = items.filter((it) => it.st === 'nopower');
  if (np.length) return { kind: 'pole', at: np[0].i, why: `${np.length} machine${np.length > 1 ? 's are' : ' is'} outside power reach. Place a pole.` };
  if (!s.placed.drill && s.stock.ore < 10) return { kind: 'dig', why: `Tap an ore node to dig. ${G.fmt(s.stock.ore)} of 10 ore for a drill.` };
  const st = s.stats;
  if (G.unlockedPhase(s) >= 2 && (st.powerFactor < 0.98 || st.demand > G.powerCapacity(s) * 0.95)) {
    const gen = ['solar', 'turbine', 'burner'].find((g) => G.isBuildingUnlocked(s, g));
    const fuel = G.BUILDINGS[gen].in.coal && st.demand < G.powerCapacity(s) && s.stock.coal < 5;
    return fuel ? { kind: 'build', b: 'coaldrill', why: 'Generators are out of coal.' } : { kind: 'build', b: gen, why: `Power is short: ${G.fmt(st.demand)} of ${G.fmt(G.powerCapacity(s))} MW.` };
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
  return { kind: 'build', b, why };
}
// the tile advice points at: a valid one on the network and in reach, nearest the Hub
function goodTile(b) {
  const d = W.derived(s); let best = -1; let bs = Infinity;
  for (let i = 0; i < N * N; i++) {
    if (W.whyNot(s, b, i)) continue;
    const linked = W.neighbours(i).some((j) => d.conn[j]);
    const sc = W.dist(i) + (linked ? 0 : 30) + (G.BUILDINGS[b].power && !d.cov[i] ? 30 : 0);
    if (sc < bs) { bs = sc; best = i; }
  }
  return best;
}
function followAdvice() {
  const a = advice(); if (!a) return;
  if (a.kind === 'build') { setTool(a.b); const t = goodTile(a.b); if (t >= 0) { glide(t); flashes.push({ i: t, c: T.accent, t: performance.now() }); } }
  else if (a.kind === 'belt') { setTool('belt'); glide(a.at); flashes.push({ i: a.at, c: T.bad, t: performance.now() }); }
  else if (a.kind === 'pole') { setTool('pole'); glide(a.at); flashes.push({ i: a.at, c: T.power, t: performance.now() }); }
  else if (a.kind === 'dig') { setTool(''); const t = nearestNode('ore'); if (t >= 0) { glide(t); flashes.push({ i: t, c: T.accent, t: performance.now() }); } }
}
function nearestNode(item) { let best = -1; for (let i = 0; i < N * N; i++) if (W.nodeAt(s, i) === item && W.revealed(s, i) && W.derived(s).occ[i] === -1 && (best < 0 || W.dist(i) < W.dist(best))) best = i; return best; }
let glideTo = null;
function glide(i) {
  const [px, py] = toScreen((i % N) + 0.5, ((i / N) | 0) + 0.5); const v = viewBox();
  if (px > 30 && px < vw - 30 && py > v.top + 30 && py < v.bot - 30) return;
  glideTo = { x: (i % N) + 0.5, y: ((i / N) | 0) + 0.5 };
}

// ---------- HUD ----------
let shape = '';
function rebuildCards() {
  const el = $('#cards'); el.innerHTML = '';
  for (const b of G.BUILD_ORDER) {
    if (!G.isBuildingUnlocked(s, b)) continue;
    const B = G.BUILDINGS[b];
    const c = document.createElement('button'); c.className = 'card'; c.dataset.b = b;
    c.innerHTML = `<span class="ic" style="--c:${colOf(b)}" data-k="${KIND[b] || 'm'}"></span><span class="nm">${B.name}</span><span class="n"></span><span class="cost"></span>`;
    c.onclick = () => setTool(tool === b ? '' : b);
    el.append(c);
  }
  const ring = $('.ring'); let out = '';
  for (let i = 0; i < 5; i++) {
    const a0 = (i / 5) * 360 - 90 + 4; const a1 = ((i + 1) / 5) * 360 - 90 - 4;
    const p = (a) => [20 + 15 * Math.cos((a * Math.PI) / 180), 20 + 15 * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = p(a0); const [x1, y1] = p(a1);
    const d = `M${x0.toFixed(2)} ${y0.toFixed(2)} A15 15 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
    out += `<path class="trk" d="${d}"/><path class="arc a${i}" d="${d}" pathLength="100"/>`;
  }
  ring.innerHTML = out;
  setTool(tool);
}

function render() {
  const sig = `${s.phase}`;
  if (sig !== shape) { shape = sig; rebuildCards(); }
  const st = s.stats; const done = s.phase >= G.PHASES.length;
  const cap = G.powerCapacity(s);
  $('#power .pw-num').textContent = `${G.fmt(st.demand)} / ${G.fmt(cap)} MW`;
  $('#power i').style.width = `${Math.min(100, (st.demand / cap) * 100)}%`;
  $('#power').classList.toggle('short', st.powerFactor < 0.98);
  const P = G.PHASES[Math.min(s.phase, 4)];
  $('.seg-name').textContent = done ? 'Ring complete' : P.name;
  const rem = G.remaining(s); const gross = G.grossRates(s);
  let tot = 0; let have = 0; let html = '';
  for (const [k, need] of Object.entries(done ? {} : P.need)) {
    const got = need - rem[k]; tot += need; have += got;
    const inStock = Math.min(Math.floor(s.stock[k]), rem[k]);
    const r = gross[k];
    const sub = rem[k] <= 0 ? 'delivered' : inStock >= rem[k] ? 'ready to deliver' : r > 0.001 ? `+${G.fmt(r)}/s, ${G.fmt(s.stock[k])} held` : 'not being made';
    html += `<li class="${rem[k] <= 0 ? 'met' : r <= 0.001 && inStock < rem[k] ? 'none' : ''}">${swatch(k)}<span class="nn">${G.ITEMS[k].name}</span><span class="nv">${G.fmt(got)}<small>/${G.fmt(need)}</small></span>
      <span class="nb"><i style="width:${(got / need) * 100}%"></i><b style="width:${(Math.min(need, got + inStock) / need) * 100}%"></b></span><span class="ns">${sub}</span></li>`;
  }
  $('.needs').innerHTML = html; $('.needs').dataset.n = Object.keys(done ? {} : P.need).length;
  const frac = done ? 1 : tot ? have / tot : 0;
  $('.seg-of').textContent = done ? `Built in ${G.fmtTime(s.done)}` : `Segment ${s.phase + 1} of 5, ${Math.floor(frac * 100)}% in`;
  for (let i = 0; i < 5; i++) { const f = i < s.phase ? 1 : i === s.phase ? frac : 0; const a = $(`.a${i}`); a.style.strokeDasharray = `${f * 100} 100`; }
  const deliverable = Object.entries(rem).some(([k, v]) => v > 0 && s.stock[k] >= 1);
  $('#deliver').disabled = !deliverable; $('#deliver').hidden = done;
  const adv = advice(); const ab = $('#advice');
  ab.hidden = !adv;
  if (adv) {
    ab.className = `advice k-${adv.kind}`;
    const short = adv.kind === 'build' ? W.shortOf(s, G.buildingCost(s, adv.b)) : '';
    $('.adv-text', ab).textContent = adv.kind === 'build' ? `${G.BUILDINGS[adv.b].name}. ${adv.why}${short ? ' ' + short : ''}` : adv.why;
    $('.adv-cost', ab).innerHTML = adv.kind === 'build' ? costHTML(G.buildingCost(s, adv.b)) : '';
  }
  for (const c of document.querySelectorAll('.card')) {
    const b = c.dataset.b; const cost = G.buildingCost(s, b);
    $('.cost', c).innerHTML = costHTML(cost); $('.n', c).textContent = s.placed[b] ? `x${s.placed[b]}` : '';
    c.classList.toggle('poor', !G.canAfford(s, cost)); c.classList.toggle('adv', !!adv && adv.b === b);
  }
  $('#strip').innerHTML = Object.keys(G.ITEMS).filter((k) => s.made[k] > 0 || s.stock[k] > 0).map((k) => {
    const r = s.stats.rate[k] || 0;
    return `<span class="si">${swatch(k)}<b>${G.fmt(s.stock[k])}</b><em class="${r < -0.05 ? 'neg' : r > 0.05 ? 'pos' : ''}">${Math.abs(r) < 0.05 ? '' : (r > 0 ? '+' : '') + G.fmt(r) + '/s'}</em></span>`; }).join('') || '<span class="si">Hub stock shows here</span>';
  $('.tool[data-tool="pole"]').hidden = !W.isPoleUnlocked(s);
  $('#resBtn').hidden = !Object.keys(G.UPGRADES).some((u) => G.isUpgradeUnlocked(s, u));
  const rs = document.documentElement.style;
  rs.setProperty('--dock', `${vh - $('.dock').getBoundingClientRect().top}px`); rs.setProperty('--hudh', `${$('.hud').getBoundingClientRect().bottom}px`);
  if (drawer) renderDrawer();
}

// ---------- drawers: inspect, stock, research, menu ----------
function openDrawer(kind) { drawer = kind; $('#drawer').hidden = false; renderDrawer(true); }
function closeDrawer() { drawer = ''; sel = -1; $('#drawer').hidden = true; }
let drawerSig = '';
function renderDrawer(force) {
  const body = $('#drawer .dr-body'); const d = W.derived(s);
  let sig = drawer + sel; let html = '';
  if (drawer === 'inspect') {
    const o = d.occ[sel];
    if (o >= 0) {
      const it = s.world.items[o]; const B = G.BUILDINGS[it.b]; const [txt, cls] = status(it);
      const per = it.st === 'on' ? G.speed(s, it.b) * (s.stats.util[it.b] ?? 0) * (B.gen ? 1 : s.stats.powerFactor) / B.time : 0;
      const ins = Object.entries(B.in).map(([k, v]) => `${swatch(k)}${G.fmt(v * per)} ${G.ITEMS[k].name.toLowerCase()}`).join(' + ');
      const outs = B.gen ? `${B.gen} MW` : Object.entries(B.out).map(([k, v]) => `${swatch(k)}${G.fmt(v * per)} ${G.ITEMS[k].name.toLowerCase()}`).join('');
      sig += it.st + cls + txt;
      html = `<div class="dh"><span class="ic" style="--c:${colOf(it.b)}" data-k="${KIND[it.b] || 'm'}"></span><div><h2>${B.name}</h2><p class="st ${cls}">${txt}</p></div><button class="x" data-a="close" aria-label="Close">Close</button></div>
        <p class="rate">${ins ? ins + ' <span class="to">to</span> ' : ''}${outs}${B.gen ? '' : ' a second'}${B.power ? `, uses ${B.power} MW` : ''}</p>
        ${it.st === 'unlinked' ? '<p class="fix">Draw a belt from this machine to the Hub, or to any machine or belt that reaches it.</p>' : ''}
        ${it.st === 'nopower' ? '<p class="fix">Place a pole inside the blue reach, toward this machine. Poles chain.</p>' : ''}
        <div class="row"><button class="btn" data-a="off">${it.off ? 'Start' : 'Stand by'}</button><button class="btn danger" data-a="demolish">Demolish <span class="cost">${costHTML(W.refundOf(s, it.b)).replace(/ short/g, '')}</span> back</button></div>`;
    } else if (o === -2) {
      sig += Math.floor(s.playSeconds);
      html = `<div class="dh"><span class="ic hub"></span><div><h2>Hub</h2><p class="st ok">Holds everything the factory makes</p></div><button class="x" data-a="close">Close</button></div>${stockGrid()}`;
    } else if (o === -3) {
      html = `<div class="dh"><span class="ic belt"></span><div><h2>Belt</h2><p class="st ${d.conn[sel] ? 'ok' : 'bad'}">${d.conn[sel] ? 'Carries to the Hub' : 'Not joined to the Hub'}</p></div><button class="x" data-a="close">Close</button></div><div class="row"><button class="btn danger" data-a="demolish">Remove belt</button></div>`;
    } else if (o === -4) {
      const live = d.live.has(sel);
      html = `<div class="dh"><span class="ic pole"></span><div><h2>Power pole</h2><p class="st ${live ? 'ok' : 'bad'}">${live ? 'Live, reach 5 tiles' : 'Not live: out of reach of the grid'}</p></div><button class="x" data-a="close">Close</button></div><div class="row"><button class="btn danger" data-a="demolish">Remove pole</button></div>`;
    } else { closeDrawer(); return; }
  } else if (drawer === 'stock') {
    sig += Math.floor(s.playSeconds);
    html = `<div class="dh"><div><h2>Stock in the Hub</h2><p class="st">Net rate per second</p></div><button class="x" data-a="close">Close</button></div>${stockGrid()}`;
  } else if (drawer === 'research') {
    sig += Math.floor(s.playSeconds);
    html = `<div class="dh"><div><h2>Research</h2><p class="st">One-off upgrades, paid from the Hub</p></div><button class="x" data-a="close">Close</button></div><div class="ups">` +
      Object.keys(G.UPGRADES).filter((u) => G.isUpgradeUnlocked(s, u)).map((u) => { const U = G.UPGRADES[u];
        return `<div class="up"><div><b>${U.name}</b><span>${U.text}</span></div>${s.upgrades[u] ? '<span class="done">Done</span>' : `<button class="btn" data-a="buy" data-u="${u}" ${G.canAfford(s, U.cost) ? '' : 'disabled'}>${costHTML(U.cost)}</button>`}</div>`; }).join('') + '</div>';
  } else if (drawer === 'menu') {
    html = `<div class="dh"><div><h2>Drift Foundry</h2><p class="st">Played ${G.fmtTime(s.playSeconds)}. Builder preview.</p></div><button class="x" data-a="close">Close</button></div>
      ${stockGrid()}<div class="row" style="margin-top:12px"><a class="btn" href="./">List screens</a><button class="btn danger" data-a="reset">New game</button></div>`;
    sig += Math.floor(s.playSeconds);
  }
  if (!force && sig === drawerSig) return;
  drawerSig = sig; body.innerHTML = html;
}
function stockGrid() {
  return '<div class="stock">' + Object.keys(G.ITEMS).filter((k) => s.made[k] > 0).map((k) => {
    const r = s.stats.rate[k] || 0;
    return `<div>${swatch(k)}<span>${G.ITEMS[k].name}</span><b>${G.fmt(s.stock[k])}</b><em class="${r < -0.05 ? 'neg' : r > 0.05 ? 'pos' : ''}">${Math.abs(r) < 0.05 ? 'steady' : (r > 0 ? '+' : '') + G.fmt(r)}</em></div>`; }).join('') + '</div>';
}
$('#drawer').addEventListener('click', (e) => {
  const a = e.target.closest('[data-a]'); if (!a) return;
  const act = a.dataset.a;
  if (act === 'close') closeDrawer();
  else if (act === 'off') { const it = s.world.items[W.derived(s).occ[sel]]; W.setOff(s, sel, !it.off); renderDrawer(true); }
  else if (act === 'demolish') {
    if (!a.dataset.armed && W.derived(s).occ[sel] >= 0) { a.dataset.armed = '1'; a.innerHTML = 'Tap again to demolish'; a.classList.add('armed'); return; }
    W.demolish(s, sel); toast('Removed'); closeDrawer();
  }
  else if (act === 'buy') { G.buyUpgrade(s, a.dataset.u); renderDrawer(true); }
  else if (act === 'reset') { if (confirm('Start a new rock? This foundry will be gone.')) { localStorage.removeItem(KEY); fresh(); shape = ''; closeDrawer(); frame0(); save(); } }
  render(); save();
});
$('#resBtn').onclick = () => (drawer === 'research' ? closeDrawer() : openDrawer('research'));
$('#menuBtn').onclick = () => (drawer === 'menu' ? closeDrawer() : openDrawer('menu'));
for (const b of document.querySelectorAll('.tool[data-tool]')) b.onclick = () => setTool(b.dataset.tool);
$('#advice').onclick = followAdvice;

// ---------- sheets ----------
function showSheet() {
  if (!sheetQueue.length || !$('#sheet').hidden) return;
  const m = sheetQueue.shift();
  $('#sheet h2').textContent = m.title; $('#sheet p').textContent = m.body;
  $('#sheet ul').innerHTML = (m.list || []).map((x) => `<li>${x}</li>`).join('');
  $('#sheetOk').textContent = m.ok || 'Carry on';
  $('#sheet').hidden = false;
}
$('#sheetOk').onclick = () => { $('#sheet').hidden = true; showSheet(); };
const NEW_NODES = { 1: 'Coal and more ore surveyed', 2: 'Stone, ore and coal surveyed', 3: 'Quartz surveyed', 4: 'The far rim surveyed: ore, coal, stone, quartz' };
function phaseDone(prev) {
  W.recompute(s);
  if (s.phase >= G.PHASES.length) {
    sheetQueue.push({ title: 'The ring is whole', body: `All five segments are in. The rock leaves orbit after ${G.fmtTime(s.done)} of play.`, list: ['Ingots made: ' + G.fmt(s.made.ingot), 'Circuits made: ' + G.fmt(s.made.circuit), 'Motors made: ' + G.fmt(s.made.motor)], ok: 'Look at it' });
  } else {
    const fresh2 = G.BUILD_ORDER.filter((b) => G.BUILDINGS[b].phase === s.phase + 1).map((b) => 'New: ' + G.BUILDINGS[b].name);
    if (s.phase === 1) fresh2.push('New: Power pole');
    const ups = Object.keys(G.UPGRADES).filter((u) => G.UPGRADES[u].phase === s.phase + 1).map((u) => G.UPGRADES[u].name + ' (research)');
    sheetQueue.push({ title: `${G.PHASES[prev].name} is in place`, body: `${NEW_NODES[s.phase] || ''}: the rock is open to ${Math.floor(W.revealR(s))} tiles. Next: ${G.PHASES[s.phase].name}. ${G.PHASES[s.phase].blurb}`, list: [...fresh2, ...ups] });
    cam.tz = fitZoom(W.revealR(s)); glide(W.C * N + W.C);
  }
  showSheet();
}
$('#deliver').onclick = () => { const p = s.phase; if (G.deliver(s)) phaseDone(p); render(); save(); };

// ---------- input ----------
const ptrs = new Map(); let gesture = null;
cv.addEventListener('contextmenu', (e) => e.preventDefault());
cv.addEventListener('pointerdown', (e) => {
  cv.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { beltPath = null; const [a, b] = [...ptrs.values()]; gesture = { kind: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; return; }
  gesture = { kind: 'maybe', x: e.clientX, y: e.clientY, t: performance.now(), pan: e.button === 1 || e.button === 2, cx: cam.x, cy: cam.y, tile: toTile(e.clientX, e.clientY) };
  if (tool === 'belt' && !gesture.pan) { gesture.kind = 'belt'; beltPath = gesture.tile >= 0 ? [gesture.tile] : []; }
});
cv.addEventListener('pointermove', (e) => {
  if (!ptrs.has(e.pointerId)) { if (e.pointerType === 'mouse') hover = toTile(e.clientX, e.clientY); return; }
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!gesture) return;
  if (gesture.kind === 'pinch' && ptrs.size === 2) {
    const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
    const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2;
    cam.x -= (mx - gesture.mx) / cam.z; cam.y -= (my - gesture.my) / cam.z; gesture.mx = mx; gesture.my = my;
    zoomAt(mx, my, Math.max(14, Math.min(72, gesture.z * d / gesture.d)));
    return;
  }
  const moved = Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y);
  if (gesture.kind === 'belt') {
    const t = toTile(e.clientX, e.clientY); if (t < 0 || !beltPath.length) { if (t >= 0) beltPath.push(t); return; }
    let last = beltPath[beltPath.length - 1];
    while (last !== t) {
      const lx = last % N; const ly = (last / N) | 0; const tx = t % N; const ty = (t / N) | 0;
      const step = lx !== tx ? last + Math.sign(tx - lx) : last + Math.sign(ty - ly) * N;
      if (beltPath.length > 1 && beltPath[beltPath.length - 2] === step) beltPath.pop(); else beltPath.push(step);
      last = step;
    }
    return;
  }
  if (gesture.kind === 'maybe' && moved > 7) gesture.kind = 'pan';
  if (gesture.kind === 'pan') { cam.x = gesture.cx - (e.clientX - gesture.x) / cam.z; cam.y = gesture.cy - (e.clientY - gesture.y) / cam.z; glideTo = null; }
});
function endPtr(e) {
  if (cv.hasPointerCapture(e.pointerId)) cv.releasePointerCapture(e.pointerId);
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (!gesture) return;
  if (gesture.kind === 'pinch') { if (ptrs.size === 0) gesture = null; else gesture = { kind: 'done' }; return; }
  if (gesture.kind === 'belt' && beltPath) {
    if (beltPath.length === 1 && e.type === 'pointerup') tapTile(beltPath[0]);
    else { const n = W.placeBelts(s, beltPath); if (n) { afterChange(); toast(`${n} belt tile${n > 1 ? 's' : ''} laid`); } }
    beltPath = null;
  } else if (gesture.kind === 'maybe' && e.type === 'pointerup' && !gesture.pan) tapTile(gesture.tile);
  gesture = null;
}
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
let hover = -1;
cv.addEventListener('pointerleave', () => { hover = -1; });
cv.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, Math.max(14, Math.min(72, cam.z * Math.exp(-e.deltaY * 0.0015)))); }, { passive: false });
function zoomAt(px, py, z) {
  const v = viewBox(); const wx = (px - vw / 2) / cam.z + cam.x; const wy = (py - v.cy) / cam.z + cam.y;
  cam.z = z; cam.x = wx - (px - vw / 2) / z; cam.y = wy - (py - v.cy) / z; cam.tz = null;
}
addEventListener('keydown', (e) => { if (e.key === 'Escape') { setTool(''); closeDrawer(); } });

function afterChange() { render(); save(); }
function tapTile(i) {
  if (i < 0) return;
  const d = W.derived(s); const now = performance.now();
  if (G.BUILDINGS[tool] || tool === 'pole') {
    const r = W.place(s, tool, i);
    if (r.ok) { flashes.push({ i, c: T.ok, t: now }); afterChange(); const it = s.world.items.find((x) => x.i === i); if (it && it.st !== 'on') toast(status(it)[0], true); }
    else { flashes.push({ i, c: T.bad, t: now }); toast(r.why, true); }
    return;
  }
  if (tool === 'belt') { if (W.placeBelts(s, [i])) afterChange(); else toast(!W.revealed(s, i) ? 'Not surveyed yet.' : W.nodeAt(s, i) ? 'Keep nodes for drills: belts go on bare rock.' : 'Something is already there.', true); return; }
  if (tool === 'remove') {
    const o = d.occ[i]; const what = o >= 0 ? G.BUILDINGS[s.world.items[o].b].name : o === -3 ? 'Belt' : o === -4 ? 'Pole' : '';
    if (o >= 0) { const back = W.refundOf(s, s.world.items[o].b); W.demolish(s, i); toast(`${what} removed, ${Object.entries(back).map(([k, v]) => `${G.fmt(v)} ${G.ITEMS[k].name.toLowerCase()}`).join(', ')} back`); }
    else if (what) { W.demolish(s, i); toast(`${what} removed`); }
    else toast('Nothing to remove there.', true);
    afterChange(); return;
  }
  const o = d.occ[i]; const node = W.nodeAt(s, i);
  if (o !== -1) { sel = o === -2 ? W.C * N + W.C : i; openDrawer('inspect'); return; }
  if (node && W.revealed(s, i)) {
    s.stock[node] += G.TAP_ORE; s.made[node] += G.TAP_ORE;
    floaters.push({ i, text: `+1 ${G.ITEMS[node].name.toLowerCase()}`, t: now, c: COL[node] }); render(); return;
  }
  if (drawer) closeDrawer();
}

// ---------- drawing ----------
function hash(i) { let x = i * 2654435761 >>> 0; x ^= x >>> 13; return (x & 255) / 255; }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
// belt feed colours: each running producer marks the belt path it ships along
function feeds() {
  const d = W.derived(s); const col = new Map();
  for (const it of s.world.items) {
    if (it.st !== 'on' || G.BUILDINGS[it.b].gen) continue;
    if ((s.stats.util[it.b] ?? 0) < 0.05) continue;
    const c = COL[outItem(it.b)];
    for (let j of W.neighbours(it.i)) {
      for (let k = 0; k < 80 && j >= 0 && d.occ[j] === -3 && !col.has(j); k++) { col.set(j, c); j = d.next[j]; }
    }
  }
  return col;
}
let feedCache = null; let feedAt = 0;
function draw(now) {
  const d = W.derived(s); const z = cam.z; const R = d.R;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = T.fog; ctx.fillRect(0, 0, vw, vh);
  const v = viewBox();
  const x0 = Math.max(0, Math.floor(cam.x - vw / 2 / z) - 1); const x1 = Math.min(N - 1, Math.ceil(cam.x + vw / 2 / z) + 1);
  const y0 = Math.max(0, Math.floor(cam.y - v.cy / z) - 1); const y1 = Math.min(N - 1, Math.ceil(cam.y + (vh - v.cy) / z) + 1);
  const nextR = W.REVEAL[Math.min(s.phase + 1, W.REVEAL.length - 1)];
  const placing = G.BUILDINGS[tool] ? tool : tool === 'pole' ? 'pole' : '';
  const showCov = placing === 'pole' || (placing && G.BUILDINGS[placing].power) || (drawer === 'inspect' && sel >= 0 && (d.occ[sel] === -4 || (d.occ[sel] >= 0 && (G.BUILDINGS[s.world.items[d.occ[sel]].b].gen || s.world.items[d.occ[sel]].st === 'nopower'))));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * N + x; const dist = W.dist(i); const [sx, sy] = toScreen(x, y);
    const node = d.grid[i];
    if (dist > R) {
      if (dist <= nextR) { ctx.fillStyle = T.dim; ctx.fillRect(sx + 0.5, sy + 0.5, z - 1, z - 1);
        if (node) { ctx.fillStyle = COL[W.ITEM_OF[node]]; ctx.globalAlpha = 0.18; ctx.fillRect(sx + z * 0.3, sy + z * 0.3, z * 0.4, z * 0.4); ctx.globalAlpha = 1; } }
      continue;
    }
    ctx.fillStyle = hash(i) > 0.7 ? T.rock2 : T.rock; ctx.fillRect(sx + 0.5, sy + 0.5, z - 1, z - 1);
    if (showCov && d.cov[i]) { ctx.fillStyle = 'rgba(89,200,255,0.10)'; ctx.fillRect(sx + 0.5, sy + 0.5, z - 1, z - 1); }
    if (node) {
      const c = COL[W.ITEM_OF[node]];
      ctx.fillStyle = c; ctx.globalAlpha = 0.22; ctx.fillRect(sx + 1, sy + 1, z - 2, z - 2); ctx.globalAlpha = 0.9;
      const h = hash(i + 7);
      for (let k = 0; k < 3; k++) { const px = sx + z * (0.25 + ((h * (k + 3) * 7) % 0.5)); const py = sy + z * (0.28 + k * 0.2); const r = z * (0.07 + 0.04 * ((h * (k + 1) * 13) % 1));
        ctx.beginPath(); ctx.moveTo(px, py - r); ctx.lineTo(px + r, py); ctx.lineTo(px, py + r); ctx.lineTo(px - r, py); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (placing && d.occ[i] === -1 && !W.whyNot(s, placing, i)) {
      const good = W.neighbours(i).some((j) => d.conn[j]) && (placing === 'pole' || !G.BUILDINGS[placing].power || d.cov[i]);
      ctx.strokeStyle = T.accent; ctx.globalAlpha = good ? 0.95 : 0.4; ctx.lineWidth = good ? 2 : 1;
      ctx.strokeRect(sx + 2.5, sy + 2.5, z - 5, z - 5);
      if (good) { ctx.fillStyle = 'rgba(255,154,46,0.16)'; ctx.fillRect(sx + 2.5, sy + 2.5, z - 5, z - 5); }
      ctx.globalAlpha = 1;
    }
  }
  // survey edges
  const [cx, cy] = toScreen(W.C + 0.5, W.C + 0.5);
  ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5;
  if (s.phase < G.PHASES.length - 1) {
    ctx.strokeStyle = 'rgba(255,154,46,0.35)'; ctx.beginPath(); ctx.arc(cx, cy, (nextR + 0.5) * z, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,154,46,0.8)'; ctx.font = `600 ${Math.max(12, z * 0.42)}px ${BAND}`; ctx.textAlign = 'center';
    ctx.fillText(`Surveyed when ${G.PHASES[s.phase].name} is in`, cx, cy - (nextR + 0.9) * z);
  }
  ctx.setLineDash([]);
  if (showCov) { ctx.strokeStyle = 'rgba(89,200,255,0.55)'; ctx.lineWidth = 1; for (const src of d.sources) { const [px, py] = toScreen((src.i % N) + 0.5, ((src.i / N) | 0) + 0.5); ctx.beginPath(); ctx.arc(px, py, src.r * z, 0, Math.PI * 2); ctx.stroke(); } }
  // belts
  if (!feedCache || now - feedAt > 500) { feedCache = feeds(); feedAt = now; }
  const bw = z * 0.4;
  ctx.lineCap = 'round';
  const centre = (i) => toScreen((i % N) + 0.5, ((i / N) | 0) + 0.5);
  for (const i of s.world.belts) {
    const [ax, ay] = centre(i);
    if (ax < -z || ay < -z || ax > vw + z || ay > vh + z) continue;
    ctx.strokeStyle = d.conn[i] ? T.belt : '#4a2a2a'; ctx.lineWidth = bw;
    ctx.beginPath(); ctx.moveTo(ax, ay);
    let joined = false;
    for (const j of W.neighbours(i)) {
      const oj = d.occ[j];
      if (oj === -3 || oj >= 0 || (oj === -2 && d.next[i] === j)) { const [bx, by] = centre(j); ctx.moveTo(ax, ay); ctx.lineTo((ax + bx) / 2, (ay + by) / 2); joined = true; }
    }
    if (!joined) ctx.lineTo(ax + 0.1, ay);
    ctx.stroke();
  }
  // belt edges and items
  for (const i of s.world.belts) {
    const nx = d.next[i]; const [ax, ay] = centre(i);
    if (ax < -z || ay < -z || ax > vw + z || ay > vh + z || nx < 0) continue;
    const [bx, by] = centre(nx);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
    const ux = (bx - ax) / z; const uy = (by - ay) / z; const m = z * 0.12;
    ctx.beginPath(); ctx.moveTo(ax - ux * m - uy * m, ay - uy * m + ux * m); ctx.lineTo(ax + ux * m * 0.6, ay + uy * m * 0.6); ctx.lineTo(ax - ux * m + uy * m, ay - uy * m - ux * m); ctx.stroke();
    const c = feedCache.get(i);
    if (!c) continue;
    ctx.fillStyle = c;
    for (let k = 0; k < 2; k++) {
      const f = ((now / 1000) * 1.3 + k / 2 + hash(i) * 0.01) % 1;
      const px = ax + (bx - ax) * f; const py = ay + (by - ay) * f;
      ctx.fillRect(px - z * 0.09, py - z * 0.09, z * 0.18, z * 0.18);
    }
  }
  // belt being drawn
  if (beltPath && beltPath.length) {
    for (const i of beltPath) { const [px, py] = toScreen(i % N, (i / N) | 0); const ok = W.revealed(s, i) && d.occ[i] === -1 && !d.grid[i];
      ctx.fillStyle = ok ? 'rgba(255,154,46,0.55)' : 'rgba(255,107,91,0.35)'; ctx.fillRect(px + z * 0.25, py + z * 0.25, z * 0.5, z * 0.5); }
  }
  // hub
  {
    const [hx, hy] = toScreen(W.C - 1, W.C - 1);
    ctx.fillStyle = '#2b2218'; rr(hx + 2, hy + 2, z * 3 - 4, z * 3 - 4, z * 0.3); ctx.fill();
    ctx.strokeStyle = T.accent; ctx.lineWidth = 2; ctx.stroke();
    const P = G.PHASES[Math.min(s.phase, 4)]; const rem = G.remaining(s);
    let tot = 0; let have = 0; for (const k in P.need) { tot += P.need[k]; have += P.need[k] - (rem[k] ?? 0); }
    const frac = s.phase >= 5 ? 1 : have / tot;
    ctx.lineWidth = z * 0.28; ctx.lineCap = 'butt';
    for (let k = 0; k < 5; k++) {
      const a0 = (k / 5) * Math.PI * 2 - Math.PI / 2 + 0.09; const a1 = ((k + 1) / 5) * Math.PI * 2 - Math.PI / 2 - 0.09;
      ctx.strokeStyle = '#4a3a26'; ctx.beginPath(); ctx.arc(cx, cy, z * 0.95, a0, a1); ctx.stroke();
      const f = k < s.phase ? 1 : k === s.phase ? frac : 0;
      if (f > 0) { ctx.strokeStyle = T.accent; ctx.beginPath(); ctx.arc(cx, cy, z * 0.95, a0, a0 + (a1 - a0) * f); ctx.stroke(); }
    }
    ctx.fillStyle = T.ink; ctx.font = `700 ${Math.max(10, z * 0.36)}px ${BAND}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('HUB', cx, cy); ctx.textBaseline = 'alphabetic';
  }
  // buildings
  ctx.lineCap = 'round';
  for (const it of s.world.items) {
    const x = it.i % N; const y = (it.i / N) | 0;
    if (x < x0 || x > x1 || y < y0 || y > y1) continue;
    drawBuilding(it, ...toScreen(x, y), z, now);
  }
  for (const p of s.world.poles) {
    const [px, py] = centre(p); const live = d.live.has(p);
    ctx.fillStyle = live ? T.power : '#55606a'; ctx.strokeStyle = '#0b0e10'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px, py, z * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = live ? T.power : '#55606a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px - z * 0.3, py - z * 0.3); ctx.lineTo(px + z * 0.3, py - z * 0.3); ctx.stroke();
  }
  // selection, hover, flashes, floaters
  if (drawer === 'inspect' && sel >= 0) {
    const big = d.occ[sel] === -2; const [px, py] = big ? toScreen(W.C - 1, W.C - 1) : toScreen(sel % N, (sel / N) | 0); const sz = big ? z * 3 : z;
    ctx.strokeStyle = T.ink; ctx.lineWidth = 2; rr(px - 1, py - 1, sz + 2, sz + 2, z * 0.22); ctx.stroke();
  }
  if (hover >= 0 && placing) { const [px, py] = toScreen(hover % N, (hover / N) | 0); const bad = !!W.whyNot(s, placing, hover);
    ctx.strokeStyle = bad ? T.bad : T.ink; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, z - 2, z - 2); }
  for (let k = flashes.length - 1; k >= 0; k--) {
    const f = flashes[k]; const age = (now - f.t) / 900; if (age > 1) { flashes.splice(k, 1); continue; }
    const [px, py] = toScreen(f.i % N, (f.i / N) | 0); ctx.strokeStyle = f.c; ctx.globalAlpha = 1 - age; ctx.lineWidth = 3;
    const g = age * z * 0.5; ctx.strokeRect(px - g, py - g, z + 2 * g, z + 2 * g); ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'center';
  for (let k = floaters.length - 1; k >= 0; k--) {
    const f = floaters[k]; const age = (now - f.t) / 900; if (age > 1) { floaters.splice(k, 1); continue; }
    const [px, py] = toScreen((f.i % N) + 0.5, ((f.i / N) | 0)); ctx.globalAlpha = 1 - age; ctx.fillStyle = T.ink;
    ctx.font = `700 15px ${BAND}`; ctx.fillText(f.text, px, py - age * z); ctx.globalAlpha = 1;
  }
}

function drawBuilding(it, sx, sy, z, now) {
  const B = G.BUILDINGS[it.b]; const c = colOf(it.b); const k = KIND[it.b] || 'm';
  const running = it.st === 'on' && (s.stats.util[it.b] ?? 0) > 0.05;
  const m = z * 0.08; const w = z - 2 * m; const x = sx + m; const y = sy + m; const ccx = sx + z / 2; const ccy = sy + z / 2;
  const t = now / 1000 * (running ? G.speed(s, it.b) * s.stats.powerFactor : 0);
  ctx.globalAlpha = it.st === 'unlinked' ? 0.55 : 1;
  ctx.fillStyle = it.st === 'nopower' || it.st === 'off' ? '#262c32' : T.metal;
  if (k === 'x' || k === 'g') { ctx.beginPath(); ctx.arc(ccx, ccy, w / 2, 0, Math.PI * 2); ctx.fill(); }
  else { rr(x, y, w, w, z * 0.16); ctx.fill(); }
  ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.5, z * 0.07); ctx.stroke();
  if (k === 'x') { // drill head, spins when running
    ctx.save(); ctx.translate(ccx, ccy); ctx.rotate(t * 2.5); ctx.fillStyle = c;
    for (let a = 0; a < 3; a++) { ctx.rotate((Math.PI * 2) / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.32, -w * 0.09); ctx.lineTo(w * 0.32, w * 0.09); ctx.fill(); }
    ctx.restore();
  } else if (k === 'f') { // furnace mouth glows
    const g = running ? 0.55 + 0.35 * Math.sin(now / 260 + it.i) : 0.15;
    ctx.fillStyle = c; ctx.globalAlpha *= g; rr(x + w * 0.25, y + w * 0.3, w * 0.5, w * 0.42, z * 0.06); ctx.fill(); ctx.globalAlpha = it.st === 'unlinked' ? 0.55 : 1;
    ctx.fillStyle = '#1a1f24'; ctx.fillRect(x + w * 0.2, y + w * 0.12, w * 0.6, w * 0.1);
  } else if (k === 'g') { // generator: bolt, turbine blades turn
    if (it.b === 'turbine') { ctx.save(); ctx.translate(ccx, ccy); ctx.rotate(t * 4); ctx.strokeStyle = 'rgba(89,200,255,0.5)'; ctx.lineWidth = z * 0.05;
      for (let a = 0; a < 4; a++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.42, 0); ctx.stroke(); } ctx.restore(); }
    ctx.fillStyle = running || it.b !== 'burner' ? T.power : '#55606a';
    ctx.beginPath(); ctx.moveTo(ccx + w * 0.06, ccy - w * 0.3); ctx.lineTo(ccx - w * 0.16, ccy + w * 0.04); ctx.lineTo(ccx, ccy + w * 0.04); ctx.lineTo(ccx - w * 0.06, ccy + w * 0.3); ctx.lineTo(ccx + w * 0.16, ccy - w * 0.04); ctx.lineTo(ccx, ccy - w * 0.04); ctx.closePath(); ctx.fill();
  } else if (k === 's') { // solar panel cells
    ctx.fillStyle = '#1d3f5c'; ctx.fillRect(x + w * 0.14, y + w * 0.14, w * 0.72, w * 0.72);
    ctx.strokeStyle = 'rgba(89,200,255,0.6)'; ctx.lineWidth = 1;
    for (let q = 1; q < 3; q++) { ctx.beginPath(); ctx.moveTo(x + w * (0.14 + q * 0.24), y + w * 0.14); ctx.lineTo(x + w * (0.14 + q * 0.24), y + w * 0.86); ctx.moveTo(x + w * 0.14, y + w * (0.14 + q * 0.24)); ctx.lineTo(x + w * 0.86, y + w * (0.14 + q * 0.24)); ctx.stroke(); }
  } else { // maker: output swatch and a cycle bar
    ctx.fillStyle = c; rr(ccx - w * 0.17, y + w * 0.18, w * 0.34, w * 0.34, z * 0.04); ctx.fill();
    ctx.fillStyle = '#1a1f24'; ctx.fillRect(x + w * 0.15, y + w * 0.68, w * 0.7, w * 0.12);
    if (running) { const f = (t / B.time) % 1; ctx.fillStyle = c; ctx.fillRect(x + w * 0.15, y + w * 0.68, w * 0.7 * f, w * 0.12); }
  }
  ctx.globalAlpha = 1;
  // status marks
  if (it.st === 'unlinked') { ctx.strokeStyle = T.bad; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); rr(sx + 1, sy + 1, z - 2, z - 2, z * 0.18); ctx.stroke(); ctx.setLineDash([]); }
  else if (it.st === 'nopower') { ctx.fillStyle = T.warn; const bx = sx + z * 0.78; const by = sy + z * 0.22; const r = z * 0.17;
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#1a1000';
    ctx.beginPath(); ctx.moveTo(bx + r * 0.2, by - r * 0.7); ctx.lineTo(bx - r * 0.4, by + r * 0.1); ctx.lineTo(bx, by + r * 0.1); ctx.lineTo(bx - r * 0.2, by + r * 0.7); ctx.lineTo(bx + r * 0.4, by - r * 0.1); ctx.lineTo(bx, by - r * 0.1); ctx.fill(); }
  else if (z >= 22) {
    const [, cls] = status(it); ctx.fillStyle = stColour[cls]; ctx.strokeStyle = '#0b0e10'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(sx + z * 0.8, sy + z * 0.2, Math.max(4, z * 0.13), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
}

// ---------- loop ----------
function frame0() { cam.x = W.C + 0.5; cam.y = W.C + 0.5; cam.z = Math.max(26, fitZoom(W.revealR(s))); }
load();
W.recompute(s);
render();
frame0();
showSheet();
if (params.has('inspect')) { const it = s.world.items.find((x) => x.b === params.get('inspect')) || s.world.items[0]; if (it) { sel = it.i; centreOn(it.i); openDrawer('inspect'); } }
if (params.has('zoom')) cam.z = Number(params.get('zoom'));
let lastT = performance.now(); let acc = 0; let lastSave = 0; let lastRender = 0;
function frame(t) {
  const dt = Math.min(1, (t - lastT) / 1000); lastT = t; acc += dt;
  while (acc >= 0.25) { G.tick(s, 0.25); acc -= 0.25; }
  if (glideTo) { cam.x += (glideTo.x - cam.x) * 0.15; cam.y += (glideTo.y - cam.y) * 0.15; if (Math.hypot(glideTo.x - cam.x, glideTo.y - cam.y) < 0.02) glideTo = null; }
  if (cam.tz) { cam.z += (cam.tz - cam.z) * 0.1; if (Math.abs(cam.tz - cam.z) < 0.1) cam.tz = null; }
  cam.x = Math.max(0, Math.min(N, cam.x)); cam.y = Math.max(0, Math.min(N, cam.y));
  if (t - lastRender > 250) { render(); lastRender = t; }
  if (t - lastSave > 5000) { save(); lastSave = t; }
  draw(t);
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
window.__ui = { s: () => s, cam, toScreen, W, G };
