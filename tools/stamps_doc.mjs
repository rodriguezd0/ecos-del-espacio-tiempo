// Genera docs/stamps.md (guía + catálogo) a partir de las bibliotecas horneadas.
// La guía está en tools/stamps_doc_guide.mjs; el catálogo sale de las definiciones.
// Uso: node tools/stamps_doc.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './stamps_lib.mjs';
import { GUIDE } from './stamps_doc_guide.mjs';
import { STAMP_LIBRARIES, loadStampLibrary } from '../game/src/content/stamps/index.js';
import { brushKind } from '../game/src/content/stamps/brushes.js';

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');

function stampRow(s) {
  const layers = s.layers.map((g, i) => (g ? i : null)).filter((v) => v !== null).join(',');
  return `| \`${s.name}\` | ${s.w}×${s.h} | ${layers} | ${s.door ? s.door.join(',') : ''} | ${s.tags.join(', ')} | ${esc(s.desc)} |`;
}

function brushRow(name, b) {
  return `| \`${name}\` | ${brushKind(b)} | ${b.layer ?? '—'} | ${esc(b.desc)} |`;
}

async function main() {
  const parts = [GUIDE, '## Catálogo', ''];
  const priority = ['7', '1', '3', '5', '6', '9', '2', '4', '11', '8'];
  const ids = [...priority.filter((id) => STAMP_LIBRARIES[id]), ...Object.keys(STAMP_LIBRARIES).filter((id) => !priority.includes(id))];
  parts.push('| Tileset | Imagen | Stamps | Brushes |', '|---|---|---|---|');
  const libs = [];
  for (const id of ids) {
    const lib = await loadStampLibrary(Number(id));
    libs.push([id, lib]);
    parts.push(`| ${id}${id === '2' ? ' (y 12–15)' : ''} | ${lib.image} | ${Object.keys(lib.stamps).length} | ${Object.keys(lib.brushes).length} |`);
  }
  parts.push('');
  for (const [id, lib] of libs) {
    const stamps = Object.values(lib.stamps);
    const brushes = Object.entries(lib.brushes);
    parts.push(`### Tileset ${id} · ${lib.image} (${stamps.length} stamps, ${brushes.length} brushes)`, '');
    parts.push('| Stamp | Tamaño | Capas | Puerta | Etiquetas | Descripción |', '|---|---|---|---|---|---|');
    parts.push(...stamps.map(stampRow), '');
    parts.push('| Brush | Tipo | Capa | Descripción |', '|---|---|---|---|');
    parts.push(...brushes.map(([n, b]) => brushRow(n, b)), '');
  }
  const file = path.join(ROOT, 'docs', 'stamps.md');
  fs.writeFileSync(file, parts.join('\n'), 'utf8');
  console.log(`→ ${file}`);
}

main().catch((err) => {
  console.error(`stamps_doc: ${err.message}`);
  process.exit(1);
});
