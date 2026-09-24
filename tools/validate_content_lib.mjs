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

/** Warps: destino registrado, que carga, con la llegada dentro y transitable. */
export async function checkWarps(report, file, def, ctx) {
  for (const w of def.warps || []) {
    const where = `warp (${w.x},${w.y}) → ${w.to}`;
    if (!ctx.maps[w.to]) { report.error(file, `${where}: mapa no registrado`); continue; }
    const target = await ctx.build(w.to);
    if (!target) { report.error(file, `${where}: el mapa de destino no construye`); continue; }
    if (!Number.isInteger(w.tx) || !Number.isInteger(w.ty)) continue;
    const m = target.entry.map;
    if (!m.valid(w.tx, w.ty)) report.error(file, `${where}: llegada (${w.tx},${w.ty}) fuera del mapa`);
    else if (!m.playerPassable(w.tx, w.ty, 0, {})) report.error(file, `${where}: llegada (${w.tx},${w.ty}) no transitable`);
  }
}

/** Casillas del borde compartido que se pueden cruzar (en ambos sentidos del paso). */
export function edgeCrossings(a, b, conn) {
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
    if (a.playerPassable(ax, ay, d, {}) && b.playerPassable(bx, by, 10 - d, {})) out.push([ax, ay]);
  }
  return out;
}

/** Conexiones: destino registrado, conexión de vuelta simétrica y paso transitable por el borde. */
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
    if (!edgeCrossings(entry.map, other.entry.map, c).length) report.error(file, `${where}: ninguna casilla del borde se puede cruzar`);
  }
}

/** Tablas de encuentros: especies de species.json, pesos y niveles válidos. */
export function checkEncounters(report, file, def, db) {
  for (const [kind, table] of Object.entries(def.encounters || {})) {
    if (!Array.isArray(table)) continue;
    table.forEach((row, i) => {
      if (!Array.isArray(row)) { report.error(file, `encuentros.${kind}[${i}]: formato [peso, ESPECIE, min, max]`); return; }
      const [w, sp, min, max] = row;
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
