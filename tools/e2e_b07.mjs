// Recorrido E2E del Bloque 7 — Interludio 3: Ruta 6 y la Cantería Solano (docs/CAMPANA.md B07; TABLILLAS T04) en
// navegador real (Chrome headless + playwright-core), con teclas reales. Estado de entrada por URL (ARCHITECTURE §9):
// P1–P3 restaurados (Fragmentos F01–F03), Correr, Embestida y Terreno complicado, las 34 células A–C, N1+N2 y un
// equipo fuerte sin encuentros aleatorios. El piloto automático megaevoluciona en cuanto puede: el primer Pokémon
// lleva Lucario con su Lucarita, así se comprueba que antes del Mega Aro NO megaevoluciona y después SÍ.
//   Villa Brontia (bajada sur sin vendaval) → Ruta 6 (Veterana Carmen, la voladura y Bea: segunda pista de T04) →
//   técnicos del Consorcio (derrota simulada y reintento en la misma casilla) → Garrido, los canteros lo señalan y
//   se retira → Alerce en persona y la regla de los estratos → galerías: un derrumbe provocado a propósito (la sala
//   se reinicia y llama Alerce), Sala 1, 2 y 3 resueltas con el solucionador (Timburr, Tabla Pétrea, Quino, piedra
//   activadora) → fiesta de los canteros y denuncia pública → herrería: Mega Aro → derrumbe despejado → combate con
//   Megaevolución → salida hacia Ciudad Estrato.
// Capturas en tools/cache/screens/e2e_b07_<nn>_<hito>.png y transcripción en e2e_b07_dialogos.txt.
// Uso: node tools/e2e_b07.mjs [--base=http://localhost:8080] [--headed] [--no-retry] [--from=brontia|canteria|galerias|herreria]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB07Helpers } from './e2e_b07_page.mjs';
import { room } from '../game/src/content/events/b07_strata_rooms.js';
import { solveRoom } from '../game/src/content/events/b07_strata_logic.js';
import { RUTA6, CANTERIA, GALERIAS, HERRERIA } from '../game/src/content/maps/b07/layout.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const BASE = (argv.find((a) => a.startsWith('--base=')) || '--base=http://localhost:8080').slice(7);
const RETRY = !argv.includes('--no-retry');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
const KEY = { 2: 'ArrowDown', 4: 'ArrowLeft', 6: 'ArrowRight', 8: 'ArrowUp' };
const DIR = { down: 2, left: 4, right: 6, up: 8 };

