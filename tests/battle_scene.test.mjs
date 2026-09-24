// Tests de la lógica pura de la escena de combate (battle/scene): configuración, resultados, geometría,
// cámara, planificador de animaciones, clasificación de movimientos, barras y piloto automático.
import test from 'node:test';
import assert from 'node:assert/strict';
import { db, mon } from './battle_helpers.mjs';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';
import { GameState } from '../game/src/core/state.js';
import {
  buildBattleConfig, battleWeather, battleTerrain, resolveBackdrop, resolveTrainer, storageFull, battleBgmFor, pokemonFromSpec,
} from '../game/src/battle/scene/setup.js';
import { syncBag, applyBattleResult, storeCaught, storedMessage } from '../game/src/battle/scene/results.js';
import {
  battlerPosition, trainerPosition, dataBoxLayout, targetButtons, gridMove, shadowPlacement, spriteOffset, spriteFrameTicks,
  spriteScale, speciesMetrics,
} from '../game/src/battle/scene/layout.js';
import { layerTransform, worldToScreen, BattleCamera } from '../game/src/battle/scene/camera.js';
import { Tasks, Ease } from '../game/src/battle/scene/timeline.js';
import { classifyMove, moveSoundKey, buildMoveSoundIndex, TYPE_FX } from '../game/src/battle/scene/moveStyle.js';
import { hpColorZone, hpBarWidth, hpAnimFrames, expFraction, expAnimFrames } from '../game/src/battle/scene/hud/bars.js';
import { Autopilot } from '../game/src/battle/scene/autopilot.js';
import { battle, battleBGM } from '../game/src/battle/api.js';

const GAEL_LIKE = {
  name: 'Gael', class: 'Rival', sprite: 'gael_front', ai: 16, money: 40, bgm: 'battle_rival', canLose: true,
  loseText: '…Vale.', party: [{ species: 'SQUIRTLE', level: 5 }],
};

// ---------------------------------------------------------------- setup.js
test('battleWeather traduce el clima del mapa y respeta el del motor', () => {
  assert.equal(battleWeather('rain'), 'Rain');
  assert.equal(battleWeather('storm'), 'Rain');
  assert.equal(battleWeather('snow'), 'Hail');
  assert.equal(battleWeather('sandstorm'), 'Sandstorm');
  assert.equal(battleWeather('sun'), 'Sun');
  assert.equal(battleWeather('fog'), 'None');
  assert.equal(battleWeather(null), 'None');
  assert.equal(battleWeather('HarshSun'), 'HarshSun');
  assert.equal(battleTerrain('Grassy'), 'Grassy');
  assert.equal(battleTerrain('lava'), 'None');
});

test('resolveBackdrop usa alias, entorno, agua y hora', () => {
  assert.equal(resolveBackdrop({ battleback: 'field' }).name, 'Pradera');
  assert.equal(resolveBackdrop({ battleback: 'indoor' }).name, 'Interior');
  assert.equal(resolveBackdrop({ battleback: 'Laboratorio' }).name, 'Laboratorio');
  assert.equal(resolveBackdrop({ environment: 'MovingWater' }).name, 'water');
  assert.equal(resolveBackdrop({ battleback: 'cave', environment: 'StillWater' }).name, 'water_cueva');
  assert.equal(resolveBackdrop({ environment: 'Sand' }).name, 'Playa');
  assert.equal(resolveBackdrop({}).name, 'Pradera');
  assert.equal(resolveBackdrop({ battleback: 'desert' }).file, 'Graphics/Battlebacks/Desierto_bg.jpg');
  assert.equal(resolveBackdrop({ time: 'night' }).night, true);
});

