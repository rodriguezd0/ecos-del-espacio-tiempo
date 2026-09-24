// Mensajes de combate al estilo Essentials: carteles de habilidad y aviso único de derrota.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, mon, play } from './battle_helpers.mjs';
import { BLACKOUT_TEXT } from '../game/src/battle/core/constants.js';
import { whiteoutText } from '../game/src/battle/scene/results.js';

const wild = (player, foe, extra = {}) => ({ type: 'wild', player: { party: player }, opponent: { party: foe }, ...extra });
const count = (list, pred) => list.filter(pred).length;

test('Espesura, Mar Llamas, Torrente y Enjambre no muestran cartel ni mensaje (Essentials)', async () => {
  for (const [species, ability] of [['TURTWIG', 'OVERGROW'], ['CHIMCHAR', 'BLAZE'], ['PIPLUP', 'TORRENT'], ['SCYTHER', 'SWARM']]) {
    assert.ok(db.species[species].abilities.includes(ability), `${species} tiene ${ability}`);
    const p = mon(species, 30, ['SPLASH']);
    const third = Math.floor(p.hp / 3);
    // Entra por encima (baja de 1/3 con los golpes) o ya por debajo: ni al entrar ni al bajar sale nada.
    for (const hp of [third + 6, third - 1]) {
      const { ui } = await play(wild([{ ...p, hp }], [mon('RATTATA', 3, ['TACKLE'])]),
        { script: Array.from({ length: 4 }, () => ({ action: 'fight', move: 'SPLASH' })), stopAfterScript: true });
      assert.equal(count(ui.messages, (m) => /activad/.test(m)), 0, `${ability}: ${ui.messages.join(' | ')}`);
      assert.equal(count(ui.events, (e) => e.type === 'ability' && e.battler === 0), 0, `${ability}: sin cartel`);
    }
  }
});

test('Intimidación muestra su cartel una sola vez por activación', async () => {
  const { ui } = await play(wild([mon('GROWLITHE', 30, ['SPLASH'], { abilityIndex: 0 })], [mon('RATTATA', 30, ['TAILWHIP'])]),
    { script: [{ action: 'fight', move: 'SPLASH' }, { action: 'fight', move: 'SPLASH' }], stopAfterScript: true });
  const splashes = ui.events.filter((e) => e.type === 'ability' && e.battler === 0);
  assert.equal(splashes.length, 1, JSON.stringify(splashes));
  assert.equal(splashes[0].ability, 'INTIMIDATE');
});

test('derrota: «¡Estás fuera de combate!» sale una vez y el mapa no lo repite', async () => {
  const { result, ui } = await play(wild([{ ...mon('TURTWIG', 5, ['SPLASH']), hp: 1 }], [mon('RATTATA', 40, ['TACKLE'])]),
    { script: [{ action: 'fight', move: 'SPLASH' }] });
  assert.equal(result.outcome, 'lose');
  assert.equal(count(ui.messages, (m) => m === BLACKOUT_TEXT), 1, ui.messages.join(' | '));
  assert.equal(result.blackedOut, true);
  assert.equal(whiteoutText(result), null, 'el mapa no añade otro aviso');
  assert.equal(whiteoutText({ outcome: 'lose' }), BLACKOUT_TEXT, 'si el combate no lo dijo, lo dice el mapa');
});

test('derrota permitida (canLose): sin aviso de fuera de combate', async () => {
  const { result, ui } = await play(wild([{ ...mon('TURTWIG', 5, ['SPLASH']), hp: 1 }], [mon('RATTATA', 40, ['TACKLE'])],
    { rules: { canLose: true } }), { script: [{ action: 'fight', move: 'SPLASH' }] });
  assert.equal(result.outcome, 'lose');
  assert.equal(result.blackedOut, false);
  assert.equal(count(ui.messages, (m) => m === BLACKOUT_TEXT), 0);
});
