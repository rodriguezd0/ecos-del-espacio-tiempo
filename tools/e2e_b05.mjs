// Recorrido E2E del Bloque 5 (docs/CAMPANA.md «B05 — Interludio 2») en navegador real (Chrome headless +
// playwright-core), con teclas reales y el estado de entrada preajustado por URL (P1 y P2 restaurados, Correr,
// 17 células, equipo de nivel ~26, Core acompañando):
//   T02 Molino del Diezmo: Anselmo → rueda pequeña (sacos) → desván (mediana) → canal alto por la cuesta de grava
//     MONTADO (grande) → colocar y girar las tres ruedas → echar el embrague → la muela muele a derechas y el eje se
//     abre → técnicos del Consorcio (2 combates) → Darío deja el Consorcio → Tabla Linfa.
//   Salida a Ciudad Caudal (B03) → Camino de la Vega → Ruta 4: vado abierto, C025 (la 18.ª: Embestida), roca de
//     tutorial → C026 y Heracrossita → subida a la meseta → Villa Brontia (escena de llegada, b05_brontia).
//   T03: Sixto (pista) → escombros de la escalera (Embestida) → campana grande → casa de Abril (su nota: antes del P3
//     acampa en el Anillo, B06) → subestación: un cortocircuito de prueba y el camino válido → posada: «Descansar»
//     hasta la noche → el rayo carga la red (farolas) → campanil: Tablilla, horda de Elekid, Tabla Trueno, Sixto toca
//     la campana (Raichuita X).
//   Molino atascado (Embestida → C027), vendaval de la bajada al cañón (Ruta 6 cerrada hasta P3) y, con P3, Abril ya
//   en su casa de Brontia.
// Uso: node tools/e2e_b05.mjs [--base=http://localhost:8080] [--headed]
// Capturas en tools/cache/screens/e2e_b05_<nn>_<hito>.png y transcripción e2e_b05_dialogos.txt. Sale con 1 si falla.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { installHelpers } from './e2e_b05_page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const BASE = (argv.find((a) => a.startsWith('--base=')) || '--base=http://localhost:8080').slice(7);
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
const KEY = { 2: 'ArrowDown', 4: 'ArrowLeft', 6: 'ArrowRight', 8: 'ArrowUp' };
const DIR = { down: 2, left: 4, right: 6, up: 8 };

