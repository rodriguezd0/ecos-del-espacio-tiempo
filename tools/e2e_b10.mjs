// Recorrido E2E del Bloque 10 — Pilar de la Memoria (docs/CAMPANA.md B10) en navegador real (Chrome headless +
// playwright-core), con teclas reales. Estado de entrada por URL (ARCHITECTURE §9): P1–P4 restaurados (Fragmentos
// F01–F04), Correr, Embestida y Terreno, las 44 células A–D anteriores a Mnemos, los núcleos N1–N2, equipo de nivel
// alto y sin encuentros aleatorios:
//   Mnemos (llegada con la niebla y Fausta; el camino del norte da vueltas) → Olvido encarga las cinco notas →
//   Bruno, Jacinta, Amaro (Santuario), Tomé (herbolario) y Sabina (casa de té, Sinistea) → Olvido abre el Archivo →
//   C045 en el bambú → Archivo de papel (cameo de Casia, técnicos) → Archivo Hondo: Suelo Olvidado (eco del custodio,
//   una caída y el camino seguro) → Dos Manos (eco y palancas) → Lectura (eco del relato, un error y la puerta glífica)
//   → Rollos (eco y estantería) → C046 → Mural (manantial, seis paneles) → Olvido (derrota simulada y reintento) →
//   núcleo (Fragmento 5, verso V, Clave Glífica, «Eres tú», Gael, T09, Trepar, Alerce) → informe tachado y Piedra
//   Espíritu → Mnemos sin niebla: el camino del norte abierto y el risco trepado.
// Capturas en tools/cache/screens/e2e_b10_<nn>_<hito>.png y transcripción en e2e_b10_dialogos.txt.
// Uso: node tools/e2e_b10.mjs [--base=http://localhost:8080] [--headed] [--no-retry] [--from=mnemos|archivo|hondo|mural]
//      [--gender=F]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB10Helpers } from './e2e_b10_page.mjs';
import { NPC, BUILDINGS, BAMBOO, RISCO, EXITS, FOG_WALL_Y, INTERIOR_ENTRIES } from '../game/src/content/maps/b10/mnemos_layout.js';
import { ARCHIVO_ROOM } from '../game/src/content/maps/b10/archivo_layout.js';
import { SUELO, MANOS, LECTURA, ROLLOS, MURAL, NUCLEO } from '../game/src/content/maps/b10/hondo_layout.js';
import {
  GLYPH_SEQUENCE, DOOR_GLYPHS, SCROLL_SEQUENCE, SCROLL_COLORS, LEVER_TARGET, LEVER_START,
} from '../game/src/content/events/b10_hondo_logic.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const BASE = (argv.find((a) => a.startsWith('--base=')) || '--base=http://localhost:8080').slice(7);
const RETRY = !argv.includes('--no-retry');
const GENDER = (argv.find((a) => a.startsWith('--gender=')) || '--gender=M').slice(9);
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
const KEY = { 2: 'ArrowDown', 4: 'ArrowLeft', 6: 'ArrowRight', 8: 'ArrowUp' };
const DIR = { down: 2, left: 4, right: 6, up: 8 };

