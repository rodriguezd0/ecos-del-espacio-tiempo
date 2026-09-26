// Conversión de las animaciones de combate de Añil (Data/PkmnAnimations.rxdata, PBAnimation de Essentials 21.1) a
// JSON compacto para game/src/battle/scene/fx/anilAnim*.js.
//
// Cel de Essentials (AnimFrame): X 0, Y 1, ZOOMX 2, ANGLE 3, MIRROR 4, BLENDTYPE 5, VISIBLE 6, PATTERN 7, OPACITY 8,
// ZOOMY 11, COLOR 12-15, TONE 16-19, PRIORITY 25, FOCUS 26.
// Cel compacto: [patrón, x, y, foco, prioridad, zoomX, zoomY, ángulo, espejo, mezcla, opacidad, visible, color, tono]
// (color/tono: [r, g, b, a|gris] o 0 si son nulos), sin los valores finales que coinciden con CEL_DEFAULTS. Los cels a partir del 60 se descartan (PBAnimationPlayerX solo
// tiene MAX_SPRITES = 60 sprites).

export const MAX_SPRITES = 60;

/** Valores por defecto de los campos 5… del cel compacto (se omiten al final; zoomY por defecto = zoomX). */
export const CEL_DEFAULTS = Object.freeze([100, null, 0, 0, 0, 255, 1, 0, 0]);

const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) / 100 : d);

function quad(c, i) {
  const q = [num(c[i]), num(c[i + 1]), num(c[i + 2]), num(c[i + 3])];
  return q.some((v) => v !== 0) ? q : 0;
}

/** Cel de Essentials (array de 27) → cel compacto, o 0 si no hay cel. */
export function compactCel(c) {
  if (!Array.isArray(c)) return 0;
  const zx = num(c[2], 100);
  const out = [
    num(c[7]), num(c[0]), num(c[1]), num(c[26], 4), num(c[25], 1), zx, num(c[11], zx), num(c[3]), c[4] ? 1 : 0,
    num(c[5]), num(c[8], 255), c[6] === 0 ? 0 : 1, quad(c, 12), quad(c, 16),
  ];
  const isDefault = (i) => (i === 6 ? out[6] === out[5] : out[i] === CEL_DEFAULTS[i - 5]);
  while (out.length > 5 && isDefault(out.length - 1)) out.pop();
  return out;
}

const colorOf = (col) => (col && typeof col === 'object' ? [num(col.r), num(col.g), num(col.b), num(col.a)] : null);

/** PBAnimTiming → objeto compacto (solo los campos con valor). */
export function compactTiming(t) {
  const out = { frame: num(t.frame), type: num(t.timingType) };
  if (t.name) out.name = String(t.name);
  const keys = ['volume', 'pitch', 'bgX', 'bgY', 'opacity', 'colorRed', 'colorGreen', 'colorBlue', 'colorAlpha'];
  for (const k of keys) if (typeof t[k] === 'number') out[k] = num(t[k]);
  out.duration = typeof t.duration === 'number' ? t.duration : 5;
  const fc = colorOf(t.flashColor);
  if (t.flashScope) Object.assign(out, { flashScope: t.flashScope, flashColor: fc, flashDuration: num(t.flashDuration, 5) });
  return out;
}

/** PBAnimation (con ivars) → { name, graphic, hue, position, frames: [[cel…]…], timing: [...] }. */
export function convertAnimation(a) {
  const frames = (a.array || []).map((fr) => {
    const cels = (fr || []).slice(0, MAX_SPRITES).map(compactCel);
    while (cels.length && cels[cels.length - 1] === 0) cels.pop();
    return cels;
  });
  return {
    name: String(a.name || ''),
    graphic: String(a.graphic || ''),
    hue: num(a.hue),
    position: num(a.position, 4),
    frames,
    timing: (a.timing || []).map(compactTiming).sort((x, y) => x.frame - y.frame),
  };
}

/**
 * Índice movimiento → animación como Data/move2anim.dat (compile_animations: gana la última con el mismo nombre)
 * y animaciones comunes por nombre ("Common:X"). `names[i]` permite comprobar las variantes "hit N"/"charging".
 */
export function buildIndex(anims) {
  const moves = {};
  const oppMoves = {};
  const common = {};
  const names = anims.map((a) => (a ? String(a.name || '') : ''));
  names.forEach((name, i) => {
    let m = name.match(/^OppMove:\s*(.*)$/);
    if (m) { oppMoves[m[1]] = i; return; }
    m = name.match(/^Move:\s*(.*)$/);
    if (m) { moves[m[1]] = i; return; }
    m = name.match(/^Common:\s*(.*)$/);
    if (m && common[m[1]] === undefined) common[m[1]] = i; // pbCommonAnimation usa la primera
  });
  return { moves, oppMoves, common, names };
}
