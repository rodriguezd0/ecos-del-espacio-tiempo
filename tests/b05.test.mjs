// Bloque 5 (docs/CAMPANA.md «B05 — Interludio 2»; TABLILLAS T02 y T03): lógica pura de los puzzles (un solo camino
// válido en el circuito de la subestación, una sola solución del tren de engranajes), células del bloque, vado de
// la Ruta 4 según p2_restored, apagón de Brontia, árbol de miel y hierba agitada, entrenadores y encuentros.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SWITCHES, DAMAGED, INPUT, OUTPUT, evaluateCircuit, validPaths, solutionSwitches,
} from '../game/src/content/events/b05_circuit.js';
import { evaluateGears, gearSolution, requiredSense, SOCKET_SIZES } from '../game/src/content/events/b05_gears.js';
import { B05_CELLS } from '../game/src/content/events/b05_cells.js';
import { cellByKey } from '../game/src/content/zygarde/cells.js';
import { blackoutDarkness } from '../game/src/content/events/b05_brontia_night.js';
import { pickWeighted, honeyReady, rustleActive } from '../game/src/content/events/b05_wild.js';
import { RUTA_4, VILLA_BRONTIA, RUTA_4_HONEY } from '../game/src/content/encounters/b05.js';
import trainers from '../game/src/content/trainers/b05.js';
import { PENDING_LINKS as B05_LINKS, R4_TO_BRONTIA } from '../game/src/content/maps/b05/links.js';
import { FORD, RUSTLE } from '../game/src/content/maps/b05/ruta_4_layout.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { World } from '../game/src/world/world.js';
import { GameState } from '../game/src/core/state.js';

const subsets = (n) => Array.from({ length: 1 << n }, (_, m) => Array.from({ length: n }, (_, i) => (m >> i) & 1));

test('T03: el circuito tiene exactamente un camino válido que evita las cajas quemadas', () => {
  const paths = validPaths();
  assert.equal(paths.length, 1, `caminos: ${JSON.stringify(paths)}`);
  assert.deepEqual(paths[0], ['J00', 'J10', 'J11', 'J21', 'J22']);
  assert.deepEqual(solutionSwitches(), ['int_00_10', 'int_10_11', 'int_11_21', 'int_21_22']);
  assert.equal(evaluateCircuit(solutionSwitches()).result, 'ok');
  assert.equal(evaluateCircuit([]).result, 'open');
  assert.deepEqual(evaluateCircuit(['int_00_01']), { result: 'short', energized: ['J00', 'J01'], shortAt: 'J01' });
  assert.ok(DAMAGED.every((n) => ![INPUT, OUTPUT].includes(n)));
});

test('T03: toda configuración que conecta la línea contiene el camino único y ninguna caja quemada', () => {
  const sol = new Set(solutionSwitches());
  let ok = 0;
  for (const mask of subsets(SWITCHES.length)) {
    const closed = SWITCHES.filter((_, i) => mask[i]).map((s) => s.id);
    const r = evaluateCircuit(closed);
    if (r.result !== 'ok') continue;
    ok += 1;
    for (const id of sol) assert.ok(closed.includes(id), `${closed} conecta sin ${id}`);
    assert.ok(!r.energized.some((n) => DAMAGED.includes(n)));
  }
  assert.ok(ok >= 1);
});

test('T02: el tren de engranajes tiene una única solución (colocar y girar)', () => {
  assert.deepEqual(gearSolution(), [{ gear: 1, sense: -1 }, { gear: 2, sense: 1 }, { gear: 3, sense: -1 }]);
  assert.equal(evaluateGears(gearSolution()).ok, true);
  assert.equal(evaluateGears(gearSolution()).millstone, 1, 'la muela muele a derechas');
  const perms = [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]];
  let solutions = 0;
  for (const p of perms) {
    for (const senses of subsets(3)) {
      const sockets = p.map((gear, i) => ({ gear, sense: senses[i] ? 1 : -1 }));
      if (evaluateGears(sockets).ok) solutions += 1;
    }
  }
  assert.equal(solutions, 1);
  assert.equal(evaluateGears([{ gear: 1, sense: -1 }, { gear: 0, sense: 1 }, { gear: 3, sense: -1 }]).reason, 'missing');
  assert.equal(evaluateGears([{ gear: 2, sense: -1 }, { gear: 1, sense: 1 }, { gear: 3, sense: -1 }]).reason, 'size');
  assert.deepEqual(evaluateGears([{ gear: 1, sense: 1 }, { gear: 2, sense: 1 }, { gear: 3, sense: -1 }]), { ok: false, reason: 'jam', at: 0, millstone: 0 });
  assert.deepEqual(SOCKET_SIZES.map((_, i) => requiredSense(i)), [-1, 1, -1]);
});

