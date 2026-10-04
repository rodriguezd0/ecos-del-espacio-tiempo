import test from 'node:test';
import assert from 'node:assert/strict';
import { db as base } from './battle_helpers.mjs';
import { auditObtainability, loadRegisteredMaps, collectWildMethods, collectScriptedMethods, collectItemSources, renderReport } from '../tools/audit_pokedex.mjs';
import { MAPS } from '../game/src/content/maps/index.js';
import { clerkEvent } from '../game/src/content/services/shop.js';
import { GameState } from '../game/src/core/state.js';
import { unchosenStarter } from '../game/src/content/events/b04_common.js';
import { gaelEggSpecies, giveGaelEgg } from '../game/src/content/events/b21_epilogo.js';
import { F as B21 } from '../game/src/content/events/b21_common.js';
import { encounterCondition, capturedFlag } from '../game/src/content/events/b24_conditions.js';
import { useItemOnPokemon, evolvedPokemon } from '../game/src/ui/logic/fieldItems.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { main, runAudit } from '../tools/audit_pokedex.mjs';

const dex = (...ids) => ids.map((id, i) => ({ n: i + 1, id, group: 'general' }));
const map = (id, rows) => ({ id, encounters: { grass: rows }, events: [] });
const audit = (ids, maps, extra = {}) => auditObtainability({ db: base, dex: dex(...ids), maps, ...extra });
const row = (r, id) => r.rows.find(r => r.id === id);

test('auditor: el índice efectivo excluye mapas de desarrollo y módulos no registrados', async () => {
  const registry = { real: async () => ({ default: map('real', [[100, 'STARLY', 4]]) }),
    dev_test: async () => ({ default: map('dev_test', [[100, 'MEW', 70]]) }) };
  const maps = await loadRegisteredMaps(registry);
  assert.deepEqual(maps.map(m => m.id), ['real']);
  const r = audit(['STARLY', 'MEW'], maps);
  assert.equal(row(r, 'STARLY').status, 'obtainable');
  assert.equal(row(r, 'MEW').status, 'missing');
});

test('auditor: no cuenta equipos de entrenadores, exhibiciones ni encuentros sin captura', () => {
  const maps = [{ ...map('ruta', [[100, 'STARLY', 4]]), trainers: [{ party: [{ species: 'MEW', level: 70 }] }] }];
  const methods = [{ kind: 'capture', species: 'MEW', map: 'ruta', eventId: 'eco', request: { type: 'wild', wild: { species: 'MEW', level: 70 }, rules: { canCatch: false } } },
    { kind: 'capture', species: 'MEW', map: 'ruta', eventId: 'copias', request: { type: 'wild', wild: { species: 'MEW', level: 70 }, exhibition: true } }];
  assert.equal(row(audit(['MEW'], maps, { methods }), 'MEW').status, 'missing');
});

test('auditor: analiza zonas y pesca; peso cero y tabla sin consumidor no prueban obtención', () => {
  const maps = [{ id: 'lagos', encounters: { cave: [[0, 'MEW', 70]], unknown: [[100, 'CELEBI', 70]] },
    encounterZones: [{ x0: 0, x1: 4, y0: 0, y1: 4, encounters: { fish_good: [[100, 'FEEBAS', 20, 25]] } }] }];
  const methods = collectWildMethods(maps, base);
  assert.deepEqual(methods.map(m => m.species), ['FEEBAS']);
  const r = audit(['FEEBAS', 'MEW', 'CELEBI'], maps);
  assert.equal(row(r, 'FEEBAS').status, 'obtainable');
  assert.equal(row(r, 'MEW').status, 'missing');
  assert.equal(row(r, 'CELEBI').status, 'missing');
});

