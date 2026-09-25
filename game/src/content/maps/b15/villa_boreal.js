// Villa Boreal (docs/CAMPANA.md §1.3: «Pueblo de observadores de auroras», 44×40, tileset 1 con nieve, S Ruta 13 ·
// N Lagos del Alma (B16) · E Gruta Escarcha · O Mar Boreal, BGM Emociones; Centro, tienda, Observatorio Boreal, Talleres
// del Hielo, posada, muelle con ferri tras P7). Construcción en ./villa_boreal_build.js; eventos en
// content/events/b15_boreal.js. `flyPoint`: delante de la Torre de Hielo (T13: «luego es destino de Vuelo»).
import { zoneDefaults } from '../../services/zones.js';
import { BOREAL, BOREAL_INTERIORS } from './layout_boreal.js';
import { NORTH_PIECES } from './pieces.js';
import { internal, linkIfReady } from './links.js';
import { buildBoreal } from './villa_boreal_build.js';
import { LAGO } from './layout_lago.js';
import { ESCARCHA } from './layout_escarcha.js';
import { VILLA_BOREAL } from '../../encounters/b15.js';
import { borealEvents, borealOnEnter } from '../../events/b15_boreal.js';

const B = BOREAL;
const LAGOS = linkIfReady('villa_boreal', 'lagos_alma');

const door = (bd, to) => {
  const e = BOREAL_INTERIORS[to];
  return { x: bd.door.x, y: bd.door.y, to, tx: e.x, ty: e.y, dir: 8, door: true };
};

export default {
  id: 'villa_boreal',
  ...zoneDefaults('villa_boreal'),
  tileset: 1,
  width: B.width,
  height: B.height,
  outdoor: true,
  start: { ...B.start },
  flyPoint: { ...B.flyPoint },
  encounters: VILLA_BOREAL,
  weather: { type: 'snow', power: 1 },
  stormWeather: ['blizzard', 6],
  ...NORTH_PIECES,

  build: buildBoreal,

  warps: [
    door(B.buildings.centro, 'boreal_centro'),
    door(B.buildings.tienda, 'boreal_tienda'),
    door(B.buildings.posada, 'boreal_posada'),
    door(B.buildings.casa, 'boreal_casa'),
    door(B.buildings.observatorio, 'boreal_observatorio'),
    door(B.buildings.talleres, 'boreal_talleres'),
    { x: B.cave.door.x, y: B.cave.door.y, to: 'gruta_escarcha', tx: ESCARCHA.entry.x, ty: ESCARCHA.entry.y, dir: ESCARCHA.entry.dir, door: true },
    ...[B.lakeExit.y0, B.lakeExit.y0 + 1, B.lakeExit.y1].map((y) => ({
      x: B.lakeExit.x, y, to: 'boreal_lago', tx: LAGO.entry.x, ty: LAGO.entry.y + (y - B.lakeExit.y0), dir: 6, dirTrigger: 6,
    })),
  ],

  connections: [
    ...internal('south', 'ruta_13', B.south.offset),
    ...internal('west', 'mar_boreal', B.west.offset),
    ...(LAGOS ? [LAGOS] : []),
  ],

  onEnter: borealOnEnter,
  events: borealEvents({ lagosOpen: Boolean(LAGOS) }),
};
