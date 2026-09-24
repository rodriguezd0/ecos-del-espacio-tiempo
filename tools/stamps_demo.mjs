// Composiciones de PRUEBA TÉCNICA con la biblioteca de stamps (no son mapas de Axis ni canon):
// comprueban que brushes y stamps encajan entre sí (sombras, capas, bordes, puertas).
// Uso: node tools/stamps_demo.mjs  → tools/cache/stamps/demo/<nombre>.png
import path from 'node:path';
import { renderMap, savePNG } from './lib/tile_render.mjs';
import { ROOT } from './stamps_lib.mjs';
import { loadStampLibrary, stampWrites } from '../game/src/content/stamps/index.js';
import { paintBrush, rectCells } from '../game/src/content/stamps/brushes.js';

const OUT = path.join(ROOT, 'tools', 'cache', 'stamps', 'demo');

/** Lienzo mínimo de 3 capas con operaciones de brush y stamp (imita lo que hará el MapBuilder). */
function canvas(lib, width, height) {
  const layers = [0, 1, 2].map(() => new Array(width * height).fill(0));
  const put = ({ x, y, layer, id }) => { if (x >= 0 && y >= 0 && x < width && y < height) layers[layer][x + y * width] = id; };
  const api = {
    width, height, layers,
    brush(name, cells, opts = {}) { paintBrush(lib.brush(name), cells, { width, height, ...opts }).forEach(put); return api; },
    rect(name, x, y, w, h, opts) { return api.brush(name, rectCells(x, y, w, h), opts); },
    stamp(name, x, y) { stampWrites(lib.stamp(name), x, y).forEach(put); return api; },
    save(file) {
      const png = renderMap({ tilesetId: lib.tileset, width, height, layers, background: [0, 0, 0, 255] });
      savePNG(png, path.join(OUT, file));
      console.log(`→ ${path.join(OUT, file)}`);
    },
  };
  return api;
}

async function demoPueblo() {
  const lib = await loadStampLibrary(7);
  const c = canvas(lib, 46, 36);
  c.rect('cesped', 0, 0, 46, 36);
  // borde de bosque con accesos norte y sur
  c.rect('bosque', 0, 0, 20, 6).rect('bosque', 26, 0, 20, 6);
  c.rect('bosque_pinos', 0, 6, 4, 30).rect('bosque_pinos', 42, 6, 4, 30);
  c.rect('bosque', 4, 32, 16, 4).rect('bosque', 26, 32, 16, 4);
  // caminos
  c.brush('camino_arena', [...rectCells(20, 0, 6, 36), ...rectCells(6, 17, 34, 4)]);
  // edificios de prueba
  c.stamp('casa_verde', 6, 6).stamp('casa_roja', 28, 5).stamp('fachada_turquesa', 34, 22)
    .stamp('casa_roja', 7, 22).stamp('casa_verde_pequena', 27, 24);
  // plaza central
  c.stamp('parterre_octogonal', 13, 13).stamp('farola', 18, 12).stamp('banco', 12, 11)
    .stamp('cartel_ruta', 26, 31).stamp('buzon_rojo', 12, 30).stamp('arbol', 16, 26);
  c.brush('flores_azules', rectCells(15, 24, 3, 1)).stamp('lupinos', 38, 12);
  c.save('pueblo_prueba.png');
}

async function demoRuta() {
  const lib = await loadStampLibrary(7);
  const c = canvas(lib, 40, 30);
  c.rect('cesped', 0, 0, 40, 30);
  c.rect('bosque_mixto', 0, 0, 8, 30).rect('bosque', 32, 0, 8, 30);
  c.rect('terraza', 8, 2, 14, 9).stamp('escalera_terraza', 13, 8);
  c.rect('acantilado', 24, 2, 8, 8);
  c.rect('hierba_alta', 10, 13, 8, 5).rect('hierba_alta_morada', 22, 20, 8, 4);
  c.brush('saliente', rectCells(9, 19, 11, 1));
  c.brush('camino_tierra', [...rectCells(18, 11, 4, 19), ...rectCells(18, 25, 12, 3)]);
  const lago = [...rectCells(9, 22, 7, 5), ...rectCells(11, 21, 3, 1)];
  c.brush('agua', lago).brush('orilla', lago).stamp('roca_agua', 12, 24);
  c.stamp('cartel_madera', 22, 12).stamp('roca_turquesa', 26, 12).stamp('boquete', 26, 15);
  c.save('ruta_prueba.png');
}

async function demoInterior() {
  const lib = await loadStampLibrary(4);
  const c = canvas(lib, 18, 15);
  c.rect('vacio', 0, 0, 18, 15);
  c.rect('habitacion_casa', 2, 1, 14, 11);
  c.stamp('salida_casa', 7, 11);
  c.stamp('ventana_cortinas', 5, 2).stamp('ventana_cortinas', 11, 2).stamp('cuadro', 8, 2);
  c.stamp('nevera', 2, 2).stamp('fregadero', 3, 2).stamp('tele', 8, 3).stamp('planta', 10, 3)
    .stamp('estanteria_roja', 13, 3).stamp('escalera_subir_der', 13, 7);
  c.rect('alfombra_roja', 5, 6, 6, 4).stamp('mesa_comedor', 5, 6).stamp('sofa', 14, 7);
  c.save('interior_prueba.png');

  const lab = canvas(lib, 22, 18);
  lab.rect('vacio', 0, 0, 22, 18);
  lab.rect('habitacion_lab', 2, 1, 18, 14);
  lab.stamp('salida_lab', 9, 14);
  lab.stamp('pizarras', 8, 2).stamp('ventanal_lab', 14, 2).stamp('ventanal_lab', 15, 2)
    .stamp('lab_zona_maquina', 2, 1).stamp('lab_ordenadores', 8, 4)
    .stamp('estanteria_lab', 15, 4).stamp('estanteria_lab', 17, 4).stamp('mesa_lab_verde', 14, 9)
    .stamp('estanteria_lab', 3, 10).stamp('fotocopiadora', 17, 11).stamp('planta', 2, 12);
  lab.save('laboratorio_prueba.png');
}

async function demoCueva() {
  const lib = await loadStampLibrary(2);
  const c = canvas(lib, 34, 24);
  c.rect('vacio', 0, 0, 34, 24);
  c.rect('sala', 4, 5, 12, 12);
  c.rect('sala_volcan', 21, 7, 8, 8);
  c.stamp('boca_norte', 8, 1).stamp('salida_luz_sur', 8, 16).stamp('boca_este', 15, 8).stamp('boca_oeste', 1, 10);
  c.brush('agua', rectCells(10, 11, 4, 3)).stamp('roca_grande', 5, 6).stamp('cristales', 5, 14)
    .stamp('antorcha', 6, 3).stamp('escalera_mano', 14, 6);
  c.stamp('roca_grande_volcan', 22, 8).stamp('boca_norte_volcan', 24, 3);
  c.save('cueva_prueba.png');
}

async function main() {
  await demoPueblo();
  await demoRuta();
  await demoInterior();
  await demoCueva();
}

main().catch((err) => {
  console.error(`stamps_demo: ${err.message}`);
  process.exit(1);
});
