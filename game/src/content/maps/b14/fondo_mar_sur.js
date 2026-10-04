// Fondo del Mar del Sur (docs/CAMPANA.md §1.4 «capa submarina de los tres sectores; Fosa Abisal al este · Buceo» y
// §2.3 C077–C081). Tileset 15, 180×50 con las mismas coordenadas que la superficie `mar_del_sur` (B13, 190×50). Se
// entra desde el Arrecife del Eco por el borde oeste o por los remolinos de la superficie; los haces de luz suben a ella
// (si `mar_del_sur` no estuviera registrado, solo alumbran).
// Construcción: fondo_build.js · eventos: content/events/b14_fondo.js.
import { zoneDefaults } from '../../services/zones.js';
import { buildFondo, fondoShallow } from './fondo_build.js';
import { CAVE_BRUSHES } from './paint.js';
import { FONDO, ARRECIFE } from './layout.js';
import { TONES } from '../../events/b14_common.js';
import { FONDO_MAR_SUR } from '../../encounters/b14.js';
import { fondoEvents, surfaceReady } from '../../events/b14_fondo.js';
import { withB22cEvents } from '../../events/b22c_maps.js';

/** Superficie equivalente (B13, world/zygarde/dive.js#surfacePoint): solo bajo los haces de luz (agua abierta). */
const surface = () => (surfaceReady()
  ? { map: 'mar_del_sur', dx: 0, dy: 0, areas: FONDO.surface.map((p) => [p.x - 1, p.y - 1, 3, 3]) }
  : null);

export default {
  id: 'fondo_mar_sur',
  ...zoneDefaults('fondo_mar_sur'),
  tileset: 15,
  width: FONDO.w,
  height: FONDO.h,
  cave: true,
  brushes: CAVE_BRUSHES,
  dark: { amount: 0.8 }, // el mismo mar que el arrecife: las praderas de algas se intuyen fuera de la burbuja
  tone: TONES.presente,
  noFollower: true,
  underwater: { shallow: fondoShallow(), ...(surface() ? { surface: surface() } : {}) },
  encounters: FONDO_MAR_SUR,
  start: { x: 2, y: 23, dir: 6 },
  build: buildFondo,
  connections: [{ dir: 'west', to: 'arrecife_eco', offset: FONDO.west.y0 - ARRECIFE.east.y0 }],
  events: withB22cEvents('fondo_mar_sur', fondoEvents()),
};
