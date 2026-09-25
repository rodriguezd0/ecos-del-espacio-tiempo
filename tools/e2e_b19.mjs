// Recorrido E2E del Bloque 19 — Interludio 9: la Calzada del Rey (docs/CAMPANA.md B19; TABLILLAS.md T15) en navegador
// real (Chrome headless + playwright-core), con teclas reales. Estado de entrada por URL (ARCHITECTURE §9): P1–P9
// restaurados (Fragmentos F01–F09), Forma Completa con todas las capacidades, 100 células, N1–N5 y equipo alto, sin
// encuentros aleatorios.
//   antes     visita antes del P9: los Peregrinos esperan a Casandra (sin piedras forzadas)
//   llegada   bienvenida de Leocadia (pista T15) · Casandra y el Resonador (segunda pista) · Tadeo deja pasar
//   tramo1    pisar una piedra y volver al borde (el Resonador las vuelve a alzar) · solución del primer tramo · la
//             aguja despierta · Reconstrucción: la Calzada de verdad
//   tramo2    segundo tramo (y los Peregrinos de la pila A que salgan al paso)
//   tramo3    un derrumbe a propósito (Zygarde sostiene y devuelve al borde) · solución · Casandra cruza con su Noivern:
//             combate (derrota simulada: reintento en el tramo) y revancha
//   taller    el taller del Rey: la Tabla Draco, la Crónica XV, Casandra y la Salamencita · al salir, Alerce: «Si ves a
//             Gael…» (cura al equipo)
//   alfa      la cima: Salamence Alfa (combate)
//   bajada    la Puerta de la Bajada → Sima del Eje · el último tramo (solo con la Tabla Draco) · el Umbral (salida
//             b19_calzada) · la Puerta de las Quince (B20) y la vuelta
//   oeste     el sendero del oeste de la Sima: Reconstrucción, Metagrossita y la bajada del Mirador Sur (B17)
// Capturas en tools/cache/screens/e2e_b19_<nn>_<hito>.png y transcripción en e2e_b19_dialogos.txt.
// Uso: node tools/e2e_b19.mjs [--base=http://localhost:8080] [--headed] [--from=<tramo>] [--only=<tramo>] [--no-retry]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB19Helpers } from './e2e_b19_page.mjs';
import { ARRIVAL, NPC, CAMP, PENA, DUEL, ARRIVAL_STRIP } from '../game/src/content/maps/b19/calzada_layout.js';
import { NICHE, ENTRY as TALLER_ENTRY } from '../game/src/content/maps/b19/taller_layout.js';
import { ARRIVALS, GAP_W, GAP_ALCOVE, GAP_FINAL, UMBRAL, EXITS } from '../game/src/content/maps/b19/sima_layout.js';
import { solutionSteps, spanDef } from '../game/src/content/events/b19_spans_logic.js';

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
const TAP_SCENES = ['MessageScene', 'VerseScene', 'TravelScene', 'ObtainScene', 'CaptionScene', 'PictureScene'];
const QUIET_SCENES = ['MapScene', 'ChoiceScene', 'BattleScene', 'BattleTransitionScene'];

