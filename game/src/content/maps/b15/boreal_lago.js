// Lago Viejo de Villa Boreal (docs/TABLILLAS.md T13 «La torre de hielo»): un lago helado al pie de una pared de nieve,
// al noreste del pueblo, de donde Rosendo saca cada invierno los bloques de la Torre de Hielo. Mapa exterior (tileset 1)
// con barandilla de madera alrededor del hielo, embarcadero, caseta y trineo del tallista. Las placas, rocas, bloques y
// el bloque antiguo son eventos (content/events/b15_lago.js, plano en b15_lago_logic.js).
import { LAGO } from './layout_lago.js';
import { NORTH_PIECES } from './pieces.js';
import { rect, openMask, snowForest, decorate, sealEdges } from './paint.js';
import { lakeEvents, lakeOnEnter } from '../../events/b15_lago.js';
import { lakeSideEvents, extractAncient } from '../../events/b15_t13.js';

const L = LAGO;
const O = L.origin;

function build(b) {
  b.fill(0, 'nieve');
  // Pared de nieve al norte: el lago está encajado al pie del glaciar.
  b.blob(null, rect(-3, -4, L.width + 2, O.y), 'terraza_nevada');
  // Barandilla alrededor del hielo, con el hueco del embarcadero.
  const west = O.x; const east = O.x + 10; const south = O.y + 8;
  b.paint('baranda_v', rect(west, O.y + 1, west, south));
  b.paint('baranda_v', rect(east, O.y + 1, east, south));
  b.paint('baranda', rect(west, south, west + 3, south));
  b.paint('baranda', rect(east - 3, south, east, south));
  b.paint('muelle', rect(west + 4, south, west + 6, south + 1));
  // Orilla: camino desde el pueblo hasta el embarcadero y la caseta del tallista.
  b.paint('nieve_parche', rect(0, L.entry.y, west + 6, L.entry.y + 2));
  b.stamp('cobertizo_azul', L.hut.x, L.hut.y);
  b.stamp('troncos', L.hut.x + 4, L.hut.y + 5);
  b.stamp('cartel_madera', L.sign.x, L.sign.y);
  b.stamp('roca_gris', 3, 16); b.stamp('monton_nieve', 20, 16); b.stamp('monton_nieve', 1, 9);
  // Pinares a los lados del lago y al sur de la orilla.
  const open = openMask([
    rect(west, O.y, east, south + 1), rect(0, L.entry.y - 1, L.width - 1, L.entry.y + 3),
    rect(L.hut.x - 1, L.hut.y - 1, L.hut.x + 5, L.hut.y + 7), rect(0, 0, L.width - 1, O.y),
  ], 0);
  snowForest(b, { width: L.width, height: L.height, seed: 61, open });
  // Matas y pinos al pie del claro: el lago solo se deja por el camino del pueblo (oeste, filas 12–14).
  decorate(b, [['arbusto_nevado', 1, 16], ['pino_nevado_peque', 5, 14], ['arbusto_nevado', 9, 16], ['arbusto_nevado', 14, 16], ['pino_nevado_peque', 22, 12]]);
  sealEdges(b, { width: L.width, height: L.height, sides: ['west', 'east', 'south'], keep: (x, y) => x === 0 && y >= L.exit.y0 && y <= L.exit.y1 });
}

export default {
  id: 'boreal_lago',
  name: 'Lago Viejo',
  bgm: 'Emociones',
  battleback: 'snow',
  tileset: 1,
  width: L.width,
  height: L.height,
  outdoor: true,
  start: { ...L.entry },
  weather: { type: 'snow', power: 1 },
  stormWeather: ['blizzard', 5],
  ...NORTH_PIECES,
  build,
  warps: [L.exit.y0, L.exit.y0 + 1, L.exit.y1].map((y, i) => ({
    x: L.exit.x, y, to: L.exit.back.map, tx: L.exit.back.x, ty: L.exit.back.y + i, dir: L.exit.back.dir, dirTrigger: 4,
  })),
  onEnter: lakeOnEnter,
  events: [...lakeEvents({ onAncient: extractAncient }), ...lakeSideEvents()],
};