test('auditor: una piedra en items.json no demuestra que esté distribuida', () => {
  const maps = [map('ruta', [[100, 'ROSELIA', 20]])];
  const before = audit(['ROSELIA', 'ROSERADE'], maps);
  assert.equal(row(before, 'ROSERADE').status, 'missing');
  assert.ok(row(before, 'ROSERADE').blocked.some(b => b.reason === 'missing_item' && b.resource === 'SHINYSTONE'));
  const after = audit(['ROSELIA', 'ROSERADE'], maps, { resources: [{ id: 'SHINYSTONE', map: 'ruta', source: 'tienda real' }] });
  assert.equal(row(after, 'ROSERADE').status, 'obtainable');
  assert.ok(row(after, 'ROSERADE').methods.some(m => m.kind === 'evolution' && m.from === 'ROSELIA'));
});

test('auditor: respeta la forma capturable del progenitor en la evolución a Clodsire', () => {
  assert.equal(row(audit(['CLODSIRE'], [map('ruta', [[100, 'WOOPER', 20]])]), 'CLODSIRE').status, 'missing');
  assert.equal(row(audit(['CLODSIRE'], [map('ruta', [[100, 'WOOPER', 20, 20, 1]])]), 'CLODSIRE').status, 'obtainable');
});

test('auditor: un método desconocido del motor queda bloqueado aunque el dato exista', () => {
  const db = { ...base, species: { ...base.species, WURMPLE: { ...base.species.WURMPLE, evolutions: [['SILCOON', 'UnimplementedAuditMethod', 7]] } } };
  const r = audit(['WURMPLE', 'SILCOON'], [map('ruta', [[100, 'WURMPLE', 4]])], { db });
  assert.equal(row(r, 'SILCOON').status, 'missing');
  assert.ok(row(r, 'SILCOON').blocked.some(b => b.reason === 'unsupported_method'));
});

test('auditor: las evoluciones NightHoldItem usan la noche real y el objeto distribuido', () => {
  const db = { ...base, species: { ...base.species, HAPPINY: { ...base.species.HAPPINY,
    evolutions: [['CHANSEY','NightHoldItem','OVALSTONE']] } } };
  const maps = [map('ruta',[[100,'HAPPINY',5]])];
  const resources = [{ id:'OVALSTONE',map:'ruta',source:'regalo real' }];
  const r = audit(['HAPPINY','CHANSEY'],maps,{db,resources});
  assert.equal(row(r,'CHANSEY').status,'obtainable');
  assert.ok(row(r,'CHANSEY').methods.some(m => m.method === 'NightHoldItem' && m.resource === 'OVALSTONE'));
});

test('auditor: usa compatibilidad y huevo reales para Togepi y Phione con Ditto', () => {
  const maps = [map('ruta', [[100, 'TOGETIC', 30], [100, 'DITTO', 50], [100, 'MANAPHY', 50]])];
  assert.equal(row(audit(['TOGEPI', 'PHIONE'], maps), 'PHIONE').status, 'missing');
  const r = audit(['TOGEPI', 'PHIONE'], maps, { daycare: true });
  assert.equal(row(r, 'TOGEPI').status, 'obtainable');
  assert.equal(row(r, 'PHIONE').status, 'obtainable');
  assert.ok(row(r, 'PHIONE').methods.some(m => m.kind === 'breeding' && m.parents.includes('MANAPHY') && m.parents.includes('DITTO')));
});

test('auditor: fósiles necesitan recurso y evento registrado, sin regalar por la mera tabla', () => {
  const maps = [map('museo', [])];
  const methods = [{ kind: 'fossil', species: 'CRANIDOS', map: 'museo', eventId: 'paleontologo', requires: ['SKULLFOSSIL'] }];
  assert.equal(row(audit(['CRANIDOS'], maps, { methods }), 'CRANIDOS').status, 'missing');
  assert.equal(row(audit(['CRANIDOS'], maps, { methods, resources: [{ id: 'SKULLFOSSIL', map: 'museo', source: 'regalo' }] }), 'CRANIDOS').status, 'obtainable');
  assert.equal(row(audit(['CRANIDOS'], maps, { methods: methods.map(m => ({ ...m, map: 'no_registrado' })), resources: [{ id: 'SKULLFOSSIL', map: 'museo', source: 'regalo' }] }), 'CRANIDOS').status, 'missing');
});

