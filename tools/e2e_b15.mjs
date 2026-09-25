// Recorrido E2E del Bloque 15 — Interludio 7: el norte, Villa Boreal y el quinto núcleo (docs/CAMPANA.md B15) en
// navegador real (Chrome headless + playwright-core), con teclas reales. Estado de entrada por URL (ARCHITECTURE §9):
// P1–P7 restaurados (Fragmentos F01–F07), Forma 50 % con Correr, Embestida, Terreno, Trepar, Nadar, Detección y Buceo,
// 88 células, N1–N4, equipo alto y sin encuentros aleatorios.
//   ruta11   desvinculación (montañera y Snover) · C089 en la nieve honda · roca agrietada y C090 en la repisa
//   paso     llegada al collado · refugio (la guarda: «tres garras») · técnicos de Genesis del mirador
//   senda    una vuelta del lazo por una escalera falsa · pauta de los Larvitar hasta el mirador · Tyranitarita ·
//            tramo alto (bucle) · vuelta al Paso y subida a la Ruta 13
//   ruta13   llegada · C092 y C091 en la nieve honda
//   boreal   llegada (el niño y su Swinub) · Talleres del Hielo: Rosendo y Nieves (T13) · camino al Lago Viejo
//   lago     caída al agua a propósito (el lago se reinicia) · solución del solucionador (b15_lago_logic.js) · Tabla
//            Helada · Torre de Hielo · ceremonia y Froslassita
//   gael     Observatorio (directora) · terraza: Gael B5 (derrota simulada: la historia sigue), N5, «Gracias, Gael.» ·
//            C093 · llamada de Alerce al salir («Ese aro no es de ninguna tienda.»)
//   gruta    Gruta Escarcha: llegada y vuelta al pueblo
// Capturas en tools/cache/screens/e2e_b15_<nn>_<hito>.png y transcripción en e2e_b15_dialogos.txt.
// Uso: node tools/e2e_b15.mjs [--base=http://localhost:8080] [--headed] [--from=<tramo>] [--only=<tramo>] [--no-retry]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB15Helpers } from './e2e_b15_page.mjs';
import { RUTA11 } from '../game/src/content/maps/b15/layout_ruta11.js';
import { PASO, REFUGIO } from '../game/src/content/maps/b15/layout_paso.js';
import { SENDA, wrongTops, stairColumn, footRow } from '../game/src/content/maps/b15/layout_senda.js';
import { RUTA13 } from '../game/src/content/maps/b15/layout_ruta13.js';
import { BOREAL, OBSERVATORIO, TERRAZA, TALLERES } from '../game/src/content/maps/b15/layout_boreal.js';
import { LAGO, lakeToMap } from '../game/src/content/maps/b15/layout_lago.js';
import { ESCARCHA } from '../game/src/content/maps/b15/layout_escarcha.js';
import { LAKE, solveLake, runSteps, initialState } from '../game/src/content/events/b15_lago_logic.js';

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
const AVOID_SENDA = wrongTops().map((w) => `${w.x},${w.y}`);

