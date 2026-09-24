// Ciudad Lúmina (docs/CAMPANA.md §1.3 y B09 parte A): capital cultural. Tileset 3 (Exterior2) con el Museo de las
// Eras de piezas propias. E Ruta 7 · NO Ruta 8 (B09b) · S Ruta 14 · N Mirador Sur (B17). Centro, Grandes Almacenes,
// Museo de las Eras, estación central, guardería, Parque de las Eras, tienda de trastos, pastelería, Hotel Mirador y
// tutor. Coordenadas: lumina_layout.js · construcción: lumina_build.js · eventos: content/events/b09a_lumina*.js.
import { buildLumina, LUMINA_BRUSHES, LUMINA_STAMPS } from './lumina_build.js';
import { W, H, EXITS, BUILDINGS, SPOTS, INTERIOR_ENTRY as E } from './lumina_layout.js';
import { linkIfReady, mapRegistered } from './links.js';
import { CENTER_ENTRY } from '../../services/pokecenter.js';
import { LUMINA } from '../../encounters/b09a.js';
import { luminaEvents } from '../../events/b09a_lumina.js';

const OPEN = { north: mapRegistered('mirador_sur'), west: mapRegistered('ruta_8_marisma') };

const door = (k) => BUILDINGS[k].door;
/** Puerta exterior → interior (llegada con el jugador mirando arriba). */
const enter = (k, to, tx, ty) => ({ ...door(k), to, tx, ty, dir: 8, door: true });

export default {
  id: 'ciudad_lumina',
  name: 'Ciudad Lúmina',
  tileset: 3,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'CiudadAzulona',
  battleback: 'Pradera3',
  start: { x: 60, y: 31, dir: 4 },
  flyPoint: SPOTS.flyPoint,
  encounters: LUMINA,
  brushes: LUMINA_BRUSHES,
  stamps: LUMINA_STAMPS,

  build(b) { buildLumina(b, { northOpen: OPEN.north }); },

  connections: [
    { dir: 'east', to: 'ruta_7', offset: EXITS.east.offset },
    { dir: 'south', to: 'ruta_14_reserva', offset: EXITS.south.offset },
    ...[linkIfReady('ciudad_lumina', 'ruta_8_marisma'), linkIfReady('ciudad_lumina', 'mirador_sur')].filter(Boolean),
  ],

  warps: [
    { ...door('centro'), to: 'lumina_centro', ...CENTER_ENTRY, door: true },
    enter('almacenes', 'lumina_almacenes', E.lumina_almacenes.x, E.lumina_almacenes.y),
    // El museo se entra empujando el arco (casilla no transitable: world.js activa el warp al empujar).
    // Dos casillas de arco: la izquierda lleva a la sala de exposiciones y la derecha, al lado del taller (el
    // mostrador del museo separa las dos mitades de la planta baja).
    enter('museo', 'lumina_museo', E.lumina_museo.x, E.lumina_museo.y),
    { ...enter('museo', 'lumina_museo', E.lumina_museo_der.x, E.lumina_museo_der.y), x: door('museo').x + 1 },
    enter('hotel', 'lumina_hotel', E.lumina_hotel.x, E.lumina_hotel.y),
    enter('guarderia', 'lumina_guarderia', E.lumina_guarderia.x, E.lumina_guarderia.y),
    enter('trastos', 'lumina_trastos', E.lumina_trastos.x, E.lumina_trastos.y),
    enter('pasteleria', 'lumina_pasteleria', E.lumina_pasteleria.x, E.lumina_pasteleria.y),
    enter('estacion', 'lumina_estacion', E.lumina_estacion.x, E.lumina_estacion.y),
    { ...enter('estacion', 'lumina_estacion', E.lumina_estacion.x + 1, E.lumina_estacion.y), x: door('estacion').x + 1 },
  ],

  events: luminaEvents(OPEN),
};
