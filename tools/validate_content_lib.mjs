// Comprobaciones de contenido para tools/validate_content.mjs (puras salvo lecturas de disco de solo lectura).
// Cada función recibe el informe (`Report`) y añade errores/avisos con el archivo de origen.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameState } from '../game/src/core/state.js';
import { expandEventDef } from '../game/src/world/eventTypes.js';
import { normalizeEventDef } from '../game/src/world/mapEvent.js';
import { getCharacter } from '../game/src/content/characters.js';
import { resolveTrainerSprite } from '../game/src/battle/scene/trainerSprites.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAME = path.join(ROOT, 'game');
const ANIL = path.join(ROOT, 'Pokemon Anil V4.13');
const DIRS = { north: [0, -1, 8], south: [0, 1, 2], west: [-1, 0, 4], east: [1, 0, 6] };
const OPPOSITE = { north: 'south', south: 'north', west: 'east', east: 'west' };

// ───────────────────────────── Informe ─────────────────────────────

export class Report {
  constructor() { this.entries = []; this.info = []; }
  error(file, msg) { this.entries.push({ level: 'error', file, msg }); }
  warn(file, msg) { this.entries.push({ level: 'aviso', file, msg }); }
  note(msg) { this.info.push(msg); }
  get errors() { return this.entries.filter((e) => e.level === 'error'); }
  get warnings() { return this.entries.filter((e) => e.level === 'aviso'); }
  /** Agrupado por archivo (orden estable). */
  byFile() {
    const out = new Map();
    for (const e of this.entries) {
      if (!out.has(e.file)) out.set(e.file, []);
      out.get(e.file).push(e);
    }
    return out;
  }
}

// ───────────────────────────── Utilidades ─────────────────────────────

export function loadDb() {
  const load = (f) => JSON.parse(fs.readFileSync(path.join(GAME, 'data', f), 'utf8'));
  const { _note, ...axis } = load('items_axis.json');
  return { species: load('species.json'), moves: load('moves.json'), items: { ...load('items.json'), ...axis } };
}

