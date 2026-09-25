// Capa de avisos NO bloqueantes (cartel de zona y "toasts"), dibujada encima de todas las escenas.
// Se engancha una sola vez envolviendo engine.scenes.render (aditivo: no modifica core/).
import { engine, SCREEN_W } from '../../core/engine.js';
import { drawWindow, isDarkSkin, skinBorders, preloadSkins } from './windowskin.js';
import { drawText, textWidth, wrapLines } from './text.js';
import { messageColors } from './colors.js';
import { menuSkin } from './options.js';

const LOCATION_SKIN = 'sign hgss loc';
const LOCATION_FRAMES = 150;
const TOAST_FRAMES = 150;
const SLIDE = 12;

let location = null; // { name, start }
const toasts = []; // { text, start }
let hooked = false;

function hook() {
  if (hooked) return;
  hooked = true;
  preloadSkins([LOCATION_SKIN]);
  const sm = engine.scenes;
  const original = sm.render.bind(sm);
  sm.render = (renderer, g) => {
    original(renderer, g);
    try {
      drawOverlay(g);
    } catch (err) {
      console.error('[ui] Error dibujando avisos', err);
    }
  };
}

export function showLocation(name) {
  if (!name) return;
  hook();
  location = { name: String(name), start: engine.frame };
}

export function toast(text) {
  if (!text) return;
  hook();
  toasts.push({ text: String(text), start: null });
}

function slideOffset(age, total, size) {
  if (age < SLIDE) return -size * (1 - age / SLIDE);
  if (age > total - SLIDE) return -size * ((age - (total - SLIDE)) / SLIDE);
  return 0;
}

function drawOverlay(g) {
  const now = engine.frame;
  let top = 8;
  if (location) {
    const age = now - location.start;
    if (age > LOCATION_FRAMES) location = null;
    else top += drawLocation(g, location.name, age);
  }
  if (toasts.length) {
    const t = toasts[0];
    if (t.start === null) t.start = now;
    const age = now - t.start;
    if (age > TOAST_FRAMES) toasts.shift();
    else drawToast(g, t.text, age, top);
  }
}

function drawLocation(g, name, age) {
  const skin = LOCATION_SKIN;
  const b = skinBorders(skin);
  const w = Math.max(200, textWidth(name) + b.left + b.right + 24);
  const h = 32 + b.top + b.bottom;
  const y = Math.round(slideOffset(age, LOCATION_FRAMES, h + 4));
  if (!drawWindow(g, skin, 0, y, w, h)) return 0;
  const [base, shadow] = messageColors(null, isDarkSkin(skin));
  drawText(g, name, b.left + 8, y + b.top - 2, { color: base, shadow });
  return Math.max(0, y + h);
}

const TOAST_LINE_H = 32;

/**
 * Aviso centrado; `top` evita solaparse con el cartel de zona. Si no cabe en una línea se parte en varias (aditivo B20:
 * los avisos largos, p. ej. los de la Cadena Roja de world/axis, se salían por los lados).
 */
function drawToast(g, text, age, top = 8) {
  const skin = menuSkin();
  const b = skinBorders(skin);
  const pad = b.left + b.right + 24;
  const maxW = SCREEN_W - 16;
  const wrapped = textWidth(text) + pad > maxW ? wrapLines(text, maxW - pad).filter(Boolean) : [];
  const lines = wrapped.length ? wrapped : [text];
  const w = Math.min(maxW, Math.max(...lines.map((l) => textWidth(l))) + pad);
  const h = TOAST_LINE_H * lines.length + b.top + b.bottom;
  const x = Math.round((SCREEN_W - w) / 2);
  const off = slideOffset(age, TOAST_FRAMES, h + 8);
  const y = Math.round(top + off);
  const alpha = Math.max(0, Math.min(1, 1 + off / (h + 8)));
  g.save();
  g.globalAlpha = alpha;
  drawWindow(g, skin, x, y, w, h);
  const [base, shadow] = messageColors(null, isDarkSkin(skin));
  lines.forEach((line, i) => drawText(g, line, x + w / 2, y + b.top - 2 + i * TOAST_LINE_H, { color: base, shadow, align: 'center' }));
  g.restore();
}
