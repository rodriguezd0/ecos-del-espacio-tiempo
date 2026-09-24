// Regenera los registros de contenido a partir de los archivos existentes (determinista).
// Así varios agentes pueden añadir mapas/entrenadores en paralelo sin editar el mismo índice a mano.
//   game/src/content/maps/index.js      ← todo módulo de content/maps/**.js cuyo export default tenga `id`
//   game/src/content/trainers/index.js  ← todo content/trainers/*.js (excepto index.js)
// Uso: node tools/gen_registries.mjs [--check]   (--check: falla si el índice no está al día)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'game', 'src', 'content');
const check = process.argv.includes('--check');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const rel = (from, to) => `./${path.relative(from, to).replace(/\\/g, '/')}`;

async function mapsIndex() {
  const dir = path.join(CONTENT, 'maps');
  const entries = [];
  for (const file of walk(dir).sort()) {
    if (path.basename(file) === 'index.js') continue;
    let def;
    try {
      def = (await import(pathToFileURL(file).href)).default;
    } catch (err) {
      throw new Error(`No se pudo importar ${path.relative(ROOT, file)}: ${err.message}`);
    }
    if (!def || typeof def !== 'object' || !def.id || !(def.width || def.build || def.layers)) continue;
    entries.push({ id: def.id, file });
  }
  const seen = new Map();
  for (const e of entries) {
    if (seen.has(e.id)) throw new Error(`Id de mapa duplicado "${e.id}": ${seen.get(e.id)} y ${e.file}`);
    seen.set(e.id, e.file);
  }
  entries.sort((a, b) => a.file.localeCompare(b.file));
  const lines = entries.map((e) => `  ${JSON.stringify(e.id)}: () => import(${JSON.stringify(rel(dir, e.file))}),`);
  return `// GENERADO por tools/gen_registries.mjs — no editar a mano (ejecuta: node tools/gen_registries.mjs).
// Registro de mapas de Axis: id → import dinámico del módulo de definición (docs/ARCHITECTURE.md §5).
export const MAPS = {
${lines.join('\n')}
};

export async function loadMapDefinition(id) {
  const loader = MAPS[id];
  if (!loader) throw new Error(\`Mapa desconocido: \${id}\`);
  const mod = await loader();
  return mod.default;
}
`;
}

function trainersIndex() {
  const dir = path.join(CONTENT, 'trainers');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js').sort();
  const idents = files.map((f) => f.replace(/\.js$/, '').replace(/[^a-zA-Z0-9_]/g, '_'));
  const imports = files.map((f, i) => `import t_${idents[i]} from './${f}';`).join('\n');
  const spreads = idents.map((id) => `  ...t_${id},`).join('\n');
  return `// GENERADO por tools/gen_registries.mjs — no editar a mano (ejecuta: node tools/gen_registries.mjs).
// Registro de entrenadores de Axis. Cada archivo de zona exporta por defecto { id: definición }.
// Formato de definición: ver docs/ARCHITECTURE.md (Entrenadores) y content/trainers/README.md.
${imports}

export const TRAINERS = {
${spreads}
};

/** Devuelve la definición resuelta (party evaluada con el estado actual) o lanza un error claro. */
export function getTrainer(id, state) {
  const def = TRAINERS[id];
  if (!def) throw new Error(\`Entrenador desconocido: \${id}\`);
  const party = typeof def.party === 'function' ? def.party(state) : def.party;
  return { id, ...def, party };
}
`;
}

const outputs = [
  [path.join(CONTENT, 'maps', 'index.js'), await mapsIndex()],
  [path.join(CONTENT, 'trainers', 'index.js'), trainersIndex()],
];
let stale = false;
for (const [file, text] of outputs) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (current === text) continue;
  stale = true;
  if (!check) {
    fs.writeFileSync(file, text);
    console.log(`actualizado ${path.relative(ROOT, file)}`);
  }
}
if (check && stale) {
  console.error('Los registros no están al día: ejecuta node tools/gen_registries.mjs');
  process.exitCode = 1;
} else if (!stale) {
  console.log('Registros al día.');
}
