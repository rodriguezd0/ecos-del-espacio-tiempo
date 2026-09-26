// Reglas sistémicas de mapas (docs/stamps.md «Bosques», «Pasabilidad de la decoración», «Herramientas de QA»):
// pincel de bosque de árboles enteros, sellado de puntas de copa, correcciones de pasabilidad y comprobaciones de QA.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { paintForest, stackRows, SMALL_TREES, FOREST_BLOCKER_TILE } from '../game/src/content/stamps/forest.js';
import { paintBrush, rectCells } from '../game/src/content/stamps/brushes.js';
import { loadStampLibrary } from '../game/src/content/stamps/index.js';
import { passPatchCells } from '../game/src/content/stamps/passPatches.js';
import { sealTreeTips } from '../game/src/world/treeTips.js';
import { MapBuilder } from '../game/src/world/mapBuilder.js';
import { buildMap, createEntry } from '../game/src/world/mapLoader.js';
import { qaMap } from '../tools/lib/map_qa.mjs';
import { cutSides } from '../tools/lib/tree_tiles.mjs';

const tilesets = JSON.parse(fs.readFileSync(new URL('../game/data/tilesets.json', import.meta.url))).tilesets;
const tid = (x, y) => 384 + y * 8 + x;
const BOSQUE = { forest: { trees: [[0, 39]], size: [2, 6], period: [2, 4] }, layer: 2, trunkLayer: 1 };
const TIP = [tid(0, 39), tid(1, 39)];
const SMALL_TIP = [tid(4, 41), tid(5, 41)];

/** Fila superior dibujada y fila de la última escritura por columna x. */
function columnRows(writes, x) {
  const ys = writes.filter((w) => w.x === x).map((w) => w.y);
  return { top: Math.min(...ys), bottom: Math.max(...ys) };
}

test('stackRows: el último árbol apoya el tronco abajo y el primero empieza en la fila de arriba', () => {
  assert.deepEqual(stackRows(0, 9, 6, 4), [0, 4]); // 4k+2: como siempre
  for (let h = 6; h <= 30; h++) {
    if (h === 7) continue; // sobra una fila: ver abajo
    const rows = stackRows(0, h - 1, 6, 4);
    assert.equal(rows[0], 0, `alto ${h}: la punta del primero en la fila 0`);
    assert.equal(rows.at(-1), h - 6, `alto ${h}: tronco en la última fila`);
    for (let i = 1; i < rows.length; i++) {
      const gap = rows[i] - rows[i - 1];
      assert.ok(gap >= 2 && gap <= 5, `alto ${h}: separación ${gap}`);
    }
  }
  assert.deepEqual(stackRows(0, 6, 6, 4), [-1, 1], 'alto 7: el de arriba asoma una fila fuera del trazo');
});

test('forest: cualquier alto da árboles enteros (punta arriba, tronco abajo) y las puntas van marcadas', () => {
  for (const h of [6, 7, 8, 9, 10, 11, 12, 13, 14]) {
    const writes = paintForest(BOSQUE, rectCells(0, 10, 4, h), { width: 40, height: 40 });
    const top = writes.filter((w) => w.y === (h === 7 ? 9 : 10) && w.layer === 2).map((w) => w.id);
    assert.deepEqual([...new Set(top)].sort(), [...TIP].sort(), `alto ${h}: la primera fila son puntas de copa`);
    assert.ok(writes.filter((w) => w.y === 10 + h - 1).every((w) => w.layer === 1), `alto ${h}: troncos en la última fila`);
    assert.ok(writes.filter((w) => w.tree === 'tip').every((w) => TIP.includes(w.id)));
  }
});

test('forest: tramos de 2–4 filas usan el árbol pequeño de la misma especie', () => {
  assert.deepEqual(SMALL_TREES['0,39'], [4, 41]);
  const writes = paintForest(BOSQUE, rectCells(0, 10, 4, 4), { width: 40, height: 40 });
  assert.deepEqual(columnRows(writes, 0), { top: 10, bottom: 13 });
  assert.equal(writes.find((w) => w.x === 0 && w.y === 10).id, SMALL_TIP[0]);
  const low = paintForest(BOSQUE, rectCells(0, 10, 2, 2), { width: 40, height: 40 });
  assert.deepEqual(columnRows(low, 0), { top: 8, bottom: 11 }, 'alto 2: el pequeño se completa hacia arriba');
});

