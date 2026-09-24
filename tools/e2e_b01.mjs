// Recorrido E2E COMPLETO del Bloque 1 en navegador real (Chrome headless + playwright-core), como un jugador:
//   título → Nueva partida → prólogo (se salta con START marcando «prólogo visto»; --prologue lo ve acelerado)
//   → «¿Quién eres?» (chico, nombre) → despertar → Mamá → laboratorio → inicial → la señal → el agente entra
//   → sigilo en el Laberinto (reintenta si te ven: tras 3 detecciones la patrulla se acorta) → el Core →
//   escolta → combate con Gael (piloto automático) → Pokédex → C001 en el parterre → salida del pueblo →
//   Ruta 1 (topógrafos, entrenadores con piloto automático, C002–C005) → cartel del Pilar del Umbral.
// Todo con teclas reales (los disparadores de contacto necesitan pasos del jugador); nada de teletransportes.
// Cada escena se comprueba por su efecto (flags) y por su texto en la transcripción de diálogos.
// Uso: node tools/e2e_b01.mjs [--base=http://localhost:8080] [--prologue] [--headed]
// Capturas en tools/cache/screens/e2e_b01_<nn>_<hito>.png. Sale con código 1 si algo falla.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { installHelpers } from './e2e_b01_page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const BASE = (argv.find((a) => a.startsWith('--base=')) || '--base=http://localhost:8080').slice(7);
const WATCH_PROLOGUE = argv.includes('--prologue');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
const KEY = { 2: 'ArrowDown', 4: 'ArrowLeft', 6: 'ArrowRight', 8: 'ArrowUp' };
const DIR = { down: 2, left: 4, right: 6, up: 8 };
const PLAYER_NAME = 'Prueba';

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
    const file = path.join(OUT, `e2e_b01_${String(this.shots).padStart(2, '0')}_${name}.png`);
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

  /** Transcripción de diálogos desde el inicio (texto y hablante). */
  log() { return this.eval(() => window.__e2e.log.slice()); }

  async expectSaid(re, what) {
    const log = await this.log();
    if (!log.some((l) => re.test(l.text))) throw new Error(`No se dijo ${what} (${re})\nÚltimos: ${log.slice(-8).map((l) => `${l.speaker}: ${l.text}`).join(' | ')}`);
  }

  /**
   * Atiende lo que interrumpe al jugador hasta volver al mapa libre: mensajes (A), elecciones (la opción por
   * defecto salvo reglas), combates (piloto automático), fundidos y cambios de mapa.
   */
  async settle({ timeout = 240000, choose = defaultChoice, watch = [] } = {}) {
    const end = Date.now() + timeout;
    let calm = 0;
    while (Date.now() < end) {
      let s = await this.snapState();
      // Capturas en mitad de escenas largas: al aparecer un texto o una escena concreta (una vez cada una;
      // los objetos de `watch` guardan `done`, así sirven entre varias llamadas).
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
      if (s.top === 'NamingScene') { calm = 0; await this.press('Enter', 300); continue; }
      if (s.top === 'MapScene' && s.ready && !s.busy && !s.playerBusy) {
        calm += 1;
        if (calm >= 4) return s;
      } else calm = 0;
      await this.wait(150);
    }
    throw new Error(`settle: el mapa no queda libre\n${JSON.stringify(await this.snapState())}`);
  }

  /** Un paso en `dir` (gira si hace falta). Devuelve el estado tras el paso o null si algo lo interrumpió. */
  async step(dir) {
    const before = await this.snapState();
    const key = KEY[dir];
    await this.page.keyboard.down(key);
    let moved = false;
    try {
      const end = Date.now() + 1500;
      while (Date.now() < end) {
        const s = await this.snapState();
        if (s.map !== before.map || s.x !== before.x || s.y !== before.y || s.busy || s.top !== 'MapScene') { moved = true; break; }
        await this.wait(25);
      }
    } finally {
      await this.page.keyboard.up(key);
    }
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 4000, what: 'fin del paso' });
    return moved;
  }

  /**
   * Camina hasta (x, y) del mapa actual con la ruta más corta (evitando hierba alta). Atiende las escenas
   * que salten por el camino y recalcula. `onto: false` para quedarse al lado; `face` para mirar al final.
   */
  async walkTo(x, y, { onto = true, face = null, maxSteps = 400, stopWhen = null, watch = [] } = {}) {
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snapState();
      const mapBefore = s.map;
      if (s.busy || s.top !== 'MapScene') {
        s = await this.settle({ watch });
        // Tras un combate, como un jugador: Poción de la Mochila si el primer Pokémon va tocado.
        const hp = await this.eval(() => window.__e2e.usePotionIfLow());
        if (hp !== null) console.log(`  (Poción de la Mochila: PS → ${hp})`);
      }
      if (stopWhen && stopWhen(s)) return s;
      if (s.map !== mapBefore && (await this.log()).some((l) => /No te quedan Pokémon en condiciones/.test(l.text))) {
        throw new Error(`Derrota: el jugador vuelve a ${s.map} (punto de cura)`);
      }
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

  /** Sale por un warp hacia `toMap` (puerta o felpudo con dirección). */
  async exitTo(toMap) {
    const warp = await this.eval((to) => window.__e2e.warpTo(to), toMap);
    if (!warp) throw new Error(`No hay salida hacia ${toMap}`);
    await this.walkTo(warp.x, warp.y, { stopWhen: (s) => s.map === toMap });
    let s = await this.snapState();
    if (s.map !== toMap && warp.dirTrigger) {
      await this.page.keyboard.down(KEY[warp.dirTrigger]);
      await this.wait(300);
      await this.page.keyboard.up(KEY[warp.dirTrigger]);
    }
    s = await this.until((st) => st.map === toMap && st.ready, { timeout: 15000, what: `llegar a ${toMap}` });
    return s;
  }

  /** Cruza el borde del mapa por una conexión (sin fundido): de pie en el borde, pulsa hacia fuera. */
  async crossEdge(dir, toMap) {
    const d = DIR[dir];
    for (let i = 0; i < 6; i++) {
      await this.step(d);
      const s = await this.snapState();
      if (s.map === toMap) return s;
      if (s.busy || s.top !== 'MapScene') await this.settle();
    }
    throw new Error(`No se cruzó a ${toMap}`);
  }
}

