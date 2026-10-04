// Bloque 18 — Pilar de la Convergencia (docs/CAMPANA.md B18; D18): datos, geometría y reglas sin navegador.
//   · Salas de la Cámara del Cruce: resolubles, sin estados trampa y con los ejes que pide cada una (el vestíbulo enseña
//     el tiempo; Caída, Río y Cruce exigen los dos); el mapa pinta cada sala como su ASCII en los tres ejes.
//   · Puente: los tres huecos del tramo central son vacío hasta alzar sus piedras.
//   · Entrenadores (CAMPANA §5.2–5.3, BALANCE), encuentros (POKEDEX_DISTRIBUCION §7.3) y el combate del elegido (nivel
//     65, sus movimientos, sin huida, captura solo por debajo del 50 % de PS, también en el motor real).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS, ROOM_ORDER, ROOM_ITEMS, ROOM_NAMES } from '../game/src/content/events/b18_cruce_rooms.js';
import {
  AXIS_VAR, AXIS_TIME, AXIS_SPACE, solveAxisRoom, axisTraps, planSummary, solvableWithout, axisReach, crystalsNear, foldPair,
} from '../game/src/world/axis/logic.js';
import { ROOM_PLACES, NUCLEO } from '../game/src/content/maps/b18/cruce_layout.js';
import { BRIDGE, gapCells } from '../game/src/content/maps/b18/puente_layout.js';
import TRAINERS from '../game/src/content/trainers/b18.js';
import ENCOUNTERS, { SIMA_EJE, P9_LEGENDS } from '../game/src/content/encounters/b18.js';
import { checkTrainerMoney } from '../game/src/content/trainerMoney.js';
import { CHOICES, ORB_OF_UNCHOSEN, OTHER } from '../game/src/content/events/b18_common.js';
import { boundRequest, chainCatchCondition, NUCLEO_TEXT } from '../game/src/content/events/b18_nucleo.js';
import { bossBattleRequest } from '../game/src/content/common/bossBattle.js';
import { buildBattleConfig } from '../game/src/battle/scene/setup.js';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { db, fieldWorld } from './b18_helpers.mjs';

const MODES = [null, AXIS_TIME, AXIS_SPACE];

// ───────────────────────────── salas de la Cámara ─────────────────────────────

test('Salas: resolubles desde la entrada, sin estados trampa; el vestíbulo enseña el tiempo y las otras exigen los dos ejes', () => {
  assert.deepEqual(ROOM_ORDER, ['vestibulo', 'caida', 'rio', 'cruce']);
  for (const name of ROOM_ORDER) {
    const room = ROOMS[name];
    assert.ok(solveAxisRoom(room), `${name}: sin solución`);
    assert.deepEqual(axisTraps(room), [], `${name}: hay estados desde los que no se vuelve a la entrada o no se llega a la salida`);
    assert.equal(solvableWithout(room, AXIS_TIME), false, `${name}: se supera sin tensar hacia Dialga`);
    assert.equal(solvableWithout(room, AXIS_SPACE), name === 'vestibulo', `${name}: el espacio ${name === 'vestibulo' ? 'no debería hacer falta' : 'no hace falta'}`);
    assert.ok(ROOM_NAMES[name], `${name}: sin rótulo`);
  }
  const sum = (n) => planSummary(solveAxisRoom(ROOMS[n]));
  assert.ok(sum('caida').folds >= 1, 'la Sala de la Caída no usa su pliegue');
  assert.ok(sum('rio').currents >= 1 && sum('rio').folds >= 1, 'la Sala del Río no combina corriente y pliegue');
  const cruce = sum('cruce');
  assert.ok(cruce.currents >= 1 && cruce.folds >= 1 && cruce.tensions >= 3, `la Sala del Cruce no combina las dos (${JSON.stringify(cruce)})`);
});

test('Salas: cada cristal se puede usar y cada objeto se recoge desde la entrada', () => {
  for (const name of ROOM_ORDER) {
    const room = ROOMS[name];
    const reach = [...axisReach(room, [{ ...room.entry, mode: null }]).values()];
    for (const c of room.crystals) {
      assert.ok(reach.some((s) => crystalsNear(room, s.x, s.y).some((k) => k.x === c.x && k.y === c.y)), `${name}: el cristal (${c.x},${c.y}) no se alcanza`);
    }
    for (const o of room.items) assert.ok(reach.some((s) => s.x === o.x && s.y === o.y), `${name}: el objeto (${o.x},${o.y}) no se alcanza`);
    assert.equal(room.items.length, (ROOM_ITEMS[name] || []).length, `${name}: casillas de objeto y objetos no cuadran`);
    for (const it of ROOM_ITEMS[name] || []) assert.ok(db.items[it.item], `${name}: objeto ${it.item} inexistente`);
  }
});

