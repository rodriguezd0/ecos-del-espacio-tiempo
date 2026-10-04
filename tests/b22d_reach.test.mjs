// B22d: pasabilidad real de mapas, puertas y conexiones; sin atajos ni casillas de llegada bloqueadas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMap, createEntry } from '../game/src/world/mapLoader.js';
import { buildMapNode, loadLibrary, tilesetDB, isEmptyFor, anilMapLoader } from '../tools/lib/map_node.mjs';
import { F, V } from '../game/src/content/events/b22d_common.js';
import { HOOKS, ESCARCHA, TUNELES, CIERZO, PESADILLA } from '../game/src/content/maps/b22d/layout.js';

const OWNED = ['mina_galena_sellada', 'boreal_cueva_sellada', 'lumina_tuneles', 'archivo_coloso', 'alba_pesadilla', 'instalacion_cierzo', 'cierzo_laboratorio', 'cierzo_nucleo'];
async function owned(id) {
  const { default: def } = await import(`../game/src/content/maps/b22d/${id}.js`);
  const tileset = tilesetDB().tilesets[def.tileset];
  const { library, paintBrush } = await loadLibrary(def.tileset);
  const warnings = [];
  const built = buildMap(def, { library, paintBrush, isEmpty: isEmptyFor(tileset), anilMap: anilMapLoader, warn: (w) => warnings.push(w) });
  return { def, warnings, entry: createEntry(def, built, tileset) };
}
async function environment(id, flags = [], { own = false } = {}) {
  const built = own ? await owned(id) : await buildMapNode(id);
  const state = GameState.create({ name: 'Prueba' });
  for (const f of ['game_cleared', 'b21_fin', 'b01_left_town', ...flags]) state.setFlag(f);
  const world = new World({ state }); world.setCurrent({ ...built.entry, events: null });
  const reach = (start) => {
    const q = [start]; const seen = new Set([start.join(',')]);
    for (let i = 0; i < q.length; i++) for (const [d, dx, dy] of [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]]) {
      const [x, y] = q[i]; const [nx, ny] = [x + dx, y + dy]; const k = `${nx},${ny}`;
      if (seen.has(k) || !world.current.map.valid(nx, ny) || !world.player.passable(x, y, d)) continue;
      seen.add(k); q.push([nx, ny]);
    }
    return seen;
  };
  const usable = (seen, x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${x + dx},${y + dy}`));
  return { ...built, state, world, reach, usable };
}

test('B22d: los ocho mapas se construyen sin avisos y todas sus llegadas/salidas son transitables', async () => {
  for (const id of OWNED) {
    const env = await environment(id, [], { own: true });
    assert.deepEqual(env.warnings, [], id);
    const a = env.def.start;
    assert.ok(env.entry.map.passableStrict(a.x, a.y), `${id}: llegada`);
    for (const w of env.def.warps || []) {
      const target = OWNED.includes(w.to) ? await owned(w.to) : await buildMapNode(w.to);
      assert.ok(target.entry.map.passableStrict(w.tx, w.ty), `${id}→${w.to}(${w.tx},${w.ty})`);
    }
  }
});

test('B22d: talla y reloj bloquean sus cámaras de verdad; abrirlos no bloquea la salida', async () => {
  for (const [id, spec, flag, foe] of [['boreal_cueva_sellada', ESCARCHA, F.escarchaOpen, 'regice'], ['lumina_tuneles', TUNELES, F.clockRestored, 'registeel']]) {
    const closed = await environment(id, [], { own: true });
    const a = spec.arrive; const p = spec[foe];
    const seen = closed.reach([a.x, a.y]);
    assert.ok(!closed.usable(seen, p.x, p.y), `${id}: no se rodea la puerta`);
    const open = await environment(id, [flag], { own: true });
    const complete = open.reach([a.x, a.y]);
    assert.ok(open.usable(complete, p.x, p.y), `${id}: acceso abierto`);
    assert.ok(open.usable(complete, spec.exit.x, spec.exit.y), `${id}: regreso al exterior`);
  }
});

test('B22d: sello de Coloso y retorno están al alcance en el segundo piso actual del Archivo', async () => {
  const env = await environment('archivo_hondo', ['p5_restored', 'b10_suelo', 'b10_manos', 'b10_lectura', 'b10_rollos', 'b10_mural']);
  const back = HOOKS.hondo.arriveBack;
  const seen = env.reach([back.x, back.y]);
  assert.ok(env.usable(seen, HOOKS.hondo.seal.x, HOOKS.hondo.seal.y));
  assert.ok(env.entry.map.passableStrict(back.x, back.y));
  assert.ok(env.world.events.some((e) => e.id === 'b22d_sello_coloso'), 'acceso integrado');
  assert.ok(!env.def.warps?.some((w) => w.x === back.x && w.y === back.y), 'sin rebote');
});

test('B22d: la calzada de Heatran tiene suelo real solo después de la Piedra Magma', async () => {
  const closed = await environment('tizon_crater', ['b13_t12_jefa', 'b13_t12_respiraderos']);
  const C = HOOKS.crater;
  const before = closed.reach([C.retry.x, C.retry.y]);
  assert.ok(!before.has(`${C.battle.x},${C.battle.y}`));
  const open = await environment('tizon_crater', [F.causeway, 'b13_t12_jefa', 'b13_t12_respiraderos']);
  const after = open.reach([C.retry.x, C.retry.y]);
  assert.ok(after.has(`${C.battle.x},${C.battle.y}`), 'la página parchea también la colisión');
  assert.ok(open.usable(after, C.vent.x, C.vent.y));
});

test('B22d: cada sombra del Umbral, Marshadow y Cresselia tienen un acceso natural a pie', async () => {
  const env = await environment('explanada_umbral', ['p1_restored', 'b02_salida', F.casildaWarn]);
  env.state.data.clock.minutes = 22 * 60;
  const seen = env.reach([27, 18]);
  for (const [x, y] of HOOKS.explanada.route) assert.ok(env.usable(seen, x, y), `sombra(${x},${y})`);
  const m = HOOKS.explanada.marshadow;
  assert.ok(env.usable(seen, m.x, m.y), 'Marshadow');
  const lumbre = await environment('islote_lumbre', ['b13_t11_baile']);
  const p = HOOKS.lumbre.front;
  const beach = lumbre.reach([11, 6]);
  assert.ok(beach.has(`${p.x},${p.y}`), 'Cresselia desde la playa');
});

test('B22d: la pesadilla mantiene un camino entre casa y Darkrai; Cierzo permite volver de las tres pruebas', async () => {
  const dream = await environment(PESADILLA.id, [F.nightmare], { own: true });
  const p = PESADILLA.arrive;
  const seen = dream.reach([p.x, p.y]);
  assert.ok(dream.usable(seen, PESADILLA.darkrai.x, PESADILLA.darkrai.y));
  assert.ok(dream.usable(seen, PESADILLA.door.x, PESADILLA.door.y));
  const lab = await environment(CIERZO.lab.id, [], { own: true });
  for (const room of ['a', 'b', 'c']) {
    const a = CIERZO.lab.entries[room]; const q = CIERZO.lab.protos[room];
    const path = lab.reach([a.x, a.y]);
    assert.ok(lab.usable(path, q.x, q.y), `prototipo${room}`);
    assert.ok(path.has(`${a.x},${a.y}`), `salida${room}`);
  }
});

test('B22d: la verja original de Cierzo abre el paso al edificio con 300 vistas, sin otro evento que lo bloquee', async () => {
  const env = await environment('mar_boreal');
  const gate = env.world.events.find((e) => e.id === 'verja_cierzo');
  assert.ok(gate.solid, 'antes de cumplir el registro permanece cerrada');
  assert.equal(env.world.player.passable(6, 8, 8), false);
  env.state.data.dex.seen = Object.fromEntries(Array.from({ length: 300 }, (_, i) => [`ESPECIE_${i}`, true]));
  const said = [];
  await gate.script({ state: env.state, say: async (t) => said.push(t), flag: (k) => env.state.flag(k),
    setFlag: (k, v = true) => env.state.setFlag(k, v), requestRefresh() {} });
  for (const e of env.world.events) e.refresh();
  assert.ok(env.state.flag(F.cierzoOpen), said.join(' '));
  assert.ok(env.world.player.passable(6, 8, 8), 'la verja se cruza a pie');
  assert.ok(env.reach([6, 8]).has('4,6'), 'se llega a la puerta verdadera del edificio');
});

test('B22d: la orilla de Heatran no encola el guion decorativo de la campaña en el mismo punto', async () => {
  const env = await environment('tizon_crater');
  const active = env.world.events.filter((e) => e.x === 20 && e.y === 17 && e.trigger === 'action');
  assert.deepEqual(active.map((e) => e.id), ['b22d_calzada']);
});
