// Recorrido E2E del Bloque 11 — Interludio 5 (docs/CAMPANA.md B11) en navegador real (Chrome headless +
// playwright-core), con teclas reales. Estado de entrada por URL (ARCHITECTURE §9): P1–P5 restaurados (Fragmentos
// F01–F05), Correr, Embestida, Terreno y Trepar, 46 células, N1+N2, equipo alto y sin encuentros aleatorios.
//   neblino    llegada sin niebla · Nilo de noche (T10: pista y segunda pista) · C047 trepando a la loma
//   ruta10     pista de Zygarde hacia casa · pared de raíces · C049 · alarma de un centinela (vuelta al punto seguro)
//              · sigilo resuelto con el reloj de los centinelas · cuadrilla · Honchkrow Alfa · Tabla Oscura · deserción
//              de Nilo (planos de Talasa)
//   villa      primer regreso a Villa Alba · Mamá y el huevo de Togepi · eclosión por pasos · Gael frente a Alerce
//   campamento de Villa Alba a pie hasta el campamento del Monte · Genesis se lleva EXP-03 · Gael B4 (derrota simulada:
//              la historia sigue) · senda del Monte (montana_portal) y vuelta
//   t09        casa de Íker (dibujos y pozo) · casa de té y Musharna · pozo de los Custodios (Tabla Mental) · Chimechita
//   cerro      raíces del mirador de la Ruta 1 · Cerro del Alba · C054 · brasero · bajada
// Capturas en tools/cache/screens/e2e_b11_<nn>_<hito>.png y transcripción en e2e_b11_dialogos.txt.
// Uso: node tools/e2e_b11.mjs [--base=http://localhost:8080] [--headed] [--from=neblino|ruta10|villa|campamento|t09|cerro]
//      [--only=<tramo>] [--no-retry]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB11Helpers } from './e2e_b11_page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const arg = (n, d) => (argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=').slice(1).join('=');
const BASE = arg('base', 'http://localhost:8080');
const RETRY = !argv.includes('--no-retry');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
const KEY = { 2: 'ArrowDown', 4: 'ArrowLeft', 6: 'ArrowRight', 8: 'ArrowUp' };
const DIR = { down: 2, left: 4, right: 6, up: 8 };

/** Estado de entrada del bloque (CAMPANA B11 «Entrada: Trepar y Ruta 9»; equipo alto para el piloto). */
const BASE_FLAGS = [
  'b01_woke', 'b01_met_mom', 'b01_lab_intro_seen', 'b01_starter_chosen', 'b01_signal_heard', 'b01_police_entered',
  'b01_core_found', 'b01_escorted', 'b01_gael_duel_done', 'b01_mom_gift', 'b01_dex_received', 'b01_left_town', 'p1_restored', 'p2_restored', 'p3_restored', 'p4_restored', 'p5_restored',
  'zyg_10', 'zyg_core_2', 'b02_libreta', 'b03_gael_b2', 'b05_brontia', 'b07_megaring', 'b09_gala', 'b09_gael_b3',
  'b10_llegada', 'b10_niebla_levantada', 'b10_archivo_abierto', 'b10_informe',
].join(',');
const entry = (over) => new URLSearchParams({
  scene: 'map', party: 'TORTERRA:62,STARAPTOR:60,LUXRAY:60', fragments: '5', noenc: '1', time: '22',
  zygarde: 'run,ram,terrain,climb', zcells: '46', zcores: '2', vars: 'starter:TURTWIG,gael_starter:LITTEN', ...over,
  flags: [BASE_FLAGS, over?.flags].filter(Boolean).join(','),
});
const STARTS = {
  neblino: entry({ map: 'ruta_9_neblino', x: '23', y: '57', dir: '8' }),
  ruta10: entry({ map: 'ruta_10', x: '21', y: '38', dir: '8', flags: 'b11_neblino_intro,b11_t10_nilo_visto,b11_t10_nilo_cuenta' }),
  villa: entry({ map: 'ruta_1', x: '14', y: '3', dir: '8', time: '11', flags: 'b11_t10_cuadrilla,b11_t10_alfa,b11_t10_tablilla,b11_nilo_desertor' }),
  campamento: entry({ map: 'villa_alba', x: '22', y: '30', dir: '2', time: '11', flags: 'b11_regreso,b11_huevo,b11_gael_alerce' }),
  t09: entry({ map: 'aldea_mnemos', x: '5', y: '20', dir: '8', time: '11', vars: 'starter:TURTWIG,gael_starter:LITTEN' }),
  cerro: entry({ map: 'ruta_1', x: '23', y: '7', dir: '6', time: '11' }),
};
const ORDER = ['neblino', 'ruta10', 'villa', 'campamento', 't09', 'cerro'];
/** Tramos que necesitan cargar su propia URL aunque se venga del anterior (saltan de región). */
const FRESH = new Set(['t09', 'cerro']);
const FROM = arg('from', 'neblino');
const ONLY = arg('only', '');
if (!STARTS[FROM]) throw new Error(`--from desconocido: ${FROM} (${ORDER.join(', ')})`);

