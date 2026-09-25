// Utilidades de pintado de los mapas del Bloque 14 (Arrecife del Eco, Ruinas de Antea, Fosa del Eco, Fondo del Mar
// del Sur). Módulo PURO: pinceles propios por variante de Cueva1 (tilesets 2 y 15 comparten imagen), celdas,
// decoración que solo se coloca sobre suelo libre y eventos decorativos (corales, helechos gigantes, cajas).
import { OBJ } from '../../events/b14_common.js';

export const T = (col, row) => 384 + row * 8 + col;
/** Fila base de cada variante de color de Cueva1 (content/stamps/Cueva1.js). */
export const CAVE_ROW = Object.freeze({ '': 0, _arcilla: 97, _hielo: 194, _volcan: 302, _gris: 402, _morada: 501 });

/** Macizo de roca (nine) de una variante: bloque elevado que separa zonas dentro de una sala. */
export function macizoBrush(variant = '') {
  const r = CAVE_ROW[variant];
  return {
    nine: 'ids', layer: 1,
    ids: [[T(0, r + 26), T(1, r + 26), T(4, r + 26)], [T(0, r + 28), T(1, r + 29), T(4, r + 28)], [T(0, r + 30), T(1, r + 30), T(4, r + 30)]],
  };
}

/** Pinceles propios de los mapas de cueva del bloque (se pasan en `brushes` de la definición). */
export const CAVE_BRUSHES = Object.freeze({
  macizo_gris: macizoBrush('_gris'),
  macizo_tierra: macizoBrush(''),
  macizo_arcilla: macizoBrush('_arcilla'),
});

/** Celdas del rectángulo x0..x1, y0..y1 (inclusivo). */
export function rect(x0, y0, x1, y1) {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
}

/** Celdas del borde de grosor `t` de un rectángulo (inclusivo), sin las de `gaps` ([[x, y]…]). */
export function ring(x0, y0, x1, y1, t = 2, gaps = []) {
  const gap = new Set(gaps.map(([x, y]) => `${x},${y}`));
  return rect(x0, y0, x1, y1).filter(([x, y]) => (x < x0 + t || x > x1 - t || y < y0 + t || y > y1 - t) && !gap.has(`${x},${y}`));
}

export const key = (x, y) => `${x},${y}`;
export const cellSet = (cells) => new Set(cells.map(([x, y]) => key(x, y)));
export const minus = (cells, remove) => { const s = cellSet(remove); return cells.filter(([x, y]) => !s.has(key(x, y))); };

/**
 * Coloca stamps solo donde caben sobre suelo `free(x, y)` y sin tocar casillas `reserved` (con un margen de 1 si
 * `gap`). Devuelve las casillas ocupadas. list = [[nombre, x, y, w, h]…]
 */
export function placeFree(b, list, free, reserved = new Set(), { gap = true } = {}) {
  const used = new Set(reserved);
  for (const [name, x, y, w, h] of list) {
    let ok = true;
    for (let j = -1; j <= h && ok; j++) {
      for (let i = -1; i <= w && ok; i++) {
        const inside = i >= 0 && j >= 0 && i < w && j < h;
        if (inside && !free(x + i, y + j)) ok = false;
        if ((inside || gap) && used.has(key(x + i, y + j))) ok = false;
      }
    }
    if (!ok) continue;
    b.stamp(name, x, y);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used.add(key(x + i, y + j));
  }
  return used;
}

// ───────────────────────────── Eventos decorativos ─────────────────────────────

const deco = (id, x, y, sprite, dir, extra = {}) => ({
  id, x, y, sprite, dir, directionFix: true, walkAnime: false, stepAnime: true, speed: 1, solid: true, noOver: true, ...extra,
});

/** Corales (hoja b14_coral: 2 rojo · 4 abanico · 6 cerebro · 8 anémona). list = [[x, y, dir]…] */
export function coralEvents(prefix, list) {
  return list.map(([x, y, dir = 2], i) => deco(`${prefix}_${i}`, x, y, OBJ.coral, dir, {
    script: async (ctx) => { await ctx.say(CORAL_TEXT[dir] || CORAL_TEXT[2]); },
    trigger: 'action',
  }));
}
const CORAL_TEXT = Object.freeze({
  2: 'Un coral rojo, ramificado como un árbol pequeño. Entre sus ramas se esconden peces diminutos.',
  4: 'Un abanico de mar rosado. Se mece despacio con la corriente.',
  6: 'Un coral cerebro, surcado de pliegues. Parece una piedra que respira.',
  8: 'Una anémona agita sus tentáculos. Mejor no tocarla.',
});

/** Helechos gigantes de la era primigenia (b14_helecho_gigante: fila = variante 2/4/6/8). */
export function bigFernEvents(prefix, list) {
  return list.map(([x, y, dir = 2], i) => deco(`${prefix}_${i}`, x, y, OBJ.bigFern, dir, { speed: 1 }));
}

/** Matas de helecho pequeñas (b14_helecho fila 8), sin colisión. */
export function smallFernEvents(prefix, list) {
  return list.map(([x, y], i) => deco(`${prefix}_${i}`, x, y, OBJ.fern, 8, { solid: false, through: true, noOver: false }));
}

/** Cajas de reliquias de Genesis. */
export function crateEvents(prefix, list, text) {
  return list.map(([x, y, open = false], i) => ({
    id: `${prefix}_${i}`, x, y, sprite: OBJ.crate, dir: open ? 4 : 2, directionFix: true, walkAnime: false, solid: true,
    noOver: true, trigger: 'action', script: async (ctx) => { for (const l of [].concat(text)) await ctx.say(l); },
  }));
}
