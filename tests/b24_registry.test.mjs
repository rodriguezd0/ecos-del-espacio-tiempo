import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { EXPEDITIONS, CATEGORIES, expedition, availableWave, activeExpeditions, activate, cancel, noteIndicio, submitHypothesis, markHallazgo, phase } from '../game/src/content/events/b24_registry.js';

const ready = () => { const s = GameState.create({ name: 'Axis' }); s.setFlag('game_cleared'); s.setFlag('b21_fin'); s.setFlag('dlc2_registro_abierto'); return s; };
test('B24: el catálogo de JSON distribuye seis categorías y cuatro oleadas sin IDs duplicados', () => {
  assert.equal(CATEGORIES.length, 6);
  assert.deepEqual([...new Set(EXPEDITIONS.map((e) => e.wave))].sort(), [1, 2, 3, 4]);
  assert.equal(new Set(EXPEDITIONS.map((e) => e.id)).size, EXPEDITIONS.length);
  assert.ok(EXPEDITIONS.length >= 30);
});
test('B24: antes del postgame no se activa el Registro ni se adelantan fases', () => {
  const s = GameState.create({ name: 'Axis' });
  assert.equal(activate(s, 'mew'), 'story');
  assert.equal(noteIndicio(s, 'mew', 'ruta_1'), false);
  assert.equal(markHallazgo(s, 'mew'), false);
});
test('B24: tres activas, cuarta rechazada sin tocar el progreso', () => {
  const s = ready();
  for (const id of ['mew', 'celebi', 'jirachi']) assert.equal(activate(s, id), 'ok');
  const before = JSON.stringify(s.data);
  assert.equal(activate(s, 'manaphy'), 'full');
  assert.equal(JSON.stringify(s.data), before);
  assert.deepEqual(activeExpeditions(s), ['mew', 'celebi', 'jirachi']);
});
test('B24: cancelar conserva Indicio y una hipótesis confirmada al reactivar', () => {
  const s = ready(); activate(s, 'celebi');
  assert.equal(noteIndicio(s, 'celebi', expedition('celebi').maps[0]), true);
  assert.equal(submitHypothesis(s, 'celebi', expedition('celebi').place), 'correct');
  assert.equal(cancel(s, 'celebi'), true);
  assert.equal(phase(s, 'celebi'), 'indicio');
  assert.equal(activate(s, 'celebi'), 'ok');
  assert.ok(s.flag('dlc2_celebi_confirmada'));
});
test('B24: marcar mal en el mapa es gratuito y cancelar no confirma nada', () => {
  const s = ready(); activate(s, 'mew'); noteIndicio(s, 'mew', 'ruta_1');
  const before = JSON.stringify(s.data);
  assert.equal(submitHypothesis(s, 'mew', 'ciudad_nexo'), 'wrong');
  assert.equal(submitHypothesis(s, 'mew', null), 'cancel');
  assert.equal(JSON.stringify(s.data), before);
  assert.ok(!s.flag('dlc2_mew_confirmada'));
});
test('B24: una hipótesis sin Indicio no confirma el lugar', () => {
  const s = ready(); activate(s, 'celebi');
  assert.equal(submitHypothesis(s, 'celebi', expedition('celebi').place), 'indicio');
  assert.ok(!s.flag('dlc2_celebi_confirmada'));
});
test('B24: no se recibe Indicio de un lugar ajeno y no se progresa sin activarla', () => {
  const s = ready();
  assert.equal(noteIndicio(s, 'celebi', expedition('celebi').maps[0]), false);
  activate(s, 'celebi');
  assert.equal(noteIndicio(s, 'celebi', 'ciudad_nexo'), false);
  assert.equal(phase(s, 'celebi'), 'rumor');
});
test('B24: un Hallazgo libera una plaza y no se vuelve a activar', () => {
  const s = ready(); activate(s, 'mew'); noteIndicio(s, 'mew', 'ruta_1'); submitHypothesis(s, 'mew', expedition('mew').place);
  assert.equal(markHallazgo(s, 'mew'), true);
  assert.deepEqual(activeExpeditions(s), []);
  assert.equal(phase(s, 'mew'), 'hallazgo');
  assert.equal(activate(s, 'mew'), 'done');
  assert.equal(markHallazgo(s, 'mew'), false);
});
test('B24: las oleadas dependen de Hallazgos y no de rumores o vistos', () => {
  const s = ready(); assert.equal(availableWave(s), 1);
  const ids = EXPEDITIONS.map((e) => e.id);
  for (let n = 0; n < 12; n++) { s.setFlag('dlc2_' + ids[n] + '_hallazgo'); assert.equal(availableWave(s), n >= 11 ? 4 : n >= 6 ? 3 : n >= 2 ? 2 : 1); }
});
test('B24: los IDs locales corruptos nunca acceden a propiedades o flags arbitrarios', () => {
  const s = ready();
  for (const id of ['__proto__', 'constructor', '../../mew', null, {}, 4]) {
    assert.equal(expedition(id), null); assert.equal(activate(s, id), 'unknown'); assert.equal(noteIndicio(s, id, 'ruta_1'), false);
  }
});
test('B24: la lista activa de un guardado corrupto se normaliza sin añadir progresión', () => {
  const s = ready(); s.setVar('dlc2_activas', ['mew', null, '__proto__', 'mew', 'celebi', 'jirachi', 'manaphy']);
  assert.deepEqual(activeExpeditions(s), ['mew', 'celebi', 'jirachi']);
  s.setVar('dlc2_activas', 'mew'); assert.deepEqual(activeExpeditions(s), []);
});
test('B24: progresión persiste al serializar y cargar', () => {
  const s = ready(); activate(s, 'mew'); noteIndicio(s, 'mew', 'ruta_1'); submitHypothesis(s, 'mew', expedition('mew').place);
  const loaded = new GameState(JSON.parse(JSON.stringify(s.data)));
  assert.deepEqual(activeExpeditions(loaded), ['mew']); assert.equal(phase(loaded, 'mew'), 'indicio'); assert.ok(loaded.flag('dlc2_mew_confirmada'));
});
