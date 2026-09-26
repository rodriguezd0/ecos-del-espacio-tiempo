// Cumbre Azur (docs/CAMPANA.md §1.4 «Cumbre Azur, Columna Lanza · Cima sobre las nubes · Vuelo y Senda del Lazo
// (post)»; B22 «Senda del Lazo abierta con el Anclaje espacial»): con el nudo del tramo alto anclado, la Senda del Lazo
// sube por encima del mar de nubes hasta el dintel de los Custodios, bajo la columna de luz, y por él a Columna Lanza.
// Tileset 1 con las piezas nevadas de B15 (la misma ladera), BGM de la Senda (Transicion) y fondo de la cumbre. Sin
// tabla de encuentros (la Ruta 12 no la tiene). Coordenadas en ./layout.js; construcción en ./cumbre_build.js.
import { zoneDefaults } from '../../services/zones.js';
import { CUMBRE as C } from './layout.js';
import { NORTH_PIECES } from '../b15/pieces.js';
import { buildCumbre } from './cumbre_build.js';
import { cumbreEvents, cumbreWarps } from '../../events/b22a_senda.js';

export default {
  id: 'cumbre_azur',
  ...zoneDefaults('cumbre_azur'),
  name: 'Cumbre Azur',
  bgm: 'Transicion',
  battleback: 'CimaNevada',
  tileset: 1,
  width: C.width,
  height: C.height,
  outdoor: true,
  weather: { type: 'snow', power: 1 },
  stormWeather: ['blizzard', 6],
  tone: [-4, 0, 14, 10],
  encounters: {},
  start: { ...C.arrival },
  ...NORTH_PIECES,
  build: buildCumbre,
  warps: cumbreWarps(),
  events: cumbreEvents(),
};
