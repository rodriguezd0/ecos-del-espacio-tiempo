// Recorrido E2E del Bloque 9b — Interludio 4B: Ruta 8 (Marisma Turbia y Palafitos, arco T08 completo), Ciudad Nexo,
// Ruta 15 y Caleta Sonda (docs/CAMPANA.md B09 parte B; TABLILLAS T08, T11, T12) en navegador real (Chrome headless +
// playwright-core), con teclas reales. Estado de entrada por URL (ARCHITECTURE §9): P1–P4 restaurados, Correr,
// Embestida y Terreno complicado (sin Nadar), equipo alto, de día y sin encuentros aleatorios. Recorrido:
//   Ruta 8 desde Lúmina (golpeteo de las bombas; el Core calla: Zygarde habla muy poco) → Palafitos: Doña Remedios
//   (cura y segunda pista de T08) → al salir, Alerce llega e insiste en tomar él las muestras → tres técnicos de
//   Genesis (derrota simulada contra la primera y reintento) → C044 → seis estacas con la Pokédex → resumen de Alerce →
//   una poza equivocada (sin penalización) y la del origen → Tabla Tóxica, escena de la tarde (Remedios: «Hace
//   dieciséis años…»; Alerce: «Son aparatos corrientes.») y la marisma sanando →
//   Ciudad Nexo: Don Evaristo en Correos, puesto de los herreros (T12 en cola hasta Nadar), Aduana Vieja cerrada,
//   ferri parado, prismáticos (plataforma del Consorcio), pescador de la Caña Buena → Ruta 15: pescadora de las mareas,
//   mirador, un Binacle de las rocas → Caleta Sonda: Supercaña, Ramón (T11 en cola), muelle de buzos (Ainhoa).
// Capturas tools/cache/screens/e2e_b09b_<nn>_<hito>.png y transcripción e2e_b09b_dialogos.txt.
// Uso: node tools/e2e_b09b.mjs [--base=http://localhost:8080] [--headed] [--no-retry] [--from=marisma|nexo]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB09bHelpers } from './e2e_b09b_page.mjs';
import * as R8 from '../game/src/content/maps/b09b/ruta_8_layout.js';
import * as NX from '../game/src/content/maps/b09b/nexo_layout.js';
import * as R15 from '../game/src/content/maps/b09b/ruta_15_layout.js';
import * as CL from '../game/src/content/maps/b09b/caleta_layout.js';

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
const LOSE_TECH = 'b09b_tecnica_bomba_1';

