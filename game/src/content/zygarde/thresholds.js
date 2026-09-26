// Umbrales de Zygarde (docs/CAMPANA.md §2.1, D10 DECIDIDO-DEV) y datos del grafo de disponibilidad (§2.5).
// Datos puros (sin DOM). La lógica que los usa está en world/zygarde/progression.js; los tests de
// invariantes en tests/zygarde_data.test.mjs.
//
// Claves de capacidad (coinciden con state.data.zygarde.abilities):
//   run ram terrain climb swim detect dive fly rebuild jump anchor

export const TOTAL_CELLS = 100;
export const TOTAL_CORES = 5;
export const CORE_IDS = Object.freeze(['N1', 'N2', 'N3', 'N4', 'N5']);

/** Formas de campo (§2.7). `speciesForm` = forma de ZYGARDE en species.json (0 = 50 %, 1 = 10 %, 2 = Completa). */
export const FORMS = Object.freeze({
  core: Object.freeze({ key: 'core', name: 'Core', short: 'Core', speciesForm: null }),
  10: Object.freeze({ key: '10', name: 'Forma 10 %', short: '10 %', speciesForm: 1 }),
  50: Object.freeze({ key: '50', name: 'Forma 50 %', short: '50 %', speciesForm: 0 }),
  complete: Object.freeze({ key: 'complete', name: 'Forma Completa', short: 'Completa', speciesForm: 2 }),
});
export const FORM_ORDER = Object.freeze(['core', '10', '50', 'complete']);

/**
 * Hitos narrativos (flags globales, CAMPANA §3). Los fija el guion del bloque; world/zygarde/scenes.js
 * (reachMilestone) los fija y comprueba la progresión a la vez.
 */
export const MILESTONES = Object.freeze({
  run: 'p1_restored', // B02: salida de las Ruinas del Dintel
  climb: 'p5_restored', // B10: núcleo del Archivo Hondo
  dive: 'b13_dive_resonance', // B13: resonancia en el muelle de buzos de Caleta Sonda (nombre técnico)
  complete: 'p8_restored', // B16: crisis al terminar el P8
  jump: 'p10_restored', // B21: Salto de Convergencia tras el P10
  anchor: 'game_cleared', // B22: postgame, tras Arceus (X16)
});

/** Flags de estado global que se fijan al desbloquear cada forma (CAMPANA, convenciones). */
export const FORM_FLAGS = Object.freeze({ 10: 'zyg_10', 50: 'zyg_50', complete: 'zyg_complete' });

/** Flags globales de capacidades sueltas (CAMPANA B13, «Salida»: `zyg_dive`); se fijan al activarlas (aditivo B13). */
export const CAPABILITY_FLAGS = Object.freeze({ dive: 'zyg_dive' });

/** Nombres cortos para la rejilla de la pantalla de Zygarde (el nombre completo va en la ayuda). */
const SHORT_NAMES = {
  terrain: 'Terreno', detect: 'Detección', rebuild: 'Reconstruir', jump: 'Salto', anchor: 'Anclaje',
};

const N1 = ['N1'];
const N12 = ['N1', 'N2'];
const N123 = ['N1', 'N2', 'N3'];
const N1234 = ['N1', 'N2', 'N3', 'N4'];
const ALL_CORES = ['N1', 'N2', 'N3', 'N4', 'N5'];

/**
 * Capacidades en orden de recuperación (§2.1). `cells`/`cores`/`milestone` = condiciones;
 * `requires` = capacidades que deben estar ya activas (formas anteriores). `hint` = ayuda de control.
 */
