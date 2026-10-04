import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';
import { db } from './battle_helpers.mjs';
import { EXPEDITIONS, activate } from '../game/src/content/events/b24_registry.js';
import { LEGENDS, speciesExpedition, encounterCondition, encounterRequest, partyHas, learnedMoves } from '../game/src/content/events/b24_conditions.js';
const stateFor = (species) => {
  const id = speciesExpedition(species); const s = GameState.create({ name: 'Axis' });
  for (const f of ['game_cleared','b21_fin','dlc2_registro_abierto']) s.setFlag(f);
  for (const e of EXPEDITIONS.filter((e) => e.id !== id).slice(0, 12)) s.setFlag('dlc2_' + e.id + '_hallazgo');
  assert.equal(activate(s, id), 'ok'); s.setFlag('dlc2_' + id + '_indicio'); s.setFlag('dlc2_' + id + '_confirmada'); return s;
};
const party = (s, ids) => s.setParty(ids.map((id) => createPokemon(db, id, 75, { rng: () => 0.5 })));
for (const species of Object.keys(LEGENDS)) test('B24: ' + species + ' no se captura antes del postgame ni sin confirmar la hipótesis', () => {
  const s = GameState.create({ name: 'Axis' }); assert.equal(encounterCondition(s, species), 'story');
  const r = stateFor(species); r.setFlag('dlc2_' + speciesExpedition(species) + '_confirmada', false);
  assert.equal(encounterCondition(r, species), 'hypothesis');
});
test('B24: desconocidos e IDs malformados no crean peticiones de combate', () => {
  for (const id of ['constructor', '__proto__', {}, null, 'MISSING']) { assert.equal(speciesExpedition(id), null); assert.equal(encounterCondition(stateFor('MEW'), id), 'unknown'); assert.throws(() => encounterRequest(id)); }
});
test('B24: Mew necesita tres informes distintos y Celebi sigilo más baya', () => {
  const s = stateFor('MEW'); s.setVar('dlc2_mew_informes', ['ruta_1','ruta_1','ruta_2']); assert.equal(encounterCondition(s, 'MEW'), 'reports');
  s.setVar('dlc2_mew_informes', ['ruta_1','ruta_2','ruta_4']); assert.equal(encounterCondition(s, 'MEW'), 'ready');
  const c = stateFor('CELEBI'); c.setVar('dlc2_celebi_sigilo', 8); assert.equal(encounterCondition(c,'CELEBI'), 'berry');
  c.setFlag('dlc2_celebi_baya'); assert.equal(encounterCondition(c,'CELEBI',{mounted:true}), 'stealth'); assert.equal(encounterCondition(c,'CELEBI'), 'ready');
});
test('B24: Jirachi solo de noche despejada, sin gastar el Trozo Estrella cuando falla', () => {
  const s = stateFor('JIRACHI'); s.addItem('STARPIECE');
  assert.equal(encounterCondition(s,'JIRACHI',{hour:12,weather:'none'}),'night');
  assert.equal(encounterCondition(s,'JIRACHI',{hour:22,weather:'rain'}),'clear');
  assert.equal(encounterCondition(s,'JIRACHI',{hour:22,weather:'none'}),'star');
  assert.equal(s.itemCount('STARPIECE'),1); s.setFlag('dlc2_jirachi_estrella'); assert.equal(encounterCondition(s,'JIRACHI',{hour:22,weather:'none'}),'ready');
});
test('B24: Keldeo y Kyurem requieren sus compañeros propios despiertos y sin huevos', () => {
  const s = stateFor('KELDEO'); party(s,['COBALION','TERRAKION','VIRIZION']); assert.equal(encounterCondition(s,'KELDEO'),'ready');
  s.setParty(s.party.map((p,i)=>i===0?{...p,egg:true}:p)); assert.equal(encounterCondition(s,'KELDEO'),'swords');
  const k=stateFor('KYUREM'); party(k,['RESHIRAM','ZEKROM']); assert.equal(encounterCondition(k,'KYUREM'),'ready');
  k.setParty(k.party.map((p,i)=>i===1?{...p,hp:0}:p)); assert.equal(encounterCondition(k,'KYUREM'),'ideals');
});
test('B24: Meloetta exige Canto aprendido con PP al atardecer', () => {
  const s=stateFor('MELOETTA'); const p=createPokemon(db,'JIGGLYPUFF',70,{moves:['SING'],rng:()=>0.5}); s.setParty([p]);
  assert.equal(encounterCondition(s,'MELOETTA',{db,hour:18}),'ready'); assert.equal(encounterCondition(s,'MELOETTA',{db,hour:22}),'dusk');
  s.setParty([{...p,moves:[{id:'SING',pp:0,totalPP:15}]}]); assert.equal(encounterCondition(s,'MELOETTA',{db,hour:18}),'sing');
});
test('B24: Xerneas/Yveltal no se confunden con especies vistas ni otros contadores', () => {
  const s=stateFor('XERNEAS'); s.registerSeen('XERNEAS'); s.setVar('dlc2_xerneas_pasos',299); assert.equal(encounterCondition(s,'XERNEAS'),'steps');
  s.setVar('dlc2_xerneas_pasos',300); assert.equal(encounterCondition(s,'XERNEAS'),'ready');
  const y=stateFor('YVELTAL'); y.setVar('dlc2_yveltal_racha',9); assert.equal(encounterCondition(y,'YVELTAL'),'streak');
  y.setVar('dlc2_yveltal_racha',10); assert.equal(encounterCondition(y,'YVELTAL'),'ready');
});
test('B24: todas las Ultrazonas necesitan el viajero y su regla propia; Necrozma espera once especies', () => {
  for(const species of ['NIHILEGO','BUZZWOLE','PHEROMOSA','XURKITREE','CELESTEELA','KARTANA','GUZZLORD','STAKATAKA','BLACEPHALON','POIPOLE']) {
    const s=stateFor(species); assert.equal(encounterCondition(s,species),'traveler'); party(s,['SOLGALEO']);
    assert.equal(encounterCondition(s,species),'ultraRule'); s.setFlag('dlc2_'+speciesExpedition(species)+'_prueba'); assert.equal(encounterCondition(s,species),'ready');
  }
  const n=stateFor('NECROZMA'); assert.equal(encounterCondition(n,'NECROZMA'),'ultras');
  for(const species of ['NIHILEGO','BUZZWOLE','PHEROMOSA','XURKITREE','CELESTEELA','KARTANA','GUZZLORD','STAKATAKA','BLACEPHALON','POIPOLE','NAGANADEL'])n.registerCaught(species);
  assert.equal(encounterCondition(n,'NECROZMA'),'ready');
});
test('B24: captura nunca reaparece y un KO espera un descanso; perder y huir permiten reintento', () => {
  const s=stateFor('SHAYMIN'); s.setVar('dlc2_shaymin_descanso',0); assert.equal(encounterCondition(s,'SHAYMIN'),'resting');
  s.setVar('rest_count',1); assert.equal(encounterCondition(s,'SHAYMIN'),'ready'); s.setFlag('dlc2_shaymin_capturado'); assert.equal(encounterCondition(s,'SHAYMIN'),'caught');
});
test('B24: huevos y debilitados no ejecutan movimientos ni cumplen compañeros', () => {
  const s=stateFor('MELOETTA'); const p=createPokemon(db,'JIGGLYPUFF',70,{moves:['SING'],rng:()=>0.5});
  s.setParty([{...p,egg:true},{...p,hp:0}]); assert.deepEqual(learnedMoves(s,db,{ids:['SING']}),[]); assert.equal(partyHas(s,'JIGGLYPUFF'),false);
});
test('B24: peticiones individuales permiten Balls/huida/objetos y niveles válidos de catálogo', () => {
  for(const species of Object.keys(LEGENDS)){const r=encounterRequest(species); assert.equal(r.type,'wild'); assert.equal(r.noCoop,true); assert.equal(r.wild.species,species); assert.ok(db.species[species]); assert.ok(r.wild.level>=49&&r.wild.level<=80); assert.ok(!r.rules?.sealedBag); assert.notEqual(r.rules?.canCatch,false); assert.notEqual(r.rules?.canRun,false);}
});
