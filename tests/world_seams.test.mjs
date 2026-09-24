// Relleno de costuras entre mapas conectados (world/seams.js) y cámara (render/camera.js): ninguna casilla que la
// cámara pueda enseñar queda vacía (franja negra) junto a un vecino de otro tamaño o desplazado.
import test from 'node:test';
import assert from 'node:assert/strict';
import { planSeams, borderIndex, cameraReach, openSides, seamKey } from '../game/src/world/seams.js';
import { Camera } from '../game/src/render/camera.js';
import { connectionOffset } from '../game/src/world/mapLoader.js';
import { MAPS, loadMapDefinition } from '../game/src/content/maps/index.js';

const TILE = 32;

const entry = (id, w, h, ox = 0, oy = 0, connections = []) => ({
  id, def: { id, width: w, height: h, connections }, map: { width: w, height: h }, offset: { x: ox, y: oy },
});

/** Entradas como las deja MapScene: el mapa actual y sus conexiones (desplazamiento de connectionOffset). */
function entriesFor(defs, id) {
  const cur = defs.get(id);
  const list = [entry(id, cur.width, cur.height, 0, 0, cur.connections || [])];
  for (const c of cur.connections || []) {
    const other = defs.get(c.to);
    if (!other) continue;
    const off = connectionOffset(c, cur, other);
    list.push(entry(c.to, other.width, other.height, off.x, off.y, other.connections || []));
  }
  return list;
}

/** Casillas visibles con el jugador en (px, py), con las reglas reales de la cámara. */
function viewCells(cur, px, py) {
  const cam = new Camera();
  cam.setBounds(cur.map.width, cur.map.height, openSides(cur.def));
  const d = cam.desiredFor(px * TILE + TILE / 2, py * TILE + TILE / 2);
  const cells = [];
  for (let y = Math.floor(d.y / TILE); y <= Math.floor((d.y + 383) / TILE); y++) {
    for (let x = Math.floor(d.x / TILE); x <= Math.floor((d.x + 511) / TILE); x++) cells.push([x, y]);
  }
  return cells;
}

/** Primera casilla visible que no es de ningún mapa ni está rellenada (null = todo cubierto). */
function firstHole(entries) {
  const [cur] = entries;
  const filled = new Set();
  for (const [id, cells] of planSeams(entries)) {
    const e = entries.find((x) => x.id === id);
    for (const c of cells) filled.add(`${c.x + e.offset.x},${c.y + e.offset.y}`);
  }
  const covered = (x, y) => filled.has(`${x},${y}`) || entries.some((e) => x >= e.offset.x && y >= e.offset.y
    && x < e.offset.x + e.map.width && y < e.offset.y + e.map.height);
  const open = openSides(cur.def);
  // Durante el paso de cruce el jugador aún se dibuja una casilla fuera del mapa por los lados abiertos.
  for (let py = open.north ? -1 : 0; py < cur.map.height + (open.south ? 1 : 0); py++) {
    for (let px = open.west ? -1 : 0; px < cur.map.width + (open.east ? 1 : 0); px++) {
      for (const [x, y] of viewCells(cur, px, py)) if (!covered(x, y)) return { px, py, x, y };
    }
  }
  return null;
}

test('borderIndex repite las 2 primeras/últimas casillas fuera del mapa', () => {
  assert.deepEqual([-4, -3, -2, -1, 0, 5, 9, 10, 11, 12].map((v) => borderIndex(v, 10)), [0, 1, 0, 1, 0, 5, 9, 8, 9, 8]);
  assert.equal(borderIndex(-3, 1), 0);
  assert.equal(borderIndex(4, 1), 0);
});

test('sin conexiones no se rellena nada (interiores: la cámara se limita o centra con negro)', () => {
  assert.equal(planSeams([entry('casa', 12, 9)]).size, 0);
  assert.equal(planSeams([entry('ruta', 40, 40)]).size, 0);
});

test('cameraReach abre el margen solo por los lados con conexión', () => {
  const r = cameraReach({ connections: [{ dir: 'north' }, { dir: 'west' }] }, 64, 56);
  assert.deepEqual(r, { x0: -9, y0: -7, x1: 64, y1: 56 });
});

