// Partes propias de la PROTAGONISTA FEMENINA en el kit de protagonistas (prota_kit.mjs). Reutiliza los
// brazos, las poses y la mochila del kit común (prota_body.mjs, prota_run.mjs, prota_bag.mjs) y cambia lo
// que define su silueta y su ropa:
//   · chaqueta corta crema sin el tirador verde (su acento va en la goma de la trenza, prota_heads_f.mjs) y
//     sin la línea oscura de cremallera en el perfil;
//   · pantalón corto con un poco de vuelo (1 px por lado en el muslo, de frente y de espaldas) sobre mallas
//     oscuras y botines (colores en palettes.mjs: P/p pantalón corto, Q/q mallas, B/b/W botín).
// Mismas alturas que el masculino (hombros en y1–y2, cadera en y8, suela en y11–y12), así que la mochila, el
// jinete, el buceo, la pesca, el trepar y el Vuelo encajan igual.
import { part, recolorPart, shiftPart } from './prota_kit.mjs';
import { PROTA_WALK, PARTS } from './prota_body.mjs';
import { PROTA_RUN } from './prota_run.mjs';

/** Frente: igual que el del masculino, con la cremallera en lugar del tirador verde. */
const TORSO_DOWN_F = recolorPart(PARTS.TORSO_DOWN, { G: 'd' });

/** Perfil: cuello azul noche y pecho liso (sin tirador ni línea de cremallera). */
const TORSO_LEFT_F = part(PARTS.TORSO_LEFT.y, [
  '..kTJk.',
  '.kTdJjk',
  'kLLJJjk',
  'kLJJJjk',
  'kLJJJjk',
  'kJJJJjk',
  'kjjjjjk',
], PARTS.TORSO_LEFT.x);

/** Torso de ella para un torso del kit común (también los desplazados de la carrera de perfil). */
function herTorso(t) {
  const same = (a, b) => a.rows.join('/') === b.rows.join('/');
  if (same(t, PARTS.TORSO_DOWN)) return shiftPart(TORSO_DOWN_F, t.x - PARTS.TORSO_DOWN.x, t.y - PARTS.TORSO_DOWN.y);
  if (same(t, PARTS.TORSO_LEFT)) return shiftPart(TORSO_LEFT_F, t.x - PARTS.TORSO_LEFT.x, t.y - PARTS.TORSO_LEFT.y);
  if (same(t, PARTS.TORSO_UP)) return t;
  throw new Error(`torso sin equivalente femenino: ${t.rows[0]}`);
}

const FRONT_LEGS_W = 10; // ancho de las piernas de frente/espaldas del kit (x = 4..13)

/**
 * Vuelo del pantalón corto: la fila del muslo (la segunda de la parte) se ensancha 1 px por lado con el
 * color vecino; el resto de filas no cambia. Solo en piernas de frente/espaldas.
 */
export function flareShorts(legs) {
  if (legs.rows[0].length !== FRONT_LEGS_W) return legs;
  const rows = legs.rows.map((r, i) => {
    if (i !== 1) return `.${r}.`;
    return `k${r[1]}${r.slice(1, -1)}${r[r.length - 2]}k`;
  });
  return part(legs.y, rows, legs.x - 1);
}

function dress(poses) {
  const one = (p) => ({ ...p, torso: herTorso(p.torso), legs: flareShorts(p.legs) });
  return Object.freeze({ down: poses.down.map(one), left: poses.left.map(one), up: poses.up.map(one) });
}

export const PROTA_WALK_F = dress(PROTA_WALK);
export const PROTA_RUN_F = dress(PROTA_RUN);
export const PARTS_F = Object.freeze({ TORSO_DOWN_F, TORSO_LEFT_F });