test('Cámara: el mapa pinta cada sala como su ASCII en los tres ejes (vacío, escombros, cristales, corrientes y pliegues)', async () => {
  const { map, w, state } = await fieldWorld('camara_cruce');
  const evAt = (x, y, kind) => w.events.find((e) => !e.erased && e.page && e.x === x && e.y === y && e.def?.axisKind === kind) || null;
  // Solo el id: un MapEvent en el mensaje de error arrastraría el mapa entero al informe.
  const blocker = (x, y) => w.events.find((e) => !e.erased && e.page && !e.through && (e.characterName || e.solid) && e.x === x && e.y === y)?.id ?? null;
  for (const mode of MODES) {
    state.setVar(AXIS_VAR, mode);
    w.refreshEvents();
    for (const place of ROOM_PLACES) {
      place.grid.rows.forEach((row, gy) => [...row].forEach((ch, gx) => {
        const x = place.ox + gx;
        const y = place.oy + gy;
        const where = `${place.name} (${gx},${gy}) «${ch}» con ${mode}`;
        if (ch === ' ') { assert.ok(map.isVoid(x, y) && !map.playerPassable(x, y, 2, {}), `${where}: el vacío tiene tiles`); return; }
        if (ch === 'D') {
          assert.ok(evAt(x, y, 'debris'), `${where}: falta el escombro`);
          assert.equal(map.playerPassable(x, y, 2, {}), mode === AXIS_TIME, `${where}: pasabilidad del escombro`);
          return;
        }
        if (ch === 'C') { assert.ok(evAt(x, y, 'crystal')?.solid, `${where}: falta el cristal sólido`); return; }
        assert.ok(!map.isVoid(x, y) && map.playerPassable(x, y, 2, {}), `${where}: el suelo no se pisa`);
        // La Poké Ball de un objeto bloquea hasta recogerla (se recoge desde la casilla de al lado): es suelo después.
        if (ch === 'o') assert.match(blocker(x, y) || '', new RegExp(`^${place.name}_objeto_`), `${where}: falta el objeto`);
        else assert.equal(blocker(x, y), null, `${where}: un evento sólido tapa el suelo`);
        const dir = { '^': 8, v: 2, '<': 4, '>': 6 }[ch];
        if (dir) assert.equal(evAt(x, y, 'current')?.def.dir, dir, `${where}: corriente mal orientada`);
        if (/[1-9]/.test(ch)) {
          const pair = foldPair(place.grid, gx, gy);
          assert.deepEqual(evAt(x, y, 'fold')?.def.to, { x: place.ox + pair.x, y: place.oy + pair.y }, `${where}: pliegue sin su pareja`);
        }
      }));
    }
  }
});

test('Núcleo: Dialga al oeste y Palkia al este del núcleo; el elegido baja delante; orbe e inscripción en su sitio', async () => {
  const { map, w } = await fieldWorld('camara_cruce_nucleo');
  const ev = (id) => w.events.find((e) => e.id === id);
  assert.deepEqual([ev('dialga_nucleo').x, ev('dialga_nucleo').y], [NUCLEO.dialga.x, NUCLEO.dialga.y]);
  assert.deepEqual([ev('palkia_nucleo').x, ev('palkia_nucleo').y], [NUCLEO.palkia.x, NUCLEO.palkia.y]);
  assert.ok(NUCLEO.dialga.x < NUCLEO.core.x && NUCLEO.palkia.x > NUCLEO.core.x);
  assert.equal(ev('dialga_nucleo').characterName, 'follower:DIALGA:0:0');
  assert.equal(ev('palkia_nucleo').characterName, 'follower:PALKIA:0:0');
  assert.ok(ev('nucleo_p9').page?.solid, 'el núcleo no es sólido');
  for (const c of [NUCLEO.bound, NUCLEO.orb, NUCLEO.coreFront]) assert.ok(map.playerPassable(c.x, c.y, 2, {}), `(${c.x},${c.y}) no es suelo`);
  assert.ok(!ev('orbe_no_elegido').page, 'el orbe está antes de elegir');
  assert.ok(!ev('elegido_reaparece').page, 'el elegido reaparece antes de combatir');
});

// ───────────────────────────── Puente ─────────────────────────────

