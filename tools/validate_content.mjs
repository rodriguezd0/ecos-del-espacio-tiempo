// Validación de TODO el contenido registrado (mapas de content/maps/index.js y entrenadores de
// content/trainers/index.js), con salida legible agrupada por archivo:
//   - cada mapa construye (MapBuilder + stamps) y crea sus eventos sin errores en when()
//   - warps: destino registrado; el de ORIGEN se puede activar (pisarlo o empujarlo desde una vecina pisable, o
//     estar encima con dirTrigger 2/4/6/8) y la LLEGADA está dentro, pintada, transitable sin puente y no encerrada;
//     avisos: llegada con evento sólido encima, dirTrigger hacia una casilla transitable, warp inalcanzable a pie
//     desde las entradas conocidas del mapa (start, flyPoint, llegadas, conexiones, Trepar, tren/ferri)
//   - conexiones: destino registrado, vuelta simétrica, al menos una casilla del borde que se pueda cruzar y cada
//     llegada al vecino pintada y no encerrada
//   - llegadas de tren/ferri (world/transport.js), `start` y `flyPoint` válidas (mismas reglas que un warp)
//   - eventos: ids únicos, dentro del mapa, objetos (type item) y entrenadores (type trainer) existentes,
//     gráficos de personaje que existen en disco (aviso)
//   - encuentros: especies de species.json, pesos y niveles válidos
//   - entrenadores: equipo formable (también los dinámicos), especies, movimientos, objetos y sprite de combate
//   - guiones (lectura estática de game/src/content): objetos de giveItem/addKeyItem y entrenadores pedidos
//     por id existen
//   - células: ids únicos, coinciden con content/zygarde/cells.js (si existe) y con el catálogo del bloque 1
//   - flags leídos por when() en los mapas del Bloque 1 se ponen en algún guion (o los pone otro bloque)
// Uso: node tools/validate_content.mjs [--quiet] [--json]   (sale con código 1 si hay errores)
// API: import { validateContent } from './validate_content.mjs' → { report, stats }.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { MAPS } from '../game/src/content/maps/index.js';
import { TRAINERS } from '../game/src/content/trainers/index.js';
import { World } from '../game/src/world/world.js';
import { GameState } from '../game/src/core/state.js';
import { buildMapNode } from './lib/map_node.mjs';
import { TRAIN, FERRY } from '../game/src/world/transport.js';
import {
  ROOT, Report, loadDb, mapFile, checkEvents, checkWarps, checkConnections, checkEncounters, checkTrainers,
  jsFiles, scanScripts, flagsReadByWhen, arrivalProblem, openSides, entrySeeds, scanScriptWarps, checkWarpReach,
} from './validate_content_lib.mjs';

const CONTENT = path.join(ROOT, 'game', 'src', 'content');
const B01_DIR = 'game/src/content/maps/b01/';
/** Flags que lee el Bloque 1 pero pone otro sistema o un bloque posterior. */
export const EXTERNAL_FLAGS = Object.freeze({
  p1_restored: 'B02 (Pilar del Umbral restaurado)',
  prologue_seen: 'content/newgameRules.js (partida nueva)',
});

/** Estado de partida en el que todos los flags y self switches están activos (historia «terminada»). */
function allSetState() {
  const base = GameState.create({ name: 'Prueba' });
  return new Proxy(base, {
    get(target, key) {
      if (key === 'flag' || key === 'selfSwitch') return () => true;
      const v = target[key];
      return typeof v === 'function' ? v.bind(target) : v;
    },
  });
}

/** Casillas con un evento que tapa el paso (gráfico o sólido, no atravesable) en un mundo ya creado. */
function solidTiles(world) {
  const out = new Set();
  for (const ev of world.events) if (ev.page && !ev.erased && !ev.through && (ev.characterName || ev.solid)) out.add(`${ev.x},${ev.y}`);
  return out;
}

/**
 * Crea el mundo con los eventos (páginas evaluadas con un GameState real) y recoge errores de when().
 * → Set 'x,y' de las casillas con un evento sólido tanto al empezar la partida como con todos los flags y self switches
 * activos (evento que siempre está: para avisar de llegadas tapadas sin depender del momento de la historia).
 */
function checkMapWorld(report, file, entry) {
  const errors = [];
  let solids = new Set();
  const original = console.error;
  console.error = (...args) => { errors.push(args.map(String).join(' ')); };
  try {
    const world = new World({ state: GameState.create({ name: 'Prueba' }) });
    world.setCurrent({ ...entry, events: null });
    solids = solidTiles(world);
  } catch (err) {
    errors.push(err.message);
  } finally {
    console.error = original;
  }
  for (const e of errors) report.error(file, `eventos: ${e.split('\n')[0]}`);
  if (solids.size) {
    console.error = () => {}; // los errores de when() ya se han informado arriba
    try {
      const late = new World({ state: allSetState() });
      late.setCurrent({ ...entry, events: null });
      const always = solidTiles(late);
      solids = new Set([...solids].filter((k) => always.has(k)));
    } catch {
      solids = new Set();
    } finally {
      console.error = original;
    }
  }
  return solids;
}

