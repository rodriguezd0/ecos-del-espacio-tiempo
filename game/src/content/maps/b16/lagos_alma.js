import { withB22bEvents } from '../../events/b22b_maps.js';
// Lagos del Alma (docs/CAMPANA.md B16 y §1.4: «Tres lagos glaciares con santuario central», 60×60, tileset 1 con
// piezas de nieve, BGM VinculoSupremo, acceso con Nadar; §1.8: fondo Agua). Al islote del santuario solo se llega
// nadando hasta que Zygarde reconstruye el puente de hielo (hito de la Forma Completa, b16_hito.js). Coordenadas en
// lagos_layout.js; construcción en lagos_build.js; eventos en content/events/b16_lagos.js y b16_hito.js.
import { zoneDefaults } from '../../services/zones.js';
import { W, H, ARRIVAL, SANCTUARY, REFUGIO, SENTIR_ZONE, waterCells } from './lagos_layout.js';
import { buildLagos, LAGOS_BRUSHES } from './lagos_build.js';
import { linkIfReady } from './pending_links.js';
import { ENTRY } from './santuario_layout.js';
import { LAGOS_ALMA, LAGO_SENTIR, FEEBAS_SPOT } from '../../encounters/b16.js';
import { lagosEvents } from '../../events/b16_lagos.js';
import { hitoEvents, lakesBoiling, syncLakesBoiling } from '../../events/b16_hito.js';
import { feebasCandidates, isFeebasTile } from '../../events/b16_feebas.js';
import { REFUGIO_ENTRY } from './lagos_refugio.js';

const WATER = new Set(waterCells().map(([x, y]) => `${x},${y}`));
const FEEBAS_CANDIDATES = Object.freeze(feebasCandidates((x, y) => WATER.has(`${x},${y}`)));

export default {
  id: 'lagos_alma',
  ...zoneDefaults('lagos_alma'),
  name: 'Lagos del Alma',
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'VinculoSupremo',
  battleback: 'Agua',
  start: { x: ARRIVAL.x, y: ARRIVAL.y, dir: ARRIVAL.dir },
  brushes: LAGOS_BRUSHES,
  encounters: LAGOS_ALMA,
  encounterZones: [{ ...SENTIR_ZONE, encounters: LAGO_SENTIR }],
  /** Caña Buena: Feebas en 6 casillas del Lago del Sentir que cambian cada día de juego (world/fishing.js). */
  fishingAt: (state, x, y) => (isFeebasTile(state, FEEBAS_CANDIDATES, x, y) ? FEEBAS_SPOT : null),
  /** Durante la escena del hito los lagos hierven: no se nada (world/waterAccess.js#swimAllowed). */
  get noSwim() { return lakesBoiling(); },

  build: buildLagos,

  warps: [
    ...SANCTUARY.warps.map((w) => ({ x: w.x, y: w.y, to: 'santuario_alma', tx: ENTRY.arrive.x, ty: ENTRY.arrive.y, dir: 8 })),
    { x: REFUGIO.door.x, y: REFUGIO.door.y, to: 'lagos_refugio', tx: REFUGIO_ENTRY.x, ty: REFUGIO_ENTRY.y, dir: 8, door: true },
  ],

  connections: [linkIfReady('villa_boreal')].filter(Boolean),

  /** El agua hierve solo durante el hito a medias (también tras cargar la partida allí). */
  onEnter: (ctx) => { syncLakesBoiling(ctx); },
  events: withB22bEvents('lagos_alma', [...lagosEvents(), ...hitoEvents()]),
};
