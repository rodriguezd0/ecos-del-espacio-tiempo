// Modo desarrollador: progreso de Zygarde (células, núcleos, capacidades, forma), Fragmentos Azur, Tablillas,
// destinos de Vuelo y Pokédex. Módulo PURO sobre GameState (usa sus APIs y la progresión de world/zygarde).
import { CELLS } from '../content/zygarde/cells.js';
import { CORE_IDS, CAPABILITY_KEYS, CAPABILITY_FLAGS, FORM_ORDER, FORM_FLAGS, coreFlag, TOTAL_CELLS } from '../content/zygarde/thresholds.js';
import { applyUnlock, joinCore, naturalForm } from '../world/zygarde/progression.js';
import { CAMPAIGN_TABLETS } from '../content/story/tablets.js';
import { syncFragmentItem } from '../content/story/api.js';
import { REGION_MAP } from '../ui/logic/regionMapData.js';

export const MAX_FRAGMENTS = 10;
export const fragmentId = (n) => `F${String(n).padStart(2, '0')}`;
const clamp = (n, max) => Math.max(0, Math.min(max, Math.floor(Number(n) || 0)));

/**
 * Deja exactamente `n` células: si faltan, añade las primeras del registro que aún no tiene (C001, C002…); si
 * sobran, quita las últimas recogidas.
 */
export function setCellCount(state, n) {
  const target = clamp(n, Math.min(TOTAL_CELLS, CELLS.length));
  for (const c of CELLS) {
    if (state.cellCount() >= target) break;
    if (!state.hasCell(c.key)) state.addCell(c.key);
  }
  while (state.cellCount() > target) state.removeCell(state.data.zygarde.cells[state.cellCount() - 1]);
  return state.cellCount();
}

/** Deja los núcleos N1…Nn (con su flag zyg_core_n); quitar uno borra también su flag. */
export function setCoreCount(state, n) {
  const target = clamp(n, CORE_IDS.length);
  CORE_IDS.forEach((id, i) => {
    if (i < target) {
      if (!state.hasCore(id)) joinCore(state, id);
    } else if (state.hasCore(id)) {
      state.removeCore(id);
      state.setFlag(coreFlag(id), false);
    }
  });
  return CORE_IDS.filter((id) => state.hasCore(id)).length;
}

/** Activa (con sus flags y forma, como el juego) o desactiva una capacidad de Zygarde. */
export function setCapability(state, key, on) {
  if (!CAPABILITY_KEYS.includes(key)) throw new Error(`Capacidad de Zygarde desconocida: ${key}`);
  if (on) return applyUnlock(state, key).changed;
  state.setZygardeAbility(key, false);
  if (CAPABILITY_FLAGS[key]) state.setFlag(CAPABILITY_FLAGS[key], false);
  return true;
}

/** Forma de campo: null (sin Zygarde) | 'core' | '10' | '50' | 'complete' (con el flag de forma correspondiente). */
export function setZygardeFormDev(state, form) {
  const f = form === null || form === undefined || form === '' ? null : String(form);
  if (f !== null && !FORM_ORDER.includes(f)) throw new Error(`Forma de Zygarde desconocida: ${form}`);
  state.setZygardeForm(f);
  if (f && FORM_FLAGS[f]) state.setFlag(FORM_FLAGS[f], true);
  return f;
}

/** Siguiente/anterior forma en el ciclo [ninguna, core, 10, 50, complete]. */
export function cycleForm(current, delta = 1) {
  const list = [null, ...FORM_ORDER];
  const i = Math.max(0, list.indexOf(current ?? null));
  return list[(i + delta + list.length) % list.length];
}

/** Todo Zygarde: 100 células, 5 núcleos, todas las capacidades y la Forma Completa. */
export function unlockAllZygarde(state) {
  setCellCount(state, TOTAL_CELLS);
  setCoreCount(state, CORE_IDS.length);
  for (const key of CAPABILITY_KEYS) setCapability(state, key, true);
  setZygardeFormDev(state, 'complete');
}

/** Pone las capacidades de la lista (y quita las demás si `exclusive`); adopta la forma natural si no tenía. */
export function setCapabilities(state, keys, { exclusive = false } = {}) {
  for (const key of CAPABILITY_KEYS) {
    if (keys.includes(key)) setCapability(state, key, true);
    else if (exclusive && state.zygardeAbility(key)) setCapability(state, key, false);
  }
  if (!state.zygardeForm || state.zygardeForm === 'core') {
    const nat = naturalForm(state);
    if (nat) setZygardeFormDev(state, nat);
  }
}

/** Fragmentos Azur F01…F0n (y el contador del objeto AZUREFRAGMENT, como al restaurar un Pilar). */
export function setFragmentCount(state, n) {
  const target = clamp(n, MAX_FRAGMENTS);
  for (let i = 1; i <= MAX_FRAGMENTS; i++) {
    const id = fragmentId(i);
    if (i <= target) state.addFragment(id);
    else state.removeFragment(id);
  }
  syncFragmentItem(state);
  return state.data.fragments.length;
}

/** Las n primeras Tablillas de campaña (en state.tablets y como objeto en la Mochila). */
export function setTabletCount(state, n) {
  const target = clamp(n, CAMPAIGN_TABLETS.length);
  CAMPAIGN_TABLETS.forEach((t, i) => {
    if (i < target) {
      state.addTablet(t.id);
      if (!state.hasItem(t.id)) state.addItem(t.id, 1);
    } else {
      state.removeTablet(t.id);
      if (state.hasItem(t.id)) state.removeItem(t.id, state.itemCount(t.id));
    }
  });
  return state.data.tablets.length;
}

/** Desbloquea todos los destinos de Vuelo del atlas. Devuelve cuántos hay. */
export function unlockAllFlyPoints(state, map = REGION_MAP) {
  const ids = (map.places || []).filter((p) => p.fly).map((p) => p.id);
  for (const id of ids) state.unlockFlyPoint(id);
  return ids.length;
}

/** Marca como vistos (o también capturados) todos los Pokémon de la Pokédex de Axis y entrega la Pokédex. */
export function registerWholeDex(state, db, { caught = false } = {}) {
  const ids = (db?.dex?.entries || []).map((e) => e.id).filter((id) => id && db.species?.[id]);
  for (const id of ids) {
    if (caught) state.registerCaught(id);
    else state.registerSeen(id);
  }
  if (!state.hasPokedex()) state.obtainPokedex();
  return ids.length;
}
