// Coordenadas de la Cámara del Cruce (B18, Pilar de la Convergencia; docs/CAMPANA.md B18 y §1.5: «Puente y Cámara del
// Cruce (3 salas)»). Un solo mapa de tileset 8 (InteriorLiga + kit común de Pilar, tinte plata del P9) con cinco salas
// solemnes que flotan sobre el abismo de la Sima (casillas sin tiles + panorama `sima`, `voidBlocks`):
//   Vestíbulo (primer cristal) → (1) Sala de la Caída → (2) Sala del Río → (3) Sala del Cruce → Cámara del núcleo.
// Cada sala = su rejilla ASCII (content/events/b18_cruce_rooms.js) con la esquina en (ox, oy), tres filas de pared
// encima y tres filas debajo con la escalinata de bajada (warps por dirección). La puerta de la pared norte (dintel)
// está sobre la casilla X de la rejilla. FUENTE ÚNICA del mapa, los eventos, las pruebas y el E2E. Módulo puro.
import { ROOMS } from '../../events/b18_cruce_rooms.js';

export const W = 58;
export const H = 42;

const P = (x, y, dir = 8) => Object.freeze({ x, y, dir });

/** Sala de la mazmorra: rejilla en (ox, oy) + paredes arriba + escalinata abajo. */
function placeRoom(name, ox, oy, { color }) {
  const g = ROOMS[name];
  const room = Object.freeze({ x: ox, y: oy - 3, w: g.w, h: 3 + g.h + 3 });
  const cx = ox + g.entry.x;
  const stairsY = oy + g.h; // primera fila de la escalinata (3×3)
  const exit = g.exits[0] ? { x: ox + g.exits[0].x, y: oy + g.exits[0].y } : null;
  return Object.freeze({
    name, ox, oy, grid: g, room, color,
    entry: P(ox + g.entry.x, oy + g.entry.y, 8), // casilla E (punto seguro de las caídas)
    stairs: Object.freeze({
      stamp: Object.freeze({ x: cx - 1, y: stairsY }),
      exits: Object.freeze([cx - 1, cx, cx + 1].map((x) => Object.freeze({ x, y: stairsY + 2 }))),
      arrive: P(cx, stairsY + 1, 8),
    }),
    gate: exit ? gateAt(room, exit.x) : null,
  });
}

/** Puerta en la pared norte (dintel 5×4 sobre el marco, hueco negro de 3); el warp está en el centro del hueco. */
function gateAt(room, cx) {
  return Object.freeze({
    cx,
    dintel: Object.freeze({ x: cx - 2, y: room.y - 1 }),
    hollow: Object.freeze([cx - 1, cx, cx + 1].map((x) => Object.freeze({ x, y: room.y + 2 }))),
    warp: Object.freeze({ x: cx, y: room.y + 2 }),
    front: P(cx, room.y + 3, 2), // casilla X (se llega mirando hacia abajo)
  });
}

export const VESTIBULO = placeRoom('vestibulo', 4, 5, { color: 'sala_pizarra' });
export const CAIDA = placeRoom('caida', 4, 24, { color: 'sala_azul' });
export const RIO = placeRoom('rio', 22, 5, { color: 'sala_azul' });
export const CRUCE = placeRoom('cruce', 21, 24, { color: 'sala_morado' });

/** Atajo del vestíbulo al núcleo (se abre la primera vez que se llega al núcleo): segunda puerta en la pared norte. */
export const SHORTCUT = gateAt(VESTIBULO.room, VESTIBULO.ox + 9);

/** Cámara del núcleo (sin rompecabezas): 17×12 de suelo, Dialga al oeste, Palkia al este, el núcleo en el centro. */
const NUCLEO_ROOM = Object.freeze({ x: 40, y: 2, w: 17, h: 3 + 12 + 3 });
const NUCLEO_FLOOR_TOP = NUCLEO_ROOM.y + 3;
const NCX = NUCLEO_ROOM.x + 8;
export const NUCLEO = Object.freeze({
  room: NUCLEO_ROOM,
  floorTop: NUCLEO_FLOOR_TOP,
  floorBottom: NUCLEO_ROOM.y + NUCLEO_ROOM.h - 1,
  cx: NCX,
  chamber: Object.freeze({ x: NCX - 2, y: NUCLEO_FLOOR_TOP + 2 }), // pilar_camara_nucleo 5×5 (centro = núcleo)
  core: Object.freeze({ x: NCX, y: NUCLEO_FLOOR_TOP + 4 }), // el núcleo (zócalo central): se usa desde abajo
  coreFront: P(NCX, NUCLEO_FLOOR_TOP + 5, 8),
  dialga: P(NCX - 5, NUCLEO_FLOOR_TOP + 4, 6),
  palkia: P(NCX + 5, NUCLEO_FLOOR_TOP + 4, 4),
  /** Donde baja el elegido para el combate (delante del núcleo) y donde queda el orbe del no elegido. */
  bound: P(NCX, NUCLEO_FLOOR_TOP + 2, 2),
  orb: Object.freeze({ x: NCX + 3, y: NUCLEO_FLOOR_TOP + 7 }),
  inscription: Object.freeze({ x: NCX - 1, y: NUCLEO_ROOM.y + 2 }), // placa Unown (2×2) en la pared norte
  stairs: Object.freeze({
    stamp: Object.freeze({ x: NCX - 1, y: NUCLEO_ROOM.y + NUCLEO_ROOM.h - 3 }),
    exits: Object.freeze([NCX - 1, NCX, NCX + 1].map((x) => Object.freeze({ x, y: NUCLEO_ROOM.y + NUCLEO_ROOM.h - 1 }))),
    arrive: P(NCX, NUCLEO_ROOM.y + NUCLEO_ROOM.h - 2, 8),
  }),
  arrival: P(NCX, NUCLEO_ROOM.y + NUCLEO_ROOM.h - 4, 8), // disparador de la primera llegada (fila sobre la escalinata)
});

/** Salas en orden de recorrido. */
export const ROOM_PLACES = Object.freeze([VESTIBULO, CAIDA, RIO, CRUCE]);

/** Llegada desde el Puente (escalinata del vestíbulo) y reintento del combate del núcleo («entrada de la Cámara»). */
export const ENTRY = VESTIBULO.stairs.arrive;
