// Datos de Zygarde (docs/CAMPANA.md §2.1–2.5): registro de las 100 células, núcleos, umbrales y las
// invariantes 1–3 del grafo de disponibilidad (sin bloqueos).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CELLS, cellByKey, cellById, cellsOnMap, stageCounts, CELL_MAPS } from '../game/src/content/zygarde/cells.js';
import {
  CAPABILITIES, CAPABILITY_KEYS, capabilityDef, STAGES, STAGE_KEYS, STAGE_COUNTS, CORES, CORE_IDS, PILLARS, TIMELINE,
  TOTAL_CELLS, MILESTONES, FORMS, FORM_ORDER,
} from '../game/src/content/zygarde/thresholds.js';

const capIndex = (k) => CAPABILITY_KEYS.indexOf(k);

test('registro: 100 células con IDs C001–C100 consecutivos y claves únicas cell_<mapa>_<n>', () => {
  assert.equal(CELLS.length, TOTAL_CELLS);
  CELLS.forEach((c, i) => assert.equal(c.id, `C${String(i + 1).padStart(3, '0')}`));
  assert.equal(new Set(CELLS.map((c) => c.id)).size, 100, 'IDs repetidos');
  assert.equal(new Set(CELLS.map((c) => c.key)).size, 100, 'claves de evento repetidas');
  for (const c of CELLS) {
    assert.match(c.key, /^cell_[a-z0-9_]+_\d+$/, c.key);
    assert.match(c.map, /^[a-z][a-z0-9_]*$/, `${c.id}: mapa ${c.map}`);
    assert.ok(STAGE_KEYS.includes(c.stage), `${c.id}: etapa ${c.stage}`);
    assert.ok(c.where && c.area, `${c.id}: faltan ubicación o zona`);
    assert.equal(cellByKey(c.key), c);
    assert.equal(cellById(c.id), c);
  }
});

test('claves y etapas coinciden con la tabla de CAMPANA §2.3 (muestras)', () => {
  const expect = {
    C001: ['cell_villa_alba_1', 'A', true], C006: ['cell_ruta_1_5', 'A', false], C009: ['cell_zaguan_2', 'A', true],
    C015: ['cell_ruta_2_2', 'B', false], C016: ['cell_ruta_3_1', 'B', true], C024: ['cell_ruta_1_6', 'B', false],
    C032: ['cell_colector_4', 'C', true], C046: ['cell_memoria_1', 'D', true], C051: ['cell_monte_2', 'E', true],
    C059: ['cell_talasa_1', 'F', true], C070: ['cell_zaguan_3', 'F', false], C076: ['cell_monte_3', 'F', false],
    C081: ['cell_fondo_sur_5', 'G', false], C084: ['cell_ecos_3', 'G', true], C096: ['cell_mar_boreal_1', 'H', false],
    C100: ['cell_alma_4', 'H', true],
  };
  for (const [id, [key, stage, required]] of Object.entries(expect)) {
    const c = cellById(id);
    assert.deepEqual([c.key, c.stage, c.required], [key, stage, required], id);
  }
  assert.ok(cellByKey('cell_zaguan_2').scripted && cellByKey('cell_colector_1').scripted, 'entregadas por guion');
});

test('recuento por etapa: A 14 · B 10 · C 10 · D 12 · E 10 · F 20 · G 12 · H 12 = 100', () => {
  assert.deepEqual(stageCounts(), { ...STAGE_COUNTS });
  assert.equal(Object.values(STAGE_COUNTS).reduce((a, b) => a + b, 0), 100);
});

test('10 células obligatorias antes del núcleo del P1: C001–C005 y C008–C012', () => {
  const ids = CELLS.filter((c) => c.stage === 'A' && c.required).map((c) => c.id);
  assert.deepEqual(ids, ['C001', 'C002', 'C003', 'C004', 'C005', 'C008', 'C009', 'C010', 'C011', 'C012']);
});

test('ninguna célula en zonas de Forma Completa (ninguna etapa exige Vuelo o Reconstrucción)', () => {
  for (const s of STAGE_KEYS) {
    for (const k of STAGES[s].requires) assert.ok(!['fly', 'rebuild', 'jump', 'anchor'].includes(k), `etapa ${s} exige ${k}`);
  }
});

/**
 * Células alcanzables antes de recuperar la capacidad k: sus etapas solo piden capacidades anteriores y
 * hitos que ya han ocurrido cuando k está disponible.
 */
function reachableBefore(k) {
  const idx = capIndex(k);
  const when = availability(k);
  return CELLS.filter((c) => {
    const st = STAGES[c.stage];
    return st.requires.every((r) => capIndex(r) < idx) && st.milestones.every((m) => TIMELINE[m] <= when);
  }).length;
}

test('invariante 1: cada umbral es alcanzable con las células de las etapas anteriores (márgenes de §2.5)', () => {
  const expected = { run: 14, ram: 24, terrain: 34, climb: 46, swim: 56, detect: 76, dive: 76, fly: 100, rebuild: 100 };
  for (const def of CAPABILITIES) {
    if (!def.cells) continue;
    const n = reachableBefore(def.key);
    assert.ok(n >= def.cells, `${def.key}: ${n} alcanzables < umbral ${def.cells}`);
    assert.equal(n, expected[def.key], `${def.key}: células alcanzables`);
  }
  const margins = Object.fromEntries(['run', 'ram', 'terrain', 'climb', 'swim', 'dive'].map((k) => [k, reachableBefore(k) - capabilityDef(k).cells]));
  assert.deepEqual(margins, { run: 4, ram: 6, terrain: 9, climb: 11, swim: 6, dive: 6 });
});

