// Dibujo de la jukebox de desarrollo en la capa canvas 2D (texto sencillo).
import { SCREEN_W, SCREEN_H } from '../../core/engine.js';

export const ROW_H = 16;
export const LIST = { x: 8, y: 58, w: 292, rows: 15 };
const PANEL = { x: 308, y: 58, w: 196, h: 240 };
const FONT = '"Power Green Small", "Power Green", monospace';

const C = {
  bg: '#0d1318',
  panel: '#16202a',
  line: '#2a3a48',
  text: '#dfe8ef',
  dim: '#7f93a3',
  accent: '#b9ff66',
  select: '#24435a',
  loop: '#5fd38a',
  whole: '#e8c35a',
  bad: '#ff6b6b',
  bgm: '#7cc4ff',
  me: '#ffb86b',
  se: '#c9a4ff',
};

function font(px) {
  return `${px}px ${FONT}`;
}

function fit(g, text, maxW) {
  const s = String(text ?? '');
  if (g.measureText(s).width <= maxW) return s;
  let lo = 0;
  let hi = s.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (g.measureText(`${s.slice(0, mid)}…`).width <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return `${s.slice(0, lo)}…`;
}

function fmtTime(sec) {
  if (sec === null || sec === undefined || !Number.isFinite(sec)) return '--:--';
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

/** Etiqueta de bucle de una BGM: [texto, color]. */
export function loopBadge(info) {
  if (!info) return ['', C.dim];
  if (info.loop) return ['bucle', C.loop];
  if (info.loopTags) return ['inválido', C.bad];
  return ['completo', C.whole];
}

function drawTabs(g, tabs, active) {
  g.font = font(16);
  let x = 8;
  tabs.forEach((t, i) => {
    const w = g.measureText(t.label).width + 14;
    g.fillStyle = i === active ? C.accent : C.panel;
    g.fillRect(x, 34, w, 18);
    g.fillStyle = i === active ? '#10200a' : C.dim;
    g.fillText(t.label, x + 7, 48);
    x += w + 4;
  });
}

function drawList(g, view) {
  const { items, cursor, scroll } = view;
  g.fillStyle = C.panel;
  g.fillRect(LIST.x, LIST.y, LIST.w, LIST.rows * ROW_H + 4);
  g.font = font(16);
  if (!items.length) {
    g.fillStyle = C.dim;
    g.fillText(view.emptyText, LIST.x + 6, LIST.y + 16);
    return;
  }
  for (let r = 0; r < LIST.rows; r++) {
    const i = scroll + r;
    if (i >= items.length) break;
    const it = items[i];
    const y = LIST.y + 2 + r * ROW_H;
    if (i === cursor) {
      g.fillStyle = C.select;
      g.fillRect(LIST.x + 1, y, LIST.w - 2, ROW_H);
    }
    const [badge, badgeColor] = it.badge || ['', C.dim];
    const badgeW = badge ? g.measureText(badge).width + 8 : 0;
    if (it.kindColor) {
      g.fillStyle = C[it.kindColor] || C.dim;
      g.fillRect(LIST.x + 4, y + 4, 4, 9);
    }
    g.fillStyle = i === cursor ? '#ffffff' : C.text;
    g.fillText(fit(g, it.label, LIST.w - 16 - badgeW), LIST.x + 12, y + 13);
    if (badge) {
      g.fillStyle = badgeColor;
      g.fillText(badge, LIST.x + LIST.w - badgeW, y + 13);
    }
  }
  // barra de desplazamiento
  const total = items.length;
  if (total > LIST.rows) {
    const h = LIST.rows * ROW_H;
    const bh = Math.max(8, (h * LIST.rows) / total);
    const by = LIST.y + 2 + ((h - bh) * scroll) / Math.max(1, total - LIST.rows);
    g.fillStyle = C.line;
    g.fillRect(LIST.x + LIST.w - 3, by, 2, bh);
  }
}

function drawPanel(g, lines) {
  g.fillStyle = C.panel;
  g.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
  let y = PANEL.y + 16;
  for (const line of lines) {
    if (y > PANEL.y + PANEL.h - 4) break;
    g.font = font(line.size || 16);
    g.fillStyle = C[line.color] || line.color || C.text;
    const wrapped = wrap(g, line.text, PANEL.w - 12);
    for (const w of wrapped) {
      if (y > PANEL.y + PANEL.h - 4) break;
      g.fillText(w, PANEL.x + 6, y);
      y += (line.size || 16) - 1;
    }
    y += line.gap ?? 2;
  }
}

function wrap(g, text, maxW) {
  const words = String(text ?? '').split(/\s+/);
  const out = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width <= maxW || !line) line = test;
    else {
      out.push(line);
      line = w;
    }
  }
  if (line) out.push(line);
  return out.map((l) => fit(g, l, maxW));
}

