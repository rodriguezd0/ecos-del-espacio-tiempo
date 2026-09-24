// Repartir Exp moderno (gen 6+): objeto clave EXPSHARE activable desde la Mochila; activado, los Pokémon del equipo
// que no participan reciben el 50 % de la experiencia (ui/logic/expShare.js + battle/scene/setup.js + battleExp.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { db, mon, play } from './battle_helpers.mjs';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';
import { GameState } from '../game/src/core/state.js';
import { buildBattleConfig } from '../game/src/battle/scene/setup.js';
import { applyBattleResult } from '../game/src/battle/scene/results.js';
import {
  EXP_SHARE_ITEM, EXP_SHARE_OFF_FLAG, hasExpShare, isExpShareOn, toggleExpShare, expShareMessage, expShareLabel,
} from '../game/src/ui/logic/expShare.js';
import { isKeyItem, canToss } from '../game/src/ui/logic/bagLogic.js';

const OTHERS_MSG = '¡Tus otros Pokémon también ganaron puntos de experiencia!';
const axisItems = JSON.parse(fs.readFileSync(new URL('../game/data/items_axis.json', import.meta.url)));

/** Equipo: [0] combate y gana, [1] espera en el equipo, [2] debilitado. Rival salvaje con 1 PS. */
function party() {
  return [mon('PIKACHU', 10, ['TACKLE']), mon('BULBASAUR', 10, ['TACKLE']), { ...mon('SQUIRTLE', 10, ['TACKLE']), hp: 0 }];
}
const foe = () => [{ ...mon('RATTATA', 10, ['SPLASH']), hp: 1 }];
const wild = (player) => ({ type: 'wild', player: { party: party(), ...player }, opponent: { party: foe() } });
const gained = (battle, before, i) => battle.pbParty(0)[i].exp - before[i].exp;

test('motor: con expAll el que no combate recibe la mitad y el debilitado nada', async () => {
  const before = party();
  const { battle, result, ui } = await play(wild({ expAll: true }), { script: [{ action: 'fight', move: 'TACKLE' }] });
  assert.equal(result.outcome, 'win');
  const partic = gained(battle, before, 0);
  const bystander = gained(battle, before, 1);
  assert.ok(partic > 0, 'el participante gana experiencia');
  assert.ok(bystander > 0, 'el que espera también gana');
  // Mismo nivel: el participante recibe a (+1 de la fórmula escalada); el resto, a/2.
  assert.ok(Math.abs(bystander - Math.floor((partic - 1) / 2)) <= 1, `${partic} vs ${bystander}`);
  assert.equal(gained(battle, before, 2), 0, 'un Pokémon debilitado no gana experiencia');
  assert.equal(ui.messages.filter((m) => m === OTHERS_MSG).length, 1, ui.messages.join(' | '));
});

test('motor: sin Repartir Exp solo gana quien combate (y sin aviso de los demás)', async () => {
  const before = party();
  const { battle, ui } = await play(wild({ expAll: false }), { script: [{ action: 'fight', move: 'TACKLE' }] });
  assert.ok(gained(battle, before, 0) > 0);
  assert.equal(gained(battle, before, 1), 0);
  assert.ok(!ui.messages.includes(OTHERS_MSG));
});

test('datos: EXPSHARE es un objeto clave (no se tira) que se usa desde la Mochila', () => {
  const item = axisItems.EXPSHARE;
  assert.equal(item.pocket, 8);
  assert.ok(item.flags.includes('KeyItem'));
  assert.equal(item.fieldUse, 'Direct');
  assert.ok(isKeyItem(item));
  assert.equal(canToss(item), false);
});

test('estado: al recibirlo queda activado; la Mochila lo desactiva y lo vuelve a activar', () => {
  const s = GameState.create({ name: 'Axis' });
  assert.equal(hasExpShare(s), false);
  assert.equal(isExpShareOn(s), false);
  assert.equal(expShareLabel(s, EXP_SHARE_ITEM), null);
  assert.throws(() => toggleExpShare(s), /No tienes el Repartir Exp/);
  s.addKeyItem(EXP_SHARE_ITEM);
  assert.equal(isExpShareOn(s), true);
  assert.equal(expShareLabel(s, EXP_SHARE_ITEM), 'ON');
  assert.equal(expShareLabel(s, 'POTION'), null);
  assert.equal(toggleExpShare(s), false);
  assert.equal(s.flag(EXP_SHARE_OFF_FLAG), true);
  assert.equal(isExpShareOn(s), false);
  assert.equal(expShareLabel(s, EXP_SHARE_ITEM), 'OFF');
  assert.equal(toggleExpShare(s), true);
  assert.equal(s.flag(EXP_SHARE_OFF_FLAG), false);
  assert.match(expShareMessage(true), /activado el Repartir Exp/);
  assert.match(expShareMessage(false), /desactivado el Repartir Exp/);
});

test('escena: buildBattleConfig pone player.expAll según el Repartir Exp de la partida', () => {
  const s = GameState.create({ name: 'Axis' });
  s.setParty(party().slice(0, 2));
  const request = { type: 'wild', opponent: { party: [{ species: 'RATTATA', level: 3 }] } };
  assert.equal(buildBattleConfig(request, { db, state: s }).config.player.expAll, false, 'sin el objeto');
  s.addKeyItem(EXP_SHARE_ITEM);
  assert.equal(buildBattleConfig(request, { db, state: s }).config.player.expAll, true, 'activado');
  toggleExpShare(s);
  assert.equal(buildBattleConfig(request, { db, state: s }).config.player.expAll, false, 'desactivado');
  assert.equal(buildBattleConfig({ ...request, player: { expAll: true } }, { db, state: s }).config.player.expAll, true,
    'la petición explícita manda');
});

test('flujo completo: la experiencia del que espera llega al equipo de la partida', async () => {
  const s = GameState.create({ name: 'Axis' });
  s.setParty(party().slice(0, 2));
  s.addKeyItem(EXP_SHARE_ITEM);
  const before = s.party.map((p) => p.exp);
  const { config } = buildBattleConfig({ type: 'wild', opponent: { party: foe() } }, { db, state: s });
  const ui = new HeadlessBattleUI({ script: [{ action: 'fight', move: 'TACKLE' }] });
  const result = await new Battle({ ...config, rng: () => 0.9999 }, ui).run();
  assert.equal(result.outcome, 'win');
  applyBattleResult(s, result);
  assert.ok(s.party[0].exp > before[0]);
  assert.ok(s.party[1].exp > before[1], 'el Pokémon que no combatió ganó experiencia');
  assert.equal(s.itemCount(EXP_SHARE_ITEM), 1, 'el objeto clave sigue en la Mochila');
});