test('auditor: el intercambio se comprueba con el objeto propio disponible y se señala su dependencia', () => {
  const maps = [map('ruta', [[100, 'CLAMPERL', 50]])];
  const resources = [{ id: 'DEEPSEATOOTH', map: 'ruta', source: 'tienda real' }];
  // Aísla la rama de intercambio: Añil también permite Huntail por nivel 40.
  const db = { ...base, species: { ...base.species, CLAMPERL: { ...base.species.CLAMPERL,
    evolutions: base.species.CLAMPERL.evolutions.filter(([, m, p]) => m === 'TradeItem' && p === 'DEEPSEATOOTH') } } };
  assert.equal(row(audit(['HUNTAIL'], maps, { db, resources, allowTrade: false }), 'HUNTAIL').status, 'missing');
  const r = audit(['HUNTAIL'], maps, { db, resources, allowTrade: true });
  assert.equal(row(r, 'HUNTAIL').status, 'obtainable');
  assert.ok(row(r, 'HUNTAIL').methods.some(m => m.requiresOnline));
});

test('auditor: valida IDs/duplicados sin mutar catálogo, mapas ni recursos', () => {
  const maps = [map('ruta', [[100, 'STARLY', 4]])], before = JSON.stringify(maps);
  const r = audit(['STARLY'], maps);
  assert.equal(JSON.stringify(maps), before);
  assert.throws(() => auditObtainability({ db: base, dex: dex('STARLY', 'STARLY'), maps }), /duplicad/i);
  assert.throws(() => auditObtainability({ db: base, dex: dex('__proto__'), maps }), /especie|ID/i);
  assert.match(renderReport(r), /STARLY/);
});

test('auditor: el adaptador legendario necesita su evento real, no basta importar el catálogo', async () => {
  const real = await loadRegisteredMaps({ b24_santuario_neblino: MAPS.b24_santuario_neblino });
  const methods = await collectScriptedMethods(real, base);
  assert.ok(methods.some(m => m.species === 'CELEBI' && m.request.type === 'wild' && m.eventId === 'dlc2_celebi'));
  assert.deepEqual(await collectScriptedMethods(real.map(m => ({ ...m, events: [] })), base), []);
});

test('auditor: lee el stock del dependiente real y distingue entrega de objeto de mera mención', async () => {
  const maps = [{ id: 'tienda', events: [clerkEvent({ x: 2, y: 2, items: ['SHINYSTONE', 'WATERSTONE'] }),
    { id: 'pista', script: async ctx => ctx.say('DAWNSTONE') },
    { id: 'regalo', script: async ctx => ctx.giveItem('DUSKSTONE', 1) }] }];
  const resources = await collectItemSources(maps, base);
  assert.deepEqual([...new Set(resources.map(r => r.id))].sort(), ['DUSKSTONE', 'SHINYSTONE', 'WATERSTONE']);
  assert.ok(resources.find(r => r.id === 'SHINYSTONE').source.includes('openShop'));
});

test('auditor: las casillas especiales de Feebas se consultan en el mapa registrado', async () => {
  const maps = await loadRegisteredMaps({ lagos_alma: MAPS.lagos_alma });
  assert.ok(!collectWildMethods(maps, base).some(m => m.species === 'FEEBAS'));
  const methods = await collectScriptedMethods(maps, base, { state: GameState.create() });
  const feebas = methods.find(m => m.species === 'FEEBAS');
  assert.equal(feebas.kind, 'fishing');
  assert.match(feebas.source, /fishingAt/);
  assert.ok(Number.isInteger(feebas.at.x) && Number.isInteger(feebas.at.y));
});

test('auditor: Bramaluna se cuenta por su combate real en la Fosa, nunca por el eco del Pilar', async () => {
  const ids = Object.keys(MAPS).filter(id => /fosa_eco|antea_3|antea_4/.test(id));
  const maps = await loadRegisteredMaps(Object.fromEntries(ids.map(id => [id, MAPS[id]])));
  const methods = (await collectScriptedMethods(maps, base)).filter(m => m.species === 'ROARINGMOON');
  assert.ok(methods.length >= 1);
  assert.ok(methods.every(m => m.map === 'fosa_eco' && m.eventId === 'bramaluna_real' && m.request.rules?.canCatch !== false));
});

