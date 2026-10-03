import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { isVoidCell } from '../game/src/world/impossible/logic.js';
import { F } from '../game/src/content/events/b22a_common.js';
import { HONDA, CORAZON, CUMBRE, COLUMNA_B22A, SENDA_B22A, RED_NODES } from '../game/src/content/maps/b22a/layout.js';
import { faceVar, patternCells } from '../game/src/content/events/b22a_faces_logic.js';
import { postScript } from '../game/src/content/events/b22a_faces.js';
import { fieldCtx } from './b18_helpers.mjs';

const directions = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const key = (x, y) => `${x},${y}`;
async function field(id, { flags = [], vars = {} } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of [F.gameCleared, F.postgame, 'b21_regreso', ...flags]) state.setFlag(f);
  for (const [k, v] of Object.entries(vars)) state.setVar(k, v);
  state.setZygardeForm('complete');
  state.setZygardeAbility('anchor', true);
  const { entry, def } = await buildMapNode(id);
  const w = new World({ state });
  w.setCurrent({ ...entry, events: null });
  return { state, map: entry.map, def, w, p: w.player };
}

function reach(t, start) {
  const seen = new Set([key(start.x, start.y)]), queue = [[start.x, start.y]];
  for (let n = 0; n < queue.length; n++) {
    const [x, y] = queue[n];
    for (const [d, [dx, dy]] of Object.entries(directions)) {
      const nx = x + dx, ny = y + dy;
      if (!t.map.valid(nx, ny) || seen.has(key(nx, ny))) continue;
      if (t.def.impossible && isVoidCell(t.map, nx, ny)) continue;
      t.p.moveTo(x, y);
      if (!t.p.passable(x, y, Number(d))) continue;
      seen.add(key(nx, ny)); queue.push([nx, ny]);
    }
  }
  return { has: (x, y) => seen.has(key(x, y)), use: (x, y) => [[0, 0], ...Object.values(directions)].some(([dx, dy]) => seen.has(key(x + dx, y + dy))) };
}

test('Cumbre: escaleras, objetos y salidas tienen recorrido continuo de ida y vuelta', async () => {
  const t = await field('cumbre_azur');
  const r = reach(t, CUMBRE.arrival);
  for (const c of CUMBRE.gateCells) assert.ok(r.has(c.x, c.y), `dintel ${key(c.x, c.y)}`);
  for (const i of CUMBRE.items) assert.ok(r.use(i.x, i.y), `objeto ${i.item}`);
  for (const warp of t.def.warps) assert.ok(r.has(warp.x, warp.y), 'bajada a Senda');
  const back = reach(t, { x: CUMBRE.gateCells[1].x, y: CUMBRE.gateCells[1].y + 1 });
  assert.ok(back.has(CUMBRE.arrival.x, CUMBRE.arrival.y));
});

test('Hondura: sin anclar no hay paso; anclada, la losa une las islas y se puede regresar', async () => {
  const initial = await field('distorsion_honda');
  assert.ok(reach(initial, HONDA.arrival).use(HONDA.posts[0].x, HONDA.posts[0].y));
  assert.equal(reach(initial, HONDA.arrival).has(17, 26), false);
  const fixed = await field('distorsion_honda', { vars: { [faceVar('honda')]: 0 } });
  const r = reach(fixed, HONDA.arrival);
  assert.ok(r.has(17, 26), 'llegada a isla grande');
  assert.ok(r.use(HONDA.posts[1].x, HONDA.posts[1].y), 'poste de regreso');
  for (const i of HONDA.items.filter((i) => i.y >= 16)) assert.ok(r.use(i.x, i.y), i.item);
  assert.ok(reach(fixed, { x: 17, y: 26 }).has(HONDA.arrival.x, HONDA.arrival.y));
});

test('Corazón: las orientaciones intermedias alcanzan ambos postes laterales y el núcleo abierto', async () => {
  const west = await field('distorsion_corazon', { vars: { [faceVar('sur')]: 2 } });
  const wr = reach(west, CORAZON.arrival);
  for (const p of CORAZON.posts.filter((p) => p.face === 'oeste')) assert.ok(wr.use(p.x, p.y), 'poste oeste');
  const east = await field('distorsion_corazon', { vars: { [faceVar('sur')]: 1 } });
  for (const p of CORAZON.posts.filter((p) => p.face === 'este')) assert.ok(reach(east, CORAZON.arrival).use(p.x, p.y), 'poste este');
  // Tras abrirse, el corazón permanece abierto: se puede volver por el brazo sur→oeste y oeste→corazón.
  const opened = await field('distorsion_corazon', { flags: [F.corazonAbierto], vars: { [faceVar('sur')]: 2, [faceVar('oeste')]: 1, [faceVar('este')]: 2 } });
  const or = reach(opened, CORAZON.arrival);
  assert.ok(or.use(CORAZON.pedestal.x, CORAZON.pedestal.y), 'Griseosfera');
  assert.ok(or.use(CORAZON.giratina.x, CORAZON.giratina.y), 'Giratina');
  assert.ok(or.has(CORAZON.portalBack.x, CORAZON.portalBack.y), 'portal seguro');
});

test('anclar y soltar parcha el suelo real y conserva la orientación al cargar', async () => {
  const t = await field('distorsion_honda');
  const ctx = fieldCtx(t, { choices: [0, 0] });
  assert.equal(await postScript(ctx, HONDA.face), true);
  t.w.refreshEvents();
  for (const cell of patternCells(HONDA.face, 0)) {
    assert.equal(isVoidCell(t.map, ...cell.split(',').map(Number)), false, cell);
  }
  assert.equal(await postScript(ctx, HONDA.face), true);
  t.w.refreshEvents();
  assert.equal(isVoidCell(t.map, HONDA.face.cx, HONDA.face.cy), true);
});

test('las llegadas de Senda, Columna y Red están sobre suelo utilizable', async () => {
  for (const node of RED_NODES) {
    const t = await field(node.map, { flags: ['b01_core_found', 'p6_restored', 'p10_restored', 'b20_flauta_azur', 'b21_llegada'] });
    assert.equal(isVoidCell(t.map, node.x, node.y), false, node.id);
  }
  const s = await field('ruta_12_senda_lazo', { flags: [F.lazoAnclado] });
  const sr = reach(s, SENDA_B22A.back);
  assert.ok(sr.use(SENDA_B22A.knot.x, SENDA_B22A.knot.y), 'nudo del Lazo');
  for (const c of SENDA_B22A.up) assert.ok(sr.has(c.x, c.y), `subida ${c.x}`);
  const c = await field('columna_lanza', { flags: [F.lazoAnclado, F.otroVisto], vars: { p9_choice: 'DIALGA' } });
  assert.ok(reach(c, COLUMNA_B22A.stairs).use(COLUMNA_B22A.platform.PALKIA.x, COLUMNA_B22A.platform.PALKIA.y));
});
