// Recorrido E2E del Bloque 4 — Pilar de la Corriente (docs/CAMPANA.md B04) en navegador real (Chrome headless +
// playwright-core), con teclas reales y piloto automático en los combates (installBattle de tools/e2e_b01_page.mjs):
//   Caudal (estado de entrada por URL) → Ruta 3 montado en el 10 % por las cuestas de grava (C016–C018, entrenadores)
//   → Garganta (el Core nota las balizas, técnicos y tres balizas retiradas, C020, C019 por la repisa) → choque de
//   Gael y Leandro, que abre la puerta → Pilar: reto de Leandro → Escalera de Estanques con la solución de referencia
//   EXACTA de CAMPANA (4 fases, comprobando el agua tras cada una; C021–C023 en los fondos) → la corriente llega al
//   núcleo → combate con Leandro → restauración (Fragmento 2, verso II, p2_restored) e inscripción (T02 paso 2, T03)
//   → vuelta a Caudal: al día siguiente, las gracias en la plaza y el inicial que nadie eligió de manos de Alerce.
// Uso: node tools/e2e_b04.mjs [--base=http://localhost:8080] [--headed] [--from=ruta3|garganta|pilar|nucleo|caudal]
// Capturas en tools/cache/screens/e2e_b04_<nn>_<hito>.png y transcripción e2e_b04_dialogos.txt. Sale con 1 si falla.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB04Helpers } from './e2e_b04_page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
// Capturas de recorridos anteriores fuera: la numeración cambia según la etapa de partida.
for (const f of fs.readdirSync(OUT)) if (f.startsWith('e2e_b04_')) fs.rmSync(path.join(OUT, f), { force: true });
const argv = process.argv.slice(2);
const arg = (n, d) => (argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).slice(n.length + 3);
const BASE = arg('base', 'http://localhost:8080');
const FROM = arg('from', 'ruta3');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
const KEY = { 2: 'ArrowDown', 4: 'ArrowLeft', 6: 'ArrowRight', 8: 'ArrowUp' };
const DIR = { down: 2, left: 4, right: 6, up: 8 };

// ───────────────────────────── Estado de entrada (URL) ─────────────────────────────
const ENTRY_FLAGS = [
  'prologue_seen', 'b01_woke', 'b01_met_mom', 'b01_lab_intro_seen', 'b01_starter_chosen', 'b01_signal_heard',
  'b01_police_entered', 'b01_core_found', 'b01_escorted', 'b01_gael_duel_done', 'b01_dex_received', 'b01_mom_gift',
  'b01_left_town', 'p1_restored', 'zyg_10', 'b02_libreta', 'b03_caudal_llegada', 'b03_gael_b2', 'b03_llamada_alerce',
];
const STAGE_FLAGS = {
  ruta3: [],
  garganta: [],
  pilar: ['b04_garganta_llegada', 'b04_baliza_1', 'b04_baliza_2', 'b04_baliza_3', 'b04_balizas_retiradas', 'b04_choque'],
  nucleo: ['b04_garganta_llegada', 'b04_balizas_retiradas', 'b04_choque', 'b04_reto', 'b04_ciclo'],
  caudal: ['b04_garganta_llegada', 'b04_balizas_retiradas', 'b04_choque', 'b04_reto', 'b04_ciclo', 'b04_leandro_vencido', 'p2_restored', 'b04_leandro_despedida'],
};
const STAGE_START = {
  ruta3: 'map=ciudad_caudal&x=1&y=4&dir=4',
  garganta: 'map=garganta_albo&x=17&y=38&dir=8',
  pilar: 'map=pilar_corriente&x=20&y=37&dir=8',
  nucleo: 'map=pilar_corriente&x=20&y=12&dir=8&vars=starter:TURTWIG,gael_starter:LITTEN,b04_compuertas:15,b04_noria:1,b04_agua:6',
  caudal: 'map=ruta_3&x=37&y=33&dir=6&fragments=2',
};
function stageUrl(stage) {
  const flags = [...ENTRY_FLAGS, ...STAGE_FLAGS[stage]].join(',');
  const start = STAGE_START[stage];
  const vars = start.includes('vars=') ? '' : '&vars=starter:TURTWIG,gael_starter:LITTEN';
  return `${BASE}/?scene=map&${start}${vars}&flags=${flags}&party=GROTLE:30,STARAVIA:28,LUXIO:28,BUIZEL:27`
    + '&core=1&zygarde=run&zform=10&fragments=1&noenc=1&debug';
}