const BASE_FLAGS = 'b01_dex_received,b01_left_town,p1_restored,p2_restored,p3_restored,p4_restored,zyg_10,zyg_core_2,b05_brontia,b07_megaring,b09_gala,b09_t06_tablilla,b09_t07_tablilla';
const entry = (over) => new URLSearchParams({
  scene: 'map', party: 'STARAPTOR:58,TORTERRA:58,LUXRAY:56,LUCARIO:56', fragments: '4', noenc: '1', time: '11',
  zygarde: 'run,ram,terrain', zcells: '44', zcores: '2', vars: 'starter:TURTWIG,gael_starter:LITTEN', flags: BASE_FLAGS, ...over,
});
const STARTS = {
  marisma: entry({ map: 'ruta_8_marisma', x: String(R8.START.x), y: String(R8.START.y), dir: '4' }),
  nexo: entry({ map: 'ciudad_nexo', x: String(NX.START.x), y: String(NX.START.y), dir: '2' }),
};
const FROM = (argv.find((a) => a.startsWith('--from=')) || '--from=marisma').slice(7);
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
      vars: window.__b09b.vars(),
      clues: window.__b09b.clues(),
      tablets: window.__b09b.tablets(),
      items: window.__b09b.items(['GOODROD', 'SUPERROD', 'REVIVALHERB', 'TOXICPLATE', 'BLACKSLUDGE']),
      choices: window.__b09b.choiceItems(),
      lost: window.__b09b.lost.slice(),
      hour: window.__b09b.hour(),
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
      if (Date.now() > end) throw new Error(`Tiempo agotado esperando: ${what}\nestado: ${JSON.stringify({ ...s, vars: undefined })}\n${this.errors.slice(-6).join('\n')}`);
      await this.wait(poll);
    }
  }

  async shot(name) {
    this.shots += 1;
    const file = path.join(OUT, `e2e_b09b_${String(this.shots).padStart(2, '0')}_${name}.png`);
    await this.page.locator('#stage').screenshot({ path: file });
    console.log(`  captura → ${path.relative(ROOT, file)}`);
    return file;
  }

  async milestone(name, check) {
    const s = await this.snapState();
    const problem = check ? check(s) : null;
    if (problem) throw new Error(`Hito «${name}»: ${problem}\nestado: ${JSON.stringify({ ...s, vars: undefined })}`);
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

  /** Atiende mensajes, elecciones y combates hasta que el mapa queda libre. `choose(s)` → índice de la opción. */
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
        for (let i = s.choiceIndex; i > want; i--) await this.press('ArrowUp', 120);
        await this.press('KeyZ', 250);
        continue;
      }
      if (s.top === 'MapScene' && s.ready && !s.busy && !s.playerBusy) {
        calm += 1;
        if (calm >= 4) return s;
      } else if (s.top !== 'MapScene' && s.top !== 'BattleScene' && !s.busy) {
        calm = 0;
        await this.press('KeyZ', 200);
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
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 6000, what: 'fin del paso' });
  }

  async turn(dir) {
    const d = typeof dir === 'string' ? DIR[dir] : dir;
    const s = await this.snapState();
    if (s.dir === d) return;
    await this.press(KEY[d], 150);
    await this.until((st) => st.dir === d || st.busy, { timeout: 2000, what: 'girar' });
  }

  /** Camina hasta (x, y) (o a su lado con `onto: false`), atendiendo las escenas que salten. */
  async walkTo(x, y, { onto = true, face = null, maxSteps = 600, stopWhen = null, watch = [], choose } = {}) {
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

  /** Se acerca a (x, y) por la casilla vecina más corta, la mira y pulsa A. */
  async talkTo(x, y, opts = {}) {
    const s = await this.walkTo(x, y, { onto: false, choose: opts.choose, watch: opts.watch });
    const dir = s.x < x ? 6 : s.x > x ? 4 : s.y < y ? 2 : 8;
    await this.turn(dir);
    return this.interact(opts);
  }

  /** Va a (x, y), mira hacia `dir` y habla. */
  async talk(x, y, dir, opts = {}) {
    await this.walkTo(x, y, { face: dir, choose: opts.choose });
    return this.interact(opts);
  }

  /** Empuja contra una puerta (warp sobre casilla no transitable) hasta entrar en `toMap`. */
  async push(x, y, dir, toMap) {
    // Si el último paso hacia la casilla de la puerta ya era en su dirección, la tecla aún pulsada puede empujar la
    // puerta y entrar antes de tiempo: también vale.
    const at = await this.walkTo(x, y, { stopWhen: (s) => s.map === toMap });
    for (let i = 0; i < 4 && at.map !== toMap; i++) {
      await this.step(DIR[dir]);
      const s = await this.snapState();
      if (s.map === toMap) break;
      if (s.busy || s.top !== 'MapScene') await this.settle();
    }
    await this.until((s) => s.map === toMap && s.ready, { timeout: 15000, what: `entrar en ${toMap}` });
    return this.settle();
  }

  /** Sale por una alfombra: se coloca en (x, y) y pulsa hacia `dir` hasta cambiar a `toMap`. */
  async leave(x, y, dir, toMap, opts = {}) {
    const at = await this.walkTo(x, y, { stopWhen: (s) => s.map === toMap, watch: opts.watch, choose: opts.choose });
    if (at.map !== toMap) await this.step(DIR[dir]);
    await this.until((s) => s.map === toMap && s.ready, { timeout: 15000, what: `salir a ${toMap}` });
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
}

const pick = (label) => (s) => { const i = s.choices.findIndex((c) => c === label || c.startsWith(label)); return i < 0 ? 0 : i; };
const has = (s, id) => (s.items[id] || 0) > 0;

// ───────────────────────────── Ruta 8 · T08 ─────────────────────────────

async function arrival(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'ruta_8_marisma' && s.ready, { timeout: 30000, what: 'la Ruta 8' });
  await d.settle();
  await d.walkTo(R8.START.x - 2, R8.START.y, { watch: [{ re: /golpeteo sordo/, name: 'marisma_bombas', delay: 200 }] });
  await d.settle();
  await d.expectSaid(/golpeteo sordo/, 'el golpeteo de las bombas');
  await d.milestone('marisma_llegada', (s) => (s.flags.b09_marisma_llegada ? null : 'sin b09_marisma_llegada'));
}