test('células del bloque: coinciden con el registro (C025–C027, C073) y están en sus mapas', async () => {
  assert.deepEqual(B05_CELLS.map((c) => c.code), ['C025', 'C026', 'C027', 'C073']);
  for (const c of B05_CELLS) {
    const reg = cellByKey(c.id);
    assert.ok(reg, c.id);
    assert.equal(reg.id, c.code);
    assert.equal(reg.map, c.map);
    assert.equal(reg.stage, c.stage);
    const { def } = await buildMapNode(c.map);
    const ev = def.events.find((e) => e.type === 'zygardeCell' && e.cell === c.id);
    assert.ok(ev, `${c.id} sin evento en ${c.map}`);
    assert.deepEqual([ev.x, ev.y], [c.x, c.y]);
  }
});

function worldWith(entry, flags = []) {
  const st = GameState.create({ name: 'Prueba' });
  for (const f of flags) st.setFlag(f);
  const world = new World({ state: st });
  world.setCurrent({ ...entry, events: null });
  return world;
}

test('Ruta 4: el vado está anegado hasta p2_restored y se cruza después', async () => {
  const { entry } = await buildMapNode('ruta_4');
  const cells = [];
  for (let y = FORD.y0; y <= FORD.y1; y++) for (let x = FORD.x0; x <= FORD.x1; x++) cells.push([x, y]);
  const flooded = worldWith(entry);
  assert.ok(cells.every(([x, y]) => !flooded.map.playerPassable(x, y, 0, {})), 'anegado: no se pisa');
  const { entry: again } = await buildMapNode('ruta_4');
  const open = worldWith(again, ['p2_restored']);
  assert.ok(cells.every(([x, y]) => open.map.playerPassable(x, y, 0, {})), 'abierto: se cruza');
});

test('Brontia: apagón de noche hasta la luz a medias (T03) y luz normal tras P3', () => {
  const st = GameState.create({ name: 'Prueba' });
  st.data.clock.minutes = 12 * 60;
  assert.equal(blackoutDarkness(st), null);
  st.data.clock.minutes = 22 * 60;
  assert.equal(blackoutDarkness(st).amount, 0.7);
  st.setFlag('b05_brontia_luz');
  assert.equal(blackoutDarkness(st).amount, 0.42);
  st.setFlag('p3_restored');
  assert.equal(blackoutDarkness(st), null);
});

test('árbol de miel y hierba agitada: se renuevan con los descansos', () => {
  const st = GameState.create({ name: 'Prueba' });
  assert.equal(honeyReady(st), false);
  st.setVar('b05_miel_ruta4', 1);
  assert.equal(honeyReady(st), false);
  st.setVar('rest_count', 1);
  assert.equal(honeyReady(st), true);
  assert.equal(rustleActive(st), true);
  st.setVar('b05_audino_ruta4', 1);
  assert.equal(rustleActive(st), false);
  st.setVar('rest_count', 2);
  assert.equal(rustleActive(st), true);
  const seq = [0.1, 0.5];
  const pick = pickWeighted(RUTA_4_HONEY, () => seq.shift() ?? 0);
  assert.equal(pick.species, 'COMBEE');
  assert.ok(pick.level >= 18 && pick.level <= 22);
});

test('encuentros de la Ruta 4 y de Brontia: tablas de POKEDEX_DISTRIBUCION (suman 100)', () => {
  const sum = (t) => t.reduce((a, e) => a + e[0], 0);
  for (const t of [RUTA_4.grass, RUTA_4.fish_old, RUTA_4.fish_good, VILLA_BRONTIA.grass, VILLA_BRONTIA.grassNight, RUTA_4_HONEY]) assert.equal(sum(t), 100);
  assert.ok(RUTA_4.grass.every(([, , a, b]) => a === 16 && b === 22));
  assert.ok(VILLA_BRONTIA.grass.every(([, , a, b]) => a === 20 && b === 26));
});

