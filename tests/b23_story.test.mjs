import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { db, mon } from './battle_helpers.mjs';
import { F, hoopaReady, megaZygardeUsed, canDepart } from '../game/src/content/events/b23_common.js';
import { stealNode, alerceLetter } from '../game/src/content/events/b23_intro.js';
import { withAlerceLetter } from '../game/src/content/events/b23_intro.js';
import { claimZygardite, gaelRequest, confrontGael } from '../game/src/content/events/b23_gael.js';
import { hoopaFight, hoopaRequest } from '../game/src/content/events/b23_hoopa.js';
import { redDestinations } from '../game/src/content/events/b22a_red.js';

function context({ flags = [], results = [] } = {}) {
  const state = GameState.create({ name: 'Ana' });
  for (const f of ['game_cleared', 'b21_fin', ...flags]) state.setFlag(f);
  state.setParty([mon('ZYGARDE', 80, ['THOUSANDARROWS'], { form: 2 })]);
  const log = { said: [], items: [], battles: [], heals: 0, moves: [] };
  const queue = [...results];
  return { state, db, log, world: { events: [] }, map: { id: 'torre_crisol' }, player: { x: 17, y: 24 },
    flag: (k) => state.flag(k), setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d = 0) => state.var(k, d), setVar: (k, v) => state.setVar(k, v),
    say: async (s) => log.said.push(s), confirm: async () => true,
    giveItem: async (id) => { log.items.push(id); db.items[id]?.pocket === 8 ? state.addKeyItem(id) : state.addItem(id); },
    battleResult: async (request) => { log.battles.push(request); return queue.shift() || { outcome: 'win', megaEvolutions: [] }; },
    battle: async (request) => { log.battles.push(request); return (queue.shift() || { outcome: 'win' }).outcome; },
    heal: () => { log.heals += 1; }, requestRefresh: () => {}, fade: async () => {}, flash: async () => {},
    se: () => {}, cry: () => {}, move: async (_, route) => log.moves.push(route), erase: () => {},
  };
}
const mega = [{ species: 'ZYGARDE', form: 4, side: 0, owner: 0, partyIndex: 0 }];

test('Almenara: robo y carta son posteriores al epílogo e idempotentes', async () => {
  const c = context(); c.state.setFlag('b21_fin', false);
  await stealNode(c); await alerceLetter(c);
  assert.equal(c.flag(F.theft), false); assert.equal(canDepart(c.state), false);
  c.state.setFlag('b21_fin'); await alerceLetter(c);
  assert.equal(canDepart(c.state), false, 'primero se presencia el robo');
  await stealNode(c); await stealNode(c); await alerceLetter(c); await alerceLetter(c);
  assert.ok(canDepart(c.state)); assert.equal(c.log.items.length, 0);
  assert.ok(c.log.said.some((s) => /sin firma/.test(s)));
  assert.equal(c.log.battles.length, 0);
});
test('Almenara: Alerce mantiene el diálogo anterior fuera de la etapa de la carta', async () => {
  const c = context(), originals = [];
  const event = withAlerceLetter([{ id: 'alerce', script: async () => originals.push('base') }])[0];
  await event.script(c); assert.deepEqual(originals, ['base']);
  await stealNode(c); await event.script(c); assert.ok(c.flag(F.letter));
  await event.script(c); assert.deepEqual(originals, ['base', 'base']);
});
test('Almenara: el nodo robado queda fuera de la Red hasta devolverlo', () => {
  const c = context(); c.state.setFlag('b01_core_found');
  assert.ok(redDestinations(c.state, 'origen').some((n) => n.id === 'laberinto'));
  c.setFlag(F.theft);
  assert.ok(!redDestinations(c.state, 'origen').some((n) => n.id === 'laberinto'));
  c.setFlag(F.nodeReturned);
  assert.ok(redDestinations(c.state, 'origen').some((n) => n.id === 'laberinto'));
});
test('Almenara: la Zygardita es única, equiparla devuelve el objeto anterior y no ocupa otro hueco', async () => {
  const c = context({ flags: [F.recording, F.experiment] }); c.state.party[0].heldItem = 'LEFTOVERS';
  await claimZygardite(c); await claimZygardite(c);
  assert.equal(c.state.party.length, 1); assert.equal(c.state.party[0].heldItem, 'ZYGARDITE');
  assert.equal(c.state.itemCount('LEFTOVERS'), 1); assert.equal(c.state.itemCount('ZYGARDITE'), 0);
  assert.deepEqual(c.log.items, ['ZYGARDITE']);
  assert.ok(c.log.said.some((s) => /tres noches/.test(s)));
});
test('Almenara: Gael trae seis Pokémon 80–82 y Mega Absol con el aro negro', () => {
  const c = context(), r = gaelRequest(c.state);
  assert.equal(r.trainer.party.length, 6);
  assert.ok(r.trainer.party.every((p) => p.level >= 80 && p.level <= 82));
  assert.deepEqual(r.trainer.party.slice(0, 5).map((p) => p.species), ['STARAPTOR', 'LUCARIO', 'GARCHOMP', 'WEAVILE', 'ABSOL']);
  assert.equal(r.trainer.party[4].item, 'ABSOLITE'); assert.equal(r.trainer.megaRingName, 'el aro negro');
  assert.equal(r.noCoop, true);
});
test('Almenara: Gael espera si Zygarde está en el PC y la derrota no completa la escena', async () => {
  const c = context({ flags: [F.stone, F.crisol], results: [{ outcome: 'lose' }] });
  c.state.addPokemon(mon('PIKACHU', 80, ['THUNDERBOLT']));
  c.state.depositPokemon(0, 0);
  await confrontGael(c); assert.equal(c.log.battles.length, 0);
  c.state.withdrawPokemon(0, 0); await confrontGael(c);
  assert.equal(c.flag(F.gaelWon), false); assert.equal(c.log.heals, 1);
  assert.ok(c.log.battles[0].rules.noMoneyLoss); assert.ok(c.log.battles[0].canLose);
});
test('Almenara: solo una Mega Zygarde del jugador calma a Hoopa', () => {
  assert.equal(megaZygardeUsed({ megaEvolutions: mega }), true);
  for (const value of [[], [{ ...mega[0], side: 1 }], [{ ...mega[0], owner: 1 }], [{ ...mega[0], species: 'ABSOL' }]])
    assert.equal(megaZygardeUsed({ megaEvolutions: value }), false);
});
test('Almenara: capturar antes de megaevolucionar se bloquea con motivo', () => {
  const c = context({ flags: [F.gaelWon] }); c.state.addKeyItem('PRISONBOTTLE');
  const request = hoopaRequest(c.state);
  assert.equal(request.wild.form, 1); assert.equal(request.wild.level, 80);
  const blocked = request.rules.catchCondition({ megaEvolved: [] });
  assert.equal(blocked.allowed, false); assert.match(blocked.reason, /Mega Zygarde/);
  assert.equal(request.rules.catchCondition({ megaEvolved: mega }).allowed, true);
});
test('Almenara: KO sin Mega no sella; al descansar se puede reintentar', async () => {
  const c = context({ flags: [F.gaelWon], results: [{ outcome: 'win', megaEvolutions: [] }] });
  c.state.addKeyItem('PRISONBOTTLE'); c.state.party[0].heldItem = 'ZYGARDITE';
  await hoopaFight(c); assert.equal(c.flag(F.end), false); assert.equal(hoopaReady(c.state), false);
  c.state.setVar('rest_count', 1); assert.equal(hoopaReady(c.state), true);
});
test('Almenara: victoria real con Mega sella con la Vasija, Gael sale y Hoopa se puede capturar después de descansar', async () => {
  const c = context({ flags: [F.gaelWon], results: [{ outcome: 'win', megaEvolutions: mega }] });
  c.state.addKeyItem('PRISONBOTTLE'); c.state.party[0].heldItem = 'ZYGARDITE';
  await hoopaFight(c);
  assert.ok(c.flag(F.sealed)); assert.ok(c.flag(F.end)); assert.ok(c.flag(F.nodeReturned));
  assert.equal(c.flag(F.hoopaCaught), false); assert.equal(c.state.itemCount('PRISONBOTTLE'), 1);
  assert.equal(hoopaReady(c.state), false);
  c.state.setVar('rest_count', 1); assert.equal(hoopaRequest(c.state).wild.form, 0);
  assert.equal(hoopaRequest(c.state).rules.catchCondition({ megaEvolved: [] }).allowed, true);
});

