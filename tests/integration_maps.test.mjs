// Carga de TODOS los mapas registrados (content/maps/index.js) como lo hace el juego, pero en Node:
// builder + biblioteca de stamps, entrada de mapa, World con sus eventos (tipos expandidos y páginas
// evaluadas con un GameState real) y coherencia de warps/conexiones con los mapas de destino.
// Los mapas registrados cuyo módulo aún no existe (Bloque 1 en curso) se saltan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS } from '../game/src/content/maps/index.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { World } from '../game/src/world/world.js';
import { GameState } from '../game/src/core/state.js';

const exists = new Map();
async function mapExists(id) {
  if (!exists.has(id)) {
    exists.set(id, (async () => {
      if (!MAPS[id]) return false;
      try {
        await MAPS[id]();
        return true;
      } catch (err) {
        if (err.code === 'ERR_MODULE_NOT_FOUND' && String(err.message).includes(id)) return false;
        throw err;
      }
    })());
  }
  return exists.get(id);
}

const built = new Map();
function build(id) {
  if (!built.has(id)) built.set(id, buildMapNode(id));
  return built.get(id);
}

/** Crea el mundo con los eventos del mapa; devuelve los errores registrados por when() u otros. */
function worldFor(entry) {
  const errors = [];
  const original = console.error;
  console.error = (...args) => { errors.push(args.map(String).join(' ')); };
  try {
    const world = new World({ state: GameState.create({ name: 'Prueba' }) });
    world.setCurrent({ ...entry, events: null });
    return { world, errors };
  } finally {
    console.error = original;
  }
}

test('el registro de mapas no está vacío y todos los ids son funciones de carga', () => {
  const ids = Object.keys(MAPS);
  assert.ok(ids.length > 0);
  for (const id of ids) assert.equal(typeof MAPS[id], 'function', id);
});

for (const id of Object.keys(MAPS)) {
  test(`integración mapa ${id}: construye, crea sus eventos y sus destinos son coherentes`, async (t) => {
    if (!(await mapExists(id))) { t.skip(`${id} aún no existe`); return; }
    const { def, entry } = await build(id);
    assert.equal(def.id, id, 'el id de la definición coincide con el registro');
    const map = entry.map;
    if (def.start) assert.ok(map.valid(def.start.x, def.start.y), 'start dentro del mapa');

    const { world, errors } = worldFor(entry);
    assert.deepEqual(errors, [], 'las condiciones when() de los eventos no lanzan');
    const events = world.events;
    assert.equal(events.length, (def.events || []).length);
    const ids = events.map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length, `ids de evento repetidos: ${ids}`);
    for (const ev of events) {
      for (const page of ev.def.pages) {
        if (page.script !== undefined) assert.equal(typeof page.script, 'function', `script de ${ev.id}`);
      }
    }
    if (def.onEnter !== undefined) assert.equal(typeof def.onEnter, 'function', 'onEnter');

    for (const w of def.warps || []) {
      assert.ok(map.valid(w.x, w.y), `warp (${w.x},${w.y}) fuera del mapa`);
      assert.ok(MAPS[w.to], `warp a mapa no registrado ${w.to}`);
      if (!(await mapExists(w.to))) continue;
      const target = (await build(w.to)).entry.map;
      if (Number.isInteger(w.tx) && Number.isInteger(w.ty)) assert.ok(target.valid(w.tx, w.ty), `destino ${w.to} (${w.tx},${w.ty}) fuera del mapa`);
    }
    for (const c of def.connections || []) {
      assert.ok(['north', 'south', 'east', 'west'].includes(c.dir), `conexión con dirección ${c.dir}`);
      assert.ok(MAPS[c.to], `conexión a mapa no registrado ${c.to}`);
    }
  });
}
