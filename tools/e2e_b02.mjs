// Recorrido E2E del Bloque 2 — Pilar del Umbral (docs/CAMPANA.md B02) en navegador real (Chrome headless +
// playwright-core) con teclas reales, desde su estado de entrada (flags del Bloque 1, Core con N1 y C001–C005 por
// URL, al final de la Ruta 1):
//   Ruta 1 → Villa Zaguán (C008, primer Centro Pokémon: tutorial y cura, la vecina de las puertas) → Explanada
//   (Gael espera, Casilda bloquea, el dintel brilla, C009) → Ruinas del Dintel: antesala (inscripción, C010),
//   Galería de los Dinteles (C011, las tres piedras), Cámara de Geodude (C012, tirar con A mantenido, la roca,
//   regalo rechazado y luego aceptado), la Guardiana (derrota a propósito → cura en la antesala → victoria),
//   Núcleo (Fragmento 1, Arca, verso I, atajo) → salida al atardecer (10 %, Gael se va, el Consorcio, Libreta y T01)
//   → Zaguán tras el P1 (la vecina duerme, Casilda en casa).
// Uso: node tools/e2e_b02.mjs [--base=http://localhost:8080] [--headed]
// Capturas en tools/cache/screens/e2e_b02_<nn>_<hito>.png y transcripción e2e_b02_dialogos.txt. Sale con 1 si falla.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { installB02Helpers } from './e2e_b02_page.mjs';
import { Driver } from './e2e_b02_driver.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const BASE = (argv.find((a) => a.startsWith('--base=')) || '--base=http://localhost:8080').slice(7);
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));

const B01_FLAGS = ['b01_woke', 'b01_met_mom', 'b01_lab_intro_seen', 'b01_starter_chosen', 'b01_signal_heard', 'b01_police_entered',
  'b01_core_found', 'b01_escorted', 'b01_gael_duel_done', 'b01_dex_received', 'b01_mom_gift', 'b01_left_town'];
const COMMON = '&vars=starter:TURTWIG,gael_starter:LITTEN&core=1&zcores=1&noenc=1&time=10&debug';
/** Puntos de partida: el estado de entrada del bloque (por defecto) o las ruinas con Casilda ya dentro (--from=ruinas). */
const STARTS = {
  zaguan: { map: 'ruta_1', url: `${BASE}/?scene=map&map=ruta_1&x=14&y=56&dir=2&party=TURTWIG:15&flags=${B01_FLAGS.join(',')}${COMMON}&zcells=5` },
  ruinas: {
    map: 'ruinas_dintel',
    url: `${BASE}/?scene=map&map=ruinas_dintel&x=21&y=34&dir=8&party=TURTWIG:15&flags=${[...B01_FLAGS, 'b02_centro_tutorial', 'b02_gael_espera', 'b02_casilda_acompana'].join(',')}${COMMON.replace('&vars=', '&vars=b02_casilda_sala:1,')}&zcells=9`,
  },
  nucleo: {
    map: 'ruinas_dintel',
    url: `${BASE}/?scene=map&map=ruinas_dintel&x=35&y=21&dir=8&party=TURTWIG:16&flags=${[...B01_FLAGS, 'b02_centro_tutorial', 'b02_gael_espera', 'b02_casilda_acompana',
      'b02_antesala', 'b02_galeria', 'b02_dinteles', 'b02_camara_geodude', 'b02_geodude_libre', 'b02_roca_rota', 'b02_casilda_vencida',
      'b02_piedra_alba_viva', 'b02_piedra_agua_viva', 'b02_piedra_entrada_viva'].join(',')}${COMMON.replace('&vars=', '&vars=b02_casilda_sala:5,')}&zcells=12`,
  },
};
const FROM = (argv.find((a) => a.startsWith('--from=')) || '--from=zaguan').slice(7);

const flag = (s, k) => Boolean(s.flags[k]);
const need = (cond, msg) => (cond ? null : msg);

// ───────────────────────────── Villa Zaguán ─────────────────────────────

