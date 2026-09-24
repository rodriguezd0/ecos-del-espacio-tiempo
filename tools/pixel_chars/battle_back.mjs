// Sprites de combate de espalda de los protagonistas (estilo BW): tira de 5 frames nativos 80×80
// (0 = estático; 1 = preparar, 2 = brazo arriba, 3 = lanzar, 4 = seguimiento). PROVISIONALES (D30).
import { Img, hex } from '../pixel.mjs';
import { ellipse, poly, capsule, rect, paint, silhouette, stamp, lineIn } from './raster.mjs';

export const BACK_SIZE = 80;
const W = BACK_SIZE;
const H = BACK_SIZE;
const OUTLINE = '#1C1820';

const SKIN = { light: '#FCE0C4', base: '#F2BC8E', shadow: '#C8845A', line: '#7A4A30' };

const BALL = [
  '..kkk..',
  '.kRRRk.',
  'kRLRRRk',
  'kkkWkkk',
  'kWWWWWk',
  '.kWWWk.',
  '..kkk..',
];
const BALL_PAL = { k: OUTLINE, R: '#E83838', L: '#FF9C9C', W: '#F4F4F4' };

// Poses del brazo que lanza (lado derecho de la pantalla) y del cuerpo.
const POSES = [
  { lean: [0, 0], arm: 'down' },
  { lean: [1, 1], arm: 'windup', ball: [62, 71] },
  { lean: [1, 0], arm: 'raise', ball: [61, 24] },
  { lean: [-2, -1], arm: 'throw' },
  { lean: [-1, 0], arm: 'follow' },
];

function armMask(kind, [lx, ly]) {
  const sx = 57 + lx;
  const sy = 58 + ly;
  switch (kind) {
    case 'down': return capsule(W, H, sx, sy, sx + 6, 82, 6);
    case 'windup': return capsule(W, H, sx, sy, sx + 9, sy + 10, 6).union(capsule(W, H, sx + 9, sy + 10, sx + 5, sy + 17, 5));
    case 'raise': return capsule(W, H, sx, sy - 2, sx + 10, sy - 12, 6).union(capsule(W, H, sx + 10, sy - 12, sx + 6, sy - 27, 5));
    case 'throw': return capsule(W, H, sx - 1, sy - 4, sx + 3, sy - 18, 6).union(capsule(W, H, sx + 3, sy - 18, sx + 1, sy - 33, 5));
    default: return null; // 'follow': el brazo queda oculto tras el cuerpo
  }
}

function handPos(kind, [lx, ly]) {
  const sx = 57 + lx;
  const sy = 58 + ly;
  if (kind === 'windup') return [sx + 5, sy + 18];
  if (kind === 'raise') return [sx + 5, sy - 30];
  if (kind === 'throw') return [sx + 1, sy - 36];
  return null;
}

/** Pelo del protagonista masculino visto de espaldas: masa, puntas hacia su izquierda y nuca. */
function hairMaleMask([lx, ly]) {
  const m = ellipse(W, H, 40 + lx, 28 + ly, 18, 17);
  const tufts = [
    [[37, 14], [46, 12], [35, 2]],
    [[45, 14], [54, 17], [49, 5]],
    [[25, 19], [32, 14], [22, 9]],
    [[30, 41], [37, 41], [33, 48]],
    [[37, 42], [44, 42], [40, 50]],
    [[44, 41], [51, 40], [48, 47]],
  ].map((pts) => poly(W, H, pts.map(([x, y]) => [x + lx, y + ly])));
  return m.union(...tufts);
}

/** Melena de la protagonista femenina vista de espaldas (hasta los hombros). */
function hairFemaleMask([lx, ly]) {
  const head = ellipse(W, H, 40 + lx, 28 + ly, 18, 17);
  const curtain = poly(W, H, [
    [22, 28], [58, 28], [61, 52], [59, 60], [54, 57], [48, 62], [42, 59], [36, 62], [30, 58], [24, 61], [19, 55],
  ].map(([x, y]) => [x + lx, y + ly]));
  return head.union(curtain);
}

