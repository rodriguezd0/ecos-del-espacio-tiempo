// Columna Lanza, en el techo de la Cumbre Azur (docs/CAMPANA.md B21 y §1.4: tileset 8 + panorama, 30×40, BGM
// Final2, fondo ColumnaLanza). Se llega por el Salto de Convergencia desde el Nodo del Origen; no se puede salir
// hasta terminar lo que empieza aquí (sin Vuelo ni Cuerda Huida). Coordenadas en layout.js; construcción en
// columna_build.js; eventos en content/events/b21_columna.js.
import { W, H, COLUMNA } from './layout.js';
import { buildColumna } from './columna_build.js';
import { zoneDefaults } from '../../services/zones.js';
import { columnaEvents, columnaOnEnter, COLUMNA_PANORAMA } from '../../events/b21_columna.js';

export default {
  id: 'columna_lanza',
  ...zoneDefaults('columna_lanza'),
  tileset: 8,
  width: W,
  height: H,
  outdoor: true, // capa de crisis (falsa calma) hasta el final; sin ciclo de día y noche
  dayNight: false,
  tone: [6, 4, 14, 18],
  panorama: COLUMNA_PANORAMA.crisis,
  escapeRope: false, // «No podrás volver hasta terminar lo que empiece allí» (CAMPANA B21 §1)
  fly: false,
  encounters: {},
  start: { x: COLUMNA.arrival.x, y: COLUMNA.arrival.y, dir: COLUMNA.arrival.dir },
  build: buildColumna,
  onEnter: columnaOnEnter,
  events: columnaEvents(),
};