test('forest: fuera del trazo solo completa en casillas libres y fuera de su rectángulo (los claros se respetan)', () => {
  const busy = paintForest(BOSQUE, rectCells(0, 10, 2, 2), { width: 40, height: 40, canExtend: () => false });
  assert.deepEqual(columnRows(busy, 0), { top: 10, bottom: 11 }, 'sin sitio: recortado al trazo');
  // trazo impar: la columna que falta se completa (medio árbol → árbol entero)
  const odd = paintForest(BOSQUE, rectCells(0, 10, 3, 6), { width: 40, height: 40 });
  assert.ok(odd.some((w) => w.x === 3), 'se completa la columna 3');
  // claro dentro del trazo: no se rellena
  const cells = rectCells(0, 0, 6, 10).filter(([x]) => x !== 3);
  const clear = paintForest(BOSQUE, cells, { width: 40, height: 40 });
  assert.ok(!clear.some((w) => w.x === 3), 'el claro (x 3) queda libre');
});

test('forest: los pares de columnas se alinean con el borde este si el trazo solo toca ese', () => {
  const writes = paintForest(BOSQUE, rectCells(5, 0, 5, 6), { width: 10, height: 20 });
  assert.equal(writes.find((w) => w.x === 9 && w.y === 0).id, TIP[1], 'x 9 = columna derecha del árbol');
  assert.equal(writes.find((w) => w.x === 8 && w.y === 0).id, TIP[0]);
});

test('forest: franja de 1–3 filas junto a una conexión norte → suelo con bloqueo invisible, sin troncos sueltos', () => {
  const writes = paintForest(BOSQUE, rectCells(0, 0, 4, 2), { width: 20, height: 20, openSides: { north: true } });
  assert.ok(writes.length === 8 && writes.every((w) => w.id === FOREST_BLOCKER_TILE));
  const noConn = paintForest(BOSQUE, rectCells(0, 0, 4, 2), { width: 20, height: 20 });
  assert.ok(noConn.some((w) => w.id !== FOREST_BLOCKER_TILE), 'sin conexión el bosque sigue fuera del mapa');
});

/** Tileset mínimo: 1 = suelo, 2 = muro, TIP/SMALL_TIP libres con prioridad, cuerpo bloquea; copia sellada 900. */
function fakeTileset() {
  const passages = []; const priorities = []; const terrainTags = [];
  passages[2] = 0x0f;
  for (const id of [...TIP, ...SMALL_TIP]) { passages[id] = 0; priorities[id] = 2; }
  for (let r = 40; r <= 44; r++) for (let c = 0; c < 8; c++) passages[tid(c, r)] = 0x0f;
  passages[900] = 0x0f; priorities[900] = 2; passages[901] = 0x0f; priorities[901] = 2;
  return { passages, priorities, terrainTags, sealedTips: { map: { [TIP[0]]: 900, [TIP[1]]: 901 } } };
}

function forestMap(extra = () => {}) {
  const b = new MapBuilder({ width: 8, height: 16, tileset: 7, id: 't', paintBrush, warn: () => {} });
  b.rect(0, 0, 0, 8, 16, 1);
  extra(b);
  return b;
}

test('puntas de copa: libres si encima se pisa; selladas con árbol, muro, evento o borde encima', () => {
  const ts = fakeTileset();
  const b = forestMap((m) => {
    m.rect(null, 0, 4, 2, 6, BOSQUE); // puntas en y 4, encima suelo → libres
    m.rect(null, 2, 4, 2, 6, BOSQUE);
    m.set(0, 2, 3, 2); m.set(0, 3, 3, 2); // muro encima de x 2–3
    m.rect(null, 4, 0, 2, 6, BOSQUE); // puntas en el borde (y 0)
    m.rect(null, 6, 4, 2, 6, BOSQUE); // evento encima de x 6
  });
  const built = b.build();
  const n = sealTreeTips(built, ts, { events: [{ x: 6, y: 3 }] });
  const at = (x, y) => built.layers[2][x + y * 8];
  assert.equal(at(0, 4), TIP[0], 'libre: sigue la punta original');
  assert.equal(at(2, 4), 900, 'muro encima: sellada');
  assert.equal(at(4, 0), 900, 'borde del mapa: sellada');
  assert.equal(at(6, 4), 900, 'evento encima: sellada');
  assert.equal(at(7, 4), TIP[1], 'la otra columna de ese árbol (sin evento encima) sigue libre');
  assert.equal(n, 5, 'tres árboles sellados (5 puntas: el evento solo tapa una columna)');
  assert.equal(sealTreeTips(built, ts, { events: [{ x: 6, y: 3 }] }), 0, 'idempotente');
});

