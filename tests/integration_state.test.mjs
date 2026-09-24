// API de GameState usada por la UI y los guiones: cajas del PC, opciones, objetos clave, Pokédex,
// repelente, pistas, punto de cura y tiempo de juego.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState, PARTY_MAX, BOX_SIZE, POKEDEX_ITEM } from '../game/src/core/state.js';

const mon = (species, hp = 20, level = 5) => ({ uid: species, species, level, hp });

function stateWith(...species) {
  const st = GameState.create({ name: 'Prueba' });
  for (const s of species) st.addPokemon(mon(s));
  return st;
}

test('cajas: depositar, retirar, mover e intercambiar mantienen el equipo compacto', () => {
  const st = stateWith('A', 'B', 'C');
  const partyBefore = st.party;
  assert.deepEqual(st.depositPokemon(1, 3), { box: 3, slot: 0 });
  assert.deepEqual(st.party.map((p) => p.species), ['A', 'C']);
  assert.deepEqual(partyBefore.map((p) => p.species), ['A', 'B', 'C'], 'el array anterior no se muta');
  assert.equal(st.boxPokemon(3, 0).species, 'B');

  st.movePokemon({ box: 3, slot: 0 }, { box: 0, slot: 29 });
  assert.equal(st.boxPokemon(3, 0), null);
  assert.equal(st.boxPokemon(0, 29).species, 'B');

  st.movePokemon({ party: 0 }, { box: 0, slot: 29 }); // intercambio equipo ↔ caja
  assert.deepEqual(st.party.map((p) => p.species), ['B', 'C']);
  assert.equal(st.boxPokemon(0, 29).species, 'A');

  st.movePokemon({ box: 0, slot: 29 }, { party: 6 }); // al final del equipo
  assert.deepEqual(st.party.map((p) => p.species), ['B', 'C', 'A']);
  assert.equal(st.boxPokemon(0, 29), null);

  assert.equal(st.withdrawPokemon !== undefined, true);
  st.depositPokemon(2, 0);
  assert.equal(st.withdrawPokemon(0, 0), 2);
  assert.equal(st.party[2].species, 'A');
});

test('cajas: los errores protegen el último Pokémon y el equipo lleno', () => {
  const st = stateWith('SOLO');
  assert.throws(() => st.depositPokemon(0), /último/);
  assert.throws(() => st.releasePokemon({ party: 0 }), /último/);
  assert.throws(() => st.movePokemon({ party: 0 }, { box: 0, slot: 0 }), /último/);
  const full = stateWith('1', '2', '3', '4', '5', '6', '7');
  assert.equal(full.party.length, PARTY_MAX);
  assert.equal(full.boxPokemon(0, 0).species, '7', 'addPokemon con equipo lleno va a la caja');
  assert.throws(() => full.withdrawPokemon(0, 0), /completo/);
  assert.throws(() => full.movePokemon({ box: 0, slot: 1 }, { party: 0 }), /ningún Pokémon/);
  assert.throws(() => full.movePokemon({ party: 0 }, { foo: 1 }), /referencia/);
  assert.throws(() => full.withdrawPokemon(99, 0), /inexistente/);
});

test('cajas: un debilitado no cuenta como último Pokémon capaz', () => {
  const st = GameState.create();
  st.addPokemon(mon('VIVO', 10));
  st.addPokemon(mon('KO', 0));
  assert.throws(() => st.movePokemon({ party: 0 }, { box: 0, slot: 0 }), /último/);
  st.depositPokemon(1);
  assert.deepEqual(st.party.map((p) => p.species), ['VIVO']);
});