/** Estado de entrada del bloque (CAMPANA B19 «Entrada: P9 restaurado»). */
const BASE_FLAGS = [
  'b01_woke', 'b01_met_mom', 'b01_lab_intro_seen', 'b01_starter_chosen', 'b01_signal_heard', 'b01_police_entered',
  'b01_core_found', 'b01_escorted', 'b01_gael_duel_done', 'b01_mom_gift', 'b01_dex_received', 'b01_left_town',
  'b02_libreta', 'p1_restored', 'p2_restored', 'p3_restored', 'p4_restored', 'p5_restored', 'p6_restored', 'p7_restored',
  'p8_restored', 'zyg_10', 'zyg_50', 'zyg_complete', 'zyg_core_2', 'zyg_core_3', 'zyg_core_4', 'zyg_core_5', 'zyg_dive',
  'zyg_rebuild_tutorial', 'b07_megaring',
];
const STAGE_FLAGS = {
  llegada: ['p9_restored'],
  tramo1: ['b19_llegada', 'b19_casandra_intro', 'b19_tramo_tutorial'],
  tramo2: ['b19_tramo_1'],
  tramo3: ['b19_tramo_2'],
  taller: ['b19_tramo_3', 'b19_casandra_llega', 'b19_casandra_vencida', 'b19_derrumbe_visto'],
  alfa: ['b19_taller_visto', 'b19_tablilla', 'b19_salamencita', 'b19_resonador_apagado', 'b19_cuidadores', 'b19_alerce'],
  bajada: [],
  oeste: [],
};
const ORDER = ['antes', 'llegada', 'tramo1', 'tramo2', 'tramo3', 'taller', 'alfa', 'bajada', 'oeste'];
const flagsUpTo = (stage) => ORDER.slice(0, ORDER.indexOf(stage) + 1).flatMap((s) => STAGE_FLAGS[s] || []);
const entry = (stage, over) => new URLSearchParams({
  scene: 'map', party: 'GARCHOMP:82,METAGROSS:80,DRAGONITE:80,LUCARIO:80', fragments: '9', noenc: '1', time: '11', core: '1',
  zygarde: 'all', zcells: '100', zcores: '5', vars: 'starter:TURTWIG,gael_starter:LITTEN', ...over,
  flags: [...BASE_FLAGS, ...flagsUpTo(stage), ...(over?.flags ? [over.flags] : [])].join(','),
});
const STARTS = {
  antes: entry('antes', { map: 'calzada_rey', x: String(ARRIVAL.x), y: String(ARRIVAL.y), dir: '8' }),
  llegada: entry('llegada', { map: 'calzada_rey', x: String(ARRIVAL.x), y: String(ARRIVAL.y), dir: '8' }),
  tramo1: entry('tramo1', { map: 'calzada_rey', x: '13', y: '42', dir: '8' }),
  tramo2: entry('tramo2', { map: 'calzada_rey', x: '13', y: '30', dir: '8' }),
  tramo3: entry('tramo3', { map: 'calzada_rey', x: '31', y: '26', dir: '6' }),
  taller: entry('taller', { map: 'calzada_rey', x: String(PENA.workshop.front.x), y: String(PENA.workshop.front.y + 2), dir: '8' }),
  alfa: entry('alfa', { map: 'calzada_rey', x: '42', y: '11', dir: '8' }),
  bajada: entry('bajada', { map: 'calzada_rey', x: String(PENA.bajada.front.x), y: String(PENA.bajada.front.y + 1), dir: '8' }),
  oeste: entry('oeste', { map: 'sima_eje', x: String(ARRIVALS.north.x), y: String(ARRIVALS.north.y + 1), dir: '2', flags: 'b19_sima_llegada' }),
};
/** Tramos que necesitan su propia URL aunque se venga del anterior. */
const FRESH = new Set(['llegada', 'oeste']);
const FROM = arg('from', 'antes');
const ONLY = arg('only', '');
if (!STARTS[FROM]) throw new Error(`--from desconocido: ${FROM} (${ORDER.join(', ')})`);

// ───────────────────────────── Conductor ─────────────────────────────

class Driver {
  constructor(page, errors) {
    this.page = page;
    this.errors = errors;
    this.shots = 0;
    this.milestones = [];
    this.want = [];
  }

  eval(fn, a) { return this.page.evaluate(fn, a); }
  wait(ms) { return this.page.waitForTimeout(ms); }
  snapState() {
    return this.eval(() => ({
      ...window.__e2e.snap(),
      vars: window.__b19.vars(),
      tablets: window.__b19.tablets(),
      lost: window.__b19.lost.slice(),
      battles: window.__b19.battles.slice(),
      choices: window.__b19.choiceItems(),
    }));
  }

