// Mochila de los protagonistas para el kit nuevo (decisión D06 del autor, 24-09-2026). Capa `bag` de
// prota_kit.mjs, en la rejilla del cuerpo y con el rebote del torso:
//   · de frente: correas sobre el pecho, junto a los brazos;
//   · de perfil: la bolsa asoma detrás de la espalda con su solapa y la correa cruza el hombro;
//   · de espaldas: bolsa completa con solapa, costura y bolsillo, centrada sobre la chaqueta.
// Símbolos: A luz · a base · D sombra · z costura/solapa (k = contorno común).
import { part, withProtaBag } from './prota_kit.mjs';

/** Correas de frente (columnas 13 y 18 del frame, junto al borde del torso de 8 px). */
export const BAG_DOWN = part(2, [
  'A....a',
  'A....a',
  'A....a',
  'D....D',
], 6);

/** Bolsa de perfil (detrás de la espalda, a la derecha del torso) y correa sobre el hombro. */
export const BAG_LEFT = part(1, [
  '..aakk..',
  '....kAak',
  '....kzzk',
  '....kAak',
  '....kaDk',
  '....kDDk',
  '....kkk.',
], 7);

/** Bolsa de espaldas. */
export const BAG_UP = part(1, [
  '.kkkkkk.',
  'kAAAAaak',
  'kzzzzzzk',
  'kAaaaaDk',
  'kAaaaaDk',
  'kDDDDDDk',
  '.kkkkkk.',
], 5);

export const PROTA_BAG = Object.freeze({ down: BAG_DOWN, left: BAG_LEFT, up: BAG_UP });

/**
 * Poses con mochila (no modifica las recibidas). La bolsa sigue al torso: una pose puede llevar
 * `torsoDx`/`torsoDy` (p. ej. el torso inclinado al correr) y la bolsa se desplaza igual.
 */
export function withBag(poses, bag = PROTA_BAG) {
  const follow = (b) => (p) => part(b.y + (p.torsoDy || 0), b.rows, b.x + (p.torsoDx || 0));
  return withProtaBag(poses, { down: follow(bag.down), left: follow(bag.left), up: follow(bag.up) });
}