/** Estado de entrada (CAMPANA B05: «Ruta 4 abierta»; nivel ~21–23). */
const ENTRY_FLAGS = ['prologue_seen', 'b01_left_town', 'p1_restored', 'zyg_10', 'b02_libreta', 'b03_anselmo_t02', 'p2_restored', 'verse_1', 'verse_2'];
const PARTY = 'GROTLE:27,STARAVIA:26,LUXIO:26,MONFERNO:26';
const COMMON = `&party=${PARTY}&core=1&zcores=1&noenc=1&time=10&debug`;
const ENTRY_URL = `${BASE}/?scene=map&map=molino_diezmo&x=7&y=10&dir=8&flags=${ENTRY_FLAGS.join(',')}&zygarde=run&zcells=17${COMMON}`;
/** Puntos de partida intermedios (--from=…) para depurar un tramo con el estado preajustado por URL. */
const T02_DONE = ['b05_t02_anselmo', 'b05_t02_engranaje_p', 'b05_t02_engranaje_m', 'b05_t02_engranaje_g', 'b05_t02_eje_abierto', 'b05_t02_tecnicos', 'b05_t02_dario', 'b05_t02_tablilla'];
const FROM = (argv.find((a) => a.startsWith('--from=')) || '--from=molino').slice(7);
const START = {
  molino: ENTRY_URL,
  ruta4: `${BASE}/?scene=map&map=ruta_4&x=1&y=14&dir=6&flags=${[...ENTRY_FLAGS, ...T02_DONE].join(',')}&zygarde=run&zcells=17${COMMON}`,
  brontia: `${BASE}/?scene=map&map=villa_brontia&x=3&y=19&dir=6&flags=${[...ENTRY_FLAGS, ...T02_DONE, 'b05_brontia'].join(',')}&zygarde=run,ram&zcells=20${COMMON}`,
};

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
    const file = path.join(OUT, `e2e_b05_${String(this.shots).padStart(2, '0')}_${name}.png`);
    await this.page.locator('#stage').screenshot({ path: file });
    console.log(`  captura → ${path.relative(ROOT, file)}`);
    return file;
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

  /**
   * Atiende mensajes (A), elecciones (`choose(s)` → índice; por defecto la primera salvo el mote), combates (piloto
   * automático) y fundidos hasta volver al mapa libre. `watch` = capturas al aparecer un texto o una escena.
   */
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
      if (s.top === 'MessageScene') { calm = 0; await this.press('KeyZ', 150); continue; }
      if (s.top === 'ChoiceScene') {
        calm = 0;
        if (!s.choiceReady) { await this.wait(100); continue; }
        await this.wait(120);
        const want = choose(s);
        for (let tries = 0; tries < 12; tries++) {
          const cur = (await this.snapState()).choiceIndex;
          if (cur === want) break;
          await this.press(cur < want ? 'ArrowDown' : 'ArrowUp', 140);
        }
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
    const key = KEY[dir];
    await this.page.keyboard.down(key);
    try {
      const end = Date.now() + 1500;
      while (Date.now() < end) {
        const s = await this.snapState();
        if (s.map !== before.map || s.x !== before.x || s.y !== before.y || s.busy || s.top !== 'MapScene') break;
        await this.wait(25);
      }
    } finally {
      await this.page.keyboard.up(key);
    }
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 4000, what: 'fin del paso' });
  }

  /** Camina hasta (x, y) por la ruta más corta atendiendo lo que salte por el camino. */
  async walkTo(x, y, { onto = true, face = null, maxSteps = 500, stopWhen = null, watch = [], choose = defaultChoice } = {}) {
    const startMap = (await this.snapState()).map;
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snapState();
      if (s.map !== startMap && s.ready) return s; // un warp (puerta, felpudo) ya nos ha llevado a otro mapa
      if (s.busy || s.top !== 'MapScene') {
        s = await this.settle({ watch, choose });
        const hp = await this.eval(() => window.__e2e.patchUp());
        if (hp !== null) console.log(`  (Superpoción: PS → ${hp})`);
      }
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

  async turn(dir) {
    const d = typeof dir === 'string' ? DIR[dir] : dir;
    const s = await this.snapState();
    if (s.dir === d) return;
    await this.press(KEY[d], 150);
    await this.until((st) => st.dir === d || st.busy, { timeout: 2000, what: 'girar' });
  }

  /** Se coloca en (x, y) mirando a `face`, pulsa A y atiende lo que salga. */
  async use(x, y, face, opts = {}) {
    await this.walkTo(x, y, { face, choose: opts.choose });
    for (let tries = 0; tries < 3; tries++) {
      await this.press('KeyZ', 200);
      const started = await this.until((s) => s.busy || s.top !== 'MapScene', { timeout: 1500, what: 'reacción al pulsar A' }).catch(() => null);
      if (started) break;
      await this.turn(face);
    }
    return this.settle(opts);
  }

  /** Pulsa hacia `dir` sobre un felpudo o puerta hasta cambiar al mapa `toMap`. */
  async pushInto(dir, toMap) {
    // Pulsos cortos: si la tecla siguiera pulsada al llegar, el jugador volvería a cruzar la puerta que tiene detrás
    // (p. ej. la llegada al canal alto está justo debajo de la puerta trasera del molino).
    for (let i = 0; i < 12; i++) {
      if ((await this.snapState()).map === toMap) break;
      await this.page.keyboard.down(KEY[DIR[dir]]);
      const end = Date.now() + 300;
      while (Date.now() < end) {
        const s = await this.snapState();
        if (s.map === toMap || s.top !== 'MapScene' || !s.ready) break;
        await this.wait(20);
      }
      await this.page.keyboard.up(KEY[DIR[dir]]);
      await this.wait(250);
      const s = await this.snapState();
      if (s.map === toMap) break;
    }
    await this.until((st) => st.map === toMap && st.ready, { timeout: 15000, what: `llegar a ${toMap}` });
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

  pos(id) { return this.eval((i) => window.__e2e.eventPos(i), id); }
}

/** Elección por defecto: «No» al mote; en todo lo demás, la primera opción. */
function defaultChoice(s) {
  if (/mote/i.test(s.lastText || '')) return 1;
  return 0;
}
const pick = (re) => (s) => Math.max(0, s.choiceItems.findIndex((i) => re.test(i)));

// ───────────────────────────── T02: el Molino del Diezmo ─────────────────────────────

async function molino(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'molino_diezmo' && s.ready, { timeout: 30000, what: 'molino_diezmo' });
  await d.eval(() => window.__e2e.engine.state.addItem('SUPERPOTION', 12));
  await d.settle({ watch: [{ re: /pesa como un río/, name: 't02_anselmo', delay: 200 }] });
  await d.expectSaid(/La muela del Diezmo pesa como un río/, 'la frase de Anselmo');
  await d.milestone('t02_llegada', (s) => (s.flags.b05_t02_anselmo && s.clues.some((c) => c.id === 'T02') ? null : 'sin Anselmo o sin pista T02'));
  // Rueda pequeña entre los sacos
  await d.use(2, 8, 'down');
  await d.expectSaid(/rueda dentada pequeña/, 'la rueda pequeña');
  // Desván: rueda mediana
  await d.walkTo(14, 4, { stopWhen: (s) => s.x >= 20 });
  await d.settle();
  const med = await d.pos('rueda_desvan');
  await d.use(med.x, med.y + 1, 'up');
  await d.expectSaid(/rueda dentada mediana/, 'la rueda mediana');
  // Canal alto por la puerta trasera del desván
  await d.walkTo(22, 4, { face: 'up' });
  await d.pushInto('up', 'caudal_canal_alto');
  await d.shot('canal_alto');
  await d.use(16, 7, 'up', { choose: pick(/^Sí$/) }); // cuesta de grava: montar en el 10 %
  const g = await d.snapState();
  if (!g.riding) console.log('  (aviso: no se detectó la montura; se intenta subir igualmente)');
  await d.walkTo(20, 3, { face: 'right' });
  await d.press('KeyZ', 400);
  await d.settle();
  await d.milestone('t02_rueda_grande', (s) => (s.flags.b05_t02_engranaje_g ? null : 'sin la rueda grande'));
  await d.walkTo(16, 7);
  await d.walkTo(4, 12);
  await d.pushInto('up', 'molino_diezmo');
  // Bajar al taller y montar el tren: pequeña (izquierdas), mediana (derechas), grande (izquierdas)
  await d.walkTo(27, 4, { stopWhen: (s) => s.x <= 14 });
  await d.settle();
  const choices = [
    [4, pick(/pequeña/)], [4, pick(/vuelta/)],
    [6, pick(/mediana/)],
    [8, pick(/grande/)], [8, pick(/vuelta/)],
  ];
  for (const [x, choose] of choices) await d.use(x, 5, 'up', { choose });
  await d.shot('t02_engranajes');
  await d.use(12, 7, 'up', { choose: pick(/^Sí$/), timeout: 400000, watch: [
    { re: /moler a derechas/, name: 't02_muela_gira', delay: 300 },
    { re: /Consorcio Meridiano de Estudios/, name: 't02_tecnicos', delay: 300 },
    { scene: 'BattleScene', name: 't02_combate', delay: 4000 },
  ] });
  await d.settle({ timeout: 400000 });
  await d.expectSaid(/Venimos a tomar muestras del eje/, 'la llegada de los técnicos');
  await d.expectSaid(/Parque Eólico/, 'el aviso de Darío');
  await d.milestone('t02_dario', (s) => (s.flags.b05_t02_tecnicos && s.flags.b05_t02_dario ? null : 'sin técnicos vencidos o sin Darío'));
  await d.use(8, 9, 'up');
  await d.milestone('t02_tabla_linfa', (s) => (s.flags.b05_t02_tablilla && s.tablets.includes('SPLASHPLATE') ? null : `tablillas ${s.tablets}`));
}

