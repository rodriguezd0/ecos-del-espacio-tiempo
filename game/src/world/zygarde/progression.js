// Progresión de Zygarde (docs/CAMPANA.md §2.1–2.7; biblia §8): capacidades a partir de células, núcleos y
// hitos narrativos; formas desbloqueadas; activación diferida («Me faltan N partes»). Módulo PURO (sin DOM,
// sin ctx): las escenas están en ./scenes.js. Acepta un GameState (o su `data`) para leer y usa sus
// setters para escribir.
import {
  CAPABILITIES, capabilityDef, FORM_ORDER, FORM_FLAGS, CORE_IDS, coreFlag, MILESTONES, FORMS, TOTAL_CELLS,
} from '../../content/zygarde/thresholds.js';

/** Capacidades que cambian la forma natural de Zygarde al recuperarse. */
export const FORM_UNLOCKS = Object.freeze({ run: '10', swim: '50', fly: 'complete', rebuild: 'complete' });

/** Vista de solo lectura del estado (GameState o data). */
function view(state) {
  const d = state?.data || state || {};
  const z = d.zygarde || {};
  return {
    cells: Array.isArray(z.cells) ? z.cells.length : 0,
    cores: Array.isArray(z.cores) ? z.cores : [],
    abilities: z.abilities || {},
    form: z.form || null,
    flag: (k) => Boolean(d.flags?.[k]),
  };
}

function statusWith(v, def, abilities) {
  const coresMissing = def.cores.filter((c) => !v.cores.includes(c));
  const milestoneMet = !def.milestone || v.flag(def.milestone);
  const requiresMet = def.requires.every((k) => Boolean(abilities[k]));
  const cellsMissing = Math.max(0, def.cells - v.cells);
  return {
    key: def.key,
    unlocked: Boolean(abilities[def.key]),
    eligible: milestoneMet && requiresMet && coresMissing.length === 0 && cellsMissing === 0,
    cellsMissing,
    coresMissing,
    milestoneMet,
    requiresMet,
  };
}

/**
 * Estado de una capacidad: { key, unlocked, eligible, cellsMissing, coresMissing, milestoneMet, requiresMet }.
 * `unlocked` = ya activa (state.zygarde.abilities); `eligible` = se cumplen todas las condiciones.
 */
export function capabilityStatus(state, key) {
  const def = capabilityDef(key);
  if (!def) throw new Error(`Capacidad de Zygarde desconocida: "${key}"`);
  const v = view(state);
  return statusWith(v, def, v.abilities);
}

/**
 * Capacidades que se activarían ahora (en orden de recuperación), encadenando las que dependen de otras
 * que se activan en la misma pasada (p. ej. con 100 células y los 5 núcleos de golpe).
 */
export function pendingCapabilities(state) {
  const v = view(state);
  const abil = { ...v.abilities };
  const out = [];
  for (const def of CAPABILITIES) {
    if (abil[def.key]) continue;
    if (statusWith(v, def, abil).eligible) {
      out.push(def.key);
      abil[def.key] = true;
    }
  }
  return out;
}

/**
 * Partes que faltan para una capacidad cuyo hito ya se cumplió (0 si no falta nada o si el hito, los
 * núcleos o las capacidades previas aún no están). Es lo que dice el Core: «Me faltan dos partes».
 */
export function missingParts(state, key) {
  const s = capabilityStatus(state, key);
  if (s.unlocked || !s.milestoneMet || !s.requiresMet || s.coresMissing.length) return 0;
  return s.cellsMissing;
}

/** Primera capacidad con hito cumplido a la que solo le faltan células: { key, missing } o null. */
export function firstMissing(state) {
  for (const def of CAPABILITIES) {
    if (!def.milestone) continue;
    const n = missingParts(state, def.key);
    if (n > 0) return { key: def.key, missing: n };
  }
  return null;
}

/** Formas desbloqueadas, en orden (el Arca permite elegir entre ellas). */
export function unlockedForms(state) {
  const v = view(state);
  const out = [];
  if (v.cores.includes('N1') || v.form) out.push('core');
  if (v.abilities.run) out.push('10');
  if (v.abilities.swim) out.push('50');
  if (v.abilities.fly || v.abilities.rebuild) out.push('complete');
  return out;
}