test('entrenadores del bloque: rutas 18–22 y técnicos del Consorcio 18–20 (se puede perder: reintento)', () => {
  for (const [id, t] of Object.entries(trainers)) {
    const levels = t.party.map((p) => p.level);
    if (id.startsWith('t02_')) {
      assert.ok(levels.every((l) => l >= 18 && l <= 20), id);
      assert.equal(t.canLose, true, id);
    } else assert.ok(levels.every((l) => l >= 18 && l <= 22), id);
  }
});

test('Embestida: la C025 (suele ser la 18.ª) está a menos de 20 casillas de la roca de tutorial (CAMPANA §2.1)', async () => {
  const { def } = await buildMapNode('ruta_4');
  const rock = def.events.find((e) => e.id === 'roca_tutorial');
  const c025 = B05_CELLS.find((c) => c.code === 'C025');
  assert.ok(rock && rock.type === 'ramRock');
  assert.ok(Math.abs(rock.x - c025.x) + Math.abs(rock.y - c025.y) < 20, `distancia ${Math.abs(rock.x - c025.x) + Math.abs(rock.y - c025.y)}`);
});

test('Ruta 4: con el vado seco el agua termina en orillas (el paso es tierra, no agua bajo el camino)', async () => {
  const { entry } = await buildMapNode('ruta_4');
  const open = worldWith(entry, ['p2_restored']);
  // Ids del agua (brush `agua`: rejilla de 4 patrones) tomados del río aguas arriba del vado.
  const water = new Set();
  for (let y = 0; y < FORD.y0 - 2; y++) for (let x = FORD.x0 + 1; x < FORD.x1; x++) water.add(open.map.data(x, y, 0));
  for (let y = FORD.y0; y <= FORD.y1; y++) for (let x = FORD.x0; x <= FORD.x1; x++) assert.ok(!water.has(open.map.data(x, y, 0)), `seco: agua en (${x},${y})`);
  const { entry: again } = await buildMapNode('ruta_4');
  const flooded = worldWith(again);
  for (let y = FORD.y0; y <= FORD.y1; y++) for (let x = FORD.x0 + 1; x < FORD.x1; x++) assert.ok(water.has(flooded.map.data(x, y, 0)), `anegado: sin agua en (${x},${y})`);
  assert.notEqual(flooded.map.data(FORD.x0 - 1, FORD.y0, 1), open.map.data(FORD.x0 - 1, FORD.y0, 1), 'anegado: el camino termina en la orilla');
});

test('Ruta 4: la hierba que se agita siempre está sobre hierba alta', async () => {
  const { entry } = await buildMapNode('ruta_4');
  for (const { x, y } of RUSTLE) {
    const tag = entry.map.terrainTagAt(x, y);
    assert.ok(tag?.landWildEncounters || /Grass/.test(tag?.id || ''), `(${x},${y}) ${tag?.id}`);
  }
});

test('Abril: antes del P3 acampa en el Anillo (B06); tras el P3 está en Brontia (plaza de día, casa de noche)', async () => {
  const { def: town } = await buildMapNode('villa_brontia');
  const { def: house } = await buildMapNode('brontia_casa_abril');
  const plaza = town.events.find((e) => e.id === 'abril');
  const home = house.events.find((e) => e.id === 'abril_casa');
  const at = (hour, flags = []) => {
    const st = GameState.create({ name: 'Prueba' });
    st.data.clock.minutes = hour * 60;
    for (const f of flags) st.setFlag(f);
    return st;
  };
  for (const h of [10, 22]) {
    assert.equal(plaza.when(at(h, ['p2_restored'])), false, `plaza antes del P3 (${h} h)`);
    assert.equal(home.when(at(h, ['p2_restored'])), false, `casa antes del P3 (${h} h)`);
  }
  assert.equal(plaza.when(at(10, ['p3_restored'])), true);
  assert.equal(plaza.when(at(22, ['p3_restored'])), false);
  assert.equal(home.when(at(22, ['p3_restored'])), true);
  assert.equal(home.when(at(10, ['p3_restored'])), false);
});

test('enlaces: Ruta 4 ↔ Caudal y Ruta 4 ↔ Brontia son simétricos', () => {
  assert.equal(B05_LINKS.ruta_4.ciudad_caudal.offset, -15, 'acordado con B03 (Caudal east → ruta_4 offset 15)');
  assert.equal(R4_TO_BRONTIA, 4 - 18, 'y 4 de la Ruta 4 = y 18 de Brontia');
});