/** Ruta (relativa a la raíz) del módulo de un mapa a partir de su función de carga del registro. */
export function mapFile(loader) {
  const m = /import\(["']\.\/(.+?)["']\)/.exec(String(loader));
  return m ? `game/src/content/maps/${m[1]}` : 'game/src/content/maps/index.js';
}

/** Evento normalizado (tipos expandidos) o null si la definición es inválida. */
export function normalizedEvent(raw, def, i) {
  try {
    return normalizeEventDef(expandEventDef(raw, def), i);
  } catch {
    return null;
  }
}

/** Archivo en disco de una clave de gráfico de personaje (o null si no aplica). */
export function spriteFile(key) {
  if (!key || typeof key !== 'string' || key.startsWith('follower:')) return null;
  if (key.startsWith('asset:')) return path.join(GAME, 'assets', key.slice(6));
  const entry = getCharacter(key);
  return entry?.file ? urlToFile(entry.file) : path.join(ANIL, 'Graphics', 'Characters', `${key}.png`);
}

/** URL servida ('assets/…', '/anil/…') → archivo en disco. */
export function urlToFile(url) {
  if (url.startsWith('/anil/')) return path.join(ANIL, ...url.slice(6).split('/').map(decodeURIComponent));
  return path.join(GAME, ...url.replace(/^\//, '').split('/'));
}

// ───────────────────────────── Mapas ─────────────────────────────

/** Coordenadas, ids, objetos, entrenadores y gráficos de los eventos de un mapa. */
export function checkEvents(report, file, def, map, ctx) {
  const ids = new Set();
  (def.events || []).forEach((raw, i) => {
    const where = `evento ${raw?.id ?? i}`;
    const ev = normalizedEvent(raw, def, i);
    if (!ev) { report.error(file, `${where}: definición inválida`); return; }
    if (ids.has(ev.id)) report.error(file, `${where}: id repetido`);
    ids.add(ev.id);
    if (!map.valid(ev.x, ev.y)) report.error(file, `${where}: (${ev.x},${ev.y}) fuera del mapa`);
    if (raw.type === 'item' && !ctx.db.items[raw.item]) report.error(file, `${where}: objeto desconocido ${raw.item}`);
    if (raw.type === 'trainer' && raw.trainer && !ctx.trainers[raw.trainer]) report.error(file, `${where}: entrenador desconocido ${raw.trainer}`);
    if (raw.type === 'zygardeCell') ctx.cells.push({ id: raw.cell, map: def.id, file, x: ev.x, y: ev.y });
    for (const page of ev.pages) {
      const f = page.tileId ? null : spriteFile(page.sprite);
      if (f && !fs.existsSync(f)) report.warn(file, `${where}: gráfico "${page.sprite}" no encontrado (${path.relative(ROOT, f)})`);
    }
  });
}

// ───────────────────────────── Pasos del jugador: warps, llegadas y alcanzabilidad ─────────────────────────────

/** Desplazamiento, lado del mapa y nombre de cada dirección de paso. */
const STEP = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const SIDE = { 2: 'south', 4: 'west', 6: 'east', 8: 'north' };
const DIR_LABEL = { 2: 'abajo', 4: 'izquierda', 6: 'derecha', 8: 'arriba' };
/**
 * Entornos con los que se SOBREAPROXIMA el paso del jugador: a pie, a la altura de un puente, nadando y nadando con
 * puente. Así la alcanzabilidad no depende del progreso de la partida (Nadar llegará) y solo avisa de lo imposible.
 */
const ENVS = [{}, { bridge: 1 }, { surfing: true }, { surfing: true, bridge: 1 }];

/** ¿Tiene la casilla algún tile? Una casilla sin pintar es «transitable» para RMXP, pero es el vacío del mapa. */
export function painted(map, x, y) {
  return map.valid(x, y) && [0, 1, 2].some((l) => map.data(x, y, l) > 0);
}

/** ¿Puede estar el jugador en (x, y)? Pintada y no bloqueada del todo (a pie, sobre un puente o nadando). */
export function standable(map, x, y) {
  return painted(map, x, y) && ENVS.some((env) => map.playerPassable(x, y, 0, env));
}

/**
 * Casilla a la que lleva un paso desde (x, y) hacia `d` con la pasabilidad del jugador (world/player.js): los dos lados
 * del borde abiertos en algún entorno, destino pintado y, si es una saliente, el salto de dos casillas. → [x, y] | null
 */
export function stepTarget(map, x, y, d) {
  const [ox, oy] = STEP[d];
  let nx = x + ox;
  let ny = y + oy;
  if (!painted(map, nx, ny)) return null;
  if (!ENVS.some((env) => map.playerPassable(x, y, d, env) && map.playerPassable(nx, ny, 10 - d, env))) return null;
  if (map.terrainTagAt(nx, ny, 0).ledge) {
    nx += ox;
    ny += oy;
    if (!standable(map, nx, ny)) return null;
  }
  return [nx, ny];
}

/**
 * Casillas alcanzables a pie (o nadando) desde `seeds` ([[x, y]…]) → Set de 'x,y'. Ignora los eventos. Con `warps`,
 * como en el motor: pisar un warp normal saca del mapa (no se sigue andando desde él, salvo si es una entrada) y desde
 * un warp `dirTrigger` no se puede dar el paso en su dirección (se sale antes de moverse).
 */
export function reachableFrom(map, seeds, { warps = [] } = {}) {
  const sinks = new Set(warps.filter((w) => !w.dirTrigger).map((w) => `${w.x},${w.y}`));
  const cut = new Set(warps.filter((w) => w.dirTrigger).map((w) => `${w.x},${w.y},${w.dirTrigger}`));
  const seen = new Set();
  const entries = new Set();
  const queue = [];
  for (const [x, y] of seeds) {
    const k = `${x},${y}`;
    entries.add(k);
    if (map.valid(x, y) && !seen.has(k)) { seen.add(k); queue.push([x, y]); }
  }
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    if (sinks.has(`${x},${y}`) && !entries.has(`${x},${y}`)) continue;
    for (const d of [2, 4, 6, 8]) {
      if (cut.has(`${x},${y},${d}`)) continue;
      const t = stepTarget(map, x, y, d);
      if (!t) continue;
      const k = `${t[0]},${t[1]}`;
      if (!seen.has(k)) { seen.add(k); queue.push(t); }
    }
  }
  return seen;
}

/** Lados del mapa con conexión ({ north: true, … }). */
export function openSides(def) {
  return Object.fromEntries((def.connections || []).filter((c) => DIRS[c.dir]).map((c) => [c.dir, true]));
}

/**
 * Cómo se activa un warp de ORIGEN (world/world.js). Sin `dirTrigger`: al acabar un paso sobre su casilla
 * (onPlayerStep) o al empujar contra ella desde una vecina (checkPlayerTouch: puertas sobre muros), así que basta
 * una casilla vecina pisable. Con `dirTrigger`: estando encima y pulsando esa dirección (dirWarp).
 * → { errors, spots } (spots: casillas donde el jugador debe poder estar para activarlo)
 */
export function warpActivation(map, w, { open = {} } = {}) {
  const errors = [];
  const spots = [];
  if (!map.valid(w.x, w.y)) return { errors: [`casilla (${w.x},${w.y}) fuera del mapa`], spots };
  if (w.dirTrigger) {
    const d = w.dirTrigger;
    if (!STEP[d]) errors.push(`dirTrigger ${d} inválido (2, 4, 6 u 8)`);
    if (!standable(map, w.x, w.y)) errors.push('casilla no pisable: el disparo por dirección exige estar encima');
    else spots.push([w.x, w.y]);
    return { errors, spots };
  }
  let viaEdge = false;
  for (const d of [2, 4, 6, 8]) {
    const [ox, oy] = STEP[d];
    const sx = w.x - ox; // el jugador está en (sx, sy) y pisa o empuja hacia d
    const sy = w.y - oy;
    if (!map.valid(sx, sy)) { if (open[SIDE[10 - d]]) viaEdge = true; continue; }
    if (standable(map, sx, sy)) spots.push([sx, sy]);
  }
  if (!spots.length && !viaEdge) errors.push('entrada imposible: ninguna casilla vecina pisable desde la que pisarlo o empujar contra él');
  return { errors, spots };
}

/** ¿Hay alguna salida desde (x, y)? Un paso, un warp vecino (o por dirección en la casilla) o un borde con conexión. */
function hasExit(map, x, y, { warps = [], open = {} } = {}) {
  for (const d of [2, 4, 6, 8]) {
    const [ox, oy] = STEP[d];
    if (!map.valid(x + ox, y + oy)) { if (open[SIDE[d]]) return true; continue; }
    if (stepTarget(map, x, y, d)) return true;
  }
  return warps.some((w) => (w.dirTrigger ? w.x === x && w.y === y : Math.abs(w.x - x) + Math.abs(w.y - y) === 1));
}

/**
 * Problema de una casilla de LLEGADA (warp, transporte, aparición) o null: dentro del mapa, pintada, transitable a pie
 * con la altura de puente a 0 (la de toda entrada a un mapa; si no, se aparece nadando o en otra casilla) y no
 * encerrada entre muros. `opts`: { warps, open } del mapa de llegada.
 */
export function arrivalProblem(map, x, y, opts = {}) {
  if (!map.valid(x, y)) return `llegada (${x},${y}) fuera del mapa`;
  if (!painted(map, x, y)) return `llegada (${x},${y}) en una casilla vacía (sin tiles)`;
  if (!map.playerPassable(x, y, 0, {})) return `llegada (${x},${y}) no transitable`;
  if (!hasExit(map, x, y, opts)) return `llegada (${x},${y}) encerrada entre muros (sin paso ni warp desde ella)`;
  return null;
}

/**
 * Warps: destino registrado y que construye; el warp de ORIGEN se puede activar (warpActivation) y la LLEGADA es
 * válida (arrivalProblem; con un evento sólido que siempre está encima, aviso). ctx.solids[id]: Set 'x,y'.
 */
export async function checkWarps(report, file, def, entry, ctx) {
  const open = openSides(def);
  for (const w of def.warps || []) {
    const where = `warp (${w.x},${w.y}) → ${w.to}`;
    if (entry) for (const msg of warpActivation(entry.map, w, { open }).errors) report.error(file, `${where}: ${msg}`);
    if (!ctx.maps[w.to]) { report.error(file, `${where}: mapa no registrado`); continue; }
    const target = await ctx.build(w.to);
    if (!target) { report.error(file, `${where}: el mapa de destino no construye`); continue; }
    if (!Number.isInteger(w.tx) || !Number.isInteger(w.ty)) continue;
    const problem = arrivalProblem(target.entry.map, w.tx, w.ty, { warps: target.def.warps || [], open: openSides(target.def) });
    if (problem) report.error(file, `${where}: ${problem}`);
    else if (ctx.solids?.[w.to]?.has(`${w.tx},${w.ty}`)) report.warn(file, `${where}: llegada (${w.tx},${w.ty}) con un evento sólido encima`);
  }
}

/**
 * Pasos por el borde compartido tal como los deja el motor (World#passableFromEdge: los dos lados abiertos, sin
 * eventos) → [{ ax, ay, bx, by }] (a = este mapa, b = el vecino).
 */
export function edgeSteps(a, b, conn) {
  const [ox, oy, d] = DIRS[conn.dir];
  const off = conn.offset || 0;
  const out = [];
  const along = ox === 0 ? a.width : a.height;
  for (let i = 0; i < along; i++) {
    const ax = ox === 0 ? i : (ox < 0 ? 0 : a.width - 1);
    const ay = oy === 0 ? i : (oy < 0 ? 0 : a.height - 1);
    const bx = ox === 0 ? ax - off : (ox < 0 ? b.width - 1 : 0);
    const by = oy === 0 ? ay - off : (oy < 0 ? b.height - 1 : 0);
    if (!b.valid(bx, by)) continue;
    if (a.playerPassable(ax, ay, d, {}) && b.playerPassable(bx, by, 10 - d, {})) out.push({ ax, ay, bx, by });
  }
  return out;
}

/** Casillas del borde compartido que se pueden cruzar (en ambos sentidos del paso) y con tiles a los dos lados. */
export function edgeCrossings(a, b, conn) {
  return edgeSteps(a, b, conn).filter((s) => painted(a, s.ax, s.ay) && painted(b, s.bx, s.by)).map((s) => [s.ax, s.ay]);
}

/**
 * Conexiones: destino registrado, conexión de vuelta simétrica, algún paso transitable por el borde y la casilla de
 * LLEGADA de cada paso (en el vecino) pintada y no encerrada (ni un paso más allá del borde).
 */
export async function checkConnections(report, file, def, entry, ctx) {
  for (const c of def.connections || []) {
    const where = `conexión ${c.dir} → ${c.to}`;
    if (!DIRS[c.dir]) { report.error(file, `${where}: dirección desconocida`); continue; }
    if (!ctx.maps[c.to]) { report.error(file, `${where}: mapa no registrado`); continue; }
    const other = await ctx.build(c.to);
    if (!other) { report.error(file, `${where}: el mapa vecino no construye`); continue; }
    const back = (other.def.connections || []).find((x) => x.to === def.id);
    if (!back) report.warn(file, `${where}: ${c.to} no conecta de vuelta`);
    else if (back.dir !== OPPOSITE[c.dir] || (back.offset || 0) !== -(c.offset || 0)) {
      report.error(file, `${where}: la vuelta (${back.dir}, offset ${back.offset || 0}) no es simétrica (esperado ${OPPOSITE[c.dir]}, ${-(c.offset || 0)})`);
    }
    const b = other.entry.map;
    const steps = edgeSteps(entry.map, b, c).filter((s) => painted(entry.map, s.ax, s.ay));
    for (const s of steps) {
      if (!painted(b, s.bx, s.by)) report.error(file, `${where}: desde (${s.ax},${s.ay}) se cruza a (${s.bx},${s.by}), una casilla vacía (sin tiles) del vecino`);
      else if (!hasExit(b, s.bx, s.by, { warps: other.def.warps || [] })) {
        report.error(file, `${where}: desde (${s.ax},${s.ay}) se llega a (${s.bx},${s.by}), encerrada entre muros (solo se puede volver)`);
      }
    }
    if (!edgeCrossings(entry.map, b, c).length) report.error(file, `${where}: ninguna casilla del borde se puede cruzar`);
  }
}

/**
 * Casillas por las que se entra en el mapa `id` (semillas de la alcanzabilidad): `start`, `flyPoint`, llegadas de los
 * warps de todos los mapas y de eventos con `to`/`tx`/`ty`, llegadas de tren/ferri, `ctx.warp('id', x, y…)` literales
 * de los guiones, los pasos de sus conexiones y las casillas pisables junto a cada evento (Trepar, puertas por guion
 * con coordenadas en constantes, personajes con los que hay que hablar: si un evento está, se llega a él).
 * `all`: { id: { def, entry } }.
 */
export function entrySeeds(id, all, { transport = [], scriptWarps = [] } = {}) {
  const me = all[id];
  const map = me.entry.map;
  const seeds = [];
  const push = (p) => { if (p && Number.isInteger(p.x) && Number.isInteger(p.y)) seeds.push([p.x, p.y]); };
  push(me.def.start);
  push(me.def.flyPoint);
  for (const other of Object.values(all)) {
    for (const w of other.def.warps || []) if (w.to === id) push({ x: w.tx, y: w.ty });
    for (const ev of other.def.events || []) if (ev && ev.to === id) push({ x: ev.tx, y: ev.ty });
  }
  for (const ev of me.def.events || []) {
    if (!ev || !Number.isInteger(ev.x) || !Number.isInteger(ev.y)) continue;
    if (Array.isArray(ev.to)) push({ x: ev.to[0], y: ev.to[1] });
    for (const [ox, oy] of Object.values(STEP)) if (standable(map, ev.x + ox, ev.y + oy)) push({ x: ev.x + ox, y: ev.y + oy });
  }
  for (const t of transport) if (t.map === id) push(t.arrival);
  for (const s of scriptWarps) if (s.map === id) push(s);
  for (const c of me.def.connections || []) {
    const other = all[c.to];
    if (DIRS[c.dir] && other) for (const [x, y] of edgeCrossings(me.entry.map, other.entry.map, c)) seeds.push([x, y]);
  }
  return seeds;
}

/** `ctx.warp('mapa', x, y` con números literales en los guiones → [{ map, x, y, file }]. */
export function scanScriptWarps(files) {
  const out = [];
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    for (const m of text.matchAll(/\bwarp\(\s*['"]([a-z0-9_]+)['"]\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
      out.push({ map: m[1], x: Number(m[2]), y: Number(m[3]), file: path.relative(ROOT, f).replace(/\\/g, '/') });
    }
  }
  return out;
}

/**
 * Alcanzabilidad (AVISOS; sobreaproxima —ignora eventos y altura de puente y cuenta Nadar— para no dar falsos
 * positivos): cada warp de origen tiene alguna casilla desde la que activarse alcanzable desde las entradas del mapa
 * (entrySeeds), y un warp `dirTrigger` no corta un paso que el jugador podría dar por otro camino (la casilla a la que
 * apunta es alcanzable sin cruzarlo: al pasar por encima en esa dirección se sale del mapa).
 */
export function checkWarpReach(report, file, def, entry, seeds) {
  if (!seeds.length || !(def.warps || []).length) return;
  const map = entry.map;
  const reach = reachableFrom(map, seeds, { warps: def.warps });
  const open = openSides(def);
  for (const w of def.warps) {
    const where = `warp (${w.x},${w.y}) → ${w.to}`;
    const { errors, spots } = warpActivation(map, w, { open });
    if (errors.length || !spots.length) continue;
    if (!spots.some(([x, y]) => reach.has(`${x},${y}`))) {
      report.warn(file, `${where}: no se alcanza a pie desde las entradas del mapa (${seeds.length} conocidas)`);
    } else if (STEP[w.dirTrigger]) {
      const [ox, oy] = STEP[w.dirTrigger];
      const tx = w.x + ox;
      const ty = w.y + oy;
      const walkable = stepTarget(map, w.x, w.y, w.dirTrigger);
      if (walkable && reach.has(`${tx},${ty}`)) {
        report.warn(file, `${where}: la casilla de ${DIR_LABEL[w.dirTrigger]} (${tx},${ty}) es transitable y se llega a ella por otro lado: cruzar el warp hacia ${DIR_LABEL[w.dirTrigger]} saca del mapa`);
      }
    }
  }
}

/** Tablas de encuentros: especies de species.json, pesos y niveles válidos. */
export function checkEncounters(report, file, def, db) {
  for (const [kind, table] of Object.entries(def.encounters || {})) {
    if (!Array.isArray(table)) continue;
    table.forEach((row, i) => {
      // Aditivo B10: también { species, weight, min, max, form } (world/encounters.js#normalizeEntry), p. ej. Unown por forma.
      const obj = row && !Array.isArray(row) && typeof row === 'object' && row.species ? row : null;
      if (!Array.isArray(row) && !obj) { report.error(file, `encuentros.${kind}[${i}]: formato [peso, ESPECIE, min, max]`); return; }
      const [w, sp, min, max] = obj ? [obj.weight ?? 1, obj.species, obj.min ?? obj.level, obj.max ?? obj.min ?? obj.level] : row;
      if (obj?.form && !db.species[sp]?.forms?.[String(obj.form)]) report.error(file, `encuentros.${kind}[${i}]: forma ${obj.form} inexistente en ${sp}`);
      if (!db.species[sp]) report.error(file, `encuentros.${kind}[${i}]: especie fuera de species.json (${sp})`);
      if (!(w > 0)) report.error(file, `encuentros.${kind}[${i}]: peso inválido (${w})`);
      if (!(min >= 1 && max <= 100 && min <= max)) report.error(file, `encuentros.${kind}[${i}]: niveles inválidos (${min}–${max})`);
    });
  }
}

// ───────────────────────────── Entrenadores ─────────────────────────────

/** Estados con los que se evalúan los equipos dinámicos (p. ej. el inicial de Gael según el del jugador). */
function partyStates() {
  const out = [GameState.create({ name: 'Prueba' })];
  for (const sp of ['TURTWIG', 'LITTEN', 'SOBBLE']) {
    const s = GameState.create({ name: 'Prueba' });
    s.setVar('starter', sp);
    out.push(s);
  }
  return out;
}

export function checkTrainers(report, trainers, trainerFiles, db) {
  const states = partyStates();
  for (const [id, def] of Object.entries(trainers)) {
    const file = trainerFiles[id] || 'game/src/content/trainers/index.js';
    const parties = [];
    try {
      for (const s of states) parties.push(typeof def.party === 'function' ? def.party(s) : def.party);
    } catch (err) {
      report.error(file, `${id}: el equipo no se puede formar (${err.message})`);
      continue;
    }
    for (const party of parties) {
      if (!Array.isArray(party) || !party.length) { report.error(file, `${id}: equipo vacío`); break; }
      for (const p of party) {
        if (!db.species[p.species]) report.error(file, `${id}: especie desconocida ${p.species}`);
        if (!(p.level >= 1 && p.level <= 100)) report.error(file, `${id}: nivel inválido ${p.level}`);
        for (const mv of p.moves || []) if (!db.moves[mv]) report.error(file, `${id}: movimiento desconocido ${mv}`);
        const held = p.item || p.heldItem;
        if (held && !db.items[held]) report.error(file, `${id}: objeto equipado desconocido ${held}`);
      }
    }
    for (const it of def.items || []) if (!db.items[it]) report.error(file, `${id}: objeto de combate desconocido ${it}`);
    const spr = resolveTrainerSprite(def.sprite);
    if (!def.sprite) report.warn(file, `${id}: sin sprite de combate`);
    else if (spr && !fs.existsSync(urlToFile(spr.file))) report.warn(file, `${id}: sprite de combate "${def.sprite}" no encontrado`);
  }
}

// ───────────────────────────── Guiones (lectura estática) ─────────────────────────────

/** Archivos .js bajo `dir` (recursivo). */
export function jsFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...jsFiles(full));
    else if (e.name.endsWith('.js')) out.push(full);
  }
  return out;
}

/** Constantes de texto (`const X = 'v'`) de todos los archivos, para resolver argumentos. */
function stringConstants(sources) {
  const map = new Map();
  for (const { text } of sources) {
    for (const m of text.matchAll(/(?:const|let)\s+([A-Z_a-z]\w*)\s*=\s*'([^'\n]+)'/g)) if (!map.has(m[1])) map.set(m[1], m[2]);
    for (const m of text.matchAll(/^\s+([a-zA-Z]\w*):\s*'([a-z0-9_]+)',/gm)) map.set(`F.${m[1]}`, m[2]); // F = { clave: 'flag' }
  }
  return map;
}

/** Resuelve un argumento: 'literal', "literal", CONSTANTE o F.clave. */
function resolveArg(expr, consts) {
  const s = expr.trim();
  const lit = /^['"]([^'"]+)['"]$/.exec(s);
  if (lit) return lit[1];
  return consts.get(s) ?? null;
}

/**
 * Lectura estática de los guiones: flags que se ponen (setFlag), objetos que se dan (giveItem/addKeyItem) y
 * entrenadores que se piden por id (trainer: 'id', getTrainer('id')).
 */
export function scanScripts(files) {
  const sources = files.map((f) => ({ file: path.relative(ROOT, f).replace(/\\/g, '/'), text: fs.readFileSync(f, 'utf8') }));
  const consts = stringConstants(sources);
  const flagsSet = new Map();
  const items = [];
  const trainerRefs = [];
  for (const { file, text } of sources) {
    for (const m of text.matchAll(/setFlag\(\s*([^,)]+)/g)) {
      const k = resolveArg(m[1], consts);
      if (k && !flagsSet.has(k)) flagsSet.set(k, file);
    }
    for (const m of text.matchAll(/(?:giveItem|addKeyItem)\(\s*['"]([A-Z0-9_]+)['"]/g)) items.push({ id: m[1], file });
    for (const m of text.matchAll(/(?:trainer:\s*|getTrainer\(\s*)'([a-z0-9_]+)'/g)) trainerRefs.push({ id: m[1], file });
  }
  return { flagsSet, items, trainerRefs };
}

// ───────────────────────────── Flags de when() ─────────────────────────────

/** Generador pseudoaleatorio determinista. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Flags que leen las condiciones when() de los eventos: se evalúa cada página con un estado que registra las
 * lecturas de flag() en varias asignaciones (todo falso, todo cierto y combinaciones al azar).
 */
export function flagsReadByWhen(defs) {
  const reads = new Map(); // flag → Set(mapId)
  const pages = [];
  for (const def of defs) {
    (def.events || []).forEach((raw, i) => {
      const ev = normalizedEvent(raw, def, i);
      for (const p of ev?.pages || []) if (typeof p.when === 'function') pages.push({ def, ev, when: p.when });
    });
  }
  const known = new Set();
  const random = rng(7);
  const modes = ['false', 'true', ...Array.from({ length: 40 }, (_, i) => `rnd${i}`)];
  for (const mode of modes) {
    const assign = new Map([...known].map((k) => [k, mode === 'true' || (mode.startsWith('rnd') && random() < 0.5)]));
    for (const { def, ev, when } of pages) {
      const base = GameState.create({ name: 'Prueba' });
      const state = new Proxy(base, {
        get(target, key) {
          if (key === 'flag') {
            return (k) => {
              known.add(k);
              if (!reads.has(k)) reads.set(k, new Set());
              reads.get(k).add(def.id);
              return assign.get(k) ?? (mode === 'true');
            };
          }
          const v = target[key];
          return typeof v === 'function' ? v.bind(target) : v;
        },
      });
      try {
        when(state, { id: ev.id, x: ev.x, y: ev.y, selfSwitch: () => false });
      } catch { /* los errores de when() los informa checkMapWorld */ }
    }
  }
  return reads;
}