test('auditor: los tres iniciales se reúnen en la misma partida por elección, regalo P2 y huevo de Gael', async () => {
  const maps = await loadRegisteredMaps(Object.fromEntries(['laboratorio_alerce','ciudad_caudal','casa_gael'].map(id => [id,MAPS[id]])));
  for (const starter of ['TURTWIG','LITTEN','SOBBLE']) {
    const state = GameState.create(); state.setVar('starter',starter);
    state.addPokemon(createPokemon(base,starter,5,{rng:()=>0.5}));
    const unchosen = unchosenStarter(state), gael = gaelEggSpecies(state);
    assert.equal(new Set([starter,unchosen,gael]).size,3);
    state.addPokemon(createPokemon(base,unchosen,15,{rng:()=>0.5}));
    assert.equal(await giveGaelEgg({state,db:base,flag:k=>state.flag(k),setFlag:(k,v=true)=>state.setFlag(k,v),say:async()=>{}}),true);
    assert.equal(state.flag(B21.gaelEggGiven),true);
    assert.equal(state.party.at(-1).egg,true);
    assert.deepEqual(new Set(state.party.map(p=>p.species)),new Set(['TURTWIG','LITTEN','SOBBLE']));
    const methods = await collectScriptedMethods(maps,base,{state});
    assert.ok(methods.some(m=>m.species===unchosen&&m.map==='ciudad_caudal'));
    assert.ok(methods.some(m=>m.species===gael&&m.map==='casa_gael'&&m.kind==='egg'));
  }
});

test('auditor: cualquiera de las dos piedras de Cosmoem permite obtener la otra luz en Cumbre', () => {
  for(const [item,mine,other,hour] of [['SHINYSTONE','SOLGALEO','LUNALA',22],['DUSKSTONE','LUNALA','SOLGALEO',12]]) {
    const state = GameState.create();
    for(const flag of ['game_cleared','b21_fin','dlc2_registro_abierto','dlc2_soluna_confirmada'])state.setFlag(flag);
    state.setVar('dlc2_activas',['soluna']);state.data.clock.minutes=hour*60;
    const p=createPokemon(base,'COSMOEM',43,{rng:()=>0.5});
    assert.equal(encounterCondition(state,other),'otherLight');
    assert.equal(useItemOnPokemon(base,item,p).evolveTo,mine);
    state.addPokemon(evolvedPokemon(base,p,mine).pokemon);
    assert.equal(encounterCondition(state,other),'ready');
    state.setFlag(capturedFlag(other));
    assert.equal(encounterCondition(state,other),'caught');
  }
});

test('auditor: cualquiera de los elegidos P9 vuelve tras descansar y permite capturar al otro en Columna', async () => {
  const { F, V, OTHER, chosenWaiting } = await import('../game/src/content/events/b18_common.js');
  const { platformState } = await import('../game/src/content/events/b22a_columna.js');
  const maps = await loadRegisteredMaps(Object.fromEntries(['camara_cruce_nucleo','columna_lanza'].map(id => [id,MAPS[id]])));
  const methods = await collectScriptedMethods(maps,base);
  for (const chosen of ['DIALGA','PALKIA']) {
    const state = GameState.create();
    for (const flag of ['game_cleared','b21_fin',F.bound,F.restored]) state.setFlag(flag);
    state.setVar(V.choice,chosen);state.setVar(V.chosenRest,0);state.setVar(V.restCount,0);
    assert.equal(chosenWaiting(state),false);
    state.setVar(V.restCount,1);assert.equal(chosenWaiting(state),true);
    const retry = maps[0].events.find(e => e.id === 'elegido_reaparece').pages.findLast(p => p.when(state));
    assert.ok(retry?.script,'el elegido vuelve en un evento real tras el KO');
    assert.ok(methods.some(m => m.species === chosen && m.map === 'camara_cruce_nucleo' && m.eventId === 'nucleo_p9' && m.request.rules.catchCondition));
    const orb = maps[0].events.find(e => e.id === 'orbe_no_elegido').pages.findLast(p => p.when(state));
    await orb.script({ giveItem:async(id,n) => state.addItem(id,n), setFlag:(k,v=true) => state.setFlag(k,v) });
    assert.equal(platformState(state),'notCaught');
    state.addPokemon(createPokemon(base,chosen,65,{rng:() => 0.5}));
    state.setVar(V.caught,true);assert.equal(chosenWaiting(state),false);
    assert.equal(platformState(state),'ready');
    const other = methods.find(m => m.species === OTHER[chosen] && m.map === 'columna_lanza');
    assert.ok(other?.request.type === 'wild' && other.request.rules?.canCatch !== false);
  }
});