// ───────────────────────────── Conductor ─────────────────────────────

class Driver {
  constructor(page, errors) {
    this.page = page;
    this.errors = errors;
    this.shots = 0;
    this.milestones = [];
  }

  eval(fn, arg) { return this.page.evaluate(fn, arg); }
  wait(ms) { return this.page.waitForTimeout(ms); }
  snapState() {
    return this.eval(() => ({
      ...window.__e2e.snap(),
      vars: window.__b11.vars(),
      tablets: window.__b11.tablets(),
      partyFull: window.__b11.party(),
      lost: window.__b11.lost.slice(),
      choices: window.__b11.choiceItems(),
    }));
  }

  async press(key, after = 180) {
    await this.page.keyboard.down(key);
    await this.wait(70);
    await this.page.keyboard.up(key);
    await this.wait(after);
  }

  async until(fn, { timeout = 20000, what = 'condición', poll = 120 } = {}) {
    const end = Date.now() + timeout;
    for (;;) {
      const s = await this.snapState();
      if (fn(s)) return s;
      if (Date.now() > end) throw new Error(`Tiempo agotado esperando: ${what}\nestado: ${JSON.stringify({ ...s, flags: undefined })}\n${this.errors.slice(-6).join('\n')}`);
      await this.wait(poll);
    }
  }

  async shot(name) {
    this.shots += 1;
    const file = path.join(OUT, `e2e_b11_${String(this.shots).padStart(2, '0')}_${name}.png`);
    await this.page.locator('#stage').screenshot({ path: file });
    console.log(`  captura → ${path.relative(ROOT, file)}`);
    return file;
  }

  async milestone(name, check) {
    const s = await this.snapState();
    const problem = check ? check(s) : null;
    if (problem) throw new Error(`Hito «${name}»: ${problem}\nestado: ${JSON.stringify({ ...s, flags: Object.keys(s.flags).filter((k) => k.startsWith('b11')) })}`);
    await this.shot(name);
    this.milestones.push(name);
    console.log(`  ✔ ${name}`);
    return s;
  }

  log() { return this.eval(() => window.__e2e.log.slice()); }

  async expectSaid(re, what) {
    const log = await this.log();
    if (!log.some((l) => re.test(l.text))) throw new Error(`No se dijo ${what} (${re})\nÚltimos: ${log.slice(-8).map((l) => `${l.speaker}: ${l.text}`).join(' | ')}`);
  }