/** Estado de entrada del bloque (CAMPANA B10 «Entrada: Terreno complicado; nivel ~37»; aquí más alto para el piloto). */
const BASE_FLAGS = 'b01_dex_received,b01_left_town,p1_restored,p2_restored,p3_restored,p4_restored,zyg_10,zyg_core_2,b09_gala';
const NOTES_FLAGS = 'b10_llegada,b10_olvido_conocida,b10_nota_sabina,b10_nota_tome,b10_nota_jacinta,b10_nota_amaro,b10_nota_bruno,b10_notas_repartidas,b10_archivo_abierto,b10_sinistea';
const HONDO_FLAGS = `${NOTES_FLAGS},b10_casia,b10_olvido_baja,b10_hondo_visto`;
const entry = (over) => new URLSearchParams({
  scene: 'map', party: 'TORTERRA:48,STARAPTOR:47,LUXRAY:47,GARDEVOIR:46', fragments: '4', noenc: '1', time: '11',
  zygarde: 'run,ram,terrain', zcells: '44', zcores: '2', core: '1',
  vars: 'starter:TURTWIG,gael_starter:LITTEN', ...over,
});
const STARTS = {
  mnemos: entry({ map: 'aldea_mnemos', x: '31', y: '41', dir: '8', flags: BASE_FLAGS }),
  archivo: entry({ map: 'aldea_mnemos', x: String(BUILDINGS.archivo.door.x), y: String(BUILDINGS.archivo.door.y + 2), dir: '8', flags: `${BASE_FLAGS},${NOTES_FLAGS}` }),
  hondo: entry({ map: 'archivo_hondo', x: '4', y: '4', dir: '2', flags: `${BASE_FLAGS},${HONDO_FLAGS}` }),
  mural: entry({ map: 'archivo_hondo', x: '7', y: '21', dir: '8', flags: `${BASE_FLAGS},${HONDO_FLAGS},b10_suelo,b10_manos,b10_lectura,b10_rollos`, zcells: '46' }),
};
const FROM = (argv.find((a) => a.startsWith('--from=')) || '--from=mnemos').slice(7);
if (!STARTS[FROM]) throw new Error(`--from desconocido: ${FROM} (${Object.keys(STARTS).join(', ')})`);

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
      vars: window.__b10.vars(),
      abilities: window.__b10.abilities(),
      fragments: window.__b10.fragments(),
      lost: window.__b10.lost.slice(),
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
      if (Date.now() > end) throw new Error(`Tiempo agotado esperando: ${what}\nestado: ${JSON.stringify(s)}\n${this.errors.slice(-6).join('\n')}`);
      await this.wait(poll);
    }
  }

  async shot(name) {
    this.shots += 1;
    const file = path.join(OUT, `e2e_b10_${String(this.shots).padStart(2, '0')}_${name}.png`);
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

  /** Atiende mensajes, elecciones y combates hasta que el mapa queda libre. `choose(s)` da el índice de cada elección. */
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
      if (['MessageScene', 'VerseScene', 'TravelScene', 'ObtainScene'].includes(s.top)) { calm = 0; await this.press('KeyZ', 160); continue; }
      if (s.top === 'ChoiceScene') {
        calm = 0;
        const want = choose(s);
        // Con la máquina cargada se puede perder una pulsación: se comprueba el cursor antes de aceptar.
        let cur = s;
        for (let tries = 0; tries < 16 && cur.top === 'ChoiceScene' && cur.choiceIndex !== want; tries++) {
          await this.press(cur.choiceIndex < want ? 'ArrowDown' : 'ArrowUp', 110);
          cur = await this.snapState();
        }
        if (cur.top === 'ChoiceScene' && cur.choiceIndex === want) await this.press('KeyZ', 250);
        continue;
      }
      if (s.top === 'MapScene' && s.ready && !s.busy && !s.playerBusy) {
        calm += 1;
        if (calm >= 4) return s;
      } else if (s.top !== 'MapScene' && s.top !== 'BattleScene') {
        calm = 0;
        await this.press('KeyZ', 200);
        continue;
      } else calm = 0;
      await this.wait(150);
    }
    throw new Error(`settle: el mapa no queda libre\n${JSON.stringify(await this.snapState())}`);
  }

  async step(dir) {
    const before = await this.snapState();
    const key = KEY[dir];
    // La página suelta la tecla en cuanto el jugador empieza a moverse: un solo paso aunque Node vaya con retraso.
    await this.page.evaluate((c) => window.__b10?.releaseOnMove?.(c), key);
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

  async turn(dir) {
    const d = typeof dir === 'string' ? DIR[dir] : dir;
    const s = await this.snapState();
    if (s.dir === d) return;
    await this.press(KEY[d], 150);
    await this.until((st) => st.dir === d || st.busy, { timeout: 2000, what: 'girar' });
  }

  /** Camina hasta (x, y) sin pisar casillas de contacto (salvo el destino). Atiende las escenas del camino. */
  async walkTo(x, y, { onto = true, face = null, maxSteps = 400, stopWhen = null, watch = [], choose, avoid = [] } = {}) {
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') s = await this.settle({ watch, choose });
      if (stopWhen && stopWhen(s)) return s;
      const done = onto ? s.x === x && s.y === y : Math.abs(s.x - x) + Math.abs(s.y - y) === 1;
      if (done) {
        if (face) await this.turn(face);
        return s;
      }
      const route = await this.eval(([tx, ty, o, av]) => window.__b10.safeRoute(tx, ty, { onto: o, avoid: av }), [x, y, onto, avoid]);
      if (!route || !route.length) throw new Error(`Sin ruta a (${x},${y}) en ${s.map} desde (${s.x},${s.y})`);
      await this.step(route[0]);
    }
    throw new Error(`walkTo(${x},${y}): demasiados pasos`);
  }

  /** Pasos exactos (sin buscar ruta): para el camino del custodio sobre el suelo invisible. */
  async stepsExact(dirs) {
    for (const d of dirs) {
      await this.step(DIR[d] || d);
      const s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') await this.settle();
    }
  }

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

  /** Se acerca a un personaje u objeto en (x, y) por la casilla libre más cercana, lo mira y pulsa A. */
  async talkTo(x, y, opts = {}) {
    const s = await this.walkTo(x, y, { ...opts, onto: false });
    const d = s.x < x ? 'right' : s.x > x ? 'left' : s.y < y ? 'down' : 'up';
    await this.turn(d);
    return this.interact(opts);
  }

  /** Entra por una puerta: camina a la casilla de debajo y empuja hacia arriba hasta cambiar de mapa. */
  async enterDoor(door, toMap) {
    await this.walkTo(door.x, door.y + 1, { face: 'up' });
    await this.step(8);
    await this.until((s) => s.map === toMap && s.ready, { timeout: 15000, what: `entrar en ${toMap}` });
    return this.settle();
  }

  /** Sale de un interior pisando el felpudo y pulsando abajo. */
  async exitInterior(entryTile, toMap) {
    await this.walkTo(entryTile.x, entryTile.y);
    for (let i = 0; i < 4; i++) {
      await this.press('ArrowDown', 400);
      const s = await this.snapState();
      if (s.map === toMap) break;
    }
    await this.until((s) => s.map === toMap && s.ready, { timeout: 15000, what: `salir a ${toMap}` });
    return this.settle();
  }
}

