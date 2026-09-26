// Alcance del mundo entero para una etapa de la historia (auditoría de fugas de progresión, tools/audit_progression.mjs).
// Recorre el grafo de mapas desde una o varias casillas de salida con el estado de la etapa (flags, variables y
// capacidades de Zygarde de game/src/dev/devBlocks.js) y la pasabilidad REAL del mundo (tiles + eventos con sus páginas
// activas), como los tests *_reach, pero a través de mapas:
//   · conexiones de borde (def.connections, mismo cálculo de desplazamiento que el juego: mapLoader.connectionOffset);
//   · warps del mapa (pisar la casilla, empujar contra ella o pulsar la dirección en las alfombras `dirTrigger`);
//   · capacidades: Correr (se va montado: cuestas de grava y terreno «mounted»), Embestida (rocas rotas), Terreno,
//     Trepar (paredes `climbWall` → su destino), Nadar (agua libre), Buceo (remolinos `diveSpot` y emerger en el punto
//     equivalente), Reconstrucción (zócalos alzados) y Vuelo (puntos de vuelo de la etapa como salidas extra);
//   · transporte: tren tras el P4 y ferri tras el P7 (world/transport.js) entre las paradas alcanzadas.
// Lo que NO sigue: warps lanzados desde guiones (escenas de mazmorra) ni puzles propios de un bloque; por eso es una
// cota por DEBAJO de lo alcanzable dentro de las mazmorras, pero fiel en el mundo abierto, que es donde se fuga uno.
import fs from 'node:fs';
import { GameState } from '../../game/src/core/state.js';
import { World } from '../../game/src/world/world.js';
import { createEntry, connectionOffset } from '../../game/src/world/mapLoader.js';
import { canSurfFreely } from '../../game/src/world/terrain.js';
import { mountState, mountAllowed } from '../../game/src/world/zygarde/mount.js';
import { diveSpotTarget, surfacePoint } from '../../game/src/world/zygarde/dive.js';
import { TRAIN, FERRY } from '../../game/src/world/transport.js';
import { resolveFlyTarget } from '../../game/src/ui/logic/regionMapData.js';
import { applyBlockStart } from '../../game/src/dev/devProgress.js';
import { buildMapNode, loadMapDef } from './map_node.mjs';

