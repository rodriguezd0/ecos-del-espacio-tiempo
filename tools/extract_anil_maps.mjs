// Vuelca los mapas de Añil a JSON de referencia (NO son mapas de Axis: sirven para
// estudiar composiciones y recortar "stamps" de edificios, árboles, etc.).
// Uso: node tools/extract_anil_maps.mjs  → tools/cache/anil_maps/{index.json, NNN.json}
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMarshal } from './lib/marshal.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'Pokemon Anil V4.13', 'Data');
const OUT = path.join(ROOT, 'tools', 'cache', 'anil_maps');
fs.mkdirSync(OUT, { recursive: true });

const infos = loadMarshal(fs.readFileSync(path.join(DATA, 'MapInfos.rxdata')));
const index = [];
for (const [id, info] of infos) {
  const file = path.join(DATA, `Map${String(id).padStart(3, '0')}.rxdata`);
  if (!fs.existsSync(file)) continue;
  const map = loadMarshal(fs.readFileSync(file));
  const { xsize: w, ysize: h, zsize: d } = map.data;
  const layers = [];
  for (let z = 0; z < d; z++) layers.push(Array.from(map.data.data.subarray(z * w * h, (z + 1) * w * h)));
  const events = [];
  for (const ev of map.events.values()) {
    const page = ev.pages[0];
    events.push({
      id: ev.id, name: ev.name, x: ev.x, y: ev.y,
      graphic: page?.graphic?.character_name || '', tileId: page?.graphic?.tile_id || 0,
      direction: page?.graphic?.direction || 2, pages: ev.pages.length,
    });
  }
  const entry = { id, name: info.name, parent: info.parent_id, tileset: map.tileset_id, width: w, height: h, bgm: map.bgm?.name || '' };
  index.push(entry);
  fs.writeFileSync(path.join(OUT, `${String(id).padStart(3, '0')}.json`), JSON.stringify({ ...entry, layers, events }));
}
index.sort((a, b) => a.id - b.id);
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
console.log(`${index.length} mapas de Añil volcados en tools/cache/anil_maps`);
