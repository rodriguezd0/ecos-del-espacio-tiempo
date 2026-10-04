import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { db } from './b18_helpers.mjs';
import { applyRest } from '../game/src/world/rest.js';
import { LEGENDS, F, postgame, available, recordOutcome, partyHas, partyMove, atDawn, latiosSite } from '../game/src/content/events/b22c_common.js';

const state = () => { const s = GameState.create({ name: 'Prueba' }); s.setFlag('game_cleared'); s.setFlag('b21_fin'); return s; };
const pokemon = (sp, moves = []) => createPokemon(db, sp, 80, { moves, rng: () => 0.5 });

test('B22c: siete especies y niveles canónicos, disponibles solo después de terminar el epílogo', () => {
  assert.deepEqual(Object.values(LEGENDS).map((l) => [l.species, l.level]), [
    ['LUGIA',75],['HOOH',75],['KYOGRE',75],['GROUDON',75],['RAYQUAZA',78],['LATIAS',70],['LATIOS',70],
  ]);
  const s = state(); assert.ok(postgame(s));
  s.setFlag('b21_fin', false); assert.ok(!postgame(s));
  for (const key of Object.keys(LEGENDS)) assert.equal(available(s, key), false);
});

test('B22c: KO exige descansar, captura persiste al recargar y derrota/huida permiten volver a intentar', () => {
  for (const [key, L] of Object.entries(LEGENDS)) {
    const s = state(); assert.ok(available(s, key));
    assert.equal(recordOutcome(s,key,'lose'),'lose'); assert.ok(available(s,key));
    assert.equal(recordOutcome(s,key,'run'),'run'); assert.ok(available(s,key));
    assert.equal(recordOutcome(s,key,'win'),'beaten'); assert.equal(available(s,key),false);
    const loaded = new GameState(JSON.parse(JSON.stringify(s.data))); assert.equal(available(loaded,key),false);
    applyRest(loaded); assert.ok(available(loaded,key));
    recordOutcome(loaded,key,'caught'); assert.ok(loaded.flag(L.caught));
    assert.equal(available(new GameState(JSON.parse(JSON.stringify(loaded.data))),key),false);
  }
});

test('B22c: gates de equipo y movimientos excluyen PC/huevos y movimientos de Pokémon debilitados', () => {
  const s=state(), ky=pokemon('KYOGRE',['RAINDANCE']), gr=pokemon('GROUDON',['SUNNYDAY']);
  s.setBoxPokemon(0,0,ky); assert.equal(partyHas(s,'KYOGRE'),false); assert.equal(partyMove(s,'RAINDANCE'),null);
  s.setParty([{...ky,egg:true},gr]); assert.equal(partyHas(s,'KYOGRE'),false); assert.equal(partyMove(s,'RAINDANCE'),null);
  s.setParty([{...ky,hp:0},gr]); assert.equal(partyMove(s,'RAINDANCE'),null);
  s.setParty([ky,gr]); assert.ok(partyHas(s,'KYOGRE')); assert.equal(partyMove(s,'RAINDANCE'),0); assert.equal(partyMove(s,'SUNNYDAY'),1);
});

test('B22c: amanecer usa reloj del juego y ruta itinerante de Latios es persistente y válida', () => {
  const s=state();
  for (const [hour, ok] of [[0,false],[5,false],[6,true],[8,true],[9,false],[12,false],[23,false]]) {
    s.data.clock.minutes=hour*60; assert.equal(atDawn(s),ok,`hora${hour}`);
  }
  assert.equal(latiosSite(s),0); s.setVar('b22c_latios_ruta',2); assert.equal(latiosSite(s),2);
  assert.equal(latiosSite(new GameState(JSON.parse(JSON.stringify(s.data)))),2);
  s.setVar('b22c_latios_ruta',-99); assert.equal(latiosSite(s),0);
});
