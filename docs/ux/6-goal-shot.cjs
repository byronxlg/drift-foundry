const { chromium } = require('playwright');
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1460, height: 860 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:8794/docs/ux/6-goal.html'); await p.waitForTimeout(500);
await p.locator('.wrap').screenshot({ path: process.argv[2] }); await br.close(); })();
