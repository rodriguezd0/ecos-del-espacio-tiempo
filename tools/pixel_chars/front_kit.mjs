// Piezas comunes de los sprites frontales de combate (estilo BW, nativo 80×80 → 160×160): piernas,
// torsos (chaqueta, abrigo largo, falda), brazos por pose, cara (ojos, cejas, párpados, gafas, barba)
// y accesorios. Todo con las máscaras y el sombreado de celda de raster.mjs. PROVISIONAL (D30).
import { hex } from '../pixel.mjs';
import { ellipse, poly, capsule, rect, paint, stamp, lineIn } from './raster.mjs';
import { FACE, FRONT_SIZE, drawHead } from './battle_front.mjs';

export const W = FRONT_SIZE;
export const H = FRONT_SIZE;
export const P = (pts) => poly(W, H, pts);
export const E = (cx, cy, rx, ry) => ellipse(W, H, cx, cy, rx, ry);
export const R = (x, y, w, h) => rect(W, H, x, y, w, h);
export const CAP = (x0, y0, x1, y1, r) => capsule(W, H, x0, y0, x1, y1, r);
export const everywhere = () => R(0, 0, W, H);
export { paint, stamp, lineIn, drawHead, FACE };

/** Tonos { light, base, shadow, line } a partir de 4 colores. */
export const tones = (light, base, shadow, line) => ({ light, base, shadow, line });

export function neck(img, skin) {
  paint(img, R(37, 25, 6, 6), skin, { lightW: 0 });
}

/** Peso sobre una pierna, rodilla contraria flexionada y pies en tres cuartos. */
export function legs(img, pants, shoes, { boots = false, gap = 10, stance = 'rest' } = {}) {
  const spread = (gap - 10) / 2;
  const left = stance === 'stride' ? [[35, 53], [31 - spread, 62], [28 - spread, 72]]
    : [[35, 53], [34 - spread, 63], [34 - spread, 72]];
  const right = stance === 'wide' ? [[44, 54], [47 + spread, 64], [51 + spread, 72]]
    : [[44, 54], [45 + spread, 61], [48 + spread, 70]];
  const hip = P([[32, 49], [48, 50], [49, 55], [41, 59], [33, 56]]);
  for (const points of [left, right]) {
    const [[hx, hy], [kx, ky], [fx, fy]] = points;
    const leg = CAP(hx, hy, kx, ky, 3.7).union(CAP(kx, ky, fx, fy, 3.1));
    paint(img, leg, pants, { lightW: 1, shadowW: 2 });
    lineIn(img, leg, kx - 2, ky - 1, kx + 2, ky + 1, pants.shadow);
    const boot = boots ? P([[kx - 3, ky + 1], [kx + 3, ky + 1], [fx + 3, fy + 2], [fx - 3, fy + 2]])
      : R(fx - 3, fy - 1, 6, 4);
    const foot = boot.union(E(fx + (points === left ? -2 : 2), fy + 3, 5.3, 2.5));
    paint(img, foot, shoes, { lightW: 1, shadowW: 2 });
    lineIn(img, foot, fx - 3, fy + 4, fx + 4, fy + 4, shoes.line);
  }
  paint(img, hip, pants, { lightW: 1, shadowW: 2 });
}

/** Piernas con falda larga por encima (de la cintura a media pantorrilla). */
export function longSkirt(img, skirt, stockings, shoes) {
  paint(img, CAP(35, 66, 34, 72, 3.5).union(CAP(45, 66, 46, 72, 3.5)), stockings, { lightW: 0 });
  paint(img, E(34, 75, 5, 3).union(E(46, 75, 5, 3)), shoes, { lightW: 1 });
  const s = P([[32, 48], [48, 49], [51, 58], [56, 69], [43, 71], [26, 68], [29, 57]]);
  paint(img, s, skirt, { shadowW: 4 });
  lineIn(img, s, 34, 52, 31, 69, skirt.shadow);
  lineIn(img, s, 46, 52, 49, 69, skirt.shadow);
}

/** Torso de chaqueta. `open`: abierta con la prenda interior; `width` estrecha o ensancha los hombros. */
export function jacket(img, t, { inner = null, open = false, width = 0, zip = null } = {}) {
  const w = width;
  const torso = P([[31 - w, 31], [38, 28], [49 + w, 30], [52 + w, 36], [48 + w, 46],
    [50 + w, 52], [44, 55], [31 - w, 52], [32 - w, 44], [28 - w, 36]]);
  paint(img, torso, t, { shadowW: 4 });
  lineIn(img, torso, 31 - w, 36, 35, 40, t.light);
  lineIn(img, torso, 45, 47, 49 + w, 49, t.line);
  lineIn(img, torso, 32, 49, 38, 51, t.shadow);
  if (open && inner) {
    paint(img, P([[36, 29], [44, 29], [42, 53], [38, 53]]), inner, { lightW: 1 });
    lineIn(img, torso, 36, 30, 38, 53, t.line);
    lineIn(img, torso, 44, 30, 42, 53, t.line);
  } else if (inner) {
    paint(img, P([[37, 29], [43, 29], [40, 36]]), inner, { lightW: 0 });
  }
  if (zip) lineIn(img, torso, 40, 36, 40, 53, zip);
  return torso;
}

