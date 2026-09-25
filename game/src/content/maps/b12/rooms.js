// La Cara Vuelta (docs/CAMPANA.md B12, «Espacio imposible 2D»): tres salas, cada una con dos orientaciones
// precalculadas como mapas gemelos. Rejilla FÍSICA de cada sala (leyenda en world/impossible/logic.js#FACET_CHARS):
//   ' ' vacío · '.' suelo · 'A' suelo en la base / pared en el gemelo · 'B' pared en la base / suelo en el gemelo
//   'a' suelo en la base / vacío en el gemelo · 'b' vacío en la base / suelo en el gemelo · '*' arista (veta)
//   '@' Ancla · 'S' llegada · 'X' salida · 'c' célula (C052, suelo solo en el gemelo)
// La orientación 1 (gemelo) es la rejilla girada 90° en sentido horario. Cada mapa lleva un margen de vacío de
// MARGIN casillas para que la cámara no se ajuste al borde (el giro de pantalla se ve continuo).
// Soluciones comprobadas en tests/b12_reach.test.mjs (BFS sobre estados casilla × orientación).
import { parseFacetRoom } from '../../../world/impossible/logic.js';

export const MARGIN = 9;

const ROOM_DEFS = Object.freeze({
  // Sala 1 — «El primer doblez»: una sola arista; la pared violeta es el suelo del gemelo.
  cara_1: {
    rows: [
      '    ..X..    ',
      '   #.....#   ',
      '   .......   ',
      '  BBBBBBBBB  ',
      '  BBBBBBBBB  ',
      '  BBBBBBBBB  ',
      '  ####*####  ',
      '   .......   ',
      '   #.....#   ',
      '    ..@..    ',
      '    .....    ',
      '     .S.     ',
      '             ',
    ],
    symbol: 'veta', // Ancla de la entrada: símbolo de la sección (la repiten las Anclas del núcleo)
  },
  // Sala 2 — «Dos caras»: la salida solo se alcanza desde el gemelo; C052 en la repisa que solo existe girada.
  cara_2: {
    rows: [
      '       .X.       ',
      '       aaa       ',
      '  bbbbb a bbbbb  ',
      '  bbbbb a bbbbb  ',
      '  bb   #*#   bb  ',
      '  bb   #B#   bb  ',
      '  bb    B    bbc ',
      '  *BBBBBB    bb  ',
      '  aa     BBBB*   ',
      '  aa         aa  ',
      '  aa    @    aa  ',
      '  aaaaaa.aaaaaa  ',
      '  aaaaaa.aaaaaa  ',
      '       ...       ',
      '       .S.       ',
      '                 ',
      '                 ',
    ],
    cellOrient: 1,
    cell: 'cell_invertido_1',
    items: [{ id: 'objeto_repisa', x: 2, y: 2, item: 'MAXETHER', orient: 1 }],
  },
  // Sala 3 — «La espiral»: cuatro aristas en las esquinas; cada tramo se recorre en la orientación contraria.
  cara_3: {
    rows: [
      '                 ',
      '  #AAAAAAAAAA#   ',
      '  *AAAAAAAAAA*#  ',
      '  BB         BB  ',
      '  BB         BB  ',
      '  BB  #...#  BB  ',
      '  BB  .....  BB@ ',
      '  BB  ..X..  BB  ',
      '  BB  .....  BBbb',
      '  BB  #...#  BB  ',
      '  BB    .    BB  ',
      '  #*AAAAA    BB  ',
      '             BB  ',
      '             BB  ',
      '   AAAAAAAAAABB  ',
      '  SAAAAAAAAAA*#  ',
      '                 ',
    ],
    items: [{ id: 'objeto_espiral', x: 16, y: 8, item: 'FULLRESTORE', orient: 1 }],
  },
});

/** Sala analizada con sus metadatos: { id, w, h, rows, start, exit, aristas, anchors, cell, cellOrient, items, … } */
export function facetRoom(id) {
  const def = ROOM_DEFS[id];
  if (!def) throw new Error(`Sala de La Cara Vuelta desconocida: ${id}`);
  return Object.freeze({ id, ...parseFacetRoom(def.rows, { cellOrient: def.cellOrient ?? 1 }), cellKey: def.cell || null, items: def.items || [], symbol: def.symbol || null });
}

export const FACET_ROOM_IDS = Object.freeze(Object.keys(ROOM_DEFS));

/** Id de mapa de una sala en una orientación (0 = base, 1 = gemelo girado). */
export const facetMapId = (roomId, orient) => `pilar_invertido_${roomId}${orient ? '_giro' : ''}`;