/** Estado de entrada del bloque (CAMPANA B07 «Entrada: Ruta 6 abierta»; nivel ~28, aquí más alto para el piloto). */
const BASE_FLAGS = [
  'b01_dex_received', 'b01_left_town', 'p1_restored', 'p2_restored', 'p3_restored', 'zyg_10', 'zyg_core_2', 'b05_brontia',
  'b06_colector_roto', 'b06_abril_vencida', 'b06_campanas', 'verse_1', 'verse_2', 'verse_3',
].join(',');
const entry = (over) => new URLSearchParams({
  scene: 'map', party: 'LUCARIO:36,TORTERRA:36,STARAPTOR:35', fragments: '3', noenc: '1', time: '11',
  zygarde: 'run,ram,terrain', zcells: '34', zcores: '2', vars: 'starter:TURTWIG,gael_starter:LITTEN', ...over,
});
const F_CHAIN = ['b07_llegada', 'b07_tecnicos', 'b07_garrido', 'b07_alerce'];
const F_RESCUE = ['b07_timburr_1', 'b07_timburr_2', 'b07_timburr_3', 'b07_quino', 'b07_tablilla', 'b07_piedra', 'b07_rescate', 'b07_denuncia'];
const STARTS = {
  brontia: entry({ map: 'villa_brontia', x: '22', y: '33', dir: '2', flags: BASE_FLAGS }),
  canteria: entry({ map: 'ruta_6', x: '15', y: '21', dir: '2', flags: `${BASE_FLAGS},b07_llegada` }),
  galerias: entry({ map: 'ruta_6', x: '24', y: '41', dir: '8', flags: `${BASE_FLAGS},${F_CHAIN.join(',')}` }),
  herreria: entry({ map: 'ruta_6', x: '6', y: '29', dir: '8', flags: `${BASE_FLAGS},${F_CHAIN.join(',')},${F_RESCUE.join(',')}` }),
};
const FROM = (argv.find((a) => a.startsWith('--from=')) || '--from=brontia').slice(7);
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
      ...window.__e2e.snap(), vars: window.__b07.vars(), lost: window.__b07.lost.slice(), battles: window.__b07.battles.slice(),
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
      if (Date.now() > end) throw new Error(`Tiempo agotado esperando: ${what}\nestado: ${JSON.stringify({ ...s, battles: undefined })}\n${this.errors.slice(-6).join('\n')}`);
      await this.wait(poll);
    }
  }

  async shot(name) {
    this.shots += 1;
    const file = path.join(OUT, `e2e_b07_${String(this.shots).padStart(2, '0')}_${name}.png`);
    await this.page.locator('#stage').screenshot({ path: file });
    console.log(`  captura → ${path.relative(ROOT, file)}`);
    return file;
  }

  async milestone(name, check) {
    const s = await this.snapState();
    const problem = check ? check(s) : null;
    if (problem) throw new Error(`Hito «${name}»: ${problem}\nestado: ${JSON.stringify({ ...s, battles: undefined })}`);
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

  /** Camina hasta (x, y) (ruta de window.__e2e, que rodea la hierba alta) atendiendo lo que salte por el camino. */
  async walkTo(x, y, { onto = true, face = null, maxSteps = 400, stopWhen = null, watch = [] } = {}) {
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') s = await this.settle({ watch });
      if (stopWhen && stopWhen(s)) return s;
      const done = onto ? s.x === x && s.y === y : Math.abs(s.x - x) + Math.abs(s.y - y) === 1;
      if (done) {
        if (face) await this.turn(face);
        return s;
      }
      // En las galerías hay salientes: la ruta de __b07 los salta como el jugador (la de __e2e no los conoce).
      const route = await this.eval(([tx, ty, o, cave]) => (cave && o ? window.__b07.route(tx, ty) : window.__e2e.route(tx, ty, { onto: o })), [x, y, onto, s.map === 'canteria_solano']);
      if (!route || !route.length) throw new Error(`Sin ruta a (${x},${y}) en ${s.map} desde (${s.x},${s.y})`);
      if (process.env.E2E_DEBUG) console.log(`    (${s.x},${s.y}) → (${x},${y}): ${route.join('')}`);
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
      if (s.map === toMap) return s;
      if (s.busy || s.top !== 'MapScene') await this.settle();
    }
    throw new Error(`No se cruzó a ${toMap}`);
  }
}

// ───────────────────────────── Recorrido ─────────────────────────────

async function brontia(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'villa_brontia' && s.ready, { timeout: 30000, what: 'Villa Brontia' });
  await d.settle();
  await d.milestone('brontia_sur');
  await d.walkTo(22, 39);
  await d.crossEdge('down', 'ruta_6');
  await d.settle();
  await d.milestone('ruta_6', (s) => (s.map === 'ruta_6' && s.y <= 2 ? null : `llegada (${s.x},${s.y})`));
}

async function ruta(d) {
  const watch = [{ scene: 'BattleScene', name: 'combate_carmen', delay: 3500 }];
  // Bajada del rellano alto: la Veterana Carmen vigila la escalera.
  await d.walkTo(21, 18, { watch });
  const pre = await d.snapState();
  if (!pre.battles.some((b) => b.id === 'b07_veterana_carmen' && !b.ring)) throw new Error('La Veterana Carmen no ha combatido');
  await d.expectSaid(/Nadie baja esta escalera/, 'el reto de Carmen');
  const log0 = await d.log();
  if (log0.some((l) => /megaevolucionado/.test(l.text))) throw new Error('Se ha megaevolucionado ANTES del Mega Aro');
  // La franja de la Cantería: la voladura y Bea.
  await d.walkTo(21, RUTA6.arrivalY, { watch: [{ re: /BUUUM/, name: 'voladura', delay: 300 }] });
  await d.settle({ watch: [{ re: /Soy Bea, Bea Solano/, name: 'bea', delay: 200 }] });
  await d.expectSaid(/Mi hermano Quino estaba dentro, con su cuadrilla de Timburr/, 'la segunda pista (Bea)');
  const clues = await d.eval(() => window.__b07.clues());
  await d.milestone('llegada_canteria', (s) => {
    if (!s.flags.b07_llegada) return 'sin b07_llegada';
    const t04 = clues.find((c) => c.id === 'T04');
    return t04 && t04.step === 2 ? null : `pista T04: ${JSON.stringify(t04)}`;
  });
}

