// Modo desarrollador: casilla de llegada al teletransportarse a un mapa. Módulo PURO: trabaja con la definición del
// mapa (start, flyPoint, warps, connections) y con el GameMap construido (pasabilidad del jugador, sin eventos).
// Orden: aparición del mapa (`start`) → punto de Vuelo → delante de un warp → borde de una conexión → la casilla
// transitable más cercana al centro. Una casilla vale si se puede pisar (no es vacío ni muro) y no está encerrada.
import { dx, dy, reverseDir } from '../world/gameMap.js';

const DIRS = [2, 8, 4, 6];
const EDGE_DIR = Object.freeze({ north: 8, south: 2, west: 4, east: 6 });

/** ¿Hay en (x, y) un evento sólido (NPC, roca, cartel…)? Solo si el mapa ya tiene sus eventos creados. */
export function blockedByEvent(map, x, y) {
  const events = Array.isArray(map?.events) ? map.events : [];
  return events.some((ev) => !ev.erased && !ev.through && (typeof ev.at === 'function' ? ev.at(x, y) : ev.x === x && ev.y === y));
}

/** ¿Se puede estar en (x, y)? Dentro del mapa, pintada (no vacío), sin muro y sin evento sólido encima. */
export function isStandable(map, x, y) {
  if (!map?.valid?.(x, y)) return false;
  if (map.isVoid?.(x, y)) return false;
  if (blockedByEvent(map, x, y)) return false;
  return map.playerPassable(x, y, 0, {});
}

/** ¿Se puede salir de (x, y) hacia alguna casilla vecina pisable? */
export function canLeave(map, x, y) {
  return DIRS.some((d) => {
    const nx = x + dx(d);
    const ny = y + dy(d);
    return isStandable(map, nx, ny) && map.playerPassable(x, y, d, {}) && map.playerPassable(nx, ny, reverseDir(d), {});
  });
}

/** Casilla válida de llegada: pisable y no encerrada. */
export function isGoodSpot(map, x, y) {
  return isStandable(map, x, y) && canLeave(map, x, y);
}

/** Casilla válida más cercana a (x, y) en anillos crecientes (null si el mapa no tiene ninguna). */
export function nearestGoodSpot(map, x, y) {
  const cx = Math.round(Number(x) || 0);
  const cy = Math.round(Number(y) || 0);
  if (isGoodSpot(map, cx, cy)) return { x: cx, y: cy };
  const max = Math.max(map.width, map.height) * 2;
  for (let r = 1; r <= max; r++) {
    for (let oy = -r; oy <= r; oy++) {
      for (let ox = -r; ox <= r; ox++) {
        if (Math.abs(ox) !== r && Math.abs(oy) !== r) continue;
        if (isGoodSpot(map, cx + ox, cy + oy)) return { x: cx + ox, y: cy + oy };
      }
    }
  }
  return null;
}

const point = (p, source, dir = 2) => (p && Number.isInteger(p.x) && Number.isInteger(p.y) ? { x: p.x, y: p.y, dir: p.dir || dir, source } : null);

/** Casillas junto a un warp: la del propio warp si es una alfombra (dirTrigger) y si no, sus vecinas. */
function warpCandidates(w, warpCells) {
  if (w.dirTrigger) return [{ x: w.x, y: w.y, dir: reverseDir(w.dirTrigger), source: 'puerta' }];
  return DIRS.map((d) => ({ x: w.x + dx(d), y: w.y + dy(d), dir: d, source: 'puerta' }))
    .filter((c) => !warpCells.has(`${c.x},${c.y}`));
}

/** Casillas de un borde con conexión, de la del medio hacia fuera, una casilla hacia dentro primero. */
function connectionCandidates(conn, def) {
  const dir = EDGE_DIR[conn.dir];
  if (!dir) return [];
  const horizontal = dir === 8 || dir === 2;
  const len = horizontal ? def.width : def.height;
  const order = [];
  const mid = Math.floor(len / 2);
  for (let i = 0; i < len; i++) order.push(mid + (i % 2 ? -(i + 1) / 2 : i / 2));
  const out = [];
  for (const depth of [1, 0]) {
    for (const k of order) {
      if (k < 0 || k >= len) continue;
      const edge = { 8: depth, 2: def.height - 1 - depth, 4: depth, 6: def.width - 1 - depth }[dir];
      out.push(horizontal ? { x: k, y: edge, dir: reverseDir(dir), source: 'conexión' } : { x: edge, y: k, dir: reverseDir(dir), source: 'conexión' });
    }
  }
  return out;
}

/** Candidatas de llegada en orden de preferencia (sin comprobar la pasabilidad). */
export function arrivalCandidates(def) {
  const out = [];
  const start = point(def?.start, 'inicio');
  if (start) out.push(start);
  const fly = point(def?.flyPoint, 'vuelo');
  if (fly) out.push(fly);
  const warps = Array.isArray(def?.warps) ? def.warps : [];
  const warpCells = new Set(warps.filter((w) => !w.dirTrigger).map((w) => `${w.x},${w.y}`));
  for (const w of warps) out.push(...warpCandidates(w, warpCells));
  for (const c of Array.isArray(def?.connections) ? def.connections : []) out.push(...connectionCandidates(c, def));
  return out;
}

/**
 * Casilla de llegada al mapa: { x, y, dir, source } con source 'inicio' | 'vuelo' | 'puerta' | 'conexión' | 'centro'.
 * Devuelve null solo si el mapa no tiene ninguna casilla pisable.
 */
export function findArrivalSpot(def, map) {
  for (const c of arrivalCandidates(def)) {
    if (isGoodSpot(map, c.x, c.y)) return c;
  }
  const center = nearestGoodSpot(map, Math.floor(map.width / 2), Math.floor(map.height / 2));
  return center ? { ...center, dir: 2, source: 'centro' } : null;
}

/**
 * Casilla pedida a mano (x, y): si no vale, la válida más cercana. Devuelve { x, y, dir, adjusted } o null.
 */
export function spotNear(map, x, y, dir = 2) {
  const spot = nearestGoodSpot(map, x, y);
  if (!spot) return null;
  return { ...spot, dir, adjusted: spot.x !== Math.round(x) || spot.y !== Math.round(y) };
}

/** Lee «x,y» o «x y» (también «x,y,dir»). Devuelve { x, y, dir? } o null. */
export function parseCoords(text) {
  const nums = String(text ?? '').trim().split(/[\s,;]+/).filter(Boolean).map(Number);
  if (nums.length < 2 || !nums.slice(0, 2).every(Number.isInteger)) return null;
  const [x, y, dir] = nums;
  return [2, 4, 6, 8].includes(dir) ? { x, y, dir } : { x, y };
}
