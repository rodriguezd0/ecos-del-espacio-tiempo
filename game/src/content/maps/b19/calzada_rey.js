// Calzada del Rey (docs/CAMPANA.md B19 y §1.4: «brazo este de la Sima»; TABLILLAS.md T15). Tileset 1 (Exterior1 + kit
// exterior de Pilar), 48×62; el taller del Rey es un interior de Cueva1 (calzada_taller). S Ruta 7 (B09a: conexión
// north con offset 58) · la Puerta de la Bajada lleva a la Sima del Eje (sima_eje). Por el vacío asoma el panorama del
// abismo (shader `sima`, B18). Coordenadas: calzada_layout.js · construcción: calzada_build.js · eventos:
// content/events/b19_calzada.js, b19_spans.js, b19_pena.js · encuentros: content/encounters/b19.js.
import { zoneDefaults } from '../../services/zones.js';
import { W, H, EXITS, ARRIVAL, PENA, ENCOUNTER_RECTS, TRAINERS } from './calzada_layout.js';
import { buildCalzada } from './calzada_build.js';
import { ENTRY as TALLER_ENTRY } from './taller_layout.js';
import { ARRIVALS as SIMA_ARRIVALS } from './sima_layout.js';
import { CALZADA_CAVE } from '../../encounters/b19.js';
import { MUSIC } from '../../events/b19_common.js';
import { campAllEvents, trainerEvents } from '../../events/b19_calzada.js';
import { spanEvents, resetIdleSpans } from '../../events/b19_spans.js';
import { penaAllEvents, onSpanRebuilt } from '../../events/b19_pena.js';

export default {
  id: 'calzada_rey',
  ...zoneDefaults('calzada_rey'),
  name: 'Calzada del Rey',
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  bgm: MUSIC.calzada,
  battleback: 'Espacio',
  start: { x: ARRIVAL.x, y: ARRIVAL.y, dir: ARRIVAL.dir },
  panorama: { shader: 'sima', parallax: 0.35 },
  encounterZones: ENCOUNTER_RECTS.map((r) => ({ ...r, encounters: { cave: CALZADA_CAVE } })),

  build: buildCalzada,

  // Bocas en la cara del risco de la Peña: se entra empujando hacia arriba desde la casilla de delante.
  warps: [
    { x: PENA.workshop.door.x, y: PENA.workshop.door.y, to: 'calzada_taller', tx: TALLER_ENTRY.x, ty: TALLER_ENTRY.y, dir: TALLER_ENTRY.dir },
    { x: PENA.bajada.door.x, y: PENA.bajada.door.y, to: 'sima_eje', tx: SIMA_ARRIVALS.bajada.x, ty: SIMA_ARRIVALS.bajada.y, dir: SIMA_ARRIVALS.bajada.dir },
  ],

  connections: [{ dir: 'south', to: 'ruta_7', offset: EXITS.south.offset }],

  /** Los tramos a medias donde no está el jugador vuelven a estar como al principio (tramos reiniciables). */
  onEnter: (ctx) => {
    const p = ctx.player;
    if (p) resetIdleSpans(ctx.state, p.x, p.y);
    ctx.requestRefresh?.();
  },

  events: [
    ...campAllEvents(),
    ...trainerEvents(TRAINERS),
    ...spanEvents({ onRebuilt: onSpanRebuilt }),
    ...penaAllEvents(),
  ],
};