const CONFIGS = {
  protagonista_m: {
    hairMask: hairMaleMask,
    hair: { light: '#E8A060', base: '#BC6630', shadow: '#8C4424', line: '#5C2A1A' },
    strands: [[33, 22, 29, 36], [39, 27, 37, 42], [45, 24, 47, 38], [51, 28, 54, 34], [28, 32, 27, 38]],
    jacket: { light: '#3E8E96', base: '#256870', shadow: '#194A52', line: '#0E3036' },
    collar: { light: '#56A8B0', base: '#3E8E96', shadow: '#256870', line: '#0E3036' },
    ears: true,
  },
  protagonista_f: {
    hairMask: hairFemaleMask,
    hair: { light: '#5A6CB4', base: '#34427E', shadow: '#222C58', line: '#141A38' },
    strands: [[32, 30, 30, 57], [40, 32, 40, 58], [48, 30, 50, 57], [26, 36, 23, 52], [54, 36, 57, 52]],
    band: true,
    jacket: { light: '#F6F4EE', base: '#DCD8CC', shadow: '#A9A496', line: '#6C685E' },
    collar: { light: '#FFFFFF', base: '#F6F4EE', shadow: '#DCD8CC', line: '#6C685E' },
    ears: false,
  },
};

function drawFrame(cfg, pose) {
  const img = new Img(W, H);
  const [lx, ly] = pose.lean;
  const arm = armMask(pose.arm, pose.lean);
  const behind = pose.arm === 'throw';
  if (arm && behind) paint(img, arm, cfg.jacket);
  const torso = ellipse(W, H, 25 + lx, 61 + ly, 12, 9).union(
    ellipse(W, H, 55 + lx, 61 + ly, 12, 9),
    rect(W, H, 13 + lx, 61 + ly, 55, 22),
    poly(W, H, [[24, 53], [56, 53], [62, 62], [18, 62]].map(([x, y]) => [x + lx, y + ly])),
  );
  paint(img, torso, cfg.jacket, { shadowW: 4 });
  lineIn(img, torso, 40 + lx, 64 + ly, 40 + lx, 80, cfg.jacket.shadow); // costura central
  paint(img, capsule(W, H, 23 + lx, 59 + ly, 17 + lx, 82, 6), cfg.jacket); // brazo izquierdo
  paint(img, rect(W, H, 34 + lx, 40 + ly, 12, 12), SKIN, { lightW: 0 }); // cuello
  paint(img, poly(W, H, [[29, 47], [51, 47], [54, 55], [26, 55]].map(([x, y]) => [x + lx, y + ly])), cfg.collar);
  if (cfg.ears) {
    paint(img, ellipse(W, H, 22 + lx, 33 + ly, 3, 4), SKIN, { lightW: 1, shadowW: 1 });
    paint(img, ellipse(W, H, 58 + lx, 33 + ly, 3, 4), SKIN, { lightW: 1, shadowW: 1 });
  }
  if (arm && !behind) paint(img, arm, cfg.jacket); // bajo el pelo (la melena cubre el hombro)
  const hair = cfg.hairMask(pose.lean);
  paint(img, hair, cfg.hair, { lightW: 3, shadowW: 4 });
  if (cfg.band) {
    const band = ellipse(W, H, 40 + lx, 25 + ly, 15, 11).minus(ellipse(W, H, 40 + lx, 28 + ly, 15, 11)).and(hair);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (band.has(x, y)) img.set(x, y, hex(cfg.hair.light));
  }
  for (const [x0, y0, x1, y1] of cfg.strands) lineIn(img, hair, x0 + lx, y0 + ly, x1 + lx, y1 + ly, cfg.hair.shadow);
  const hand = handPos(pose.arm, pose.lean);
  if (hand) paint(img, ellipse(W, H, hand[0], hand[1], 4, 4), SKIN, { lightW: 1, shadowW: 2 });
  let out = silhouette(img, OUTLINE);
  if (pose.ball) stamp(out, BALL, BALL_PAL, pose.ball[0] - 3 + (pose.arm === 'raise' ? lx : 0), pose.ball[1] - 3);
  out = clearBottomEdge(out);
  return out;
}

/** El cuerpo continúa fuera del marco: sin contorno en la fila inferior. */
function clearBottomEdge(img) {
  const out = img.clone();
  const k = hex(OUTLINE);
  for (let x = 0; x < W; x++) {
    const c = out.get(x, H - 1);
    if (c[3] && c[0] === k[0] && c[1] === k[1] && c[2] === k[2]) out.set(x, H - 1, out.get(x, H - 2));
  }
  return out;
}

/** Tira de 5 frames nativos (400×80). */
export function buildBackStrip(id) {
  const cfg = CONFIGS[id];
  if (!cfg) throw new Error(`Sin configuración de espalda para "${id}"`);
  const strip = new Img(W * POSES.length, H);
  POSES.forEach((pose, i) => strip.blit(drawFrame(cfg, pose), i * W, 0));
  return strip;
}