// ───────────────────────────── Aldea Mnemos ─────────────────────────────

async function mnemos(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'aldea_mnemos' && s.ready, { timeout: 30000, what: 'Aldea Mnemos' });
  await d.settle({ watch: [{ re: /niebla fina/, name: 'llegada_niebla', delay: 300 }] });
  await d.expectSaid(/Una niebla fina cubre la aldea/, 'la llegada con la niebla');
  await d.expectSaid(/Me llamo… eh… Fausta/, 'Fausta, que olvida su nombre');
  const fog = await d.eval(() => window.__b10.fog());
  await d.milestone('llegada', (s) => (s.flags.b10_llegada && fog ? null : `llegada ${s.flags.b10_llegada}, niebla ${fog}`));
  // El camino del norte da vueltas: la niebla devuelve a la aldea.
  await d.walkTo(EXITS.north.x0, FOG_WALL_Y + 1, { face: 'up' });
  await d.step(8);
  await d.settle();
  await d.expectSaid(/no ves ni tus pies/, 'el bucle de la niebla');
  await d.milestone('niebla_bucle', (s) => (s.y > FOG_WALL_Y + 1 ? null : `no ha vuelto: (${s.x},${s.y})`));
  // Olvido en la plaza.
  await d.talkTo(NPC.olvido.x, NPC.olvido.y, { watch: [{ re: /Olvido Arrieta/, name: 'olvido', delay: 200 }] });
  await d.expectSaid(/Repártelas y te abro el Archivo/, 'el encargo de las notas');
  await d.milestone('encargo_notas', (s) => (s.flags.b10_olvido_conocida ? null : 'sin b10_olvido_conocida'));
}