test('Puente: los tres huecos son vacío hasta alzar sus piedras (x 19–21); los zócalos están en su borde norte', async () => {
  const t = await fieldWorld('puente_convergencia');
  for (const g of BRIDGE.gaps) {
    for (let y = g.y0; y <= g.y1; y++) for (let x = BRIDGE.x0; x <= BRIDGE.x1; x++) assert.ok(t.map.isVoid(x, y), `hueco ${g.n}: (${x},${y}) tiene tiles`);
    assert.equal(g.socket.y, g.y0 - 1, `el zócalo ${g.n} no está en el borde norte de su hueco`);
    const sock = t.w.events.find((e) => e.id === `zocalo_tramo_${g.n}`);
    assert.ok(sock?.page?.solid, `el zócalo ${g.n} no está`);
  }
  const done = await fieldWorld('puente_convergencia', { flags: BRIDGE.gaps.map((g) => g.flag) });
  for (const g of BRIDGE.gaps) {
    for (const [x, y] of gapCells(g)) assert.ok(done.map.playerPassable(x, y, 2, {}), `hueco ${g.n}: (${x},${y}) no se pisa reconstruido`);
    for (let y = g.y0; y <= g.y1; y++) assert.ok(done.map.isVoid(BRIDGE.x0, y) && done.map.isVoid(BRIDGE.x1, y), `hueco ${g.n}: los bordes deberían seguir rotos`);
  }
});

// ───────────────────────────── entrenadores y encuentros ─────────────────────────────

const team = (id) => TRAINERS[id].party.map((p) => [p.species, p.level, p.item ?? null]);

test('Entrenadores: Casia, Garrido y Vértice con los equipos de CAMPANA; técnicos 60–61; dinero de BALANCE', () => {
  assert.deepEqual(team('b18_casia'), [['REUNICLUS', 62, null], ['MAGNEZONE', 61, null], ['BEHEEYEM', 61, null], ['HATTERENE', 62, null]]);
  assert.deepEqual(team('b18_garrido'), [['CONKELDURR', 62, null], ['RHYPERIOR', 62, null], ['TINKATON', 61, null], ['HOUNDOOM', 63, 'HOUNDOOMINITE']]);
  assert.deepEqual(team('b18_vertice'), [
    ['MAGNEZONE', 64, null], ['PORYGONZ', 65, null], ['HYDREIGON', 65, null], ['METAGROSS', 66, null], ['ALAKAZAM', 67, 'ALAKAZITE'],
  ]);
  assert.ok(TRAINERS.b18_garrido.megaRing && TRAINERS.b18_vertice.megaRing, 'sin Megaaro no hay Megaevolución');
  assert.equal(TRAINERS.b18_vertice.bgm, 'CombateGiovanniFinal');
  for (const id of ['b18_casia', 'b18_garrido', 'b18_vertice']) assert.equal(TRAINERS[id].canLose, true, `${id}: combate de guion sin canLose`);
  for (const [id, tr] of Object.entries(TRAINERS)) {
    for (const p of tr.party) {
      assert.ok(db.species[p.species], `${id}: especie ${p.species}`);
      if (p.item) assert.ok(db.items[p.item], `${id}: objeto ${p.item}`);
    }
    for (const it of tr.items || []) assert.ok(db.items[it], `${id}: objeto de mochila ${it}`);
    if (id.startsWith('b18_tecnic')) assert.ok(tr.party.every((p) => p.level >= 60 && p.level <= 62), `${id}: niveles fuera de 60–62`);
    const money = checkTrainerMoney(id, tr);
    assert.ok(money.ok, `${id}: ${money.problem}`);
  }
});

test('Encuentros: la Sima del Eje (POKEDEX_DISTRIBUCION §7.3) suma 100, niveles 60–65, en el Puente y en la Cámara', () => {
  assert.equal(SIMA_EJE.reduce((a, [w]) => a + w, 0), 100);
  assert.deepEqual(SIMA_EJE.map(([w, sp]) => [sp, w]), [['DEINO', 20], ['BELDUM', 20], ['GIBLE', 20], ['DURALUDON', 15], ['ELGYEM', 15], ['ZWEILOUS', 5], ['METANG', 5]]);
  for (const [, sp, a, b] of SIMA_EJE) assert.ok(db.species[sp] && a === 60 && b === 65, `${sp} ${a}-${b}`);
  assert.equal(ENCOUNTERS.puente_convergencia.cave, SIMA_EJE);
  assert.equal(ENCOUNTERS.camara_cruce.cave, SIMA_EJE);
});

// ───────────────────────────── el elegido ─────────────────────────────

