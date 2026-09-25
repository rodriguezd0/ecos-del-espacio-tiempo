// Bloque 17 — contenido y reglas puras (docs/CAMPANA.md B17; TABLILLAS T14; POKEDEX_DISTRIBUCION «Mesa de los Vientos»
// y «Sima del Eje»; BALANCE): danza del Círculo del Jardín, acertijo del sobre, torres del Anillo (variable para B20),
// entrenadores (niveles 58–62, dinero), tablas de encuentros, aterrizajes del Vuelo y enlaces con B18.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { CIRCLE_POINTS, DANCE_ORDER, raiseInOrder, raisedPoints, pointAt } from '../game/src/content/events/b17_circulo_logic.js';
import { villaAlbaLandings } from '../game/src/content/events/b17_circulo.js';
import { RIDDLE_QUESTIONS, RIDDLE, evaristoB17When } from '../game/src/content/events/b17_t14.js';
import { maybeAlerceCall, MIRADOR_HINT_NOTE } from '../game/src/content/events/b17_vigilia.js';
import { towerEvents, crateFlag } from '../game/src/content/events/b17_torres.js';
import { socketTiles } from '../game/src/content/maps/b17/rim.js';
import { TOWER_ROOMS, parseRoom, raise, decodeRaised, encodeRaised, LIMIT } from '../game/src/content/events/b17_torres_logic.js';
import { F, V, towersOff, occupied, vigilReady, gameDay } from '../game/src/content/events/b17_common.js';
import { chooseLanding } from '../game/src/world/zygarde/actions.js';
import TRAINERS from '../game/src/content/trainers/b17.js';
import { MESA_GRASS, SIMA_CAVE, HERD, CIRCLE_CLEFAIRY } from '../game/src/content/encounters/b17.js';
import { cellsOnMap } from '../game/src/content/zygarde/cells.js';
import { checkTrainerMoney } from '../game/src/content/trainerMoney.js';
import SPECIES from '../game/data/species.json' with { type: 'json' };
import { placeById, canFlyTo } from '../game/src/ui/logic/regionMapData.js';
import * as SENDA from '../game/src/content/maps/b17/senda_layout.js';
import * as MIR from '../game/src/content/maps/b17/mirador_layout.js';

test('Círculo: seis losas en hexágono alrededor del jardín y una danza que cruza el círculo', () => {
  assert.equal(CIRCLE_POINTS.length, 6);
  assert.deepEqual([...DANCE_ORDER].sort(), [0, 1, 2, 3, 4, 5]);
  for (let k = 1; k < DANCE_ORDER.length; k++) {
    const a = CIRCLE_POINTS[DANCE_ORDER[k - 1]]; const b = CIRCLE_POINTS[DANCE_ORDER[k]];
    assert.ok(Math.abs(a.x - b.x) + Math.abs(a.y - b.y) >= 5, 'dos pasos seguidos de la danza son vecinos');
  }
  assert.equal(pointAt(CIRCLE_POINTS[3].x, CIRCLE_POINTS[3].y), 3);
});

test('Círculo: alzar en el orden de la danza; un error hunde todas las piedras (sin castigo)', () => {
  let step = 0;
  for (const [n, i] of DANCE_ORDER.entries()) {
    const r = raiseInOrder(step, i);
    assert.ok(r.ok, `paso ${n}`);
    step = r.step;
    assert.equal(r.done, n === DANCE_ORDER.length - 1);
  }
  assert.deepEqual(raisedPoints(step), [...DANCE_ORDER]);
  const wrong = raiseInOrder(2, DANCE_ORDER[4]);
  assert.deepEqual(wrong, { ok: false, step: 0, done: false });
  assert.deepEqual(raisedPoints(0), []);
});

test('Círculo: con las piedras en pie, el Vuelo a Villa Alba deja elegir casa o Círculo', async () => {
  const st = GameState.create({ name: 'P' });
  const home = { x: 10, y: 26, dir: 2 };
  assert.equal(villaAlbaLandings(st, home), null);
  st.setFlag(F.circle);
  const L = villaAlbaLandings(st, home);
  assert.deepEqual(L.map((l) => l.label), ['Villa Alba', 'Círculo del Jardín']);
  // chooseLanding: elige la segunda opción con una elección simulada
  const ctx = { state: st, choice: async () => 1 };
  const def = { flyLandings: (s) => villaAlbaLandings(s, home) };
  const dest = await chooseLanding(ctx, { map: 'villa_alba', x: 10, y: 26, dir: 2 }, { loadDef: async () => def });
  assert.deepEqual(dest, { map: 'villa_alba', x: L[1].x, y: L[1].y, dir: L[1].dir });
  const cancel = await chooseLanding({ state: st, choice: async () => 2 }, { map: 'villa_alba', x: 1, y: 1 }, { loadDef: async () => def });
  assert.equal(cancel, null);
  const plain = await chooseLanding(ctx, { map: 'ciudad_caudal', x: 1, y: 1, dir: 2 }, { loadDef: async () => ({}) });
  assert.deepEqual(plain, { map: 'ciudad_caudal', x: 1, y: 1, dir: 2 });
});

