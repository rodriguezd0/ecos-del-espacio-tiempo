// Contracciones del castellano en textos compuestos (shared/spanish.js) y su uso en los mensajes del combate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contractArticles } from '../game/src/shared/spanish.js';
import { fixSpanish } from '../game/src/battle/core/battle.js';
import { BagItems } from '../game/src/battle/core/items/bagItems.js';
import { mon, play } from './battle_helpers.mjs';

test('contractArticles: de + el → del y a + el → al, con el artículo en minúscula o mayúscula', () => {
  assert.equal(contractArticles('Los PS de El Nacli rival han sido restaurados.'), 'Los PS del Nacli rival han sido restaurados.');
  assert.equal(contractArticles('Los PS de el Nacli rival'), 'Los PS del Nacli rival');
  assert.equal(contractArticles('No afecta a El Pidove salvaje...'), 'No afecta al Pidove salvaje...');
  assert.equal(contractArticles('¡Ha dañado a el Nacli aliado!'), '¡Ha dañado al Nacli aliado!');
  assert.equal(contractArticles('¡El deseo de El Togepi rival se ha hecho realidad!'), '¡El deseo del Togepi rival se ha hecho realidad!');
});

test('contractArticles: respeta la mayúscula de la preposición y el texto en mayúsculas', () => {
  assert.equal(contractArticles('A El Nacli rival no le quedan movimientos.'), 'Al Nacli rival no le quedan movimientos.');
  assert.equal(contractArticles('A el Nacli'), 'Al Nacli');
  assert.equal(contractArticles('De el bosque'), 'Del bosque');
  assert.equal(contractArticles('VUELVE DE EL BOSQUE'), 'VUELVE DEL BOSQUE');
  assert.equal(contractArticles('SE LO DIO A EL CAMPEÓN'), 'SE LO DIO AL CAMPEÓN');
});

test('contractArticles: no toca «él», palabras que contienen esas letras ni tildes/eñes vecinas', () => {
  const same = [
    'Se lo di a él.', 'Es de él.', 'Elekid de Elena', 'delante de Elgyem', 'la cuña el otro día',
    'está el Nacli', 'Estela y el Pidove', 'A Elekid le gusta', 'de Eldegoss', 'casa elegante', 'a eltor',
    'Ha usado Placaje.', '',
  ];
  for (const text of same) assert.equal(contractArticles(text), text, text);
  assert.equal(contractArticles(null), '');
  assert.equal(contractArticles(42), '42');
});

test('contractArticles es idempotente y trata cada aparición', () => {
  const once = contractArticles('De el uno a el otro, de El Nacli a El Pidove.');
  assert.equal(once, 'Del uno al otro, del Nacli al Pidove.');
  assert.equal(contractArticles(once), once);
});

test('fixSpanish del motor delega en la función común', () => {
  assert.equal(fixSpanish('Los PS de El Nacli rival'), 'Los PS del Nacli rival');
});

test('combate: la Poción del rival dice «Los PS del Nacli rival» (bagItems.js)', async () => {
  const foe = mon('NACLI', 12, ['HARDEN']);
  const lowHp = Math.max(1, Math.floor(foe.hp / 5));
  const { ui } = await play({
    type: 'trainer', player: { party: [mon('PIKACHU', 12, ['SPLASH'])] },
    opponent: { name: 'Pablo', party: [{ ...foe, hp: lowHp }], items: ['POTION'], skill: 100 },
  }, { script: [{ action: 'fight', move: 'SPLASH' }], stopAfterScript: true });
  const healed = ui.messages.find((m) => m.startsWith('Los PS '));
  assert.ok(healed, ui.messages.join(' | '));
  assert.match(healed, /^Los PS del Nacli rival han sido restaurados en \d+ puntos\.$/);
  for (const m of ui.messages) assert.doesNotMatch(m, /(^|[^\p{L}])(de|a) [Ee]l [A-ZÁÉÍÓÚ]/u, m);
});

test('combate: los objetos usados directamente sobre un combatiente rival también contraen', async () => {
  const { battle } = await play({
    type: 'wild', player: { party: [mon('PIKACHU', 12, ['SPLASH'])] }, opponent: { party: [mon('NACLI', 12, ['HARDEN'])] },
  }, { script: [], stopAfterScript: true });
  const foe = battle.battlers[1];
  foe.pokemon.hp = 1;
  foe.hp = 1;
  BagItems.POTION.use({ battle, pokemon: foe.pokemon, battler: foe, showMessages: true });
  assert.match(battle.log.at(-1), /^Los PS del Nacli salvaje han sido restaurados en \d+ puntos\.$/);
});
