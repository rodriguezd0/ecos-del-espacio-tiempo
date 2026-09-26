// Senda del Origen · tramo 6 «Invertido»: arista de giro con Ancla (docs/CAMPANA.md B20; reglas y piezas de B12:
// world/impossible/, ARCHITECTURE §16). La sala existe en dos orientaciones precalculadas como mapas gemelos derivados de
// la MISMA rejilla física (layout.js T6): la base (24×18) y el gemelo girado 90° en sentido horario (18×24). Islas con los
// tiles del Mundo Distorsión (tools/distortion_tiles.mjs, filas propias de Cueva1: valen en el tileset 2).
import { facetMasks } from '../../../world/impossible/logic.js';
import { paintPlatform, floatingDebris } from '../b12/paint.js';
import { T6, tramoId } from './layout.js';
import { facetRoom6 } from '../../events/b20_logic.js';
import { F, OBJ, pause } from '../../events/b20_common.js';
import { T6_TEXT, T6_LINKS, t6FirstFall, t6Portal } from '../../events/b20_tramos_b.js';
import { tramoOnEnter } from '../../events/b20_senda.js';
import { tramoTone } from './senda_defs.js';
import { MUSIC } from '../../events/b20_common.js';

const key = (x, y) => `${x},${y}`;
export const t6MapId = (orient) => `${tramoId(6)}${orient ? '_giro' : ''}`;

function t6Events(room, orient, m) {
  const twin = t6MapId(orient ? 0 : 1);
  const at = (p) => m.map(p.x, p.y);
  const out = [];
  room.aristas.forEach((a, i) => {
    const [x, y] = at(a);
    out.push({ id: `t6_arista_${i}`, type: 'arista', x, y, twin, turn: orient ? -1 : 1 });
  });
  room.anchors.forEach((a, i) => {
    const [x, y] = at(a);
    out.push({ id: `t6_ancla_${i}`, type: 'ancla', x, y, text: T6_TEXT.anchor, firstFlag: F.t6Anchor });
  });
  const [ex, ey] = at(room.exit);
  out.push(t6Portal('t6_salida', ex, ey, T6_LINKS.next));
  if (!orient) {
    const [bx, by] = at({ x: T6.back[0], y: T6.back[1] });
    out.push(t6Portal('t6_vuelta', bx, by, T6_LINKS.prev));
  }
  const it = T6.item;
  if ((it.orient ?? 0) === orient) {
    const [ix, iy] = at(it);
    out.push({ id: 't6_objeto', type: 'item', x: ix, y: iy, item: it.item });
  }
  return out;
}

function debrisFor(w, h, seed) {
  return [[1, 1, 2], [w - 4, 2, 2], [1, h - 4, 2], [w - 4, h - 3, 2]].map(([x, y, n], i) => [x, y, n + ((seed + i) % 2)]);
}

/** Definición del mapa del tramo 6 en una orientación (0 = base, 1 = gemelo girado). */
export function senda6Def(orient) {
  const room = facetRoom6();
  const m = facetMasks(room, orient, T6.margin);
  const id = t6MapId(orient);
  const [sx, sy] = orient ? m.map(room.aristas[0].x, room.aristas[0].y) : m.map(room.start.x, room.start.y);
  const events = t6Events(room, orient, m);
  const reserved = new Set(events.map((e) => key(e.x, e.y)));
  const veins = new Set(room.aristas.map((a) => key(...m.map(a.x, a.y))));
  const wall = new Set([...m.wall].filter((c) => !m.vuelta.has(c)));
  const seed = 60 + orient * 7;
  return {
    id,
    name: 'Senda del Origen',
    tileset: 2,
    width: m.width,
    height: m.height,
    outdoor: false,
    cave: true,
    noFollower: true,
    mount: false,
    escapeRope: true,
    bgm: MUSIC.path,
    battleback: 'Cielo',
    tone: tramoTone(6),
    showLocation: !orient,
    encounters: {},
    start: { x: sx, y: sy, dir: orient ? 6 : 8 },
    impossible: {
      section: 'senda_6',
      sectionMaps: [t6MapId(0), t6MapId(1)],
      spawn: { x: sx, y: sy, dir: orient ? 6 : 8 },
      fallFlag: F.t6Fall,
      onFirstFall: t6FirstFall,
    },
    build(b) {
      paintPlatform(b, { floor: m.floor, wall, vuelta: m.vuelta, veins, reserved, seed });
      floatingDebris(b, debrisFor(m.width, m.height, seed));
    },
    warps: [],
    events,
    // El gemelo no tiene guion de entrada (onEnter ausente, no null: el motor y las pruebas esperan función o nada)
    ...(orient ? {} : {
      onEnter: tramoOnEnter(6, async (ctx) => {
        if (ctx.flag('b20_t6_giro_aviso')) return;
        ctx.setFlag('b20_t6_giro_aviso');
        await pause(ctx, 10);
        // Regla del giro: narración neutra (Zygarde habla muy poco, autor, 25-09-2026).
        await ctx.say('Donde brilla la veta, el suelo dobla. Lo que ahora es pared puede ser suelo.');
      }),
    }),
  };
}