test('umbrales de §2.1', () => {
  const t = Object.fromEntries(CAPABILITIES.map((c) => [c.key, [c.form, c.cells, c.cores.length, c.milestone]]));
  assert.deepEqual(t.run, ['10', 10, 1, 'p1_restored']);
  assert.deepEqual(t.ram, ['10', 18, 1, null]);
  assert.deepEqual(t.terrain, ['10', 25, 2, null]);
  assert.deepEqual(t.climb, ['10', 35, 2, 'p5_restored']);
  assert.deepEqual(t.swim, ['50', 50, 3, null]);
  assert.deepEqual(t.detect, ['50', 60, 3, null]);
  assert.deepEqual(t.dive, ['50', 70, 4, MILESTONES.dive]);
  assert.deepEqual(t.fly, ['complete', 100, 5, 'p8_restored']);
  assert.deepEqual(t.rebuild, ['complete', 100, 5, 'p8_restored']);
  assert.equal(capabilityDef('jump').milestone, 'p10_restored');
  assert.ok(capabilityDef('anchor').postgame);
});

/** Momento (orden de campaña) en que una capacidad está disponible. */
function availability(k, seen = new Set()) {
  if (seen.has(k)) throw new Error(`ciclo en requisitos de ${k}`);
  seen.add(k);
  const def = capabilityDef(k);
  let t = def.milestone ? TIMELINE[def.milestone] : 0;
  for (const c of def.cores) t = Math.max(t, TIMELINE[c]);
  for (const r of def.requires) t = Math.max(t, availability(r, new Set(seen)));
  assert.ok(Number.isFinite(t), `${k}: hito o núcleo sin orden en TIMELINE`);
  return t;
}

/** Núcleos necesarios (transitivamente) para obtener una capacidad. */
function coresNeeded(k, acc = new Set()) {
  const def = capabilityDef(k);
  for (const c of def.cores) {
    if (acc.has(c)) continue;
    acc.add(c);
    for (const r of CORES.find((x) => x.id === c).requires) coresNeeded(r, acc);
  }
  for (const r of def.requires) coresNeeded(r, acc);
  return acc;
}

test('invariante 2: ningún núcleo exige (ni directa ni indirectamente) la capacidad que desbloquea', () => {
  assert.deepEqual(CORES.map((c) => c.id), [...CORE_IDS]);
  for (const core of CORES) {
    for (const r of core.requires) {
      assert.ok(!core.unlocks.includes(r), `${core.id} pide ${r}, que él mismo desbloquea`);
      assert.ok(!coresNeeded(r).has(core.id), `${core.id} pide ${r}, que necesita a ${core.id}`);
      assert.ok(availability(r) <= TIMELINE[core.id], `${core.id}: ${r} llega después del núcleo`);
    }
    for (const m of core.milestones) assert.ok(TIMELINE[m] <= TIMELINE[core.id], `${core.id}: hito ${m} posterior`);
    for (const u of core.unlocks) assert.ok(capabilityDef(u).cores.includes(core.id), `${core.id} debería ser condición de ${u}`);
  }
  // Los de CAMPANA §2.5: N2 pide Embestida y da Terreno; N3 Trepar → Nadar; N4 Nadar → Buceo; N5 P7 → Completa.
  const pairs = Object.fromEntries(CORES.map((c) => [c.id, [c.requires.join('+') || c.milestones.join('+'), c.unlocks.join('+')]]));
  assert.deepEqual(pairs.N2, ['ram', 'terrain']);
  assert.deepEqual(pairs.N3, ['climb', 'swim']);
  assert.deepEqual(pairs.N4, ['swim', 'dive']);
  assert.deepEqual(pairs.N5[1], 'fly+rebuild');
  assert.ok(CORES.find((c) => c.id === 'N5').milestones.includes('p7_restored'));
});

test('invariante 3: cada Pilar exige capacidades que se obtienen en un estado anterior', () => {
  assert.deepEqual(PILLARS.map((p) => p.id), ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10']);
  for (const p of PILLARS) {
    for (const k of p.requires) assert.ok(availability(k) < p.order, `${p.id} exige ${k} (disponible en ${availability(k)})`);
    for (const q of p.pillars) assert.ok(PILLARS.find((x) => x.id === q).order < p.order, `${p.id} tras ${q}`);
    assert.equal(TIMELINE[p.flag], p.order, `${p.flag} en TIMELINE`);
  }
  assert.deepEqual(PILLARS.find((p) => p.id === 'P9').items, ['REDCHAIN']);
  assert.equal(PILLARS.find((p) => p.id === 'P10').tablets, 15);
});

test('sin IDs duplicados en capacidades, núcleos, formas ni hitos', () => {
  assert.equal(new Set(CAPABILITY_KEYS).size, CAPABILITY_KEYS.length);
  assert.equal(new Set(CORE_IDS).size, 5);
  assert.deepEqual(FORM_ORDER, ['core', '10', '50', 'complete']);
  for (const f of FORM_ORDER) assert.ok(FORMS[f].name);
  for (const c of CAPABILITIES) {
    for (const r of c.requires) assert.ok(capabilityDef(r), `${c.key} pide ${r} desconocida`);
    for (const n of c.cores) assert.ok(CORE_IDS.includes(n), `${c.key}: núcleo ${n}`);
  }
});

test('mapas con células: consulta por mapa', () => {
  assert.deepEqual(cellsOnMap('ruta_1').map((c) => c.key), ['cell_ruta_1_1', 'cell_ruta_1_2', 'cell_ruta_1_3', 'cell_ruta_1_4', 'cell_ruta_1_5', 'cell_ruta_1_6']);
  assert.ok(CELL_MAPS.includes('villa_alba') && CELL_MAPS.includes('santuario_alma'));
});
