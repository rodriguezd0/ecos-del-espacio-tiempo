import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from './battle_helpers.mjs';
import { createPokemon, evolutionTarget } from '../game/src/battle/core/pokemon.js';
import { useItemOnPokemon, evolvedPokemon } from '../game/src/ui/logic/fieldItems.js';

test('Wurmple: el nivel 7 y los bits altos de personalidad fijan Silcoon o Cascoon', () => {
  for (const [personality,target] of [[0,'SILCOON'],[0x0004ffff,'SILCOON'],[0x00050000,'CASCOON'],[0x0009ffff,'CASCOON'],[0x000a0000,'SILCOON'],[0xffffffff,'CASCOON']]) {
    const p={...createPokemon(db,'WURMPLE',6,{rng:()=>0.5}),personality};
    assert.equal(evolutionTarget(db,p,{trigger:'level'}),null);
    const result=useItemOnPokemon(db,'RARECANDY',p);
    assert.equal(result.pokemon.level,7);
    assert.equal(result.evolveTo,target);
    assert.equal(result.pokemon.personality,personality);
    assert.equal(evolutionTarget(db,result.pokemon,{trigger:'item',item:'OVALSTONE'}),null);
    assert.equal(evolutionTarget(db,result.pokemon,{trigger:'trade'}),null);
  }
});

test('Wurmple: la personalidad nueva queda serializada y la copia evolucionada la conserva', () => {
  const p=createPokemon(db,'WURMPLE',7,{rng:()=>0.2});
  assert.ok(Number.isInteger(p.personality)&&p.personality>=0&&p.personality<=0xffffffff);
  const restored=JSON.parse(JSON.stringify(p));
  assert.equal(evolutionTarget(db,restored),evolutionTarget(db,p));
  const evolved=evolvedPokemon(db,p,evolutionTarget(db,p)).pokemon;
  assert.equal(evolved.personality,p.personality);
  assert.equal(createPokemon(db,'WURMPLE',7,{rng:()=>0.5,personality:0}).personality,0);
  for(const personality of [-1,0x100000000,1.5,NaN,'5'])assert.throws(()=>createPokemon(db,'WURMPLE',7,{rng:()=>0.5,personality}),/personalidad/i);
});

test('Wurmple: los guardados anteriores sin personalidad mantienen una rama estable sin mutaciones', () => {
  const fresh=createPokemon(db,'WURMPLE',7,{rng:()=>0.5});
  const {personality,...old}=fresh; const before=JSON.stringify(old);
  const target=evolutionTarget(db,old);
  assert.ok(['SILCOON','CASCOON'].includes(target));
  assert.equal(evolutionTarget(db,JSON.parse(before)),target);
  assert.equal(evolutionTarget(db,{...old,level:9}),target);
  assert.equal(JSON.stringify(old),before);
});

test('Happiny: Caramelo Raro con Piedra Oval equipada evoluciona de día y consume la piedra al aceptar', () => {
  const p=createPokemon(db,'HAPPINY',10,{rng:()=>0.5,heldItem:'OVALSTONE'});
  const before=JSON.stringify(p);
  assert.equal(useItemOnPokemon(db,'RARECANDY',p,{isDay:false}).evolveTo,undefined);
  assert.equal(useItemOnPokemon(db,'RARECANDY',{...p,heldItem:null},{isDay:true}).evolveTo,undefined);
  assert.equal(useItemOnPokemon(db,'RARECANDY',{...p,heldItem:'ORANBERRY'},{isDay:true}).evolveTo,undefined);
  assert.equal(evolutionTarget(db,p,{trigger:'item',item:'OVALSTONE',isDay:true}),null);
  assert.equal(evolutionTarget(db,p,{trigger:'trade',isDay:true}),null);
  const result=useItemOnPokemon(db,'RARECANDY',p,{isDay:true});
  assert.equal(result.evolveTo,'CHANSEY');
  assert.equal(result.pokemon.heldItem,'OVALSTONE','cancelar conserva el objeto');
  const evolved=evolvedPokemon(db,result.pokemon,result.evolveTo).pokemon;
  assert.equal(evolved.species,'CHANSEY');assert.equal(evolved.heldItem,null);
  assert.equal(JSON.stringify(p),before);
});

test('La variante NightHoldItem exige noche y tampoco se dispara al usar o intercambiar el objeto', () => {
  const nocturnal={...db,species:{...db.species,HAPPINY:{...db.species.HAPPINY,evolutions:[['CHANSEY','NightHoldItem','OVALSTONE']]}}};
  const p=createPokemon(nocturnal,'HAPPINY',10,{rng:()=>0.5,heldItem:'OVALSTONE'});
  assert.equal(evolutionTarget(nocturnal,p,{isDay:true}),null);
  assert.equal(evolutionTarget(nocturnal,p,{isDay:false}),'CHANSEY');
  assert.equal(evolutionTarget(nocturnal,p,{isDay:undefined}),null);
  assert.equal(evolutionTarget(nocturnal,p,{trigger:'item',item:'OVALSTONE',isDay:false}),null);
  assert.equal(evolutionTarget(nocturnal,p,{trigger:'trade',isDay:false}),null);
  assert.equal(evolutionTarget(nocturnal,{...p,heldItem:'ORANBERRY'},{isDay:false}),null);
  assert.equal(evolvedPokemon(nocturnal,p,'CHANSEY').pokemon.heldItem,null);
});

test('Evolucionar por nivel u objeto usado conserva otros objetos equipados', () => {
  const p=createPokemon(db,'TURTWIG',18,{rng:()=>0.5,heldItem:'ORANBERRY'});
  assert.equal(evolvedPokemon(db,p,'GROTLE').pokemon.heldItem,'ORANBERRY');
  const eevee=createPokemon(db,'EEVEE',10,{rng:()=>0.5,heldItem:'OVALSTONE'});
  assert.equal(evolvedPokemon(db,eevee,'VAPOREON').pokemon.heldItem,'OVALSTONE');
});