async function notes(d) {
  // Bruno y Bambú, junto al estanque.
  await d.talkTo(NPC.bruno.x, NPC.bruno.y);
  await d.expectSaid(/Tu Pancham se llama Bambú/, 'la nota de Bruno');
  // Jacinta.
  await d.enterDoor(BUILDINGS.jacinta.door, 'mnemos_casa_jacinta');
  await d.talkTo(2, 6);
  await d.expectSaid(/Tu nieta se llama Nerea/, 'la nota de Jacinta');
  await d.exitInterior(INTERIOR_ENTRIES.mnemos_casa_jacinta, 'aldea_mnemos');
  // Amaro, en el Santuario de los Glifos (terraza, escalera roja).
  await d.enterDoor(BUILDINGS.santuario.door, 'mnemos_santuario');
  await d.talkTo(6, 13);
  await d.expectSaid(/Te llamas Amaro/, 'la nota de Amaro');
  await d.exitInterior(INTERIOR_ENTRIES.mnemos_santuario, 'aldea_mnemos');
  // Tomé, en el herbolario.
  await d.enterDoor(BUILDINGS.herbolario.door, 'mnemos_herbolario');
  await d.talkTo(6, 5);
  await d.expectSaid(/Tu aprendiz se llama Elio/, 'la nota de Tomé');
  await d.exitInterior(INTERIOR_ENTRIES.mnemos_herbolario, 'aldea_mnemos');
  // Sabina, en la casa de té: nota y Sinistea.
  await d.enterDoor(BUILDINGS.te.door, 'mnemos_casa_te');
  await d.talkTo(7, 4, { watch: [{ re: /Sinistea se coló/, name: 'sabina_sinistea', delay: 200 }] });
  await d.expectSaid(/Te llamas Sabina/, 'la nota de Sabina');
  await d.milestone('notas_repartidas', (s) => {
    const missing = ['sabina', 'tome', 'jacinta', 'amaro', 'bruno'].filter((k) => !s.flags[`b10_nota_${k}`]);
    if (missing.length) return `faltan ${missing.join(', ')}`;
    return s.party.includes('SINISTEA') ? null : 'sin Sinistea';
  });
  await d.exitInterior(INTERIOR_ENTRIES.mnemos_casa_te, 'aldea_mnemos');
  // C045 en el claro del bambú, tras la casa de té.
  await d.walkTo(BAMBOO.clearing.x, BAMBOO.clearing.y);
  await d.settle();
  await d.milestone('c045', (s) => (s.cells.includes('cell_mnemos_1') ? null : 'sin C045'));
  // Olvido abre el Archivo.
  await d.talkTo(NPC.olvido.x, NPC.olvido.y);
  await d.expectSaid(/Cinco de cinco/, 'Olvido con las cinco notas');
  await d.milestone('archivo_abierto', (s) => (s.flags.b10_archivo_abierto ? null : 'sin b10_archivo_abierto'));
}

async function archivo(d) {
  const watch = [
    { re: /Nosotros también salvamos lo que se pierde/, name: 'casia_cameo', delay: 200 },
    { scene: 'BattleScene', name: 'combate_tecnico', delay: 3500 },
  ];
  await d.enterDoor(BUILDINGS.archivo.door, 'mnemos_archivo');
  await d.settle({ watch });
  await d.expectSaid(/Nosotros también salvamos lo que se pierde\./, 'el cameo de Casia');
  await d.expectSaid(/Te espero abajo, donde duerme la piedra/, 'Olvido baja por su camino');
  await d.milestone('casia', (s) => (s.flags.b10_casia && s.flags.b10_olvido_baja ? null : 'sin cameo'));
  // La escalera se baja entrando por la izquierda (escalera_bajar_der).
  await d.walkTo(ARCHIVO_ROOM.stairsWarp.x - 1, ARCHIVO_ROOM.stairsWarp.y, { face: 'right', watch });
  await d.step(6);
  await d.until((s) => s.map === 'archivo_hondo' && s.ready, { timeout: 15000, what: 'bajar al Archivo Hondo' });
  await d.settle();
}

// ───────────────────────────── Archivo Hondo ─────────────────────────────

