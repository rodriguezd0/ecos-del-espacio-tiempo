import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Driver } from '../tools/e2e_b16_driver.mjs';
import { CampaignDriver } from '../tools/e2e_campaign_driver.mjs';

const snapshot = (map, x = 9, y = 7) => ({ map, x, y, healPoint: { mapId: 'caudal_centro' }, battles: [{ outcome: 'lose' }] });
const driver = () => new CampaignDriver({}, [], { outDir: '.', root: '.' });

test('campaña: una derrota durante el camino regresa por los accesos y reintenta las coordenadas originales', async () => {
  const original = Driver.prototype.walkTo, d = driver();
  let state = snapshot('garganta_albo'), calls = 0;
  const travel = [];
  d.snap = async () => state;
  d.travel = async map => { travel.push(map); state = snapshot(map); };
  Driver.prototype.walkTo = async () => { state = snapshot(++calls === 1 ? 'caudal_centro' : 'garganta_albo', 23, 36); return state; };
  try {
    assert.equal((await d.walkTo(23, 36)).map, 'garganta_albo');
    assert.deepEqual(travel, ['garganta_albo']);
    assert.equal(calls, 2);
  } finally { Driver.prototype.walkTo = original; }
});

test('campaña: entrar deliberadamente en el Centro después de perder sigue siendo una transición válida', async () => {
  const original = Driver.prototype.walkTo, d = driver();
  let state = snapshot('ciudad_caudal');
  d.snap = async () => state;
  d.travel = async () => assert.fail('Una entrada elegida no es una derrota nueva');
  Driver.prototype.walkTo = async () => { state = snapshot('caudal_centro'); return state; };
  try { assert.equal((await d.walkTo(9, 7, { stopWhen: s => s.map === 'caudal_centro' })).map, 'caudal_centro'); }
  finally { Driver.prototype.walkTo = original; }
});

test('campaña: el combate iniciado al hablar también puede regresar al Centro y debe reintentarse', async () => {
  const original = Driver.prototype.interact, d = driver();
  let state = snapshot('garganta_albo'), calls = 0;
  d.snap = async () => state;
  d.walkTo = async () => state;
  const travel = [];
  d.travel = async map => { travel.push(map); state = snapshot(map); };
  Driver.prototype.interact = async () => { state = snapshot(++calls === 1 ? 'caudal_centro' : 'garganta_albo'); return state; };
  try {
    await d.interact(23, 36, 'left');
    assert.deepEqual(travel, ['garganta_albo']);
    assert.equal(calls, 2);
  } finally { Driver.prototype.interact = original; }
});

test('campana: volver al Parque desde Brontia reconoce la puerta real del guion',async()=>{
  const {findTravelPath}=await import('../tools/e2e_campaign_routes.mjs?doors=3');
  const path=await findTravelPath('brontia_centro','parque_eolico');
  assert.deepEqual(path,['villa_brontia','ruta_5','meseta_impulso','parque_eolico']);
});

test('campana: el regreso del Parque conserva sus conexiones y salir hacia el mapa actual no viaja',async()=>{
  const {findTravelPath}=await import('../tools/e2e_campaign_routes.mjs?doors=3');
  assert.deepEqual(await findTravelPath('parque_eolico','brontia_centro'),['meseta_impulso','ruta_5','villa_brontia','brontia_centro']);
  assert.deepEqual(await findTravelPath('brontia_centro','brontia_centro'),[]);
});

test('campana: un retorno por portal sin puerta no inventa un acceso de entrada',async()=>{
  const {findTravelPath}=await import('../tools/e2e_campaign_routes.mjs?doors=3');
  const maps={exterior:{id:'exterior'},portal:{id:'portal',warps:[{to:'exterior',tx:4,ty:5,door:false}]}};
  assert.equal(await findTravelPath('exterior','portal',async id=>maps[id]),null);
});

test('campana: derrota en la base P4 regresa por Estrato, Dunas, Cerro y su puerta de guion', async () => {
  const { findTravelPath } = await import('../tools/e2e_campaign_routes.mjs?doors=3');
  assert.deepEqual(await findTravelPath('brontia_centro', 'camara_contrapesos_base'),
    ['villa_brontia', 'ruta_6', 'ciudad_estrato', 'dunas_ceniza', 'cerro_plomo', 'camara_contrapesos_base']);
});

test('campana: una puerta tras ceniza honda vuelve a calcular el camino después de montar con UI', async () => {
  const d = driver(), state = { map: 'dunas_ceniza', riding: false, abilities: { run: true } };
  let mounted = 0;
  d.snap = async () => state;
  d.eval = async (_fn, arg) => typeof arg === 'string' ? { x: 46, y: 23 }
    : Array.isArray(arg) ? state.riding ? [6, 6] : null : true;
  d.mount = async () => { mounted++; state.riding = true; };
  d.walkTo = async (x, y) => { assert.ok(state.riding); assert.deepEqual([x, y], [46, 23]); state.map = 'cerro_plomo'; };
  d.until = async check => { assert.ok(check({ ...state, ready: true })); };
  await d.exitTo('cerro_plomo');
  assert.equal(mounted, 1);
});

test('campana: el objetivo del Cerro usa el paso de las Dunas en ambos sentidos', async () => {
  const { connectionApproach, scriptEntrance } = await import('../tools/e2e_campaign_routes.mjs?doors=3');
  assert.deepEqual(connectionApproach('ciudad_estrato','dunas_ceniza'), { x: 55, y: 39 });
  assert.deepEqual(connectionApproach('dunas_ceniza','ciudad_estrato'), { x: 0, y: 21 });
  assert.equal(connectionApproach('ruta_1','villa_zaguan'), null);
  assert.equal(scriptEntrance('ruta_1','villa_zaguan'), null);
  assert.equal(scriptEntrance('cerro_plomo','camara_contrapesos_base').dir, 8);
});

test('campaña: la entrada a Lúmina reconoce el traslado canónico de la gala sin aceptar otras llegadas',async()=>{
  const d=driver(),before={map:'ruta_7',x:0,y:21},after={map:'lumina_hotel',x:13,y:10,flags:{b09_gala:true}};
  d.outDir=fs.mkdtempSync(path.join(os.tmpdir(),'campaign-edge-'));
  d.snap=async()=>before;
  d.pushUntil=async(dir,predicate)=>{
    assert.equal(dir,4);assert.ok(predicate({map:'ciudad_lumina'}));assert.ok(predicate(after));
    assert.equal(predicate({map:'lumina_centro',flags:{b09_gala:true}}),false);
    d.snap=async()=>after;return after;
  };
  const file=path.join(d.outDir,'campaign_connections.jsonl');
  try {
    await d.crossEdge(4,'ciudad_lumina',{acceptArrival:s=>s.map==='lumina_hotel'&&s.flags?.b09_gala});
    assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).after.map,'lumina_hotel');
  } finally { if(fs.existsSync(file))fs.unlinkSync(file);fs.rmdirSync(d.outDir); }
});
