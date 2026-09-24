// Acciones de campo de los protagonistas con Zygarde (CAMPANA §2.7–2.8): buceo dentro de la burbuja
// verde del 50%, trepar (vista de espaldas agarrado a la pared) y pescar (4 direcciones, 4 frames).
// Todas 4×4 (abajo, izquierda, derecha, arriba) y PROVISIONALES (D30).
import { Img, compose, sheet, fromRows, splitSheet, hex } from '../pixel.mjs';
import { buildFrame, buildHumanSheet, NATIVE, checkRows } from './assemble.mjs';
import { withBackpack } from './backpack.mjs';
import { prota, WALK_BAG } from './rider.mjs';

export const ACTION_SIZE = 48;
const S = ACTION_SIZE;
const DIRS = ['down', 'left', 'right', 'up'];

/** Frames nativos 32×32 de caminar del protagonista: frames[fila][patrón]. */
function walkFrames(id) {
  const { heads, palette } = prota(id);
  return splitSheet(buildHumanSheet({ heads, palette }, WALK_BAG), NATIVE, NATIVE);
}

// ───────────────────────────── Buceo: burbuja verde ─────────────────────────────

const BUBBLE = {
  edge: hex('#1E5A2A'), mid: hex('#6CD040'), bright: hex('#B9FF66'), shine: hex('#E8FFD0'),
};
const BUBBLE_C = [24, 26];
const BUBBLE_R = 18;
const HEX_GLINT = ['.kk.', 'kGGk', 'kGGk', '.kk.'];

/** Anillo de la burbuja (sin relleno: el fondo marino se ve a través) con brillos hexagonales. */
function drawBubble(img, pattern) {
  const [cx, cy] = BUBBLE_C;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const ang = Math.atan2(y + 0.5 - cy, x + 0.5 - cx); // −π..π, 0 = derecha
      if (d >= BUBBLE_R - 1 && d < BUBBLE_R) img.set(x, y, BUBBLE.edge);
      else if (d >= BUBBLE_R - 2 && d < BUBBLE_R - 1) {
        const upperLeft = ang < -Math.PI / 2 && ang > -Math.PI;
        const pulse = pattern % 2 === 1 && Math.floor((ang + Math.PI) * 4) % 3 === 0;
        img.set(x, y, upperLeft ? BUBBLE.shine : pulse ? BUBBLE.bright : BUBBLE.mid);
      } else if (d >= BUBBLE_R - 5 && d < BUBBLE_R - 4 && ang < -1.9 && ang > -2.6) {
        img.set(x, y, BUBBLE.shine); // reflejo interior
      }
    }
  }
  // Tres destellos hexagonales que giran sobre el anillo.
  const glint = fromRows(HEX_GLINT, { k: '#1E5A2A', G: '#B9FF66' });
  for (let k = 0; k < 3; k++) {
    const a = ((pattern * 30 + k * 120 + 20) * Math.PI) / 180;
    const gx = Math.round(cx + Math.cos(a) * (BUBBLE_R - 1.5) - 2);
    const gy = Math.round(cy + Math.sin(a) * (BUBBLE_R - 1.5) - 2);
    img.blit(glint, gx, gy);
  }
  return img;
}

/** Hoja nativa (192×192): el protagonista bucea (ciclo de patadas = caminar) dentro de la burbuja. */
export function buildDiveSheet(id) {
  const walk = walkFrames(id);
  const FLOAT = [0, -1, -1, 0];
  const rows = walk.map((row) => row.map((f, p) => {
    const img = compose(S, S, [{ img: f, x: 8, y: 9 + FLOAT[p] }]);
    return drawBubble(img, p);
  }));
  return sheet(rows, S, S);
}

// ───────────────────────────── Trepar ─────────────────────────────

const CLIMB_TORSO = [
  '....kkkkkkkkkk....',
  '...kJJJJJJJJjjk...',
  '...kJJJJJJJJjjk...',
  '...kJJJJJJJJjjk...',
  '...kJJJJJJJJjjk...',
  '...kjJJJJJJJjjk...',
  '...kjjjjjjjjjjk...',
];
const EMPTY = '..................';

const CLIMB_BODIES = {
  // Pierna derecha recogida (sube), izquierda estirada.
  a: [EMPTY, ...CLIMB_TORSO, '....kPPPPPPPpk....', '....kPPPkkPPpk....', '....kPPk.kQqk.....', '....kQqk.kBbk.....',
    '....kQqk..kk......', '....kBBk..........', '.....kk...........', EMPTY],
  // Cuerpo elevado 1 px, piernas parejas.
  b: [...CLIMB_TORSO, '....kPPPPPPPpk....', '....kPPPkkPPpk....', '....kPPk..kPpk....', '....kQqk..kQqk....',
    '....kQqk..kQqk....', '....kBBk..kBBk....', '.....kk....kk.....', EMPTY, EMPTY],
  // Pierna izquierda recogida.
  c: [EMPTY, ...CLIMB_TORSO, '....kPPPPPPPpk....', '....kPPkkPPPpk....', '.....kQqk.kPpk....', '.....kBbk.kQqk....',
    '......kk..kQqk....', '..........kBBk....', '...........kk.....', EMPTY],
};

