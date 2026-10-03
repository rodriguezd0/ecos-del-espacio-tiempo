// Ciclo de CORRER del kit de protagonistas (misma rejilla y símbolos que prota_body.mjs). 4 frames como
// los charsets _run de Añil: 0 y 2 = paso cruzado (cuerpo agachado 1 px, lift 1), 1 y 3 = zancada
// (lift 0, la pierna adelantada con la rodilla alta). Brazos flexionados con los puños a la altura del
// pecho; de perfil el torso y la cabeza se adelantan 1 px (`torsoDx`, `headX`).
import { part, shiftPart } from './prota_kit.mjs';
import { mirrorPart, PARTS } from './prota_body.mjs';

const { TORSO_DOWN, TORSO_UP, TORSO_LEFT } = PARTS;

// ───────────────────────────── Frente ─────────────────────────────

/** Brazos flexionados, simétricos (paso cruzado): puños junto al pecho. */
const RARMS_DOWN0 = part(1, [
  '.kkk........kkk.',
  'kLJk........kjjk',
  'kLJJk......kjjjk',
  '.kSsk......kSsk.',
  '.ksrk......ksrk.',
  '..kk........kk..',
], 1);

/** Zancada: puño izquierdo (pantalla) adelante y bajo, codo derecho atrás. */
const RARMS_DOWN1 = part(1, [
  '.kkk........kkk.',
  'kLJk........kjjk',
  'kLJJk.......kjjk',
  '.kLJk.......kjk.',
  '..kSsk.......k..',
  '..ksrk..........',
  '...kk...........',
], 1);

/** Paso cruzado (agachado): pierna izquierda apoyada, la derecha recogida detrás. */
const RLEGS_DOWN0 = part(8, [
  'kPPPPPPppk',
  'kPPpkkPPpk',
  'kQQqkkBBbk',
  'kBBbk.kkk.',
  '.kkk......',
], 4);

/** Zancada: rodilla izquierda alta (pie levantado), pierna derecha estirada hasta el suelo. */
const RLEGS_DOWN1 = part(7, [
  'kPPPPPPppk',
  'kPPpkkPPpk',
  'kBBbkkQQqk',
  'kWWWkkQQqk',
  '.kkk.kQQqk',
  '.....kBBbk',
  '......kkk.',
], 4);

// ───────────────────────────── Perfil ─────────────────────────────

const LEAN = -1; // el torso y la cabeza se adelantan 1 px al correr de perfil
const TORSO_RUN_LEFT = shiftPart(TORSO_LEFT, LEAN, 0);

/** Brazo cercano adelante (puño delante del pecho). */
const RARMS_LEFT_FWD = part(1, ['..kk.', '.kLJk', 'kSsJk', 'ksrk.', '.kk..'], 3);
/** Brazo cercano atrás (codo detrás de la espalda). */
const RARMS_LEFT_BACK = part(1, ['.kk..', 'kLJk.', 'kJJjk', '.kkSk', '...kk'], 8);

/** Paso cruzado de perfil: piernas recogidas bajo el cuerpo. */
const RLEGS_LEFT0 = part(8, [
  '......kPPPPpk.....',
  '......kPPkPpk.....',
  '.....kPPk.kppk....',
  '.....kQqk..kbbk...',
  '....kBBBk...kk....',
], 0);

/** Zancada de perfil: pierna cercana adelante, lejana atrás y alta. */
const RLEGS_LEFT1 = part(7, [
  '......kPPPPpk.....',
  '.....kPPPkPPpk....',
  '...kPPPk..kPpk....',
  '..kQqkk....kqqk...',
  '.kBBk.......kqqk..',
  '.kWWk.......kbbbk.',
  '..kk.........kkk..',
], 0);

/** Zancada contraria: pierna cercana atrás, lejana adelante. */
const RLEGS_LEFT3 = part(7, [
  '......kPPPPpk.....',
  '.....kppPkPPPk....',
  '...kpppk..kPPk....',
  '..kqqkk....kQQk...',
  '.kbbk.......kQQk..',
  '.kbbk.......kBBBk.',
  '..kk.........kWWk.',
], 0);

// ───────────────────────────── Poses de correr ─────────────────────────────

const down = [
  { key: 'rdown0', lift: 1, torso: TORSO_DOWN, arms: RARMS_DOWN0, legs: RLEGS_DOWN0 },
  { key: 'rdown1', lift: 0, torso: TORSO_DOWN, arms: RARMS_DOWN1, legs: RLEGS_DOWN1 },
  { key: 'rdown2', lift: 1, torso: TORSO_DOWN, arms: RARMS_DOWN0, legs: mirrorPart(RLEGS_DOWN0) },
  { key: 'rdown3', lift: 0, torso: TORSO_DOWN, arms: mirrorPart(RARMS_DOWN1), legs: mirrorPart(RLEGS_DOWN1) },
];

const side = (key, lift, arms, legs, armBack = null) => ({
  key, lift, headX: LEAN, torsoDx: LEAN, torso: TORSO_RUN_LEFT, arms, legs, ...(armBack ? { armBack } : {}),
});

export const PROTA_RUN = Object.freeze({
  down,
  left: [
    side('rleft0', 1, RARMS_LEFT_FWD, RLEGS_LEFT0),
    side('rleft1', 0, RARMS_LEFT_BACK, RLEGS_LEFT1),
    side('rleft2', 1, RARMS_LEFT_BACK, RLEGS_LEFT0),
    side('rleft3', 0, RARMS_LEFT_FWD, RLEGS_LEFT3),
  ],
  up: down.map((p) => ({ ...p, key: p.key.replace('rdown', 'rup'), torso: TORSO_UP, arms: mirrorPart(p.arms) })),
});
