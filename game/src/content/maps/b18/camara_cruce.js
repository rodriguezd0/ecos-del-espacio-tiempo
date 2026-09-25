// Cámara del Cruce (docs/CAMPANA.md B18 «Mazmorra: Cámara del Cruce (3 salas)» y «Elección (verso IX)»; §1.5: tileset 8
// + kit de Pilar con el tinte plata). Vestíbulo → Sala de la Caída → Sala del Río → Sala del Cruce → núcleo, salas que
// flotan sobre el abismo de la Sima (panorama `sima`, `voidBlocks`). La Cadena Roja se tensa en los cristales hacia
// Dialga (tiempo) o Palkia (espacio): world/axis/ (genérico; docs/ARCHITECTURE.md §22). El tono del mapa sigue al eje
// tensado (getter `tone`). Coordenadas en cruce_layout.js; salas ASCII en content/events/b18_cruce_rooms.js; eventos
// en content/events/b18_cruce.js (salas) y b18_nucleo.js (elección, combate y restauración).
import { zoneDefaults } from '../../services/zones.js';
import { pilarTone } from '../../stamps/pilar.js';
import { axisTone, cachedAxis } from '../../../world/axis/logic.js';
import { W, H, ENTRY } from './cruce_layout.js';
import { buildCruce } from './cruce_build.js';
import { cruceEvents, cruceWarps, cruceEnter } from '../../events/b18_cruce.js';
import { nucleoEvents } from '../../events/b18_nucleo.js';
import { CAMARA_CRUCE } from '../../encounters/b18.js';

const BASE_TONE = pilarTone('P9');

export default {
  id: 'camara_cruce',
  ...zoneDefaults('camara_cruce'),
  name: 'Cámara del Cruce',
  tileset: 8,
  width: W,
  height: H,
  outdoor: false,
  bgm: 'Transicion',
  battleback: 'Espacio',
  cave: true,
  seed: 1818,
  voidBlocks: true,
  panorama: { shader: 'sima', parallax: 0.3 },
  /** Tinte plata del P9 + el color del eje tensado (world/axis/logic.js#axisTone; la caché la mantiene world/axis). */
  get tone() { return axisTone(BASE_TONE, cachedAxis()); },
  escapeRope: true,
  start: { x: ENTRY.x, y: ENTRY.y, dir: 8 },
  encounters: CAMARA_CRUCE,
  build: buildCruce,
  warps: cruceWarps(),
  events: [...cruceEvents(), ...nucleoEvents()],
  onEnter: cruceEnter,
};