  async press(key, after = 180, hold = 70) {
    await this.page.keyboard.down(key);
    await this.wait(hold);
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
    const file = path.join(OUT, `e2e_b19_${String(this.shots).padStart(2, '0')}_${name}.png`);
    await this.page.locator('#stage').screenshot({ path: file });
    console.log(`  captura → ${path.relative(ROOT, file)}`);
    return file;
  }

  async milestone(name, check) {
    const s = await this.snapState();
    const problem = check ? await check(s) : null;
    if (problem) throw new Error(`Hito «${name}»: ${problem}\nestado: ${JSON.stringify({ ...s, flags: Object.keys(s.flags).filter((k) => /^(b19|p9)/.test(k)) })}`);
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

  pickChoice(s) {
    const items = s.choices || [];
    if (this.want.length && items.includes(this.want[0])) return items.indexOf(this.want.shift());
    if (/mote/i.test(s.lastText || '')) return Math.max(0, items.indexOf('No'));
    return 0;
  }

  /** Atiende mensajes, elecciones y combates hasta que el mapa queda libre. */
  async settle({ timeout = 300000, watch = [] } = {}) {
    const end = Date.now() + timeout;
    let calm = 0;
    let stuck = 0;
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
      if (TAP_SCENES.includes(s.top)) { calm = 0; stuck = 0; await this.press('KeyZ', 160); continue; }
      if (s.top === 'ChoiceScene') {
        calm = 0;
        const want = this.pickChoice(s);
        for (let i = s.choiceIndex; i < want; i++) await this.press('ArrowDown', 120);
        for (let i = s.choiceIndex; i > want; i--) await this.press('ArrowUp', 120);
        await this.press('KeyZ', 250);
        continue;
      }
      if (!QUIET_SCENES.includes(s.top)) {
        stuck += 1;
        if (stuck > 20) { stuck = 0; await this.press('KeyZ', 200); }
      }
      if (s.top === 'MapScene' && s.ready && !s.busy && !s.playerBusy) {
        calm += 1;
        if (calm >= 4) return s;
      } else calm = 0;
      await this.wait(150);
    }
    throw new Error(`settle: el mapa no queda libre\n${JSON.stringify(await this.snapState())}`);
  }

  pos() {
    return this.eval(() => {
      const w = window.__map;
      const p = w?.world?.player;
      return { x: p?.x ?? null, y: p?.y ?? null, map: w?.world?.map?.id ?? null };
    });
  }

  waitLeave(x, y, map, timeout = 1500) {
    return this.page.waitForFunction(([px, py, pm]) => {
      const w = window.__map;
      const p = w?.world?.player;
      if (!p) return 'gone';
      if (w.world.map.id !== pm) return 'map';
      if (w.world.scriptBusy()) return 'script';
      return p.x !== px || p.y !== py ? 'moved' : false;
    }, [x, y, map], { polling: 'raf', timeout }).then((h) => h, () => null);
  }

