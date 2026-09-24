// Composiciones de PRUEBA TÉCNICA de las piezas de campaña (no son mapas de Axis ni canon): recinto de Pilar
// con el kit y los diez tintes, costa con playa y faro, nieve, aldea oriental, sala solemne, ciudad minera
// y terrenos de barrera. Las llama tools/stamps_demo.mjs → tools/cache/stamps/demo/<nombre>.png
import path from 'node:path';
import { PNG } from 'pngjs';
import { renderMap, savePNG } from './lib/tile_render.mjs';
import { ROOT } from './stamps_lib.mjs';
import { loadStampLibrary } from '../game/src/content/stamps/index.js';
import { rectCells } from '../game/src/content/stamps/brushes.js';
import { PILAR_TINTS, pilarTone } from '../game/src/content/stamps/pilar.js';
import { drawText } from './stamps_font.mjs';

const OUT = path.join(ROOT, 'tools', 'cache', 'stamps', 'demo');

/** Aplica un tono RMXP [r, g, b, gris] como el compositor (render/compositor.js). */
function applyTone(png, [r, g, b, gray]) {
  const out = new PNG({ width: png.width, height: png.height });
  png.data.copy(out.data);
  for (let i = 0; i < out.data.length; i += 4) {
    const c = [out.data[i], out.data[i + 1], out.data[i + 2]];
    const l = c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114;
    for (let k = 0; k < 3; k++) {
      const m = c[k] + (l - c[k]) * (gray / 255);
      out.data[i + k] = Math.max(0, Math.min(255, Math.round(m + [r, g, b][k])));
    }
  }
  return out;
}

async function demoPilar(canvas) {
  const lib = await loadStampLibrary(2);
  const c = canvas(lib, 26, 22);
  c.rect('vacio', 0, 0, 26, 22);
  c.rect('sala_gris', 4, 5, 18, 14);
  c.rect('pilar_enlosado', 5, 6, 16, 12);
  c.stamp('boca_norte_gris', 11, 1).stamp('salida_luz_sur_gris', 12, 18);
  c.stamp('pilar_camara_nucleo', 10, 9).stamp('pilar_pedestal', 12, 10);
  c.stamp('pilar_monolito', 6, 6).stamp('pilar_monolito', 18, 6);
  c.stamp('pilar_columna', 5, 12).stamp('pilar_columna_quebrada', 20, 13).stamp('pilar_columna', 20, 9);
  c.stamp('pilar_placa_unown', 6, 15).stamp('pilar_arista_grande', 17, 15).stamp('pilar_arista', 16, 7);
  c.stamp('pilar_manantial', 14, 14).stamp('pilar_losa_eco', 8, 12);
  c.brush('pilar_canal', rectCells(6, 10, 3, 1)).brush('pilar_canal_v', rectCells(16, 10, 1, 3));
  c.stamp('pilar_dintel', 10, 16).stamp('pilar_glifo', 9, 7).stamp('pilar_glifo_2', 16, 12);
  for (const x of [5, 6, 7]) c.stamp(['pilar_zocalo', 'pilar_zocalo_gastado', 'pilar_zocalo_vivo'][x - 5], x, 17);
  const png = renderMap({ tilesetId: 2, width: c.width, height: c.height, layers: c.layers, background: [0, 0, 0, 255] });
  savePNG(png, path.join(OUT, 'pilar_kit.png'));
  // hoja con los diez tintes (recorte central 12×10 de la misma sala)
  const cw = 12 * 32; const ch = 10 * 32;
  const sheet = new PNG({ width: cw * 5, height: ch * 2 });
  Object.keys(PILAR_TINTS).forEach((k, i) => {
    const toned = applyTone(png, pilarTone(k));
    const ox = (i % 5) * cw; const oy = Math.floor(i / 5) * ch;
    for (let y = 0; y < ch; y++) toned.data.copy(sheet.data, ((oy + y) * sheet.width + ox) * 4, ((6 * 32 + y) * png.width + 7 * 32) * 4, ((6 * 32 + y) * png.width + 7 * 32 + cw) * 4);
    drawText(sheet, ox + 4, oy + 4, `${k} ${PILAR_TINTS[k].tinte}`, [255, 255, 255, 255], [0, 0, 0, 255]);
  });
  savePNG(sheet, path.join(OUT, 'pilar_tintes.png'));
  console.log(`→ ${path.join(OUT, 'pilar_kit.png')} y pilar_tintes.png`);
}

async function demoCosta(canvas) {
  const lib = await loadStampLibrary(1);
  const c = canvas(lib, 40, 30);
  c.rect('agua', 0, 0, 40, 30);
  c.rect('cesped', 0, 0, 22, 30).rect('playa', 16, 4, 12, 20);
  c.rect('camino_arena', 2, 12, 16, 3).stamp('faro', 22, 4).stamp('muelle_piedra', 18, 6);
  c.stamp('velero', 32, 20).stamp('yate', 26, 24).stamp('sombrilla', 19, 20).stamp('palmera_maceta', 17, 16);
  c.rect('palmeral', 2, 2, 6, 6).stamp('contenedores', 10, 3).stamp('cajas_madera', 10, 8).stamp('central', 2, 18);
  c.save('costa.png');
}