test('puntas de copa: un bosque apilado en dos trazos no deja pasillo entre ellos (árbol encima → sellada)', () => {
  const ts = fakeTileset();
  const built = forestMap((m) => {
    m.rect(null, 0, 0, 2, 6, BOSQUE);
    m.rect(null, 0, 6, 2, 6, BOSQUE); // puntas en y 6 bajo los troncos del de arriba
  }).build();
  sealTreeTips(built, ts);
  assert.equal(built.layers[2][0 + 6 * 8], 900);
});

test('createEntry sella las puntas con los datos reales del tileset (copias de tools/tree_tips.mjs)', () => {
  for (const id of [1, 3, 5, 6, 7, 9]) {
    const map = tilesets[id].sealedTips?.map || {};
    for (const [tip, twin] of Object.entries(map)) {
      assert.equal(tilesets[id].passages[twin], 0x0f, `ts ${id}: la copia ${twin} bloquea`);
      assert.equal(tilesets[id].priorities[twin], tilesets[id].priorities[tip], `ts ${id}: misma prioridad`);
    }
    assert.ok(map[TIP[0]], `ts ${id}: punta del árbol redondo sellable`);
  }
  const def = { id: 'mini', tileset: 7, width: 6, height: 12, build: (b) => { b.fill(0, 'cesped'); b.rect(null, 0, 0, 6, 12, 'bosque'); } };
  return loadStampLibrary(7).then((library) => {
    const built = buildMap(def, { library, paintBrush });
    const { map } = createEntry(def, built, tilesets[7]);
    for (let x = 0; x < 6; x++) assert.ok(!map.passableStrict(x, 0), `borde norte (${x},0) cerrado`);
  });
});

test('pasabilidad de la decoración: rocas con la cima sólida, flores y lupinos transitables', () => {
  for (const ts of Object.values(tilesets)) {
    if (!ts?.passages) continue;
    for (const p of passPatchCells(ts)) assert.equal(ts.passages[p.id], p.passage, `ts ${ts.id}: ${p.what} (${p.id})`);
  }
  assert.equal(tilesets[7].passages[tid(6, 46)], 0x0f, 'cima de roca_turquesa');
  assert.equal(tilesets[7].passages[tid(0, 37)], 0x40, 'base de los lupinos: arbusto');
  assert.equal(tilesets[6].passages[tid(3, 68)], 0x0f, 'la mata de la Safari sigue siendo seto');
});

test('QA: cutSides ve un árbol partido y da por buena la vecina desconocida (borde de mapa)', () => {
  const e = (col, row) => ({ w: 2, h: 6, col, row, up: row > 0, down: row < 5, left: col > 0, right: col < 1 });
  const grid = { '0,0': [e(0, 1)], '1,0': [e(1, 1)], '0,-1': [] };
  const at = (x, y) => (grid[`${x},${y}`] ?? null);
  assert.deepEqual(cutSides(at, 0, 0), ['arriba'], 'fila 1 sin punta encima');
  assert.deepEqual(cutSides(at, 1, 0), [], 'encima de x 1 no se sabe (fuera): no avisa');
});

test('QA: árbol cortado por un stamp, roca de agua en tierra', async () => {
  const library = await loadStampLibrary(7);
  const def = {
    id: 'qa', tileset: 7, width: 10, height: 12,
    build: (b) => { b.fill(0, 'cesped'); b.rect(null, 0, 0, 4, 10, 'bosque'); b.stamp('cartel_madera', 2, 2); b.stamp('roca_agua', 7, 9); },
  };
  if (!library.stamps.cartel_madera) def.build = (b) => { b.fill(0, 'cesped'); b.rect(null, 0, 0, 4, 10, 'bosque'); b.erase(2, 2, 2, 1, 1); b.stamp('roca_agua', 7, 9); };
  const built = buildMap(def, { library, paintBrush });
  const qa = await qaMap({ def, built, tileset: tilesets[7] });
  assert.ok(qa.cutTrees.length > 0, 'árbol cortado');
  assert.deepEqual(qa.waterRocks.map((r) => r.name), ['roca_agua']);
});
