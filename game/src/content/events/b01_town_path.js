// Rutas a pie para las escenas (BFS sobre la pasabilidad real del personaje). Módulo puro.
// Sirve para que un NPC se acerque al jugador rodeando muebles (ctx.approach solo va en línea recta).

const STEPS = [[2, 0, 1, 'down'], [4, -1, 0, 'left'], [6, 1, 0, 'right'], [8, 0, -1, 'up']];

/**
 * Ruta más corta de `ch` hasta quedar junto a (tx, ty) (o sobre ella si `onto`).
 * `canStep(x, y, dir)` decide si se puede avanzar desde (x, y) en `dir` (por defecto ch.passable).
 * Devuelve la lista de pasos ('up'…) o null si no hay camino en `maxNodes` casillas.
 */
export function findRoute(ch, tx, ty, { onto = false, canStep = null, maxNodes = 2000 } = {}) {
  const step = canStep || ((x, y, d) => ch.passable(x, y, d));
  const goal = (x, y) => (onto ? x === tx && y === ty : Math.abs(x - tx) + Math.abs(y - ty) === 1);
  if (goal(ch.x, ch.y)) return [];
  const start = `${ch.x},${ch.y}`;
  const prev = new Map([[start, null]]);
  const queue = [[ch.x, ch.y]];
  while (queue.length && prev.size < maxNodes) {
    const [x, y] = queue.shift();
    for (const [d, dx, dy, name] of STEPS) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (prev.has(key)) continue;
      const isTarget = nx === tx && ny === ty;
      if (isTarget && !onto) continue; // no pisar al jugador
      if (!step(x, y, d)) continue;
      prev.set(key, [`${x},${y}`, name]);
      if (goal(nx, ny)) return unwind(prev, key);
      queue.push([nx, ny]);
    }
  }
  return null;
}

function unwind(prev, key) {
  const route = [];
  let k = key;
  while (prev.get(k)) {
    const [from, name] = prev.get(k);
    route.unshift(name);
    k = from;
  }
  return route;
}

/** El evento `id` camina hasta el jugador rodeando obstáculos y lo mira (respaldo: ctx.approach). */
export async function walkToPlayer(ctx, id, opts = {}) {
  const ev = ctx.world.events.find((e) => e.id === id);
  if (!ev) return;
  const p = ctx.player;
  const route = findRoute(ev, p.x, p.y);
  if (route && route.length) await ctx.move(id, route, { through: false, ...opts });
  else if (!route) await ctx.approach(id);
  ev.turnToward(p);
  ctx.face('player', ctx.directionTo(p, ev));
}

/** ¿Hay en (x, y) otro evento visible y sólido (personaje, losa, roca…)? Las franjas invisibles no cuentan. */
function blockedByEvent(ctx, self, x, y) {
  return (ctx.world?.events || []).some((e) => e !== self && !e.erased && !e.through && e.at?.(x, y)
    && (e.characterName || e.tileId > 0 || e.solid));
}

/**
 * El evento `id` va ANDANDO hasta (x, y) por casillas que se pisan en el mapa (sin atravesar paredes ni pisar al
 * jugador), para las escenas en que un personaje cambia de sitio: antes se recolocaba de golpe («se teletransporta»).
 * Si no hay camino (o no hay mundo: pruebas en Node), se recoloca como antes cuando `fallback`. Devuelve si anduvo.
 */
export async function walkEventTo(ctx, id, x, y, { speed = 3.5, face = null, fallback = true, maxNodes = 4000 } = {}) {
  const ev = ctx.world?.events?.find((e) => e.id === id);
  if (!ev) return false;
  const map = ev.map || ctx.world?.map;
  const p = ctx.player;
  const canStep = (cx, cy, d) => {
    const nx = cx + (d === 6 ? 1 : d === 4 ? -1 : 0);
    const ny = cy + (d === 2 ? 1 : d === 8 ? -1 : 0);
    if (!map?.valid?.(nx, ny)) return false;
    if (p && p.x === nx && p.y === ny) return false;
    if (blockedByEvent(ctx, ev, nx, ny)) return false;
    return map.passable(cx, cy, d, ev) && map.passable(nx, ny, 10 - d, ev);
  };
  const route = map ? findRoute(ev, x, y, { onto: true, canStep, maxNodes }) : null;
  if (route) {
    if (route.length) await ctx.move(id, route, { through: true, speed });
  } else if (fallback && typeof ev.moveTo === 'function') {
    ev.moveTo(x, y);
  }
  if (face) ctx.face(id, face);
  return Boolean(route);
}
