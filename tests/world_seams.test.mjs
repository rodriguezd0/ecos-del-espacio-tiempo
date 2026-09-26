// Cámara como en Pokémon (render/camera.js) y exterior de los mapas (world/seams.js): la cámara sigue siempre al
// jugador centrado y ninguna casilla que pueda enseñar queda vacía (franja negra) en un mapa exterior: la cubren los
// vecinos conectados o el relleno de borde. Interiores y mapas que caben en pantalla: negro alrededor.
import test from 'node:test';
import assert from 'node:assert/strict';
import { planSeams, borderIndex, cameraReach, seamKey, sideOf, verticalWins, seamTileId, SEAM_MARGIN_X, SEAM_MARGIN_Y } from '../game/src/world/seams.js';
import { Camera } from '../game/src/render/camera.js';
import { SCREEN_W, SCREEN_H } from '../game/src/core/screen.js';
import { connectionOffset } from '../game/src/world/mapLoader.js';
import { MAPS, loadMapDefinition } from '../game/src/content/maps/index.js';

const TILE = 32;
/** Temblor máximo de Camera#shake (power 9 · 1,5 px). */
const MAX_SHAKE = 14;

/** Mapa de prueba: suelo liso (id 400) en todas las casillas. */
const flatMap = (w, h) => ({ width: w, height: h, data: (x, y, l) => (l === 0 && x >= 0 && y >= 0 && x < w && y < h ? 400 : 0) });

const entry = (id, w, h, ox = 0, oy = 0, extra = {}) => ({
  id, def: { id, width: w, height: h, connections: [], ...extra }, map: flatMap(w, h), offset: { x: ox, y: oy },
});

/** Casillas visibles con la cámara en la esquina (cx, cy) px (con temblor a ambos lados en x). */
function viewCells(cx, cy) {
  const cells = [];
  for (let y = Math.floor(cy / TILE); y <= Math.floor((cy + SCREEN_H - 1) / TILE); y++) {
    for (let x = Math.floor((cx - MAX_SHAKE) / TILE); x <= Math.floor((cx + MAX_SHAKE + SCREEN_W - 1) / TILE); x++) cells.push([x, y]);
  }
  return cells;
}

/** Primera casilla visible (jugador en cualquier casilla, y una fuera por los lados con conexión) sin cubrir. */
function firstHole(entries) {
  const [cur] = entries;
  const filled = new Set();
  for (const [id, cells] of planSeams(entries)) {
    const e = entries.find((x) => x.id === id);
    for (const c of cells) filled.add(`${c.x + e.offset.x},${c.y + e.offset.y}`);
  }
  const covered = (x, y) => filled.has(`${x},${y}`) || entries.some((e) => x >= e.offset.x && y >= e.offset.y
    && x < e.offset.x + e.map.width && y < e.offset.y + e.map.height);
  const cam = new Camera();
  cam.setBounds(cur.map.width, cur.map.height);
  for (let py = -1; py <= cur.map.height; py++) {
    for (let px = -1; px <= cur.map.width; px++) {
      const d = cam.desiredFor(px * TILE + TILE / 2, py * TILE + TILE / 2);
      for (const [x, y] of viewCells(d.x, d.y)) if (!covered(x, y)) return { px, py, x, y };
    }
  }
  return null;
}

// ------------------------------------------------------------------------------------------------ cámara

test('la cámara sigue al jugador centrado también en bordes y esquinas (no se para)', () => {
  const cam = new Camera();
  cam.setBounds(40, 30);
  cam.follow({ realX: 0, realY: 0 });
  cam.update();
  assert.deepEqual([cam.x, cam.y], [TILE / 2 - SCREEN_W / 2, TILE / 2 - SCREEN_H / 2], 'esquina noroeste');
  cam.follow({ realX: 39 * TILE, realY: 29 * TILE });
  cam.update();
  assert.deepEqual([cam.x, cam.y], [39 * TILE + TILE / 2 - SCREEN_W / 2, 29 * TILE + TILE / 2 - SCREEN_H / 2], 'esquina sureste');
  const before = cam.x;
  cam.target.realX -= 8; // un paso a medias hacia el oeste junto al borde: la cámara se mueve con él
  cam.update();
  assert.equal(cam.x, before - 8);
});

