const { chromium } = require('playwright');
// Serve the repo root on :8793, run from a folder with playwright installed.
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1600, height: 760 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:8793/docs/ux/2b-explain.html'); await p.waitForTimeout(500);
await p.locator('.wrap').screenshot({ path: process.argv[2] + '/2b-explain.png' }); await br.close(); })();