/** Elección por defecto: «No» al mote; en todo lo demás, la primera opción. */
function defaultChoice(s) {
  if (/mote/i.test(s.lastText || '')) return 1;
  return 0;
}

// ───────────────────────────── Recorrido ─────────────────────────────

async function titleToBedroom(d) {
  await d.until((s) => s.top === 'TitleScene', { what: 'pantalla de título' });
  await d.wait(800);
  await d.shot('titulo');
  await d.press('KeyZ', 700); // Pulsa A
  await d.until((s) => s.titleStage === 'menu', { what: 'menú del título' });
  const idx = await d.eval(() => window.__e2e.titleNewIndex());
  const cur = await d.eval(() => window.__e2e.titleIndex());
  for (let i = cur; i < idx; i++) await d.press('ArrowDown', 150);
  await d.press('KeyZ', 1200); // Nueva partida
  if (WATCH_PROLOGUE) {
    await d.page.keyboard.down('KeyZ'); // A acelera ×3
    await d.until((s) => s.top === 'IdentityScene', { timeout: 240000, what: 'fin del prólogo (acelerado)' });
    await d.page.keyboard.up('KeyZ');
  } else {
    await d.until((s) => s.top === 'CineOverlay', { timeout: 30000, what: 'prólogo en marcha' });
    await d.wait(1500);
    await d.shot('prologo');
    await d.press('KeyC', 600); // START: saltar (prólogo ya visto)
    await d.until((s) => s.top === 'IdentityScene', { timeout: 30000, what: '«¿Quién eres?»' });
  }
  await d.wait(700);
  await d.shot('quien_eres');
  await d.press('KeyZ', 600); // Chico
  await d.until((s) => s.top === 'ChoiceScene', { what: '¿Eres un chico?' });
  await d.press('KeyZ', 900); // Sí
  await d.until((s) => s.top === 'NamingScene', { what: 'pantalla de nombre' });
  await d.wait(500);
  await d.page.keyboard.type(PLAYER_NAME, { delay: 90 });
  await d.wait(300);
  await d.shot('nombre');
  await d.press('Enter', 900);
  await d.until((s) => s.top === 'ChoiceScene', { what: 'confirmar nombre' });
  await d.press('KeyZ', 900); // Sí
  await d.until((s) => s.top === 'MapScene' && s.map === 'casa_prota_2f' && s.ready, { timeout: 30000, what: 'la habitación' });
  await d.settle();
}