// ───────────────────────────── Conductor (como tools/e2e_b01.mjs) ─────────────────────────────
class Driver {
  constructor(page, errors) { this.page = page; this.errors = errors; this.shots = 0; this.milestones = []; }
  eval(fn, a) { return this.page.evaluate(fn, a); }
  wait(ms) { return this.page.waitForTimeout(ms); }
  snapState() { return this.eval(() => ({ ...window.__e2e.snap(), puzzle: window.__e2e.b04?.puzzle(), riding: window.__e2e.b04?.riding() })); }

  async press(key, after = 180) {
    await this.page.keyboard.down(key); await this.wait(70); await this.page.keyboard.up(key); await this.wait(after);
  }

  async until(fn, { timeout = 20000, what = 'condición', poll = 120 } = {}) {
    const end = Date.now() + timeout;
    for (;;) {
      const s = await this.snapState();
      if (fn(s)) return s;
      if (Date.now() > end) throw new Error(`Tiempo agotado esperando: ${what}\nestado: ${JSON.stringify(s)}\n${this.errors.slice(-6).join('\n')}`);
      await this.wait(poll);
    }
  }

  async shot(name) {
    this.shots += 1;
    const file = path.join(OUT, `e2e_b04_${String(this.shots).padStart(2, '0')}_${name}.png`);
    await this.page.locator('#stage').screenshot({ path: file });
    console.log(`  captura → ${path.relative(ROOT, file)}`);
  }

  async milestone(name, check) {
    const s = await this.snapState();
    const problem = check ? check(s) : null;
    if (problem) throw new Error(`Hito «${name}»: ${problem}\nestado: ${JSON.stringify(s)}`);
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

  async settle({ timeout = 240000, watch = [] } = {}) {
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
      if (s.top === 'MessageScene') { calm = 0; await this.press('KeyZ', 150); continue; }
      // Placa del verso (VerseScene) y animaciones de obtención: se cierran con A.
      if (s.top === 'VerseScene' || s.top === 'ObtainScene') { calm = 0; await this.wait(600); await this.press('KeyZ', 400); continue; }
      if (s.top === 'ChoiceScene') {
        calm = 0;
        const want = /mote/i.test(s.lastText || '') ? 1 : 0;
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

  async step(dir) {
    const before = await this.snapState();
    await this.page.keyboard.down(KEY[dir]);
    try {
      const end = Date.now() + 1500;
      while (Date.now() < end) {
        const s = await this.snapState();
        if (s.map !== before.map || s.x !== before.x || s.y !== before.y || s.busy || s.top !== 'MapScene') break;
        await this.wait(25);
      }
    } finally {
      await this.page.keyboard.up(KEY[dir]);
    }
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 4000, what: 'fin del paso' });
  }

  async walkTo(x, y, { onto = true, face = null, maxSteps = 500, stopWhen = null, watch = [] } = {}) {
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snapState();
      const mapBefore = s.map;
      if (s.busy || s.top !== 'MapScene') s = await this.settle({ watch });
      if (stopWhen && stopWhen(s)) return s;
      if (s.map !== mapBefore && (await this.log()).some((l) => /No te quedan Pokémon en condiciones/.test(l.text))) {
        throw new Error(`Derrota: el jugador vuelve a ${s.map}`);
      }
      const done = onto ? s.x === x && s.y === y : Math.abs(s.x - x) + Math.abs(s.y - y) === 1;
      if (done) { if (face) await this.turn(face); return s; }
      const route = await this.eval(([tx, ty, o]) => window.__e2e.route(tx, ty, { onto: o }), [x, y, onto]);
      if (!route || !route.length) throw new Error(`Sin ruta a (${x},${y}) en ${s.map} desde (${s.x},${s.y})`);
      await this.step(route[0]);
    }
    throw new Error(`walkTo(${x},${y}): demasiados pasos`);
  }