async function zaguan(d) {
  await d.walkTo(14, 59);
  await d.crossEdge('down', 'villa_zaguan');
  await d.settle();
  await d.milestone('villa_zaguan', (s) => need(s.map === 'villa_zaguan', `mapa ${s.map}`));
  await d.walkTo(18, 11, { stopWhen: (s) => s.cells.includes('cell_zaguan_1') });
  await d.settle();
  await d.milestone('c008', (s) => need(s.cells.includes('cell_zaguan_1') && s.cells.length === 6, `células ${s.cells.length}`));
  await d.enterDoor(26, 14, 'zaguan_centro');
  await d.settle({ watch: [{ re: /primera vez en un Centro/, name: 'centro_tutorial', delay: 300 }] });
  await d.expectSaid(/primera vez en un Centro Pokémon/, 'el tutorial del Centro');
  await d.walkTo(9, 7, { face: 'up' });
  await d.press('KeyZ', 400);
  await d.settle({ watch: [{ re: /recuperado por completo/, name: 'centro_cura' }] });
  await d.expectSaid(/Tus Pokémon se han recuperado por completo/, 'la cura de la enfermera');
  await d.milestone('centro', (s) => need(flag(s, 'b02_centro_tutorial') && s.b02.healPoint?.mapId === 'zaguan_centro', 'tutorial/punto de cura'));
  await d.exitTo('villa_zaguan');
  await d.settle();
  await d.interact(17, 24, 'right');
  await d.settle();
  await d.expectSaid(/Anoche se me abrió la puerta tres veces\. Sin viento\./, 'la vecina de las puertas');
}

// ───────────────────────────── Explanada ─────────────────────────────

async function explanada(d) {
  await d.walkTo(0, 17);
  await d.crossEdge('left', 'explanada_umbral');
  await d.settle();
  await d.walkTo(24, 14, { stopWhen: (s) => flag(s, 'b02_gael_espera') });
  await d.settle({ watch: [{ re: /Llegué antes/, name: 'gael_espera', delay: 200 }] });
  await d.expectSaid(/Llegué antes\. No me ha dejado pasar\./, 'Gael');
  await d.walkTo(15, 15, { stopWhen: (s) => flag(s, 'b02_casilda_acompana') || s.busy });
  await d.settle({ watch: [
    { re: /Aquí no entra nadie/, name: 'casilda_bloquea', delay: 200 },
    { re: /Voy contigo/, name: 'dintel_brilla', delay: 200 },
  ] });
  await d.expectSaid(/Esto brillaba en el patio/, 'C009 de Casilda');
  await d.milestone('casilda_acompana', (s) => need(flag(s, 'b02_casilda_acompana') && s.cells.includes('cell_zaguan_2') && s.cells.length === 7, `células ${s.cells.length}`));
  await d.walkTo(15, 8, { stopWhen: (s) => s.map === 'ruinas_dintel' });
  await d.until((s) => s.map === 'ruinas_dintel' && s.ready, { what: 'entrar en las ruinas' });
}

// ───────────────────────────── Ruinas: antesala y galería ─────────────────────────────

async function antesalaYGaleria(d) {
  await d.settle({ watch: [{ re: /Son piedras/, name: 'antesala', delay: 300 }] });
  await d.expectSaid(/Son piedras\. Muy viejas, nada más\./, 'Casilda en la antesala');
  await d.interact(21, 30, 'down');
  await d.settle();
  await d.expectSaid(/El primero mira al alba\. El segundo, al agua que no se va\. El tercero, a quien entra\./, 'la inscripción');
  await d.walkTo(15, 30, { stopWhen: (s) => s.cells.includes('cell_umbral_1') });
  await d.settle();
  await d.walkTo(13, 23, { stopWhen: (s) => flag(s, 'b02_galeria') });
  await d.settle({ watch: [{ re: /Una piedra en cada alcoba/, name: 'galeria', delay: 300 }] });
  await d.walkTo(5, 21, { stopWhen: (s) => s.cells.includes('cell_umbral_2') });
  await d.settle();
  await d.milestone('c010_c011', (s) => need(s.cells.includes('cell_umbral_1') && s.cells.includes('cell_umbral_2'), 'C010/C011'));
  const stones = await d.eval(async () => (await import('/src/content/maps/b02/ruinas_dintel_layout.js')).STONES);
  for (const [name, presses] of [['piedra_agua', 3], ['piedra_entrada', 2], ['piedra_alba', 1]]) {
    const st = stones.find((s) => s.id === name);
    const face = { 4: 'left', 6: 'right' }[st.from.dir];
    await d.walkTo(st.from.x, st.from.y, { face });
    for (let i = 0; i < presses; i++) {
      await d.press('KeyZ', 300);
      await d.settle({ watch: [{ re: /Eso no lo había hecho nunca/, name: 'primera_ranura', delay: 100 }] });
      await d.turn(face);
    }
    const s = await d.snap();
    if (!flag(s, `b02_${name}_viva`)) throw new Error(`${name} no se encendió (orientaciones ${s.b02.stones})`);
  }
  await d.expectSaid(/Y eso era una puerta\./, 'la losa deslizándose');
  await d.milestone('losa_abierta', (s) => need(flag(s, 'b02_dinteles'), 'sin b02_dinteles'));
}