async function home(d) {
  await d.milestone('despertar', (s) => (s.flags.b01_woke ? null : 'sin b01_woke') || (s.playerName === PLAYER_NAME ? null : `nombre ${s.playerName}`));
  await d.exitTo('casa_prota_1f');
  await d.settle();
  await d.expectSaid(/te espera en el laboratorio/, 'el aviso de Mamá');
  await d.milestone('mama', (s) => (s.flags.b01_met_mom ? null : 'sin b01_met_mom'));
  await d.exitTo('villa_alba');
  await d.settle();
}

async function lab(d) {
  await d.exitTo('laboratorio_alerce');
  await d.settle();
  await d.expectSaid(/Llegas tarde/, 'el saludo de Gael');
  await d.milestone('laboratorio', (s) => (s.flags.b01_lab_intro_seen ? null : 'sin presentación'));
  const ball = await d.eval(() => window.__e2e.eventPos('bola_TURTWIG'));
  await d.walkTo(ball.x, ball.y + 2, { face: 'up' });
  await d.press('KeyZ', 600);
  await d.settle();
  await d.expectSaid(/Entonces yo me quedo con este/, 'la elección de Gael');
  await d.milestone('inicial', (s) => (s.flags.b01_starter_chosen && s.party[0] === 'TURTWIG' ? null : `equipo ${s.party}`));
  await d.exitTo('villa_alba');
  await d.settle();
  await d.expectSaid(/pitido que no termina de ser un grito/, 'la señal');
  await d.milestone('senal', (s) => (s.flags.b01_signal_heard ? null : 'sin b01_signal_heard'));
}

async function northAndCore(d) {
  const strip = await d.eval(() => window.__e2e.eventPos('escena_policia_22'));
  await d.walkTo(strip.x, strip.y, { stopWhen: (s) => s.flags.b01_police_entered });
  await d.settle();
  await d.expectSaid(/Voy a echar un vistazo/, 'el agente Olmedo');
  await d.milestone('agente_entra', (s) => (s.flags.b01_police_entered ? null : 'sin b01_police_entered'));
  await d.walkTo(22, 0);
  await d.crossEdge('up', 'laberinto_profundidad');
  await d.settle();
  await d.shot('laberinto');
  const door = await d.eval(() => window.__e2e.eventPos('camara_entrada_19'));
  const watch = [
    { re: /¿Qué te he dicho\?/, name: 'sigilo_detectado' },
    { re: /^Puedes oírme\.$/, name: 'core', delay: 400 },
    { re: /¿Qué es eso\?/, name: 'agente_y_core', delay: 400 },
    { re: /Un núcleo/, name: 'regreso_lab', delay: 400 },
    { scene: 'BattleScene', name: 'combate_gael', delay: 4500 },
  ];
  for (let attempt = 0; attempt < 8; attempt++) {
    const s = await d.walkTo(door.x, door.y, { watch, stopWhen: (st) => st.flags.b01_core_found || st.map !== 'laberinto_profundidad' });
    if (s.flags.b01_core_found || s.map !== 'laberinto_profundidad') break;
    await d.settle({ watch });
  }
  await d.settle({ timeout: 240000, watch }); // Core, agente, escolta, regreso y combate con Gael
  const log = await d.log();
  const caught = log.filter((l) => /¿Qué te he dicho\?/.test(l.text)).length;
  console.log(`  (sigilo: ${caught} detección(es))`);
  await d.expectSaid(/Puedes oírme/, 'el Core');
  await d.expectSaid(/Un núcleo/, 'Alerce ante el núcleo');
  await d.expectSaid(/combate conmigo/, 'el reto de Gael');
  await d.milestone('core_y_duelo', (s) => (s.flags.b01_core_found && s.flags.b01_escorted && s.flags.b01_gael_duel_done ? null : 'faltan flags del Core o del duelo'));
  await d.expectSaid(/Pokédex/, 'la entrega de la Pokédex');
  await d.milestone('pokedex', (s) => (s.flags.b01_dex_received && s.hasDex && s.balls >= 5 ? null : `dex ${s.hasDex} balls ${s.balls}`));
}

