// Auditoría de fugas de progresión (tools/audit_progression.mjs; DECISIONES X35, «DECIDIDO (autor, 25-09-2026)»).
// Para cada etapa (estado de entrada de B01–B21, game/src/dev/devBlocks.js) recorre el mundo con la pasabilidad real y
// las capacidades de Zygarde de ese momento y exige que ningún mapa alcanzable tenga entrenadores o salvajes más de
// MARGIN niveles por encima del nivel esperado. Además fija los cierres diegéticos que corrigieron las fugas:
//   · el puente de la Ruta 2 (hasta el P1): no se llega a Caudal ni a Gael B2 con el inicial recién elegido;
//   · la verja de la Senda del Mirador (hasta el P8) y los entrenadores de B17, que solo existen tras el P8;
//   · el pinar del norte de Brontia: a la Ruta 11 solo se sale por el hielo-eco (hasta el P7).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { auditAll, MARGIN, expectedLevel } from '../tools/audit_progression.mjs';
import { BLOCK_STARTS } from '../game/src/dev/devBlocks.js';
import { GameState } from '../game/src/core/state.js';
import { expandEventDef } from '../game/src/world/eventTypes.js';
import {
  ruta2BridgeClosed, sendaClosed, ruta2BridgeGate, caudalSendaGate, GATE_FLAGS,
} from '../game/src/content/events/progression_gates.js';
import { BRIDGES } from '../game/src/content/maps/b03/ruta_2.js';

let results = [];
const stage = (id) => results.find((r) => r.id === id);
const order = BLOCK_STARTS.map((b) => b.id);
const before_ = (id) => order.slice(0, order.indexOf(id));

before(async () => { results = await auditAll(); });

test('auditoría: ninguna etapa alcanza entrenadores o salvajes muy por encima de su nivel', () => {
  assert.equal(results.length, BLOCK_STARTS.length);
  const lines = results.flatMap((r) => r.leaks.map((l) => `${r.id} (esperado ${r.expected}): ${l.map} ${l.kind} ${l.what} nv ${l.level}`));
  assert.deepEqual(lines, [], `fugas de progresión (margen ${MARGIN}):\n${lines.join('\n')}`);
  for (const r of results) assert.deepEqual(r.errors, [], `${r.id}: mapas que no se construyen`);
});

test('auditoría: el alcance crece con la historia y cada etapa llega a su propio punto de partida', () => {
  for (const r of results) {
    const preset = BLOCK_STARTS.find((b) => b.id === r.id);
    assert.ok(r.reached.includes(preset.map), `${r.id}: no alcanza ${preset.map}`);
    assert.equal(r.limit, expectedLevel(preset) + MARGIN);
  }
  assert.ok(stage('B21').reached.length > stage('B01').reached.length * 4, 'el mundo se abre');
});

test('cierre del puente de la Ruta 2: Caudal y Gael B2 solo tras el P1', () => {
  for (const id of ['B01', 'B02']) {
    assert.ok(stage(id).reached.includes('ruta_2'), `${id}: el tramo norte de la Ruta 2 sigue abierto`);
    assert.ok(!stage(id).reached.includes('ciudad_caudal'), `${id}: se llega a Caudal antes del P1`);
  }
  assert.ok(stage('B03').reached.includes('ciudad_caudal'), 'B03: tras el P1 se llega a Caudal');
});

test('cierre de la Senda del Mirador: solo tras el P8 (B17)', () => {
  for (const id of before_('B17')) assert.ok(!stage(id).reached.includes('senda_mirador'), `${id}: se llega a la Senda`);
  assert.ok(stage('B17').reached.includes('senda_mirador'), 'B17: la Senda se abre');
});

test('hielo-eco de Brontia: la Ruta 11 solo tras el P7 (B15)', () => {
  for (const id of before_('B15')) assert.ok(!stage(id).reached.includes('ruta_11'), `${id}: se llega a la Ruta 11`);
  assert.ok(stage('B15').reached.includes('ruta_11'));
});

test('predicados de los cierres: flags que los abren', () => {
  const s = GameState.create({ name: 'Prueba' });
  assert.equal(ruta2BridgeClosed(s), true);
  assert.equal(sendaClosed(s), true);
  s.setFlag(GATE_FLAGS.p1);
  assert.equal(ruta2BridgeClosed(s), false);
  const old = GameState.create({ name: 'Prueba' });
  old.setFlag(GATE_FLAGS.gaelB2);
  assert.equal(ruta2BridgeClosed(old), false, 'una partida que ya estuvo en Caudal no queda encerrada');
  s.setFlag(GATE_FLAGS.p8);
  assert.equal(sendaClosed(s), false);
  const bridge = ruta2BridgeGate(BRIDGES[0]);
  assert.deepEqual(bridge.filter((e) => e.pages[0].solid).map((e) => [e.x, e.y]), [[13, 15], [14, 15], [15, 15]]);
  const gate = caudalSendaGate();
  assert.ok(gate.filter((e) => e.id.startsWith('verja_senda_')).length >= 4, 'verja de al menos 4 casillas');
});

test('tipo trainer: respeta `when` (los curiosos de B17 no existen antes del P8)', () => {
  const def = expandEventDef({ id: 't', type: 'trainer', x: 0, y: 0, sprite: 'x', trainer: 'b17_montanero_oscar', when: (s) => s.flag('p8_restored') });
  const s = GameState.create({ name: 'Prueba' });
  const ev = { selfSwitch: () => false };
  assert.equal(def.pages.some((p) => p.when(s, ev)), false, 'antes del P8 ninguna página');
  s.setFlag('p8_restored');
  assert.equal(def.pages[0].when(s, ev), true, 'tras el P8 la página de combate');
});
