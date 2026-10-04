// Sima del Eje (docs/CAMPANA.md §1.4: «Abismo central · 1 + 2 + 8 · N Senda del Mirador (Caudal) · S Mirador Sur
// (Lúmina) · E Calzada del Rey · Amenaza · Reconstrucción»; B19: la Calzada del Rey termina en la entrada de la Puerta
// de las Quince). Tileset 1, 40×56. Por el vacío asoma el panorama del abismo (shader `sima`, B18). Coordenadas:
// sima_layout.js · construcción: sima_build.js · eventos: content/events/b19_sima.js · enlaces: links.js.
import { zoneDefaults } from '../../services/zones.js';
import { W, H, ARRIVALS, BAJADA, UMBRAL, ENCOUNTER_RECTS } from './sima_layout.js';
import { buildSima } from './sima_build.js';
import { PENA } from './calzada_layout.js';
import { simaEdgeWarps } from './links.js';
import { SIMA_CAVE } from '../../encounters/b19.js';
import { MUSIC } from '../../events/b19_common.js';
import { simaEvents, puertaWarps } from '../../events/b19_sima.js';
import { paintOriginExterior } from '../b20/vertical_build.js';

export default {
  id: 'sima_eje',
  ...zoneDefaults('sima_eje'),
  name: 'Sima del Eje',
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  bgm: MUSIC.sima,
  battleback: 'Espacio',
  tone: [-10, -12, 6, 16],
  start: { x: ARRIVALS.bajada.x, y: ARRIVALS.bajada.y, dir: ARRIVALS.bajada.dir },
  /** Llegada al volver de la Puerta de las Quince (B20: content/events/b20_puerta.js#toSima). */
  puertaQuinceArrival: { x: UMBRAL.arrive.x, y: UMBRAL.arrive.y, dir: UMBRAL.arrive.dir },
  panorama: { shader: 'sima', parallax: 0.35 },
  encounterZones: ENCOUNTER_RECTS.map((r) => ({ ...r, encounters: { cave: SIMA_CAVE } })),

  build(b) { buildSima(b); paintOriginExterior(b); },

  warps: [
    // Puerta de la Bajada: se sube a la Peña del Rey empujando contra la boca de la roca.
    { x: BAJADA.door.x, y: BAJADA.door.y, to: 'calzada_rey', tx: PENA.bajada.arrive.x, ty: PENA.bajada.arrive.y, dir: PENA.bajada.arrive.dir },
    // Cornisas de la Senda del Mirador (arriba) y del Mirador Sur (abajo): pulsando hacia el borde (B17).
    ...simaEdgeWarps(),
    ...puertaWarps(),
  ],

  events: simaEvents(),
};
