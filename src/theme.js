// Drift Foundry design system tokens (docs/design-system.md), direction B "Survey chart". The CSS
// reads them as custom properties, the canvas reads them directly.

const ITEMS = {
  ore: '#e38a60', coal: '#a6acb4', stone: '#cfae78', quartz: '#9ee6e0', ingot: '#e4ebf2', plate: '#5aa6ef',
  wire: '#f0a43c', concrete: '#b9ad9c', silica: '#7ad6b0', frame: '#e889b0', circuit: '#55cc7c', motor: '#c6ec62',
};

export const THEME = {
  name: 'Survey chart', dark: false,
  fog: '#b9bfc2', terrain: '#eef0ef', terrain2: '#eef0ef', next: '#cdd2d4', nextNode: 0.3,
  surface: '#ffffff', raised: '#eef0f1', line: '#dde1e3',
  ink: '#162026', ink2: '#56616a', accent: '#2346d8', accentInk: '#ffffff', accentSoft: 'rgba(35,70,216,0.24)',
  power: '#00897b', powerSoft: 'rgba(0,137,123,0.14)', ok: '#18803f', warn: '#c77800', bad: '#d1242f', badSoft: '#fde4e4',
  machine: '#2c353c', machineOff: '#9aa3a9', machineEdge: '#162026', belt: '#a3acb2', beltBad: '#e7a7a3', hubBody: '#162026',
  nodeAlpha: 0.32, nodeEdge: '#162026', glyph: 'line',
  items: ITEMS,
  font: '"Archivo", system-ui, sans-serif', fig: '"Archivo Narrow", "Archivo", system-ui, sans-serif',
  fonts: 'family=Archivo:wght@400;600;700&family=Archivo+Narrow:wght@600;700',
  rc: 10, rp: 16, scrim: 'rgba(22,32,38,0.45)',
};

// item shapes in a 0..1 box, shared by canvas (Path2D) and DOM (SVG)
export const SHAPE = {
  ore: 'M.2 .38L.5 .12L.84 .3L.8 .74L.38 .88L.14 .66Z',
  coal: 'M.08 .56C.2 .3 .8 .22 .92 .44C.8 .7 .2 .8 .08 .56Z',
  stone: 'M.5 .16C.8 .16 .9 .4 .86 .6C.8 .84 .3 .9 .16 .7C.06 .5 .2 .16 .5 .16Z',
  quartz: 'M.5 .06L.78 .3L.78 .7L.5 .94L.22 .7L.22 .3Z',
  ingot: 'M.06 .72L.22 .3L.78 .3L.94 .72Z',
  plate: 'M.3 .22H.94L.7 .78H.06Z',
  wire: 'M.5 .1A.4 .4 0 1 1 .5 .9A.4 .4 0 1 1 .5 .1ZM.5 .32A.18 .18 0 1 0 .5 .68A.18 .18 0 1 0 .5 .32Z',
  concrete: 'M.08 .2H.44V.46H.08ZM.52 .2H.92V.46H.52ZM.08 .54H.26V.8H.08ZM.34 .54H.7V.8H.34ZM.78 .54H.92V.8H.78Z',
  silica: 'M.3 .18A.16 .16 0 1 1 .3 .5A.16 .16 0 1 1 .3 .18ZM.7 .3A.16 .16 0 1 1 .7 .62A.16 .16 0 1 1 .7 .3ZM.4 .56A.16 .16 0 1 1 .4 .88A.16 .16 0 1 1 .4 .56Z',
  frame: 'M.1 .1H.9V.9H.1ZM.32 .32V.68H.68V.32Z',
  circuit: 'M.24 .24H.76V.76H.24ZM.32 .06H.4V.24H.32ZM.6 .06H.68V.24H.6ZM.32 .76H.4V.94H.32ZM.6 .76H.68V.94H.6ZM.06 .32H.24V.4H.06ZM.06 .6H.24V.68H.06ZM.76 .32H.94V.4H.76ZM.76 .6H.94V.68H.76Z',
  motor: 'M.5 .08A.42 .42 0 1 1 .5 .92A.42 .42 0 1 1 .5 .08ZM.44 .2V.44H.2V.56H.44V.8H.56V.56H.8V.44H.56V.2Z',
};
export const itemSVG = (k, col, size = 14, edge) =>
  `<svg class="it" width="${size}" height="${size}" viewBox="0 0 1 1" aria-hidden="true"><path d="${SHAPE[k]}" fill="${col}" fill-rule="evenodd"${edge ? ` stroke="${edge}" stroke-width=".07" stroke-linejoin="round"` : ''}/></svg>`;

export function pick() { return THEME; }
export function applyCSS(t) {
  const r = document.documentElement.style;
  for (const k of ['fog', 'surface', 'raised', 'line', 'ink', 'ink2', 'accent', 'accentInk', 'accentSoft', 'power', 'ok', 'warn', 'bad', 'badSoft', 'machine', 'scrim', 'font', 'fig']) r.setProperty('--' + k, t[k]);
  r.setProperty('--rc', t.rc + 'px'); r.setProperty('--rp', t.rp + 'px');
  document.documentElement.dataset.ds = t.dark ? 'dark' : 'light';
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `https://fonts.googleapis.com/css2?${t.fonts}&display=swap`; document.head.append(l);
  document.querySelector('meta[name=theme-color]').content = t.surface;
}