test('resolveTrainer crea el rival del motor con clase, IA, dinero y datos de presentación', () => {
  const r = resolveTrainer(GAEL_LIKE, db, 'gael_test');
  assert.equal(r.opponent.name, 'Gael');
  assert.equal(r.opponent.trainerType, 'AXIS:gael_test');
  assert.equal(r.opponent.skill, 16);
  assert.equal(r.opponent.party[0].species, 'SQUIRTLE');
  assert.equal(r.opponent.party[0].level, 5);
  assert.equal(r.trainerType['AXIS:gael_test'].name, 'Rival');
  assert.equal(r.meta.bgm, 'battle_rival');
  assert.equal(r.meta.canLose, true);
  assert.throws(() => resolveTrainer({ name: 'X', party: [] }, db, 'x'), /no tiene Pokémon/);
  assert.throws(() => pokemonFromSpec(db, { species: 'NOEXISTE', level: 3 }), /Especie desconocida/);
});

test('buildBattleConfig resuelve entrenadores por id y el combate anuncia "Rival Gael"', async () => {
  const state = GameState.create({ name: 'Axis' });
  state.setParty([mon('BULBASAUR', 6, ['TACKLE'])]);
  const { config, meta } = buildBattleConfig(
    { type: 'trainer', trainer: 'gael_test', weather: 'rain', battleback: 'field', player: { name: 'Axis', party: state.party, bag: {} } },
    { db, state, getTrainer: (id) => ({ id, ...GAEL_LIKE }) },
  );
  assert.equal(config.type, 'trainer');
  assert.equal(config.weather, 'Rain');
  assert.equal(config.rules.canLose, true);
  assert.equal(config.rules.canRun, false);
  assert.equal(meta.trainerSprites[0], 'gael_front');
  assert.equal(meta.bgm, 'battle_rival');
  assert.equal(meta.backdrop.name, 'Pradera');
  const ui = new HeadlessBattleUI();
  const result = await new Battle({ ...config, rng: () => 0.5 }, ui).run();
  assert.ok(ui.messages[0].includes('Rival Gael te desafía'), ui.messages[0]);
  assert.ok(['win', 'lose'].includes(result.outcome));
});

test('buildBattleConfig: Mega Aro solo con objeto clave, PC lleno y formato del entrenador', () => {
  const state = GameState.create({ name: 'Axis' });
  state.setParty(Array.from({ length: 6 }, () => mon('RATTATA', 5, ['TACKLE'])));
  state.setBoxes(state.boxes.map((box) => box.map(() => mon('PIDGEY', 2, ['TACKLE']))));
  assert.equal(storageFull(state), true);
  const { config } = buildBattleConfig({ type: 'wild', opponent: { party: [{ species: 'PIDGEY', level: 3 }] } }, { db, state });
  assert.equal(config.rules.storageFull, true);
  assert.equal(config.player.megaRing, false);
  assert.equal(config.opponent.party[0].species, 'PIDGEY');
  state.addKeyItem('MEGARING');
  assert.equal(buildBattleConfig({ opponent: { party: [{ species: 'PIDGEY', level: 3 }] } }, { db, state }).config.player.megaRing, true);
  const dbl = buildBattleConfig({ trainer: { ...GAEL_LIKE, format: 'double', party: [{ species: 'PIDGEY', level: 3 }, { species: 'ZUBAT', level: 3 }] } }, { db, state });
  assert.equal(dbl.config.format, 'double');
  assert.throws(() => buildBattleConfig({}, {}), /falta la base de datos/);
});

test('battleBgmFor y battleBGM: música explícita, del entrenador o genérica', () => {
  assert.equal(battleBgmFor({ type: 'wild' }), 'battle_wild');
  assert.equal(battleBgmFor({ trainer: 'x' }), 'battle_trainer');
  assert.equal(battleBgmFor({ trainer: 'x' }, { bgm: 'battle_rival' }), 'battle_rival');
  assert.equal(battleBgmFor({ type: 'wild', bgm: 'battle_legendary' }), 'battle_legendary');
  assert.equal(battleBgmFor({ type: 'trainer', bgm: 'Entrenador' }, { bgm: 'battle_rival' }), 'battle_rival');
  assert.equal(battleBGM({ type: 'wild' }), 'battle_wild');
  assert.equal(battleBGM({ trainer: { bgm: 'battle_boss' } }), 'battle_boss');
});