async function consorcio(d) {
  const t = CANTERIA.techSpot;
  const watch = [
    { re: /Zona de voladura del Consorcio/, name: 'tecnicos', delay: 200 },
    { scene: 'BattleScene', name: 'combate_tecnico', delay: 3500 },
    { re: /Ulises Garrido/, name: 'garrido', delay: 200 },
    { re: /Ese es el que manda volar/, name: 'canteros_senalan', delay: 200 },
    { re: /nunca rompas la capa que sostiene a otra/, name: 'leccion_alerce', delay: 200 },
  ];
  // Cualquier casilla del perímetro dispara la escena (el guion lleva al jugador delante de los técnicos).
  await d.walkTo(t.x, t.y, { watch, stopWhen: (s) => s.flags.b07_tecnicos || s.lost.length > 0 });
  await d.settle({ watch });
  if (RETRY) {
    await d.milestone('tecnico_derrota', (s) => (!s.flags.b07_tecnicos && s.x === t.x && s.y === t.y ? null : `tras perder: (${s.x},${s.y})`));
    await d.step(2);
    await d.step(8);
    await d.settle({ watch });
    await d.until((s) => s.flags.b07_alerce, { timeout: 5000, what: 'la cadena Garrido → Alerce' });
    await d.expectSaid(/Otra vez usted/, 'el reintento con los técnicos');
  }
  await d.expectSaid(/Ulises Garrido\. Dirijo las operaciones de campo del Consorcio/, 'la presentación de Garrido');
  await d.expectSaid(/Retirad las cargas\. Hoy no se vuela nada más/, 'la retirada de Garrido');
  await d.expectSaid(/No lo hago por ti/, 'el pragmatismo de Garrido');
  await d.expectSaid(/nunca rompas la capa que sostiene a otra/, 'la regla de Alerce');
  await d.milestone('consorcio_fuera', (s) => (s.flags.b07_garrido && s.flags.b07_alerce ? null : 'sin b07_garrido o b07_alerce'));
}

async function enterGalerias(d) {
  const door = CANTERIA.mine.door;
  await d.walkTo(door.x, door.y + 1, { face: 'up' });
  await d.step(8);
  await d.until((s) => s.map === 'canteria_solano' && s.ready, { timeout: 15000, what: 'entrar en las galerías' });
  await d.settle();
  await d.expectSaid(/La galería huele a polvo reciente/, 'la llegada a las galerías');
}

const inMap = (n, x, y) => [x + GALERIAS.rooms[n].ox, y + GALERIAS.rooms[n].oy];

/**
 * Ejecuta la solución del solucionador de la sala n desde su llegada: camina (con rutas recalculadas en la página, a
 * prueba de pasos dobles) hasta cada casilla desde la que hay que embestir o rescatar, mira hacia la roca o el
 * atrapado y pulsa A. El último paso (sobre el pozo, si lo hay) se da a mano para que salte la bajada.
 */
async function solve(d, n, watch = []) {
  const r = room(n);
  const sol = solveRoom(r);
  if (!sol.solved) throw new Error(`La sala ${n} no tiene solución`);
  let pos = r.marks.S[0];
  const acts = sol.actions;
  for (let k = 0; k < acts.length; k++) {
    const act = acts[k];
    if (act.type !== 'move') {
      await d.walkTo(...inMap(n, ...pos));
      await d.turn(act.dir);
      await d.interact({ watch });
      continue;
    }
    const last = k === acts.length - 1;
    if (last && r.marks.E.length) {
      // Si un paso doble ya ha metido al jugador en el pozo, la bajada está hecha (otra sala).
      const [ox] = inMap(n, 0, 0);
      const away = (s) => s.x < ox || s.x >= ox + r.w;
      const s0 = await d.walkTo(...inMap(n, ...pos), { stopWhen: away });
      if (!away(s0)) {
        await d.step(act.dir);
        await d.settle({ watch });
      }
    }
    pos = [act.x, act.y];
  }
  const s = await d.snapState();
  if (!r.marks.E.length && s.map === 'canteria_solano') await d.walkTo(...inMap(n, ...pos));
}

