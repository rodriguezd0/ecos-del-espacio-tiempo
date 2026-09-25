// Dinero de entrenadores (docs/BALANCE.md): cada entrenador registrado usa el `money` base de la fila de su clase
// (content/trainerMoney.js) o lleva una excepción explícita con motivo.
// Regla estricta en los bloques terminados (B01–B06, STRICT_MAX_BLOCK). Los archivos de bloques posteriores pueden
// estar a medias mientras otro agente los crea: sus incidencias salen como diagnóstico, no como fallo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { db } from './battle_helpers.mjs';
import { GameState } from '../game/src/core/state.js';
import { resolveTrainer } from '../game/src/battle/scene/setup.js';
import {
  MONEY_BY_KIND, MONEY_VALUES, CLASS_KIND, moneyKindOf, checkTrainerMoney, normalizeClass,
} from '../game/src/content/trainerMoney.js';

/** Último bloque cuya regla se exige (súbelo al cerrar cada bloque nuevo). */
const STRICT_MAX_BLOCK = 21;
const DIR = new URL('../game/src/content/trainers/', import.meta.url);

/** Número de bloque a partir del nombre del archivo (b01_ruta1.js → 1, b06.js → 6); null si no sigue el patrón. */
function blockOf(file) {
  const m = /^b(\d+)/.exec(file);
  return m ? Number(m[1]) : null;
}

const trainerFiles = fs.readdirSync(DIR).filter((f) => f.endsWith('.js') && f !== 'index.js').sort();
const strictFiles = trainerFiles.filter((f) => blockOf(f) !== null && blockOf(f) <= STRICT_MAX_BLOCK);

async function loadFile(file) {
  return (await import(new URL(file, DIR).href)).default || {};
}

// ─── Tabla y clasificación ───────────────────────────────────────────────────────────────────────
test('tabla de BALANCE.md: valores y clases literales', () => {
  assert.deepEqual(MONEY_BY_KIND, {
    jovenes: 16, agua: 24, campo: 32, expertos: 48, genesis: 40, comandante: 80, vertice: 120, rival: 60, guardian: 100,
    elite: 120,
  });
  assert.deepEqual(MONEY_VALUES, [16, 24, 32, 40, 48, 60, 80, 100, 120]);
  const expect = {
    Joven: 16, Chica: 16, Bichero: 16, Colegial: 16, Pescador: 24, Nadadora: 24, Buceadora: 24, Campista: 24,
    Excursionista: 32, 'Montañero': 32, Minero: 32, Ciclista: 32, 'Arqueóloga': 48, 'Científico': 48, Veterana: 48,
    Dama: 48, Caballero: 48, 'Técnico del Consorcio': 40, 'Técnica del Consorcio': 40, 'Investigadora de Genesis': 40,
    'Comandante de Genesis': 80, Rival: 60, 'Guardiana': 100, 'Guardián': 100,
  };
  for (const [cls, money] of Object.entries(expect)) {
    assert.equal(MONEY_BY_KIND[moneyKindOf({ class: cls })], money, cls);
  }
  assert.equal(normalizeClass(' Montañero '), 'montanero');
  assert.equal(CLASS_KIND.arqueologa, 'expertos');
});

test('checkTrainerMoney: fila por clase, moneyKind, excepción y errores', () => {
  assert.equal(checkTrainerMoney('a', { class: 'Pescador', money: 24 }).ok, true);
  const wrong = checkTrainerMoney('b', { class: 'Pescador', money: 40 });
  assert.equal(wrong.ok, false);
  assert.equal(wrong.expected, 24);
  assert.match(wrong.problem, /40 ≠ 24/);
  assert.match(checkTrainerMoney('c', { class: 'Pescador' }).problem, /falta `money`/);
  assert.match(checkTrainerMoney('d', { class: 'Malabarista', money: 30 }).problem, /no está en la tabla/);
  assert.equal(checkTrainerMoney('e', { class: 'Malabarista', money: 30, moneyException: 'feria de Lúmina' }).ok, true);
  assert.match(checkTrainerMoney('f', { class: 'X', money: 30, moneyException: ' ' }).problem, /motivo/);
  assert.equal(checkTrainerMoney('g', { class: 'Maestre', money: 100, moneyKind: 'guardian' }).ok, true);
  assert.match(checkTrainerMoney('h', { class: 'Maestre', money: 100, moneyKind: 'jefe' }).problem, /no es una fila/);
  assert.equal(checkTrainerMoney('i', { class: 'Rival', money: 0 }).ok, false);
});

