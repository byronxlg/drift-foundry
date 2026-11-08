const { chromium, devices } = require('playwright');
// Piece 9, dock and hotbar. Serve the repo root on :8767, run from a folder with playwright installed.
const B = `[data-ds="light"] .card{width:128px;grid-template-columns:30px 1fr;justify-items:start;text-align:left;padding:7px 8px;gap:2px 8px}
[data-ds="light"] .card .ic{width:30px;height:30px;grid-row:1/3;grid-column:1}
[data-ds="light"] .card .nm{grid-row:1;grid-column:2;font-size:var(--t5);align-self:end}
[data-ds="light"] .card .cost{grid-row:2;grid-column:2;justify-content:start;align-self:start}
[data-ds="light"] .card .n{position:absolute;top:5px;right:6px}
.card.adv::after{top:4px;right:4px}`;
const C = `[data-ds="light"] .card{width:62px;padding:8px 4px 7px;gap:4px}
[data-ds="light"] .card .nm{display:none}
[data-ds="light"] .card.on .nm,[data-ds="light"] .card.adv .nm{display:block;font-size:11px}
[data-ds="light"] .card.adv{width:76px}`;
const OPT = { a: '', b: B, c: C };
const OUT = process.argv[2] || 'docs/pieces';
(async () => {
  const b = await chromium.launch();
  for (const [m, url] of [['start', '/'], ['mid', '/?demo=2']]) for (const [k, css] of Object.entries(OPT)) {
    const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('http://localhost:8767' + url, { waitUntil: 'networkidle' }); await p.waitForTimeout(800); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    if (css) await p.addStyleTag({ content: css });
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${OUT}/9-dock-${m}-${k}.png` });
    console.log(m, k, errs.join('|') || 'ok', await p.$eval('.dock', (d) => Math.round(d.getBoundingClientRect().height))); await ctx.close();
  }
  await b.close();
})();
