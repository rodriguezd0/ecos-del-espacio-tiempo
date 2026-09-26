// Listado de problemas de arte de TODOS los mapas registrados → docs/QA_MAPAS.md (para los agentes que arreglan
// mapas): árboles cortados, stamps sobre árboles, stamps sólidos pisándose, eventos visibles dentro de un árbol,
// copas sobre caminos/hierba, rocas de agua en tierra (tools/lib/map_qa.mjs) y costuras entre mapas conectados
// (tools/check_seams.mjs, con PNG por conexión en tools/cache/seams/).
// Uso: node tools/qa_maps.mjs [--no-png] [--out=docs/QA_MAPAS.md] [mapa ...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAPS } from '../game/src/content/maps/index.js';
import { buildMapNode } from './lib/map_node.mjs';
import { qaMap } from './lib/map_qa.mjs';
import { mapFile } from './validate_content_lib.mjs';
import { checkSeams, seamLine } from './check_seams.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Agrupa casillas vecinas (4-conexas) en rectángulos «x0–x1, y0–y1». */
export function clusters(cells) {
  const left = new Map(cells.map((c) => [`${c[0]},${c[1]}`, c]));
  const out = [];
  for (const [k, c] of left) {
    if (!left.has(k)) continue;
    const group = [];
    const stack = [c];
    left.delete(k);
    while (stack.length) {
      const [x, y] = stack.pop();
      group.push([x, y]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nk = `${x + dx},${y + dy}`;
        if (left.has(nk)) { stack.push(left.get(nk)); left.delete(nk); }
      }
    }
    const xs = group.map((g) => g[0]); const ys = group.map((g) => g[1]);
    out.push({ x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), n: group.length });
  }
  return out.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
}

const rng = (a, b) => (a === b ? `${a}` : `${a}–${b}`);
const box = (c) => `x ${rng(c.x0, c.x1)}, y ${rng(c.y0, c.y1)}`;

function mapSection(id, file, qa) {
  const lines = [`### ${id}`, '', `\`${file}\``, ''];
  const add = (title, items) => { if (items.length) lines.push(`- **${title}** (${items.length}): ${items.join('; ')}`); };
  add('Árboles cortados', clusters(qa.cutTrees).map((c) => `${box(c)} (${c.n})`));
  add('Stamps sobre árboles', qa.stampOverlaps.filter((o) => o.other === 'árbol').map((o) => `\`${o.name}\` en (${o.x},${o.y})`));
  add('Stamps sólidos pisando otro', qa.stampOverlaps.filter((o) => o.other !== 'árbol').map((o) => `\`${o.name}\` (${o.x},${o.y}) sobre \`${o.other}\``));
  add('Eventos visibles dentro de un árbol', qa.treeEvents.map((e) => `\`${e.id}\` (${e.type}) en (${e.x},${e.y})`));
  add('Copa de árbol sobre camino/hierba/pieza de la capa 1', clusters(qa.groundUnderTrees).map((c) => `${box(c)} (${c.n})`));
  add('Rocas de agua sin agua debajo', qa.waterRocks.map((r) => `\`${r.name}\` en (${r.x},${r.y})`));
  lines.push('');
  return lines;
}

const count = (qa) => ({
  cut: qa.cutTrees.length,
  onTree: qa.stampOverlaps.filter((o) => o.other === 'árbol').length,
  solid: qa.stampOverlaps.filter((o) => o.other !== 'árbol').length,
  events: qa.treeEvents.length,
  under: qa.groundUnderTrees.length,
  rocks: qa.waterRocks.length,
});

async function main() {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
  const only = args.filter((a) => !a.startsWith('--'));
  const out = path.join(ROOT, opt('out', 'docs/QA_MAPAS.md'));
  const rows = [];
  for (const id of Object.keys(MAPS)) {
    if (only.length && !only.includes(id)) continue;
    let res;
    try { res = await buildMapNode(id); } catch (err) { rows.push({ id, error: err.message }); continue; }
    const qa = await qaMap(res);
    rows.push({ id, file: mapFile(MAPS[id]), qa, n: count(qa) });
  }
  const seams = await checkSeams({ only, png: !args.includes('--no-png'), scale: 0.5 });
  const bad = rows.filter((r) => r.error || Object.values(r.n).some(Boolean));
  const total = rows.reduce((t, r) => { for (const [k, v] of Object.entries(r.n || {})) t[k] = (t[k] || 0) + v; return t; }, {});
  const md = [
    '# QA de mapas: árboles, solapes y costuras',
    '',
    '**Generado** con `node tools/qa_maps.mjs` (no editar a mano; vuelve a generarlo tras arreglar un mapa). Reglas en',
    '`docs/stamps.md` («Bosques», «Pasabilidad de la decoración», «Herramientas de QA»). Coordenadas en casillas del mapa.',
    '',
    '- **Árboles cortados**: unidades de árbol a las que les falta una parte (copa sin punta, medio árbol, tronco tapado',
    '  por otro stamp o un camino). El pincel de bosque ya no los crea; quedan los que un stamp/camino pinta encima, los',
    '  claros del trazo y los árboles que no se pudieron completar porque encima había algo (evento, camino, stamp).',
    '- **Stamps sobre árboles** / **eventos dentro de un árbol**: carteles, plantas, rocas o NPC que atraviesan un árbol.',
    '- **Copa sobre capa 1**: la copa de un árbol tapa un camino, hierba alta u otra pieza (caminos que se cortan de golpe).',
    '- **Costuras**: `tools/check_seams.mjs` (PNG en `tools/cache/seams/<A>__<dir>__<B>.png`: rojo = árbol partido,',
    '  naranja = suelo que cambia de golpe, magenta = objeto cortado por el borde).',
    '',
    `Total: ${rows.length} mapas, ${bad.length} con avisos — ${total.cut || 0} casillas de árbol cortado, ${total.onTree || 0}`,
    `stamps sobre árboles, ${total.solid || 0} stamps sólidos pisando otro, ${total.events || 0} eventos dentro de árboles,`,
    `${total.under || 0} casillas de copa sobre capa 1, ${total.rocks || 0} rocas de agua en tierra; ${seams.filter((s) => s.error || s.trees.length || s.objects.length || s.ground.length).length}/${seams.length} costuras con problemas.`,
    '',
    '## Resumen por mapa',
    '',
    '| Mapa | Árboles cortados | Stamps sobre árboles | Sólidos pisándose | Eventos en árbol | Copa sobre capa 1 | Rocas de agua |',
    '|---|---|---|---|---|---|---|',
    ...bad.map((r) => (r.error ? `| ${r.id} | no construye: ${r.error} | | | | | |`
      : `| ${r.id} | ${r.n.cut || ''} | ${r.n.onTree || ''} | ${r.n.solid || ''} | ${r.n.events || ''} | ${r.n.under || ''} | ${r.n.rocks || ''} |`)),
    '',
    '## Costuras entre mapas conectados',
    '',
    ...seams.map((s) => `- ${seamLine(s)}`),
    '',
    '## Detalle por mapa',
    '',
    ...bad.filter((r) => !r.error).flatMap((r) => mapSection(r.id, r.file, r.qa)),
  ];
  fs.writeFileSync(out, `${md.join('\n')}\n`);
  console.log(`${path.relative(ROOT, out)}: ${bad.length}/${rows.length} mapas con avisos; costuras con problemas: ${seams.filter((s) => s.trees?.length || s.objects?.length || s.ground?.length).length}/${seams.length}`);
}

main();
