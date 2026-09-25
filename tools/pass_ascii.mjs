// Pasabilidad de un mapa en ASCII (para revisar puertas, huecos y pasos sin abrir imágenes).
// Uso: node tools/pass_ascii.mjs <id> [x0 y0 x1 y1]
//   . pisable · # bloqueado · ~ agua navegable · = saliente · " hierba con encuentros
import { buildMapNode } from './lib/map_node.mjs';

const [id, ...rest] = process.argv.slice(2);
if (!id) { console.error('Uso: node tools/pass_ascii.mjs <id> [x0 y0 x1 y1]'); process.exit(1); }
const { entry, def } = await buildMapNode(id);
const map = entry.map;
const [x0, y0, x1, y1] = rest.length === 4 ? rest.map(Number) : [0, 0, map.width - 1, map.height - 1];
const warps = new Set((def.warps || []).map((w) => `${w.x},${w.y}`));
const pad = (n) => String(n).padStart(3, ' ');
let head = '    ';
for (let x = x0; x <= x1; x++) head += x % 10 === 0 ? String((x / 10) % 10) : ' ';
console.log(head);
head = '    ';
for (let x = x0; x <= x1; x++) head += String(x % 10);
console.log(head);
for (let y = y0; y <= y1; y++) {
  let row = `${pad(y)} `;
  for (let x = x0; x <= x1; x++) {
    const t = map.terrainTagAt(x, y);
    let c = '.';
    if (warps.has(`${x},${y}`)) c = 'W';
    else if (t.ledge) c = '=';
    else if (t.canSurf && !map.passableStrict(x, y)) c = '~';
    else if (!map.passableStrict(x, y)) c = '#';
    else if (t.landWildEncounters) c = '"';
    row += c;
  }
  console.log(row);
}