test('auditor: ambos órdenes de los Ideales reúnen Reshiram y Zekrom y abren Kyurem', async () => {
  const { chooseIdeal, forgeIdeal } = await import('../game/src/content/events/b24_actions.js');
  const maps = await loadRegisteredMaps(Object.fromEntries(['b24_dos_ideales','volcan_tizon'].map(id => [id,MAPS[id]])));
  for (const [first,second,index] of [['RESHIRAM','ZEKROM',0],['ZEKROM','RESHIRAM',1]]) {
    const state = GameState.create();
    for(const f of ['game_cleared','b21_fin','dlc2_registro_abierto','dlc2_ideales_confirmada','dlc2_kyurem_confirmada']) state.setFlag(f);
    state.setVar('dlc2_activas',['ideales','kyurem']);
    const ctx = { state,db:base,map:maps[0],say:async()=>{},choice:async()=>index,confirm:async()=>true,
      flag:k=>state.flag(k),setFlag:(k,v=true)=>state.setFlag(k,v),setVar:(k,v)=>state.setVar(k,v),
      giveItem:async(id,n=1)=>state.addItem(id,n),requestRefresh(){} };
    assert.equal(await chooseIdeal(ctx),true);
    assert.equal(encounterCondition(state,first),'ready');assert.equal(encounterCondition(state,second),'choice');
    ctx.map=maps[1];assert.equal(await forgeIdeal(ctx),false,'no forja antes de la primera captura');
    state.addPokemon(createPokemon(base,first,75,{rng:()=>0.5}));state.setFlag(capturedFlag(first));
    assert.equal(await forgeIdeal(ctx),true);ctx.map=maps[0];ctx.choice=async()=>0;
    assert.equal(await chooseIdeal(ctx),true);assert.equal(encounterCondition(state,second),'ready');
    state.addPokemon(createPokemon(base,second,75,{rng:()=>0.5}));state.setFlag(capturedFlag(second));
    assert.equal(encounterCondition(state,'KYUREM'),'ready');
    assert.equal(await chooseIdeal(ctx),false,'no repite capturados');
    assert.deepEqual(new Set(state.party.map(p=>p.species)),new Set(['RESHIRAM','ZEKROM']));
  }
});

test('auditor: catálogo completo registrado conserva 425 rutas sin depender de online', async () => {
  const fs = await import('node:fs');
  const entries = JSON.parse(fs.readFileSync(new URL('../game/data/dex_axis.json',import.meta.url))).entries;
  const r=await runAudit({registry:MAPS,db:base,dex:entries,allowTrade:false});
  assert.equal(r.summary.total,425);assert.equal(r.summary.obtainable,425);
  assert.equal(r.missing.length,0);assert.equal(r.summary.daycare,true);
  assert.ok(r.rows.every(e=>e.methods.some(m=>!m.requiresOnline)));
});

test('auditor: la CLI valida opciones y no permite escribir fuera de la caché de evidencia', async () => {
  await assert.rejects(main(['--out=../escape']),/dentro/);
  await assert.rejects(main(['--unknown']),/desconocida/);
  await assert.rejects(loadRegisteredMaps({bad:async()=>({default:{id:'otro'}})}),/inválida/);
  await assert.rejects(loadRegisteredMaps({bad:7}),/inválido/);
});
