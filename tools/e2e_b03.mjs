// Recorrido E2E del Bloque 3 en navegador real (Chrome headless + playwright-core), como un jugador y con teclas
// reales, desde el estado de entrada del bloque (tras el P1: 10 %, Correr, T01 pendiente) preajustado por URL:
//   Villa Zaguán: jardinero (segunda pista T01) → campanario (vista cenital de la espiral) → banco de piedra (latido
//   del Core, excavación, Tabla Pradal) → Mirta (Semilla Milagro) → Centro: Lía (Repartir Exp)
//   → Ruta 2: C013 bajo el puente, entrenadores (piloto automático), montura del 10 % por la rampa de grava (C015)
//   → Ciudad Caudal: Gael en el puente dorado (combate B2) y la llamada de Alerce → C014 en la Esclusa mayor →
//   Anselmo (pista T02) → pescador (Caña Vieja) → Centro → Leandro en la Casa de las Esclusas → salida a la Ruta 3.
// Cada escena se comprueba por su efecto (flags, objetos, Tablillas, pistas, células) y por su texto.
// Uso: node tools/e2e_b03.mjs [--base=http://localhost:8080] [--headed] [--desde=zaguan|ruta2|caudal]
// Capturas en tools/cache/screens/e2e_b03_<nn>_<hito>.png y transcripción e2e_b03_dialogos.txt. Sale con 1 si falla.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { installHelpers } from './e2e_b01_page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const arg = (k, d) => (argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const BASE = arg('base', 'http://localhost:8080');
const FROM = arg('desde', 'zaguan');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
const KEY = { 2: 'ArrowDown', 4: 'ArrowLeft', 6: 'ArrowRight', 8: 'ArrowUp' };
const DIR = { down: 2, left: 4, right: 6, up: 8 };