const PATH_DIRS = (() => {
  const out = [];
  let [px, py] = [SUELO.start.x, SUELO.start.y];
  for (const [x, y] of [...SUELO.path, [SUELO.exit.x, SUELO.exit.y]]) {
    out.push(x > px ? 'right' : x < px ? 'left' : y > py ? 'down' : 'up');
    [px, py] = [x, y];
  }
  return out;
})();

async function suelo(d) {
  await d.milestone('hondo_llegada');
  // Eco del custodio: la losa de recuerdo.
  await d.walkTo(SUELO.losa.x, SUELO.losa.y, { watch: [{ re: /papel viejo/, name: 'eco_suelo', delay: 1400 }] });
  await d.settle({ watch: [{ re: /papel viejo/, name: 'eco_suelo', delay: 1400 }] });
  // Un paso en falso: se cae y vuelve al borde.
  await d.walkTo(SUELO.start.x, SUELO.start.y);
  await d.walkTo(SUELO.start.x, SUELO.start.y - 1);
  await d.stepsExact(['right']);
  await d.settle();
  await d.expectSaid(/El suelo no estaba ahí/, 'la caída del Suelo Olvidado');
  let s = await d.snapState();
  if (!(s.x === SUELO.start.x && s.y === SUELO.start.y)) throw new Error(`La caída no devuelve al borde: (${s.x},${s.y})`);
  // El camino del custodio.
  await d.stepsExact(PATH_DIRS);
  await d.settle();
  s = await d.milestone('suelo_cruzado', (st) => (st.flags.b10_suelo ? null : `sin b10_suelo en (${st.x},${st.y})`));
}

async function manos(d) {
  await d.walkTo(MANOS.losa.x, MANOS.losa.y, { watch: [{ re: /papel viejo/, name: 'eco_manos', delay: 2600 }] });
  await d.settle({ watch: [{ re: /papel viejo/, name: 'eco_manos', delay: 2600 }] });
  await d.expectSaid(/Las palancas vuelven a donde tú las dejaste/, 'el eco de las Dos Manos');
  for (let i = 0; i < 2; i++) {
    const lv = MANOS.levers[i];
    await d.walkTo(lv.x, lv.y + 1, { face: 'up' });
    const pulls = (LEVER_TARGET[i] - LEVER_START[i] + 4) % 4;
    for (let k = 0; k < pulls; k++) await d.interact();
  }
  await d.expectSaid(/la losa del dintel se hunde/, 'la losa de las Dos Manos');
  await d.milestone('dos_manos', (s) => (s.flags.b10_manos ? null : `palancas ${JSON.stringify(s.vars)}`));
}

async function lectura(d) {
  await d.walkTo(LECTURA.losa.x, LECTURA.losa.y, { watch: [{ re: /diez piedras/, name: 'eco_lectura', delay: 300 }] });
  await d.settle({ watch: [{ re: /diez piedras/, name: 'eco_lectura', delay: 300 }] });
  await d.expectSaid(/flauta.*se rompió en diez/, 'el relato de la custodia');
  await d.walkTo(LECTURA.door.x, LECTURA.door.y - 1, { face: 'down' });
  // Un glifo fuera de orden apaga la puerta.
  if (RETRY) {
    // Tras un glifo equivocado la puerta se apaga y el guion termina: no hay más elecciones.
    const wrong = DOOR_GLYPHS.indexOf(GLYPH_SEQUENCE[2]);
    await d.interact({ choose: () => wrong });
    await d.expectSaid(/todos los glifos se apagan/, 'el error de la puerta');
  }
  // La elección sale del paso guardado (b10_glifo_paso), no de un contador: con la máquina cargada `settle` puede
  // ver la misma elección dos veces antes de que llegue la pulsación, y un contador se adelantaría.
  const order = GLYPH_SEQUENCE.map((g) => DOOR_GLYPHS.indexOf(g));
  const glyphFor = (s) => order[Math.min(Number(s.vars?.b10_glifo_paso) || 0, order.length - 1)];
  await d.interact({ choose: glyphFor, watch: [{ re: /a ras del suelo, sin un ruido/, name: 'puerta_glifica', delay: 200 }] });
  await d.expectSaid(/El relato queda copiado en la Libreta/, 'el relato en la Libreta');
  await d.milestone('lectura', (s) => (s.flags.b10_lectura ? null : 'sin b10_lectura'));
}

