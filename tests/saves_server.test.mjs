// Partidas en el disco del servidor (server/saves.mjs) y su sincronía con el navegador (core/saveSync.js):
// servidor HTTP real sobre una carpeta temporal, fetch real y un localStorage simulado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { handleSaves } from '../server/saves.mjs';
import { syncSaves, pushSave, listServerSaves, fetchServerSave, ownerId, deleteRemote } from '../game/src/core/saveSync.js';

function memoryStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), map: m };
}

async function startServer() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecos-saves-'));
  const server = http.createServer((req, res) => {
    handleSaves(req, res, dir).then((mine) => { if (!mine) res.writeHead(404).end(); });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const fetchImpl = (url, opts) => fetch(base + url, opts);
  return { dir, fetchImpl, close: () => new Promise((r) => server.close(r)) };
}

const save = (name, savedAt) => ({ player: { name }, party: [], savedAt });

test('partidas en el servidor: se escriben en disco, se reconcilian por fecha y sobreviven a un navegador vacío', async () => {
  const srv = await startServer();
  try {
    const browserA = memoryStorage({ 'ecos.save.1': JSON.stringify(save('Ana', 100)) });
    const owner = ownerId(browserA);
    let r = await syncSaves({ fetchImpl: srv.fetchImpl, storage: browserA });
    assert.deepEqual(r, { pulled: [], pushed: [1] }, 'lo local que el servidor no tiene se sube');
    const onDisk = JSON.parse(fs.readFileSync(path.join(srv.dir, owner, 'ranura1.json'), 'utf8'));
    assert.equal(onDisk.player.name, 'Ana');

    await pushSave(2, save('Ana', 300), { fetchImpl: srv.fetchImpl, storage: browserA });
    browserA.removeItem('ecos.save.2');
    browserA.setItem('ecos.save.1', JSON.stringify(save('Ana', 50))); // copia local más vieja
    r = await syncSaves({ fetchImpl: srv.fetchImpl, storage: browserA });
    assert.deepEqual(r, { pulled: [1, 2], pushed: [] }, 'gana la copia más reciente');
    assert.equal(JSON.parse(browserA.getItem('ecos.save.1')).savedAt, 100);

    // Navegador nuevo (se perdió el id): recuperación desde la lista global.
    const list = await listServerSaves({ fetchImpl: srv.fetchImpl });
    assert.deepEqual(list.map((s) => [s.name, s.slot]), [['Ana', 2], ['Ana', 1]]);
    const data = await fetchServerSave(list[0].owner, list[0].slot, { fetchImpl: srv.fetchImpl });
    assert.equal(data.savedAt, 300);

    await deleteRemote(2, { fetchImpl: srv.fetchImpl, storage: browserA });
    assert.equal(fs.existsSync(path.join(srv.dir, owner, 'ranura2.json')), false);
  } finally {
    await srv.close();
  }
});

test('partidas en el servidor: rechaza dueños, ranuras y datos no válidos', async () => {
  const srv = await startServer();
  try {
    const put = (url, body) => srv.fetchImpl(url, { method: 'PUT', body: JSON.stringify(body) });
    assert.equal((await put('/__saves/..%2F..%2Fx/1', save('X', 1))).status, 400);
    assert.equal((await put('/__saves/abcdefgh12/99', save('X', 1))).status, 400);
    assert.equal((await put('/__saves/abcdefgh12/1', { nope: true })).status, 400);
    assert.equal((await put('/__saves/abcdefgh12/1', save('X', 1))).status, 200);
  } finally {
    await srv.close();
  }
});
