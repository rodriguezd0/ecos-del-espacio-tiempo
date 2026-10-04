// Mirador Sur (docs/CAMPANA.md B17 «Mirador Sur (ocupado)»; §1.4: borde sur de la Sima, S Ciudad Lúmina · N Sima del
// Eje; fondo Espacio). Tileset 5 (Exterior3). Por el vacío asoma el panorama de la Sima. Del P8 al P9, el recinto de
// Genesis («estudio geotécnico del Consorcio») con el Resonador Sintético sobre el vacío y la Torre del Temblor en el
// espolón del este. Coordenadas: mirador_layout.js · construcción: mirador_build.js · eventos: b17_mirador.js.
import { zoneDefaults } from '../../services/zones.js';
import { W, H, SOUTH, ARRIVAL, DECK } from './mirador_layout.js';
import { buildMirador } from './mirador_build.js';
import { SIMA_PANORAMA } from '../../events/b17_common.js';
import { miradorEvents } from '../../events/b17_mirador.js';
import { descentWarps } from '../b19/links.js'; // B19: warp al final de la bajada hacia la Sima del Eje
import { miradorGrietaEvents } from '../../events/b22e_grieta.js';

export default {
  id: 'mirador_sur',
  ...zoneDefaults('mirador_sur'),
  name: 'Mirador Sur',
  tileset: 5,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'Amenaza',
  battleback: 'Espacio',
  start: { x: ARRIVAL.x, y: ARRIVAL.y, dir: ARRIVAL.dir },
  panorama: SIMA_PANORAMA,

  build: buildMirador,

  // B19 (aditivo): el final de la bajada (x 3–4, y 0, pulsando arriba) lleva a la Sima del Eje (content/maps/b19/links.js).
  warps: [
    ...descentWarps('mirador_sur'),
    ...Array.from({ length: DECK.north.x1 - DECK.north.x0 + 1 }, (_, i) => ({ x: DECK.north.x0 + i, y: 0, dirTrigger: 8, to: 'puente_convergencia', tx: DECK.north.x0 + i, ty: 58, dir: 8 })),
  ],

  connections: [
    { dir: 'south', to: 'ciudad_lumina', offset: SOUTH.offset },
  ],

  events: [...miradorEvents(), ...miradorGrietaEvents()],
};