test('battle() sin DOM simula el combate con el motor y devuelve el equipo', async () => {
  const party = [mon('PIKACHU', 30, ['THUNDERSHOCK'])];
  const r = await battle({ db, seed: 7, type: 'wild', player: { name: 'Axis', party, bag: {} }, opponent: { party: [mon('MAGIKARP', 2, ['SPLASH'])] } });
  assert.equal(r.outcome, 'win');
  assert.equal(r.party.length, 1);
  assert.notEqual(r.party[0], party[0], 'el equipo devuelto es una copia');
  const info = console.info;
  console.info = () => {};
  const stub = await battle({ type: 'wild', player: { party } });
  console.info = info;
  assert.equal(stub.outcome, 'win', 'sin base de datos se conserva el comportamiento del stub');
  assert.equal(stub.party.length, 1);
});

// ---------------------------------------------------------------- results.js
test('syncBag iguala la mochila con addItem/removeItem', () => {
  const s = GameState.create({ name: 'Axis' });
  s.addItem('POTION', 5);
  s.addItem('POKEBALL', 3);
  syncBag(s, { POTION: 2, GREATBALL: 1 });
  assert.equal(s.itemCount('POTION'), 2);
  assert.equal(s.itemCount('POKEBALL'), 0);
  assert.equal(s.itemCount('GREATBALL'), 1);
});

test('applyBattleResult aplica equipo, dinero, mochila y vistos; storeCaught va a equipo o caja', () => {
  const s = GameState.create({ name: 'Axis' });
  s.setParty([mon('PIKACHU', 8, ['TACKLE'])]);
  s.addItem('POKEBALL', 5);
  const newParty = [{ ...s.party[0], hp: 3 }];
  const r = applyBattleResult(s, { playerParty: newParty, moneyChange: -120, bag: { POKEBALL: 4 }, seen: ['ZUBAT'] });
  assert.equal(r.moneyChange, -120);
  assert.equal(s.player.money, 3000 - 120);
  assert.equal(s.party[0].hp, 3);
  assert.equal(s.itemCount('POKEBALL'), 4);
  assert.equal(s.data.dex.seen.ZUBAT, true);
  const st = storeCaught(s, mon('CATERPIE', 3, ['TACKLE']));
  assert.equal(st.where, 'party');
  assert.equal(s.data.dex.caught.CATERPIE, true);
  s.setParty(Array.from({ length: 6 }, () => mon('RATTATA', 5, ['TACKLE'])));
  const boxed = storeCaught(s, mon('ZUBAT', 3, ['TACKLE']));
  assert.equal(boxed.where, 'box');
  assert.equal(boxed.box, 0);
  assert.match(storedMessage('Zubat', boxed), /enviado al PC/);
  assert.match(storedMessage('Zubat', { where: 'party' }), /unido a tu equipo/);
});

// ---------------------------------------------------------------- layout.js
test('posiciones de combatientes, entrenadores y cajas como en Añil', () => {
  assert.deepEqual(battlerPosition(0, 1), { x: 128, y: 304 });
  assert.deepEqual(battlerPosition(1, 1), { x: 384, y: 176 });
  assert.deepEqual(battlerPosition(2, 2), { x: 160, y: 320 });
  assert.deepEqual(battlerPosition(3, 2), { x: 352, y: 160 });
  assert.deepEqual(trainerPosition(0), { x: 128, y: 388 });
  assert.deepEqual(trainerPosition(1), { x: 384, y: 164 });
  const p = dataBoxLayout(0, 1);
  assert.equal(p.x, 268);
  assert.equal(p.showNumbers, true);
  assert.equal(p.showExp, true);
  const f = dataBoxLayout(1, 1);
  assert.equal(f.showPercent, true);
  assert.equal(dataBoxLayout(2, 2).thin, true);
  assert.equal(dataBoxLayout(2, 2).showExp, false);
  assert.equal(spriteScale(0), 3);
  assert.equal(spriteScale(1), 2);
});