  async turn(dir) {
    const d = typeof dir === 'string' ? DIR[dir] : dir;
    const s = await this.snapState();
    if (s.dir === d) return;
    await this.press(KEY[d], 150);
    await this.until((st) => st.dir === d || st.busy, { timeout: 2000, what: 'girar' });
  }

  /** Se pone en (x, y) mirando a `face` y pulsa A; atiende lo que salga. */
  async interact(x, y, face, { watch = [] } = {}) {
    await this.walkTo(x, y, { face, watch });
    await this.press('KeyZ', 400);
    return this.settle({ watch });
  }

  async crossEdge(dir, toMap) {
    for (let i = 0; i < 6; i++) {
      await this.step(DIR[dir]);
      const s = await this.snapState();
      if (s.map === toMap) return s;
      if (s.busy || s.top !== 'MapScene') await this.settle();
    }
    throw new Error(`No se cruzó a ${toMap}`);
  }

  async mount() {
    const s = await this.snapState();
    if (s.riding) return;
    await this.press('KeyE', 400);
    await this.until((st) => st.riding, { timeout: 5000, what: 'montar en Zygarde (10 %)' });
  }
}

const has = (s, k) => Boolean(s.flags[k]);
const needFlags = (...ks) => (s) => { const miss = ks.filter((k) => !has(s, k)); return miss.length ? `faltan flags ${miss.join(', ')}` : null; };
const needCells = (...ks) => (s) => { const miss = ks.filter((k) => !s.cells.includes(k)); return miss.length ? `faltan células ${miss.join(', ')}` : null; };
const both = (...fs) => (s) => fs.map((f) => f(s)).find(Boolean) || null;
const waterOf = (s) => [0, 1, 2, 3, 4, 5].filter((i) => (s.puzzle.water >> i) & 1).map((i) => `E${i + 1}`).join(',');
const needWater = (want) => (s) => (waterOf(s) === want ? null : `agua ${waterOf(s)} ≠ ${want} (${s.puzzle.text})`);

// ───────────────────────────── Recorrido ─────────────────────────────

async function ruta3(d) {
  await d.settle();
  await d.milestone('caudal_entrada');
  await d.walkTo(0, 4);
  await d.crossEdge('left', 'ruta_3');
  await d.settle();
  await d.milestone('ruta_3', (s) => (s.map === 'ruta_3' ? null : s.map));
  await d.mount();
  const watch = [{ scene: 'BattleScene', name: 'combate_ruta3', delay: 3500 }];
  for (const [id, x, y] of [['cell_ruta_3_1', 23, 28], ['cell_ruta_3_3', 36, 7], ['cell_ruta_3_2', 14, 10]]) {
    await d.walkTo(x, y, { watch, stopWhen: (s) => s.cells.includes(id) });
    await d.settle({ watch });
    await d.mount();
  }
  await d.milestone('cuestas_de_grava', needCells('cell_ruta_3_1', 'cell_ruta_3_2', 'cell_ruta_3_3'));
  await d.walkTo(9, 0, { watch });
  await d.crossEdge('up', 'garganta_albo');
}