/** Estado de entrada del bloque (CAMPANA B15 «Entrada: P7 restaurado»). */
const BASE_FLAGS = [
  'b01_woke', 'b01_met_mom', 'b01_lab_intro_seen', 'b01_starter_chosen', 'b01_signal_heard', 'b01_police_entered',
  'b01_core_found', 'b01_escorted', 'b01_gael_duel_done', 'b01_mom_gift', 'b01_dex_received', 'b01_left_town',
  'p1_restored', 'p2_restored', 'p3_restored', 'p4_restored', 'p5_restored', 'p6_restored', 'p7_restored',
  'zyg_10', 'zyg_50', 'zyg_core_2', 'zyg_core_3', 'zyg_core_4', 'zyg_dive', 'b07_megaring',
];
const STAGE_FLAGS = {
  paso: ['b15_desvinculacion', 'b15_r11_llegada'],
  senda: ['b15_paso_llegada'],
  ruta13: ['b15_senda_llegada', 'b15_senda_mirador'],
  boreal: ['b15_r13_llegada'],
  lago: ['b15_boreal_llegada', 'b15_t13_rosendo', 'b15_t13_nieves'],
  gael: ['b15_t13_lago_visto', 'b15_t13_bloque', 'b15_t13_tablilla', 'b15_torre', 'b15_froslassita'],
  gruta: ['b15_gael_visto', 'b15_gael_b5', 'b15_n5', 'zyg_core_5', 'b15_alerce_aro'],
};
const ORDER = ['ruta11', 'paso', 'senda', 'ruta13', 'boreal', 'lago', 'gael', 'gruta'];
const flagsUpTo = (stage) => ORDER.slice(0, ORDER.indexOf(stage) + 1).flatMap((s) => STAGE_FLAGS[s] || []);
const entry = (stage, over) => new URLSearchParams({
  scene: 'map', party: 'INFERNAPE:76,GARCHOMP:75,METAGROSS:75,LUCARIO:74', fragments: '7', noenc: '1', time: '11', core: '1',
  zygarde: 'run,ram,terrain,climb,swim,detect,dive', zcells: '88', zcores: '4', vars: 'starter:TURTWIG,gael_starter:LITTEN', ...over,
  flags: [...BASE_FLAGS, ...flagsUpTo(stage), ...(over?.flags ? [over.flags] : [])].join(','),
});
const STARTS = {
  ruta11: entry('ruta11', { map: 'ruta_11', x: String(RUTA11.start.x), y: String(RUTA11.start.y), dir: '8' }),
  paso: entry('paso', { map: 'paso_del_norte', x: '14', y: String(PASO.south.y), dir: '8' }),
  senda: entry('senda', { map: 'ruta_12_senda_lazo', x: String(SENDA.east.x), y: '41', dir: '4' }),
  ruta13: entry('ruta13', { map: 'ruta_13', x: '14', y: String(RUTA13.south.y), dir: '8' }),
  boreal: entry('boreal', { map: 'villa_boreal', x: '21', y: String(BOREAL.south.y), dir: '8' }),
  lago: entry('lago', { map: 'boreal_lago', x: String(LAGO.entry.x), y: String(LAGO.entry.y), dir: '6' }),
  gael: entry('gael', { map: 'villa_boreal', x: String(BOREAL.flyPoint.x), y: String(BOREAL.flyPoint.y), dir: '8', time: '21' }),
  gruta: entry('gruta', { map: 'villa_boreal', x: '38', y: '17', dir: '6', zcores: '5' }),
};
/** Tramos que necesitan su propia URL aunque se venga del anterior. */
const FRESH = new Set(['gruta']);
const FROM = arg('from', 'ruta11');
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

  eval(fn, a) { return this.page.evaluate(fn, a); }
  wait(ms) { return this.page.waitForTimeout(ms); }
  snapState() {
    return this.eval(() => ({
      ...window.__e2e.snap(),
      vars: window.__b15.vars(),
      tablets: window.__b15.tablets(),
      lost: window.__b15.lost.slice(),
      choices: window.__b15.choiceItems(),
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
    const file = path.join(OUT, `e2e_b15_${String(this.shots).padStart(2, '0')}_${name}.png`);
    await this.page.locator('#stage').screenshot({ path: file });
    console.log(`  captura → ${path.relative(ROOT, file)}`);
    return file;
  }

  async milestone(name, check) {
    const s = await this.snapState();
    const problem = check ? check(s) : null;
    if (problem) throw new Error(`Hito «${name}»: ${problem}\nestado: ${JSON.stringify({ ...s, flags: Object.keys(s.flags).filter((k) => k.startsWith('b15')) })}`);
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

  /** Atiende mensajes, elecciones y combates hasta que el mapa queda libre. */
  async settle({ timeout = 240000, choose = () => 0, watch = [] } = {}) {
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
        const want = /mote/i.test(s.lastText || '') ? Math.max(0, s.choices.indexOf('No')) : choose(s);
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
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 6000, what: 'fin del paso' });
  }

  async turn(dir) {
    const d = typeof dir === 'string' ? DIR[dir] : dir;
    const s = await this.snapState();
    if (s.dir === d) return;
    await this.press(KEY[d], 150);
    await this.until((st) => st.dir === d || st.busy, { timeout: 2000, what: 'girar' });
  }

  /** Camina hasta (x, y) (o a su lado con onto: false), evitando `avoid`; `face` gira al final. */
  async walkTo(x, y, { onto = true, face = null, maxSteps = 600, stopWhen = null, watch = [], avoid = null } = {}) {
    const startMap = (await this.snapState()).map;
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') s = await this.settle({ watch });
      if (stopWhen && stopWhen(s)) return s;
      if (s.map !== startMap) return s; // un paso de más cruzó un borde o una puerta: lo resuelve quien llama
      const done = onto ? s.x === x && s.y === y : Math.abs(s.x - x) + Math.abs(s.y - y) === 1;
      if (done) {
        if (face) await this.turn(face);
        return s;
      }
      const route = avoid
        ? await this.eval(([tx, ty, o, a]) => window.__b15.routeAvoid(tx, ty, a, { onto: o }), [x, y, onto, avoid])
        : await this.eval(([tx, ty, o]) => window.__e2e.route(tx, ty, { onto: o }), [x, y, onto]);
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
      if ((await this.snapState()).map === toMap) return this.settle();
      await this.step(DIR[dir]);
      const s = await this.snapState();
      if (s.map === toMap) return this.settle();
      if (s.busy || s.top !== 'MapScene') await this.settle();
    }
    throw new Error(`No se cruzó a ${toMap}`);
  }

  /** Salir por un felpudo o una puerta empujando hacia `dir` hasta cambiar de mapa. */
  async exitTo(dir, toMap, opts = {}) {
    for (let i = 0; i < 6; i++) {
      await this.page.keyboard.down(KEY[DIR[dir]]);
      await this.wait(350);
      await this.page.keyboard.up(KEY[DIR[dir]]);
      await this.wait(250);
      const s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') await this.settle(opts);
      if ((await this.snapState()).map === toMap) return this.settle(opts);
    }
    throw new Error(`No se salió hacia ${toMap}`);
  }

  /** Entrenador: ponerse delante (si no ha saltado ya al verte) y combatir. */
  async fightTrainer(mapId, id, stand, face) {
    const beaten = () => this.eval(([m, e]) => window.__b15.selfSwitch(m, e), [mapId, id]);
    await this.walkTo(stand[0], stand[1], { face });
    if (!(await beaten())) await this.interact({ watch: [{ scene: 'BattleScene', name: id, delay: 3000 }] });
    if (!(await beaten())) throw new Error(`${id} no ha sido derrotado`);
  }

  async goto(url) {
    await this.page.goto(url, { waitUntil: 'load' });
    await installHelpers(this.page);
    await installB15Helpers(this.page, { loseOnce: RETRY ? ['b15_gael_b5'] : [] });
    await this.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'el mapa de arranque' });
    await this.settle();
  }
}