// ───────────────────────────── Ruinas: Geodude y Guardiana ─────────────────────────────

async function geodude(d) {
  await d.walkTo(18, 11, { stopWhen: (s) => flag(s, 'b02_camara_geodude') });
  await d.settle();
  await d.expectSaid(/rascar por las noches/, 'Casilda ante el Geodude');
  await d.walkTo(12, 9, { stopWhen: (s) => s.cells.includes('cell_umbral_3') });
  await d.settle();
  await d.walkTo(4, 7, { face: 'left' });
  d.choiceRules.unshift({ re: /acompañe/, index: 1 }); // primero lo rechaza: debe esperar en la cámara
  await d.press('KeyZ', 400);
  await d.settle({
    watch: [{ re: /encajado en una grieta/, name: 'geodude_encajado' }, { re: /ha salido de la grieta/, name: 'geodude_libre' }],
    onText: async (s) => {
      if (!/mantén pulsado A/.test(s.lastText || '')) return false;
      await d.wait(1200); // que termine de escribirse: la pulsación que cierra el mensaje sigue apretada al tirar
      await d.hold('KeyZ', 2600);
      return true;
    },
  });
  await d.expectSaid(/dispuesto a esperar/, 'el Geodude espera');
  await d.milestone('roca_rota', (s) => need(flag(s, 'b02_geodude_libre') && flag(s, 'b02_roca_rota') && !flag(s, 'b02_geodude_regalo'), 'Geodude/roca'));
  d.choiceRules.shift();
  const g = await d.eval(() => window.__e2e.eventInfo('geodude'));
  await d.interact(g.x, g.y, 'right');
  await d.settle();
  await d.milestone('geodude_regalo', (s) => need(flag(s, 'b02_geodude_regalo') && s.party.includes('GEODUDE'), `equipo ${s.party}`));
}

async function guardiana(d) {
  // Derrota a propósito: reaparece en la antesala y Casilda cura («Otra vez. Con cabeza.»), sin perder nada.
  await d.walkTo(27, 5);
  await d.eval(() => window.__e2e.setParty('MAGIKARP:2'));
  await d.step(6); // la salida del túnel: Casilda te detiene
  await d.settle({ watch: [{ scene: 'BattleScene', name: 'combate_casilda', delay: 4000 }, { re: /Otra vez\. Con cabeza\./, name: 'casilda_cura', delay: 200 }] });
  await d.expectSaid(/que sea por alguien capaz de defenderlo/, 'el reto de la Guardiana');
  await d.expectSaid(/Otra vez\. Con cabeza\./, 'la cura tras perder');
  await d.milestone('reintento', (s) => need(!flag(s, 'b02_casilda_derrota') && !flag(s, 'b02_casilda_vencida') && s.y >= 29, 'reintento en la antesala'));
  // El piloto automático no cambia de Pokémon ni usa objetos: con Bostezo + tormenta de arena puede volver a perder.
  // El reintento no tiene límite ni pérdida, así que se repite (hasta 3 veces) como haría el jugador.
  let potions = 0;
  for (let attempt = 1; attempt <= 3; attempt++) {
    await d.eval(() => window.__e2e.setParty('TURTWIG:16,GEODUDE:10'));
    await d.walkTo(27, 5); // por el camino pueden saltar los entrenadores que quedaban
    await d.eval(() => window.__e2e.setParty('TURTWIG:16,GEODUDE:10')); // a PS completos ante la Guardiana
    potions = (await d.snap()).b02.potions;
    await d.step(6);
    await d.settle({ watch: [{ scene: 'BattleScene', name: `combate_casilda_${attempt + 1}`, delay: 5000 }] });
    if (flag(await d.snap(), 'b02_casilda_vencida')) break;
    console.log(`  (derrota ${attempt} del piloto automático: Casilda cura y se reintenta)`);
  }
  await d.expectSaid(/Bien\. Con cabeza\./, 'la victoria contra Casilda');
  await d.milestone('guardiana_vencida', (s) => need(flag(s, 'b02_casilda_vencida') && s.b02.potions === potions + 3 && s.b02.keyItems.includes('ESCAPEROPE'), `pociones ${s.b02.potions}`));
}