test('un mapa que cabe entero en pantalla se queda centrado (como en Añil); si no cabe, sigue al jugador', () => {
  const cam = new Camera();
  cam.setBounds(10, 8);
  assert.ok(cam.mapFitsScreen);
  cam.follow({ realX: 0, realY: 0 });
  cam.update();
  assert.deepEqual([cam.x, cam.y], [(10 * TILE - SCREEN_W) / 2, (8 * TILE - SCREEN_H) / 2]);
  cam.setBounds(10, 30); // estrecho pero alto (interior largo): negro a los lados, cámara centrada en el jugador
  assert.ok(!cam.mapFitsScreen);
  cam.update();
  assert.deepEqual([cam.x, cam.y], [TILE / 2 - SCREEN_W / 2, TILE / 2 - SCREEN_H / 2]);
});

test('paneo de cinemática a una casilla del borde la centra, y reset vuelve al jugador', async () => {
  const cam = new Camera();
  cam.setBounds(40, 30);
  cam.follow({ realX: 20 * TILE, realY: 15 * TILE });
  cam.update();
  const pan = cam.panTo(0, 1, 4);
  for (let i = 0; i < 4; i++) cam.update();
  await pan;
  assert.deepEqual([cam.x, cam.y], [TILE / 2 - SCREEN_W / 2, TILE + TILE / 2 - SCREEN_H / 2]);
  const back = cam.reset(3);
  for (let i = 0; i < 3; i++) cam.update();
  await back;
  cam.update();
  assert.deepEqual([cam.x, cam.y], [20 * TILE + TILE / 2 - SCREEN_W / 2, 15 * TILE + TILE / 2 - SCREEN_H / 2]);
});

test('cameraReach: el mapa más el margen por todos los lados, que cubre la vista desde cualquier casilla', () => {
  assert.deepEqual(cameraReach(64, 56), { x0: -SEAM_MARGIN_X, y0: -SEAM_MARGIN_Y, x1: 64 + SEAM_MARGIN_X, y1: 56 + SEAM_MARGIN_Y });
  assert.equal(firstHole([entry('ruta', 30, 40)]), null);
});

// ------------------------------------------------------------------------------------------------ relleno

test('borderIndex repite las 2 primeras/últimas casillas fuera del mapa', () => {
  assert.deepEqual([-4, -3, -2, -1, 0, 5, 9, 10, 11, 12].map((v) => borderIndex(v, 10)), [0, 1, 0, 1, 0, 5, 9, 8, 9, 8]);
  assert.equal(borderIndex(-3, 1), 0);
});

test('interiores, mapas que caben en pantalla y mapas con panorama: sin relleno (negro alrededor)', () => {
  assert.equal(planSeams([entry('casa', 12, 9)]).size, 0);
  assert.equal(planSeams([entry('salon', 30, 30, 0, 0, { tileset: 4 })]).size, 0);
  assert.equal(planSeams([entry('sima', 40, 40, 0, 0, { panorama: { image: 'x.png' } })]).size, 0);
  assert.equal(planSeams([entry('borde_off', 40, 40, 0, 0, { border: false })]).size, 0);
});

test('mapa exterior sin conexiones: todo el anillo visible se rellena con su borde', () => {
  const e = entry('ruta', 30, 40);
  const cells = planSeams([e]).get('ruta');
  const reach = cameraReach(30, 40);
  assert.equal(cells.length, (reach.x1 - reach.x0) * (reach.y1 - reach.y0) - 30 * 40);
  const corner = cells.find((c) => c.x === -3 && c.y === -2);
  assert.ok(corner.ground, 'la esquina también copia suelo');
  assert.equal(seamTileId(e.map, corner, 0), 400);
});

test('sideOf / verticalWins: el hueco entre dos mapas es entero del que lo cubre con menos profundidad', () => {
  const caudal = { x0: 0, y0: 0, x1: 64, y1: 56 };
  const ruta4 = { x0: 64, y0: 15, x1: 144, y1: 45 };
  assert.deepEqual(sideOf(ruta4, 66, 50), { kind: 'v', d: 6 });
  assert.deepEqual(sideOf(caudal, 66, 50), { kind: 'h', d: 3 });
  assert.equal(sideOf(caudal, 5, 5), null);
  assert.equal(sideOf(caudal, -2, -3).kind, 'c');
  // Bajo la Ruta 4 y a la derecha de Caudal: 11 filas de la Ruta 4 frente a 80 columnas de Caudal.
  assert.ok(verticalWins(ruta4, caudal, 66, 50));
  assert.ok(verticalWins(ruta4, caudal, 70, 46));
  // Bajo un vecino ancho al noroeste y a la izquierda de un mapa alto: lo cubre el mapa alto (pocas columnas).
  assert.ok(!verticalWins({ x0: -20, y0: -40, x1: 10, y1: 0 }, { x0: 0, y0: 0, x1: 40, y1: 50 }, -3, 20));
});

