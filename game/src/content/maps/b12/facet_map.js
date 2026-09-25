// Mapa de una sala de La Cara Vuelta en una orientación (0 = base, 1 = gemelo girado 90° en sentido horario).
// Ambos mapas se derivan de la MISMA rejilla física (rooms.js), así la casilla equivalente tras cruzar una arista
// es la casilla girada (world/impossible/logic.js#rotatePoint) y los dos gemelos son coherentes por construcción.
// Suelo = isla de piedra; «pared que es suelo en el otro» = bloque de cara vuelta con vetas; roca = bloque liso.
import { zoneDefaults } from '../../services/zones.js';
import { facetMasks } from '../../../world/impossible/logic.js';
import { facetRoom, facetMapId, MARGIN } from './rooms.js';
import { paintPlatform, floatingDebris, DISTORTION_ENV, DISTORTION_TONE } from './paint.js';
import { caraEvents, firstFallHint, arrivalDir } from '../../events/b12_cara.js';
import { F } from '../../events/b12_common.js';

// Las salas de puzzle no tienen encuentros (POKEDEX_DISTRIBUCION: «solo fuera de las salas de puzzle»).
const key = (x, y) => `${x},${y}`;

/** Peñascos decorativos lejos de la sala (en el margen de vacío). */
function debrisFor(size, seed) {
  const s = size - 1;
  const spots = [[2, 3, 2], [s - 4, 2, 3], [1, s - 6, 2], [s - 5, s - 4, 2], [Math.floor(s / 2) - 1, 1, 2]];
  return spots.map(([x, y, w], i) => [x, y, w + ((seed + i) % 2)]);
}

export function facetMapDef(roomId, orient) {
  const room = facetRoom(roomId);
  const m = facetMasks(room, orient, MARGIN);
  const id = facetMapId(roomId, orient);
  // Llegada por defecto: la de la sala en la base; en el gemelo, la primera arista (suelo en ambas orientaciones).
  const [sx, sy] = orient ? m.map(room.aristas[0].x, room.aristas[0].y) : m.map(room.start.x, room.start.y);
  const events = caraEvents(roomId, orient, m);
  const reserved = new Set(events.map((e) => key(e.x, e.y)));
  const veins = new Set(room.aristas.map((a) => key(...m.map(a.x, a.y))));
  const wall = new Set([...m.wall].filter((c) => !m.vuelta.has(c)));
  const seed = roomId.length * 13 + orient * 7;
  return {
    id,
    ...zoneDefaults(id),
    name: 'Pilar Invertido',
    ...DISTORTION_ENV,
    width: m.width,
    height: m.height,
    tone: DISTORTION_TONE, // tinte del P6 (violeta), rebajado
    showLocation: false,
    start: { x: sx, y: sy, dir: arrivalDir(orient) },
    impossible: {
      section: roomId,
      sectionMaps: [facetMapId(roomId, 0), facetMapId(roomId, 1)],
      spawn: { x: sx, y: sy, dir: arrivalDir(orient) },
      fallFlag: F.primeraCaidaP6,
      onFirstFall: firstFallHint,
    },
    build(b) {
      paintPlatform(b, { floor: m.floor, wall, vuelta: m.vuelta, veins, reserved, seed });
      floatingDebris(b, debrisFor(m.width, seed));
    },
    events,
  };
}