/** Estado de entrada del bloque (CAMPANA B03: «10 % y T01 activa»): B01 y B02 completos. */
const ENTRY_FLAGS = [
  'prologue_seen', 'b01_woke', 'b01_met_mom', 'b01_lab_intro_seen', 'b01_starter_chosen', 'b01_signal_heard',
  'b01_police_entered', 'b01_core_found', 'b01_escorted', 'b01_gael_duel_done', 'b01_dex_received', 'b01_mom_gift',
  'b01_left_town', 'b02_centro_tutorial', 'b02_gael_espera', 'b02_casilda_acompana', 'b02_dinteles', 'b02_geodude_libre',
  'b02_roca_rota', 'b02_casilda_vencida', 'b02_nucleo', 'b02_salida', 'b02_gael_se_va', 'b02_libreta', 'p1_restored', 'zyg_10',
];
const PARTY = 'TURTWIG:16,STARLY:13,SHINX:13';
const entryUrl = (map, x, y, dir = 2, extraFlags = []) => `${BASE}/?scene=map&map=${map}&x=${x}&y=${y}&dir=${dir}`
  + `&party=${PARTY}&flags=${[...ENTRY_FLAGS, ...extraFlags].join(',')}&vars=starter:TURTWIG,gael_starter:LITTEN`
  + '&zygarde=run&zform=10&zcells=12&time=10&debug';

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
  snapState() { return this.eval(() => window.__e2e.snap()); }

  /** Estado propio del bloque: Tablillas, pistas, objetos clave y dinero. */
  story() {
    return this.eval(() => {
      const st = window.__e2e.engine.state;
      const bag = st?.data?.bag || {};
      return {
        tablets: [...(st?.data?.tablets || [])],
        clues: (st?.data?.clues || []).map((c) => ({ id: c.id, status: c.status, step: c.step, solved: c.solved })),
        items: { EXPSHARE: bag.EXPSHARE || 0, MIRACLESEED: bag.MIRACLESEED || 0, OLDROD: bag.OLDROD || 0, MEADOWPLATE: bag.MEADOWPLATE || 0 },
        riding: Boolean(window.__map?.world?.player?.riding || window.__map?.zygarde?.riding),
      };
    });
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
      if (Date.now() > end) throw new Error(`Tiempo agotado esperando: ${what}\nestado: ${JSON.stringify(s)}\n${this.errors.slice(-6).join('\n')}`);
      await this.wait(poll);
    }
  }

  async shot(name) {
    this.shots += 1;
    const file = path.join(OUT, `e2e_b03_${String(this.shots).padStart(2, '0')}_${name}.png`);
    await this.page.locator('#stage').screenshot({ path: file });
    console.log(`  captura → ${path.relative(ROOT, file)}`);
    return file;
  }

  async milestone(name, check) {
    const s = await this.snapState();
    const problem = check ? await check(s) : null;
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

  /** Atiende mensajes, elecciones (la opción por defecto), combates (piloto automático) y fundidos. */
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
      if (s.top === 'MessageScene') { calm = 0; await this.press('KeyZ', 160); continue; }
      if (s.top === 'ChoiceScene') {
        calm = 0;
        const want = choose(s);
        for (let i = s.choiceIndex; i < want; i++) await this.press('ArrowDown', 120);
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

  /** Camina hasta (x, y) (o a su lado con onto:false) atendiendo lo que salte por el camino. */
  async walkTo(x, y, { onto = true, face = null, maxSteps = 500, stopWhen = null, watch = [] } = {}) {
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snapState();
      const mapBefore = s.map;
      if (s.busy || s.top !== 'MapScene') {
        s = await this.settle({ watch });
        const hp = await this.eval(() => window.__e2e.usePotionIfLow());
        if (hp !== null) console.log(`  (Poción de la Mochila: PS → ${hp})`);
      }
      if (stopWhen && stopWhen(s)) return s;
      if (s.map !== mapBefore) return s;
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

  async turn(dir) {
    const d = typeof dir === 'string' ? DIR[dir] : dir;
    const s = await this.snapState();
    if (s.dir === d) return;
    await this.press(KEY[d], 150);
    await this.until((st) => st.dir === d || st.busy, { timeout: 2000, what: 'girar' });
  }

  /** Pulsa A hasta que empiece una escena (una pulsación puede perderse con la página ocupada). */
  async pressA() {
    for (let i = 0; i < 3; i++) {
      await this.press('KeyZ', 200);
      const end = Date.now() + 1500;
      while (Date.now() < end) {
        const s = await this.snapState();
        if (s.busy || s.top !== 'MapScene') return;
        await this.wait(80);
      }
    }
  }

  /** Se acerca a un evento, lo mira y pulsa A; atiende la escena. */
  async talk(id, { watch = [] } = {}) {
    const pos = await this.eval((i) => window.__e2e.eventPos(i), id);
    if (!pos) throw new Error(`No existe el evento ${id}`);
    const s = await this.walkTo(pos.x, pos.y, { onto: false, watch });
    const d = pos.x > s.x ? 6 : pos.x < s.x ? 4 : pos.y > s.y ? 2 : 8;
    await this.turn(d);
    await this.pressA();
    return this.settle({ watch });
  }

  /** Mira hacia (x, y) desde una casilla vecina concreta y pulsa A. */
  async useFrom(x, y, fx, fy, { watch = [] } = {}) {
    const s = await this.walkTo(fx, fy, { watch });
    const d = x > s.x ? 6 : x < s.x ? 4 : y > s.y ? 2 : 8;
    await this.turn(d);
    await this.pressA();
    return this.settle({ watch });
  }

  async exitTo(toMap) {
    const warp = await this.eval((to) => window.__e2e.warpTo(to), toMap);
    if (!warp) throw new Error(`No hay salida hacia ${toMap}`);
    const direct = await this.eval(([x, y]) => window.__e2e.route(x, y, { onto: true }), [warp.x, warp.y]);
    if (direct) {
      await this.walkTo(warp.x, warp.y, { stopWhen: (s) => s.map === toMap });
    } else {
      // Puerta sobre un tile no pasable (edificios de Exterior1/2): se empuja contra ella desde abajo.
      await this.walkTo(warp.x, warp.y + 1, { stopWhen: (s) => s.map === toMap });
      const s0 = await this.snapState();
      if (s0.map !== toMap) {
        await this.page.keyboard.down('ArrowUp');
        await this.wait(400);
        await this.page.keyboard.up('ArrowUp');
      }
    }
    let s = await this.snapState();
    if (s.map !== toMap && warp.dirTrigger) {
      await this.page.keyboard.down(KEY[warp.dirTrigger]);
      await this.wait(300);
      await this.page.keyboard.up(KEY[warp.dirTrigger]);
    }
    s = await this.until((st) => st.map === toMap && st.ready, { timeout: 15000, what: `llegar a ${toMap}` });
    return this.settle();
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
}

/** Elección por defecto: «No» al mote; en todo lo demás, la primera opción («Sí»). */
function defaultChoice(s) {
  if (/mote/i.test(s.lastText || '')) return 1;
  return 0;
}

// ───────────────────────────── Recorrido ─────────────────────────────

async function zaguan(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'villa_zaguan' && s.ready, { timeout: 30000, what: 'Villa Zaguán' });
  await d.settle();
  await d.shot('zaguan_entrada');
  // Segunda pista: el jardinero
  await d.talk('t01_jardinero');
  await d.expectSaid(/la hierba muerta… gira|gira\. Como un remolino/, 'la segunda pista del jardinero');
  await d.milestone('t01_jardinero', async () => {
    const st = await d.story();
    const t01 = st.clues.find((c) => c.id === 'T01');
    return t01?.step === 2 ? null : `pista T01 ${JSON.stringify(t01)}`;
  });
  // Vista cenital desde el campanario
  const bell = await d.eval(() => window.__e2e.eventPos('t01_campana_0'));
  const view = [{ re: /La hierba seca dibuja una espiral/, name: 't01_vista_cenital', delay: 400 }];
  await d.useFrom(bell.x, bell.y, bell.x, bell.y + 1, { watch: view });
  await d.expectSaid(/su centro no está en el árbol/, 'la vista de la espiral');
  await d.milestone('t01_campanario', (s) => (s.flags.b03_t01_vista ? null : 'sin b03_t01_vista'));
  // Excavación bajo el banco de piedra
  const bench = await d.eval(() => window.__e2e.eventPos('t01_banco_1'));
  const dig = [{ re: /Algo late bajo la piedra/, name: 't01_latido' }, { re: /tabla de piedra verdosa/, name: 't01_excavacion', delay: 300 }];
  await d.useFrom(bench.x, bench.y, bench.x, bench.y + 1, { watch: dig });
  await d.expectSaid(/Tabla Pradal/, 'la Tabla Pradal');
  await d.milestone('t01_tabla_pradal', async (s) => {
    const st = await d.story();
    if (!st.tablets.includes('MEADOWPLATE')) return `Tablillas ${st.tablets}`;
    const t01 = st.clues.find((c) => c.id === 'T01');
    return s.flags.b03_t01_tablilla && t01?.status === 'solved' ? null : `T01 ${JSON.stringify(t01)}`;
  });
  // Mirta: Semilla Milagro
  await d.talk('t01_mirta');
  await d.milestone('t01_mirta_semilla', async () => ((await d.story()).items.MIRACLESEED ? null : 'sin Semilla Milagro'));
  // Lía en el Centro: Repartir Exp
  await d.exitTo('zaguan_centro');
  await d.talk('lia');
  await d.expectSaid(/Repartir Exp/, 'la explicación de Lía');
  await d.milestone('lia_repartir_exp', async () => ((await d.story()).items.EXPSHARE ? null : 'sin Repartir Exp'));
  await d.exitTo('villa_zaguan');
  await d.walkTo(19, 35);
  await d.crossEdge('down', 'ruta_2');
}

async function ruta2(d) {
  // Con --desde=ruta2 la página acaba de cargar: esperar al mapa antes de comprobar el hito.
  await d.until((s) => s.map === 'ruta_2' && s.ready, { what: 'Ruta 2' });
  await d.milestone('ruta_2', (s) => (s.map === 'ruta_2' ? null : `mapa ${s.map}`));
  const battles = [{ scene: 'BattleScene', name: 'combate_ruta_2', delay: 3500 }];
  // C013 bajo el puente del primer arroyo
  await d.walkTo(16, 18, { watch: battles, stopWhen: (s) => s.cells.includes('cell_ruta_2_1') });
  await d.settle();
  await d.milestone('c013_bajo_el_puente', (s) => (s.cells.includes('cell_ruta_2_1') ? null : 'sin C013'));
  // C015: montar en el 10 % (tecla E = botón R) y subir por la rampa de grava
  await d.walkTo(5, 43, { watch: battles });
  await d.press('KeyE', 600);
  await d.settle();
  await d.walkTo(4, 38, { watch: battles, stopWhen: (s) => s.cells.includes('cell_ruta_2_2') });
  await d.settle();
  await d.milestone('c015_rampa_correr', (s) => (s.cells.includes('cell_ruta_2_2') ? null : 'sin C015'));
  await d.walkTo(5, 43, { watch: battles });
  await d.press('KeyE', 600);
  await d.settle();
  // Hacia Caudal por el camino (los entrenadores con visión saltan solos)
  await d.walkTo(14, 69, { watch: battles, stopWhen: (s) => s.map === 'ciudad_caudal' });
  const s = await d.snapState();
  if (s.map !== 'ciudad_caudal') await d.crossEdge('down', 'ciudad_caudal');
}

async function caudal(d) {
  await d.until((s) => s.map === 'ciudad_caudal' && s.ready, { what: 'Ciudad Caudal' });
  await d.settle();
  await d.shot('caudal_llegada');
  // Gael en el puente dorado (B2) y la llamada de Alerce
  const watch = [
    { re: /Se me escapó de las manos… hacia ti/, name: 'gael_celula', delay: 200 },
    { scene: 'BattleScene', name: 'combate_gael_b2', delay: 4500 },
    { re: /¿Balizas de tres patas en la Garganta\?/, name: 'llamada_alerce' },
  ];
  await d.walkTo(31, 9, { watch, stopWhen: (s) => s.flags.b03_gael_b2 });
  await d.settle({ watch });
  await d.expectSaid(/Encontré una célula/, 'la célula de Gael');
  await d.expectSaid(/…Da igual\. Id con cuidado\./, 'la respuesta de Alerce');
  await d.milestone('gael_b2_y_alerce', (s) => (s.flags.b03_gael_b2 && s.flags.b03_llamada_alerce ? null : 'faltan flags de Gael/Alerce'));
  // C014 en la pasarela de la Esclusa mayor
  const cell = await d.eval(() => window.__e2e.eventPos('cell_caudal_1'));
  await d.walkTo(cell.x, cell.y, { stopWhen: (s) => s.cells.includes('cell_caudal_1') });
  await d.settle();
  await d.milestone('c014_esclusa_mayor', (s) => (s.cells.includes('cell_caudal_1') ? null : 'sin C014'));
  // Anselmo: pista T02
  await d.talk('anselmo');
  await d.expectSaid(/La muela del Diezmo pesa como un río/, 'la pista de Anselmo');
  await d.milestone('anselmo_t02', async () => {
    const t02 = (await d.story()).clues.find((c) => c.id === 'T02');
    return t02 && t02.status !== 'solved' ? null : `T02 ${JSON.stringify(t02)}`;
  });
  // Pescador del mercado: Caña Vieja
  await d.talk('pescador');
  await d.milestone('cana_vieja', async () => ((await d.story()).items.OLDROD ? null : 'sin Caña Vieja'));
  // Centro Pokémon
  await d.exitTo('caudal_centro');
  const nurse = await d.eval(() => window.__e2e.eventPos('enfermera'));
  await d.useFrom(nurse.x, nurse.y, nurse.x, nurse.y + 2);
  await d.expectSaid(/Tus Pokémon se han recuperado/, 'la curación del Centro');
  await d.milestone('caudal_centro');
  await d.exitTo('ciudad_caudal');
  // Leandro en la Casa de las Esclusas
  await d.exitTo('caudal_esclusas');
  await d.talk('leandro');
  await d.expectSaid(/trescientos años llevando el río a mano/, 'Leandro');
  await d.milestone('leandro_casa_esclusas');
  await d.exitTo('ciudad_caudal');
  // Salida del bloque: el sendero de la ribera hacia la Ruta 3 (B04)
  const hasRuta3 = await d.eval(async () => Object.hasOwn((await import('/src/content/maps/index.js')).MAPS, 'ruta_3'));
  await d.walkTo(1, 4, { stopWhen: (s) => s.map !== 'ciudad_caudal' });
  if (hasRuta3) {
    if ((await d.snapState()).map !== 'ruta_3') await d.crossEdge('left', 'ruta_3');
    await d.milestone('salida_ruta_3', (s) => (s.map === 'ruta_3' ? null : `mapa ${s.map}`));
  } else {
    await d.step(4);
    await d.settle();
    await d.expectSaid(/Garganta del Albo/, 'el aviso del sendero cerrado');
    await d.milestone('salida_ruta_3_pendiente');
  }
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
  const d = new Driver(page, errors);
  const t0 = Date.now();
  let failed = null;
  try {
    const start = {
      zaguan: entryUrl('villa_zaguan', 19, 14, 4),
      ruta2: entryUrl('ruta_2', 14, 2, 2, ['b03_t01_jardinero', 'b03_t01_vista', 'b03_t01_tablilla', 'b03_lia_repartir']),
      caudal: entryUrl('ciudad_caudal', 31, 2, 2, ['b03_t01_tablilla', 'b03_lia_repartir']),
    }[FROM];
    if (!start) throw new Error(`--desde desconocido: ${FROM}`);
    await page.goto(start, { waitUntil: 'load' });
    await installHelpers(page);
    if (FROM === 'zaguan') await zaguan(d);
    if (FROM !== 'caudal') await ruta2(d);
    await caudal(d);
    const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
    if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
  } catch (err) {
    failed = err;
    await d.shot('fallo').catch(() => {});
  }
  const log = await d.log().catch(() => []);
  fs.writeFileSync(path.join(OUT, 'e2e_b03_dialogos.txt'), log.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  await browser.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d.milestones.join(' → ')} (${secs} s; ${log.length} diálogos en tools/cache/screens/e2e_b03_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 3 completo de principio a fin.');
  }
}

await main();