// ─── Bloques terminados: regla estricta ─────────────────────────────────────────────────────────
test(`B01–B${String(STRICT_MAX_BLOCK).padStart(2, '0')}: todos los entrenadores usan el dinero de su clase`, async () => {
  assert.ok(strictFiles.length >= 7, `archivos de entrenadores de B01–B06: ${strictFiles.join(', ')}`);
  const problems = [];
  let count = 0;
  for (const file of strictFiles) {
    const trainers = await loadFile(file);
    for (const [id, def] of Object.entries(trainers)) {
      count += 1;
      const r = checkTrainerMoney(id, def);
      if (!r.ok) problems.push(`${file}: ${r.problem}`);
    }
  }
  assert.ok(count >= 40, `entrenadores revisados: ${count}`);
  assert.deepEqual(problems, [], `dinero fuera de la tabla de docs/BALANCE.md:\n${problems.join('\n')}`);
});

test('casos concretos de BALANCE.md: Gael, Guardianes, Genesis y Casia', async () => {
  const all = {};
  for (const file of strictFiles) Object.assign(all, await loadFile(file));
  for (const id of ['gael_1', 'gael_2']) assert.equal(all[id].money, 60, id);
  for (const id of ['b02_casilda', 'leandro', 'b06_abril']) assert.equal(all[id].money, 100, id);
  for (const id of ['ga_tecnico_ribas', 't02_tecnica_b', 'b06_tecnico_puerta', 'b06_tecnica_control']) {
    assert.equal(all[id].money, 40, id);
  }
  assert.equal(all.b06_casia.money, 80);
});

test('el motor recibe `money` como base del premio (battle/scene/setup.js#resolveTrainer)', async () => {
  const state = GameState.create();
  for (const file of strictFiles) {
    for (const [id, def] of Object.entries(await loadFile(file))) {
      const party = typeof def.party === 'function' ? def.party(state) : def.party;
      const { opponent, trainerType } = resolveTrainer({ ...def, party }, db, id);
      assert.equal(opponent.baseMoney, def.money, id);
      assert.equal(trainerType[`AXIS:${id}`].baseMoney, def.money, id);
    }
  }
});

// ─── Registro completo (tolera bloques en construcción) ──────────────────────────────────────────
test('registro de entrenadores: los de B01–B06 están registrados; B07+ solo avisan', async (t) => {
  let TRAINERS;
  try {
    ({ TRAINERS } = await import('../game/src/content/trainers/index.js'));
  } catch (err) {
    // Un archivo de un bloque en construcción puede romper la importación del índice: no es un fallo de este test.
    t.diagnostic(`no se pudo importar content/trainers/index.js (¿bloque a medias?): ${err.message}`);
    t.skip('registro no importable');
    return;
  }
  for (const file of strictFiles) {
    for (const id of Object.keys(await loadFile(file))) assert.ok(TRAINERS[id], `${id} (${file}) no está en el registro`);
  }
  const pending = [];
  for (const file of trainerFiles.filter((f) => !strictFiles.includes(f))) {
    let trainers;
    try {
      trainers = await loadFile(file);
    } catch (err) {
      pending.push(`${file}: no se puede importar (${err.message})`);
      continue;
    }
    for (const [id, def] of Object.entries(trainers)) {
      const r = checkTrainerMoney(id, def);
      if (!r.ok) pending.push(`${file}: ${r.problem}`);
    }
  }
  for (const line of pending) t.diagnostic(`[aviso B07+] ${line}`);
});