// ───────────────────────────── Núcleo y salida ─────────────────────────────

async function nucleo(d) {
  await d.settle();
  await d.walkTo(35, 21, { face: 'up' });
  await d.wait(800);
  await d.press('KeyZ', 400);
  await d.until((s) => s.busy || s.top !== 'MapScene', { what: 'la columna hueca responde' });
  await d.settle({ timeout: 300000, watch: [
    { re: /Fragmento Azur 1/, name: 'fragmento_1', delay: 300 },
    { re: /Siempre la vi cerrada/, name: 'arca', delay: 200 },
    { re: /Cien\. Y cinco/, name: 'verso_1', delay: 200 },
  ] });
  await d.expectSaid(/Cien\. Y cinco\. …Soy yo\./, 'el Core ante el verso I');
  await d.expectSaid(/Serán números\./, 'Casilda');
  await d.milestone('pilar_restaurado', (s) => need(flag(s, 'p1_restored') && flag(s, 'b02_atajo') && s.b02.fragments.includes('F01') && s.b02.keyItems.includes('ZYGARDECUBE'), 'P1/Arca/atajo'));
}

async function salida(d) {
  await d.walkTo(34, 29);
  await d.walkTo(21, 34);
  await d.hold('ArrowDown', 400); // la claridad de la salida: empujar contra ella
  await d.until((s) => s.map === 'explanada_umbral' && s.ready, { what: 'salir a la explanada' });
  await d.settle({ timeout: 300000, watch: [
    { re: /Forma 10/, name: 'forma_10', delay: 300 },
    { re: /responde a un niño/, name: 'consorcio', delay: 200 },
    { re: /Mi madre apuntaba/, name: 'libreta', delay: 200 },
  ] });
  await d.expectSaid(/Aquí se mide con los ojos\. Fuera\./, 'Casilda echa al Consorcio');
  await d.milestone('salida', (s) => need(flag(s, 'zyg_10') && s.b02.run && s.b02.form === '10' && flag(s, 'b02_libreta') && flag(s, 'b02_salida')
    && s.b02.keyItems.includes('CLUENOTEBOOK') && s.b02.clues.includes('T01:active') && s.b02.hour >= 18 && s.b02.hour < 21, JSON.stringify(s.b02)));
}

async function despues(d) {
  const s = await d.walkTo(29, 14, { stopWhen: (st) => st.map === 'villa_zaguan' });
  if (s.map !== 'villa_zaguan') await d.crossEdge('right', 'villa_zaguan');
  await d.settle();
  await d.interact(17, 24, 'right');
  await d.settle();
  await d.expectSaid(/La puerta ya no se abre sola/, 'la vecina tras el P1');
  await d.enterDoor(6, 23, 'casa_dintel');
  await d.settle();
  await d.interact(9, 7, 'left');
  await d.settle();
  await d.expectSaid(/no sé qué hacer con la tarde/, 'Casilda en casa');
  await d.milestone('casa_dintel');
}

// ───────────────────────────── Principal ─────────────────────────────

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME, headless: !argv.includes('--headed'),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.stack || err.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[error] ${msg.text()}`); });
  page.on('response', (res) => { if (res.status() >= 400) errors.push(`[http ${res.status()}] ${res.url()}`); });
  const d = new Driver(page, errors, { outDir: OUT, root: ROOT });
  const t0 = Date.now();
  let failed = null;
  try {
    const start = STARTS[FROM];
    if (!start) throw new Error(`--from desconocido: ${FROM} (zaguan | ruinas | nucleo)`);
    await page.goto(start.url, { waitUntil: 'load' });
    await installB02Helpers(page);
    await d.until((s) => s.top === 'MapScene' && s.ready && s.map === start.map, { timeout: 30000, what: start.map });
    if (FROM === 'zaguan') {
      await d.settle();
      await zaguan(d);
      await explanada(d);
    }
    if (FROM !== 'nucleo') {
      await antesalaYGaleria(d);
      await geodude(d);
      await guardiana(d);
    }
    await nucleo(d);
    await salida(d);
    await despues(d);
    const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
    if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
  } catch (err) {
    failed = err;
    await d.shot('fallo').catch(() => {});
  }
  const log = await d.log().catch(() => []);
  fs.writeFileSync(path.join(OUT, 'e2e_b02_dialogos.txt'), log.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  await browser.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d.milestones.join(' → ')} (${secs} s; ${log.length} diálogos en tools/cache/screens/e2e_b02_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 2 completo de principio a fin.');
  }
}

await main();
