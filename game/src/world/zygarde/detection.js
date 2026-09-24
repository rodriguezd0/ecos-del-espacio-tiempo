// Detección de células (docs/CAMPANA.md §2.2). Módulo PURO:
//  1. Antes del 50 %: el Core/10 % late si hay una célula a ≤ 10 casillas (más rápido y brillante al acercarse).
//     Rótulo «Células: n/m» al entrar en un mapa con células.
//  2. Detección mejorada (60): flecha hacia la célula más cercana del mapa y marcas en el mapa regional de los
//     mapas visitados.
//  3. Crisis del P8 sin todas las células: marcas en el mapa regional también en mapas no visitados.
// API para el mapa regional (agente services): regionCellMarks(state) y regionPointMarks(state, points).
import { CELLS, cellsOnMap } from '../../content/zygarde/cells.js';
import { inCrisisSearch } from './progression.js';

export const HEARTBEAT_RADIUS = 10; // casillas (§2.2)
const BEAT_MIN = 18; // fotogramas entre latidos pegado a la célula
const BEAT_STEP = 8; // fotogramas extra por casilla de distancia

/** Claves de célula de un mapa: las del registro y las de sus eventos `zygardeCell` (mapas de prueba). */
export function mapCellKeys(mapId, mapDef = null) {
  const keys = new Set(cellsOnMap(mapId).map((c) => c.key));
  for (const e of mapDef?.events || []) if (e && e.type === 'zygardeCell' && e.cell) keys.add(e.cell);
  return [...keys];
}

const cellsOf = (state) => state?.data?.zygarde?.cells || state?.zygarde?.cells || [];

/** { found, total } de un mapa (total 0 = sin células). */
export function mapCellCount(state, mapId, mapDef = null) {
  const keys = mapCellKeys(mapId, mapDef);
  const have = new Set(cellsOf(state));
  return { found: keys.filter((k) => have.has(k)).length, total: keys.length };
}

/** Texto del rótulo «Células: n/m» o '' si el mapa no tiene células. */
export function cellLabel(state, mapId, mapDef = null) {
  const { found, total } = mapCellCount(state, mapId, mapDef);
  return total > 0 ? `Células: ${found}/${total}` : '';
}

/** Distancia en casillas (Manhattan: recorrido a pie). */
export const tileDistance = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);

/** Fotogramas entre latidos para una distancia (0 = no late: fuera de radio). */
export function heartbeatInterval(distance, radius = HEARTBEAT_RADIUS) {
  if (!Number.isFinite(distance) || distance < 0 || distance > radius) return 0;
  return BEAT_MIN + Math.round(distance) * BEAT_STEP;
}

/** Intensidad del latido (0..1): 1 pegado a la célula, ~0.1 en el borde del radio. */
export function heartbeatStrength(distance, radius = HEARTBEAT_RADIUS) {
  if (!Number.isFinite(distance) || distance > radius) return 0;
  return Math.max(0.1, 1 - distance / (radius + 1));
}

/** ¿Es un evento de célula aún por recoger (página activa y no borrado)? */
export function isLiveCellEvent(ev) {
  return Boolean(ev && !ev.erased && ev.page && ev.def?.type === 'zygardeCell');
}

/**
 * Célula por recoger más cercana entre `events` a (px, py): { ev, dx, dy, dist } o null.
 * `events` = eventos del mapa actual (World#events).
 */
export function nearestCell(events, px, py) {
  let best = null;
  for (const ev of events || []) {
    if (!isLiveCellEvent(ev)) continue;
    const dist = tileDistance(px, py, ev.x, ev.y);
    if (!best || dist < best.dist) best = { ev, dx: ev.x - px, dy: ev.y - py, dist };
  }
  return best;
}

/** Ángulo (radianes, 0 = este, y hacia abajo) de un vector de casillas. */
export const vectorAngle = (dx, dy) => Math.atan2(dy, dx);

/** Modo de marcas del mapa regional: 'none' | 'visited' (Detección mejorada) | 'crisis' (P8 incompleto). */
export function detectionMode(state) {
  if (inCrisisSearch(state)) return 'crisis';
  if (state?.data?.zygarde?.abilities?.detect) return 'visited';
  return 'none';
}

/**
 * Marcas de células por mapa para el mapa regional: { mode, maps: { mapId: { total, found, remaining, visited,
 * show } } }. `show` indica si el mapa se marca con el modo actual (restantes > 0 y visitado, o crisis).
 */
export function regionCellMarks(state) {
  const mode = detectionMode(state);
  const have = new Set(cellsOf(state));
  const visited = new Set(state?.data?.visited || []);
  const maps = {};
  for (const c of CELLS) {
    const m = maps[c.map] || (maps[c.map] = { total: 0, found: 0, remaining: 0, visited: visited.has(c.map), show: false });
    m.total += 1;
    if (have.has(c.key)) m.found += 1;
  }
  for (const m of Object.values(maps)) {
    m.remaining = m.total - m.found;
    m.show = m.remaining > 0 && (mode === 'crisis' || (mode === 'visited' && m.visited));
  }
  return { mode, maps };
}

/**
 * Marcas agregadas por punto del mapa regional (formato de ui/logic/regionMapData.js: { id, mapIds }):
 * [{ id, remaining, found, total, visited, crisis }] solo de los puntos que deben brillar.
 */
export function regionPointMarks(state, points = []) {
  const { mode, maps } = regionCellMarks(state);
  if (mode === 'none') return [];
  const out = [];
  for (const p of points) {
    let remaining = 0; let found = 0; let total = 0; let visited = false; let show = false;
    for (const id of p.mapIds || []) {
      const m = maps[id];
      if (!m) continue;
      remaining += m.remaining; found += m.found; total += m.total;
      visited = visited || m.visited;
      show = show || m.show;
    }
    if (show) out.push({ id: p.id, remaining, found, total, visited, crisis: mode === 'crisis' });
  }
  return out;
}
