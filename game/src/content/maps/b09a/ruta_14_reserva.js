// Ruta 14 y Reserva del Delta (docs/CAMPANA.md §1.4 y B09 parte A; TABLILLAS T07): delta tropical. Tileset 6
// (ExteriorSafari), 60×60. N Ciudad Lúmina · S Ciudad Nexo (B09b). La Reserva está cerrada por un enjambre hasta que
// Iván (Centro de Lúmina) abre la pista T07; tras T07 reabre entera. Coordenadas: ruta_14_layout.js · construcción:
// ruta_14_build.js · eventos: content/events/b09a_reserva.js y b09a_t07.js · encuentros: encounters/b09a.js (RUTA_14).
import { buildRuta14 } from './ruta_14_build.js';
import { W, H, EXITS } from './ruta_14_layout.js';
import { linkIfReady, mapRegistered } from './links.js';
import { RUTA_14 } from '../../encounters/b09a.js';
import { reservaEvents } from '../../events/b09a_reserva.js';

const OPEN = { south: mapRegistered('ciudad_nexo') };

export default {
  id: 'ruta_14_reserva',
  name: 'Ruta 14',
  tileset: 6,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'ZonaSafari',
  battleback: 'Pradera3',
  start: { x: 29, y: 2, dir: 2 },
  encounters: RUTA_14,

  build(b) { buildRuta14(b); },

  connections: [
    { dir: 'north', to: 'ciudad_lumina', offset: EXITS.north.offset },
    ...[linkIfReady('ruta_14_reserva', 'ciudad_nexo')].filter(Boolean),
  ],

  events: reservaEvents(OPEN),
};