async function galerias(d) {
  await d.milestone('galeria_ocre');
  // Derrumbe a propósito: la caliza de la pila del primer Timburr, desde el nicho (la sostiene la arenisca).
  const [nx, ny] = inMap(1, 4, 2);
  await d.walkTo(nx, ny, { face: 'right' });
  await d.interact({ watch: [{ re: /Esa roca sostenía la capa de encima/, name: 'derrumbe', delay: 200 }] });
  await d.expectSaid(/Esa roca sostenía la capa de encima/, 'el derrumbe');
  await d.expectSaid(/la capa de abajo aguanta a la de arriba/, 'la llamada de Alerce');
  const [sx, sy] = inMap(1, ...room(1).marks.S[0]);
  await d.milestone('sala_reiniciada', (s) => (s.x === sx && s.y === sy && (s.vars.b07_sala_1 || 0) === 0 && s.vars.b07_derrumbes === 1 ? null : `(${s.x},${s.y}) sala ${s.vars.b07_sala_1} derrumbes ${s.vars.b07_derrumbes}`));
  // Sala 1 (tutorial) y bajada por el pozo.
  await solve(d, 1);
  await d.until((s) => s.map === 'canteria_solano' && s.x === inMap(2, 7, 8)[0], { timeout: 15000, what: 'bajar a la sala 2' });
  await d.settle();
  await d.milestone('sala_1_resuelta', (s) => (s.flags.b07_timburr_1 ? null : 'sin el primer Timburr'));
  await solve(d, 2);
  await d.until((s) => s.x === inMap(3, 7, 8)[0], { timeout: 15000, what: 'bajar a la sala 3' });
  await d.settle();
  await d.expectSaid(/Aquí, detrás de la roca roja/, 'el grito de Quino');
  await d.milestone('sala_2_resuelta', (s) => (s.flags.b07_timburr_2 && s.flags.b07_timburr_3 ? null : 'faltan Timburr'));
  const watch = [
    { re: /asoma una losa de piedra tallada/, name: 'tabla_petrea', delay: 400 },
    { re: /nunca había visto una veta así/, name: 'veta', delay: 200 },
    // La fiesta arranca sola al salir por el pozo (evento automático del patio).
    { re: /La cuadrilla entera fuera/, name: 'fiesta_patio', delay: 300 },
    { re: /anillo de la roca/, name: 'anillo_de_la_roca', delay: 200 },
  ];
  await solve(d, 3, watch);
  await d.until((s) => s.map === 'ruta_6' && s.ready, { timeout: 30000, what: 'salir por el pozo de ventilación' });
  await d.expectSaid(/Has obtenido la Tabla Pétrea/, 'la Tabla Pétrea');
  const tablets = await d.eval(() => window.__b07.tablets());
  await d.milestone('rescate_completo', (s) => {
    if (!['b07_quino', 'b07_tablilla', 'b07_piedra'].every((f) => s.flags[f])) return 'faltan flags del rescate';
    return tablets.includes('STONEPLATE') ? null : 'sin STONEPLATE';
  });
}

async function fiesta(d) {
  await d.settle({ watch: [{ re: /¡Quino!/, name: 'bea_quino', delay: 200 }, { re: /anillo de la roca/, name: 'anillo_de_la_roca', delay: 200 }] });
  await d.expectSaid(/En Solano, al que saca a alguien de la roca le damos un anillo de la roca/, 'la frase de Bea');
  await d.expectSaid(/Ya estamos escribiendo el aviso/, 'la denuncia de los canteros');
  const clues = await d.eval(() => window.__b07.clues());
  await d.milestone('fiesta_canteros', (s) => {
    if (!s.flags.b07_rescate || !s.flags.b07_denuncia) return 'sin b07_rescate o b07_denuncia';
    const t04 = clues.find((c) => c.id === 'T04');
    return t04 && t04.status === 'solved' ? null : `pista T04: ${JSON.stringify(t04)}`;
  });
}