  /** Atiende mensajes, elecciones, placas y combates hasta que el mapa queda libre. */
  async settle({ timeout = 240000, choose = defaultChoice, watch = [] } = {}) {
    const end = Date.now() + timeout;
    let calm = 0;
    while (Date.now() < end) {
      let s = await this.snapState();
      for (const w of watch) {
        if (w.done) continue;
        const hit = (w.re && w.re.test(s.lastText || '')) || (w.scene && s.top === w.scene);
        if (!hit) continue;
        w.done = true;
        if (w.delay) await this.wait(w.delay);
        await this.shot(w.name);
        s = await this.snapState();
      }
      if (['MessageScene', 'VerseScene', 'TravelScene'].includes(s.top)) { calm = 0; await this.press('KeyZ', 160); continue; }
      if (s.top === 'ChoiceScene') {
        calm = 0;
        const want = choose(s);
        for (let i = s.choiceIndex; i < want; i++) await this.press('ArrowDown', 120);
        for (let i = s.choiceIndex; i > want; i--) await this.press('ArrowUp', 120);
        await this.press('KeyZ', 250);
        continue;
      }
      if (s.top === 'MapScene' && s.ready && !s.busy && !s.playerBusy) {
        calm += 1;
        if (calm >= 4) return s;
      } else calm = 0;
      await this.wait(150);
    }
    throw new Error(`settle: el mapa no queda libre\n${JSON.stringify(await this.snapState())}`);
  }

  /** Un paso en `dir` (mantiene la tecla hasta que el jugador se mueve o algo lo interrumpe). */
  async step(dir) {
    const before = await this.snapState();
    const key = KEY[dir];
    await this.page.keyboard.down(key);
    try {
      const end = Date.now() + 1500;
      while (Date.now() < end) {
        const s = await this.snapState();
        if (s.map !== before.map || s.x !== before.x || s.y !== before.y || s.busy || s.top !== 'MapScene') break;
        await this.wait(20);
      }
    } finally {
      await this.page.keyboard.up(key);
    }
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 4000, what: 'fin del paso' });
  }

  async turn(dir) {
    const d = typeof dir === 'string' ? DIR[dir] : dir;
    const s = await this.snapState();
    if (s.dir === d) return;
    await this.press(KEY[d], 150);
    await this.until((st) => st.dir === d || st.busy, { timeout: 2000, what: 'girar' });
  }

  /** Camina hasta (x, y) (o a su lado con onto: false) atendiendo lo que salte; `face` gira al final. */
  async walkTo(x, y, { onto = true, face = null, maxSteps = 500, stopWhen = null, watch = [], choose } = {}) {
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') s = await this.settle({ watch, choose });
      if (stopWhen && stopWhen(s)) return s;
      const done = onto ? s.x === x && s.y === y : Math.abs(s.x - x) + Math.abs(s.y - y) === 1;
      if (done) {
        if (face) await this.turn(face);
        return s;
      }
      const route = await this.eval(([tx, ty, o]) => window.__e2e.route(tx, ty, { onto: o }), [x, y, onto]);
      if (!route || !route.length) throw new Error(`Sin ruta a (${x},${y}) en ${s.map} desde (${s.x},${s.y})`);
      await this.step(route[0]);
    }
    throw new Error(`walkTo(${x},${y}): demasiados pasos`);
  }

  /** Pulsa A delante de algo (reintenta si la pulsación se pierde) y atiende lo que pase. */
  async interact(opts = {}) {
    const before = (await this.log()).length;
    for (let i = 0; i < 3; i++) {
      await this.press('KeyZ', 300);
      const s = await this.snapState();
      if (s.busy || s.top !== 'MapScene' || (await this.log()).length > before) break;
      await this.wait(200);
    }
    return this.settle(opts);
  }

  async crossEdge(dir, toMap) {
    for (let i = 0; i < 6; i++) {
      await this.step(DIR[dir]);
      const s = await this.snapState();
      if (s.map === toMap) return this.settle();
      if (s.busy || s.top !== 'MapScene') await this.settle();
    }
    throw new Error(`No se cruzó a ${toMap}`);
  }

  /** Salir por un felpudo o una puerta empujando hacia `dir` hasta cambiar de mapa (atiende lo que salte). */
  async exitTo(dir, toMap) {
    for (let i = 0; i < 6; i++) {
      await this.page.keyboard.down(KEY[DIR[dir]]);
      await this.wait(350);
      await this.page.keyboard.up(KEY[DIR[dir]]);
      await this.wait(250);
      const s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') await this.settle();
      if ((await this.snapState()).map === toMap) return this.settle();
    }
    throw new Error(`No se salió hacia ${toMap}`);
  }

  /** Pared de Trepar: ponerse delante, mirar y aceptar. */
  async climb(fromX, fromY, face, expect) {
    await this.walkTo(fromX, fromY, { face });
    await this.interact();
    await this.until((s) => s.x === expect[0] && s.y === expect[1], { timeout: 8000, what: `trepar hasta (${expect})` });
    await this.settle();
  }

  async goto(url) {
    await this.page.goto(url, { waitUntil: 'load' });
    await installHelpers(this.page);
    await installB11Helpers(this.page, { loseOnce: RETRY ? ['b11_gael_b4'] : [] });
    await this.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'el mapa de arranque' });
    await this.settle();
  }
}