export const CAPABILITIES = Object.freeze([
  {
    key: 'run', name: 'Correr', form: '10', cells: 10, cores: N1, milestone: MILESTONES.run,
    desc: 'Montura del 10 %: el doble de rápida que la carrera.',
    hint: 'Pulsa E (R) para montar o bajar; mantén Mayús para galopar.',
  },
  {
    key: 'ram', name: 'Embestida', form: '10', cells: 18, cores: N1, requires: ['run'],
    desc: 'Rompe rocas agrietadas y troncos marcados.',
    hint: 'Pulsa A frente a una roca con una fisura blanca.',
  },
  {
    key: 'terrain', name: 'Terreno complicado', form: '10', cells: 25, cores: N12, requires: ['run'],
    desc: 'Cruza barro, arena honda y nieve profunda.',
    hint: 'Camina sobre el barro, la arena honda o la nieve con huellas hundidas.',
  },
  {
    key: 'climb', name: 'Trepar', form: '10', cells: 35, cores: N12, milestone: MILESTONES.climb, requires: ['run'],
    desc: 'Sube y baja paredes con vetas verdes.',
    hint: 'Pulsa A frente a una pared con vetas verdes.',
  },
  {
    key: 'swim', name: 'Nadar', form: '50', cells: 50, cores: N123,
    desc: 'La forma 50 % lleva al jugador por el agua profunda.',
    hint: 'Pulsa A mirando al agua profunda.',
  },
  {
    key: 'detect', name: 'Detección mejorada', form: '50', cells: 60, cores: N123, requires: ['swim'],
    desc: 'Señala la célula más cercana y marca el mapa de la región.',
    hint: 'En el mapa regional se marcan los lugares visitados donde aún quedan células.',
  },
  {
    key: 'dive', name: 'Buceo', form: '50', cells: 70, cores: N1234, milestone: MILESTONES.dive, requires: ['swim'],
    desc: 'Una burbuja de resonancia permite bajar al fondo.',
    hint: 'Pulsa A sobre un remolino mientras nadas.',
  },
  {
    key: 'fly', name: 'Vuelo', form: 'complete', cells: 100, cores: ALL_CORES, milestone: MILESTONES.complete,
    requires: ['swim'], desc: 'Viaja a lugares ya visitados.',
    hint: 'Elige «Volar» en la pantalla de Zygarde.',
  },
  {
    key: 'rebuild', name: 'Reconstrucción', form: 'complete', cells: 100, cores: ALL_CORES,
    milestone: MILESTONES.complete, requires: ['swim'],
    desc: 'Alza caminos en los zócalos hexagonales.',
    hint: 'Pulsa A junto a un zócalo con hexágonos gastados.',
  },
  {
    key: 'jump', name: 'Salto de Convergencia', form: '10', cells: 0, cores: [], milestone: MILESTONES.jump,
    requires: ['fly'], scripted: true, desc: 'Corre por los caminos viejos de la red.',
  },
  {
    key: 'anchor', name: 'Anclaje espacial', form: 'complete', cells: 0, cores: [], milestone: MILESTONES.anchor,
    requires: ['fly'], scripted: true, postgame: true, desc: 'Fija una orientación inestable.',
  },
].map((c) => Object.freeze({ requires: [], scripted: false, postgame: false, milestone: null, ...c, short: SHORT_NAMES[c.key] || c.name })));

export const CAPABILITY_KEYS = Object.freeze(CAPABILITIES.map((c) => c.key));
const BY_KEY = Object.freeze(Object.fromEntries(CAPABILITIES.map((c) => [c.key, c])));

/** Definición de una capacidad o null. */
export function capabilityDef(key) {
  return Object.hasOwn(BY_KEY, key) ? BY_KEY[key] : null;
}

/**
 * Etapas de las células (§2.3). `requires` = capacidades necesarias para alcanzarlas; `milestones` = hitos.
 * A sin capacidad · B Correr · C tras P2/Embestida · D Terreno (tras P3/P4) · E Trepar · F Nadar · G Buceo · H tras P7.
 */
export const STAGES = Object.freeze({
  A: Object.freeze({ label: 'Sin capacidad', requires: [], milestones: [] }),
  B: Object.freeze({ label: 'Correr', requires: ['run'], milestones: [] }),
  C: Object.freeze({ label: 'Tras P2 / Embestida', requires: ['ram'], milestones: ['p2_restored'] }),
  D: Object.freeze({ label: 'Terreno (tras P3/P4)', requires: ['terrain'], milestones: ['p3_restored'] }),
  E: Object.freeze({ label: 'Trepar', requires: ['climb'], milestones: [] }),
  F: Object.freeze({ label: 'Nadar', requires: ['swim'], milestones: [] }),
  G: Object.freeze({ label: 'Buceo', requires: ['dive'], milestones: [] }),
  H: Object.freeze({ label: 'Tras P7', requires: ['swim'], milestones: ['p7_restored'] }),
});
export const STAGE_KEYS = Object.freeze(Object.keys(STAGES));

