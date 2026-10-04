// Construcción de la Grieta del Porvenir (tileset 5, Exterior3). Mesetas y repisas colgadas en la pared sur de la Sima
// (el vacío deja ver el panorama de la Sima), unidas por pasos: hierba rala con caminos de tierra en el rellano, la
// explanada y la cuenca; ceniza gris donde el eco del porvenir quemó la hierba (hondonada, borde de escarcha, espolón,
// peñasco de la tormenta y las cicatrices del Resonador); un cauce seco de arena entre dos macizos de roca; losas viejas
// en las bajadas; el Taller de hierro con suelo de chapa. Los objetos del porvenir (bloques, escarcha, púas, cristales,
// restos del Resonador) son eventos (content/events/b22e_grieta*.js). Módulo puro.
import {
  W, H, LAND, PATHS, RING, ROCKS, SCARS, IRON_ROOM, CAUCE, PROPS, ESPOLON, EXPLANADA, isLand, groundAt, inRound,
} from './grieta_layout.js';
import { paintVoidEdges, VOID_WALL } from '../b17/rim.js';

const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};

const isVoid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !isLand(x, y);
/** Fuera del mapa, solo el sendero de la salida sigue siendo tierra (baja al borde sur). */
const landOrOut = (x, y) => (x < 0 || x >= W || y < 0 ? false : y >= H ? x >= 23 && x <= 25 : isLand(x, y));
const isRock = (x, y) => ROCKS.some((r) => inRound(r, x, y));

function cellsOfKind(kind) {
  const out = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isLand(x, y) && groundAt(x, y) === kind) out.push([x, y]);
  return out;
}

const onGrass = ([x, y]) => isLand(x, y) && groundAt(x, y) === 'cesped' && !isRock(x, y);

function paintGround(b) {
  // ceniza gris (mosaico, capa 0) donde el eco quemó la hierba
  b.paint('ceniza', [...cellsOfKind('ceniza'), ...SCARS.flatMap((r) => rect(r.x0, r.y0, r.x1, r.y1)).filter(onGrass)]);
  // losas viejas en la bajada y en el paso al espolón
  b.paint('suelo_ciudad', cellsOfKind('losas'));
  // suelo de chapa del taller (calzada con bordillo)
  b.paint('calzada', cellsOfKind('chapa'));
  // caminos de tierra con borde de hierba
  const seen = new Set();
  const path = [];
  for (const r of PATHS) {
    for (const c of rect(r.x0, r.y0, r.x1, r.y1)) {
      const k = `${c[0]},${c[1]}`;
      if (!seen.has(k) && onGrass(c)) { seen.add(k); path.push(c); }
    }
  }
  b.paint('camino_tierra', path);
  // anillo hollado de la cuenca (el vuelo de Ferrocuello ha pelado la hierba)
  const ring = rect(RING.x0, RING.y0, RING.x1, RING.y1).filter(([x, y]) => (x === RING.x0 || x === RING.x1 || y === RING.y0 || y === RING.y1));
  b.paint('camino_tierra', ring);
  // lecho de arena del cauce seco
  b.paint('camino_arena', rect(CAUCE.bed.x0, CAUCE.y0 - 1, CAUCE.bed.x1, CAUCE.y1 + 1));
}

function paintIronRoom(b) {
  // estrado de Ferropalmas: planchas de metal
  const xs = IRON_ROOM.dais.map(([x]) => x);
  const y = IRON_ROOM.dais[0][1];
  for (let x = Math.min(...xs); x <= Math.max(...xs); x += 4) b.stamp('chapa_metal', Math.min(x, Math.max(...xs) - 3), y);
}

function paintRocks(b) {
  for (const r of ROCKS) b.paint('acantilado', rect(r.x0, r.y0, r.x1, r.y1));
}

function paintProps(b) {
  b.stamp('losa_plaza', ESPOLON.dais.x, ESPOLON.dais.y);
  b.stamp('tablon_anuncios_2', EXPLANADA.board.x, EXPLANADA.board.y);
  for (const [s, x, y] of PROPS) if (b.hasStamp(s)) b.stamp(s, x, y);
}

function paintSima(b) {
  const cells = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isVoid(x, y)) cells.push([x, y]);
  for (const [x, y] of cells) { b.set(0, x, y, 0); b.set(1, x, y, 0); b.set(2, x, y, VOID_WALL); }
  paintVoidEdges(b, isVoid, landOrOut, { W, H });
}

export function buildGrieta(b) {
  b.fill(null, 'cesped');
  paintGround(b);
  paintIronRoom(b);
  paintRocks(b);
  paintProps(b);
  paintSima(b);
}

export { W, H, LAND };