/** Elecciones: «No» a los motes; en el puzzle de Íker, el lugar de cada dibujo y la casa de té; si no, la primera. */
function defaultChoice(s) {
  const items = s.choices || [];
  const last = s.lastText || '';
  if (/mote/i.test(last)) return items.indexOf('No') >= 0 ? items.indexOf('No') : 1;
  if (items.includes('La casa de té')) return items.indexOf('La casa de té');
  if (items.includes('El Archivo Hondo')) {
    const log = s.recent || '';
    if (/escalera que se hunde/.test(log)) return items.indexOf('El Archivo Hondo');
    if (/círculo de piedras/.test(log)) return items.indexOf('El Santuario de los Glifos');
    if (/estanque redondo/.test(log)) return items.indexOf('El estanque de lotos');
  }
  return 0;
}

// ───────────────────────────── Tramos ─────────────────────────────

async function neblino(d) {
  await d.milestone('neblino_llegada', (s) => (s.map === 'ruta_9_neblino' ? null : `mapa ${s.map}`));
  await d.walkTo(23, 49);
  await d.expectSaid(/La niebla se ha retirado/, 'la llegada sin niebla');
  // Nilo, de noche, en su escondite junto al río.
  const nilo = [{ re: /No me delates/, name: 'nilo_escondido', delay: 200 }];
  await d.walkTo(13, 18, { face: 'up' });
  await d.interact({ watch: nilo });
  await d.expectSaid(/Me llamo Nilo/, 'la presentación de Nilo');
  await d.interact();
  await d.expectSaid(/subimos a la Ruta 10/, 'la segunda pista de Nilo');
  await d.milestone('t10_pistas', (s) => (s.flags.b11_t10_nilo_cuenta ? null : 'sin la segunda pista'));
  // C047: la loma del tronco hueco (Trepar).
  await d.climb(35, 11, 'up', [35, 7]);
  await d.walkTo(35, 6);
  await d.settle();
  await d.milestone('c047', (s) => (s.cells.includes('cell_neblino_1') ? null : 'sin C047'));
  await d.climb(35, 7, 'down', [35, 11]);
  await d.walkTo(21, 0);
  await d.crossEdge('up', 'ruta_10');
}