/** Recuento por etapa esperado (§2.3). */
export const STAGE_COUNTS = Object.freeze({ A: 14, B: 10, C: 10, D: 12, E: 10, F: 20, G: 12, H: 12 });

/** Los cinco núcleos (§2.4). `requires`/`milestones` = lo que hace falta para obtenerlo; `unlocks` = lo que da. */
export const CORES = Object.freeze([
  { id: 'N1', map: 'laberinto_profundidad', area: 'Laberinto de la Profundidad', requires: [], milestones: [], unlocks: ['run'] },
  { id: 'N2', map: 'parque_eolico', area: 'Colector del Parque Eólico (P3)', requires: ['ram'], milestones: ['p2_restored'], unlocks: ['terrain'] },
  { id: 'N3', map: 'pilar_invertido', area: 'Núcleo del Pilar Invertido (P6)', requires: ['climb'], milestones: [], unlocks: ['swim'] },
  { id: 'N4', map: 'estacion_talasa', area: 'Estación Talasa', requires: ['swim'], milestones: [], unlocks: ['dive'] },
  { id: 'N5', map: 'villa_boreal', area: 'Villa Boreal (lo entrega Gael)', requires: ['swim'], milestones: ['p7_restored'], unlocks: ['fly', 'rebuild'] },
].map((c) => Object.freeze(c)));

/** Flag global de cada núcleo (CAMPANA §3: zyg_core_2, zyg_core_4, zyg_core_5…). */
export const coreFlag = (id) => `zyg_core_${String(id).replace(/^N/, '')}`;

/**
 * Requisitos de los Pilares (§2.5, invariante 3). `order` = posición en la campaña; los hitos intermedios
 * (núcleos, resonancias) tienen órdenes fraccionarios en TIMELINE.
 */
export const PILLARS = Object.freeze([
  { id: 'P1', flag: 'p1_restored', order: 1, requires: [], pillars: [] },
  { id: 'P2', flag: 'p2_restored', order: 2, requires: ['run'], pillars: ['P1'] },
  { id: 'P3', flag: 'p3_restored', order: 3, requires: ['ram'], pillars: ['P2'] },
  { id: 'P4', flag: 'p4_restored', order: 4, requires: ['terrain'], pillars: ['P3'] },
  { id: 'P5', flag: 'p5_restored', order: 5, requires: ['terrain'], pillars: ['P4'] },
  { id: 'P6', flag: 'p6_restored', order: 6, requires: ['climb'], pillars: ['P5'] },
  { id: 'P7', flag: 'p7_restored', order: 7, requires: ['dive'], pillars: ['P6'] },
  { id: 'P8', flag: 'p8_restored', order: 8, requires: ['swim'], pillars: ['P7'] },
  { id: 'P9', flag: 'p9_restored', order: 9, requires: ['rebuild'], pillars: ['P8'], items: ['REDCHAIN'] },
  { id: 'P10', flag: 'p10_restored', order: 10, requires: ['fly', 'rebuild'], pillars: ['P9'], tablets: 15, fragments: 9 },
].map((p) => Object.freeze(p)));

/**
 * Orden temporal de hitos y núcleos (para los tests del grafo): un valor x.5 ocurre entre el Pilar x y el x+1.
 * N2 se obtiene dentro del capítulo del P3 antes de restaurarlo (2.5); N3 al restaurar el P6 (6).
 */
export const TIMELINE = Object.freeze({
  N1: 0,
  p1_restored: 1,
  p2_restored: 2,
  N2: 2.5,
  p3_restored: 3,
  p4_restored: 4,
  p5_restored: 5,
  N3: 6,
  p6_restored: 6,
  N4: 6.5,
  b13_dive_resonance: 6.5,
  p7_restored: 7,
  N5: 7.5,
  p8_restored: 8,
  p9_restored: 9,
  p10_restored: 10,
  game_cleared: 11,
});