test('Caudal ↔ Ruta 3: la esquina sobre Caudal que no cubre ningún vecino se rellena con el borde de Caudal', () => {
  const caudal = entry('ciudad_caudal', 64, 56, 0, 0, [{ dir: 'north' }, { dir: 'west' }, { dir: 'east' }]);
  const ruta2 = entry('ruta_2', 30, 70, 17, -70, [{ dir: 'south' }]);
  const ruta3 = entry('ruta_3', 40, 50, -40, -29, [{ dir: 'east' }, { dir: 'north' }]);
  const ruta4 = entry('ruta_4', 80, 30, 64, 15, [{ dir: 'west' }]);
  const entries = [caudal, ruta2, ruta3, ruta4];
  const plan = planSeams(entries);
  const cell = plan.get('ciudad_caudal').find((c) => c.x === 3 && c.y === -2);
  assert.deepEqual(cell, { x: 3, y: -2, sx: 3, sy: 0 }, 'fila −2 = fila 0 (periodo 2)');
  assert.ok(!plan.get('ciudad_caudal').some((c) => c.x >= 17 && c.x < 47 && c.y < 0), 'no pinta encima de la Ruta 2');
  assert.equal(firstHole(entries), null);
});

test('al cruzar la costura el relleno visible no cambia (mismo mapa de origen y misma casilla)', () => {
  // Mismos mapas cargados en el instante del cruce; solo cambia cuál es el actual (desplazamientos relativos).
  const caudal = (ox, oy) => entry('ciudad_caudal', 64, 56, ox, oy, [{ dir: 'north' }, { dir: 'west' }, { dir: 'east' }]);
  const ruta3 = (ox, oy) => entry('ruta_3', 40, 50, ox, oy, [{ dir: 'east' }, { dir: 'north' }]);
  const fromCaudal = planSeams([caudal(0, 0), ruta3(-40, -29)]);
  const fromRuta3 = planSeams([ruta3(0, 0), caudal(40, 29)]);
  const index = (plan, ox, oy) => {
    const m = new Map();
    for (const [id, cells] of plan) for (const c of cells) m.set(`${c.x + ox[id]},${c.y + oy[id]}`, `${id}:${c.sx},${c.sy}`);
    return m;
  };
  const a = index(fromCaudal, { ciudad_caudal: 0, ruta_3: -40 }, { ciudad_caudal: 0, ruta_3: -29 });
  const b = index(fromRuta3, { ciudad_caudal: 0, ruta_3: -40 }, { ciudad_caudal: 0, ruta_3: -29 }); // a coords de Caudal
  let shared = 0;
  for (const [k, v] of a) {
    if (!b.has(k)) continue;
    shared += 1;
    assert.equal(b.get(k), v, `casilla ${k}`);
  }
  assert.ok(shared > 20, `hay casillas vistas desde los dos lados (${shared})`);
});

test('seamKey cambia con el mapa actual y los desplazamientos', () => {
  const a = [entry('a', 20, 20), entry('b', 20, 20, 20, 0)];
  const b = [entry('b', 20, 20), entry('a', 20, 20, -20, 0)];
  assert.notEqual(seamKey(a), seamKey(b));
});

test('mapas conectados reales (B01–B06): ninguna casilla visible queda vacía desde ninguna posición', async () => {
  const ids = Object.keys(MAPS).filter((id) => /\/b0[1-6]\//.test(String(MAPS[id])) || id.startsWith('dev_test'));
  const defs = new Map();
  for (const id of ids) {
    const def = await loadMapDefinition(id);
    defs.set(id, { id, width: def.width, height: def.height, connections: def.connections || [] });
  }
  const connected = [...defs.values()].filter((d) => d.connections.length);
  assert.ok(connected.length >= 8, `hay mapas conectados (${connected.length})`);
  for (const d of connected) {
    const hole = firstHole(entriesFor(defs, d.id));
    assert.equal(hole, null, `${d.id}: casilla vacía visible ${JSON.stringify(hole)}`);
  }
});