const has = (s, f) => Boolean(s.flags[f]);
const need = (ok, msg) => (ok ? null : msg);

// ───────────────────────────── Tramos ─────────────────────────────

async function ruta11(d) {
  await d.milestone('r11_llegada', (s) => need(s.map === 'ruta_11', `mapa ${s.map}`));
  const T = RUTA11.unbound.trigger;
  await d.walkTo(14, T.y - 1, { watch: [{ re: /Me mira como si no me hubiera visto nunca/, name: 'desvinculacion', delay: 200 }] });
  await d.expectSaid(/¡Escarcha!/, 'la llamada de la montañera');
  await d.milestone('desvinculacion', (s) => need(has(s, 'b15_desvinculacion') && has(s, 'b15_r11_llegada'), 'sin la desvinculación'));
  const C = RUTA11.cells;
  await d.walkTo(C.c089.x, C.c089.y);
  await d.settle();
  await d.milestone('c089', (s) => need(s.cells.includes('cell_ruta_11_1'), 'sin C089'));
  const L = RUTA11.ledge;
  await d.walkTo(L.rock.x, L.rock.y + 1, { face: 'up' });
  await d.interact();
  await d.walkTo(C.c090.x, C.c090.y);
  await d.settle();
  await d.milestone('c090', (s) => need(s.cells.includes('cell_ruta_11_2'), 'sin C090'));
  await d.walkTo(14, 0);
  await d.crossEdge('up', 'paso_del_norte');
}

