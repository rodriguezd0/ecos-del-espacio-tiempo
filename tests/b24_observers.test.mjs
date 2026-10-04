import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { activate } from '../game/src/content/events/b24_registry.js';
import { observeStep, observeBattle } from '../game/src/content/events/b24_observers.js';
const ready = (id) => {
  const s = GameState.create({ name: 'Axis' }); for (const f of ['game_cleared', 'b21_fin', 'dlc2_registro_abierto']) s.setFlag(f);
  // Oleada 3 sin completar la expedición bajo prueba.
  for (const e of ['mew','jirachi','manaphy','phione','shaymin','victini','cobalion']) s.setFlag('dlc2_' + e + '_hallazgo');
  assert.equal(activate(s, id), 'ok'); return s;
};
const step = (s, mapId = 'ruta_14_reserva', extra = {}) => observeStep(s, { mapId, x: 10, y: 10, running: false, mounted: false, ...extra });
const battle = (s, outcome, extra = {}) => observeBattle(s, { mapId: 'sima_eje', type: 'wild', outcome, opponentSpecies: ['ZUBAT'], ...extra });
test('B24: 300 pasos reales de Reserva, sin contar pasos ajenos', () => {
  const s = ready('xerneas'); for (let i = 0; i < 50; i++) step(s, 'ruta_1'); assert.equal(s.var('dlc2_xerneas_pasos', 0), 0);
  for (let i = 0; i < 300; i++) step(s); assert.equal(s.var('dlc2_xerneas_pasos'), 300);
});
test('B24: un KO salvaje rompe el paseo de Xerneas; capturar y huir lo conservan', () => {
  const s = ready('xerneas'); for (let i = 0; i < 7; i++) step(s);
  battle(s, 'caught'); battle(s, 'run'); assert.equal(s.var('dlc2_xerneas_pasos'), 7);
  battle(s, 'win', { mapId: 'ruta_1' }); assert.equal(s.var('dlc2_xerneas_pasos'), 0);
});
test('B24: diez victorias salvajes de la Sima, sin contar entrenadores ni otras zonas', () => {
  const s = ready('yveltal'); battle(s, 'win', { type: 'trainer' }); battle(s, 'win', { mapId: 'ruta_1' });
  assert.equal(s.var('dlc2_yveltal_racha', 0), 0);
  for (let i = 0; i < 10; i++) battle(s, 'win'); assert.equal(s.var('dlc2_yveltal_racha'), 10);
});
for (const outcome of ['caught', 'run', 'lose', 'forfeit']) test('B24: ' + outcome + ' rompe la racha salvaje de la Sima', () => {
  const s = ready('yveltal'); battle(s, 'win'); battle(s, outcome); assert.equal(s.var('dlc2_yveltal_racha'), 0);
});
test('B24: sigilo requiere pasos andando y desmontado; correr/montar lo reinicia', () => {
  const s = ready('celebi');
  for (let i = 0; i < 8; i++) step(s, 'b24_santuario_neblino'); assert.equal(s.var('dlc2_celebi_sigilo'), 8);
  step(s, 'b24_santuario_neblino', { running: true }); assert.equal(s.var('dlc2_celebi_sigilo'), 0);
  step(s, 'b24_santuario_neblino', { mounted: true }); assert.equal(s.var('dlc2_celebi_sigilo'), 0);
});
test('B24: el mecanismo de Agua se apaga al paso 20, también tras guardar', () => {
  let s = ready('volcanion'); s.setVar('dlc2_volcanion_agua_pasos', 20);
  for (let i = 0; i < 19; i++) step(s, 'b24_termas_tizon'); assert.equal(s.var('dlc2_volcanion_agua_pasos'), 1);
  s = new GameState(JSON.parse(JSON.stringify(s.data))); step(s, 'b24_termas_tizon'); assert.equal(s.var('dlc2_volcanion_agua_pasos'), 0);
});
test('B24: antes del Registro y en expediciones pausadas, los observadores no escriben progreso', () => {
  const s = GameState.create({ name: 'Axis' }); const before = JSON.stringify(s.data);
  step(s); battle(s, 'win'); assert.equal(JSON.stringify(s.data), before);
  const r = ready('xerneas'); r.setVar('dlc2_activas', []); const paused = JSON.stringify(r.data); step(r); battle(r, 'win'); assert.equal(JSON.stringify(r.data), paused);
});
test('B24: datos corruptos de observadores no añaden pasos ni victorias', () => {
  const s = ready('xerneas');
  for (const v of [null, {}, { mapId: 3 }, { mapId: 'ruta_14_reserva', x: NaN, y: 10 }]) observeStep(s, v);
  assert.equal(s.var('dlc2_xerneas_pasos', 0), 0);
});
