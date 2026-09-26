// Modo desarrollador: progreso de la partida. «Saltar al inicio de un bloque» (estado de entrada de
// dev/devBlocks.js) y editor de flags/variables. Módulo PURO (GameState + base de datos, sin DOM).
import { createDevPokemon } from './devPokemon.js';
import { setCellCount, setCoreCount, setCapabilities, setZygardeFormDev, setFragmentCount, setTabletCount } from './devZygarde.js';
import { searchList } from './devSearch.js';
import { setClock } from './devEnv.js';

/** Flags de ajustes del jugador que sobreviven al salto de bloque (no son progreso). */
export const KEEP_FLAGS = Object.freeze(['exp_share_off']);

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

/**
 * Comprueba un estado de entrada. Devuelve la lista de problemas (vacía si vale). `db` opcional: si se pasa,
 * comprueba también especies y objetos; `mapIds` opcional: ids de mapa registrados.
 */
export function validateBlockStart(preset, { db = null, mapIds = null } = {}) {
  const errs = [];
  const where = preset?.id || '?';
  if (!preset || typeof preset !== 'object') return [`${where}: estado de entrada vacío`];
  if (!preset.map || typeof preset.map !== 'string') errs.push(`${where}: falta el mapa`);
  if (mapIds && preset.map && !mapIds.includes(preset.map)) errs.push(`${where}: mapa desconocido ${preset.map}`);
  if (!Number.isInteger(preset.x) || !Number.isInteger(preset.y)) errs.push(`${where}: casilla inválida`);
  for (const [sp, lv] of preset.party || []) {
    if (db && !db.species?.[sp]) errs.push(`${where}: especie desconocida ${sp}`);
    if (!Number.isInteger(lv) || lv < 1 || lv > 100) errs.push(`${where}: nivel inválido ${sp}:${lv}`);
  }
  const itemIds = [...Object.keys(preset.items || {}), ...(preset.keyItems || [])];
  if (db) for (const id of itemIds) if (!db.items?.[id]) errs.push(`${where}: objeto desconocido ${id}`);
  if (preset.vars !== undefined && !isObject(preset.vars)) errs.push(`${where}: vars debe ser un objeto`);
  return errs;
}

/** Deja los flags exactamente como en la lista (conservando los de ajustes, KEEP_FLAGS). */
export function replaceFlags(state, flags = []) {
  const wanted = new Set(flags.filter(Boolean));
  for (const k of Object.keys(state.data.flags || {})) if (!wanted.has(k) && !KEEP_FLAGS.includes(k)) state.setFlag(k, false);
  for (const k of wanted) state.setFlag(k, true);
}

/** Deja las variables exactamente como en el objeto. */
export function replaceVars(state, vars = {}) {
  for (const k of Object.keys(state.data.vars || {})) if (!(k in (vars || {}))) state.clearVar(k);
  for (const [k, v] of Object.entries(vars || {})) state.setVar(k, v);
}

/**
 * Sustituye el equipo por el del estado de entrada. El equipo anterior va a las cajas (no se pierde nada).
 * Devuelve el número de Pokémon guardados en cajas.
 */
export function replaceParty(state, db, party = []) {
  const created = party.map(([species, level]) => createDevPokemon(db, state, { species, level }));
  if (!created.length) return 0;
  const old = state.party.slice();
  state.setParty(created);
  for (const p of created) state.registerCaught(p.species);
  return old.filter((p) => storeInBox(state, p)).length;
}

/** Guarda un Pokémon en el primer hueco libre de las cajas. Devuelve false si están llenas. */
export function storeInBox(state, pokemon) {
  for (let b = 0; b < state.boxCount; b++) {
    const slot = state.boxes[b].indexOf(null);
    if (slot >= 0) {
      state.setBoxPokemon(b, slot, pokemon);
      return true;
    }
  }
  return false;
}

/**
 * Aplica el estado de entrada de un bloque. Devuelve { mapId, x, y, dir } (a dónde llevar al jugador).
 * Deja flags, variables, capacidades/forma/células/núcleos de Zygarde, fragmentos y tablillas EXACTOS;
 * añade objetos, objetos clave y puntos de Vuelo; sustituye el equipo (el anterior pasa a las cajas).
 */
export function applyBlockStart(state, db, preset, { party = true } = {}) {
  const problems = validateBlockStart(preset, { db });
  if (problems.length) throw new Error(problems.join('; '));
  replaceFlags(state, preset.flags);
  replaceVars(state, preset.vars);
  const z = preset.zygarde || {};
  setCellCount(state, z.cells || 0);
  setCoreCount(state, z.cores || 0);
  setCapabilities(state, z.abilities || [], { exclusive: true });
  setZygardeFormDev(state, z.form ?? null);
  setFragmentCount(state, preset.fragments || 0);
  setTabletCount(state, preset.tablets || 0);
  for (const [id, n] of Object.entries(preset.items || {})) if (state.itemCount(id) < n) state.addItem(id, n - state.itemCount(id));
  for (const id of preset.keyItems || []) state.addKeyItem(id);
  for (const id of preset.flyPoints || []) state.unlockFlyPoint(id);
  if (preset.pokedex && !state.hasPokedex()) state.obtainPokedex();
  if (Number.isFinite(preset.money)) state.addMoney(preset.money - state.player.money);
  if (Number.isFinite(preset.time)) setClock(state, preset.time);
  if (party) replaceParty(state, db, preset.party || []);
  return { mapId: preset.map, x: preset.x, y: preset.y, dir: preset.dir || 2 };
}

// ------------------------------------------------------------------ editor de flags y variables

/** Flags activos, ordenados. */
export function activeFlags(state) {
  return Object.keys(state.data.flags || {}).filter((k) => state.flag(k)).sort();
}

/** Variables como [{ key, value }], ordenadas. */
export function varEntries(state) {
  return Object.keys(state.data.vars || {}).sort().map((key) => ({ key, value: state.data.vars[key] }));
}

/** Busca flags (activos y `known`, p. ej. los de los estados de bloque) por texto. → [{ key, on }] */
export function searchFlags(state, query, known = []) {
  const keys = [...new Set([...activeFlags(state), ...known])].sort();
  return searchList(keys.map((key) => ({ key, on: state.flag(key) })), query, (e) => [e.key]);
}

/** Cambia un flag y devuelve su valor nuevo. */
export function toggleFlag(state, key) {
  const k = cleanKey(key);
  state.setFlag(k, !state.flag(k));
  return state.flag(k);
}

/** Clave de flag/variable válida: sin espacios a los lados, sin comas ni saltos de línea. */
export function cleanKey(key) {
  const k = String(key ?? '').trim();
  if (!k || /[\s,]/.test(k)) throw new Error(`Clave inválida: «${key}» (sin espacios ni comas).`);
  return k;
}

/** Texto → valor de variable: número si lo parece, true/false, o texto tal cual. */
export function parseVarValue(text) {
  const t = String(text ?? '').trim();
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t !== '' && Number.isFinite(Number(t))) return Number(t);
  return t;
}

/** Todos los flags que aparecen en los estados de bloque (sugerencias del buscador). */
export function knownFlags(presets = []) {
  return [...new Set(presets.flatMap((p) => p.flags || []))].sort();
}