async function leaveTown(d) {
  await d.exitTo('villa_alba');
  await d.settle({ watch: [{ re: /^Aquí\. Una parte de mí\.$/, name: 'c001_core_senala', delay: 300 }] });
  await d.expectSaid(/Aquí\. Una parte de mí\./, 'la escena de C001');
  await d.milestone('c001_parterre', (s) => (s.cells.includes('cell_villa_alba_1') ? null : 'sin C001'));
  // Como un jugador: pasar por casa antes de salir (Mamá cura y regala 3 Pociones, §4.7).
  await d.exitTo('casa_prota_1f');
  await d.settle();
  await d.expectSaid(/Por si acaso\. Y vuelve de vez en cuando\./, 'el regalo de Mamá');
  await d.milestone('mama_regalo', (s) => (s.flags.b01_mom_gift ? null : 'sin b01_mom_gift'));
  await d.exitTo('villa_alba');
  await d.settle();
  await d.walkTo(22, 35);
  await d.crossEdge('down', 'ruta_1');
  await d.settle();
  await d.milestone('ruta_1', (s) => (s.flags.b01_left_town ? null : 'sin b01_left_town'));
}

async function route1(d) {
  const b = await d.eval(() => window.__e2e.eventPos('topografa_b'));
  await d.walkTo(b.x, b.y + 1, { face: 'up' });
  await d.press('KeyZ', 500);
  await d.settle();
  await d.expectSaid(/Lecturas de campo\. Siga, por favor\./, 'los topógrafos');
  await d.milestone('topografos');
  const watch = [
    { scene: 'BattleScene', name: 'combate_ruta_1', delay: 4000 },
    { re: /Célula de Zygarde\. \(2\/100\)/, name: 'celula_puente', delay: 200 },
  ];
  for (const id of ['cell_ruta_1_1', 'cell_ruta_1_2', 'cell_ruta_1_3', 'cell_ruta_1_4']) {
    const c = await d.eval((cid) => window.__e2e.eventPos(cid), id);
    await d.walkTo(c.x, c.y, { watch, stopWhen: (s) => s.cells.includes(id) });
    await d.settle();
    const s = await d.snapState();
    if (!s.cells.includes(id)) throw new Error(`No se recogió ${id}`);
    console.log(`  · ${id} (${s.cells.length}/100)`);
  }
  const sign = await d.eval(() => window.__e2e.eventPos('cartel_umbral'));
  await d.walkTo(sign.x, sign.y + 1, { face: 'up' });
  await d.press('KeyZ', 700);
  await d.until((s) => s.top === 'MessageScene', { what: 'cartel del Pilar del Umbral' });
  await d.wait(600);
  await d.expectSaid(/Pilar del Umbral — Ruinas antiguas/, 'el cartel del Umbral');
  await d.milestone('cartel_umbral', (s) => (s.cells.length >= 5 ? null : `células ${s.cells.length}`));
  await d.settle();
}

// ───────────────────────────── Principal ─────────────────────────────

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME, headless: !argv.includes('--headed'),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  if (!WATCH_PROLOGUE) await context.addInitScript(() => { try { localStorage.setItem('ecos.prologue_seen', '1'); } catch { /* sin almacenamiento */ } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.stack || err.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[error] ${msg.text()}`); });
  page.on('response', (res) => { if (res.status() >= 400) errors.push(`[http ${res.status()}] ${res.url()}`); });
  const d = new Driver(page, errors);
  const t0 = Date.now();
  let failed = null;
  try {
    await page.goto(`${BASE}/?debug`, { waitUntil: 'load' });
    await installHelpers(page);
    await titleToBedroom(d);
    await home(d);
    await lab(d);
    await northAndCore(d);
    await leaveTown(d);
    await route1(d);
    const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
    if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
  } catch (err) {
    failed = err;
    await d.shot('fallo').catch(() => {});
  }
  const log = await d.log().catch(() => []);
  fs.writeFileSync(path.join(OUT, 'e2e_b01_dialogos.txt'), log.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  await browser.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d.milestones.join(' → ')} (${secs} s; ${log.length} diálogos en tools/cache/screens/e2e_b01_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 1 completo de principio a fin.');
  }
}

await main();
