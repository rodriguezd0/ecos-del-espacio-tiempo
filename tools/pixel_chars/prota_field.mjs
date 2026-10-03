// Piezas de CAMPO del kit de protagonistas (prota_kit.mjs) para monturas y acciones de Zygarde:
// torso de jinete (cadera cerrada), pierna sentada de perfil, pierna colgante y ciclo de trepar con los
// brazos por encima de la cabeza. Mismas rejillas y símbolos que prota_body.mjs.
import { fromRows, compose } from '../pixel.mjs';
import { part, shiftPart, buildProtaFrame, PROTA, buildProtaSheet } from './prota_kit.mjs';
import { PROTA_WALK, mirrorPart } from './prota_body.mjs';
import { PROTA_RUN } from './prota_run.mjs';
import { withBag } from './prota_bag.mjs';

export const KIT_WALK_BAG = withBag(PROTA_WALK);
export const KIT_RUN_BAG = withBag(PROTA_RUN);

// Un protagonista del kit es { head, palette } y, opcionalmente, poses propias `walk`/`run` (misma forma que
// PROTA_WALK/PROTA_RUN) y mochila `bag` (misma forma que PROTA_BAG); si no, usa las comunes.
const walkPoses = (spec) => (spec.walk ? withBag(spec.walk, spec.bag) : KIT_WALK_BAG);
const runPoses = (spec) => (spec.run ? withBag(spec.run, spec.bag) : KIT_RUN_BAG);

/** Hoja nativa 4×4 de caminar / correr (con mochila) de un protagonista del kit. */
export const kitWalkSheet = (spec) => buildProtaSheet(spec, walkPoses(spec));
export const kitRunSheet = (spec) => buildProtaSheet(spec, runPoses(spec));

// ───────────────────────────── Jinete ─────────────────────────────

/** Cadera cerrada por debajo (jinete de frente o de espaldas: las piernas las pone la montura). */
const RIDER_HIPS = part(7, ['kPPPPPPppk', '.kkkkkkkk.'], 4);

/** Pierna sentada de perfil (mirando a la izquierda): muslo hacia delante y espinilla colgando. */
const SEATED_LEFT = part(7, [
  '......kPPPPpk.....',
  '...kkkPPPPPpk.....',
  '..kPPPPPPPpkk.....',
  '..kQqkkkkkk.......',
  '..kQqk............',
  '.kBBBk............',
  '..kkk.............',
], 0);

/** Pierna colgante (vista de frente o de espaldas): rodilla, espinilla y zapato; el muslo queda tapado. */
export const KIT_HANGING_LEG = Object.freeze(['kPpk', 'kQqk', 'kBBk', 'kWWk', '.kk.']);

/**
 * Frame nativo 32×32 del jinete: cabeza, torso, brazos y mochila de la pose de pie; sin piernas
 * (cadera cerrada) salvo `seated` de perfil, que añade la pierna sentada.
 */
export function kitRiderFrame(spec, dir, { seated = false } = {}) {
  const pose = walkPoses(spec)[dir][0];
  const legs = seated && dir === 'left' ? SEATED_LEFT : RIDER_HIPS;
  return buildProtaFrame({ ...pose, legs }, spec.head[dir], spec.palette);
}

// ───────────────────────────── Trepar ─────────────────────────────

// Brazos en coordenadas del frame 32×32 (se dibujan DETRÁS de la cabeza y el torso: solo asoman
// mano y antebrazo por fuera de la cabeza). 'up' = mano por encima de la cabeza; 'mid' = a la altura
// de la oreja. El derecho es el espejo del izquierdo con la manga en sombra.
const CLIMB_ARM = {
  up: {
    x: 3, y: 6, rows: ['.kk....', 'kSsk...', 'kssk...', 'kLJk...', 'kLJk...', '.kLJk..', '.kLJk..', '.kLJk..',
      '..kLJk.', '..kLJk.', '..kLJk.', '...kLJk', '...kLJk', '...kLJk'],
  },
  mid: {
    x: 4, y: 11, rows: ['.kk...', 'kSsk..', 'kssk..', 'kLJk..', '.kLJk.', '.kLJk.', '..kLJk', '..kLJk', '..kLJk'],
  },
};

/** `spread`: px que el brazo se abre hacia fuera (cabezas con melena más ancha que la rejilla). */
function climbArm(kind, side, palette, spread = 0) {
  const arm = CLIMB_ARM[kind];
  if (side === 'left') return { img: fromRows(arm.rows, palette), x: arm.x - spread, y: arm.y };
  const swap = { L: 'J', J: 'j', S: 's' };
  const rows = arm.rows.map((r) => [...r].reverse().map((ch) => swap[ch] || ch).join(''));
  return { img: fromRows(rows, palette), x: PROTA.native - arm.x - rows[0].length + spread, y: arm.y };
}

/**
 * Ciclo de 4 frames nativos de trepar (de espaldas): pierna derecha arriba, subir, izquierda, subir. Usa el
 * torso de espaldas y las piernas de frente de las poses de caminar del protagonista (las comunes si no trae
 * las suyas): de pie (`up[0]`) y con una pierna levantada (`down[1]`).
 */
export function kitClimbCycle(spec) {
  const walk = spec.walk || PROTA_WALK;
  const TORSO_UP = walk.up[0].torso;
  const LEGS_DOWN0 = walk.up[0].legs;
  const LEGS_DOWN1 = walk.down[1].legs;
  const CLIMB_BAG = withBag({ down: [], left: [], up: [{ key: 'climb', torso: TORSO_UP }] }, spec.bag).up[0].bag;
  // Con una melena más ancha que la rejilla (cabeza de 22 px), los brazos se abren 1 px para que se vean.
  const spread = Math.ceil((spec.head.up[0].length - PROTA.w) / 4);
  const frame = (legs, left, right, lift) => {
    const pose = { lift, torso: TORSO_UP, bag: CLIMB_BAG, legs };
    const person = buildProtaFrame(pose, spec.head.up, spec.palette);
    const arms = [climbArm(left, 'left', spec.palette, spread), climbArm(right, 'right', spec.palette, spread)]
      .map((a) => ({ ...a, y: a.y + lift }));
    return compose(PROTA.native, PROTA.native, [...arms, person]);
  };
  const raised = shiftPart(LEGS_DOWN0, 0, -1); // todo el cuerpo sube 1 px (los pies se separan del suelo)
  return [
    frame(mirrorPart(LEGS_DOWN1), 'up', 'mid', 0),
    frame(raised, 'mid', 'mid', -1),
    frame(LEGS_DOWN1, 'mid', 'up', 0),
    frame(raised, 'mid', 'mid', -1),
  ];
}