test('T14: el acertijo del sobre (TABLILLAS) y la Mesa en el mapa de Vuelo solo al resolverlo', () => {
  assert.equal(RIDDLE, '«Entre el rayo y la sal, donde el sol de las cinco no hace sombra.»');
  assert.equal(RIDDLE_QUESTIONS[0].options[RIDDLE_QUESTIONS[0].answer], 'Villa Brontia');
  assert.equal(RIDDLE_QUESTIONS[1].options[RIDDLE_QUESTIONS[1].answer], 'La Meseta del Impulso');
  const mesa = placeById('mesa_vientos');
  assert.equal(canFlyTo(mesa, [], ['mesa_vientos']), false);
  assert.equal(canFlyTo(mesa, ['mesa_vientos'], []), true);
  const st = GameState.create({ name: 'P' });
  st.setFlag('b16_t14_carta');
  assert.equal(evaristoB17When(st), false, 'sin Vuelo la página de B17 no aparece');
  st.setZygardeAbility('fly', true);
  assert.equal(evaristoB17When(st), true);
  st.setFlag(F.reunion);
  assert.equal(evaristoB17When(st), false);
});

test('Alerce: con T14 resuelta y el Mirador sin ver, avisa (nota); con los dos, cita en Caudal (una vez cada uno)', async () => {
  const st = GameState.create({ name: 'P' });
  const said = [];
  const ctx = {
    state: st, flag: (k) => st.flag(k), setFlag: (k, v = true) => st.setFlag(k, v), me: () => {},
    say: async (t) => { said.push(t); },
  };
  assert.equal(await maybeAlerceCall(ctx), false, 'sin T14 no hay mensaje');
  st.setFlag(F.reunion);
  assert.equal(await maybeAlerceCall(ctx), true);
  assert.ok(st.flag(F.alerceHint) && !st.flag(F.alerceCall));
  assert.ok(st.hasClue(MIRADOR_HINT_NOTE.id), 'sin nota del Mirador Sur en la Libreta');
  assert.ok(said.some((t) => /Mirador Sur/.test(t)));
  assert.equal(await maybeAlerceCall(ctx), false, 'el aviso se repite');
  st.setFlag(F.mirador);
  assert.equal(await maybeAlerceCall(ctx), true);
  assert.ok(st.flag(F.alerceCall), 'sin la cita de la Vigilia');
  assert.equal(await maybeAlerceCall(ctx), false, 'la cita se repite');
});

test('Torres: regla de las tres piedras, variable para B20 y ocupación del P8 al P9', () => {
  const room = parseRoom(TOWER_ROOMS.viento);
  const loose = room.sockets.find((s) => s.d > LIMIT);
  const near = room.sockets.find((s) => s.d === 1);
  const adj = (s) => [s.x, s.y - 1];
  assert.equal(raise(room, [], loose.i, loose.x, loose.y - 1).reason, 'loose');
  assert.equal(raise(room, [], loose.i, loose.x, loose.y - 1, { unlimited: true }).ok, true, 'con la torre apagada aguanta todo');
  assert.equal(raise(room, [], near.i, ...adj(near)).ok, true);
  assert.equal(raise(room, [near.i], near.i, ...adj(near)).reason, 'raised');
  assert.equal(raise(room, [], near.i, near.x + 5, near.y).reason, 'far');
  assert.deepEqual(decodeRaised('3,1,1,x,5'), [3, 1, 5]);
  assert.equal(encodeRaised([5, 1, 3]), '1,3,5');
  assert.equal(V.towersOff, 'b17_torres_apagadas', 'B20 consulta este nombre');
  const st = GameState.create({ name: 'P' });
  assert.equal(towersOff(st), 0);
  st.setFlag(F.towerViento); st.setFlag(F.towerTemblor);
  assert.equal(towersOff(st), 2);
  assert.equal(occupied(st), false);
  st.setFlag('p8_restored');
  assert.equal(occupied(st), true);
  st.setFlag('p9_restored');
  assert.equal(occupied(st), false);
  assert.equal(vigilReady(st), false);
  st.setFlag(F.reunion); st.setFlag(F.mirador);
  assert.equal(vigilReady(st), true);
  assert.equal(typeof gameDay(st), 'number');
});