async function rollos(d) {
  await d.walkTo(ROLLOS.losa.x, ROLLOS.losa.y, { watch: [{ re: /papel viejo/, name: 'eco_rollos', delay: 4000 }] });
  await d.settle({ watch: [{ re: /papel viejo/, name: 'eco_rollos', delay: 4000 }] });
  await d.expectSaid(/solo quedan los rollos que has puesto tú/, 'el eco de los Rollos');
  const placed = [];
  for (const { color, cubby } of SCROLL_SEQUENCE) {
    const c = ROLLOS.cubbies[cubby];
    await d.walkTo(c.x, c.y + 1, { face: 'up' });
    const left = SCROLL_COLORS.filter((x) => !placed.includes(x));
    await d.interact({ choose: () => left.indexOf(color) });
    placed.push(color);
  }
  await d.expectSaid(/la losa del dintel del noroeste se retira/, 'la losa de los Rollos');
  await d.milestone('rollos', (s) => (s.flags.b10_rollos ? null : `rollos ${JSON.stringify(s.vars)}`));
  await d.walkTo(ROLLOS.cell.x, ROLLOS.cell.y);
  await d.settle();
  await d.milestone('c046', (s) => (s.cells.includes('cell_memoria_1') ? null : 'sin C046'));
}

async function mural(d) {
  const [sx, sy] = MURAL.springUse[0];
  await d.walkTo(sx, sy, { face: 'up' });
  await d.interact();
  await d.expectSaid(/Tus Pokémon beben y se recuperan/, 'el manantial');
  for (let slot = 0; slot < 6; slot++) {
    const p = MURAL.panels[slot];
    await d.walkTo(p.x, p.y + 1, { face: 'up' });
    await d.interact({ choose: () => slot });
  }
  await d.expectSaid(/Los seis paneles se iluminan/, 'el Mural ordenado');
  await d.milestone('mural', (s) => (s.flags.b10_mural ? null : `mural ${s.vars.b10_mural_orden}`));
}

async function olvido(d) {
  const watch = [
    { re: /nota a pie de página/, name: 'olvido_existes', delay: 200 },
    { scene: 'BattleScene', name: 'combate_olvido', delay: 4500 },
  ];
  await d.walkTo(NUCLEO.battleSpot.x, NUCLEO.battleSpot.y, { watch, stopWhen: (s) => s.flags.b10_olvido_retada });
  await d.settle({ watch });
  await d.expectSaid(/¡Existes! Eres una nota a pie de página que camina\./, 'el reto de Olvido');
  if (RETRY) {
    await d.milestone('olvido_derrota', (s) => (!s.flags.b10_olvido_vencida && s.x === NUCLEO.battleSpot.x && s.y === NUCLEO.battleSpot.y ? null : `tras perder: (${s.x},${s.y})`));
    await d.walkTo(NUCLEO.battleSpot.x, NUCLEO.battleSpot.y, { face: 'down' });
    await d.interact({ watch });
    await d.expectSaid(/primer intento/, 'el reintento con Olvido');
  }
  await d.milestone('olvido_vencida', (s) => (s.flags.b10_olvido_vencida ? null : 'sin b10_olvido_vencida'));
}

