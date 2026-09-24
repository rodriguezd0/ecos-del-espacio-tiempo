// Datos PUROS del prólogo (sin DOM ni motor): lista de planos, geometría del plano de la región y destinos de
// la dispersión. Se prueban en tests/prologue.test.mjs.
//
// P-04 (docs/CAMPANA.md §2.4): el plano final muestra CINCO ESTELAS GRANDES que anticipan los núcleos N1–N5
// sin texto: al norte del pueblo, a la meseta del este, de vuelta al propio aljibe, al mar del sur y al norte
// helado. El origen es el aljibe del Monte del Portal (noroeste, X22). La rejilla del plano es el atlas de
// ui/logic/regionMapData.js (`terrain` + `places`, X02): se usan sus lugares por id (CORE_PLACES) o las celdas
// de reserva, siempre ajustadas a tierra (o a mar, para el mar del sur) dentro de la rejilla.
import { REGION_MAP } from '../../ui/logic/regionMapData.js';

export const SHOTS = Object.freeze(['p01', 'p02', 'p03', 'montaje', 'p04', 'final']);

/** Tamaño del arte del plano (256×192 a ×2 = 512×384 de pantalla). */
const ART_W = 256;
const ART_H = 192;

/** Caracteres de agua del atlas (`terrain` de regionMapData: mar, lago, arrecife). */
export const WATER_CHARS = Object.freeze(['~', 'l', 'r']);

/**
 * Rejilla tierra/mar normalizada ('#' tierra, '.' mar). Admite el atlas actual (`terrain` con la leyenda de
 * TERRAIN_KEYS, X02) y el formato antiguo (`grid` con '#'/'=' tierra y '.' mar).
 */
export function landGrid(map = REGION_MAP) {
  if (Array.isArray(map.grid)) return map.grid;
  if (Array.isArray(map.terrain)) return map.terrain.map((row) => [...row].map((ch) => (WATER_CHARS.includes(ch) ? '.' : '#')).join(''));
  throw new Error('Mapa de región sin rejilla (grid/terrain)');
}

/** Tipo de terreno del atlas en (cx, cy) ('~' si no hay atlas con tipos). */
export function terrainAt(map, cx, cy) {
  const rows = Array.isArray(map.terrain) ? map.terrain : null;
  if (rows) return rows[cy]?.[cx] ?? '~';
  return landCell(landGrid(map), cx, cy) ? '.' : '~';
}

/** Geometría del arte para una rejilla: celda entera que cabe y márgenes centrados. */
export function regionArt(map = REGION_MAP) {
  const grid = landGrid(map);
  const rows = grid.length;
  const cols = Math.max(...grid.map((r) => r.length));
  const cell = Math.max(1, Math.floor(Math.min(ART_W / cols, ART_H / rows)));
  return Object.freeze({
    w: ART_W, h: ART_H, cell, cols, rows, scale: 2,
    ox: Math.floor((ART_W - cols * cell) / 2), oy: Math.floor((ART_H - rows * cell) / 2),
  });
}

export const REGION_ART = regionArt(REGION_MAP);

/**
 * Lugares del plano. `ids`: ids de punto de regionMapData que valen para ese lugar; `fallback`: celda de
 * reserva (atlas CAMPANA §1.2 sobre la rejilla provisional); `terrain`: 'land' | 'sea'.
 */
export const CORE_PLACES = Object.freeze({
  origin: { ids: ['montana_portal', 'monte_portal', 'aljibe'], fallback: [2, 3], terrain: 'land', label: 'aljibe del Monte del Portal' },
  village: { ids: ['villa_alba'], fallback: [8, 5], terrain: 'land', label: 'pequeño pueblo entre bosques' },
  meseta: { ids: ['meseta_impulso', 'meseta'], fallback: [24, 12], terrain: 'land', label: 'meseta del este' },
  sur: { ids: ['mar_del_sur', 'mar_sur', 'estacion_talasa'], fallback: [11, 18], terrain: 'sea', label: 'mar del sur' },
  norte: { ids: ['villa_boreal', 'lagos_alma', 'norte'], fallback: [18, 4], terrain: 'land', label: 'norte helado' },
});

/**
 * Orden de los núcleos (N1–N5), lugar al que va cada estela grande y su arco de salida (radianes restados a
 * la dirección del destino: más negativo = sube más antes de caer), para que las cinco se distingan aunque
 * dos destinos queden en la misma dirección vista desde el aljibe.
 */