async function demoNieve(canvas) {
  const lib = await loadStampLibrary(1);
  const c = canvas(lib, 30, 22);
  c.rect('nieve', 0, 0, 30, 22);
  c.rect('nieve_honda', 3, 12, 10, 6).rect('grava', 18, 3, 6, 8);
  c.stamp('pino_nevado', 1, 1).stamp('pino_nevado', 4, 1).stamp('pino_nevado_peque', 7, 2).stamp('meseta_nevada', 10, 2);
  c.stamp('empalizada', 24, 12).stamp('tocon_nevado', 16, 14).stamp('arbusto_nevado', 20, 16).stamp('montones_nieve', 22, 18);
  c.stamp('pilar_zocalo_gastado', 14, 18).stamp('pilar_zocalo', 15, 18).stamp('pilar_zocalo_vivo', 16, 18);
  c.save('nieve.png');
}

async function demoOriental(canvas) {
  const lib = await loadStampLibrary(9);
  const c = canvas(lib, 40, 30);
  c.rect('cesped', 0, 0, 40, 30);
  c.rect('cerezal', 0, 0, 40, 7).rect('cerezal', 0, 22, 12, 8);
  c.rect('camino_tierra', 16, 7, 5, 23).rect('petalos', 22, 18, 6, 4);
  c.stamp('torii', 15, 7).stamp('pabellon_verde', 5, 9).stamp('templo_oscuro', 26, 8).stamp('santuario_negro', 33, 17);
  c.stamp('linterna_piedra', 14, 14).stamp('linterna_piedra', 21, 14).stamp('farolillos', 24, 22).stamp('cerezo', 30, 24);
  c.rect('agua', 3, 20, 10, 6).rect('orilla', 3, 20, 10, 6).stamp('puente_rojo', 5, 21);
  c.save('oriental.png');
}

async function demoSolemne(canvas) {
  const lib = await loadStampLibrary(11);
  const c = canvas(lib, 24, 20);
  c.rect('vacio', 0, 0, 24, 20);
  c.rect('sala_dorado', 2, 1, 20, 17);
  c.rect('alfombra_rombos', 9, 6, 6, 11).stamp('emblema_suelo', 9, 8);
  c.stamp('pilar_columna', 4, 5).stamp('pilar_columna', 19, 5).stamp('pilar_monolito', 4, 11).stamp('pilar_monolito', 18, 11);
  c.stamp('pilar_pedestal', 11, 4).stamp('trofeo', 3, 3).stamp('vitrina_museo', 15, 4).stamp('pantalla_pared', 6, 2);
  c.save('solemne.png');
}

async function demoCiudad(canvas) {
  const lib = await loadStampLibrary(5);
  const c = canvas(lib, 40, 30);
  c.rect('cesped', 0, 0, 40, 30);
  c.rect('calzada', 0, 12, 40, 5).rect('camino_tierra', 26, 18, 14, 12);
  c.stamp('rascacielos', 1, -12).stamp('estacion_tren', 10, 1).stamp('bloque_amarillo', 19, 2).stamp('templo_dorado', 30, 3);
  c.stamp('pozo_mina', 30, 20).stamp('meseta_tierra', 34, 24).stamp('puente_metal', 16, 22).stamp('deposito', 27, 25);
  c.stamp('farola_blanca', 9, 9).stamp('boca_incendios', 18, 10).stamp('contenedores', 2, 20).stamp('caravana', 8, 20);
  c.save('ciudad.png');
}

async function demoBarreras(canvas) {
  const lib = await loadStampLibrary(6);
  const c = canvas(lib, 34, 12);
  c.rect('cesped', 0, 0, 34, 12);
  c.rect('barro', 1, 1, 7, 6).rect('arena_honda', 9, 1, 7, 6).rect('grava', 17, 1, 7, 6);
  c.rect('ceniza', 25, 0, 9, 12).rect('ceniza_honda', 26, 2, 7, 6);
  c.rect('agua', 1, 8, 14, 4).rect('playa', 3, 8, 8, 4).stamp('palafito', 16, 4);
  c.save('barreras.png');
}

/** Ejecuta todas las demos de campaña con el lienzo de tools/stamps_demo.mjs. */
export async function campaignDemos(canvas) {
  await demoPilar(canvas);
  await demoCosta(canvas);
  await demoNieve(canvas);
  await demoOriental(canvas);
  await demoSolemne(canvas);
  await demoCiudad(canvas);
  await demoBarreras(canvas);
}
