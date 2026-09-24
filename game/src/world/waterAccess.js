// Acceso al agua desde tierra (módulo puro): cuándo se ofrece «¿Quieres nadar?» al pulsar A y dónde aparece el
// jugador si la casilla pedida (warp, ?x=&y=, partida) está bloqueada. Reglas de Essentials (on_player_interact
// :start_surfing: agua navegable delante y casilla actual que deja salir hacia ella) más las de puente:
//  - nunca desde un puente: ni con `world.bridge` > 0, ni sobre un tile con terrain tag Bridge, ni sobre una
//    pasarela de tablones sin tag (franja estrecha entre agua cuyos dos extremos llegan a tierra firme);
//  - nunca hacia agua bajo un tablero (casilla que se pisa a pie o con un tile Bridge encima).
// Un embarcadero (franja con un extremo en el agua) sí deja nadar desde su punta y sus lados.
import { canSurfFreely } from './terrain.js';
import { dx, dy } from './gameMap.js';

/** Ancho máximo (casillas) de una pasarela para contar como puente, y largo máximo que se recorre buscando tierra. */
export const BRIDGE_MAX_WIDTH = 5;
export const BRIDGE_MAX_LENGTH = 48;

const walkable = (map, x, y) => map.valid(x, y) && map.playerPassable(x, y, 0, {});

/** Agua en la que se nada: navegable, no se pisa a pie y sin tile de puente encima. */
export function isSwimWater(map, x, y) {
  if (!map.valid(x, y) || !canSurfFreely(map.terrainTagAt(x, y))) return false;
  return !walkable(map, x, y) && !map.terrainTagAt(x, y, 0, true).bridge;
}

/** Casillas de tierra de la fila (eje ax, ay) que pasa por (x, y) si el agua la corta por los dos lados; si no, 0. */
function widthBetweenWater(map, x, y, ax, ay) {
  let width = 1;
  for (const s of [1, -1]) {
    for (let k = 1; ; k++) {
      const cx = x + ax * s * k;
      const cy = y + ay * s * k;
      if (isSwimWater(map, cx, cy)) break;
      width += 1;
      if (!walkable(map, cx, cy) || width > BRIDGE_MAX_WIDTH) return 0;
    }
  }
  return width;
}

/**
 * ¿(x, y) es una pasarela que cruza agua perpendicular a `dir`? (franja de ≤ BRIDGE_MAX_WIDTH casillas con agua a
 * ambos lados en el eje de `dir`, cuyos dos extremos a lo largo llegan a tierra firme).
 */
export function isOnBridge(map, x, y, dir) {
  const ax = dx(dir);
  const ay = dy(dir);
  if (!widthBetweenWater(map, x, y, ax, ay)) return false;
  for (const s of [1, -1]) {
    let land = false;
    for (let k = 1; k <= BRIDGE_MAX_LENGTH; k++) {
      const cx = x + ay * s * k; // eje perpendicular a dir
      const cy = y + ax * s * k;
      if (!walkable(map, cx, cy)) break; // acaba en agua (embarcadero), muro o borde
      if (!widthBetweenWater(map, cx, cy, ax, ay)) { land = true; break; }
    }
    if (!land) return false;
  }
  return true;
}

/** ¿Se ofrece nadar al pulsar A? world: { map, player: { x, y, direction, surfing }, bridge, env() }. */
export function canOfferSwim(world) {
  const p = world.player;
  const map = world.map;
  if (!map || p.surfing || (world.bridge || 0) > 0) return false;
  const d = p.direction;
  const fx = p.x + dx(d);
  const fy = p.y + dy(d);
  if (!isSwimWater(map, fx, fy)) return false;
  if (map.terrainTagAt(p.x, p.y, 0, true).bridge) return false;
  if (!map.playerPassable(p.x, p.y, d, world.env ? world.env() : {})) return false;
  return !isOnBridge(map, p.x, p.y, d);
}

/**
 * Casilla libre más cercana (find_nearest_passable_spot de Añil) para no aparecer dentro de un muro. El agua solo
 * vale si el jugador puede nadar (`canSwim`, capacidad `swim` de Zygarde): así se reanuda una partida guardada
 * nadando, pero una casilla bloqueada junto al agua nunca deja al jugador nadando sin Nadar.
 */
export function nearestFreeSpot(map, x, y, { canSwim = false } = {}) {
  const ok = (cx, cy) => map.valid(cx, cy)
    && (map.playerPassable(cx, cy, 0, {}) || (canSwim && canSurfFreely(map.terrainTagAt(cx, cy))));
  if (ok(x, y)) return { x, y };
  const max = Math.max(map.width, map.height);
  for (let r = 1; r < max; r++) {
    for (let oy = -r; oy <= r; oy++) {
      for (let ox = -r; ox <= r; ox++) {
        if (Math.abs(ox) !== r && Math.abs(oy) !== r) continue;
        if (ok(x + ox, y + oy)) return { x: x + ox, y: y + oy };
      }
    }
  }
  return { x, y };
}