// ───────────────────────────── Caudal → Ruta 4 ─────────────────────────────

async function toRuta4(d) {
  await d.walkTo(8, 10, { face: 'down' });
  await d.pushInto('down', 'ciudad_caudal');
  let s = await d.snapState();
  const route = await d.eval(() => window.__e2e.route(63, 29));
  if (s.map === 'ciudad_caudal' && route) {
    await d.walkTo(63, 29);
    await d.crossEdge('right', 'ruta_4');
  } else {
    console.log('  (Ciudad Caudal no transitable todavía: se salta al Camino de la Vega por consola)');
    await d.eval(() => window.__e2e.transfer('ruta_4', 1, 14, 6));
    await d.until((st) => st.map === 'ruta_4' && st.ready, { what: 'ruta_4' });
    await d.settle();
  }
  s = await d.snapState();
  await d.milestone('ruta4_entrada', (st) => (st.map === 'ruta_4' ? null : `mapa ${st.map}`));
}

async function ruta4(d) {
  const watch = [{ scene: 'BattleScene', name: 'ruta4_combate', delay: 4000 }, { re: /Recuerdo cómo se abre paso/, name: 'ruta4_embestida', delay: 200 }];
  await d.walkTo(17, 14, { watch }); // al otro lado del vado
  await d.milestone('ruta4_vado', (s) => (s.x >= 16 ? null : 'no cruzó el vado'));
  await d.walkTo(56, 26, { watch, stopWhen: (s) => s.cells.includes('cell_ruta_4_1') });
  await d.settle({ watch });
  await d.expectSaid(/Recuerdo cómo se abre paso/, 'la escena de Embestida');
  await d.milestone('ruta4_c025_embestida', (s) => (s.ram && s.cells.includes('cell_ruta_4_1') ? null : `ram ${s.ram}, ${s.cells.length} células`));
  await d.use(69, 24, 'right', { choose: pick(/^Sí$/), watch });
  const broken = await d.eval(() => window.__e2e.selfSwitch('ruta_4', 'roca_tutorial'));
  await d.milestone('ruta4_roca', () => (broken ? null : 'la roca de tutorial sigue entera'));
  await d.walkTo(77, 27, { watch, stopWhen: (s) => s.cells.includes('cell_ruta_4_2') });
  await d.settle();
  await d.use(75, 24, 'up');
  await d.milestone('ruta4_c026_heracrossita', (s) => (s.cells.includes('cell_ruta_4_2') && s.items.HERACRONITE === 1 ? null : `células ${s.cells.length}, heracrossita ${s.items.HERACRONITE}`));
  await d.walkTo(79, 5, { watch });
  await d.crossEdge('right', 'villa_brontia');
  await d.walkTo(3, 19, { stopWhen: (s) => s.flags.b05_brontia });
  await d.settle({ watch: [{ re: /Bienvenido a Villa Brontia/, name: 'brontia_llegada', delay: 200 }] });
  await d.expectSaid(/mantenimiento/, 'el contrato del Consorcio');
  await d.milestone('brontia', (s) => (s.flags.b05_brontia ? null : 'sin b05_brontia'));
}

