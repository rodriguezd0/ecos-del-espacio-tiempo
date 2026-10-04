import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { qaMap } from '../tools/lib/map_qa.mjs';

const ids = ['santuario_alma', 'santuario_alma_sentir', 'santuario_alma_querer', 'senda_mirador', 'camara_cruce_nucleo', 'puente_convergencia', 'sima_eje'];

test('los Pilares 8–10 se construyen con todas sus piezas disponibles', async () => {
  for (const id of ids) {
    const built = await buildMapNode(id);
    assert.deepEqual(built.warnings, [], id);
  }
});

test('la decoración de los Pilares 8–10 solo conserva los solapes intencionales de los espejos', async () => {
  for (const id of ids) {
    const qa = await qaMap(await buildMapNode(id));
    const overlaps = qa.stampOverlaps.filter((o) => o.other !== 'árbol');
    assert.equal(overlaps.length, id === 'santuario_alma_sentir' ? 13 : 0, `${id}: sólidos pisándose`);
    assert.equal(qa.cutTrees.length, 0, `${id}: árboles enteros`);
    assert.equal(qa.treeEvents.length, 0, `${id}: eventos fuera de árboles`);
  }
});
