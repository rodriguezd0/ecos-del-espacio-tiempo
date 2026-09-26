// Mundo Distorsión profundo — la Hondura (docs/CAMPANA.md B22 y §1.6: «Mundo Distorsión profundo (por el aljibe)»;
// X16). Se llega por la grieta nueva de la explanada del aljibe (B12, en el postgame). Tres islas que bajan en el vacío:
// la de llegada, la isla grande (encuentros) y la del portal hacia el Corazón. Entre las dos primeras, la primera losa
// que gira sin parar (barra de dos brazos): solo une las islas en vertical y solo se pisa anclada (Anclaje espacial,
// tutorial). Entre la grande y la del portal, puentes de la mirada (como La Mirada del P6). La sombra de Giratina cruza
// una vez. Tileset 14 con el entorno del Mundo Distorsión de B12 (solo lectura). Coordenadas en ./layout.js.
import { HONDA as H } from './layout.js';
import { paintPlatform, floatingDebris, rectSet, rockSet, raggedIsland, union, DISTORTION_ENV, DISTORTION_TONE } from '../b12/paint.js';
import { hondaEvents } from '../../events/b22a_distorsion.js';
import { DISTORSION_HONDA } from '../../encounters/b22a.js';

const events = hondaEvents();
const key = (x, y) => `${x},${y}`;
const I = H.islands;

export default {
  id: 'distorsion_honda',
  name: 'Mundo Distorsión',
  ...DISTORTION_ENV,
  bgm: 'distortion',
  battleback: 'MundoDistorsion',
  width: H.width,
  height: H.height,
  tone: [4, -22, 26, 90], // violeta del P6, más hondo y apagado
  anchorZone: true, // Anclaje espacial (X16)
  start: { ...H.arrival },
  encounters: {},
  encounterZones: [{ x0: I.i1.x0, y0: I.i1.y0, x1: I.i1.x1, y1: I.i1.y1, encounters: DISTORSION_HONDA }],
  impossible: { section: 'honda', spawn: { ...H.arrival } },

  build(b) {
    const reserved = new Set(events.map((e) => key(e.x, e.y)));
    // Puntas de la losa y del puente: las islas no se recortan junto a ellas.
    const keep = union(reserved, new Set([key(17, 32), key(17, 26), key(17, 16), key(17, 10)]));
    const floor = union(
      raggedIsland(I.i0, { keep, seed: 211 }), raggedIsland(I.i1, { keep, seed: 223, bites: 0.14 }), raggedIsland(I.i2, { keep, seed: 227 }),
    );
    const rocks = new Set([...rockSet(H.rocks)].filter((c) => floor.has(c) && !reserved.has(c)));
    for (const c of rocks) floor.delete(c);
    paintPlatform(b, { floor, wall: rocks, reserved, seed: 211 });
    // Kit de Pilar del P6 (tileset 14): enlosado ante la losa, glifos y columnas rotas en la isla grande.
    b.rect(1, 15, 34, 5, 2, 'pilar_enlosado');
    for (const [x, y] of [[11, 21], [25, 20], [15, 8], [19, 34]]) b.stamp('pilar_glifo', x, y);
    for (const [x, y] of [[9, 24], [26, 19], [20, 24]]) b.stamp('pilar_columna_quebrada', x, y - 1);
    b.stamp('pilar_arista_grande', 22, 20);
    b.stamp('pilar_arista', 13, 17);
    b.stamp('pilar_monolito', 19, 5);
    floatingDebris(b, [[3, 5, 2], [28, 3, 3], [2, 30, 3], [29, 30, 2], [5, 12, 2], [30, 12, 2], [25, 36, 2], [8, 36, 2]]);
  },

  events,
};

export const HONDA_FLOOR_RECTS = Object.freeze(Object.values(I).map((r) => rectSet(r)));