  /** Un paso en `dir` (mantiene la tecla hasta que el jugador se mueve o algo lo interrumpe). */
  async step(dir) {
    const before = await this.pos();
    await this.page.keyboard.down(KEY[dir]);
    try {
      await this.waitLeave(before.x, before.y, before.map);
    } finally {
      await this.page.keyboard.up(KEY[dir]);
    }
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 4000, what: 'fin del paso' });
  }

  async turn(dir) {
    const d = typeof dir === 'string' ? DIR[dir] : dir;
    const s = await this.snapState();
    if (s.dir === d) return;
    await this.press(KEY[d], 150, 40);
    await this.until((st) => st.dir === d || st.busy, { timeout: 2000, what: 'girar' });
  }

  async walkTo(x, y, { onto = true, face = null, maxSteps = 700, stopWhen = null, watch = [] } = {}) {
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') s = await this.settle({ watch });
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

  /** Pasos exactos (sobre las piedras forzadas: la ruta libre no sirve), atendiendo lo que salte en cada uno. */
  async steps(dirs, opts = {}) {
    for (const d of dirs) {
      await this.step(d);
      await this.settle(opts);
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

  async talk(x, y, face, opts = {}) {
    await this.walkTo(x, y, { face });
    return this.interact(opts);
  }

  /** Empuja hacia `dir` a golpes hasta cambiar al mapa `toMap`. */
  async exitTo(dir, toMap, opts = {}) {
    for (let i = 0; i < 8; i++) {
      await this.page.keyboard.down(KEY[DIR[dir] || dir]);
      await this.wait(350);
      await this.page.keyboard.up(KEY[DIR[dir] || dir]);
      await this.wait(250);
      const s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') await this.settle(opts);
      if ((await this.snapState()).map === toMap) return this.settle(opts);
    }
    throw new Error(`No se salió hacia ${toMap}`);
  }

  async goto(url) {
    await this.page.goto(url, { waitUntil: 'load' });
    await installHelpers(this.page);
    await installB19Helpers(this.page, { loseOnce: RETRY ? ['b19_casandra'] : [] });
    await this.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'el mapa de arranque' });
    await this.settle();
  }
}

const has = (s, f) => Boolean(s.flags[f]);
const need = (ok, msg) => (ok ? null : msg);

// ───────────────────────────── Tramos ─────────────────────────────

async function antes(d) {
  const [sx, sy] = ARRIVAL_STRIP[0];
  await d.walkTo(sx + 1, sy - 1);
  await d.expectSaid(/Casandra, nuestra guía, se ha ido a Lúmina/, 'la espera de los Peregrinos');
  const stone = await d.eval(() => window.__b19.eventAlive('tramo_1_piedra_0'));
  await d.milestone('antes_del_p9', (s) => need(has(s, 'b19_llegada_antes') && !stone, `llegada ${has(s, 'b19_llegada_antes')}, piedra ${stone}`));
}

async function llegada(d) {
  const [sx, sy] = ARRIVAL_STRIP[0];
  await d.walkTo(sx + 1, sy - 1, { watch: [{ re: /Bienvenid[oa] a la Calzada del Rey/, name: 'bienvenida', delay: 200 }] });
  await d.expectSaid(/Casandra está junto al Resonador/, 'la bienvenida de Leocadia');
  const C = CAMP.casandra;
  await d.talk(C.x, C.y + 1, 'up', { watch: [{ re: /trozo cayó al Mirador Sur/, name: 'casandra_resonador', delay: 200 }] });
  await d.expectSaid(/lo arrojaron a la Sima/, 'el mito del Rey');
  await d.expectSaid(/Písalas todas, una sola vez cada una/, 'la explicación de Zygarde');
  const clue = await d.eval(() => window.__b19.clue('T15'));
  const tadeo = await d.eval(() => window.__b19.eventAlive('tadeo_paso'));
  await d.milestone('casandra', (s) => need(has(s, 'b19_llegada') && has(s, 'b19_casandra_intro') && clue?.step === 2 && !tadeo, `pista ${JSON.stringify(clue)}, Tadeo ${tadeo}`));
}

async function tramo1(d) {
  const S = solutionSteps(1);
  const [fx, fy] = S.from;
  await d.walkTo(fx, fy, { face: 'up' });
  // Pisar una piedra y volver al borde: cae y el Resonador las vuelve a alzar.
  await d.steps([8, 2]);
  await d.expectSaid(/el trozo del Resonador vuelve a alzar las piedras/, 'el reinicio del tramo');
  await d.milestone('tramo1_reinicio', (s) => need(Number(s.vars.b19_tramo_1_caidas || 0) === 0, `máscara ${s.vars.b19_tramo_1_caidas}`));
  await d.steps(S.dirs);
  await d.turn(S.face);
  await d.milestone('tramo1_meta', (s) => need(Number(s.vars.b19_tramo_1_listo) === 1, 'la aguja no despierta'));
  d.want.push('Sí');
  await d.interact({ watch: [{ re: /Esta vez, se quedan/, name: 'tramo1_alzado', delay: 100 }] });
  await d.expectSaid(/No la ha alzado el Resonador|no las ha alzado el Resonador/i, 'la reacción del Mirador');
  await d.milestone('tramo1', (s) => need(has(s, 'b19_tramo_1'), 'el primer tramo no se ha alzado'));
}

