// Mundo Distorsión profundo — el Corazón (docs/CAMPANA.md B22: «Fijar tres "caras" con el Anclaje; la Griseosfera
// está dentro. Forma Origen, nv 75, captura desde el turno 3»). Un corazón de piedra cerrado (anillo de bloques de
// cara vuelta) con la Griseosfera en su pedestal; alrededor, tres caras (losas en codo) que giran sin parar entre las
// islas del sur, el suroeste y el sureste y dos islotes. Cada cara se ancla desde los postes del nudo de las islas
// vecinas; cuando las tres miran al corazón a la vez, el anillo se deshace. Hay que fijarlas en orden (la del este desde
// el sureste, antes de cerrar el paso del sur): reglas y solucionador en b22a_faces_logic.js y tests/b22a_reach.
// Tileset 14, 36×32, sin encuentros. Coordenadas en ./layout.js.
import { CORAZON as C } from './layout.js';
import { paintPlatform, floatingDebris, rectSet, raggedIsland, union, DISTORTION_ENV } from '../b12/paint.js';
import { corazonEvents } from '../../events/b22a_distorsion.js';

const events = corazonEvents();
const key = (x, y) => `${x},${y}`;

/** Anillo del corazón (bloques) e interior (suelo ceremonial). */
export function heartCells() {
  const h = C.heart;
  const ring = new Set();
  const inner = new Set();
  for (let y = h.y0; y <= h.y1; y++) {
    for (let x = h.x0; x <= h.x1; x++) (x === h.x0 || x === h.x1 || y === h.y0 || y === h.y1 ? ring : inner).add(key(x, y));
  }
  return { ring, inner };
}

export default {
  id: 'distorsion_corazon',
  name: 'Mundo Distorsión',
  ...DISTORTION_ENV,
  bgm: 'distortion',
  battleback: 'MundoDistorsion',
  width: C.width,
  height: C.height,
  tone: [0, -26, 30, 100], // violeta más hondo que la Hondura
  anchorZone: true, // Anclaje espacial (X16)
  showLocation: false,
  start: { ...C.arrival },
  encounters: {},
  impossible: { section: 'corazon', spawn: { ...C.arrival } },

  build(b) {
    const reserved = new Set(events.map((e) => key(e.x, e.y)));
    const I = C.islands;
    const wide = (r) => r.x1 - r.x0 >= 4 && r.y1 - r.y0 >= 4;
    // Las islas irregulares no se recortan junto a los tramos estrechos ni junto a las puntas de las caras.
    const thin = Object.values(I).flat().filter((r) => !wide(r));
    const ends = [[12, 12], [15, 15], [18, 18], [21, 15], [24, 12], [9, 9], [27, 9]].map(([x, y]) => key(x, y));
    const keep = union(reserved, rectSet(...thin), new Set(ends));
    const big = (rects, seed) => union(...rects.map((r, i) => (wide(r) ? raggedIsland(r, { keep, seed: seed + i }) : rectSet(r))));
    const { ring, inner } = heartCells();
    const floor = union(big(I.s, 301), big(I.so, 311), big(I.se, 321), rectSet(...I.oeste), rectSet(...I.este), inner);
    paintPlatform(b, { floor, vuelta: ring, reserved, seed: 301, decals: 0.05 });
    // Interior del corazón: enlosado ceremonial y el hexágono del kit de Pilar bajo el pedestal.
    b.rect(1, C.heart.x0 + 1, C.heart.y0 + 1, 5, 5, 'pilar_enlosado');
    for (const [x, y] of [[14, 23], [22, 21], [10, 16], [26, 16]]) b.stamp('pilar_glifo', x, y);
    b.stamp('pilar_columna_quebrada', 20, 24);
    b.stamp('pilar_columna_quebrada', 13, 16);
    b.stamp('pilar_columna_quebrada', 25, 13);
    b.stamp('pilar_arista', 22, 24);
    floatingDebris(b, [[2, 3, 2], [31, 3, 3], [3, 21, 2], [30, 22, 2], [8, 27, 3], [26, 28, 2], [16, 1, 2]]);
  },

  events,
};