// ───────────────────────────── T03 en Villa Brontia ─────────────────────────────

async function enterTower(d) {
  await d.walkTo(25, 16, { face: 'up' });
  await d.pushInto('up', 'brontia_campanario');
}

async function t03Day(d) {
  await enterTower(d);
  await d.use(3, 7, 'up');
  await d.expectSaid(/Cada noche cae un rayo en el campanario, sin tormenta/, 'la pista de Sixto');
  await d.use(6, 4, 'right', { choose: pick(/^Sí$/) });
  await d.milestone('t03_escombros', (s) => (s.map === 'brontia_campanario' ? null : 'fuera del campanario'));
  await d.walkTo(8, 4, { stopWhen: (s) => s.x >= 12 });
  await d.settle();
  await d.use(15, 6, 'up');
  await d.milestone('t03_campana', (s) => (s.flags.b05_t03_campanil ? null : 'sin ver la campana'));
  await d.walkTo(17, 4, { stopWhen: (s) => s.x <= 9 });
  await d.settle();
  await d.walkTo(5, 10, { face: 'down' });
  await d.pushInto('down', 'villa_brontia');
  // Casa de Abril: antes del P3 acampa en el Anillo (B06) y solo está su nota; su segunda pista de T03 la da allí
  // o, tras el P3, en Brontia (se comprueba al final).
  await d.walkTo(30, 9, { face: 'up' });
  await d.pushInto('up', 'brontia_casa_abril');
  await d.use(2, 6, 'up');
  await d.expectSaid(/Me subo al Anillo/, 'la nota de Abril');
  await d.milestone('t03_casa_abril', (s) => (s.map === 'brontia_casa_abril' ? null : `mapa ${s.map}`));
  await d.walkTo(6, 9, { face: 'down' });
  await d.pushInto('down', 'villa_brontia');
}

async function substation(d) {
  await d.walkTo(37, 33, { face: 'up' });
  await d.pushInto('up', 'brontia_subestacion');
  await d.use(5, 8, 'left');
  // Prueba equivocada: J00→J01 (caja quemada) → salta el diferencial
  await d.walkTo(8, 5);
  await d.press('KeyZ', 300);
  await d.settle();
  await d.use(14, 5, 'up', { choose: pick(/Probar/) });
  await d.expectSaid(/Chispazo/, 'el cortocircuito');
  await d.shot('t03_cortocircuito');
  for (const [x, y] of [[7, 6], [8, 7], [9, 8], [10, 9]]) {
    await d.walkTo(x, y);
    await d.press('KeyZ', 300);
    await d.settle();
  }
  await d.shot('t03_circuito');
  await d.use(14, 5, 'up', { choose: pick(/Probar/) });
  await d.milestone('t03_linea', (s) => (s.flags.b05_t03_circuito ? null : 'la línea no quedó conectada'));
  await d.walkTo(9, 11, { face: 'down' });
  await d.pushInto('down', 'villa_brontia');
}

