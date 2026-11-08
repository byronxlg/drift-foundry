const { chromium, devices } = require('playwright');
// UX decision 1, the whole game drawn. Serve the repo root on :8791, run from a folder with playwright installed.
// The real game at ?demo=3 (Anchor and Spine in, Lattice under way). A is as now; B and C are a mock
// laid over the real page, drawn from the game's own data, machine pictures and item shapes.
const OUT = process.argv[2] || 'docs/ux';
const CSS = `
.road{position:fixed;inset:0;z-index:50;background:var(--surface);overflow:auto;padding:calc(env(safe-area-inset-top) + 14px) 16px 24px;font-family:var(--font);color:var(--ink)}
.road .top{display:flex;align-items:center;justify-content:space-between;margin:0 0 4px}
.road h2{font:700 var(--t1)/1.1 var(--font);margin:0}
.road .sub{color:var(--ink2);font-size:var(--t3);margin:0 0 14px}
.road .x{flex:none;padding:0 14px;min-height:40px;border-radius:var(--rc);background:var(--raised);font-weight:600;font-size:var(--t4);border:0;color:var(--ink)}
.stop{position:relative;padding:0 0 16px 40px}
.stop::before{content:'';position:absolute;left:13px;top:26px;bottom:-2px;width:3px;background:var(--line)}
.stop.done::before{background:var(--ink)}
.stop:last-child::before{display:none}
.dot{position:absolute;left:0;top:0;width:29px;height:29px;border-radius:50%;display:grid;place-items:center;font:700 14px/1 var(--font);background:var(--raised);color:var(--ink2);border:3px solid var(--line);box-sizing:border-box}
.done .dot{background:var(--ink);border-color:var(--ink);color:#fff}
.now .dot{background:var(--accent);border-color:var(--accent);color:#fff}
.stop h3{font:700 var(--t2)/1.1 var(--font);margin:4px 0 6px;display:flex;gap:8px;align-items:baseline}
.stop h3 small{font:600 var(--t4)/1 var(--font);color:var(--ink2)}
.ahead h3{color:var(--ink2)}
.parts{display:flex;flex-wrap:wrap;gap:6px 12px;margin:0 0 8px}
.part{display:inline-flex;align-items:center;gap:5px;font:600 var(--t4)/1 var(--font);font-variant-numeric:tabular-nums}
.part .bar{display:block;width:44px;height:5px;border-radius:3px;background:var(--line);overflow:hidden}.part .bar i{display:block;height:100%;background:var(--accent)}
.opens{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.opens .lb{font-size:var(--t5);color:var(--ink2);margin-right:2px}
.opens img{width:34px;height:34px;border-radius:8px;background:var(--raised)}
.ahead .opens img{opacity:.45;filter:grayscale(1)}
.done .parts,.done .opens{display:none}
.end{padding:0 0 0 40px;position:relative;color:var(--ink2);font-size:var(--t3)}
.end .dot{background:var(--surface)}
/* C: the ring drawn big */
.ringbig{display:block;margin:0 auto 10px;width:340px;height:330px}
.ringbig text{font-size:15px}
.ringbig text{font:700 13px var(--font);fill:var(--ink)}
.ringbig text.ah{fill:var(--ink2);font-weight:600}
.legend{display:grid;grid-template-columns:auto 1fr;gap:8px 10px;align-items:center;font-size:var(--t4)}
.legend b{font:700 var(--t3)/1 var(--font)}
.legend .ah{color:var(--ink2)}
.legend span{display:flex;gap:10px;flex-wrap:wrap}.legend .ah .it{opacity:.55}
`;
(async () => {
  const br = await chromium.launch();
  for (const k of ['a', 'b', 'c']) {
    const ctx = await br.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 }); const p = await ctx.newPage(); const errs = [];
    await p.route('**/src/build.js', async (r) => { const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()) + '\nwindow.__df = { iconURL, G, COL, itemSVG, s: () => s }; window.__shape = SHAPE;' }); });
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('http://localhost:8791/?demo=3', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    if (k !== 'a') {
      await p.addStyleTag({ content: CSS });
      await p.evaluate((k) => {
        const { iconURL, G, COL, itemSVG, s } = window.__df; const st = s(); const cur = st.phase;
        const opens = (i) => G.BUILD_ORDER.filter((b) => G.BUILDINGS[b].phase === i + 1);
        const time = ['4 min', '20 min', '1 h', '1 h 45 min', '6 h'];
        let html = '';
        if (k === 'b') {
          html = `<div class="top"><h2>The ring</h2><button class="x">Close</button></div><p class="sub">Five parts to build. When the ring is whole, the rock leaves.</p>`;
          G.PHASES.forEach((P, i) => {
            const cls = i < cur ? 'done' : i === cur ? 'now' : 'ahead';
            const parts = Object.entries(P.need).map(([it, n]) => {
              const got = st.delivered[it] || 0;
              return `<span class="part">${itemSVG(it, COL[it], 18)}${i === cur ? `${G.fmt(got)} / ` : ''}${G.fmt(n)} ${G.ITEMS[it].name.toLowerCase()}${i === cur ? `<span class="bar"><i style="width:${Math.min(100, (got / n) * 100)}%"></i></span>` : ''}</span>`;
            }).join('');
            const op = i < 4 ? opens(i + 1).map((b) => `<img src="${iconURL(b)}" alt="">`).join('') : '';
            html += `<div class="stop ${cls}"><span class="dot">${i < cur ? '&#10003;' : i + 1}</span><h3>${P.name}<small>${i < cur ? 'built' : i === cur ? 'building now' : 'about ' + time[i] + ' in'}</small></h3><div class="parts">${parts}</div>${op ? `<div class="opens"><span class="lb">Then you can build</span>${op}</div>` : ''}</div>`;
          });
          html += `<div class="end"><span class="dot"></span><h3 style="margin:4px 0 0">The rock leaves</h3></div>`;
        } else {
          const R = 100, cx = 170, cy = 165; let svg = '';
          for (let i = 0; i < 5; i++) {
            const a0 = (i / 5) * 360 - 90 + 3, a1 = ((i + 1) / 5) * 360 - 90 - 3;
            const pt = (a, r) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
            const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
            const d = `M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1}`;
            const col = i < cur ? 'var(--ink)' : i === cur ? 'var(--accent)' : 'var(--line)';
            svg += `<path d="${d}" fill="none" stroke="var(--line)" stroke-width="22"/>`;
            if (i <= cur) { const P = G.PHASES[i]; const f = i < cur ? 1 : Object.entries(P.need).reduce((a, [it, n]) => a + Math.min(1, (st.delivered[it] || 0) / n), 0) / Object.keys(P.need).length;
              svg += `<path d="${d}" fill="none" stroke="${col}" stroke-width="22" pathLength="100" stroke-dasharray="${f * 100} 100"/>`; }
            const am = (a0 + a1) / 2; const [tx, ty] = pt(am, R + 34);
            svg += `<text x="${tx}" y="${ty + 4}" text-anchor="middle" class="${i > cur ? 'ah' : ''}">${G.PHASES[i].name}</text>`;
            
          }
          html = `<div class="top"><h2>The ring</h2><button class="x">Close</button></div><p class="sub">Five parts to build. When the ring is whole, the rock leaves.</p><svg class="ringbig" viewBox="0 0 340 330">${svg}</svg><div class="legend">`;
          G.PHASES.forEach((P, i) => { html += `<b class="${i > cur ? 'ah' : ''}">${i < cur ? '&#10003; ' : ''}${P.name}</b><span class="${i > cur ? 'ah' : ''}">${Object.entries(P.need).map(([it, n]) => `<span class="part">${itemSVG(it, COL[it], 16)}${G.fmt(n)}</span>`).join(' ')}</span>`; });
          html += '</div>';
        }
        const el = document.createElement('div'); el.className = 'road'; el.innerHTML = html; document.body.append(el);
      }, k);
    }
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${OUT}/1-road-${k}.png` });
    console.log(k, errs.join('|') || 'ok'); await ctx.close();
  }
  await br.close();
})();
