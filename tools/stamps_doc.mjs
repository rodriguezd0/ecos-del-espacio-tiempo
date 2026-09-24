// Genera docs/stamps.md (guía + catálogo) a partir de las bibliotecas horneadas.
// Uso: node tools/stamps_doc.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './stamps_lib.mjs';
import { STAMP_LIBRARIES, loadStampLibrary } from '../game/src/content/stamps/index.js';
import { brushKind } from '../game/src/content/stamps/brushes.js';

const GUIDE = `# Biblioteca de stamps y brushes

Piezas reutilizables para construir los mapas originales de Axis con los tilesets de Añil
(contrato: \`docs/ARCHITECTURE.md\` §5). **Este archivo se genera** con \`node tools/stamps_doc.mjs\`;
edita la guía en esa herramienta y el catálogo en las definiciones.

- **Stamp**: bloque fijo de tiles (edificio, árbol, mueble, boca de cueva…) en 1–3 capas, con metadatos
  (\`door\` = casilla de la puerta/warp relativa al stamp, \`solid\`, \`tags\`, \`desc\`).
- **Brush**: relleno inteligente sobre un conjunto de casillas (césped, caminos con bordes, agua, bosque,
  terrazas, habitaciones…). Se calcula con \`paintBrush\`.

## Archivos

| Archivo | Qué es |
|---|---|
| \`game/src/content/stamps/<Imagen>.js\` | Definición legible por tileset (\`src\` / \`from\` / \`tiles\` + metadatos + brushes) |
| \`game/src/content/stamps/baked/<Imagen>.js\` | **Generado** por \`tools/stamps_bake.mjs\`: rejillas de IDs resueltas (los mapas de Añil no se sirven en el juego) |
| \`game/src/content/stamps/index.js\` | API de carga y colocación (pura, sin DOM) |
| \`game/src/content/stamps/brushes.js\` | Algoritmos de brushes (puros) |
| \`game/src/content/stamps/viewer.html\` | Visor en el navegador: <http://localhost:8080/src/content/stamps/viewer.html> |

## API (para el MapBuilder)

\`\`\`js
import { loadStampLibrary, stampWrites, stampDoor } from '../content/stamps/index.js';
import { paintBrush, rectCells } from '../content/stamps/brushes.js';

const lib = await loadStampLibrary(7);          // por ID de tileset (12–15 → Cueva1)
const casa = lib.stamp('casa_roja');            // { name, w, h, layers: [number[]|null ×3], door, tags, desc, … }
for (const w of stampWrites(casa, 10, 6)) layers[w.layer][w.x + w.y * width] = w.id; // solo celdas no vacías
stampDoor(casa, 10, 6);                         // → { x: 14, y: 13 } casilla del warp
for (const w of paintBrush(lib.brush('camino_arena'), rectCells(4, 12, 20, 3), { width, height })) { /* igual */ }
lib.byTag('edificio');                          // stamps por etiqueta
\`\`\`

- \`paintBrush(brush, cells, { seed, width, height, inMask })\` devuelve \`[{ x, y, layer, id }]\`; \`cells\` es la
  máscara del trazo. \`inMask\` permite calcular bordes con otra máscara (p. ej. agua ya pintada).
- Los brushes \`room\` y \`cave\` escriben también fuera de \`cells\` (marco / paredes alrededor del suelo).
- \`buildStampLibrary\` lanza un error claro si el horneado está desfasado respecto a la definición.

## Tipos de brush

| Tipo | Definición | Uso |
|---|---|---|
| \`tile\` | \`{ tile, variants?, chance? }\` | Relleno con variantes deterministas |
| \`pattern\` | \`{ pattern: [x, y, w, h] }\` | Mosaico por posición absoluta (césped 4×4, suelos de cueva 3×3) |
| \`grid\` | \`{ grid: [[id, id], [id, id]] }\` | Mosaico de IDs explícitos (agua de exterior) |
| \`autotile\` | \`{ autotile: slot }\` | Autotile resuelto por vecinos (agua de cueva, flores animadas) |
| \`nine\` | \`{ nine: [x, y], inner?, fill? }\` / \`{ nine: 'ids', ids }\` | Borde 3×3 + esquinas cóncavas 2×2 (orden NO, NE / SO, SE) |
| \`forest\` | \`{ forest: { trees, size, period } }\` | Bosque de árboles 2×6 apilados cada 4 filas (copas capa 2, troncos capa 1) |
| \`cliff\` | \`{ cliff: { src, width, faceRows, rows? } }\` | Macizo rocoso convexo con cara de 3 filas |
| \`terrace\` | \`{ terrace: { rim, side, face } }\` | Terraza de muros finos convexa (ancho ≥ 5) |
| \`room\` | \`{ room: { wall, floor, floorShade, void, frame } }\` | Habitación interior con marco (capas 0 y 2) |
| \`cave\` | \`{ cave: { floor, void, ring } }\` | Sala de cueva rectangular con paredes |
| \`line\` | \`{ line: { ids \\| src, axis } }\` | Línea con extremos (salientes, vallas) |

## Convenciones y hallazgos

- **Capas**: suelo en 0; caminos, hierba alta, orillas y alfombras en 1; edificios, árboles y muebles en 2
  (como en Añil: así la sombra de un edificio cubre el camino de la capa 1).
- **Pasabilidad**: la da el tileset (\`passages\`/\`priorities\`/\`terrainTags\`); \`solid\` es solo informativo.
- **Agua de exterior**: el autotile \`agua\` de Añil solo tiene válidos los 4 bloques interiores; sus bordes llevan
  una **X roja**. No usar \`{ autotile: 1 }\`: usar el brush \`agua\` (grid) y encima \`orilla\` con la misma máscara.
  El agua de cueva (autotile 6) sí es un autotile completo.
- **Terrain tags** útiles (tileset 7): hierba alta 388 (morada) y 396 (verde); salientes 651/657/652; arena 416–434.
- **Brushes convexos**: \`cliff\`, \`terrace\`, \`room\` y \`cave\` trabajan sobre el rectángulo/forma convexa; para
  formas en L combina varios trazos o usa los recortes probados (\`sala_cruz\`…). Las alfombras y estanques \`nine\`
  quedan mejor rectangulares.
- **Bosque**: ancho par; alto ideal 4k+2 para que la última fila sea de troncos. Un tipo de árbol por columna
  (\`mix: 'tree'\` para variar árbol a árbol).
- **Salidas de interior**: \`salida_casa\` / \`salida_lab\` se colocan con la esquina en (puertaX − 2 | − 1, fila
  inferior del suelo); el warp queda en \`door\` (fila del marco).
- **Bocas de cueva** sobre una sala con suelo x0..x1, y0..y1: \`boca_norte\` en (x, y0 − 4), \`salida_luz_sur\`
  en (x, y1), \`boca_oeste\` en (x0 − 3, y), \`boca_este\` en (x1, y).
- **Recortes \`from\`**: los mapas del tileset 1 (Exterior1) comparten casi todos los IDs con ExteriorBosqueCeleste;
  el horneado avisa de cuántos tiles difieren y cada recorte se revisó dibujado con el tileset destino.
- Nada de esto es canon: los stamps son piezas gráficas. La distribución de los mapas de Axis se decide aparte
  (biblia §05: el pueblo inicial sigue pendiente de aprobación artística).

## Herramientas

| Comando | Para qué |
|---|---|
| \`node tools/find_tiles.mjs <Imagen> [--rows=a-b]\` | Hojas del tileset original con nº de fila/columna e ID (\`tools/cache/stamps/tiles\`) |
| \`node tools/find_tiles.mjs --map=<id> --region=x,y,w,h [--as=<ts>]\` | Recorte de un mapa de Añil con coordenadas (dibujable con otro tileset) |
| \`node tools/find_tiles.mjs --dump=<id> --region=… \` / \`--usage=<tile> [--tileset=<ts>]\` | IDs de un recorte / dónde se usa un tile |
| \`node tools/stamps_components.mjs <Imagen> --rows=a-b\` | Rectángulos de objetos separados por tiles vacíos |
| \`node tools/stamps_bake.mjs [Imagen]\` | Hornea y valida (IDs, puertas, compatibilidad de recortes) |
| \`node tools/preview_stamps.mjs <Imagen> [--only=a,b] [--tag=t]\` | Hojas de contacto de stamps y brushes (\`tools/cache/stamps/preview\`) |
| \`node tools/stamps_demo.mjs\` | Composiciones de prueba técnica (\`tools/cache/stamps/demo\`) |
| \`node tools/stamps_doc.mjs\` | Regenera este documento |
| \`node --test tests/stamps.test.mjs\` | Sincronía definición↔horneado, IDs válidos y algoritmos |

Para añadir un stamp: localiza el rectángulo con \`find_tiles\`, añádelo a la definición, hornea, revisa la hoja
con \`preview_stamps --only=<nombre>\` y ejecuta los tests.
`;

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
  const priority = ['7', '4', '2'];
  const ids = [...priority.filter((id) => STAMP_LIBRARIES[id]), ...Object.keys(STAMP_LIBRARIES).filter((id) => !priority.includes(id))];
  for (const id of ids) {
    const lib = await loadStampLibrary(Number(id));
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
