// Coherencia del contenido con el registro de células (content/zygarde/cells.js): toda célula de campaña
// colocada en un mapa registrado debe estar en ese mapa según el registro, y ninguna clave se repite entre
// mapas. Las células de los mapas de prueba (claves que no empiezan por `cell_`) quedan fuera.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS } from '../game/src/content/maps/index.js';
import { cellByKey } from '../game/src/content/zygarde/cells.js';
import { CELL_MAPS } from '../game/src/content/zygarde/cells.js';

async function loadDefs() {
  const out = [];
  for (const [id, loader] of Object.entries(MAPS)) {
    try {
      out.push({ id, def: (await loader()).default });
    } catch (err) {
      if (err.code === 'ERR_MODULE_NOT_FOUND') continue; // mapa registrado aún sin módulo
      throw err;
    }
  }
  return out;
}

test('células de campaña colocadas en mapas: coinciden con el registro y no se repiten', async () => {
  const seen = new Map();
  for (const { id, def } of await loadDefs()) {
    for (const ev of def.events || []) {
      if (!ev || ev.type !== 'zygardeCell' || typeof ev.cell !== 'string') continue;
      if (seen.has(ev.cell)) assert.fail(`célula ${ev.cell} repetida en ${seen.get(ev.cell)} y ${id}`);
      seen.set(ev.cell, id);
      if (!ev.cell.startsWith('cell_')) continue; // mapas de prueba
      const c = cellByKey(ev.cell);
      assert.ok(c, `${id}: la célula ${ev.cell} no está en el registro (content/zygarde/cells.js)`);
      assert.equal(c.map, id, `${ev.cell} (${c.id}) está en ${id} pero el registro la sitúa en ${c.map}`);
      assert.ok(!c.scripted, `${ev.cell} se entrega por guion: no debería ser un evento del mundo`);
    }
  }
});

test('los mapas de prueba de Zygarde están registrados y tienen 3 células', async () => {
  assert.ok(MAPS.dev_zygarde && MAPS.dev_zygarde_fondo);
  const def = (await MAPS.dev_zygarde()).default;
  assert.equal(def.tileset, 1);
  assert.equal((def.events || []).filter((e) => e.type === 'zygardeCell').length, 3);
  const types = new Set((def.events || []).map((e) => e.type));
  for (const t of ['ramRock', 'roughTerrain', 'gravelSlope', 'climbWall', 'diveSpot', 'rebuildGap']) assert.ok(types.has(t), t);
  const fondo = (await MAPS.dev_zygarde_fondo()).default;
  assert.ok(fondo.underwater);
  const ft = new Set(fondo.events.map((e) => e.type));
  for (const t of ['diveVent', 'diveCurrent', 'diveSpot']) assert.ok(ft.has(t), t);
  assert.ok(CELL_MAPS.length > 40);
});