test('Almenara: capturar con Mega sella a Hoopa en el equipo y conserva la Vasija', async () => {
  const c = context({ flags: [F.gaelWon] }); c.state.addKeyItem('PRISONBOTTLE');
  const hoopa = mon('HOOPA', 80, ['PSYCHIC'], { form: 1 }); c.state.addPokemon(hoopa);
  c.battleResult = async () => ({ outcome: 'caught', caught: hoopa, megaEvolutions: mega });
  await hoopaFight(c);
  assert.ok(c.flag(F.hoopaCaught)); assert.ok(c.flag(F.end));
  assert.equal(c.state.party.find(p => p.uid === hoopa.uid).form, 0);
  assert.equal(c.state.itemCount('PRISONBOTTLE'), 1);
});
for (const outcome of ['lose', 'forfeit', 'run']) test(`Almenara: ${outcome} ante Hoopa no cierra la historia`, async () => {
  const c = context({ flags: [F.gaelWon], results: [{ outcome, megaEvolutions: mega }] });
  c.state.addKeyItem('PRISONBOTTLE'); await hoopaFight(c);
  assert.equal(c.flag(F.end), false); assert.equal(c.flag(F.hoopaCaught), false);
  assert.equal(c.log.heals, outcome === 'run' ? 0 : 1);
  assert.ok(hoopaReady(c.state));
});
test('Almenara: esperar a Gael, descansar, recuperar la Vasija o cancelar no inicia un combate', async () => {
  const c = context(); await hoopaFight(c); assert.equal(c.log.battles.length, 0);
  c.setFlag(F.gaelWon); await hoopaFight(c); assert.equal(c.log.battles.length, 0);
  c.state.addKeyItem('PRISONBOTTLE'); c.state.party[0].form = 0;
  await hoopaFight(c); assert.equal(c.log.battles.length, 0);
  c.state.party[0].form = 2; c.confirm = async () => false;
  await hoopaFight(c); assert.equal(c.log.battles.length, 0);
  c.setFlag(F.hoopaCaught); await hoopaFight(c); assert.equal(c.log.battles.length, 0);
});
test('Almenara: los tres personajes se marchan por rutas y el portal se cierra', async () => {
  const c = context({ flags: [F.gaelWon], results: [{ outcome: 'win', megaEvolutions: mega }] });
  c.state.addKeyItem('PRISONBOTTLE');
  c.world.events = ['b23_gael', 'b23_fiel_o', 'b23_fiel_e'].map(id => ({ id }));
  const erased = []; c.erase = e => erased.push(e.id); await hoopaFight(c);
  assert.deepEqual(c.log.moves.map(r => r.length), [5, 9, 5]);
  assert.deepEqual(erased, ['b23_gael', 'b23_fiel_o', 'b23_fiel_e']); assert.ok(c.flag(F.departure));
});