/** Abrigo o bata larga hasta la rodilla, abierta: interior y pantalón en la abertura. */
export function longCoat(img, t, { inner, pants, width = 0, lapel = null } = {}) {
  const w = width;
  const coat = P([[31 - w, 31], [38, 28], [49 + w, 30], [52 + w, 36], [48 + w, 45],
    [50 + w, 54], [56 + w, 63], [46, 66], [40, 62], [33, 64], [24 - w, 62], [30 - w, 45], [28 - w, 36]]);
  paint(img, coat, t, { shadowW: 4 });
  paint(img, P([[37, 29], [43, 29], [44, 48], [36, 48]]), inner, { lightW: 1 });
  if (pants) paint(img, P([[36, 48], [44, 48], [45, 64], [35, 64]]), pants, { lightW: 0 });
  lineIn(img, coat, 36, 30, 35, 63, t.line);
  lineIn(img, coat, 44, 30, 45, 63, t.line);
  const l = lapel || t.shadow;
  lineIn(img, coat, 34, 31, 31, 40, l);
  lineIn(img, coat, 46, 31, 49, 40, l);
  lineIn(img, coat, 35, 31, 32, 40, l);
  lineIn(img, coat, 45, 31, 48, 40, l);
  lineIn(img, coat, 31, 46, 29, 60, t.light);
  lineIn(img, coat, 48, 48, 53 + w, 61, t.shadow);
  lineIn(img, coat, 33, 54, 36, 55, t.line);
  return coat;
}

/**
 * Brazos por pose (mangas `sleeve`, manos `skin`): 'down' colgando · 'hips' manos en la cadera ·
 * 'pockets' manos en los bolsillos · 'behind' manos a la espalda · 'holdL' antebrazo izquierdo
 * (derecha de la pantalla) cruzado a la altura del pecho. Devuelve las posiciones de las manos.
 */
export function arm(img, side, pose, sleeve, skin, { dx = 0 } = {}) {
  const m = side === 'L' ? 1 : -1; // L = brazo que queda a la derecha de la pantalla
  const sx = 40 + m * (10 + dx);
  const X = (v) => 40 + m * (v - 40);
  let hand = null;
  switch (pose) {
    case 'hips':
      paint(img, CAP(sx, 33, X(61 + dx), 42, 3.5).union(CAP(X(61 + dx), 42, X(52 + dx), 49, 3)), sleeve);
      hand = [X(51 + dx), 49];
      paint(img, E(hand[0], hand[1], 3, 2.5), skin, { lightW: 1, shadowW: 1 });
      break;
    case 'pockets':
      paint(img, CAP(sx, 33, X(58 + dx), 43, 3.6).union(CAP(X(58 + dx), 43, X(50 + dx), 49, 3)), sleeve);
      break;
    case 'behind':
      paint(img, CAP(sx, 33, X(54 + dx), 43, 3.5), sleeve);
      break;
    case 'present':
      paint(img, CAP(sx, 33, X(59 + dx), 43, 3.5).union(CAP(X(59 + dx), 43, X(67 + dx), 36, 3)), sleeve);
      hand = [X(69 + dx), 35];
      paint(img, E(hand[0], hand[1], 3, 2.5), skin, { lightW: 1, shadowW: 1 });
      break;
    case 'hold':
      paint(img, CAP(sx, 33, X(59 + dx), 43, 3.5).union(CAP(X(59 + dx), 43, X(46), 42, 3)), sleeve, { shadowW: 2 });
      hand = [X(45), 42];
      paint(img, E(hand[0], hand[1], 3, 2.5), skin, { lightW: 1, shadowW: 1 });
      break;
    default: // 'down'
      paint(img, CAP(sx, 34, X(57 + dx), 44, 3.5).union(CAP(X(57 + dx), 44, X(57 + dx), 52, 3)), sleeve);
      hand = [X(57 + dx), 55];
      paint(img, E(hand[0], hand[1], 3, 3), skin, { lightW: 1, shadowW: 1 });
  }
  return hand;
}

/**
 * Ojos y gesto. `brow`: 'flat' | 'raised' (orgullo) | 'tired' (caídas) | 'thick' (gruesas) | 'none'.
 * `lids`: párpados a media asta (aburrimiento). `mouth`: 'flat' | 'smile' | 'smirk' | 'firm'.
 */