/** Llegadas de tren y ferri (world/transport.js) a mapas registrados: casilla válida. */
function checkTransport(report, built) {
  const stops = [...TRAIN.stops, ...FERRY.stops];
  for (const s of stops) {
    if (!s.arrival || !built[s.map]) continue;
    const { def, entry } = built[s.map];
    const problem = arrivalProblem(entry.map, s.arrival.x, s.arrival.y, { warps: def.warps || [], open: openSides(def) });
    if (problem) report.error('game/src/world/transport.js', `parada ${s.id} (${s.map}): ${problem}`);
  }
  return stops;
}

/** Registro global de células (agente zygarde); null si todavía no existe. */
async function loadCellCatalog() {
  try {
    const mod = await import(pathToFileURL(path.join(CONTENT, 'zygarde', 'cells.js')).href);
    const list = mod.CELLS || mod.CELL_CATALOG || mod.default;
    return Array.isArray(list) ? list.map((c) => ({ key: c.key || c.event || c.id, code: c.id, map: c.map || c.mapId, scripted: Boolean(c.scripted) })) : null;
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw err;
  }
}

/** Mapas de desarrollo (content/maps/dev_*.js): sus células de prueba no están en el registro. */
const isDevFile = (file) => /\/maps\/dev_[^/]*\.js$/.test(file || '');

async function checkCells(report, cells, mapFiles) {
  const seen = new Map();
  for (const c of cells) {
    const complain = isDevFile(c.file) ? report.warn.bind(report) : report.error.bind(report);
    if (!/^cell_[a-z0-9_]+_\d+$/.test(c.id || '')) complain(c.file, `célula "${c.id}": clave con formato cell_<mapa>_<n>`);
    if (seen.has(c.id)) report.error(c.file, `célula ${c.id} repetida (también en ${seen.get(c.id)})`);
    seen.set(c.id, c.map);
  }
  const catalog = await loadCellCatalog();
  if (!catalog) {
    report.note('content/zygarde/cells.js no existe todavía: se omite la comparación con el registro de células.');
  } else {
    const byKey = new Map(catalog.map((c) => [c.key, c]));
    for (const c of cells) {
      const entry = byKey.get(c.id);
      const complain = isDevFile(c.file) ? report.warn.bind(report) : report.error.bind(report);
      if (!entry) complain(c.file, `célula ${c.id} no está en content/zygarde/cells.js`);
      else if (entry.map !== c.map) complain(c.file, `célula ${c.id}: el registro la pone en ${entry.map}, el evento en ${c.map}`);
    }
    // Células del registro en mapas que ya existen pero aún sin colocar (las pondrá el bloque de su etapa).
    const pending = new Map();
    for (const entry of catalog) {
      if (entry.scripted || !MAPS[entry.map] || seen.has(entry.key)) continue;
      if (!pending.has(entry.map)) pending.set(entry.map, []);
      pending.get(entry.map).push(entry.code);
    }
    for (const [map, codes] of pending) report.note(`${map}: ${codes.length} célula(s) del registro sin colocar todavía (${codes.join(', ')})`);
  }
  try {
    const { B01_CELLS } = await import(pathToFileURL(path.join(CONTENT, 'events', 'b01_cells.js')).href);
    for (const c of B01_CELLS) {
      const placed = cells.find((p) => p.id === c.id);
      if (!placed) report.error('game/src/content/events/b01_cells.js', `${c.code} ${c.id} no tiene evento en ${c.map}`);
      else if (placed.x !== c.x || placed.y !== c.y || placed.map !== c.map) report.error(placed.file, `${c.id} fuera de su casilla del catálogo del bloque`);
      const entry = catalog?.find((e) => e.key === c.id);
      if (entry && entry.code !== c.code) report.error('game/src/content/events/b01_cells.js', `${c.id}: código ${c.code} ≠ ${entry.code} del registro`);
    }
  } catch (err) {
    report.error('game/src/content/events/b01_cells.js', `no se pudo cargar: ${err.message}`);
  }
}

function checkScripts(report, db) {
  // Objetos y entrenadores: solo los guiones de contenido. Flags: también los sistemas (world/, ui/…).
  const content = scanScripts(jsFiles(CONTENT));
  for (const it of content.items) if (!db.items[it.id]) report.error(it.file, `guion: objeto desconocido ${it.id}`);
  for (const t of content.trainerRefs) if (!TRAINERS[t.id]) report.error(t.file, `guion: entrenador desconocido ${t.id}`);
  return scanScripts(jsFiles(path.join(ROOT, 'game', 'src'))).flagsSet;
}