function drawNowPlaying(g, np, status) {
  const y0 = 304;
  g.fillStyle = C.panel;
  g.fillRect(8, y0, SCREEN_W - 16, 56);
  g.font = font(16);
  g.fillStyle = C.dim;
  g.fillText('Sonando:', 14, y0 + 15);
  const labelW = g.measureText('Sonando: ').width;
  g.fillStyle = np ? C.text : C.dim;
  const title = np ? `${np.name}${np.id && np.file !== np.name ? ` → ${np.file}` : ''}${np.held ? ' (pausa por ME)' : ''}` : '(silencio)';
  g.fillText(fit(g, title, 250), 14 + labelW, y0 + 15);
  g.fillStyle = status.startsWith('pulsa') ? C.me : C.dim;
  g.textAlign = 'right';
  g.fillText(fit(g, status, 200), SCREEN_W - 14, y0 + 15);
  g.textAlign = 'left';
  // barra de progreso con la región de bucle
  const bx = 14;
  const bw = SCREEN_W - 28;
  const by = y0 + 24;
  g.fillStyle = C.bg;
  g.fillRect(bx, by, bw, 10);
  if (np && np.duration) {
    const px = (t) => bx + (bw * Math.min(Math.max(t, 0), np.duration)) / np.duration;
    if (np.loopEnd !== null) {
      g.fillStyle = np.loopFromTags ? 'rgba(95,211,138,0.35)' : 'rgba(232,195,90,0.25)';
      g.fillRect(px(np.loopStart), by, px(np.loopEnd) - px(np.loopStart), 10);
    }
    g.fillStyle = C.accent;
    g.fillRect(px(np.position) - 1, by - 2, 3, 14);
    g.fillStyle = C.text;
    g.fillText(`${fmtTime(np.position)} / ${fmtTime(np.duration)}`, bx, by + 26);
    if (np.loopEnd !== null) {
      g.fillStyle = np.loopFromTags ? C.loop : C.whole;
      const label = np.loopFromTags ? `bucle ${fmtTime(np.loopStart)} → ${fmtTime(np.loopEnd)}` : 'sin LOOPSTART: repite el archivo completo';
      g.textAlign = 'right';
      g.fillText(label, bx + bw, by + 26);
      g.textAlign = 'left';
    }
  }
}

const HELP = [['Z', 'tocar'], ['X', 'parar'], ['V', 'fin de bucle'], ['C', 'push/resume'], ['←→', 'pestaña'], ['Q/E', 'pág.']];

function drawHelp(g) {
  g.font = font(16);
  let x = 8;
  for (const [key, label] of HELP) {
    g.fillStyle = C.accent;
    g.fillText(key, x, SCREEN_H - 8);
    x += g.measureText(key).width + 3;
    g.fillStyle = C.dim;
    g.fillText(label, x, SCREEN_H - 8);
    x += g.measureText(label).width + 8;
  }
}

/** Dibuja la jukebox completa. `view` lo prepara la escena. */
export function drawJukebox(g, view) {
  g.fillStyle = C.bg;
  g.fillRect(0, 0, SCREEN_W, SCREEN_H);
  g.textBaseline = 'alphabetic';
  g.font = font(18);
  g.fillStyle = C.accent;
  const title = 'Jukebox · audio de Añil';
  g.fillText(title, 8, 22);
  const titleW = g.measureText(title).width;
  g.font = font(16);
  g.fillStyle = view.banner ? C.me : C.dim;
  g.textAlign = 'right';
  g.fillText(fit(g, view.banner || `${view.items.length} elementos`, SCREEN_W - titleW - 28), SCREEN_W - 8, 22);
  g.textAlign = 'left';
  drawTabs(g, view.tabs, view.tab);
  drawList(g, view);
  drawPanel(g, view.details);
  drawNowPlaying(g, view.nowPlaying, view.status);
  drawHelp(g);
}

export { fmtTime };
