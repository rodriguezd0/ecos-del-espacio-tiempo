// Libreta: pestañas Diario (hitos vividos a partir de flags de bloque) y Células (recuento por mapa visitado).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { NOTEBOOK_TABS, journalRows, cellRows, tabCounter } from '../game/src/content/story/notebook.js';
import { JOURNAL_BLOCKS, JOURNAL_TOTAL } from '../game/src/content/story/journal.js';
import { FRAGMENTS } from '../game/src/content/story/fragments.js';
import { cellsOnMap, CELLS } from '../game/src/content/zygarde/cells.js';

const newState = () => GameState.create({ name: 'Prueba', gender: 'F', playerId: 7 });

test('la Libreta tiene las pestañas de TABLILLAS §4.2 (Pistas, Crónica, Profecía, Diario, Células) y las Tablillas', () => {
  const ids = NOTEBOOK_TABS.map((t) => t.id);
  for (const id of ['clues', 'chronicle', 'prophecy', 'journal', 'cells', 'tablets']) assert.ok(ids.includes(id), id);
  assert.equal(NOTEBOOK_TABS.find((t) => t.id === 'journal').name, 'Diario');
  assert.equal(NOTEBOOK_TABS.find((t) => t.id === 'cells').name, 'Células');
});

test('Diario: vacío al empezar; una entrada por bloque completado y por Pilar restaurado, en orden de bloque', () => {
  const st = newState();
  assert.deepEqual(journalRows(st), []);
  assert.equal(tabCounter(st, 'journal'), `Hitos 0/${JOURNAL_TOTAL}`);
  st.setFlag('b01_left_town');
  st.setFlag('p1_restored');
  st.setFlag('b03_gael_b2');
  const rows = journalRows(st);
  assert.deepEqual(rows.map((r) => r.block), ['B01', 'B02', 'B03']);
  assert.deepEqual(rows.map((r) => r.kind), ['block', 'pillar', 'block']);
  const p1 = rows[1];
  assert.equal(p1.title, FRAGMENTS[0].name);
  assert.ok(p1.lines.some((l) => l.includes('Fragmento Azur 1')));
  assert.ok(p1.lines.includes(FRAGMENTS[0].localEffect));
  for (const r of rows) {
    assert.ok(r.label && r.title && r.lines.length, JSON.stringify(r));
  }
  assert.equal(tabCounter(st, 'journal'), `Hitos 3/${JOURNAL_TOTAL}`);
  assert.equal(JOURNAL_TOTAL, JOURNAL_BLOCKS.length + FRAGMENTS.length);
});

test('Diario: los flags de bloque son únicos y no repiten los de Pilar', () => {
  const flags = JOURNAL_BLOCKS.map((b) => b.flag);
  assert.equal(new Set(flags).size, flags.length);
  for (const f of FRAGMENTS) assert.ok(!flags.includes(f.flag), f.flag);
});

test('Células: una fila por mapa visitado con células, con el recuento encontrado/total', () => {
  const st = newState();
  assert.deepEqual(cellRows(st), []);
  st.setPosition('villa_alba', 5, 5, 2);
  st.setPosition('ruta_1', 5, 5, 2);
  st.setPosition('casa_prota_1f', 5, 5, 2);
  const ruta = cellsOnMap('ruta_1');
  st.addCell(ruta[0].key);
  st.addCell(ruta[1].key);
  const rows = cellRows(st);
  assert.deepEqual(rows.map((r) => r.mapId), ['villa_alba', 'ruta_1'], 'solo mapas visitados con células');
  const r1 = rows[1];
  assert.equal(r1.total, ruta.length);
  assert.equal(r1.found, 2);
  assert.equal(r1.name, 'Ruta 1');
  assert.equal(r1.cells.filter((c) => c.found).length, 2);
  assert.ok(r1.cells.filter((c) => !c.found).every((c) => c.where === null), 'las que faltan no se revelan');
  assert.equal(tabCounter(st, 'cells'), `Células 2/${CELLS.length}`);
});