test('métricas: desplazamiento, sombra y velocidad de animación', () => {
  const m = speciesMetrics(db, 'PIKACHU', 0);
  assert.deepEqual(spriteOffset(m, 0), { dx: m.back[0] * 2, dy: m.back[1] * 2 });
  assert.deepEqual(spriteOffset({ front: [3, 4], altitude: 5 }, 1), { dx: 6, dy: -2 });
  const sh = shadowPlacement({ front: [0, 2], shadow: [1, 0, 3], shadowSize: 3 }, 1, 100);
  assert.equal(sh.visible, true);
  assert.equal(sh.dx, 2);
  assert.equal(sh.dy, 4 + 6 - 5);
  assert.ok(Math.abs(sh.zoomX - 1.2) < 1e-9);
  assert.equal(shadowPlacement({ shadowSize: 0 }, 1, 100).visible, false);
  assert.equal(spriteFrameTicks({ animSpeed: 2 }), 4);
  assert.equal(spriteFrameTicks({ animSpeed: 0 }), 0);
  assert.equal(spriteFrameTicks({}), 4);
});

test('menús: rejilla 2×2 y botones de objetivo en dobles', () => {
  assert.equal(gridMove(0, 'RIGHT'), 1);
  assert.equal(gridMove(1, 'RIGHT'), 1);
  assert.equal(gridMove(0, 'DOWN'), 2);
  assert.equal(gridMove(3, 'UP'), 1);
  assert.equal(gridMove(0, 'DOWN', (i) => i < 2), 0);
  const b = targetButtons([2, 2]);
  assert.deepEqual(b.map((x) => x.index).sort(), [0, 1, 2, 3]);
  const foe = b.filter((x) => x.index % 2 === 1);
  assert.ok(foe.every((x) => x.y < b.find((y) => y.index === 0).y), 'los rivales van arriba');
  assert.equal(targetButtons([1, 1]).length, 2);
});

// ---------------------------------------------------------------- camera.js
test('cámara: transformación de capa, paralaje e interpolación', () => {
  const def = { x: 256, y: 192, zoom: 1 };
  assert.deepEqual(layerTransform(def, 1), { scale: 1, tx: 0, ty: 0 });
  const z = { x: 384, y: 150, zoom: 1.4 };
  const p = worldToScreen(z, 384, 150);
  assert.ok(Math.abs(p.x - 256) < 1e-9 && Math.abs(p.y - 192) < 1e-9, 'el centro del encuadre queda en el centro');
  assert.ok(layerTransform(z, 0.5).scale < layerTransform(z, 1).scale, 'el fondo se amplía menos');
  const cam = new BattleCamera();
  cam.to('focusFoe', 0.5);
  for (let i = 0; i < 60; i++) cam.update();
  assert.equal(cam.settled, true);
  cam.shake(8, 10);
  cam.update();
  assert.ok(Math.abs(cam.offset.x) + Math.abs(cam.offset.y) > 0);
});

// ---------------------------------------------------------------- timeline.js
test('Tasks: esperas, interpolaciones y errores aislados', async () => {
  const t = new Tasks();
  let v = 0;
  let done = false;
  const tw = t.tween(4, (k) => { v = k; }, Ease.linear).then(() => { done = true; });
  const bad = t.add(() => { throw new Error('fallo de prueba'); });
  const orig = console.error;
  console.error = () => {};
  for (let i = 0; i < 3; i++) t.update();
  console.error = orig;
  await bad;
  assert.equal(done, false);
  t.update();
  await tw;
  assert.equal(v, 1);
  assert.equal(t.busy, false);
  const w = t.wait(2);
  t.update(); t.update();
  await w;
  assert.equal(Ease.outBack(1), 1);
});