async function ruta10(d) {
  // Pista de Zygarde hacia casa (franja y 30 del sendero del Neblino).
  const s0 = await d.snapState();
  if (s0.y > 30) await d.walkTo(21, 29);
  await d.expectSaid(/Por ahí se va a tu casa/, 'la pista de Zygarde hacia casa');
  await d.climb(30, 17, 'up', [30, 13]);
  await d.milestone('ruta10_alto');
  // C049 en la repisa de la pared de raíces.
  await d.climb(15, 6, 'up', [15, 2]);
  await d.walkTo(14, 1);
  await d.settle();
  await d.milestone('c049', (s) => (s.cells.includes('cell_ruta_10_2') ? null : 'sin C049'));
  await d.climb(15, 2, 'down', [15, 6]);
  // Alarma a propósito: esperar a que el centinela 2 mire abajo y pisar su línea.
  await d.walkTo(39, 12);
  const end = Date.now() + 20000;
  while (Date.now() < end) {
    const dir = await d.eval(() => window.__b11.eventPos('centinela_2')?.dir);
    if (dir === 2) break;
    await d.wait(60);
  }
  await d.step(6);
  await d.settle({ watch: [{ re: /voz de alarma/, name: 't10_alarma', delay: 200 }] });
  await d.expectSaid(/voz de alarma/, 'la alarma del centinela');
  await d.milestone('t10_punto_seguro', (s) => (s.x === 31 && s.y === 13 ? null : `tras la alarma en (${s.x},${s.y})`));
  // Sigilo: planificador con el reloj de los centinelas.
  for (let n = 0; n < 400; n++) {
    const s = await d.snapState();
    if (s.busy || s.top !== 'MapScene') throw new Error(`El sigilo ha fallado en (${s.x},${s.y}): ${s.lastText}`);
    if (s.x === 46 && s.y === 7) break;
    const a = await d.eval(() => window.__b11.stealthNext(46, 7));
    if (a === null) throw new Error(`Sin plan de sigilo desde (${s.x},${s.y})`);
    if (a === 0) { await d.wait(70); continue; }
    await d.step(a);
  }
  await d.milestone('t10_sigilo', (s) => (s.x === 46 && s.y === 7 ? null : `no se llegó a la cornisa: (${s.x},${s.y})`));
  await d.climb(46, 7, 'up', [46, 3]);
  // La cuadrilla.
  await d.walkTo(44, 3, { face: 'up' });
  await d.interact({ watch: [{ re: /tiende vetas verdes/, name: 't10_cuadrilla', delay: 200 }] });
  await d.milestone('t10_rescate', (s) => (s.flags.b11_t10_cuadrilla ? null : 'sin rescate'));
  // El Honchkrow Alfa y la Tabla Oscura.
  await d.walkTo(48, 1, { face: 'right' });
  await d.interact({ watch: [{ scene: 'BattleScene', name: 't10_alfa', delay: 4000 }] });
  await d.milestone('t10_alfa', (s) => (s.flags.b11_t10_alfa ? null : 'el Alfa sigue en pie'));
  await d.walkTo(48, 2, { face: 'right' });
  await d.interact({ watch: [{ re: /Tabla Oscura/, name: 't10_tabla', delay: 400 }, { re: /planos de la Estación Talasa/, name: 't10_nilo', delay: 200 }] });
  await d.expectSaid(/Lo dejo\./, 'la deserción de Nilo');
  await d.milestone('t10_resuelto', (s) => {
    if (!s.tablets.includes('DREADPLATE')) return 'sin Tabla Oscura';
    return s.flags.b11_nilo_desertor && s.flags.b11_planos_talasa ? null : 'Nilo no ha desertado';
  });
  await d.climb(30, 13, 'down', [30, 17]);
  await d.walkTo(59, 20);
  await d.crossEdge('right', 'ruta_1');
}

async function villa(d) {
  await d.walkTo(14, 0);
  await d.crossEdge('up', 'villa_alba');
  await d.settle();
  await d.expectSaid(/Tu pueblo\. Desde aquí se ve el Monte/, 'el primer regreso a casa');
  // Casa: Mamá y el huevo de Togepi.
  await d.walkTo(10, 26);
  await d.exitTo('up', 'casa_prota_1f');
  await d.settle({ watch: [{ re: /Una Togepi puso un huevo/, name: 'huevo_mama', delay: 200 }] });
  await d.expectSaid(/Una Togepi puso un huevo en el jardín y no ha vuelto\. Creo que es para ti\./, 'la frase de Mamá');
  await d.milestone('huevo', (s) => (s.partyFull.some((p) => p.egg && p.species === 'TOGEPI') ? null : 'sin huevo en el equipo'));
  await d.walkTo(7, 10);
  await d.exitTo('down', 'villa_alba');
  await d.settle();
  // Eclosión: el huevo casi a punto; dos pasos.
  await d.eval(() => window.__b11.setEggSteps(2));
  await d.step(6);
  await d.step(4);
  await d.settle({ watch: [{ re: /Del Huevo ha salido/, name: 'eclosion', delay: 200 }] });
  await d.expectSaid(/Del Huevo ha salido un Togepi/, 'la eclosión');
  await d.milestone('togepi', (s) => (s.partyFull.some((p) => !p.egg && p.species === 'TOGEPI') ? null : 'Togepi no ha nacido'));
  // Laboratorio: Gael frente a Alerce.
  await d.walkTo(37, 19);
  await d.exitTo('up', 'laboratorio_alerce');
  await d.settle({ watch: [{ re: /Sabía de qué eran capaces/, name: 'gael_alerce', delay: 100 }] });
  await d.expectSaid(/Usted sabía quiénes eran desde el principio\./, 'la acusación de Gael');
  await d.expectSaid(/Sabía de qué eran capaces\./, 'la respuesta de Alerce');
  await d.milestone('laboratorio', (s) => (s.flags.b11_gael_alerce ? null : 'sin la escena del laboratorio'));
  await d.walkTo(9, 13);
  await d.exitTo('down', 'villa_alba');
  await d.settle();
}

