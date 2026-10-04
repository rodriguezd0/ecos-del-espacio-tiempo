import test from 'node:test';
import assert from 'node:assert/strict';
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
  const {findTravelPath}=await import('../tools/e2e_campaign_routes.mjs');
  const path=await findTravelPath('brontia_centro','parque_eolico');
  assert.deepEqual(path,['villa_brontia','ruta_5','meseta_impulso','parque_eolico']);
});

test('campana: el regreso del Parque conserva sus conexiones y salir hacia el mapa actual no viaja',async()=>{
  const {findTravelPath}=await import('../tools/e2e_campaign_routes.mjs');
  assert.deepEqual(await findTravelPath('parque_eolico','brontia_centro'),['meseta_impulso','ruta_5','villa_brontia','brontia_centro']);
  assert.deepEqual(await findTravelPath('brontia_centro','brontia_centro'),[]);
});

test('campana: un retorno por portal sin puerta no inventa un acceso de entrada',async()=>{
  const {findTravelPath}=await import('../tools/e2e_campaign_routes.mjs');
  const maps={exterior:{id:'exterior'},portal:{id:'portal',warps:[{to:'exterior',tx:4,ty:5,door:false}]}};
  assert.equal(await findTravelPath('exterior','portal',async id=>maps[id]),null);
});
