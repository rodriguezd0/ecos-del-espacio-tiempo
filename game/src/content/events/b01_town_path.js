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
