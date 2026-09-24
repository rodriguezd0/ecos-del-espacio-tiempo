// Ciudad Caudal (docs/CAMPANA.md §1.3 y B03): ciudad fluvial de canales y esclusas. Tileset 3 (Exterior2) +
// agua. N Ruta 2 · NO Ruta 3 (B04) · E Ruta 4 (B05, vega) · S Senda del Mirador. Centro, tienda, Casa de las
// Esclusas (Leandro), Barrio de los Molinos (Molino del Diezmo, T02), pescador (Caña Vieja), mercado fluvial,
// tutor y estación (tren tras P4). Coordenadas: caudal_layout.js · construcción: ciudad_caudal_build.js ·
// eventos: content/events/b03_caudal*.js · encuentros: content/encounters/b03.js.
import { buildCaudal, CAUDAL_BRUSHES } from './ciudad_caudal_build.js';
import { W, H, NORTH_ENTRY, BUILDINGS, FLY_POINT } from './caudal_layout.js';
import { linkIfReady, mapRegistered } from './pending_links.js';
import { CAUDAL } from '../../encounters/b03.js';
import { caudalEvents } from '../../events/b03_caudal.js';
// B04 (Pilar de la Corriente): al día siguiente de restaurar el P2, Leandro da las gracias en la plaza y Alerce
// entrega el inicial que nadie eligió (content/events/b04_caudal.js; automático con p2_restored). Hasta entonces,
// Gael evacúa el barrio bajo con sus Pokémon (CAMPANA B04 §3).
import { thanksEvents, CAUDAL_THANKS, evacuationEvents } from '../../events/b04_caudal.js';
import { CENTER_ENTRY } from '../../services/pokecenter.js';
import { SHOP_LAYOUT } from '../../services/shop.js';

const OPEN = {
  ruta_3: mapRegistered('ruta_3'),
  ruta_4: mapRegistered('ruta_4'),
  senda: mapRegistered('senda_mirador'),
  diezmo: mapRegistered('molino_diezmo'),
};

const door = (k) => BUILDINGS[k].door;
/** Puerta exterior → interior (llegada con el jugador mirando arriba). */
const enter = (k, to, tx, ty) => ({ ...door(k), to, tx, ty, dir: 8, door: true });

export default {
  id: 'ciudad_caudal',
  name: 'Ciudad Caudal',
  tileset: 3,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'CiudadCeleste',
  battleback: 'water_rio',
  start: { x: 31, y: 16, dir: 2 },
  flyPoint: FLY_POINT,
  encounters: CAUDAL,
  brushes: CAUDAL_BRUSHES,

  build(b) { buildCaudal(b, { southOpen: OPEN.senda }); },

  connections: [
    { dir: 'north', to: 'ruta_2', offset: NORTH_ENTRY.offset },
    ...[linkIfReady('ciudad_caudal', 'ruta_3'), linkIfReady('ciudad_caudal', 'ruta_4'), linkIfReady('ciudad_caudal', 'senda_mirador')].filter(Boolean),
  ],

  warps: [
    { ...door('centro'), to: 'caudal_centro', ...CENTER_ENTRY, door: true },
    enter('tienda', 'caudal_tienda', SHOP_LAYOUT.door.x, SHOP_LAYOUT.door.y),
    enter('esclusas', 'caudal_esclusas', 7, 10),
    enter('molino', 'caudal_molino', 7, 10),
    enter('bajo1', 'caudal_casa_bajo', 6, 9),
    enter('estacion', 'caudal_estacion', 13, 15),
    // La entrada de la estación tiene dos casillas de hueco oscuro: la segunda también entra (sin ella se pisaba
    // el vano sin pasar dentro).
    { ...enter('estacion', 'caudal_estacion', 14, 15), x: BUILDINGS.estacion.door.x + 1 },
    ...(OPEN.diezmo ? [enter('diezmo', 'molino_diezmo', 7, 10)] : []),
  ],

  events: [...caudalEvents(OPEN), ...thanksEvents(CAUDAL_THANKS, { id: 'b04_gracias_plaza' }), ...evacuationEvents()],
};