export const CORE_TRAILS = Object.freeze([
  { core: 'N1', to: 'villageNorth', arc: 0.95, note: 'norte del pueblo (Laberinto de la Profundidad)' },
  { core: 'N2', to: 'meseta', arc: 0.3, note: 'meseta del este (Colector del Parque Eólico)' },
  { core: 'N3', to: 'origin', arc: 0, note: 'el propio aljibe (tapona la brecha)' },
  { core: 'N4', to: 'sur', arc: -0.35, note: 'mar del sur (Estación Talasa)' },
  { core: 'N5', to: 'norte', arc: 0.6, note: 'norte helado (Villa Boreal)' },
]);

/** Orden de salida de las estelas grandes (índices de CORE_TRAILS): N1, la del pueblo, sale la última. */
export const CORE_LAUNCH_ORDER = Object.freeze([1, 2, 3, 4, 0]);
/** Distancia (px) por debajo de la cual una estela «vuelve» al propio origen (N3, el aljibe). */
const RETURN_DIST = 12;

/**
 * Velocidad inicial de un núcleo: sale en la dirección de su destino con un arco hacia arriba; el que vuelve
 * al aljibe sube recto y cae de nuevo en él. `from`/`to` en px de pantalla.
 */
export function coreLaunchVector(from, to, speed = 3.4, arc = 0.35) {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  if (dist < RETURN_DIST) return { vx: 0, vy: -speed * 1.25, returns: true };
  const ang = Math.atan2(to.y - from.y, to.x - from.x) - arc;
  return { vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, returns: false };
}

/** ¿Tierra en la celda (cx, cy) de la rejilla? */
export function landCell(grid, cx, cy) {
  const row = grid[cy];
  return row ? row[cx] === '#' || row[cx] === '=' : false;
}

const inGrid = (grid, x, y) => y >= 0 && y < grid.length && x >= 0 && x < (grid[y]?.length || 0);

/** Celda más cercana a (x, y) del terreno pedido (espiral); si no hay ninguna, la propia celda acotada. */
export function snapCell(grid, [x, y], terrain = 'land') {
  const want = (cx, cy) => inGrid(grid, cx, cy) && (terrain === 'sea' ? !landCell(grid, cx, cy) : landCell(grid, cx, cy));
  if (want(x, y)) return [x, y];
  const max = Math.max(grid.length, ...grid.map((r) => r.length));
  for (let r = 1; r < max; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (want(x + dx, y + dy)) return [x + dx, y + dy];
      }
    }
  }
  return [Math.max(0, Math.min(x, (grid[0]?.length || 1) - 1)), Math.max(0, Math.min(y, grid.length - 1))];
}

/** Celda de un lugar: punto de regionMapData con alguno de sus ids (por orden) o la reserva, ajustada al terreno. */
function placeCell(map, place) {
  const pts = map.places || map.points || [];
  const p = place.ids.map((id) => pts.find((pt) => pt.id === id)).find(Boolean);
  const cell = p && Number.isInteger(p.x) && Number.isInteger(p.y) ? [p.x, p.y] : place.fallback;
  return snapCell(landGrid(map), cell, place.terrain);
}

/**
 * Puntos del plano (celdas): origen (aljibe), pueblo y los 5 destinos de las estelas grandes en el orden de
 * CORE_TRAILS (el primero, al norte del pueblo).
 */
export function resolveRegionPoints(map = REGION_MAP) {
  const cells = Object.fromEntries(Object.entries(CORE_PLACES).map(([k, place]) => [k, placeCell(map, place)]));
  const [vx, vy] = cells.village;
  const villageNorth = snapCell(landGrid(map), [vx, vy - 1], 'land');
  const target = { ...cells, villageNorth: villageNorth[1] < vy ? villageNorth : [vx, Math.max(0, vy - 1)] };
  return Object.freeze({
    origin: cells.origin,
    village: cells.village,
    cores: CORE_TRAILS.map((t) => target[t.to]),
  });
}

export const REGION_POINTS = resolveRegionPoints(REGION_MAP);

/** Casillas de tierra de la rejilla (destinos de las células). */
export function landCells(map = REGION_MAP) {
  const out = [];
  landGrid(map).forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') out.push([x, y]); }));
  return out;
}

/** Centro de una celda de la rejilla en px de pantalla. */
export function cellToScreen([cx, cy]) {
  const a = REGION_ART;
  return { x: (a.ox + cx * a.cell + a.cell / 2) * a.scale, y: (a.oy + cy * a.cell + a.cell / 2) * a.scale };
}