test('Torres: la caja de suministros se abre una sola vez (al apagarla o, tras el P9, con la torre abandonada)', async () => {
  const st = GameState.create({ name: 'P' });
  const given = [];
  const ctx = {
    state: st, flag: (k) => st.flag(k), setFlag: (k, v = true) => st.setFlag(k, v), say: async () => {},
    giveItem: async (item, n) => { given.push([item, n]); },
  };
  const t = { ...SENDA.TOWERS.viento, image: 'Exterior1' };
  const consoleEv = towerEvents(t, socketTiles('Exterior1')).find((e) => e.id === 'torre_viento_consola');
  const idlePage = consoleEv.pages[1];
  st.setFlag('p8_restored');
  assert.equal(idlePage.when(st), false, 'con la torre encendida la consola no está apagada');
  st.setFlag('p9_restored');
  assert.equal(idlePage.when(st), true, 'tras el P9 la torre queda abandonada');
  await idlePage.script(ctx);
  assert.deepEqual(given, [['FULLRESTORE', 1], ['RARECANDY', 1]]);
  assert.ok(st.flag(crateFlag('viento')));
  await idlePage.script(ctx);
  assert.equal(given.length, 2, 'la caja se repite');
});

test('Entrenadores: niveles 58–62, especies de Axis y dinero de BALANCE', () => {
  for (const [id, t] of Object.entries(TRAINERS)) {
    const party = typeof t.party === 'function' ? t.party(GameState.create({ name: 'P' })) : t.party;
    for (const p of party) {
      assert.ok(SPECIES[p.species], `${id}: especie ${p.species}`);
      assert.ok(p.level >= 58 && p.level <= 62, `${id}: nivel ${p.level}`);
    }
    if (id.startsWith('b17_tecnic')) {
      assert.equal(t.money, 40, `${id}: dinero de técnico`);
      for (const p of party) assert.ok(p.level <= 60, `${id}: los técnicos de las torres van del 58 al 60`);
    }
    const r = checkTrainerMoney(id, t);
    assert.ok(r.ok, `${id}: ${r.problem}`);
  }
});

test('Encuentros: tablas de la Mesa y de la Sima (POKEDEX_DISTRIBUCION), rebaño y Clefairy', () => {
  const sum = (t) => t.reduce((a, r) => a + r[0], 0);
  assert.equal(sum(MESA_GRASS), 100);
  assert.equal(sum(SIMA_CAVE), 100);
  assert.deepEqual(MESA_GRASS.map((r) => r[1]), ['ALTARIA', 'STARAPTOR', 'TROPIUS', 'NOIVERN', 'DRIFBLIM', 'TOGETIC']);
  for (const r of MESA_GRASS) assert.deepEqual([r[2], r[3]], [58, 62]);
  for (const r of SIMA_CAVE) assert.deepEqual([r[2], r[3]], [60, 65]);
  assert.deepEqual(HERD.map((h) => h.level), [58, 59, 60]);
  assert.equal(CIRCLE_CLEFAIRY.species, 'CLEFAIRY');
});

test('Células: ninguna en las zonas de Forma Completa (CAMPANA §2.3)', () => {
  for (const id of ['mesa_vientos', 'senda_mirador', 'mirador_sur', 'mesa_vientos_casa']) assert.deepEqual(cellsOnMap(id), [], id);
});

test('Enlaces con el Puente de B18: los tableros casan con su camino (offset 0)', () => {
  assert.deepEqual([SENDA.BRIDGE.south.x0, SENDA.BRIDGE.south.x1, SENDA.BRIDGE.south.y], [18, 22, SENDA.H - 1]);
  assert.equal(SENDA.BRIDGE.south.offset, 0);
  assert.deepEqual([MIR.DECK.north.x0, MIR.DECK.north.x1, MIR.DECK.north.y], [19, 21, 0]);
  assert.equal(MIR.DECK.north.offset, 0);
  assert.equal(SENDA.NORTH.offset, -30, 'Caudal conecta south con offset 30');
  assert.equal(MIR.SOUTH.offset, -20, 'Lúmina conecta north con offset 20');
});