async function remedios(d) {
  const door = R8.HOUSES.remedios.door;
  await d.push(door.x, door.y + 1, 'up', 'palafitos_remedios');
  await d.talk(6, 6, 'up', { watch: [{ re: /Soy Remedios/, name: 'remedios', delay: 200 }] });
  await d.expectSaid(/cerca de las bombas del Consorcio/, 'la pista de Remedios');
  await d.milestone('t08_remedios', (s) => (s.flags.b09_t08_remedios && s.clues.some((c) => c.id === 'T08' && c.step === 2) ? null : 'sin segunda pista de T08'));
  // Al salir, Alerce llega por el puente e insiste en tomar él las muestras.
  const watch = [{ re: /Quería ver el agua con mis propios ojos/, name: 'alerce_llega', delay: 200 }];
  await d.leave(6, 9, 'down', 'ruta_8_marisma', { watch, choose: () => 0 });
  await d.settle({ watch });
  await d.expectSaid(/No\. Las muestras las tomo yo\./, 'la insistencia de Alerce');
  await d.milestone('t08_alerce', (s) => (s.flags.b09_t08_alerce ? null : 'Alerce no llegó'));
}

/** Técnico de una bomba: la vista lo dispara; con derrota simulada, reintento desde su casilla de reintento. */
async function pump(d, n, approach) {
  const p = R8.PUMPS.find((q) => q.n === n);
  const flag = `b09_t08_bomba_${n}`;
  const watch = [{ scene: 'BattleScene', name: `tecnico_${n}`, delay: 3000 }];
  await d.walkTo(approach.x, approach.y, { watch, stopWhen: (s) => s.flags[flag] || s.lost.includes(p.tech.trainer) });
  await d.settle({ watch });
  let s = await d.snapState();
  if (!s.flags[flag]) {
    if (RETRY && s.lost.includes(p.tech.trainer)) {
      await d.milestone(`bomba_${n}_reintento`, (st) => (st.x === p.tech.front.x && st.y === p.tech.front.y ? null : `tras perder: (${st.x},${st.y})`));
    }
    await d.talkTo(p.tech.x, p.tech.y, { watch });
    s = await d.snapState();
  }
  await d.milestone(`bomba_${n}`, (st) => (st.flags[flag] ? null : `la bomba ${n} sigue en marcha`));
}

async function pumps(d) {
  await pump(d, 1, { x: 36, y: 50 });
  await d.expectSaid(/De acuerdo\. Detengo la bomba/, 'la técnica para la bomba');
  await pump(d, 2, { x: 41, y: 15 });
  // C044, en el barro junto a la bomba del noreste.
  await d.walkTo(R8.CELLS.c044.x, R8.CELLS.c044.y);
  await d.settle();
  await d.milestone('c044', (s) => (s.cells.includes('cell_marisma_1') ? null : 'sin C044'));
  await pump(d, 3, { x: 13, y: 16 });
  await d.expectSaid(/sin las bombas, el lodo se asienta/, 'la Pokédex vibra');
  await d.milestone('t08_bombas', (s) => (s.flags.b09_t08_bombas ? null : 'faltan bombas'));
  // Lodo Negro en la llanura de la bomba del noroeste.
  const it = R8.ITEMS.find((i) => i.item === 'BLACKSLUDGE');
  await d.talkTo(it.x, it.y);
  await d.milestone('lodo_negro', (s) => (has(s, 'BLACKSLUDGE') ? null : 'sin Lodo Negro'));
}

async function stakes(d) {
  for (const n of [6, 5, 4, 2, 1, 3]) {
    const k = R8.STAKES.find((st) => st.n === n);
    await d.talkTo(k.x, k.y);
    const s = await d.snapState();
    if (!(Number(s.vars[`b09_t08_lectura_${n}`]) > 0)) throw new Error(`la estaca ${n} no guardó lectura`);
    if (n === 5) await d.shot('estaca_muy_alta');
  }
  await d.expectSaid(/Ya tienes las seis lecturas/, 'el aviso de las seis lecturas');
  await d.milestone('t08_lecturas', (s) => (s.flags.b09_t08_lecturas ? null : 'sin las seis lecturas'));
  const st = R8.SPOTS.alerceStation;
  await d.talkTo(st.x, st.y);
  await d.expectSaid(/Repasemos las lecturas/, 'el resumen de Alerce');
}