async function campamento(d) {
  await d.walkTo(22, 35);
  await d.crossEdge('down', 'ruta_1');
  await d.walkTo(0, 16);
  await d.crossEdge('left', 'ruta_10');
  await d.climb(30, 17, 'up', [30, 13]);
  await d.walkTo(0, 7);
  await d.crossEdge('left', 'campamento_monte');
  const watch = [
    { re: /EXP-03, sellada y registrada/, name: 'exp03', delay: 200 },
    { re: /Intenté subir/, name: 'gael_monte', delay: 200 },
    { scene: 'BattleScene', name: 'gael_b4', delay: 4000 },
  ];
  await d.walkTo(34, 7, { watch, stopWhen: (s) => s.flags.b11_gael_b4 });
  await d.settle({ watch });
  await d.expectSaid(/Se llevan algo que estuvo conmigo aquellas noches/, 'la reacción de Zygarde');
  await d.expectSaid(/Cuando vuelvas, cuéntame qué hay\./, 'la frase de Gael');
  await d.expectSaid(/…No\. Da igual\./, 'el final de Gael');
  await d.milestone('gael_b4', (s) => {
    if (!s.flags.b11_exp03) return 'Genesis no se ha llevado EXP-03';
    if (RETRY && !s.lost.includes('b11_gael_b4')) return 'no se simuló la derrota';
    return s.flags.b11_gael_b4 ? null : 'sin b11_gael_b4';
  });
  // La senda del Monte, abierta: sube a la explanada del prólogo y vuelve.
  await d.walkTo(10, 1);
  await d.exitTo('up', 'montana_portal');
  await d.settle();
  await d.milestone('monte_portal');
  await d.walkTo(17, 49);
  await d.press('ArrowDown', 600);
  await d.until((s) => s.map === 'campamento_monte' && s.ready, { timeout: 15000, what: 'volver al campamento' });
  await d.settle();
  await d.milestone('campamento_recogido', (s) => (s.flags.b11_gael_b4 ? null : 'sin salida'));
}