async function garganta(d) {
  await d.settle({ watch: [{ re: /Más arriba hay algo que zumba/, name: 'core_balizas', delay: 200 }] });
  await d.expectSaid(/Más arriba hay algo que zumba/, 'el aviso del Core');
  await d.milestone('garganta', needFlags('b04_garganta_llegada'));
  await d.mount();
  const watch = [{ scene: 'BattleScene', name: 'combate_tecnico', delay: 3500 }];
  // Baliza 1 (garganta baja): el técnico la vigila.
  await d.interact(23, 36, 'left', { watch });
  if (!(await d.snapState()).flags.b04_baliza_1) await d.interact(23, 36, 'left', { watch });
  await d.milestone('baliza_1', needFlags('b04_baliza_1'));
  // C019 en la repisa de la cascada pequeña (orilla oeste, cuesta de grava).
  await d.walkTo(9, 21, { watch, stopWhen: (s) => s.cells.includes('cell_garganta_1') });
  await d.settle();
  await d.mount();
  // Baliza 2 (molino) y C020 junto a la rueda del molino abandonado.
  await d.walkTo(15, 18, { watch, stopWhen: (s) => s.cells.includes('cell_garganta_2') });
  await d.settle();
  await d.interact(30, 21, 'down', { watch });
  if (!(await d.snapState()).flags.b04_baliza_2) await d.interact(30, 21, 'down', { watch });
  await d.milestone('baliza_2_molino', both(needFlags('b04_baliza_2'), needCells('cell_garganta_1', 'cell_garganta_2')));
  // Leandro en la esclusa.
  await d.interact(16, 12, 'left');
  await d.expectSaid(/Esta esclusa la puso mi tatarabuelo/, 'Leandro en la esclusa');
  // Baliza 3 junto a la puerta del Pilar: al retirarla, choque de Gael y Leandro.
  const clash = [...watch, { re: /Nadie te ha pedido nada/, name: 'choque_gael_leandro', delay: 300 }];
  await d.interact(23, 5, 'up', { watch: clash });
  if (!(await d.snapState()).flags.b04_baliza_3) await d.interact(23, 5, 'up', { watch: clash });
  await d.settle({ watch: clash });
  await d.expectSaid(/Nadie te ha pedido nada, chaval\./, 'la línea de Leandro');
  await d.expectSaid(/Por eso lo hago yo\./, 'la línea de Gael');
  await d.milestone('choque_y_puerta', needFlags('b04_baliza_3', 'b04_balizas_retiradas', 'b04_choque'));
  const st = await d.eval(() => window.__e2e.b04.story());
  if (st.beacons !== 3) throw new Error(`balizas en la mochila: ${st.beacons}`);
  await d.walkTo(26, 2, { stopWhen: (s) => s.map === 'pilar_corriente' });
  await d.until((s) => s.map === 'pilar_corriente' && s.ready, { what: 'entrar en el Pilar' });
}

async function control(d, [x, y, face], phaseCheck, name, watch) {
  await d.interact(x, y, face, { watch });
  if (phaseCheck) await d.milestone(name, phaseCheck);
}

async function pilar(d) {
  await d.settle({ watch: [{ re: /ya veremos si sabes dónde pisas/, name: 'reto_leandro', delay: 200 }] });
  await d.expectSaid(/ya veremos si sabes dónde pisas/, 'el reto de Leandro');
  await d.milestone('pilar_reto', needFlags('b04_reto'));
  const watch = [{ scene: 'BattleScene', name: 'combate_escalera', delay: 3500 }];
  // Fase 1: abrir C1 (rellano) y C2 (repisa tras E2): E1 se vacía.
  await control(d, [24, 34, 'up'], null, '', watch);
  await control(d, [35, 7, 'right'], null, '', watch);
  await d.milestone('fase_1_E1_vacio', needWater('E3,E4'));
  // Fase 2: cerrar C2 y abrir C3 (repisa norte, por el fondo de E1: C021): E4 se vacía; enganchar la noria (C022).
  await control(d, [35, 7, 'right'], null, '', watch);
  await d.walkTo(20, 7, { watch, stopWhen: (s) => s.cells.includes('cell_corriente_1') });
  await d.settle();
  await control(d, [17, 4, 'left'], needWater('E3,E5'), 'fase_2_E4_vacio', watch);
  await d.walkTo(20, 29, { watch, stopWhen: (s) => s.cells.includes('cell_corriente_2') });
  await d.settle();
  await control(d, [20, 28, 'up'], (s) => (s.puzzle.noria ? null : 'noria suelta'), 'fase_2_noria', watch);
  // Fase 3: por E5 (losas) y el fondo de E6 (C023) al mando de C4; abrirlo: la noria sube el agua y E2 se llena.
  await d.walkTo(7, 9, { watch, stopWhen: (s) => s.cells.includes('cell_corriente_3') });
  await d.settle();
  await control(d, [3, 7, 'up'], needWater('E2,E3'), 'fase_3_losas_E2', watch);
  // Fase 4: por las losas de E2 al mando de C2 y abrirlo: ciclo completo (escena de la corriente).
  const cycle = [{ re: /Por los canales corre una luz azul/, name: 'la_corriente', delay: 300 }];
  await control(d, [35, 7, 'right'], null, '', [...watch, ...cycle]);
  await d.settle({ watch: cycle });
  await d.milestone('fase_4_ciclo', both(needFlags('b04_ciclo'), needCells('cell_corriente_1', 'cell_corriente_2', 'cell_corriente_3')));
}