async function nucleo(d) {
  await d.walkTo(NUCLEO.front.x, NUCLEO.front.y, { face: 'up' });
  await d.interact({ watch: [{ scene: 'VerseScene', name: 'verso_v', delay: 1500 }], choose: () => 0 });
  await d.until((s) => s.map === 'mnemos_archivo' && s.ready, { timeout: 30000, what: 'subir al Archivo de papel' });
  await d.settle({ watch: [{ re: /Los tachones también son memoria/, name: 'informe_tachado', delay: 200 }] });
  for (const [re, what] of [
    [/Fragmento Azur 5/, 'el Fragmento Azur 5'],
    [/Entonces uno caminará entre el tiempo y el espacio llevando consigo al guardián roto/, 'el verso V completo'],
    [/Clave Glífica/, 'la Clave Glífica'],
    [/…Eres tú\./, '«Eres tú.»'],
    [/Firmó en mi libro de visitas: Gael/, 'la visita de Gael'],
    [/La novena tabla sueña en voz ajena/, 'la inscripción de T09'],
    [/Recuerdo cómo se sube/, 'Trepar'],
    [/Es una llamada del Prof\. Alerce/, 'la llamada de Alerce'],
    [/Los tachones también son memoria\./, 'el informe tachado'],
    [/Piedra Espíritu/, 'la Piedra Espíritu'],
  ]) await d.expectSaid(re, what);
  const clues = await d.eval(() => window.__b10.clues());
  const items = await d.eval(() => window.__b10.items(['GLYPHKEY', 'ODDKEYSTONE']));
  await d.milestone('p5_restaurado', (s) => {
    if (!s.flags.p5_restored || !s.flags.verse_5) return 'sin p5_restored o sin verso V';
    if (!s.fragments.includes('F05')) return 'sin Fragmento 5';
    if (!s.abilities.climb) return 'sin Trepar';
    if (!clues.some((c) => c.id === 'T09')) return 'sin pista T09';
    if (!items.GLYPHKEY || !items.ODDKEYSTONE) return `objetos ${JSON.stringify(items)}`;
    return s.flags.b10_informe ? null : 'sin informe';
  });
}

async function salida(d) {
  await d.exitInterior(ARCHIVO_ROOM.entry, 'aldea_mnemos');
  await d.expectSaid(/La niebla se ha levantado/, 'la aldea sin niebla');
  const fog = await d.eval(() => window.__b10.fog());
  await d.milestone('niebla_levantada', () => (fog ? `sigue la niebla ${fog}` : null));
  // Trepar: el risco de la Losa del Olvido.
  await d.walkTo(RISCO.wall.x, RISCO.wall.y + 1, { face: 'up' });
  await d.interact({ choose: () => 0 });
  await d.until((s) => s.y === RISCO.wall.top[1], { timeout: 10000, what: 'subir el risco' });
  await d.settle();
  await d.milestone('risco_trepado', (s) => (s.x === RISCO.wall.top[0] && s.y === RISCO.wall.top[1] ? null : `(${s.x},${s.y})`));
  await d.walkTo(RISCO.down.x, RISCO.down.y - 1, { face: 'down' });
  await d.interact({ choose: () => 0 });
  await d.until((s) => s.y === RISCO.down.bottom[1], { timeout: 10000, what: 'bajar el risco' });
  await d.settle();
  // El camino del norte ya no da vueltas.
  await d.walkTo(EXITS.north.x0, FOG_WALL_Y - 1);
  await d.milestone('camino_norte_abierto', (s) => (s.map !== 'aldea_mnemos' || s.y < FOG_WALL_Y ? null : `(${s.x},${s.y})`));
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
    await page.goto(`${BASE}/?${STARTS[FROM].toString()}&debug`, { waitUntil: 'load' });
    await installHelpers(page);
    await installB10Helpers(page, { loseOnce: RETRY ? ['b10_olvido'] : [] });
    await d.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'el mapa de arranque' });
    await d.eval((g) => window.__b10.setGender(g), GENDER);
    const stages = [['mnemos', mnemos], ['notas', notes], ['archivo', archivo], ['hondo', suelo], ['manos', manos],
      ['lectura', lectura], ['rollos', rollos], ['mural', mural], ['olvido', olvido], ['nucleo', nucleo], ['salida', salida]];
    const first = { mnemos: 0, archivo: 2, hondo: 3, mural: 7 }[FROM];
    for (const [, run] of stages.slice(first)) await run(d);
    const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
    if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
  } catch (err) {
    failed = err;
    await d.shot('fallo').catch(() => {});
  }
  const log = await d.log().catch(() => []);
  fs.writeFileSync(path.join(OUT, 'e2e_b10_dialogos.txt'), log.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  await browser.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d.milestones.join(' → ')} (${secs} s; ${log.length} diálogos en tools/cache/screens/e2e_b10_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 10 completo de principio a fin.');
  }
}

await main();