async function paso(d) {
  await d.walkTo(14, PASO.arrival.y - 1);
  await d.expectSaid(/columna de luz clavada sobre la Cumbre Azur/, 'la llegada al collado');
  await d.milestone('paso_llegada', (s) => need(has(s, 'b15_paso_llegada'), 'sin llegada'));
  const door = PASO.refugio.door;
  await d.walkTo(door.x, door.y + 1, { face: 'up' });
  await d.exitTo('up', 'paso_refugio');
  const G = REFUGIO.guarda;
  await d.walkTo(G.x, G.y + 1, { face: 'up' });
  await d.interact();
  await d.expectSaid(/Tres garras/, 'la pista de la guarda');
  await d.milestone('refugio', (s) => need(has(s, 'b15_refugio_pista'), 'sin la pista del refugio'));
  await d.walkTo(REFUGIO.entry.x, REFUGIO.entry.y);
  await d.exitTo('down', 'paso_del_norte');
  const T = PASO.tecnicos;
  await d.fightTrainer('paso_del_norte', 'tecnico_paso', [T.german.x, T.german.y + 1], 'up');
  await d.fightTrainer('paso_del_norte', 'tecnica_paso', [T.candela.x - 1, T.candela.y], 'right');
  await d.milestone('tecnicos_genesis');
  await d.walkTo(0, PASO.west.y0 + 1);
  await d.crossEdge('left', 'ruta_12_senda_lazo');
}

async function senda(d) {
  await d.walkTo(SENDA.east.x - 3, 41);
  await d.expectSaid(/La Senda del Lazo sube por la ladera/, 'la llegada a la Senda');
  // Una escalera falsa de la primera cara: al coronarla, el lazo devuelve al principio.
  const x = stairColumn(0, 'O');
  await d.walkTo(x, footRow(0), { avoid: AVOID_SENDA });
  const L = SENDA.loopStart;
  for (let i = 0; i < 8; i++) {
    const s = await d.snapState();
    if (s.x === L.x && s.y === L.y) break;
    await d.step(8);
    await d.settle({ watch: [{ re: /el aire se dobla/, name: 'senda_lazo', delay: 150 }] });
  }
  await d.expectSaid(/estás otra vez junto a la piedra de los pastores/, 'la vuelta al principio');
  await d.milestone('senda_vuelta', (s) => need(Number(s.vars.b15_senda_vueltas) >= 1 && s.x === L.x && s.y === L.y, `vueltas ${s.vars.b15_senda_vueltas} en (${s.x},${s.y})`));
  // La pauta de los Larvitar: ninguna escalera falsa hasta el mirador.
  const M = SENDA.mirador;
  await d.walkTo(M.stone.x, M.stone.y + 1, { face: 'up', avoid: AVOID_SENDA });
  await d.expectSaid(/Lo has encontrado siguiendo a los pequeños/, 'el mirador');
  await d.interact();
  const tyr = await d.eval(() => window.__b15.items('TYRANITARITE'));
  await d.milestone('senda_mirador', (s) => need(has(s, 'b15_senda_mirador') && tyr === 1, `mirador ${has(s, 'b15_senda_mirador')}, Tyranitarita ${tyr}`));
  // El tramo alto: un bucle que aún no se rompe.
  await d.walkTo(SENDA.high.back.x, SENDA.high.y + 1, { avoid: AVOID_SENDA });
  await d.step(8);
  await d.settle({ watch: [{ re: /el camino se pierde entre las nubes/, name: 'senda_alto', delay: 150 }] });
  await d.expectSaid(/como si no hubieras dado un paso/, 'la vuelta del tramo alto');
  await d.milestone('senda_alto', (s) => need(has(s, 'b15_senda_alto'), 'sin el tramo alto'));
  await d.walkTo(SENDA.east.x, 41, { avoid: AVOID_SENDA });
  await d.crossEdge('right', 'paso_del_norte');
  await d.walkTo(14, 0);
  await d.crossEdge('up', 'ruta_13');
}

async function ruta13(d) {
  await d.walkTo(14, RUTA13.arrival.y - 1);
  await d.settle();
  await d.milestone('r13_llegada', (s) => need(has(s, 'b15_r13_llegada'), 'sin llegada a la Ruta 13'));
  for (const [k, id] of [['c092', 'cell_ruta_13_2'], ['c091', 'cell_ruta_13_1']]) {
    const c = RUTA13.cells[k];
    await d.walkTo(c.x, c.y);
    await d.settle();
    await d.milestone(k, (s) => need(s.cells.includes(id), `sin ${k}`));
  }
  await d.walkTo(14, 0);
  await d.crossEdge('up', 'villa_boreal');
}

