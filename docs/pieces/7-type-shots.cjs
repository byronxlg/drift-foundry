const { chromium, devices } = require('playwright');
const OPT = {
  a: '',
  b: ':root{--t1:28px;--t2:24px;--t3:15px;--t4:13px;--t5:13px}',
  c: '',
};
(async () => {
  const b = await chromium.launch();
  for (const [k, css] of Object.entries(OPT)) {
    const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('http://localhost:8767/?demo=2', { waitUntil: 'networkidle' }); await p.waitForTimeout(600); await p.keyboard.press('Escape');
    if (css) await p.addStyleTag({ content: css });
    if (k === 'c') await p.evaluate(() => document.documentElement.style.setProperty('--fig', '"Archivo", system-ui, sans-serif'));
    await p.waitForTimeout(700);
    await p.screenshot({ path: `/tmp/df-p7/docs/pieces/7-type-${k}.png` });
    console.log(k, errs.join('|') || 'ok');
    await ctx.close();
  }
  await b.close();
})();