// ---------------------------------------------------------------- moveStyle.js
test('classifyMove elige estilos coherentes', () => {
  const m = (id) => ({ ...db.moves[id] });
  assert.equal(classifyMove(m('TACKLE')).style, 'contact');
  assert.equal(classifyMove(m('EMBER')).style, 'projectile');
  assert.equal(classifyMove(m('EARTHQUAKE')).style, 'quake');
  assert.equal(classifyMove(m('GROWL')).style, 'sound');
  assert.equal(classifyMove(m('SWORDSDANCE')).style, 'self');
  assert.equal(classifyMove(m('PROTECT')).style, 'protect');
  assert.equal(classifyMove(m('RECOVER')).style, 'heal');
  assert.equal(classifyMove(m('THUNDERWAVE')).style, 'status');
  assert.equal(classifyMove(m('ROCKSLIDE')).style, 'rain');
  assert.equal(classifyMove(m('SURF')).style, 'wave');
  assert.equal(classifyMove(m('HYPERBEAM')).style, 'beam');
  assert.equal(classifyMove({ type: 'NOPE', category: 'Physical' }).type, 'NORMAL');
  for (const t of Object.keys(db.types)) assert.ok(TYPE_FX[t], `paleta para ${t}`);
});

test('índice de sonidos PRSFX por movimiento', () => {
  assert.equal(moveSoundKey('PRSFX- Air Cutter1'), 'AIRCUTTER');
  assert.equal(moveSoundKey("PRSFX- King's Shield2"), 'KINGSSHIELD');
  assert.equal(moveSoundKey('PRSFX- U-Turn'), 'UTURN');
  const idx = buildMoveSoundIndex(['PRSFX- Tackle', 'PRSFX- Air Cutter1', 'PRSFX- Air Cutter2', 'GUI sel cursor']);
  assert.equal(idx.get('TACKLE'), 'PRSFX- Tackle');
  assert.equal(idx.get('AIRCUTTER'), 'PRSFX- Air Cutter1');
  assert.equal(idx.has('GUISELCURSOR'), false);
});

// ---------------------------------------------------------------- hud/bars.js
test('barras de PS y EXP', () => {
  assert.equal(hpColorZone(100, 100), 0);
  assert.equal(hpColorZone(50, 100), 1);
  assert.equal(hpColorZone(25, 100), 2);
  assert.equal(hpBarWidth(0, 100), 0);
  assert.equal(hpBarWidth(1, 400), 2);
  assert.equal(hpBarWidth(100, 100), 96);
  assert.equal(hpAnimFrames(100, 0, 100), 60);
  assert.equal(hpAnimFrames(100, 99, 100), 12);
  assert.equal(expFraction(150, 100, 200), 0.5);
  assert.equal(expFraction(250, 100, 200), 1);
  assert.equal(expAnimFrames(0, 1), 105);
});

// ---------------------------------------------------------------- autopilot.js
test('piloto automático: decisiones válidas', () => {
  const a = new Autopilot('ball');
  const bag = [{ id: 'POKEBALL', battleUse: 'OnFoe' }];
  assert.equal(a.action({}, { firstAction: true, wild: true }, bag), 'bag');
  assert.equal(a.action({}, { firstAction: true, wild: false }, bag), 'fight');
  assert.deepEqual(a.item({ partyIndex: 0 }, { bag }), { item: 'POKEBALL', target: 0, move: -1 });
  const f = new Autopilot('1');
  const moves = [{ index: 0, category: 'Status', selectable: true }, { index: 1, category: 'Physical', selectable: true }];
  assert.deepEqual(f.move({}, moves, {}), { index: 1, mega: false });
  assert.equal(f.target({ side: 0 }, [{ index: 2, battler: { side: 0 } }, { index: 3, battler: { side: 1 } }]), 3);
  const party = [{ partyIndex: 0, able: false, active: true }, { partyIndex: 1, able: true, active: false }];
  assert.equal(f.switchTo({ reason: 'replace', canCancel: false, party }), 1);
  assert.equal(f.switchTo({ reason: 'command', canCancel: true, party }), -1);
  assert.equal(new Autopilot('run').action({}, { firstAction: true }), 'run');
});