test('El elegido: nivel 65, sus cuatro movimientos, sin huida; la Cadena solo lo retiene por debajo del 50 % de PS', () => {
  const want = { DIALGA: ['ROAROFTIME', 'METALCLAW', 'DRAGONPULSE', 'ANCIENTPOWER'], PALKIA: ['SPACIALREND', 'WATERPULSE', 'DRAGONPULSE', 'ANCIENTPOWER'] };
  for (const choice of [CHOICES.DIALGA, CHOICES.PALKIA]) {
    const req = bossBattleRequest(boundRequest(choice));
    assert.equal(req.type, 'wild');
    assert.deepEqual([req.wild.species, req.wild.level, req.wild.shiny], [choice, 65, false]);
    assert.deepEqual(req.wild.moves, want[choice]);
    for (const m of req.wild.moves) assert.ok(db.moves[m], `movimiento ${m} inexistente`);
    assert.equal(req.rules.canRun, false);
    assert.equal(req.rules.canLose, true, 'perder no es derrota general (vuelve a la entrada de la Cámara)');
    assert.equal(req.rules.catchCondition, chainCatchCondition);
    assert.notEqual(req.wild.moves, P9_LEGENDS[choice].moves, 'la petición comparte la lista de movimientos');
  }
  assert.throws(() => boundRequest('GIRATINA'), /elección inválida/);
  const battle = (hp, totalhp = 200) => ({ battlers: [{ hp: 100, totalhp: 100, isFainted: () => false }, { hp, totalhp, isFainted: () => hp <= 0 }] });
  assert.deepEqual(chainCatchCondition(battle(99)), { allowed: true, reason: null });
  assert.deepEqual(chainCatchCondition(battle(100)), { allowed: false, reason: NUCLEO_TEXT.catchReason }, 'al 50 % justo ya se captura');
  assert.equal(chainCatchCondition(battle(200)).allowed, false);
  assert.equal(chainCatchCondition(null).allowed, false);
  assert.equal(chainCatchCondition({ battlers: [] }).allowed, false);
});

test('El elegido en el motor real: la Ball rebota con PS altos (sin gastarla) y atrapa por debajo de la mitad', async () => {
  for (const choice of [CHOICES.DIALGA, CHOICES.PALKIA]) {
    const req = bossBattleRequest(boundRequest(choice));
    const bag = { MASTERBALL: 2 };
    const party = [createPokemon(db, 'LUCARIO', 70)];
    const { config } = buildBattleConfig({ ...req, opponent: { party: [req.wild] }, seed: 5, player: { name: 'P', party, bag } }, { db });
    class UI extends HeadlessBattleUI {
      async chooseAction(view) {
        this.calls = (this.calls || 0) + 1;
        if (this.calls === 2) {
          // Segundo intento: el elegido baja al 40 % (como tras unos golpes)
          const foe = this.battle.battlers[1];
          this.hpBefore = foe.hp / foe.totalhp;
          foe.hp = Math.floor(foe.totalhp * 0.4);
          this.script.push({ action: 'item', item: 'MASTERBALL' });
        }
        return super.chooseAction(view);
      }
    }
    const ui = new UI({ script: [{ action: 'item', item: 'MASTERBALL' }] });
    ui.battle = new Battle(config, ui);
    const r = await ui.battle.run();
    assert.ok(ui.messages.includes(NUCLEO_TEXT.catchReason), `${choice}: no se explica por qué rebota la Ball`);
    assert.equal(ui.hpBefore, 1, `${choice}: el primer intento no fue con los PS al completo`);
    assert.equal(r.outcome, 'caught', `${choice}: no se captura por debajo de la mitad (${r.outcome})`);
    assert.equal(r.caught.species, choice);
    assert.equal(ui.battle.bag.MASTERBALL, 1, `${choice}: se gastó la Ball rechazada (o no se lanzó la buena)`);
  }
});

test('Orbes: el no elegido deja el suyo (Dialga elegido → Lustresfera; Palkia elegido → Diamansfera)', () => {
  assert.deepEqual(ORB_OF_UNCHOSEN, { DIALGA: 'LUSTROUSORB', PALKIA: 'ADAMANTORB' });
  assert.equal(db.items.LUSTROUSORB.name, 'Lustresfera');
  assert.equal(db.items.ADAMANTORB.name, 'Diamansfera');
  assert.deepEqual(OTHER, { DIALGA: 'PALKIA', PALKIA: 'DIALGA' });
  assert.equal(db.items.REDCHAIN.pocket, 8, 'la Cadena Roja no es objeto clave');
});