// Brazos (coordenadas del frame 32×32): 'up' con la mano por encima de la cabeza, 'mid' a la altura de la oreja.
const ARM_UP = {
  x: 3, y: 6, rows: ['.kk.....', 'kSsk....', 'kssk....', 'kLJk....', '.kLJk...', '.kLJk...', '..kLJk..', '..kLJk..',
    '...kLJk.', '...kLJk.', '....kLJk', '....kLJk', '.....kJk'],
};
const ARM_MID = {
  x: 4, y: 11, rows: ['.kk....', 'kSsk...', 'kssk...', 'kLJk...', '.kLJk..', '..kLJk.', '...kLJk', '....kJk'],
};

/** Brazo derecho = espejo del izquierdo con la manga en sombra (la luz viene de la izquierda). */
function rightArm(arm) {
  const swap = { L: 'J', J: 'j', S: 's' };
  const rows = arm.rows.map((r) => [...r].reverse().map((ch) => swap[ch] || ch).join(''));
  return { x: NATIVE - arm.x - rows[0].length, y: arm.y, rows };
}

function climbFrame(id, body, left, right, lift) {
  const { heads, palette } = prota(id);
  const bag = withBackpack({ down: [], left: [], up: [{ key: 'up0', lift, body: checkRows('trepar', body, 18) }] }).up[0];
  const person = buildFrame({ head: heads.up, body: bag.body, lift }, palette);
  const armL = { img: fromRows(left.rows, palette), x: left.x, y: left.y + lift };
  const r = rightArm(right);
  const armR = { img: fromRows(r.rows, palette), x: r.x, y: r.y + lift };
  return compose(NATIVE, NATIVE, [armL, armR, person]);
}

/** Hoja nativa (128×128): trepar de espaldas, 4 frames; las 4 filas son iguales (sirve en cualquier dirección). */
export function buildClimbSheet(id) {
  const cycle = [
    climbFrame(id, CLIMB_BODIES.a, ARM_UP, ARM_MID, 0),
    climbFrame(id, CLIMB_BODIES.b, ARM_MID, ARM_MID, -1),
    climbFrame(id, CLIMB_BODIES.c, ARM_MID, ARM_UP, 0),
    climbFrame(id, CLIMB_BODIES.b, ARM_MID, ARM_MID, -1),
  ];
  return sheet([cycle, cycle, cycle, cycle], NATIVE, NATIVE);
}

// ───────────────────────────── Pescar ─────────────────────────────

const ROD = { cork: hex('#C89858'), shaft: hex('#4A5064'), tip: hex('#8890A0'), line: hex('#F0F0F8'), skin: null };

/**
 * Caña por frame (coordenadas del lienzo 48×48; el protagonista va en (8, 8) → pies en la fila 38,
 * 8 filas por encima del borde: la hoja lleva "_offset" y el motor la dibuja 16 px más abajo, como las
 * de pesca de Essentials). 0 = caña atrás, 1 = en alto, 2 = lanzada, 3 = lanzada con el sedal y la punta
 * vencida. `behind`: la caña se dibuja detrás del cuerpo.
 */
const FISH = {
  down: { hand: [28, 32], tips: [[37, 12], [30, 5], [37, 45], [36, 46]], behind: [true, true, false, false] },
  left: { hand: [23, 32], tips: [[36, 13], [25, 5], [4, 27], [4, 29]], behind: [true, true, false, false], line: 3 },
  up: { hand: [28, 32], tips: [[19, 44], [26, 2], [30, 2], [30, 3]], behind: [false, true, true, true] },
};

function drawLine(img, x0, y0, x1, y1, colorAt) {
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x);
  const dy = -Math.abs(y1 - y);
  const sx = x < x1 ? 1 : -1;
  const sy = y < y1 ? 1 : -1;
  let err = dx + dy;
  const n = Math.max(dx, -dy);
  for (let i = 0; ; i++) {
    img.set(x, y, colorAt(i, n));
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

function rodLayer(dir, frame, skin) {
  const cfg = FISH[dir];
  const img = new Img(S, S);
  const [hx, hy] = cfg.hand;
  const [tx, ty] = cfg.tips[frame];
  drawLine(img, hx, hy, tx, ty, (i, n) => (i < 2 ? ROD.cork : i > n - 3 ? ROD.tip : ROD.shaft));
  if (cfg.line === frame) for (let y = ty + 1; y <= 38; y++) img.set(tx, y, ROD.line);
  img.set(hx, hy, skin); // la mano agarra el mango
  return img;
}

/** Hoja nativa (192×192) de pesca; el id lleva "_offset" (ver FISH). */
export function buildFishSheet(id) {
  const walk = walkFrames(id);
  const skin = hex(prota(id).palette.S);
  const rows = {};
  for (const [r, dir] of [[0, 'down'], [1, 'left'], [3, 'up']]) {
    rows[dir] = [0, 1, 2, 3].map((frame) => {
      const person = { img: walk[r][0], x: 8, y: 8 };
      const rod = { img: rodLayer(dir, frame, skin), x: 0, y: 0 };
      return compose(S, S, FISH[dir].behind[frame] ? [rod, person] : [person, rod]);
    });
  }
  rows.right = rows.left.map((f) => f.mirrorX());
  return sheet(DIRS.map((d) => rows[d]), S, S);
}
