const { chromium, devices } = require('playwright');
const B = () => { const fix = () => document.querySelectorAll('.needs li').forEach((li) => { const ns = li.querySelector('.ns'); if (ns && ns.textContent === 'not being made') { ns.textContent = 'not started'; li.classList.remove('none'); } });
  new MutationObserver(fix).observe(document.querySelector('.needs'), { childList: true }); fix(); };
const OPT = { a: null, b: B, c: '.ns{display:none}' };
(async () => {
  const b = await chromium.launch();
  for (const [m, url] of [['start', '/'], ['mid', '/?demo=2']]) for (const [k, o] of Object.entries(OPT)) {
    const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('http://localhost:8767' + url, { waitUntil: 'networkidle' }); await p.waitForTimeout(800); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    if (typeof o === 'string') await p.addStyleTag({ content: o }); else if (o) await p.evaluate(o);
    await p.waitForTimeout(600);
    await p.screenshot({ path: `docs/pieces/8-hud-${m}-${k}.png` });
    console.log(m, k, errs.join('|') || 'ok'); await ctx.close();
  }
  await b.close();
})();
