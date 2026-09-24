// Monturas de Zygarde para los protagonistas (CAMPANA §2.7): 10% (Correr) y 50% (Nadar).
// Base: tiras de seguidor de Añil (ZYGARDE_1.png = 10%, ZYGARDE.png = 50%) con el jinete encima.
// Hojas 4×4 (abajo, izquierda, derecha, arriba × 4 patrones) de 48×48 nativos → 96×96 exportados,
// ancladas abajo-centro como cualquier charset. PROVISIONAL (D30).
import { Img, compose, sheet, hex } from '../pixel.mjs';
import { followerFrames, bobOffsets } from './follower_src.mjs';
import { riderFrame, hangingLeg } from './rider.mjs';

export const MOUNT_SIZE = 48;
const S = MOUNT_SIZE;
const DIRS = ['down', 'left', 'right', 'up'];

// ───────────────────────────── 10%: montura ─────────────────────────────

/**
 * Colocación del jinete sobre el 10% (coordenadas del lienzo 48×48; el 10% va en (8, 16)).
 * down: el jinete asoma por detrás de la cabeza y las piernas cuelgan a los lados del pecho.
 * left: sentado sobre el lomo, pierna sentada por delante del costado.
 * up: de espaldas sobre el lomo, piernas a los lados del cuerpo.
 */
const RIDE10 = {
  down: { rider: [8, 6], legs: [[15, 31], [29, 31]], riderBehind: true },
  left: { rider: [21, 12], legs: [], seated: true },
  up: { rider: [8, 11], legs: [[14, 37], [30, 37]] },
};

function ride10Frame(id, dir, pattern, dogFrames, bob) {
  const cfg = RIDE10[dir];
  const dog = dogFrames[pattern];
  const dy = bob[pattern];
  const rider = riderFrame(id, dir, { seated: cfg.seated });
  const leg = hangingLeg(id);
  const riderLayer = { img: rider, x: cfg.rider[0], y: cfg.rider[1] + dy };
  const layers = cfg.riderBehind
    ? [riderLayer, { img: dog, x: 8, y: 16 }]
    : [{ img: dog, x: 8, y: 16 }, riderLayer];
  // Paso alterno: una pierna sube 1 px en los patrones 1 y 3.
  cfg.legs.forEach(([x, y], i) => layers.push({ img: leg, x, y: y + dy - (pattern % 2 && i === (pattern >> 1) ? 1 : 0) }));
  return compose(S, S, layers);
}

/** Hoja nativa (192×192) del protagonista montado en Zygarde 10%. */
export function buildRide10Sheet(id) {
  const frames = followerFrames('ZYGARDE_1');
  const rows = {};
  for (const [r, dir] of [[0, 'down'], [1, 'left'], [3, 'up']]) {
    const bob = bobOffsets(frames[r]);
    rows[dir] = frames[r].map((_, p) => ride10Frame(id, dir, p, frames[r], bob));
  }
  rows.right = rows.left.map((f) => f.mirrorX());
  return sheet(DIRS.map((d) => rows[d]), S, S);
}

// ───────────────────────────── 50%: nado ─────────────────────────────

const FOAM = hex('#F0FAFF');
const FOAM2 = hex('#A8D8F0');
const RIPPLE = hex('#5A98D0');

/**
 * 50% nadando: el cuerpo queda bajo la línea de agua `water` (se recorta) y se dibuja espuma.
 * down: el jinete va sentado en el cuello, por delante de la cresta. up: de espaldas, en la base
 * de la cresta. left: sentado sobre el lomo, detrás del cuello.
 */
const RIDE50 = {
  down: { mount: [4, 0], rider: [8, 19], water: 42 },
  left: { mount: [4, 6], rider: [13, 11], water: 40 },
  up: { mount: [4, 6], rider: [8, 15], water: 42 },
};

/** Recorta por debajo de `water` y añade espuma pegada a la silueta y ondas a los lados. */
function waterline(img, water, phase) {
  const out = new Img(img.w, img.h);
  for (let y = 0; y < water; y++) for (let x = 0; x < img.w; x++) out.set(x, y, img.get(x, y));
  const cols = [];
  for (let x = 0; x < img.w; x++) if (img.alpha(x, water - 1)) cols.push(x);
  if (!cols.length) return out;
  const x0 = cols[0];
  const x1 = cols[cols.length - 1];
  for (let x = x0 - 2; x <= x1 + 2; x++) {
    out.set(x, water, (x + phase) % 3 === 0 ? FOAM2 : FOAM);
    const inRipple = (x + phase * 2) % 6 < 4;
    if (inRipple && x >= x0 - 4) out.set(x, water + 1, RIPPLE);
  }
  // Estela lateral: dos píxeles de espuma a cada lado, pegados a la línea.
  for (const x of [x0 - 3, x0 - 4, x1 + 3, x1 + 4]) out.set(x, water, FOAM2);
  for (const x of [x0 - 5, x0 - 6, x1 + 5, x1 + 6]) if ((phase + x) % 2 === 0) { out.set(x, water + 1, RIPPLE); out.set(x + (x < x0 ? 1 : -1), water + 1, RIPPLE); }
  return out;
}

function ride50Frame(id, dir, pattern, mountFrames, bob) {
  const cfg = RIDE50[dir];
  const dy = bob[pattern];
  const composed = compose(S, S, [
    { img: mountFrames[pattern], x: cfg.mount[0], y: cfg.mount[1] },
    { img: riderFrame(id, dir), x: cfg.rider[0], y: cfg.rider[1] + dy },
  ]);
  return waterline(composed, cfg.water + (pattern % 2), pattern);
}

/** Hoja nativa (192×192) del protagonista nadando sobre Zygarde 50%. */
export function buildRide50Sheet(id) {
  const frames = followerFrames('ZYGARDE');
  const rows = {};
  for (const [r, dir] of [[0, 'down'], [1, 'left'], [3, 'up']]) {
    const bob = bobOffsets(frames[r]);
    rows[dir] = frames[r].map((_, p) => ride50Frame(id, dir, p, frames[r], bob));
  }
  rows.right = rows.left.map((f) => f.mirrorX());
  return sheet(DIRS.map((d) => rows[d]), S, S);
}
