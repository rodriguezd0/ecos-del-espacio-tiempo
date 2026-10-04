// Revisión corta de guardados antiguos, columnas completas y retornos tras restaurar P7/P8.
// Un solo navegador, teclas reales; no modifica flags ni posición después de cargar cada guardado de prueba.
// Uso: node tools/e2e_p7_p8_vertical.mjs [--base=http://localhost:8080]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Driver as P7Driver } from './e2e_b14_driver.mjs';
import { Driver as P8Driver } from './e2e_b16_driver.mjs';
import { ANTEA_BASE, ROOMS } from '../game/src/content/maps/b14/layout.js';
import { PATIO, P8_MAPS, P8_UP, SENTIR, TELAR } from '../game/src/content/maps/b16/santuario_layout.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
const BASE = process.argv.find((a) => a.startsWith('--base='))?.slice(7) || 'http://localhost:8080';
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const flags = ['p1_restored', 'p2_restored', 'p3_restored', 'p4_restored', 'p5_restored', 'p6_restored', 'zyg_10', 'zyg_50', 'zyg_core_2', 'zyg_core_3', 'zyg_core_4', 'zyg_core_5', 'zyg_dive'];
const url = (map, x, y, more = []) => BASE + '/?' + new URLSearchParams({
  scene: 'map', map, x, y, dir: 8, party: 'GARCHOMP:80,LUCARIO:80', noenc: 1, time: 20,
  fragments: 8, core: 1, zcells: 100, zcores: 5,
  zygarde: 'run,ram,terrain,climb,swim,detect,dive,fly,rebuild',
  flags: [...flags, ...more].join(','), debug: 1,
});
const errors = [];
let driver;
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
try {
  fs.mkdirSync(OUT, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on('pageerror', (e) => errors.push(String(e.stack || e)));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });

  driver = new P7Driver(page, errors, { root: ROOT, outDir: OUT, prefix: 'e2e_p7_vertical' });
  await driver.goto(url('arrecife_eco', 22, 5, ['b14_arrecife_llegada', 'b14_draga_apartada', 'p7_restored']));
  let s = await driver.snapState();
  assert.deepEqual([s.map, s.x, s.y], ['arrecife_eco', 22, 14], 'guardado junto a la puerta antigua');
  await driver.walkTo(26, 8);
  await driver.shot('columna_completa');
  await driver.walkTo(22, 14);
  await driver.exitTo('up', 'antea_base');
  await driver.walkTo(ANTEA_BASE.up.x, ANTEA_BASE.up.y + 1);
  await driver.exitTo('up', 'antea_1_presente');
  await driver.walkTo(ROOMS[1].south.arrival.x, ROOMS[1].south.arrival.y);
  await driver.exitTo('down', 'antea_base');
  await driver.walkTo(ANTEA_BASE.arrival.x, ANTEA_BASE.arrival.y);
  await driver.exitTo('down', 'arrecife_eco');
  s = await driver.snapState();
  assert.deepEqual([s.map, s.x, s.y], ['arrecife_eco', 22, 14]);
  await driver.milestone('retorno_restaurado');

  driver = new P8Driver(page, errors, { root: ROOT, outDir: OUT, prefix: 'e2e_p8_vertical' });
  const restored = ['p7_restored', 'p8_restored', 'b16_llegada', 'b16_santuario_visto', 'b16_hito', 'b16_hito_escena', 'b16_puente_a', 'b16_puente_b', 'b16_genesis_registro', 'b16_radio', 'b16_vinculo', 'b16_vuelo_aviso', 'zyg_complete'];
  await driver.goto(url(P8_MAPS[1], SENTIR.mirrors[0].entry.x, SENTIR.mirrors[0].entry.y, restored));
  s = await driver.snapState();
  assert.deepEqual([s.map, s.x, s.y], [P8_MAPS[2], SENTIR.mirrors[0].entry.x, SENTIR.mirrors[0].entry.y], 'guardado del ala del Sentir');
  const ex = SENTIR.mirrors[0].exitBelow;
  await driver.leave(ex.x, ex.y, 'down', (st) => st.map === P8_MAPS[2] && st.y === PATIO.gates.sentir.front.y, 'volver al rellano del segundo piso');
  await driver.walkTo(P8_UP[2].x, P8_UP[2].y + 1);
  await driver.exitTo('up', P8_MAPS[3]);
  await driver.shot('piso3_restaurado');
  for (const floor of [3, 2, 1]) {
    await driver.walkTo(PATIO.exit.arrive.x, PATIO.exit.arrive.y);
    await driver.exitTo('down', floor > 1 ? P8_MAPS[floor - 1] : 'lagos_alma');
  }
  await driver.milestone('retorno_restaurado');
  await driver.walkTo(34, 14);
  await driver.shot('columna_completa');

  // Un guardado antiguo dentro del Telar se conserva incluso si le falta el flag del sello abierto.
  await driver.goto(url(P8_MAPS[1], TELAR.spot.x, TELAR.spot.y, restored));
  s = await driver.snapState();
  assert.deepEqual([s.map, s.x, s.y], [P8_MAPS[3], TELAR.spot.x, TELAR.spot.y]);
  await driver.leave(TELAR.entry.exits[1].x, TELAR.entry.exits[1].y, 'down', (st) => st.map === P8_MAPS[3] && st.y > 48, 'volver del Telar restaurado');
  await driver.faceEvent('sello_telar');
  await driver.interact();
  s = await driver.snapState();
  assert.ok(s.map === P8_MAPS[3] && s.x >= TELAR.room.x && s.x < TELAR.room.x + TELAR.room.w && s.y >= TELAR.room.y && s.y < TELAR.room.y + TELAR.room.h, 'el sello deja volver a la sala restaurada');
  await driver.milestone('telar_guardado_antiguo');
  assert.deepEqual(errors, [], 'sin errores de página ni recursos ausentes');
  console.log('✔ P7/P8: guardados antiguos, columnas y retornos restaurados en navegador real');
} catch (e) {
  await driver?.shot('fallo').catch(() => {});
  throw e;
} finally {
  await browser.close();
}