/** Forma más avanzada desbloqueada (o null). */
export function naturalForm(state) {
  const forms = unlockedForms(state);
  return forms.length ? forms[forms.length - 1] : null;
}

const rank = (form) => FORM_ORDER.indexOf(form);

/**
 * Activa una capacidad en el estado: habilidad, flag de forma (zyg_10/zyg_50/zyg_complete) y, si es una
 * capacidad de forma más avanzada que la actual, cambia la forma. Devuelve { changed, formChanged }.
 */
export function applyUnlock(state, key) {
  if (!capabilityDef(key)) throw new Error(`Capacidad de Zygarde desconocida: "${key}"`);
  if (typeof state?.setZygardeAbility !== 'function') throw new Error('applyUnlock: se esperaba un GameState');
  if (state.zygardeAbility(key)) return { changed: false, formChanged: null };
  state.setZygardeAbility(key, true);
  const form = FORM_UNLOCKS[key];
  let formChanged = null;
  if (form) {
    if (FORM_FLAGS[form]) state.setFlag(FORM_FLAGS[form], true);
    const current = state.data.zygarde.form || null;
    if (rank(form) > rank(current)) {
      setForm(state, form);
      formChanged = form;
    }
  }
  return { changed: true, formChanged };
}

/** Cambia la forma con el setter de GameState (o directamente si no existe, p. ej. estados antiguos). */
export function setForm(state, form) {
  if (typeof state.setZygardeForm === 'function') state.setZygardeForm(form);
  else state.data.zygarde.form = form;
}

/**
 * Un núcleo se une (N1…N5): lo añade, fija su flag global (zyg_core_n) y, si Zygarde aún no acompañaba,
 * empieza como Core. Devuelve true si era nuevo.
 */
export function joinCore(state, id) {
  if (!CORE_IDS.includes(id)) throw new Error(`Núcleo de Zygarde desconocido: "${id}"`);
  const isNew = !state.hasCore(id);
  state.addCore(id);
  state.setFlag(coreFlag(id), true);
  if (!state.data.zygarde.form) setForm(state, 'core');
  return isNew;
}

/** ¿Cambiar a esta forma con el Arca? Solo formas desbloqueadas y teniendo el Arca (`ZYGARDECUBE`). */
export function canChooseForm(state, form, { requireArca = true } = {}) {
  if (!unlockedForms(state).includes(form)) return false;
  return !requireArca || state.hasKeyItem?.('ZYGARDECUBE') === true;
}

/** Hito de la crisis del P8 con células sin reunir (todas brillan en el mapa regional, §2.2). */
export function inCrisisSearch(state) {
  const v = view(state);
  return v.flag(MILESTONES.complete) && !v.abilities.fly;
}

/**
 * Lista para la pantalla de Zygarde: [{ key, name, form, unlocked, pending }]. `pending` = hito cumplido
 * pero faltan partes (sin cifras: la pantalla no muestra umbrales).
 */
export function capabilityList(state, { includePostgame = true } = {}) {
  return CAPABILITIES
    .filter((d) => includePostgame || !d.postgame)
    .map((d) => {
      const s = capabilityStatus(state, d.key);
      return {
        key: d.key, name: d.name, short: d.short, form: d.form, desc: d.desc,
        unlocked: s.unlocked, pending: missingParts(state, d.key) > 0,
      };
    });
}

/**
 * Modelo de la pantalla de Zygarde (ui/screens/zygarde.js): forma actual, células, núcleos, formas del Arca
 * y capacidades (las de postgame solo aparecen cuando se recuperan, para no adelantar nada).
 */
export function zygardeSummary(state) {
  const v = view(state);
  const forms = unlockedForms(state);
  return {
    form: v.form,
    formName: v.form && FORMS[v.form] ? FORMS[v.form].name : 'Sin forma',
    cells: v.cells,
    totalCells: TOTAL_CELLS,
    cores: CORE_IDS.map((id) => ({ id, have: v.cores.includes(id) })),
    coreCount: CORE_IDS.filter((id) => v.cores.includes(id)).length,
    forms: FORM_ORDER.map((f) => ({ key: f, name: FORMS[f].short, unlocked: forms.includes(f), current: v.form === f })),
    capabilities: capabilityList(state).filter((c) => !capabilityDef(c.key).postgame || c.unlocked),
    hasArca: Boolean(state?.hasKeyItem?.('ZYGARDECUBE')),
  };
}
