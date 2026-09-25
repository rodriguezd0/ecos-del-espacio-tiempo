// Utilidades de alcanzabilidad del Bloque 15 (tests/b15_reach.test.mjs). No es un test: node --test solo recoge
// *.test.mjs. BFS con la pasabilidad real del mundo (tiles + eventos sólidos + saltos de saliente) con:
//   · nado opcional (entrar al agua desde la orilla y salir a tierra),
//   · hielo del motor (terrain tag ice): se resbala en la misma dirección hasta chocar (world.js#onPlayerStep),
//   · aristas extra por los warps del propio mapa (empujar contra el hueco o pulsar una dirección sobre la casilla),
//   · desvíos dirigidos (`redirect`): p. ej. coronar una escalera falsa de la Senda del Lazo devuelve al principio.
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { canSurfFreely } from '../game/src/world/terrain.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';

export const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
export const key = (x, y) => `${x},${y}`;

/** Mundo de un mapa con estado: flags, vars y habilidades de Zygarde (run, ram, terrain, climb, swim, dive…). */
export async function world(mapId, { flags = [], vars = {}, abilities = [] } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  for (const [k, v] of Object.entries(vars)) state.setVar(k, v);
  for (const a of abilities) state.setZygardeAbility(a, true);
  const { entry, def } = await buildMapNode(mapId);
  const w = new World({ state });
  w.setCurrent({ ...entry, events: null });
  return { w, map: entry.map, p: w.player, state, def };
}

/** Quita eventos (p. ej. una roca ya rota) por id o prefijo. */
export function erase(ctx, ...ids) {
  for (const ev of ctx.w.events) if (ids.some((id) => ev.id === id || String(ev.id).startsWith(`${id}_`))) ev.erased = true;
  return ctx;
}

const eventAt = (w, x, y) => w.events.some((e) => !e.erased && e.page && e.trigger && e.x === x && e.y === y);

function warpLinks(ctx) {
  const links = [];
  for (const wp of ctx.def.warps || []) {
    if (wp.to !== ctx.def.id) continue;
    const dest = [wp.tx, wp.ty];
    if (wp.dirTrigger) { links.push([[wp.x, wp.y], dest]); continue; }
    if (eventAt(ctx.w, wp.x, wp.y)) continue;
    for (const [dx, dy] of Object.values(DV)) links.push([[wp.x - dx, wp.y - dy], dest]);
  }
  return links;
}

/** Resbalar por el hielo del motor desde (x, y) en `d` hasta que la siguiente casilla bloquea. */
function slide(ctx, x, y, d) {
  const { map, p } = ctx;
  let cx = x; let cy = y;
  for (let n = 0; n < 200; n++) {
    if (!map.terrainTagAt(cx, cy, 0)?.ice) break;
    p.x = cx; p.y = cy;
    if (!p.passable(cx, cy, d)) break;
    cx += DV[d][0]; cy += DV[d][1];
  }
  return [cx, cy];
}

/**
 * Casillas alcanzables desde `start`. opts: block (casillas-muro), links extra, swim, warps (internos),
 * redirect(x, y, d, nx, ny) → [tx, ty] | null (desvío al entrar en una casilla en la dirección d).
 */
export function bfs(ctx, start, { block = [], links = [], swim = false, warps = true, redirect = null } = {}) {
  const { map, p } = ctx;
  const blocked = new Set(block.map(([x, y]) => key(x, y)));
  const extra = new Map();
  for (const [a, b] of [...links, ...(warps ? warpLinks(ctx) : [])]) extra.set(key(...a), [...(extra.get(key(...a)) || []), b]);
  const water = (x, y) => canSurfFreely(map.terrainTagAt(x, y)) && !map.playerPassable(x, y, 0, {});
  const seen = new Set([key(...start)]);
  const edges = [];
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.shift();
    const next = [];
    for (const d of [2, 4, 6, 8]) {
      let nx = x + DV[d][0];
      let ny = y + DV[d][1];
      if (!map.valid(nx, ny) || blocked.has(key(nx, ny))) continue;
      p.x = x; p.y = y;
      p.surfing = water(x, y);
      let ok = p.passable(x, y, d);
      if (!ok && swim && !p.surfing && water(nx, ny)) { p.surfing = true; ok = p.passable(x, y, d); }
      if (!ok && p.surfing) { p.surfing = false; ok = map.playerPassable(nx, ny, 10 - d, {}) && p.passable(x, y, d); }
      if (!ok) continue;
      if (!p.surfing && map.terrainTagAt(nx, ny, 0).ledge) { nx += DV[d][0]; ny += DV[d][1]; }
      const r = redirect?.(x, y, d, nx, ny);
      if (r) { next.push(r); continue; }
      if (!p.surfing) [nx, ny] = slide(ctx, nx, ny, d);
      next.push([nx, ny]);
    }
    for (const t of extra.get(key(x, y)) || []) next.push(t);
    for (const [nx, ny] of next) {
      if (!map.valid(nx, ny) || blocked.has(key(nx, ny))) continue;
      edges.push([key(x, y), key(nx, ny)]);
      if (seen.has(key(nx, ny))) continue;
      seen.add(key(nx, ny));
      queue.push([nx, ny]);
    }
  }
  p.surfing = false;
  return { has: (x, y) => seen.has(key(x, y)), size: seen.size, seen, edges };
}

/** Casillas alcanzadas desde las que NO se puede volver a `home` (trampas sin salida). */
export function dead(r, home) {
  const back = new Map();
  for (const [a, b] of r.edges) back.set(b, [...(back.get(b) || []), a]);
  const ok = new Set([key(...home)]);
  const queue = [key(...home)];
  while (queue.length) {
    const k = queue.shift();
    for (const a of back.get(k) || []) if (!ok.has(a)) { ok.add(a); queue.push(a); }
  }
  return [...r.seen].filter((k) => !ok.has(k));
}

/** ¿Se puede interactuar con (x, y)? (pisándolo o desde una vecina alcanzable) */
export const canUse = (r, x, y) => r.has(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.has(x + dx, y + dy));

/** Como canUse, pero se habla también por encima de un mostrador (world.js#eventsInFront). */
export function canTalk(r, map, x, y) {
  if (canUse(r, x, y)) return true;
  return Object.values(DV).some(([dx, dy]) => map.counter(x + dx, y + dy) && r.has(x + 2 * dx, y + 2 * dy));
}

/** Objetos, células y entrenadores con página activa. */
export const pickables = (w) => w.events.filter((e) => e.page && !e.erased && (e.def?.item || e.def?.cell || e.def?.trainer));

/** Eventos con página activa que se hablan/examinan (A). */
export const talkables = (w) => w.events.filter((e) => e.page && !e.erased && e.trigger === 'action');

/** Franja de casillas de una fila (para bloquear escenas de paso obligado). */
export const row = (y, x0, x1) => Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, y]);
