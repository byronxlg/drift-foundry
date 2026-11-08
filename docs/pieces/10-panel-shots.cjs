const { chromium, devices } = require('playwright');
// Piece 10, the machine panel and short messages. Serve the repo root on :8767, run from a folder with playwright installed.
// Each option is CSS (and for C one injected button) over the real game, ?demo=2 with the smelter tapped and a message up.
const LH = `.lh{text-transform:none;letter-spacing:0;font-size:var(--t4)}`;
const B = `${LH} .dock{transform:translateY(100%)} .drawer{bottom:0;max-height:46dvh;padding-bottom:calc(var(--sab) + 16px)}
.drawer::before{content:'';display:block;width:40px;height:5px;border-radius:3px;background:var(--line,#c9ced1);margin:-8px auto 10px}`;
const C = `${LH} .drawer .lh,.drawer .lines,.drawer .rate~.row:not(:last-child){display:none}
.drawer::before{content:'';display:block;width:40px;height:5px;border-radius:3px;background:var(--line,#c9ced1);margin:-8px auto 10px}`;
const OPT = { a: '', b: B, c: C };
const OUT = process.argv[2] || 'docs/pieces';
(async () => {
  const b = await chromium.launch();
  for (const [k, css] of Object.entries(OPT)) {
    const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 }); const p = await ctx.newPage(); const errs = [];
    // mock only: expose the camera so the tapped machine can sit in the map left above the panel
    await p.route('**/src/build.js', async (r) => { const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()) + '\nwindow.__cam = cam;' }); });
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('http://localhost:8767/?demo=2&inspect=smelter', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    if (css) await p.addStyleTag({ content: css });
    if (k === 'c') await p.evaluate(() => { const r = [...document.querySelectorAll('#drawer .row')].pop(); r.insertAdjacentHTML('afterbegin', '<button class="btn">Lines (4)</button>'); });
    await p.waitForTimeout(300);
    const top = await p.$eval('#drawer', (d) => d.getBoundingClientRect().top);
    if (k !== 'a') {
      // keep the tapped machine in view: centre it in the map left between the top bar and the panel
      const hud = await p.$eval('.hud', (h) => h.getBoundingClientRect().bottom);
      const dockTop = await p.$eval('.dock', (d) => d.getBoundingClientRect().top); const dy = hud + (top - hud) * 0.4 - (hud + dockTop) / 2;
      await p.evaluate((dy) => { window.__cam.y -= dy / window.__cam.z; }, dy);
    }
    await p.evaluate(([k, top]) => { const t = document.getElementById('toast'); t.textContent = 'Line removed'; t.className = 'toast'; t.hidden = false; if (k !== 'a') { t.style.top = 'auto'; t.style.bottom = (innerHeight - top + 12) + 'px'; }
      }, [k, top]);
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/10-panel-${k}.png` });
    console.log(k, errs.join('|') || 'ok', Math.round(top)); await ctx.close();
  }
  await b.close();
})();
