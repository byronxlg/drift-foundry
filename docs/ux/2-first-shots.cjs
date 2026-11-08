const { chromium, devices } = require('playwright');
// UX decision 2, first minutes. Serve the repo root on :8792, run from a folder with playwright installed: node 2-first-shots.cjs docs/ux
const OUT = process.argv[2];
(async () => {
  const br = await chromium.launch(); const errs = [];
  const go = async (url, fn, name) => {
    const ctx = await br.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 }); const p = await ctx.newPage();
    await p.route('**/src/build.js', async (r) => { const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()) + '\nwindow.__adv = (f) => { advice = f; render(); }; window.__df = { s: () => s, G, tapTile, nearestNode, render, advice: () => advice() };' }); });
    p.on('pageerror', (e) => errs.push(name + ': ' + e.message));
    await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    if (fn) await p.evaluate(fn); await p.waitForTimeout(400);
    console.log(name, await p.evaluate(() => document.querySelector('#advice').hidden ? '(no Next)' : document.querySelector('#advice').innerText.replace(/\s+/g, ' ')));
    await p.screenshot({ path: `${OUT}/${name}.png` }); await ctx.close();
  };
  const NEW = 'http://localhost:8792/'; const SPINE = 'http://localhost:8792/?demo=2';
  await go(NEW, null, '2-a1');
  await go(SPINE, null, '2-a2');
  await go(NEW, null, '2-b1');
  await go(SPINE, () => { const st = window.__df.s(); const G = window.__df.G; window.__adv(() => ({ kind: 'look', why: `Power is short, ${G.fmt(st.stats.demand)} of ${G.fmt(G.powerCapacity(st))} MW. Every machine runs slower.` })); }, '2-b2');
  const intro = () => { window.__adv(() => null); const ab = document.querySelector('#advice'); const box = document.createElement('div');
    box.style.cssText = 'align-self:center;font-size:15px;line-height:1.3;color:var(--ink);padding:0 4px;flex:1';
    box.textContent = 'Make 300 ingots. Tap ore to dig it, then build a drill and a smelter.'; ab.parentElement.insertBefore(box, ab); };
  await go(NEW, intro, '2-c1');
  await go(SPINE, () => window.__adv(() => null), '2-c2');
  console.log('errs', errs); await br.close();
})();