async function boreal(d) {
  await d.walkTo(21, BOREAL.npcs.llegada.y - 2, { watch: [{ re: /¡Bolita!/, name: 'boreal_bolita', delay: 200 }] });
  await d.expectSaid(/Desde hace días ni me mira/, 'el niño y su Swinub');
  await d.milestone('boreal_llegada', (s) => need(has(s, 'b15_boreal_llegada'), 'sin llegada a Villa Boreal'));
  const door = BOREAL.buildings.talleres.door;
  await d.walkTo(door.x, door.y + 1, { face: 'up' });
  await d.exitTo('up', 'boreal_talleres');
  const T = TALLERES;
  await d.walkTo(T.rosendo.x + 1, T.rosendo.y, { face: 'left' });
  await d.interact();
  await d.expectSaid(/no lo reconocí/, 'la historia de Rosendo');
  await d.walkTo(T.nieves.x - 1, T.nieves.y, { face: 'right' });
  await d.interact();
  await d.milestone('t13_nieves', (s) => need(has(s, 'b15_t13_rosendo') && has(s, 'b15_t13_nieves'), 'Nieves no va al lago'));
  await d.walkTo(T.entry.x, T.entry.y);
  await d.exitTo('down', 'villa_boreal');
  await d.walkTo(BOREAL.lakeExit.x, BOREAL.lakeExit.y0 + 1);
  await d.exitTo('right', 'boreal_lago');
}

/** Ejecuta un paso del solucionador del lago y comprueba la casilla con las reglas puras. */
async function lakeStep(d, st, expect) {
  if (st.act === 'mover') {
    await d.step(st.dir);
    await d.settle();
  } else {
    await d.turn(st.dir);
    await d.interact({ watch: st.act === 'sacar' ? [
      { re: /¡Una tabla!/, name: 't13_tabla', delay: 200 },
      { re: /Esta sí\. Esta la conozco\./, name: 'ceremonia_torre', delay: 200 },
    ] : [] });
  }
  if (!expect) return;
  const s = await d.snapState();
  if (s.map === 'boreal_lago' && (s.x !== expect[0] || s.y !== expect[1])) {
    throw new Error(`Lago: tras ${st.act} ${st.dir} en (${s.x},${s.y}), se esperaba (${expect})`);
  }
}

async function lago(d) {
  const start = lakeToMap(initialState(LAKE).x, initialState(LAKE).y);
  await d.walkTo(start[0], start[1]);
  await d.expectSaid(/Este es el Lago Viejo/, 'Nieves en el lago');
  // A propósito: subir, bajar y volver a subir por la misma columna hunde la placa (tercera pasada).
  for (const dir of [8, 2, 8]) await lakeStep(d, { act: 'mover', dir });
  await d.expectSaid(/La placa cede bajo tus pies/, 'la caída al agua');
  await d.milestone('lago_caida', (s) => need(Number(s.vars.b15_lago_caidas) >= 1 && s.x === LAGO.respawn.x && s.y === LAGO.respawn.y, `caídas ${s.vars.b15_lago_caidas} en (${s.x},${s.y})`));
  await d.walkTo(start[0], start[1]);
  const { steps } = solveLake();
  if (!steps) throw new Error('El lago no tiene solución');
  for (let i = 0; i < steps.length; i++) {
    const st = runSteps(LAKE, steps.slice(0, i + 1));
    await lakeStep(d, steps[i], steps[i].act === 'sacar' ? null : lakeToMap(st.x, st.y));
  }
  const froslass = await d.eval(() => window.__b15.items('FROSLASSITE'));
  await d.milestone('t13_resuelto', (s) => {
    if (!s.tablets.includes('ICICLEPLATE')) return `sin Tabla Helada (${s.tablets})`;
    if (!has(s, 'b15_torre') || !has(s, 'b15_froslassita') || froslass !== 1) return `Torre ${has(s, 'b15_torre')}, Froslassita ${froslass}`;
    return need(s.map === 'villa_boreal', `mapa ${s.map}`);
  });
}

