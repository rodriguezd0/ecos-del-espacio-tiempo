import test from 'node:test';
import assert from 'node:assert/strict';
import { reloadProofError } from '../tools/e2e_campaign_reload.mjs';

const saved = () => ({ playerName: 'QA', map: 'casa_prota_2f', x: 4, y: 5,
  flags: { game_cleared: true, b21_fin: true }, cells: Array(100).fill('cell'), cores: ['N1','N2','N3','N4','N5'],
  fragments: ['F01'], pokemon: [{ species: 'ZYGARDE', level: 70 }], tablets: Array(18).fill('plate'),
  money: 1000, bag: { POTION: 2 }, keyItems: ['ZYGARDECUBE'],
  zygarde: { form: 'complete', jump: true, anchor: true }, abilities: { jump: true, anchor: true },
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
