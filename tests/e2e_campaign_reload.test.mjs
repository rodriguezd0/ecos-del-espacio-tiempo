import test from 'node:test';
import assert from 'node:assert/strict';
import { reloadProofError } from '../tools/e2e_campaign_reload.mjs';

const saved = () => ({ playerName: 'QA', map: 'casa_prota_2f', x: 4, y: 5,
  flags: { game_cleared: true, b21_fin: true, b21_huevo_gael: true, b21_huevo_espera: false }, cells: Array(100).fill('cell'), cores: ['N1','N2','N3','N4','N5'],
  fragments: Array.from({ length: 10 }, (_, i) => `F${String(i + 1).padStart(2, '0')}`), pokemon: [{ species: 'ZYGARDE', level: 70 }], tablets: Array(18).fill('plate'),
  partyFull: [{ species: 'ZYGARDE', egg: false }, { species: 'LITTEN', egg: true, eggSteps: 1000 }],
  boxedPokemon: [{ species: 'TORTERRA', level: 70, egg: false }], vars: { gael_starter: 'LITTEN', p9_choice: 'DIALGA' },
  money: 1000, bag: { POTION: 2 }, keyItems: ['ZYGARDECUBE'],
  zygarde: { form: 'complete', jump: true, anchor: true }, abilities: { jump: true, anchor: true },
});

test('campaign reload: the rival egg, stored Pokémon and real axis choice survive loading', () => {
  const before = saved();
  for (const change of [s => { s.flags.b21_huevo_gael = false; }, s => { s.flags.b21_huevo_espera = true; },
    s => { s.partyFull[1].egg = false; }, s => { s.partyFull[1].species = 'SOBBLE'; },
    s => { s.boxedPokemon.push({ species: 'LITTEN', egg: true }); },
    s => { s.vars.gael_starter = 'SOBBLE'; }, s => { s.vars.p9_choice = 'PALKIA'; }]) {
    const after = structuredClone(before); change(after);
    assert.ok(reloadProofError(before, after, 'QA'), 'must reject a changed epilogue or stored gift');
  }
});

test('campaign reload: nine unchanged fragments cannot certify the complete campaign', () => {
  const before = saved(); before.fragments.pop();
  assert.match(reloadProofError(before, structuredClone(before), 'QA') || '', /fragmentos/i);
});

test('campaign reload: final save preserves the collection, inventory, team and capabilities', () => {
  const before = saved();
  assert.equal(reloadProofError(before, structuredClone(before), 'QA'), null);
  for (const change of [s => { s.playerName = 'another'; }, s => { s.flags.b21_fin = false; },
    s => { s.x++; }, s => { s.cells.pop(); }, s => { s.cores.pop(); },
    s => { s.fragments.push('F02'); }, s => { s.pokemon[0].level--; }, s => { s.tablets.pop(); },
    s => { s.money--; }, s => { s.bag.POTION--; }, s => { s.keyItems.pop(); },
    s => { s.zygarde.form = '50'; }, s => { s.zygarde.jump = false; }, s => { s.zygarde.anchor = false; },
    s => { s.abilities.jump = false; }]) {
    const after = structuredClone(before); change(after);
    assert.ok(reloadProofError(before, after, 'QA'), 'must reject a changed saved field');
  }
});