async function nightAndBell(d) {
  await d.walkTo(4, 31, { face: 'up' });
  await d.pushInto('up', 'brontia_posada');
  await d.use(4, 5, 'up', { choose: (s) => (s.choiceItems.includes('Noche') ? s.choiceItems.indexOf('Noche') : 0) });
  await d.milestone('t03_noche', (s) => (s.hour >= 20 || s.hour < 6 ? null : `hora ${s.hour}`));
  await d.walkTo(7, 10, { face: 'down' });
  await d.pushInto('down', 'villa_brontia');
  await d.settle({ watch: [{ re: /Ha sonado sola/, name: 't03_rayo', delay: 100 }] });
  await d.expectSaid(/Algo se ha soltado/, 'la reacción de Zygarde al rayo');
  await d.milestone('t03_luz', (s) => (s.flags.b05_t03_rayo && s.flags.b05_brontia_luz ? null : 'sin rayo o sin luz'));
  await enterTower(d);
  await d.walkTo(8, 4, { stopWhen: (s) => s.x >= 12 });
  await d.settle();
  await d.use(15, 8, 'up', { timeout: 500000, watch: [{ scene: 'BattleScene', name: 't03_horda', delay: 4000 }, { re: /Así suena Brontia/, name: 't03_sixto_campana', delay: 200 }] });
  await d.settle({ timeout: 300000 });
  await d.milestone('t03_tabla_trueno', (s) => (s.tablets.includes('ZAPPLATE') && s.flags.b05_t03_tablilla && s.items.RAICHUITEX === 1 ? null : `tablillas ${s.tablets}, raichuita ${s.items.RAICHUITEX}`));
  await d.walkTo(17, 4, { stopWhen: (s) => s.x <= 9 });
  await d.settle();
  await d.walkTo(5, 10, { face: 'down' });
  await d.pushInto('down', 'villa_brontia');
}

async function brontiaExtras(d) {
  await d.use(40, 11, 'up', { choose: pick(/^Sí$/) });
  await d.walkTo(39, 11, { stopWhen: (s) => s.cells.includes('cell_brontia_1') });
  await d.settle();
  await d.milestone('brontia_c027', (s) => (s.cells.includes('cell_brontia_1') ? null : 'sin C027'));
  await d.walkTo(21, 35, { face: 'down' });
  await d.step(2);
  await d.settle();
  await d.expectSaid(/vendaval sin rumbo/, 'el vendaval de la Ruta 6');
  await d.milestone('brontia_vendaval', (s) => (s.map === 'villa_brontia' && s.y <= 35 ? null : `pos ${s.x},${s.y}`));
  // Tras el P3 Abril «se queda en Brontia una temporada» (CAMPANA B06): de noche, en su casa.
  await d.eval(() => window.__e2e.engine.state.setFlag('p3_restored'));
  await d.walkTo(30, 9, { face: 'up' });
  await d.pushInto('up', 'brontia_casa_abril');
  await d.use(6, 7, 'right');
  await d.expectSaid(/tabla de piedra dentro de la campana/, 'Abril en Brontia tras el P3');
  await d.milestone('abril_tras_p3', (s) => (s.map === 'brontia_casa_abril' && s.flags.b05_t03_abril ? null : `mapa ${s.map}`));
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
    if (!START[FROM]) throw new Error(`--from desconocido: ${FROM} (${Object.keys(START).join(', ')})`);
    await page.goto(START[FROM], { waitUntil: 'load' });
    await installHelpers(page);
    if (FROM === 'molino') {
      await molino(d);
      await toRuta4(d);
    } else {
      await d.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'mapa inicial' });
      await d.eval(() => window.__e2e.engine.state.addItem('SUPERPOTION', 12));
      await d.settle();
    }
    if (FROM !== 'brontia') await ruta4(d);
    await t03Day(d);
    await substation(d);
    await nightAndBell(d);
    await brontiaExtras(d);
    const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
    if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
  } catch (err) {
    failed = err;
    await d.shot('fallo').catch(() => {});
  }
  const log = await d.log().catch(() => []);
  fs.writeFileSync(path.join(OUT, 'e2e_b05_dialogos.txt'), log.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  const battles = await d.eval(() => window.__e2e.battles).catch(() => []);
  await browser.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d.milestones.join(' → ')} (${secs} s; ${log.length} diálogos; ${battles.length} combates)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 5 completo de principio a fin.');
  }
}

await main();