async function gael(d) {
  const door = BOREAL.buildings.observatorio.door;
  await d.walkTo(door.x, door.y + 1, { face: 'up' });
  await d.exitTo('up', 'boreal_observatorio');
  const O = OBSERVATORIO;
  await d.walkTo(O.directora.x, O.directora.y + 1, { face: 'up' });
  await d.interact();
  await d.expectSaid(/Fundación Meridiano/, 'la directora del Observatorio');
  await d.walkTo(O.stairs.x - 1, O.stairs.y);
  const watch = [
    { re: /Si me ganas, es tuyo/, name: 'gael_reto', delay: 150 },
    { scene: 'BattleScene', name: 'gael_b5', delay: 4000 },
    { re: /A mí no me habla/, name: 'gael_n5', delay: 150 },
  ];
  await d.exitTo('right', 'boreal_observatorio_terraza', { watch });
  await d.settle({ watch });
  await d.expectSaid(/Si me ganas, es tuyo\. Si no… también\. Pero quiero saberlo\./, 'el reto de Gael');
  await d.expectSaid(/A mí no me habla\. Nunca me ha hablado\./, 'la frase de Gael');
  await d.expectSaid(/^Gracias, Gael\.$/, 'las gracias de Zygarde');
  const cores = await d.eval(() => window.__b15.cores());
  await d.milestone('n5', (s) => {
    if (!has(s, 'b15_n5') || !has(s, 'zyg_core_5') || !cores.includes('N5')) return `N5 ${cores}`;
    return need(!RETRY || s.lost.includes('b15_gael_b5'), 'no se simuló la derrota');
  });
  await d.walkTo(TERRAZA.cell.x, TERRAZA.cell.y);
  await d.settle();
  await d.milestone('c093', (s) => need(s.cells.includes('cell_boreal_1'), 'sin C093'));
  await d.walkTo(TERRAZA.stairs.x, TERRAZA.stairs.y - 1);
  await d.exitTo('down', 'boreal_observatorio');
  await d.walkTo(O.entry.x, O.entry.y);
  await d.exitTo('down', 'villa_boreal', { watch: [{ re: /Ese aro no es de ninguna tienda/, name: 'alerce_aro', delay: 150 }] });
  await d.expectSaid(/^Ese aro no es de ninguna tienda\.$/, 'la llamada de Alerce');
  await d.milestone('alerce', (s) => need(has(s, 'b15_alerce_aro'), 'sin la llamada de Alerce'));
}

async function gruta(d) {
  await d.walkTo(BOREAL.cave.arrival.x, BOREAL.cave.arrival.y, { face: 'right' });
  await d.exitTo('right', 'gruta_escarcha');
  await d.walkTo(ESCARCHA.entry.x, ESCARCHA.entry.y - 1);
  await d.settle();
  await d.expectSaid(/huele a hielo limpio/, 'la llegada a la Gruta Escarcha');
  await d.milestone('gruta_escarcha', (s) => need(has(s, 'b15_escarcha_llegada'), 'sin llegada'));
  await d.walkTo(ESCARCHA.entry.x, ESCARCHA.exit.y);
  await d.exitTo('down', 'villa_boreal');
  await d.milestone('gruta_vuelta', (s) => need(s.map === 'villa_boreal', `mapa ${s.map}`));
}

const STAGES = { ruta11, paso, senda, ruta13, boreal, lago, gael, gruta };

// ───────────────────────────── Principal ─────────────────────────────

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME, headless: !argv.includes('--headed'),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
  const t0 = Date.now();
  let failed = null;
  let d = null;
  const transcript = [];
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();
    page.on('pageerror', (err) => errors.push(`[pageerror] ${err.stack || err.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[error] ${msg.text()}`); });
    page.on('response', (res) => { if (res.status() >= 400) errors.push(`[http ${res.status()}] ${res.url()}`); });
    d = new Driver(page, errors);
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
    transcript.push(...(await d.log().catch(() => [])));
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'e2e_b15_dialogos.txt'), transcript.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d?.milestones.join(' → ')} (${secs} s; ${transcript.length} diálogos en tools/cache/screens/e2e_b15_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 15 completo de principio a fin.');
  }
}

await main();