export function face(img, o) {
  const { cx, eyeY } = FACE;
  const pal = { k: o.lash, w: '#FFFFFF', I: o.iris, i: o.pupil || '#1C1820' };
  stamp(img, ['kkkk', 'wIIk', 'wiIk'], pal, cx - 6, eyeY);
  stamp(img, ['kkkk', 'kIIw', 'kIiw'], pal, cx + 2, eyeY);
  const all = everywhere();
  if (o.lids) {
    lineIn(img, all, cx - 6, eyeY + 1, cx - 3, eyeY + 1, o.lash);
    lineIn(img, all, cx + 2, eyeY + 1, cx + 5, eyeY + 1, o.lash);
    lineIn(img, all, cx - 6, eyeY, cx - 3, eyeY, o.skinTone);
    lineIn(img, all, cx + 2, eyeY, cx + 5, eyeY, o.skinTone);
  }
  const b = o.browColor;
  switch (o.brow) {
    case 'raised':
      lineIn(img, all, cx - 7, eyeY - 2, cx - 3, eyeY - 3, b);
      lineIn(img, all, cx + 2, eyeY - 3, cx + 6, eyeY - 2, b);
      break;
    case 'tired':
      lineIn(img, all, cx - 6, eyeY - 3, cx - 3, eyeY - 2, b);
      lineIn(img, all, cx + 2, eyeY - 2, cx + 5, eyeY - 3, b);
      lineIn(img, all, cx - 7, eyeY - 2, cx - 7, eyeY - 2, b);
      lineIn(img, all, cx + 6, eyeY - 2, cx + 6, eyeY - 2, b);
      break;
    case 'thick':
      for (const dy of [2, 3]) {
        lineIn(img, all, cx - 7, eyeY - dy, cx - 3, eyeY - dy, b);
        lineIn(img, all, cx + 2, eyeY - dy, cx + 6, eyeY - dy, b);
      }
      break;
    case 'none':
      break;
    default:
      lineIn(img, all, cx - 6, eyeY - 2, cx - 3, eyeY - 2, b);
      lineIn(img, all, cx + 2, eyeY - 2, cx + 5, eyeY - 2, b);
  }
  img.set(cx, eyeY + 4, hex(o.mouthColor)); // nariz
  const my = eyeY + 7;
  switch (o.mouth) {
    case 'smile':
      lineIn(img, all, cx - 2, my, cx + 2, my, o.mouthColor);
      img.set(cx - 3, my - 1, hex(o.mouthColor));
      img.set(cx + 3, my - 1, hex(o.mouthColor));
      break;
    case 'smirk':
      lineIn(img, all, cx - 2, my, cx + 2, my, o.mouthColor);
      img.set(cx + 3, my - 1, hex(o.mouthColor));
      break;
    case 'firm':
      lineIn(img, all, cx - 3, my, cx + 3, my, o.mouthColor);
      break;
    default:
      lineIn(img, all, cx - 1, my, cx + 1, my, o.mouthColor);
  }
}

/** Gafas redondas (montura `frame`; `lens` opcional tiñe el blanco de los ojos). */
export function glasses(img, frame, lens = null) {
  const { cx, eyeY } = FACE;
  for (const ex of [cx - 4, cx + 4]) {
    const ring = E(ex, eyeY + 1.5, 3.6, 2.8).minus(E(ex, eyeY + 1.5, 2.6, 1.8));
    if (lens) {
      const inside = E(ex, eyeY + 1.5, 2.6, 1.8);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!inside.has(x, y)) continue;
        const c = img.get(x, y);
        if (c[0] > 230 && c[1] > 230 && c[2] > 230) img.set(x, y, hex(lens)); // cristal sobre el blanco
      }
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ring.has(x, y)) img.set(x, y, hex(frame));
  }
  lineIn(img, everywhere(), cx - 1, eyeY + 1, cx + 1, eyeY + 1, frame);
}

/** Barba (corta o de días) sobre la mandíbula, dejando libre la boca. */
export function beard(img, t, { full = true } = {}) {
  const { cx, cy, eyeY } = FACE;
  const jaw = E(cx, cy + 1, 8.5, 9.5).and(R(0, eyeY + 4, W, H)).minus(E(cx, eyeY + 7, 3, 1.4));
  const mask = full ? jaw : jaw.minus(E(cx, eyeY + 5, 6, 3));
  paint(img, mask, t, { lightW: 1, shadowW: 2 });
  img.set(cx, eyeY + 4, hex(t.line));
}

/** Arrugas de la edad (patas de gallo y surcos). */
export function wrinkles(img, color) {
  const { cx, eyeY } = FACE;
  const all = everywhere();
  img.set(cx - 7, eyeY + 2, hex(color));
  img.set(cx + 6, eyeY + 2, hex(color));
  lineIn(img, all, cx - 3, eyeY + 5, cx - 3, eyeY + 6, color);
  lineIn(img, all, cx + 3, eyeY + 5, cx + 3, eyeY + 6, color);
}

/** Emblema de Genesis: dos tubos de ensayo cruzados sobre un círculo (7×7). */
export function genesisEmblem(img, x, y) {
  stamp(img, [
    '..MMM..',
    '.MwMwM.',
    'MMwMwMM',
    'MMMwMMM',
    'MMwMwMM',
    '.MwMwM.',
    '..MMM..',
  ], { M: '#B03A8C', w: '#F2F4F5' }, x, y);
}
