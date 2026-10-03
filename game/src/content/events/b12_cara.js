// La Cara Vuelta (docs/CAMPANA.md B12 «(a) La Cara Vuelta», C052): tres salas, cada una en dos orientaciones
// precalculadas como mapas gemelos (content/maps/b12/rooms.js y facet_map.js). Las vetas violetas marcan aristas: al
// pisar una la pantalla gira 90° y se carga el gemelo (tipo de evento `arista`, world/impossible/). Los controles
// siguen referidos a la pantalla. Anclas en cada sala; caer al vacío devuelve a la última sin daño ni contador.
import { F, ANCHOR_ART, OBJ } from './b12_common.js';
import { facetRoom, facetMapId, MARGIN, FACET_ROOM_IDS } from '../maps/b12/rooms.js';
import { facetMasks, rotateDir } from '../../world/impossible/logic.js';
import { MIRADA } from '../maps/b12/layout.js';
import { b12CellEvents } from './b12_cells.js';
import { stairEvent, facetReturn } from './b12_vertical.js';

export const CARA_TEXT = Object.freeze({
  anchor: 'Un poste de piedra con un anillo tallado. Al tocarlo, el aire a su alrededor se queda quieto. Si caes, volverás aquí.',
  exit: 'Una grieta violeta en el aire. Al otro lado, más piedra flotando.',
  firstFall: 'Caes al vacío… y, sin un rasguño, vuelves a aparecer junto al último poste.',
});

/** Primera vez que se cae al vacío en el Mundo Distorsión (lo usa `impossible.onFirstFall` de cada mapa). Narración neutra: Zygarde habla muy poco (autor, 25-09-2026). */
export async function firstFallHint(ctx) {
  await ctx.say(CARA_TEXT.firstFall);
}

/** Entrada a una sala: casilla de llegada en el mapa base (orientación 0). → { map, x, y, dir } */
export function roomEntry(roomId) {
  const room = facetRoom(roomId);
  const [x, y] = facetMasks(room, 0, MARGIN).map(room.start.x, room.start.y);
  return { map: facetMapId(roomId, 0), x, y, dir: 8 };
}

/** Siguiente paso tras la salida de una sala: la sala siguiente o La Mirada. */
export function nextAfter(roomId) {
  const i = FACET_ROOM_IDS.indexOf(roomId);
  if (i >= 0 && i < FACET_ROOM_IDS.length - 1) return roomEntry(FACET_ROOM_IDS[i + 1]);
  return { map: 'pilar_invertido_mirada', ...MIRADA.start };
}

const ENTRY_FLAG = { cara_1: F.caraEntrada1, cara_2: F.caraEntrada2, cara_3: F.caraEntrada3 };

function entryEvent(roomId, x, y) {
  const flag = ENTRY_FLAG[roomId];
  return {
    id: 'b12_cara_entrada', x, y, through: true, trigger: 'auto',
    when: (s) => Boolean(s) && !s.flag(flag),
    script: async (ctx) => { ctx.setFlag(flag); }, // Zygarde habla muy poco (autor, 25-09-2026): sin pistas al entrar
  };
}

function exitEvent(roomId, x, y) {
  const next = nextAfter(roomId);
  if (roomId === FACET_ROOM_IDS.at(-1)) return stairEvent('b12_cara_salida', { x, y }, next, { flag: F.caraVueltaHecha });
  return {
    id: 'b12_cara_salida', x, y, sprite: OBJ.portal, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, through: true, shadow: false,
    trigger: 'touch', glow: { name: 'softLight', radius: 56, intensity: 0.55, pulse: 0.5, color: [190, 120, 255] },
    script: async (ctx) => {
      ctx.se('PRSFX- Teleport', { volume: 60 });
      await ctx.warp(next.map, next.x, next.y, next.dir, { fade: true, frames: 20 });
    },
  };
}

/** Eventos de una sala en una orientación (0 = base, 1 = gemelo). `m` = máscaras de facetMasks. */
export function caraEvents(roomId, orient, m) {
  const room = facetRoom(roomId);
  const mapId = facetMapId(roomId, orient);
  const twin = facetMapId(roomId, orient ? 0 : 1);
  const at = (p) => m.map(p.x, p.y);
  const out = [];
  room.aristas.forEach((a, i) => {
    const [x, y] = at(a);
    out.push({ id: `b12_arista_${i}`, type: 'arista', x, y, twin, turn: orient ? -1 : 1 });
  });
  room.anchors.forEach((a, i) => {
    const [x, y] = at(a);
    const sprite = room.symbol && i === 0 ? ANCHOR_ART[room.symbol] : undefined;
    out.push({ id: `b12_ancla_${i}`, type: 'ancla', x, y, sprite, text: CARA_TEXT.anchor, firstFlag: F.primeraAnclaP6 });
  });
  const [ex, ey] = at(room.exit);
  out.push(exitEvent(roomId, ex, ey));
  const [rx, ry] = at(room.start);
  out.push(facetReturn(rx, ry));
  for (const it of room.items) {
    if ((it.orient ?? 0) !== orient) continue;
    const [x, y] = at(it);
    out.push({ id: it.id, type: 'item', x, y, item: it.item, count: it.count || 1 });
  }
  out.push(...b12CellEvents(mapId));
  if (!orient) {
    const [sx, sy] = at(room.start);
    out.push(entryEvent(roomId, sx, sy));
  }
  return out;
}

/** Dirección de llegada en una orientación (la de subir hacia el norte físico). */
export const arrivalDir = (orient) => (orient ? rotateDir(8, 1) : 8);