async function tramo2(d) {
  const S = solutionSteps(2);
  await d.walkTo(S.from[0], S.from[1], { face: 'right' });
  await d.steps(S.dirs);
  await d.turn(S.face);
  d.want.push('Sí');
  await d.interact();
  await d.expectSaid(/esa luz verde/, 'el Peregrino de la pila B');
  await d.milestone('tramo2', (s) => need(has(s, 'b19_tramo_2'), 'el segundo tramo no se ha alzado'));
}

async function tramo3(d) {
  const S = solutionSteps(3);
  const start = spanDef(3).start;
  await d.walkTo(S.from[0], S.from[1], { face: 'up' });
  // Derrumbe a propósito: por aquí la última piedra se queda sin salida.
  await d.steps([8, 8, 4, 8, 6], { watch: [{ re: /La losa se parte/, name: 'tramo3_derrumbe', delay: 150 }] });
  await d.expectSaid(/Te tengo\.|Otra vez desde el borde/, 'Zygarde sosteniendo al jugador');
  await d.milestone('derrumbe', (s) => need(Number(s.vars.b19_derrumbes) >= 1 && s.x === start.x && s.y === start.y, `derrumbes ${s.vars.b19_derrumbes} en (${s.x},${s.y})`));
  await d.walkTo(S.from[0], S.from[1], { face: 'up' });
  await d.steps(S.dirs);
  await d.turn(S.face);
  d.want.push('Sí');
  const watch = [
    { re: /Una sombra alada/, name: 'noivern', delay: 300 },
    { scene: 'BattleScene', name: 'casandra_combate', delay: 3500 },
  ];
  await d.interact({ watch });
  await d.expectSaid(/Si el Rey tenía que abrirle la puerta a alguien/, 'el reto de Casandra');
  if (RETRY) {
    const s = await d.milestone('casandra_derrota', (st) => need(st.lost.includes('b19_casandra') && !has(st, 'b19_casandra_vencida') && st.x === DUEL.retry.x && st.y === DUEL.retry.y, `perdido ${st.lost} en (${st.x},${st.y})`));
    void s;
    const [sx, sy] = DUEL.strip[1];
    await d.walkTo(sx, sy + 1, { face: 'up' });
    await d.steps([8]);
  }
  await d.expectSaid(/Las piedras le responden/, 'Casandra vencida');
  await d.milestone('casandra_vencida', (s) => need(has(s, 'b19_casandra_vencida'), 'Casandra no ha sido vencida'));
}

async function taller(d) {
  const W = PENA.workshop;
  await d.walkTo(W.front.x, W.front.y, { face: 'up' });
  await d.exitTo('up', 'calzada_taller');
  await d.expectSaid(/Aquí trabajó alguien durante mucho tiempo/, 'la llegada al taller');
  await d.talk(NICHE.stand.x, NICHE.stand.y, 'up', { watch: [{ re: /El rey no murió en el abismo/, name: 'cronica_xv', delay: 200 }] });
  await d.expectSaid(/Se equivocó… y se quedó a arreglarlo/, 'Casandra ante la Crónica');
  const sal = await d.eval(() => window.__b19.items('SALAMENCITE'));
  const clue = await d.eval(() => window.__b19.clue('T15'));
  await d.milestone('tabla_draco', (s) => {
    if (!s.tablets.includes('DRACOPLATE')) return `sin Tabla Draco (${s.tablets})`;
    if (sal !== 1 || !has(s, 'b19_cuidadores') || !has(s, 'b19_resonador_apagado')) return `Salamencita ${sal}`;
    return need(clue?.solved || clue?.status === 'solved', `pista T15 ${JSON.stringify(clue)}`);
  });
  await d.walkTo(TALLER_ENTRY.x, TALLER_ENTRY.y);
  await d.exitTo('down', 'calzada_rey', { watch: [{ re: /Si ves a Gael/, name: 'alerce', delay: 200 }] });
  await d.expectSaid(/^Si ves a Gael… no le digas nada que yo no haya tenido el valor de decir\.$/, 'la línea de Alerce');
  await d.milestone('alerce', (s) => need(has(s, 'b19_alerce'), 'sin la escena de Alerce'));
}

