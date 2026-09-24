// Bloque 11 — calidad de construcción de los mapas: ningún stamp sustituye tiles ya pintados (flores sobre el borde
// de un camino, rocas sobre la copa o el tronco de un árbol, piezas del campamento unas encima de otras…), ni hay
// avisos del MapBuilder, y los detalles que coloca paint.js#decorate respetan el suelo y las casillas reservadas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MapBuilder } from '../game/src/world/mapBuilder.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { safeStamp, fillGaps } from '../game/src/content/maps/b11/paint.js';
import { CAMP_PIECES } from '../game/src/content/maps/b11/campamento_monte_build.js';
import { CAMP_GONE_PATCH } from '../game/src/content/events/b11_camp.js';
import { CAMP } from '../game/src/content/maps/b11/layout.js';

const MAPS = ['ruta_9_neblino', 'ruta_10', 'campamento_monte', 'cerro_alba', 'mnemos_casa_iker', 'mnemos_pozo_custodios'];

/** Construye `id` registrando cada escritura de un stamp sobre un tile distinto ya pintado. */
async function overwritesOf(id) {
  const hits = [];
  const { stamp, set } = MapBuilder.prototype;
  MapBuilder.prototype.stamp = function patchedStamp(name, x, y, opts) {
    const prev = this.inStampB11;
    this.inStampB11 = typeof name === 'string' ? name : 'def';
    try { return stamp.call(this, name, x, y, opts); } finally { this.inStampB11 = prev; }
  };
  MapBuilder.prototype.set = function patchedSet(layer, x, y, tile) {
    // Las salidas de interior (`salida_*`) abren a propósito un hueco en el marco de la habitación.
    if (this.inStampB11 && !this.inStampB11.startsWith('salida_') && this.inBounds(x, y)) {
      const cur = this.layers[layer][x + y * this.width];
      if (cur && cur !== tile) hits.push(`${this.inStampB11} (${x},${y}) capa ${layer}: ${cur} → ${tile}`);
    }
    return set.call(this, layer, x, y, tile);
  };
  try {
    const { warnings } = await buildMapNode(id);
    return { hits, warnings };
  } finally {
    MapBuilder.prototype.stamp = stamp;
    MapBuilder.prototype.set = set;
  }
}

for (const id of MAPS) {
  test(`${id}: ningún stamp sustituye tiles ya pintados y el MapBuilder no avisa`, async () => {
    const { hits, warnings } = await overwritesOf(id);
    assert.deepEqual(hits, [], 'sustituciones');
    assert.deepEqual(warnings, [], 'avisos de construcción');
  });
}

/** MapBuilder mínimo sobre una biblioteca de stamps en memoria. */
function tinyBuilder() {
  const stamps = {
    mata: { tiles: { w: 2, h: 2, layers: [null, null, [11, 12, 13, 14]] } },
    flor: { tiles: { w: 1, h: 1, layers: [null, [21], null] } },
  };
  return new MapBuilder({ width: 8, height: 8, library: { stamps, brushes: {} }, isEmpty: () => false });
}

test('safeStamp: solo sobre suelo despejado y fuera de las casillas vetadas', () => {
  const b = tinyBuilder();
  b.set(1, 3, 3, 99); // un camino
  assert.equal(safeStamp(b, 'flor', 3, 3), false, 'no sustituye un tile de camino');
  assert.equal(safeStamp(b, 'mata', 2, 2), false, 'ni lo tapa con una pieza de capa 2');
  assert.equal(safeStamp(b, 'mata', 2, 2, { over: [1] }), true, 'salvo que se permita esa capa');
  assert.equal(safeStamp(b, 'flor', 0, 0, { avoid: (x, y) => x === 0 && y === 0 }), false, 'casilla reservada');
  assert.equal(safeStamp(b, 'flor', 6, 6), true);
  assert.equal(b.get(1, 6, 6), 21);
});

test('fillGaps: rellena los huecos cerrados de 2–3 filas sin tocar lo abierto', () => {
  const b = tinyBuilder();
  const open = (x, y) => y < 2 || y > 4; // hueco cerrado en las filas 2–4
  fillGaps(b, { width: 8, height: 8, open, stamps: ['mata'], skip: 0 });
  for (let x = 0; x < 8; x++) {
    assert.equal(b.get(2, x, 0), 0, 'lo abierto sigue libre');
    assert.ok(b.get(2, x, 3) || b.get(2, x, 4), `columna ${x}: hueco cubierto`);
  }
});

test('campamento: el parche de la marcha borra las piezas enteras y nada más', () => {
  assert.ok(CAMP_PIECES.length >= 8);
  const cells = new Set(CAMP_GONE_PATCH.map(([x, y, l]) => `${x},${y},${l}`));
  assert.equal(cells.size, CAMP_GONE_PATCH.length, 'sin casillas repetidas (piezas solapadas)');
  for (const [x, y, , tile] of CAMP_GONE_PATCH) {
    assert.equal(tile, 0);
    assert.ok(x >= 0 && y >= 0 && x < CAMP.width && y < CAMP.height, `(${x},${y}) fuera del mapa`);
  }
});