function checkB01Flags(report, b01Defs, flagsSet, mapFiles) {
  const reads = flagsReadByWhen(b01Defs);
  for (const [flag, maps] of reads) {
    if (flagsSet.has(flag)) continue;
    const file = mapFiles[[...maps][0]];
    if (EXTERNAL_FLAGS[flag]) report.note(`flag ${flag} (leído en ${[...maps].join(', ')}) lo pone ${EXTERNAL_FLAGS[flag]}`);
    else report.error(file, `when() lee el flag "${flag}" y ningún guion lo pone (setFlag)`);
  }
  return reads.size;
}

/** Ejecuta todas las comprobaciones. */
export async function validateContent() {
  const report = new Report();
  const db = loadDb();
  const mapFiles = Object.fromEntries(Object.entries(MAPS).map(([id, loader]) => [id, mapFile(loader)]));
  const cache = new Map();
  const build = (id) => {
    if (!cache.has(id)) cache.set(id, buildMapNode(id).catch((err) => ({ error: err })));
    return cache.get(id).then((r) => (r.error ? null : r));
  };
  const ctx = { db, maps: MAPS, trainers: TRAINERS, build, cells: [], solids: {} };
  const b01Defs = [];
  const built = {};
  // 1.ª pasada: cada mapa por separado (construcción, eventos, encuentros).
  for (const id of Object.keys(MAPS)) {
    const file = mapFiles[id];
    await build(id);
    const res = await cache.get(id);
    if (res.error) { report.error(file, `no construye: ${res.error.message}`); continue; }
    const { def, entry, warnings } = res;
    built[id] = res;
    if (def.id !== id) report.error(file, `id "${def.id}" ≠ registro "${id}"`);
    for (const w of warnings || []) report.warn(file, `construcción: ${w}`);
    ctx.solids[id] = checkMapWorld(report, file, entry);
    checkEvents(report, file, def, entry.map, ctx);
    checkEncounters(report, file, def, db);
    if (file.startsWith(B01_DIR)) b01Defs.push(def);
  }
  // 2.ª pasada: lo que depende de otros mapas (warps, conexiones, llegadas y alcanzabilidad).
  const transport = checkTransport(report, built);
  const scriptWarps = scanScriptWarps(jsFiles(CONTENT));
  for (const [id, { def, entry }] of Object.entries(built)) {
    const file = mapFiles[id];
    for (const key of ['start', 'flyPoint']) {
      const p = def[key];
      if (!p || !Number.isInteger(p.x) || !Number.isInteger(p.y)) continue;
      const problem = arrivalProblem(entry.map, p.x, p.y, { warps: def.warps || [], open: openSides(def) });
      if (problem) report.error(file, `${key}: ${problem}`);
    }
    await checkWarps(report, file, def, entry, ctx);
    await checkConnections(report, file, def, entry, ctx);
    checkWarpReach(report, file, def, entry, entrySeeds(id, built, { transport, scriptWarps }));
  }
  const trainerFiles = {};
  for (const f of jsFiles(path.join(CONTENT, 'trainers')).filter((x) => !x.endsWith('index.js'))) {
    const mod = await import(pathToFileURL(f).href);
    for (const id of Object.keys(mod.default || {})) trainerFiles[id] = path.relative(ROOT, f).replace(/\\/g, '/');
  }
  checkTrainers(report, TRAINERS, trainerFiles, db);
  const flagsSet = checkScripts(report, db);
  await checkCells(report, ctx.cells, mapFiles);
  const b01Flags = checkB01Flags(report, b01Defs, flagsSet, mapFiles);
  const stats = { maps: Object.keys(MAPS).length, trainers: Object.keys(TRAINERS).length, cells: ctx.cells.length, b01Flags };
  return { report, stats, files: [...new Set([...Object.values(mapFiles), ...Object.values(trainerFiles)])] };
}

function print({ report, stats, files }, { quiet = false } = {}) {
  const grouped = report.byFile();
  console.log(`Validación de contenido — ${stats.maps} mapas, ${stats.trainers} entrenadores, ${stats.cells} células, ${stats.b01Flags} flags de when() en el Bloque 1\n`);
  const all = [...new Set([...files, ...grouped.keys()])].sort();
  for (const file of all) {
    const list = grouped.get(file) || [];
    if (!list.length) { if (!quiet) console.log(`✔ ${file}`); continue; }
    const bad = list.some((e) => e.level === 'error');
    console.log(`${bad ? '✖' : '⚠'} ${file}`);
    for (const e of list) console.log(`    ${e.level.padEnd(5)}  ${e.msg}`);
  }
  if (report.info.length) {
    console.log('\nNotas:');
    for (const n of report.info) console.log(`    · ${n}`);
  }
  console.log(`\nResumen: ${report.errors.length} errores, ${report.warnings.length} avisos.`);
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const args = process.argv.slice(2);
  const result = await validateContent();
  if (args.includes('--json')) console.log(JSON.stringify({ stats: result.stats, entries: result.report.entries, notes: result.report.info }, null, 2));
  else print(result, { quiet: args.includes('--quiet') });
  process.exitCode = result.report.errors.length ? 1 : 0;
}