async function nucleo(d) {
  await d.settle();
  const watch = [{ scene: 'BattleScene', name: 'combate_leandro', delay: 4500 }, { re: /Trescientos años girando llaves/, name: 'verso_ii', delay: 300 }];
  await d.walkTo(19, 15, { watch, stopWhen: (s) => s.flags.b04_leandro_vencido });
  await d.settle({ watch });
  await d.milestone('leandro_vencido', needFlags('b04_leandro_vencido'));
  await d.interact(19, 17, 'down', { watch });
  await d.settle({ watch });
  await d.expectSaid(/Trescientos años girando llaves… y el río solo necesitaba que alguien lo escuchara\./, 'la línea de Leandro');
  await d.expectSaid(/La segunda tabla gira donde el agua trabaja/, 'la inscripción (T02)');
  const st = await d.eval(() => window.__e2e.b04.story());
  if (!st.fragments.includes('F02')) throw new Error(`sin Fragmento 2: ${st.fragments}`);
  if (!st.t02 || st.t02.step !== 2) throw new Error(`T02 sin segunda pista: ${JSON.stringify(st.t02)}`);
  if (!st.t03) throw new Error('T03 sin abrir');
  await d.milestone('pilar_restaurado', needFlags('p2_restored', 'verse_2', 'b04_inscripcion', 'b04_leandro_despedida'));
  await d.walkTo(20, 38, { stopWhen: (s) => s.map === 'garganta_albo' });
  if ((await d.snapState()).map !== 'garganta_albo') { await d.press('ArrowDown', 600); }
  await d.until((s) => s.map === 'garganta_albo' && s.ready, { what: 'salir a la Garganta' });
  await d.settle();
  await d.milestone('garganta_en_calma');
  await d.mount();
  await d.walkTo(17, 39);
  await d.crossEdge('down', 'ruta_3');
}

async function caudal(d) {
  await d.settle();
  const watch = [{ re: /Lleva días mirando la puerta/, name: 'alerce_inicial', delay: 300 }, { re: /Vecinos de Caudal/, name: 'plaza_gracias', delay: 300 }];
  await d.walkTo(39, 33, { watch });
  await d.crossEdge('right', 'ciudad_caudal');
  await d.settle({ watch });
  await d.expectSaid(/Lleva días mirando la puerta\./, 'la entrega de Alerce');
  await d.milestone('gracias_e_inicial', both(needFlags('b04_gracias', 'b04_inicial'), (s) => (s.party.includes('SOBBLE') ? null : `equipo ${s.party}`)));
}

// ───────────────────────────── Principal ─────────────────────────────

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME, headless: !argv.includes('--headed'),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.stack || err.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[error] ${msg.text()}`); });
  page.on('response', (res) => { if (res.status() >= 400) errors.push(`[http ${res.status()}] ${res.url()}`); });
  const d = new Driver(page, errors);
  const t0 = Date.now();
  let failed = null;
  const stages = ['ruta3', 'garganta', 'pilar', 'nucleo', 'caudal'];
  try {
    await page.goto(stageUrl(FROM), { waitUntil: 'load' });
    await installHelpers(page);
    await installB04Helpers(page);
    await d.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'mapa de inicio' });
    const run = { ruta3, garganta, pilar, nucleo, caudal };
    for (const st of stages.slice(stages.indexOf(FROM))) {
      console.log(`— ${st}`);
      await run[st](d);
    }
    const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
    if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
  } catch (err) {
    failed = err;
    await d.shot('fallo').catch(() => {});
  }
  const log = await d.log().catch(() => []);
  fs.writeFileSync(path.join(OUT, 'e2e_b04_dialogos.txt'), log.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  await browser.close();
  console.log(`Hitos: ${d.milestones.join(' → ')} (${Math.round((Date.now() - t0) / 1000)} s; ${log.length} diálogos)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) { console.log(`✖ ${failed.message}`); process.exitCode = 1; } else console.log('✔ Bloque 4 completo de principio a fin.');
}

await main();