async function t09(d) {
  await d.exitTo('up', 'mnemos_casa_iker'); // puerta de la casa de Íker (B10: ikerDoorEvent)
  await d.settle();
  await d.milestone('casa_iker');
  const recentChoose = async () => {
    const log = (await d.log()).slice(-3).map((l) => l.text).join(' ');
    return (s) => defaultChoice({ ...s, recent: log });
  };
  await d.walkTo(10, 5, { face: 'up' });
  // Cada dibujo lleva su pregunta: se elige leyendo el texto del dibujo recién mostrado.
  await d.press('KeyZ', 300);
  for (let guard = 0; guard < 200; guard++) {
    const s = await d.snapState();
    if (s.top === 'MapScene' && s.ready && !s.busy) break;
    if (s.top === 'ChoiceScene') {
      const choose = await recentChoose();
      const want = choose(s);
      for (let i = s.choiceIndex; i < want; i++) await d.press('ArrowDown', 110);
      await d.press('KeyZ', 250);
      continue;
    }
    if (s.top === 'MessageScene') await d.press('KeyZ', 150);
    else await d.wait(120);
  }
  await d.settle();
  await d.expectSaid(/¡La casa de té!/, 'la deducción del pozo');
  await d.milestone('t09_pozo_deducido', (s) => (s.flags.b11_t09_pozo_deducido ? null : 'sin deducción'));
  await d.walkTo(7, 10);
  await d.exitTo('down', 'aldea_mnemos');
  await d.settle();
  // Casa de té: el Musharna abre el pozo.
  await d.walkTo(7, 33);
  await d.exitTo('up', 'mnemos_casa_te');
  await d.settle();
  await d.walkTo(11, 9, { face: 'right' });
  await d.interact({ watch: [{ re: /escalera de piedra que baja/, name: 't09_musharna', delay: 200 }] });
  await d.until((s) => s.map === 'mnemos_pozo_custodios' && s.ready, { timeout: 15000, what: 'bajar al pozo' });
  await d.settle();
  await d.walkTo(8, 5, { face: 'up' });
  await d.interact({ watch: [{ re: /Tabla Mental/, name: 't09_tabla', delay: 400 }] });
  await d.milestone('t09_tabla', (s) => (s.tablets.includes('MINDPLATE') ? null : 'sin Tabla Mental'));
  await d.walkTo(8, 12);
  await d.step(2);
  await d.settle();
  await d.until((s) => s.map === 'mnemos_casa_te' && s.ready, { timeout: 15000, what: 'volver a la casa de té' });
  await d.settle();
  await d.walkTo(7, 10);
  await d.exitTo('down', 'aldea_mnemos');
  await d.settle();
  await d.walkTo(5, 20, { face: 'up' });
  await d.exitTo('up', 'mnemos_casa_iker');
  await d.settle({ watch: [{ re: /la Mnemos de antes se ha ido/, name: 't09_iker', delay: 200 }] });
  const items = await d.eval(() => window.__b11.items('CHIMECHITE'));
  await d.milestone('t09_resuelto', (s) => (s.flags.b11_t09_iker_curado && items === 1 ? null : `curado ${s.flags.b11_t09_iker_curado}, Chimechita ${items}`));
}

async function cerro(d) {
  await d.interact();
  await d.until((s) => s.map === 'cerro_alba' && s.ready, { timeout: 15000, what: 'subir al Cerro del Alba' });
  await d.settle();
  await d.expectSaid(/tejados de Villa Alba/, 'la llegada al cerro');
  await d.climb(11, 23, 'up', [11, 19]);
  await d.walkTo(18, 15);
  await d.settle();
  await d.milestone('c054', (s) => (s.cells.includes('cell_cerro_alba_1') ? null : 'sin C054'));
  await d.walkTo(12, 5, { face: 'up' });
  await d.interact();
  await d.expectSaid(/brasero antiguo/, 'el brasero');
  await d.climb(11, 19, 'down', [11, 23]);
  await d.walkTo(5, 28);
  await d.step(2);
  await d.settle();
  await d.until((s) => s.map === 'ruta_1' && s.ready, { timeout: 15000, what: 'bajar a la Ruta 1' });
  await d.settle();
  await d.milestone('cerro_bajada', (s) => (s.x === 23 && s.y === 7 ? null : `(${s.x},${s.y})`));
}

const STAGES = { neblino, ruta10, villa, campamento, t09, cerro };

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
  const d = new Driver(page, errors);
  const t0 = Date.now();
  let failed = null;
  // La transcripción vive en la página: se guarda la de cada tramo antes de recargar.
  const transcript = [];
  try {
    const list = ONLY ? [ONLY] : ORDER.slice(ORDER.indexOf(FROM));
    let loaded = false;
    for (const name of list) {
      if (!loaded || FRESH.has(name)) {
        if (loaded) transcript.push(...(await d.log().catch(() => [])));
        await d.goto(`${BASE}/?${STARTS[name].toString()}&debug`);
        loaded = true;
      }
      console.log(`— ${name}`);
      await STAGES[name](d);
    }
    const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
    if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
  } catch (err) {
    failed = err;
    await d.shot('fallo').catch(() => {});
  }
  const log = [...transcript, ...(await d.log().catch(() => []))];
  fs.writeFileSync(path.join(OUT, 'e2e_b11_dialogos.txt'), log.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  await browser.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d.milestones.join(' → ')} (${secs} s; ${log.length} diálogos en tools/cache/screens/e2e_b11_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 11 completo de principio a fin.');
  }
}

await main();