async function dig(d) {
  const yes = pick('Sí');
  if (RETRY) {
    const wrong = R8.POOLS.find((p) => p.id === 'q1');
    await d.talkTo(wrong.x, wrong.y, { choose: yes });
    await d.expectSaid(/Solo barro, espeso y frío/, 'la poza equivocada');
    await d.milestone('poza_equivocada', (s) => (!s.flags.b09_t08_tablilla ? null : 'la poza equivocada dio la Tablilla'));
  }
  const src = R8.SOURCE_POOL;
  const watch = [{ re: /asoma una losa violeta/, name: 'losa', delay: 200 }, { re: /Hace dieciséis años/, name: 'remedios_aparatos', delay: 200 }];
  await d.talkTo(src.x, src.y, { choose: yes, watch });
  await d.expectSaid(/Hace dieciséis años vinieron unos señores a medir la laguna/, 'la frase de Remedios');
  await d.expectSaid(/^Son aparatos corrientes\.$/, 'la respuesta de Alerce');
  await d.expectSaid(/Nos quedamos/, 'los jóvenes se quedan');
  await d.milestone('t08_tablilla', (s) => {
    if (!s.tablets.includes('TOXICPLATE') && !has(s, 'TOXICPLATE')) return 'sin Tabla Tóxica';
    if (!s.flags.b09_marisma_sana) return 'la marisma no sana';
    if ((s.items.REVIVALHERB || 0) < 2) return 'sin el regalo de Remedios';
    if (!(s.hour >= 17)) return `la escena final no es por la tarde (${s.hour})`;
    return null;
  });
  const foam = await d.eval(() => window.__b09b.eventPage('espuma_0'));
  await d.milestone('marisma_sana', () => (foam === 1 ? null : `la espuma sigue (página ${foam})`));
}

// ───────────────────────────── Nexo, Ruta 15, Caleta ─────────────────────────────

async function nexo(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'ciudad_nexo' && s.ready, { timeout: 30000, what: 'Ciudad Nexo' });
  await d.settle();
  await d.milestone('nexo', null);
  // Correos: Don Evaristo, por encima del mostrador.
  const co = NX.BUILDINGS.correos.door;
  await d.push(co.x, co.y + 1, 'up', 'nexo_correos');
  await d.talk(7, 8, 'right', { watch: [{ re: /Sesenta años detrás de este mostrador/, name: 'evaristo', delay: 200 }] });
  await d.expectSaid(/Sesenta años detrás de este mostrador/, 'Don Evaristo');
  await d.leave(4, 9, 'down', 'ciudad_nexo');
  // Mercado: los herreros de Tizón ya no mandan picos (T12, en cola hasta Nadar).
  const her = NX.PLAZA.stalls.find((st) => st.role === 'herreros');
  await d.talk(her.x + 1, her.y + 4, 'up', { watch: [{ re: /no mandan ni uno/, name: 'mercado_t12', delay: 200 }] });
  await d.milestone('t12_en_cola', (s) => (s.clues.some((c) => c.id === 'T12' && c.status === 'queued') ? null : 'T12 no está en cola'));
  // Aduana Vieja cerrada (DLC 2).
  await d.talkTo(NX.BUILDINGS.aduana.door.x, NX.BUILDINGS.aduana.door.y);
  await d.expectSaid(/Cerrado hasta nueva orden/, 'la Aduana cerrada');
  // Ferri parado y prismáticos: la plataforma del Consorcio.
  await d.talkTo(NX.PORT.ferrySailor.x, NX.PORT.ferrySailor.y);
  await d.expectSaid(/no sale ni un ferri/, 'el ferri parado');
  await d.milestone('ferri_parado', null);
  const watch = [{ re: /plataforma con grúas/, name: 'plataforma_talasa', delay: 300 }];
  await d.talkTo(NX.PORT.binoculars.x, NX.PORT.binoculars.y, { choose: pick('Mirar'), watch });
  await d.expectSaid(/plataforma con grúas/, 'la plataforma del Consorcio');
  await d.milestone('talasa_vista', (s) => (s.flags.b09_nexo_talasa_vista ? null : 'sin ver la plataforma'));
  // Pescador del pantalán: Caña Buena.
  await d.talkTo(NX.PORT.fisher.x, NX.PORT.fisher.y);
  await d.milestone('cana_buena', (s) => (has(s, 'GOODROD') ? null : 'sin Caña Buena'));
  // Hacia la Ruta 15 por el oeste.
  await d.walkTo(0, NX.EXITS.west.y0 + 1);
  await d.crossEdge('left', 'ruta_15');
}

