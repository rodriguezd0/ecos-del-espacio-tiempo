// Partidas guardadas en el disco del servidor (carpeta saves/ del proyecto): sobreviven a reinicios del servidor y a
// que el navegador borre su almacenamiento. Cada navegador tiene un id de dueño (core/saveSync.js); cada ranura es
// un archivo legible saves/<dueño>/ranura<N>.json, escrito de forma atómica (temporal + renombrar).
//   GET    /__saves                 → [{ owner, slots: [{ slot, name, savedAt }] }]   (recuperar partidas)
//   GET    /__saves/<dueño>         → { <ranura>: datos }
//   PUT    /__saves/<dueño>/<N>     ← datos de la partida (JSON)
//   DELETE /__saves/<dueño>/<N>
import fs from 'node:fs/promises';
import path from 'node:path';

export const SAVES_PREFIX = '/__saves';
const OWNER = /^[a-z0-9]{8,40}$/;
const MAX_SLOT = 16;
const MAX_BYTES = 8 * 1024 * 1024;

const slotFile = (dir, owner, slot) => path.join(dir, owner, `ranura${slot}.json`);

function sendJson(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BYTES) { reject(new Error('Partida demasiado grande')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readSlots(dir, owner) {
  const out = {};
  let files = [];
  try {
    files = await fs.readdir(path.join(dir, owner));
  } catch {
    return out;
  }
  for (const f of files) {
    const m = /^ranura(\d+)\.json$/.exec(f);
    if (!m) continue;
    try {
      out[m[1]] = JSON.parse(await fs.readFile(path.join(dir, owner, f), 'utf8'));
    } catch (err) {
      console.error(`[partidas] ${owner}/${f} ilegible: ${err.message}`);
    }
  }
  return out;
}

async function listAll(dir) {
  let owners = [];
  try {
    owners = (await fs.readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory() && OWNER.test(d.name)).map((d) => d.name);
  } catch {
    return [];
  }
  const out = [];
  for (const owner of owners) {
    const slots = Object.entries(await readSlots(dir, owner)).map(([slot, data]) => ({
      slot: Number(slot), name: data?.player?.name || '?', savedAt: data?.savedAt || 0,
    }));
    if (slots.length) out.push({ owner, slots });
  }
  return out;
}

/**
 * Atiende /__saves… Devuelve true si la petición era suya.
 * @param {string} dir carpeta de partidas (se crea al guardar)
 */
export async function handleSaves(req, res, dir) {
  const url = req.url.split('?')[0];
  if (url !== SAVES_PREFIX && !url.startsWith(`${SAVES_PREFIX}/`)) return false;
  const [owner, slotText] = url.slice(SAVES_PREFIX.length + 1).split('/');
  try {
    if (!owner) {
      if (req.method === 'GET') sendJson(res, 200, await listAll(dir));
      else sendJson(res, 405, { error: 'Método no permitido' });
      return true;
    }
    if (!OWNER.test(owner)) { sendJson(res, 400, { error: 'Dueño no válido' }); return true; }
    if (slotText === undefined) {
      if (req.method !== 'GET') { sendJson(res, 405, { error: 'Método no permitido' }); return true; }
      sendJson(res, 200, await readSlots(dir, owner));
      return true;
    }
    const slot = Number(slotText);
    if (!Number.isInteger(slot) || slot < 1 || slot > MAX_SLOT) { sendJson(res, 400, { error: 'Ranura no válida' }); return true; }
    const file = slotFile(dir, owner, slot);
    if (req.method === 'PUT') {
      const data = JSON.parse(await readBody(req));
      if (!data || typeof data !== 'object' || !data.player) { sendJson(res, 400, { error: 'No es una partida' }); return true; }
      await fs.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(data, null, 1));
      await fs.rename(tmp, file);
      sendJson(res, 200, { ok: true, savedAt: data.savedAt || null });
      return true;
    }
    if (req.method === 'DELETE') {
      await fs.rm(file, { force: true });
      sendJson(res, 200, { ok: true });
      return true;
    }
    sendJson(res, 405, { error: 'Método no permitido' });
  } catch (err) {
    console.error(`[partidas] ${req.method} ${url}: ${err.message}`);
    sendJson(res, 500, { error: 'No se pudo guardar en el servidor' });
  }
  return true;
}
