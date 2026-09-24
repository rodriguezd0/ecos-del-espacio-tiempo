// Integración del guardado: ranuras en localStorage (simulado), resumen de ranuras, migración de
// versiones antiguas, importación de archivo y tiempo de juego.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  GameState, SaveSystem, migrate, newGameData, SAVE_VERSION, BOX_COUNT, BOX_SIZE, PARTY_MAX,
} from '../game/src/core/state.js';

/** localStorage mínimo en memoria (el SaveSystem lo consulta en cada llamada). */
function installMemoryStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
  };
  return store;
}

const mon = (species, level = 5, hp = 20) => ({ uid: `${species}-${level}`, species, level, hp, moves: [{ id: 'TACKLE', pp: 35, ppUps: 0 }] });

let store;
beforeEach(() => { store = installMemoryStorage(); });

test('guardar y cargar conserva mapa, posición, equipo, cajas, mochila, flags, reloj y tiempo de juego', () => {
  const st = GameState.create({ name: 'Nora', gender: 'F', playerId: 1234 });
  st.setPosition('dev_test', 12, 19, 8);
  st.addPokemon(mon('PIKACHU', 8));
  st.addPokemon(mon('PIDGEY', 3));
  st.depositPokemon(1, 2);
  st.addItem('POTION', 3);
  st.addKeyItem('CLUENOTEBOOK');
  st.setFlag('b01_prueba');
  st.setVar('contador', 4);
  st.advanceMinutes(75);
  st.tickPlayTime(600);
  st.setOption('textSpeed', 3);
  st.setHealPoint('dev_test_casa', 5, 6, 2);
  st.startRepel('REPEL', 100);
  st.renameBox(2, 'Viajeros');
  SaveSystem.save(1, st);

  const loaded = SaveSystem.load(1);
  assert.ok(loaded instanceof GameState);
  assert.deepEqual(
    { map: loaded.player.mapId, x: loaded.player.x, y: loaded.player.y, dir: loaded.player.dir },
    { map: 'dev_test', x: 12, y: 19, dir: 8 },
  );
  assert.deepEqual(loaded.party.map((p) => p.species), ['PIKACHU']);
  assert.equal(loaded.boxPokemon(2, 0).species, 'PIDGEY');
  assert.equal(loaded.boxName(2), 'Viajeros');
  assert.equal(loaded.itemCount('POTION'), 3);
  assert.ok(loaded.hasKeyItem('CLUENOTEBOOK'));
  assert.ok(loaded.flag('b01_prueba'));
  assert.equal(loaded.var('contador'), 4);
  assert.equal(loaded.data.clock.minutes, st.data.clock.minutes);
  assert.equal(loaded.playTimeFrames, 600);
  assert.equal(loaded.options.textSpeed, 3);
  assert.deepEqual(loaded.healPoint, { mapId: 'dev_test_casa', x: 5, y: 6, dir: 2 });
  assert.equal(loaded.repelSteps, 100);
  assert.equal(loaded.data.version, SAVE_VERSION);
  assert.ok(loaded.data.savedAt > 0);
});

test('la lista de ranuras resume las partidas, deja vacías a null y marca las dañadas', () => {
  const st = GameState.create({ name: 'Leo' });
  st.setPosition('dev_test', 1, 1);
  st.addPokemon(mon('EEVEE', 5));
  st.tickPlayTime(3600);
  SaveSystem.save(2, st);
  store.set('ecos.save.3', '{roto');
  const list = SaveSystem.list();
  assert.equal(list.length, 3);
  assert.equal(list[0], null);
  assert.equal(list[1].name, 'Leo');
  assert.equal(list[1].mapId, 'dev_test');
  assert.equal(list[1].playTimeFrames, 3600);
  assert.deepEqual(list[1].party.map((p) => p.species), ['EEVEE']);
  assert.equal(list[1].dexCaught, 1);
  assert.deepEqual(list[2], { slot: 3, corrupt: true });
  assert.throws(() => SaveSystem.load(3), /dañados/);
  assert.equal(SaveSystem.load(1), null);
  SaveSystem.remove(2);
  assert.equal(SaveSystem.list()[1], null);
});