async function alfa(d) {
  const A = PENA.alfa;
  await d.talk(A.x, A.y + 1, 'up', { watch: [{ scene: 'BattleScene', name: 'salamence_alfa', delay: 3500 }] });
  await d.milestone('alfa', (s) => need(has(s, 'b19_alfa') && s.battles.includes('SALAMENCE'), `Alfa ${has(s, 'b19_alfa')} combates ${s.battles}`));
}

async function bajada(d) {
  const B = PENA.bajada;
  await d.walkTo(B.front.x, B.front.y, { face: 'up' });
  await d.exitTo('up', 'sima_eje', { watch: [{ re: /Aquí se abrió todo/, name: 'sima', delay: 200 }] });
  const G = GAP_FINAL.socket;
  await d.walkTo(G.x + 1, G.y, { face: 'left' });
  d.want.push('Sí');
  await d.interact({ watch: [{ re: /encajan contra el Umbral/, name: 'ultimo_tramo', delay: 150 }] });
  const [lx, ly] = UMBRAL.landing[1];
  await d.walkTo(lx, ly);
  await d.settle();
  await d.expectSaid(/La Puerta de las Quince\. Detrás, el Origen\./, 'el Umbral');
  await d.milestone('umbral', (s) => need(has(s, 'b19_calzada') && has(s, 'b19_sima_ultimo_tramo'), 'sin la salida b19_calzada'));
  const hasPuerta = await d.eval(() => Boolean(window.__map?.world?.current?.def?.warps?.some((w) => w.to === 'puerta_quince')));
  if (!hasPuerta) { console.log('  (puerta_quince aún sin registrar: se omite la entrada)'); return; }
  await d.walkTo(UMBRAL.arrive.x, UMBRAL.arrive.y, { face: 'up' });
  await d.exitTo('up', 'puerta_quince');
  await d.milestone('puerta_quince', (s) => need(s.map === 'puerta_quince', `mapa ${s.map}`));
}

async function oeste(d) {
  const [s0] = GAP_W.sockets;
  await d.walkTo(s0.x, s0.y - 1, { face: 'down' });
  d.want.push('Sí');
  await d.interact();
  await d.milestone('sima_oeste', (s) => need(has(s, 'b19_sima_paso'), 'el hueco del sendero no se ha alzado'));
  const A = GAP_ALCOVE.socket;
  await d.walkTo(A.x - 1, A.y, { face: 'right' });
  d.want.push('Sí');
  await d.interact();
  await d.talk(8, 31, 'right');
  const metag = await d.eval(() => window.__b19.items('METAGROSSITE'));
  await d.milestone('metagrossita', () => need(metag === 1, `Metagrossita ${metag}`));
  const S = EXITS.south;
  await d.walkTo(S.x0, S.y);
  await d.exitTo('down', 'mirador_sur');
  await d.milestone('mirador_sur', (s) => need(s.map === 'mirador_sur', `mapa ${s.map}`));
}

const STAGES = { antes, llegada, tramo1, tramo2, tramo3, taller, alfa, bajada, oeste };

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
  fs.writeFileSync(path.join(OUT, 'e2e_b19_dialogos.txt'), transcript.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d?.milestones.join(' → ')} (${secs} s; ${transcript.length} diálogos en tools/cache/screens/e2e_b19_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 19 completo de principio a fin.');
  }
}

await main();