test('Caudal ↔ Ruta 4: el hueco bajo la Ruta 4 lo rellena ella en columnas (sin diagonal de árboles partidos)', () => {
  const caudal = entry('ciudad_caudal', 64, 56);
  const ruta4 = entry('ruta_4', 80, 30, 64, 15);
  const plan = planSeams([caudal, ruta4]);
  const owner = (x, y) => [...plan].find(([id, cells]) => {
    const e = id === 'ruta_4' ? ruta4 : caudal;
    return cells.some((c) => c.x + e.offset.x === x && c.y + e.offset.y === y);
  })?.[0];
  for (let y = 45; y < 56; y++) for (let x = 64; x < 74; x++) assert.equal(owner(x, y), 'ruta_4', `(${x},${y})`);
  assert.equal(owner(66, 60), 'ruta_4', 'debajo de Caudal sigue la columna de la Ruta 4');
  assert.equal(owner(60, 60), 'ciudad_caudal');
  assert.equal(firstHole([caudal, ruta4]), null);
});

test('un vecino sin relleno (panorama) no deja agujero negro: el hueco lo rellenan los demás', () => {
  const caudal = entry('ciudad_caudal', 64, 56);
  const senda = entry('senda_mirador', 40, 50, 30, 56, { panorama: { image: 'sima.png' } });
  const plan = planSeams([caudal, senda]);
  assert.ok(!plan.has('senda_mirador'));
  assert.ok(plan.get('ciudad_caudal').some((c) => c.x === 66 && c.y === 53));
  assert.equal(firstHole([caudal, senda]), null);
});

test('al cruzar la costura el relleno visible no cambia (mismo mapa de origen y misma casilla)', () => {
  const caudal = (ox, oy) => entry('ciudad_caudal', 64, 56, ox, oy);
  const ruta3 = (ox, oy) => entry('ruta_3', 40, 50, ox, oy);
  const fromCaudal = planSeams([caudal(0, 0), ruta3(-40, -29)]);
  const fromRuta3 = planSeams([ruta3(0, 0), caudal(40, 29)]);
  const index = (plan, off) => {
    const m = new Map();
    for (const [id, cells] of plan) for (const c of cells) m.set(`${c.x + off[id][0]},${c.y + off[id][1]}`, `${id}:${c.ground}`);
    return m;
  };
  const off = { ciudad_caudal: [0, 0], ruta_3: [-40, -29] }; // todo en coordenadas de Caudal
  const a = index(fromCaudal, off);
  const b = index(fromRuta3, off);
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

test('mapas exteriores reales (B01–B06): ninguna casilla visible queda vacía desde ninguna posición', async () => {
  const ids = Object.keys(MAPS).filter((id) => /\/b0[1-6]\//.test(String(MAPS[id])) || id.startsWith('dev_test'));
  const defs = new Map();
  for (const id of ids) {
    const def = await loadMapDefinition(id);
    defs.set(id, { id, width: def.width, height: def.height, tileset: def.tileset, panorama: def.panorama, connections: def.connections || [] });
  }
  const mk = (d, ox, oy) => ({ id: d.id, def: d, map: flatMap(d.width, d.height), offset: { x: ox, y: oy } });
  let checked = 0;
  for (const d of defs.values()) {
    const list = [mk(d, 0, 0)];
    for (const c of d.connections) {
      const other = defs.get(c.to);
      if (!other) continue;
      const off = connectionOffset(c, d, other);
      list.push(mk(other, off.x, off.y));
    }
    if (!planSeams(list).size) continue; // interior o mapa pequeño: negro alrededor
    checked += 1;
    assert.equal(firstHole(list), null, `${d.id}: casilla vacía visible`);
  }
  assert.ok(checked >= 10, `mapas exteriores comprobados (${checked})`);
});
