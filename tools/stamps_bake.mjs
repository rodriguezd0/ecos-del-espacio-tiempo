// Hornea las bibliotecas de stamps: resuelve src/from/tiles a rejillas de IDs y valida.
// Uso: node tools/stamps_bake.mjs [Imagen ...]   (sin argumentos: todas las bibliotecas registradas)
// Salida: game/src/content/stamps/baked/<Imagen>.js
import { loadStampDef, bakeStamp, writeBakedModule, originalTileset, tilesetInfo, libraryImages } from './stamps_lib.mjs';
import { brushKind } from '../game/src/content/stamps/brushes.js';

async function bakeLibrary(image) {
  const def = await loadStampDef(image);
  if (def.image !== image) throw new Error(`${image}.js declara image "${def.image}"`);
  const ts = tilesetInfo(def.tileset);
  if (ts.image !== image) throw new Error(`${image}.js: el tileset ${def.tileset} usa la imagen ${ts.image}`);
  const png = originalTileset(image);
  const out = {};
  const errors = [];
  let warnings = 0;
  for (const [name, sdef] of Object.entries(def.stamps)) {
    try {
      const baked = bakeStamp(def, name, sdef, png);
      for (const w of baked.warnings) { console.warn(`  aviso ${name}: ${w}`); warnings++; }
      out[name] = baked;
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
  }
  for (const [name, b] of Object.entries(def.brushes || {})) {
    try { brushKind(b); } catch (err) { errors.push(`brush ${name}: ${err.message}`); }
  }
  if (errors.length) throw new Error(`${image}: ${errors.length} errores\n  ${errors.join('\n  ')}`);
  const file = writeBakedModule(image, def.tileset, out);
  console.log(`${image}: ${Object.keys(out).length} stamps, ${Object.keys(def.brushes || {}).length} brushes, ${warnings} avisos → ${file}`);
}

async function main() {
  const images = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const list = images.length ? images : libraryImages();
  let failed = false;
  for (const image of list) {
    try {
      await bakeLibrary(image);
    } catch (err) {
      failed = true;
      console.error(`stamps_bake: ${err.message}`);
    }
  }
  if (failed) process.exit(1);
}

main();