test('ranura fuera de rango da un error claro', () => {
  const st = GameState.create();
  assert.throws(() => SaveSystem.save(0, st), /Ranura de guardado inválida/);
  assert.throws(() => SaveSystem.load(4), /Ranura de guardado inválida/);
});

test('migrate: un guardado v1 se convierte a la versión actual sin perder datos', () => {
  const v1 = {
    version: 1,
    createdAt: 111,
    playTimeFrames: 42,
    player: { name: 'Axis', gender: 'M', id: 7, money: 500, mapId: 'villa_alba', x: 3, y: 4, dir: 6 },
    flags: { b01_intro: true },
    vars: { repelSteps: 37, otra: 1 },
    selfSwitches: {},
    party: [mon('TURTWIG', 5)],
    boxes: [[null, mon('BIDOOF', 2)]], // solo una caja incompleta
    bag: { POTION: 1 },
    dex: { seen: { TURTWIG: true }, caught: { TURTWIG: true } }, // sin `obtained`
    zygarde: { cells: ['c1'] }, // sin cores/abilities
    options: { textSpeed: 0 }, // sin el resto de opciones
    clock: { minutes: 600 },
  };
  const frozen = JSON.stringify(v1);
  const m = migrate(v1);
  assert.equal(JSON.stringify(v1), frozen, 'migrate no modifica el original');
  assert.equal(m.version, SAVE_VERSION);
  assert.equal(m.createdAt, 111);
  assert.equal(m.playTimeFrames, 42);
  assert.deepEqual(m.player, v1.player);
  assert.equal(m.boxes.length, BOX_COUNT);
  assert.ok(m.boxes.every((b) => b.length === BOX_SIZE));
  assert.equal(m.boxes[0][1].species, 'BIDOOF');
  assert.equal(m.boxNames.length, BOX_COUNT);
  assert.equal(m.boxNames[0], 'Caja 1');
  assert.deepEqual(m.repel, { steps: 37, item: null }, 'el repelente pasa de vars a su campo');
  assert.equal(m.vars.repelSteps, undefined);
  assert.equal(m.vars.otra, 1);
  assert.equal(m.dex.obtained, false);
  assert.deepEqual(m.zygarde.cores, []);
  assert.deepEqual(m.zygarde.abilities, {});
  assert.deepEqual(m.zygarde.cells, ['c1']);
  assert.equal(m.options.textSpeed, 0);
  assert.equal(m.options.bgmVolume, 0.7);
  assert.deepEqual(m.clues, []);
  assert.equal(m.lastHeal, null);
  const st = new GameState(m);
  assert.equal(st.repelSteps, 37);
  assert.equal(st.boxName(5), 'Caja 6');
});

test('migrate: equipo de más de 6 pasa el sobrante a las cajas; datos que no son partida se rechazan', () => {
  const party = Array.from({ length: 8 }, (_, i) => mon(`MON${i}`));
  const m = migrate({ player: { name: 'X' }, party });
  assert.equal(m.party.length, PARTY_MAX);
  assert.deepEqual(m.boxes[0].slice(0, 2).map((p) => p.species), ['MON6', 'MON7']);
  assert.throws(() => migrate(null), /partida/);
  assert.throws(() => migrate({ party: [] }), /partida/);
});

test('migrate es idempotente sobre una partida nueva serializada', () => {
  const fresh = newGameData({ name: 'Ada', gender: 'F', playerId: 99 });
  const once = migrate(JSON.parse(JSON.stringify(fresh)));
  assert.deepEqual(once, fresh);
  assert.deepEqual(migrate(JSON.parse(JSON.stringify(once))), once);
});

test('importFile valida el archivo y migra la partida', async () => {
  const good = new Blob([JSON.stringify({ player: { name: 'Imp' }, party: [] })]);
  const st = await SaveSystem.importFile(good);
  assert.equal(st.player.name, 'Imp');
  assert.equal(st.data.version, SAVE_VERSION);
  await assert.rejects(() => SaveSystem.importFile(new Blob(['no es json'])), /no es una partida/);
  await assert.rejects(() => SaveSystem.importFile(new Blob(['{"a":1}'])), /no es una partida/);
});

test('sin localStorage el guardado falla con un mensaje claro', () => {
  delete globalThis.localStorage;
  assert.throws(() => SaveSystem.save(1, GameState.create()), /almacenamiento/);
});
