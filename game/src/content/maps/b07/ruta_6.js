import { withB22bEvents } from '../../events/b22b_maps.js';
// Ruta 6 (docs/CAMPANA.md §1.4 y «B07»: cañón escalonado con la Cantería Solano, 30×70, tileset 5 + piezas de
// minería; N Villa Brontia · S Ciudad Estrato; BGM PrismaRuta2; fondo ZonaEscarpada). Los vendavales los corta
// Villa Brontia hasta p3_restored (maps/b05/links.js). El derrumbe del Consorcio corta el camino de Estrato hasta
// el rescate de la cuadrilla (T04). Construcción en ./ruta_6_build.js; eventos en content/events/b07_ruta6.js y
// b07_canteria.js. El enlace con Ciudad Estrato (B08) se abre solo cuando ese mapa esté registrado.
import { buildRuta6 } from './ruta_6_build.js';
import { RUTA6, CANTERIA, HERRERIA } from './layout.js';
import { RUTA_6 } from '../../encounters/b07.js';
import { ruta6Events } from '../../events/b07_ruta6.js';
import { linkIfReady, mapRegistered } from './pending_links.js';

const R = RUTA6;
const ESTRATO = linkIfReady('ciudad_estrato');
const FORGE = CANTERIA.forge.door;

export default {
  id: 'ruta_6',
  name: 'Ruta 6',
  tileset: 5,
  width: R.width,
  height: R.height,
  outdoor: true,
  bgm: 'PrismaRuta2',
  battleback: 'ZonaEscarpada',
  start: { x: R.start.x, y: R.start.y, dir: R.start.dir },
  encounters: RUTA_6,

  build: buildRuta6,

  warps: [
    { x: FORGE.x, y: FORGE.y, to: 'canteria_herreria', tx: HERRERIA.entry.x, ty: HERRERIA.entry.y, dir: 8, door: true },
  ],

  connections: [
    { dir: 'north', to: 'villa_brontia', offset: -7 },
    ...(ESTRATO ? [ESTRATO] : []),
  ],

  events: withB22bEvents('ruta_6', ruta6Events({ estratoOpen: mapRegistered('ciudad_estrato') })),
};
