// Molino del Diezmo (T02; CAMPANA B05: `molino_diezmo`, tileset 4). Sala de la muela con el tren de engranajes en
// la pared, la palanca de la compuerta y la muela; escalera al desván, donde está la rueda dentada mediana y la
// puerta trasera al canal alto (caudal_canal_alto). La puerta principal da a Ciudad Caudal (B03 construye el
// exterior; ver MOLINO_DOOR en ./links.js y el README). Eventos en content/events/b05_t02.js.
import { exitArrowEvents } from '../../services/interior.js';
import { MILL, millEvents, CANAL } from '../../events/b05_t02.js';
import { MOLINO_DOOR, mapRegistered } from './links.js';
import { examine } from '../../events/b05_common.js';

const M = MILL;
/** Sacos y cajas (b05_sacos.png: col 0 montón, 1 saco, 2 caja). */
const SACKS = Object.freeze({ sprite: 'asset:objects/b05_sacos.png', dir: 2, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action' });
// Puerta trasera: tiles de la puerta de madera de Interior1 (2×3, como la del laboratorio de Alerce).
const BACK_DOOR = { w: 2, h: 3, layers: [null, [1256, 1257, 1264, 1265, 1272, 1273], null] };

/** Salida principal: a Caudal cuando B03 fija la puerta; mientras tanto, al Camino de la Vega (Ruta 4). */
export const MAIN_EXIT = MOLINO_DOOR.ready && mapRegistered(MOLINO_DOOR.map)
  ? { map: MOLINO_DOOR.map, x: MOLINO_DOOR.exitX, y: MOLINO_DOOR.exitY }
  : { map: 'ruta_4', x: 2, y: 14 };

export default {
  id: 'molino_diezmo',
  name: 'Molino del Diezmo',
  tileset: 4,
  width: M.width,
  height: M.height,
  outdoor: false,
  bgm: 'CiudadCeleste',
  battleback: 'indoor',
  start: { x: M.door.x, y: M.door.y, dir: 8 },
  stamps: { puerta_trasera: { tiles: BACK_DOOR, desc: 'Puerta de madera (pared del desván)' } },

  build(b) {
    b.fill(null, 'vacio');
    const A = M.roomA;
    const B = M.roomB;
    b.rect(null, A.x, A.y, A.w, A.h, 'habitacion_casa');
    b.rect(null, B.x, B.y, B.w, B.h, 'habitacion_casa');
    b.stamp('salida_casa', M.door.x - 2, M.door.y);
    b.stamp(M.stairsUp.stamp, M.stairsUp.x, M.stairsUp.y);
    b.stamp(M.stairsDown.stamp, M.stairsDown.x, M.stairsDown.y);
    b.stamp('puerta_trasera', M.backDoor.x, M.backDoor.y);
    // Sala de la muela: harina, una mesa y la ventana al río
    b.rect(null, 6, 6, 5, 4, 'alfombra_beige');
    b.stamp('ventana', 12, 2);
    b.stamp('cuadro', 12, 3); // placa de latón del tren de engranajes (evento `placa`, en la casilla de debajo)
    b.stamp('reloj_pared', 14, 2);
    b.stamp('planta', 1, 5);
    // Desván: trastos del molinero
    b.stamp('estanteria_naranja', 18, 3);
    b.stamp('comoda', 19, 3);
    b.stamp('armario_lateral', 18, 5);
    b.stamp('ventana', 25, 2);
  },

  warps: [
    ...[-1, 0, 1].map((dx) => ({ x: M.door.x + dx, y: M.door.y, dirTrigger: 2, to: MAIN_EXIT.map, tx: MAIN_EXIT.x, ty: MAIN_EXIT.y, dir: 2, door: true })),
    { x: M.stairsUp.warp.x, y: M.stairsUp.warp.y, to: 'molino_diezmo', tx: M.stairsDown.arrive.x, ty: M.stairsDown.arrive.y, dir: M.stairsDown.arrive.dir },
    { x: M.stairsDown.warp.x, y: M.stairsDown.warp.y, to: 'molino_diezmo', tx: M.stairsUp.arrive.x, ty: M.stairsUp.arrive.y, dir: M.stairsUp.arrive.dir },
    ...M.backDoor.warps.map((w) => ({ x: w.x, y: w.y, dirTrigger: 8, to: 'caudal_canal_alto', tx: CANAL.arrive.x, ty: CANAL.arrive.y, dir: CANAL.arrive.dir, door: true })),
  ],

  events: [
    ...exitArrowEvents(M.door.x, M.door.y + 1),
    ...millEvents(),
    // La casilla (12,4) es la de la placa (MILL.plaque): la ventana se mira desde la de al lado.
    examine('ventana_rio', 13, 4, 'Por la ventana se ve el Albo y, al otro lado del canal, los tejados del Barrio de los Molinos.'),
    { ...SACKS, id: 'caja_harina', x: 14, y: 7, pattern: 2, script: async (ctx) => { await ctx.say('Una caja de harina de la última molienda buena. Tiene la fecha de hace tres años.'); } },
    { ...SACKS, id: 'saco_grano', x: 1, y: 8, pattern: 1, script: async (ctx) => { await ctx.say('Un saco de grano sin moler. Espera su turno desde hace mucho.'); } },
    examine('armario', 18, 8, 'Delantales enharinados y un calendario de hace tres años.', { solid: true }),
  ],
};