async function ruta15(d) {
  await d.milestone('ruta15', (s) => (s.map === 'ruta_15' ? null : `mapa ${s.map}`));
  const f2 = R15.SPOTS.fishers[1];
  await d.talkTo(f2.x, f2.y, { watch: [{ re: /velas cuadradas/, name: 'mareas', delay: 200 }] });
  await d.milestone('mareas', (s) => (s.flags.b09_r15_mareas ? null : 'sin la historia de las mareas'));
  await d.talkTo(R15.LOOKOUT.binoculars.x, R15.LOOKOUT.binoculars.y, { choose: pick('Mirar') });
  await d.expectSaid(/casas blancas de Caleta Sonda/, 'la vista del mirador');
  const rock = R15.BINACLE_ROCKS[1];
  await d.talkTo(rock.x, rock.y, { watch: [{ scene: 'BattleScene', name: 'binacle', delay: 2500 }] });
  await d.expectSaid(/(Binacle asoma|Barbaracle se despega)/, 'el Binacle de la roca');
  await d.walkTo(0, R15.EXITS.west.y0 + 1);
  await d.crossEdge('left', 'caleta_sonda');
}

async function caleta(d) {
  await d.milestone('caleta', (s) => (s.map === 'caleta_sonda' ? null : `mapa ${s.map}`));
  const ti = CL.BUILDINGS.tienda.door;
  await d.push(ti.x, ti.y + 1, 'up', 'caleta_tienda');
  await d.talk(4, 6, 'left');
  await d.milestone('supercana', (s) => (has(s, 'SUPERROD') ? null : 'sin Supercaña'));
  await d.leave(4, 9, 'down', 'caleta_sonda');
  const fa = CL.BUILDINGS.faro.door;
  await d.push(fa.x, fa.y + 1, 'up', 'caleta_faro');
  await d.talk(4, 6, 'up', { watch: [{ re: /bailan luces/, name: 'ramon', delay: 200 }] });
  await d.milestone('t11_en_cola', (s) => (s.clues.some((c) => c.id === 'T11' && c.status === 'queued') ? null : 'T11 no está en cola'));
  await d.leave(6, 9, 'down', 'caleta_sonda');
  // Muelle de buzos: Ainhoa y el extremo previsto para la resonancia del Buceo (B13).
  const watch = [{ scene: 'BattleScene', name: 'ainhoa', delay: 3000 }];
  await d.walkTo(CL.DIVERS.resonance.x, CL.DIVERS.resonance.y, { watch });
  await d.talkTo(CL.DIVERS.diver.x, CL.DIVERS.diver.y);
  await d.milestone('muelle_buzos', (s) => (s.x === CL.DIVERS.resonance.x && s.y === CL.DIVERS.resonance.y ? null : `(${s.x},${s.y})`));
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
  const logs = []; // la transcripción vive en la página: se guarda antes de cada recarga
  const open = async (start) => {
    logs.push(...await d.log().catch(() => []));
    await page.goto(`${BASE}/?${STARTS[start].toString()}&debug`, { waitUntil: 'load' });
    await installHelpers(page);
    await installB09bHelpers(page, { loseOnce: RETRY && start === 'marisma' ? [LOSE_TECH] : [] });
    await d.until((s) => s.top !== null && (s.top === 'MapScene' || s.busy), { timeout: 30000, what: 'el mapa de arranque' });
  };
  try {
    if (FROM === 'marisma') {
      await open('marisma');
      for (const run of [arrival, remedios, pumps, stakes, dig]) await run(d);
    }
    await open('nexo');
    for (const run of [nexo, ruta15, caleta]) await run(d);
    const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
    if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
  } catch (err) {
    failed = err;
    await d.shot('fallo').catch(() => {});
  }
  const log = [...logs, ...await d.log().catch(() => [])];
  fs.writeFileSync(path.join(OUT, 'e2e_b09b_dialogos.txt'), log.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  await browser.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d.milestones.join(' → ')} (${secs} s; ${log.length} diálogos en tools/cache/screens/e2e_b09b_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 9b completo de principio a fin.');
  }
}

await main();