test('cajas: renombrar, liberar y sustituir todas las cajas', () => {
  const st = stateWith('A', 'B');
  st.renameBox(0, '  Favoritos  ');
  assert.equal(st.boxName(0), 'Favoritos');
  st.renameBox(1, 'Un nombre larguísimo de caja');
  assert.equal(st.boxName(1).length, 12);
  assert.throws(() => st.renameBox(0, '   '), /vacío/);
  assert.throws(() => st.renameBox(-1, 'x'), /inexistente/);
  st.depositPokemon(1, 4);
  assert.equal(st.releasePokemon({ box: 4, slot: 0 }).species, 'B');
  assert.equal(st.boxPokemon(4, 0), null);
  assert.throws(() => st.releasePokemon({ box: 4, slot: 0 }), /ningún Pokémon/);
  st.setBoxes([[mon('Z')]]);
  assert.equal(st.boxCount, 30);
  assert.equal(st.boxes[0].length, BOX_SIZE);
  assert.equal(st.boxPokemon(0, 0).species, 'Z');
  assert.throws(() => st.setBoxes('no'), /lista de cajas/);
  st.setBoxPokemon(2, 5, mon('Y'));
  assert.equal(st.boxPokemon(2, 5).species, 'Y');
});

test('opciones: setOption sustituye el objeto (inmutable) y valida la clave', () => {
  const st = GameState.create();
  const before = st.options;
  const after = st.setOption('encounterMode', 'visible');
  assert.notEqual(before, after);
  assert.equal(before.encounterMode, 'classic');
  assert.equal(st.options.encounterMode, 'visible');
  st.setOptions({ bgmVolume: 0.2, seVolume: 0.3 });
  assert.equal(st.options.bgmVolume, 0.2);
  assert.equal(st.options.encounterMode, 'visible');
  assert.throws(() => st.setOption('', 1), /clave/);
});

test('objetos clave y Pokédex', () => {
  const st = GameState.create();
  st.addKeyItem('CLUENOTEBOOK');
  st.addKeyItem('CLUENOTEBOOK');
  assert.equal(st.itemCount('CLUENOTEBOOK'), 1, 'no se acumulan');
  assert.ok(st.hasKeyItem('CLUENOTEBOOK'));
  st.registerItem('CLUENOTEBOOK');
  assert.equal(st.registeredItem, 'CLUENOTEBOOK');
  assert.ok(st.removeKeyItem('CLUENOTEBOOK'));
  assert.equal(st.removeKeyItem('CLUENOTEBOOK'), false);
  assert.equal(st.hasPokedex(), false);
  st.obtainPokedex();
  assert.ok(st.hasPokedex());
  assert.ok(st.hasKeyItem(POKEDEX_ITEM));
  const other = GameState.create();
  other.addItem(POKEDEX_ITEM); // entregada con ctx.giveItem también cuenta
  assert.ok(other.hasPokedex());
  assert.throws(() => other.addItem(''), /id/);
});

test('repelente: se activa una vez, cuenta pasos y avisa al agotarse', () => {
  const st = GameState.create();
  assert.equal(st.stepRepel(), false, 'sin repelente no hace nada');
  assert.ok(st.startRepel('REPEL', 2));
  assert.equal(st.startRepel('SUPERREPEL', 200), false, 'no se solapa');
  assert.equal(st.stepRepel(), false);
  assert.equal(st.repelSteps, 1);
  assert.equal(st.stepRepel(), true, 'agotado en este paso');
  assert.equal(st.repelSteps, 0);
  assert.equal(st.repelItem, 'REPEL');
  assert.throws(() => st.startRepel('REPEL', 0), /pasos/);
});

test('pistas, punto de cura, dinero y tiempo de juego', () => {
  const st = GameState.create();
  assert.ok(st.addClue('p1', 'Texto de prueba.'));
  assert.equal(st.addClue('p1', 'Otro'), false);
  st.solveClue('p1');
  assert.deepEqual(st.clues, [{ id: 'p1', text: 'Texto de prueba.', solved: true }]);
  assert.throws(() => st.addClue('', 'x'), /faltan/);
  st.setHealPoint('casa', 3, 4);
  assert.deepEqual(st.healPoint, { mapId: 'casa', x: 3, y: 4, dir: 2 });
  assert.throws(() => st.setHealPoint('casa', 1.5, 2), /inválido/);
  st.addMoney(-1e9);
  assert.equal(st.player.money, 0);
  st.tickPlayTime();
  st.tickPlayTime(59);
  assert.equal(st.playTimeFrames, 60);
  assert.equal(st.data.playTimeFrames, 60);
});
