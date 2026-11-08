const { chromium } = require('playwright');
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1380, height: 900 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:8792/docs/ux/2b-panels.html'); await p.waitForTimeout(500);
await p.locator('.wrap').screenshot({ path: 'docs/ux/2b-panels.png' }); await br.close(); })();