async function herreria(d) {
  const f = CANTERIA.forgeFront;
  await d.walkTo(f.x, f.y, { face: 'up' });
  await d.step(8);
  await d.until((s) => s.map === 'canteria_herreria', { timeout: 15000, what: 'entrar en la herrería' });
  await d.settle({ watch: [{ re: /Es una Piedra Activadora/, name: 'alerce_piedra', delay: 200 }, { scene: 'ObtainScene', name: 'mega_aro', delay: 600 }] });
  await d.expectSaid(/Es una Piedra Activadora\. Responde a los lazos…/, 'Alerce examina la piedra');
  await d.expectSaid(/Te va a hacer falta\./, 'Alerce: «Te va a hacer falta»');
  const ring = await d.eval(() => window.__b07.has('MEGARING'));
  await d.milestone('mega_aro', (s) => (ring && s.flags.b07_megaring && s.flags.b07_ruta_despejada ? null : `aro ${ring}, flags ${s.flags.b07_megaring}/${s.flags.b07_ruta_despejada}`));
  await d.walkTo(HERRERIA.entry.x, HERRERIA.entry.y);
  await d.press('ArrowDown', 500);
  await d.until((s) => s.map === 'ruta_6' && s.ready, { timeout: 15000, what: 'salir de la herrería' });
  await d.settle();
}

async function mega(d) {
  // Paso despejado: se cruza el antiguo derrumbe; el Minero Tino combate y Lucario megaevoluciona.
  await d.eval(() => window.__b07.heal());
  await d.walkTo(RUTA6.rubbleSouth.x, RUTA6.rubbleSouth.y);
  await d.milestone('derrumbe_despejado');
  const watch = [{ scene: 'BattleScene', name: 'combate_mega', delay: 6000 }];
  await d.walkTo(15, 49, { watch, stopWhen: (s) => s.battles.some((b) => b.id === 'b07_minero_tino') });
  await d.settle({ watch });
  const s = await d.snapState();
  if (!s.battles.some((b) => b.id === 'b07_minero_tino' && b.ring)) throw new Error('El Minero Tino no ha combatido con el Mega Aro');
  await d.expectSaid(/ha megaevolucionado/, 'la Megaevolución en combate');
  await d.milestone('megaevolucion');
}

async function estrato(d) {
  const s0 = await d.snapState();
  const toEstrato = await d.eval(() => Boolean(window.__map?.world?.current?.def?.connections?.some((c) => c.to === 'ciudad_estrato')));
  await d.walkTo(15, RUTA6.south.y - 1);
  if (toEstrato) {
    await d.crossEdge('down', 'ciudad_estrato');
    await d.settle();
    await d.milestone('ciudad_estrato');
  } else {
    await d.step(2);
    await d.settle();
    await d.expectSaid(/hacia Ciudad Estrato, pero por ahora no puedes continuar/, 'el aviso del enlace pendiente');
    await d.milestone('camino_estrato', () => (s0.flags.b07_megaring ? null : 'sin salida del bloque'));
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
    await page.goto(`${BASE}/?${STARTS[FROM].toString()}&debug`, { waitUntil: 'load' });
    await installHelpers(page);
    await installB07Helpers(page, { loseOnce: RETRY ? ['b07_tecnico_voladura'] : [] });
    await d.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'el mapa de arranque' });
    // Lucario con su Lucarita al frente: no debe megaevolucionar hasta tener el Mega Aro.
    await d.eval(() => window.__b07.leadWithStone('LUCARIO', 36, 'LUCARIONITE'));
    const stages = [
      ['brontia', brontia], ['ruta', ruta], ['canteria', consorcio], ['galerias', async (dr) => { await enterGalerias(dr); await galerias(dr); }],
      ['fiesta', fiesta], ['herreria', herreria], ['mega', mega], ['estrato', estrato],
    ];
    const first = FROM === 'canteria' ? 2 : stages.findIndex(([n]) => n === FROM);
    for (const [, run] of stages.slice(first)) await run(d);
    const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
    if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
  } catch (err) {
    failed = err;
    await d.shot('fallo').catch(() => {});
  }
  const log = await d.log().catch(() => []);
  fs.writeFileSync(path.join(OUT, 'e2e_b07_dialogos.txt'), log.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  await browser.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d.milestones.join(' → ')} (${secs} s; ${log.length} diálogos en tools/cache/screens/e2e_b07_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 7 completo de principio a fin.');
  }
}

await main();