export const DV = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });
const key = (x, y) => `${x},${y}`;
const unkey = (k) => k.split(',').map(Number);

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../../game/data/${f}`, import.meta.url)));
let dbCache = null;
/** Base de datos mínima para aplicar un estado de bloque (especies y objetos, incluidos los de Axis). */
export function auditDB() {
  if (!dbCache) dbCache = { species: load('species.json'), items: { ...load('items.json'), ...load('items_axis.json') } };
  return dbCache;
}

// ─── Mapas construidos (una vez por proceso) ───────────────────────────────────────────────────────────────────

const built = new Map();
/** Mapa construido por id (sin eventos) o { error }. */
export async function builtMap(id) {
  if (!built.has(id)) {
    built.set(id, buildMapNode(id).then((r) => ({ def: r.def, built: r.built, tileset: r.tileset }), (err) => ({ error: err.message })));
  }
  return built.get(id);
}

/** Entrada nueva (capas copiadas: las páginas con `patch` modifican los tiles). */
function freshEntry(b) {
  return createEntry(b.def, { ...b.built, layers: b.built.layers.map((l) => Uint16Array.from(l)) }, b.tileset);
}

// ─── Estado de una etapa ─────────────────────────────────────────────────────────────────────────────────────

/** GameState con el estado de entrada de un bloque (sin equipo). */
export function stageState(preset) {
  const state = GameState.create({ name: 'Auditoría' });
  applyBlockStart(state, auditDB(), preset, { party: false });
  return state;
}

const has = (state, a) => Boolean(state.zygardeAbility(a));

/** Mundo de un mapa para la etapa: eventos con las capacidades aplicadas (rocas rotas, zócalos alzados, montado). */
async function mapWorld(state, id) {
  const b = await builtMap(id);
  if (b.error) return { error: b.error };
  const entry = freshEntry(b);
  const w = new World({ state });
  w.setCurrent(entry);
  if (has(state, 'run') && mountAllowed(b.def)) mountState(w).form = '10';
  for (const ev of w.events) {
    const t = ev.def?.type;
    if (t === 'ramRock' && has(state, 'ram')) state.setSelfSwitch(id, ev.id, 'A', true);
    if (t === 'rebuildGap' && has(state, 'rebuild') && ev.page) {
      if (ev.def.flag) state.setFlag(ev.def.flag, true);
      else state.setSelfSwitch(id, ev.id, 'A', true);
    }
  }
  w.refreshEvents();
  return { id, w, map: entry.map, p: w.player, def: b.def, seen: new Set(), surf: new Set() };
}

// ─── BFS dentro de un mapa ───────────────────────────────────────────────────────────────────────────────────

const solidAt = (ctx, x, y) => ctx.w.events.some((e) => !e.erased && e.page && !e.through && e.at(x, y) && (e.characterName || e.solid || e.tileId > 0));

/**
 * Cierres de contacto: eventos `touch` con `gate: true` en su definición y página activa, cuyo guion devuelve al
 * jugador (niebla del Neblino, cordones, `blockedLink` de los bloques…). Para el recorrido son muros.
 */
function gateSet(ctx) {
  const out = new Set();
  for (const e of ctx.w.events) if (!e.erased && e.page && e.def?.gate && e.trigger === 'touch') out.add(key(e.x, e.y));
  return out;
}

function isWater(ctx, x, y) {
  return canSurfFreely(ctx.map.terrainTagAt(x, y)) && !ctx.map.playerPassable(x, y, 0, {});
}

/** Enlaces internos: warps al propio mapa y paredes de Trepar (con la capacidad). */
function internalLinks(ctx, state) {
  const links = new Map();
  const add = (a, b) => links.set(key(...a), [...(links.get(key(...a)) || []), b]);
  for (const wp of ctx.def.warps || []) {
    if (wp.to !== ctx.id) continue;
    if (wp.dirTrigger) { add([wp.x, wp.y], [wp.tx, wp.ty]); continue; }
    for (const [dx, dy] of Object.values(DV)) add([wp.x - dx, wp.y - dy], [wp.tx, wp.ty]);
  }
  if (has(state, 'climb')) {
    for (const ev of ctx.w.events) {
      if (ev.def?.type !== 'climbWall' || !ev.page || !Array.isArray(ev.def.to)) continue;
      for (const [dx, dy] of Object.values(DV)) add([ev.x + dx, ev.y + dy], ev.def.to);
    }
  }
  return links;
}

/** Resbalar por el hielo del motor hasta chocar (world.js#onPlayerStep). */
function slide(ctx, x, y, d) {
  const { map, p } = ctx;
  let cx = x; let cy = y;
  for (let n = 0; n < 200; n++) {
    if (!map.terrainTagAt(cx, cy, 0)?.ice) break;
    p.x = cx; p.y = cy;
    const nx = cx + DV[d][0];
    const ny = cy + DV[d][1];
    if (!map.valid(nx, ny) || !p.passable(cx, cy, d)) break;
    cx = nx; cy = ny;
  }
  return [cx, cy];
}

/**
 * Amplía el alcance del mapa desde `seeds` ([x, y]). Devuelve las salidas por el borde encontradas:
 * [{ d, x, y }] (casilla de salida y dirección).
 */
function expand(ctx, state, seeds) {
  const { map, p } = ctx;
  const swim = has(state, 'swim');
  if (!ctx.links) ctx.links = internalLinks(ctx, state);
  if (!ctx.gates) ctx.gates = gateSet(ctx);
  const edges = [];
  const queue = [];
  for (const [x, y, d] of seeds) {
    if (!map.valid(x, y) || ctx.seen.has(key(x, y)) || ctx.gates.has(key(x, y))) continue;
    const water = isWater(ctx, x, y);
    if (water && !swim) continue;
    // Entrada por el borde: la casilla debe dejar entrar desde ese lado (World#passableFromEdge).
    if (d && !map.playerPassable(x, y, 10 - d, { surfing: water })) continue;
    if (!water && solidAt(ctx, x, y) && !ctx.def.underwater) continue;
    ctx.seen.add(key(x, y));
    if (water) ctx.surf.add(key(x, y));
    queue.push([x, y]);
  }
  while (queue.length) {
    const [x, y] = queue.shift();
    const surfing = ctx.surf.has(key(x, y));
    const next = [];
    for (const d of [2, 4, 6, 8]) {
      let nx = x + DV[d][0];
      let ny = y + DV[d][1];
      p.x = x; p.y = y; p.surfing = surfing;
      if (!map.valid(nx, ny)) {
        if (map.passable(x, y, d, p, ctx.w.env())) edges.push({ d, x, y, surfing });
        continue;
      }
      let ok = p.passable(x, y, d);
      let toWater = surfing && isWater(ctx, nx, ny);
      if (!ok && swim && !surfing && isWater(ctx, nx, ny)) { p.surfing = true; ok = p.passable(x, y, d); toWater = ok; }
      if (!ok && surfing) { p.surfing = false; ok = map.playerPassable(nx, ny, 10 - d, {}) && p.passable(x, y, d); toWater = false; }
      if (!ok) continue;
      if (!toWater && map.terrainTagAt(nx, ny, 0).ledge) { nx += DV[d][0]; ny += DV[d][1]; }
      if (!toWater) [nx, ny] = slide(ctx, nx, ny, d);
      next.push([nx, ny, toWater]);
    }
    for (const [tx, ty] of ctx.links.get(key(x, y)) || []) next.push([tx, ty, false]);
    for (const [nx, ny, water] of next) {
      if (!map.valid(nx, ny) || ctx.seen.has(key(nx, ny)) || ctx.gates.has(key(nx, ny))) continue;
      ctx.seen.add(key(nx, ny));
      if (water) ctx.surf.add(key(nx, ny));
      queue.push([nx, ny]);
    }
  }
  p.surfing = false;
  return edges;
}

// ─── Salidas de un mapa ──────────────────────────────────────────────────────────────────────────────────────

/** Destinos de los warps a otros mapas que ya se pueden usar. */
function warpExits(ctx) {
  const out = [];
  for (const wp of ctx.def.warps || []) {
    if (wp.to === ctx.id) continue;
    const reach = ctx.seen.has(key(wp.x, wp.y)) || (!wp.dirTrigger && Object.values(DV).some(([dx, dy]) => ctx.seen.has(key(wp.x + dx, wp.y + dy))));
    if (reach) out.push({ map: wp.to, x: wp.tx, y: wp.ty, via: `warp ${wp.x},${wp.y}` });
  }
  return out;
}

/** Remolinos de Buceo (bajar/subir) y emerger desde el fondo en el punto equivalente. */
function diveExits(ctx, state) {
  const out = [];
  const near = (x, y) => ctx.seen.has(key(x, y)) || Object.values(DV).some(([dx, dy]) => ctx.seen.has(key(x + dx, y + dy)));
  for (const ev of ctx.w.events) {
    if (ev.def?.type !== 'diveSpot' || !ev.page || !near(ev.x, ev.y)) continue;
    if (!ev.def.surface && !has(state, 'dive')) continue;
    const t = diveSpotTarget(ctx.def, ev.def, ev.x, ev.y);
    if (t) out.push({ map: t.to, x: t.tx, y: t.ty, via: `buceo ${ev.id}` });
  }
  if (ctx.def.underwater) {
    const done = new Set();
    for (const k of ctx.seen) {
      const t = surfacePoint(ctx.def, ...unkey(k));
      if (!t || done.has(key(t.map, key(t.x, t.y)))) continue;
      done.add(key(t.map, key(t.x, t.y)));
      out.push({ map: t.map, x: t.x, y: t.y, via: 'emerger' });
    }
  }
  return out;
}

/** Casillas de entrada en los mapas conectados por las salidas de borde. */
async function edgeExits(ctx, edges) {
  const out = [];
  for (const conn of ctx.def.connections || []) {
    const other = await builtMap(conn.to);
    if (other.error) continue;
    const off = connectionOffset(conn, ctx.def, other.def);
    for (const e of edges) {
      const nx = e.x + DV[e.d][0] - off.x;
      const ny = e.y + DV[e.d][1] - off.y;
      if (nx < 0 || ny < 0 || nx >= other.def.width || ny >= other.def.height) continue;
      out.push({ map: conn.to, x: nx, y: ny, d: e.d, via: `borde ${conn.dir}` });
    }
  }
  return out;
}

// ─── Recorrido global ────────────────────────────────────────────────────────────────────────────────────────

/** Salidas extra de la etapa: puntos de vuelo (con Vuelo) resueltos a { map, x, y }. */
export async function flyStarts(preset) {
  if (!(preset.zygarde?.abilities || []).includes('fly')) return [];
  const out = [];
  for (const id of preset.flyPoints || []) {
    const t = await resolveFlyTarget(id, loadMapDef);
    if (t?.mapId && Number.isInteger(t.x)) out.push({ map: t.mapId, x: t.x, y: t.y, via: `vuelo ${id}` });
  }
  return out;
}

/** Paradas de tren/ferri alcanzables: si se llega a una parada, todas las demás de la línea. */
function transportExits(state, reached) {
  const out = [];
  for (const line of [TRAIN, FERRY]) {
    if (!state.flag(line.unlockFlag)) continue;
    if (!line.stops.some((s) => reached.has(s.map))) continue;
    for (const s of line.stops) {
      if (s.arrival) out.push({ map: s.map, x: s.arrival.x, y: s.arrival.y, via: line.name });
    }
  }
  return out;
}

/**
 * Alcance de una etapa. preset: estado de entrada de dev/devBlocks.js. Devuelve
 * { state, maps: Map<id, ctx>, errors: Map<id, msg>, from: Map<id, string> } (from = cómo se entró por primera vez).
 */
export async function stageReach(preset) {
  const state = stageState(preset);
  const maps = new Map();
  const errors = new Map();
  const from = new Map();
  const pending = [{ map: preset.map, x: preset.x, y: preset.y, via: 'inicio' }, ...(await flyStarts(preset))];
  const reached = new Set();
  let transportDone = false;
  while (pending.length) {
    const byMap = new Map();
    for (const s of pending.splice(0)) byMap.set(s.map, [...(byMap.get(s.map) || []), s]);
    for (const [id, seeds] of byMap) {
      if (errors.has(id)) continue;
      let ctx = maps.get(id);
      if (!ctx) {
        ctx = await mapWorld(state, id);
        if (ctx.error) { errors.set(id, ctx.error); continue; }
        maps.set(id, ctx);
      }
      const before = ctx.seen.size;
      const edges = expand(ctx, state, seeds.map((s) => [s.x, s.y, s.d]));
      if (ctx.seen.size === before) continue;
      if (!from.has(id)) from.set(id, `${seeds[0].from || '?'} (${seeds[0].via})`);
      reached.add(id);
      const exits = [...(await edgeExits(ctx, edges)), ...warpExits(ctx), ...diveExits(ctx, state)];
      for (const e of exits) pending.push({ ...e, from: id });
    }
    if (!pending.length && !transportDone) {
      transportDone = true;
      for (const e of transportExits(state, reached)) pending.push({ ...e, from: 'transporte' });
    }
  }
  return { state, maps, errors, from };
}
