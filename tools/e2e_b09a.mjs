// Recorrido E2E del Bloque 9a — Ruta 7, Ciudad Lúmina (museo, gala, Gael B3) y Reserva del Delta (docs/CAMPANA.md
// B09 parte A; TABLILLAS T06 y T07) en navegador real (Chrome headless + playwright-core), con teclas reales.
// Estado de entrada por URL (ARCHITECTURE §9): P1–P4 restaurados (Fragmentos F01–F04), Correr, Embestida y Terreno,
// N1+N2, células A–C, equipo alto, de día y sin encuentros aleatorios; se añaden por la API los dos fósiles de Fermín
// (regalo de B08). Recorrido:
//   Ruta 7 desde Estrato (el Core y la Sima; Paso del Derrumbe despejado; C041 bajo el andén, con Terreno) →
//   Lúmina: invitación automática y gala en el Hotel Mirador (Vértice, Gael, Rosalía: pista T06) →
//   Gael B3 en la escalinata (derrota simulada: la historia sigue) →
//   Centro: Iván (pista T07) → Ruta 14: la guarda deja pasar; la colmena (segunda pista); tres obreras y tres flores;
//   Vespiquen Alfa (derrota simulada y reintento) → Tabla Bicho, Scolipedita, Reserva abierta →
//   Hotel: descansar hasta la noche → Museo: Rosalía (segunda pista de T06) → sótano: báscula y ficha de 1962 →
//   galería: foto → sala de Antea: calco y vitrina → Sala de Réplicas: un error («No», la sala se reinicia) y la
//   original → persecución al muelle, combate doble (derrota simulada y reintento) → Tabla Acero, Eevee, pista T08 →
//   ficha de la Laguna Clara → guardería (Piedra Oval y Audinita) → tienda de trastos (Rotom de noche) →
//   descansar hasta la mañana → paleontólogo (Cranidos) → Sala de las Crónicas (Rosalía lee).
// Capturas tools/cache/screens/e2e_b09a_<nn>_<hito>.png y transcripción e2e_b09a_dialogos.txt.
// Uso: node tools/e2e_b09a.mjs [--base=http://localhost:8080] [--headed] [--no-retry] [--from=ruta7|t07|t06]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB09aHelpers } from './e2e_b09a_page.mjs';

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

const BASE_FLAGS = 'b01_dex_received,b01_left_town,p1_restored,p2_restored,p3_restored,p4_restored,zyg_10,zyg_core_2,b05_brontia,b07_megaring';
const GALA_FLAGS = 'b09_r7_llegada,b09_gala_invitacion,b09_gala,b09_gael_b3';
const T07_FLAGS = 'b09_ivan,b09_reserva_paso,b09_t07_colmena,b09_t07_flor_pradera,b09_t07_flor_ribera,b09_t07_flor_huerto,b09_t07_flores,b09_t07_alfa,b09_t07_tablilla,b09_scolipedita,b09_reserva_abierta';
const entry = (over) => new URLSearchParams({
  scene: 'map', party: 'STARAPTOR:58,TORTERRA:58,LUXRAY:56,LUCARIO:56', fragments: '4', noenc: '1', time: '11',
  zygarde: 'run,ram,terrain', zcells: '40', zcores: '2', vars: 'starter:TURTWIG,gael_starter:LITTEN', ...over,
});
const STARTS = {
  ruta7: entry({ map: 'ruta_7', x: '87', y: '17', dir: '4', flags: BASE_FLAGS }),
  t07: entry({ map: 'ciudad_lumina', x: '57', y: '44', dir: '8', flags: `${BASE_FLAGS},${GALA_FLAGS}` }),
  t06: entry({ map: 'ciudad_lumina', x: '43', y: '9', dir: '8', flags: `${BASE_FLAGS},${GALA_FLAGS},${T07_FLAGS}` }),
};
const FROM = (argv.find((a) => a.startsWith('--from=')) || '--from=ruta7').slice(7);
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
      vars: window.__b09a.vars(),
      clues: window.__b09a.clues(),
      tablets: window.__b09a.tablets(),
      partyList: window.__b09a.party(),
      choices: window.__b09a.choiceItems(),
      choiceReady: window.__b09a.choiceReady(),
      kept: window.__b09a.kept(),
      lost: window.__b09a.lost.slice(),
      hour: window.__b09a.hour(),
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
    const file = path.join(OUT, `e2e_b09a_${String(this.shots).padStart(2, '0')}_${name}.png`);
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
      // Caja abierta a la espera de su elección (keepOpen): no pulsar, o la A llegaría a la ventana de opciones.
      if (s.top === 'MessageScene' && s.kept) { calm = 0; await this.wait(120); continue; }
      if (['MessageScene', 'VerseScene', 'TravelScene', 'ObtainScene'].includes(s.top)) { calm = 0; await this.press('KeyZ', 160); continue; }
      if (s.top === 'ChoiceScene') {
        calm = 0;
        await this.pickChoice(choose(s));
        continue;
      }
      if (s.top === 'MapScene' && s.ready && !s.busy && !s.playerBusy) {
        calm += 1;
        if (calm >= 4) return s;
      } else if (s.top !== 'MapScene' && s.top !== 'BattleScene' && !s.busy) {
        // Pantallas intermedias (tarjetas de viaje, placas): se cierran con A.
        calm = 0;
        await this.press('KeyZ', 200);
      } else calm = 0;
      await this.wait(150);
    }
    throw new Error(`settle: el mapa no queda libre\n${JSON.stringify(await this.snapState())}`);
  }

  /** Mueve el cursor de la ventana de opciones hasta `want` (comprobándolo: la ventana puede tardar en aceptar teclas). */
  async pickChoice(want) {
    for (let tries = 0; tries < 12; tries++) {
      const s = await this.snapState();
      if (s.top !== 'ChoiceScene') return;
      if (s.choiceReady && s.choiceIndex === want) { await this.press('KeyZ', 250); return; }
      if (!s.choiceReady) { await this.wait(100); continue; }
      await this.press(s.choiceIndex < want ? 'ArrowDown' : 'ArrowUp', 140);
    }
    throw new Error(`No se pudo elegir la opción ${want}`);
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
      const route = await this.eval(([tx, ty, o]) => window.__b09a.route(tx, ty, { onto: o }), [x, y, onto]);
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

  /** Va a (x, y), mira hacia `dir` y habla. */
  async talk(x, y, dir, opts = {}) {
    await this.walkTo(x, y, { face: dir, choose: opts.choose });
    return this.interact(opts);
  }

  /** Empuja contra una puerta (warp sobre casilla no transitable) o pisa una alfombra de salida. */
  async push(x, y, dir, toMap) {
    // Si la ruta pisa la puerta de camino (o ya se estaba dentro), el cambio de mapa llega antes: no seguir andando.
    const s0 = await this.walkTo(x, y, { stopWhen: (s) => s.map === toMap });
    if (s0.map === toMap) {
      await this.until((s) => s.map === toMap && s.ready, { timeout: 15000, what: `entrar en ${toMap}` });
      return this.settle();
    }
    for (let i = 0; i < 4; i++) {
      await this.step(DIR[dir]);
      let s = await this.snapState();
      if (s.map === toMap) break;
      if (s.busy || s.top !== 'MapScene') s = await this.settle();
      if (s.map === toMap) break;
    }
    await this.until((s) => s.map === toMap && s.ready, { timeout: 15000, what: `entrar en ${toMap}` });
    return this.settle();
  }

  /** Empuja o pisa una puerta que lleva a otra casilla del MISMO mapa (salas de la galería). */
  async pushTo(x, y, dir, tx, ty) {
    const s0 = await this.walkTo(x, y, { stopWhen: (s) => s.x === tx && s.y === ty });
    for (let i = 0; i < 4 && !(s0.x === tx && s0.y === ty); i++) {
      await this.step(DIR[dir]);
      let s = await this.snapState();
      if (s.busy || s.top !== 'MapScene' || s.playerBusy) s = await this.settle();
      if (s.x === tx && s.y === ty) break;
    }
    await this.until((s) => s.x === tx && s.y === ty && s.ready, { timeout: 15000, what: `llegar a (${tx},${ty})` });
    return this.settle();
  }

  /** Sale por una alfombra: se coloca en (x, y) y pulsa hacia `dir` hasta cambiar a `toMap`. */
  async leave(x, y, dir, toMap) {
    const s0 = await this.walkTo(x, y, { stopWhen: (s) => s.map === toMap });
    if (s0.map !== toMap) await this.step(DIR[dir]);
    await this.until((s) => s.map === toMap && s.ready, { timeout: 15000, what: `salir a ${toMap}` });
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

const pick = (label) => (s) => { const i = s.choices.findIndex((c) => c === label || c.startsWith(label)); return i < 0 ? 0 : i; };

// ───────────────────────────── Recorrido ─────────────────────────────

async function ruta7(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'ruta_7' && s.ready, { timeout: 30000, what: 'la Ruta 7' });
  await d.settle();
  await d.walkTo(84, 17);
  const rubble = await d.eval(() => window.__b09a.eventAlive('derrumbe_76_17'));
  await d.milestone('ruta7_paso_despejado', (s) => (!rubble && s.flags.b09_r7_llegada ? null : 'el derrumbe sigue en pie'));
  // C041 bajo el andén abandonado (barro: Terreno complicado)
  await d.walkTo(38, 13);
  await d.walkTo(38, 11);
  await d.settle();
  await d.milestone('c041', (s) => (s.cells.includes('cell_ruta_7_1') ? null : 'sin C041'));
  await d.walkTo(0, 21);
  await d.crossEdge('left', 'ciudad_lumina');
}

async function gala(d) {
  const watch = [{ re: /acompañante verde/, name: 'botones', delay: 200 }, { re: /mecenas de esta gala/, name: 'gala', delay: 200 },
    { re: /Así que tú eres quien lleva/, name: 'vertice', delay: 200 }, { re: /Rosalía Quintana/, name: 'rosalia', delay: 200 }];
  await d.until((s) => s.map === 'lumina_hotel' || s.busy, { timeout: 20000, what: 'la invitación a la gala' });
  await d.settle({ watch });
  await d.expectSaid(/Lúmina le debe mucho a la gente que escucha a las piedras/, 'la frase de Vértice');
  await d.expectSaid(/migraciones de Staravia/, 'el elogio del informe de Gael');
  await d.expectSaid(/Ven al museo de noche/, 'la pista de Rosalía');
  await d.milestone('gala', (s) => (s.flags.b09_gala && s.clues.some((c) => c.id === 'T06') ? null : 'sin gala o sin pista T06'));
  await d.leave(13, 20, 'down', 'ciudad_lumina');
}

async function gaelB3(d) {
  const watch = [{ re: /Vértice ha leído mi informe/, name: 'gael_escalinata', delay: 200 }, { scene: 'BattleScene', name: 'combate_gael', delay: 3500 }];
  await d.walkTo(35, 29);
  await d.walkTo(35, 28, { watch });
  await d.settle({ watch });
  await d.expectSaid(/Combate\./, 'el reto de Gael');
  await d.milestone('gael_b3', (s) => {
    if (!s.flags.b09_gael_b3) return 'sin b09_gael_b3';
    if (RETRY && s.flags.b09_gael_b3_ganado) return 'la derrota simulada no se aplicó';
    return null;
  });
  if (RETRY) await d.expectSaid(/Esta vez no/, 'la frase de Gael tras la derrota del jugador');
}

async function t07(d) {
  // Iván en el Centro
  await d.push(57, 44, 'up', 'lumina_centro');
  await d.talk(7, 8, 'left', { watch: [{ re: /Soy Iván/, name: 'ivan', delay: 200 }] });
  await d.milestone('t07_pista', (s) => (s.flags.b09_ivan && s.clues.some((c) => c.id === 'T07') ? null : 'sin pista T07'));
  await d.leave(9, 12, 'down', 'ciudad_lumina');
  // Ruta 14 y la puerta de la Reserva
  await d.walkTo(35, 63);
  await d.crossEdge('down', 'ruta_14_reserva');
  await d.walkTo(35, 35);
  await d.walkTo(37, 35, { stopWhen: (s) => s.flags.b09_reserva_paso });
  await d.settle();
  await d.expectSaid(/Iván me ha dicho que vendrías/, 'la guarda de la Reserva');
  // La colmena: segunda pista
  await d.walkTo(40, 30, { watch: [{ re: /losa de piedra gris/, name: 'colmena', delay: 200 }] });
  await d.settle();
  await d.expectSaid(/Síguelas/, 'la pista de las obreras');
  await d.milestone('t07_colmena', (s) => (s.clues.some((c) => c.id === 'T07' && c.step === 2) ? null : 'sin segunda pista de T07'));
  // Tres obreras y tres flores
  await d.talk(42, 28, 'up');
  await d.talk(54, 27, 'up');
  await d.talk(41, 25, 'left');
  await d.talk(51, 23, 'up');
  await d.talk(38, 30, 'up');
  await d.talk(43, 46, 'up');
  await d.milestone('t07_flores', (s) => (['b09_t07_flor_pradera', 'b09_t07_flor_ribera', 'b09_t07_flor_huerto'].every((f) => s.flags[f]) ? null : 'faltan flores'));
  // La reina: Vespiquen Alfa (derrota simulada y reintento)
  const watch = [{ re: /¡La reina sale de la colmena!/, name: 'reina', delay: 200 }, { scene: 'BattleScene', name: 'vespiquen_alfa', delay: 3500 }];
  await d.talk(40, 29, 'up', { watch });
  if (RETRY) {
    await d.milestone('t07_reintento', (s) => (s.lost.includes('VESPIQUEN') && !s.flags.b09_t07_tablilla && s.x === 40 && s.y === 29 ? null : `tras perder: (${s.x},${s.y})`));
    await d.turn('up');
    await d.interact({ watch });
  }
  await d.expectSaid(/Es una de ellas/, 'el Core reconoce la Tablilla');
  await d.milestone('t07_tablilla', (s) => {
    if (!s.tablets.includes('INSECTPLATE')) return 'sin Tabla Bicho';
    if (!s.flags.b09_reserva_abierta || !s.flags.b09_scolipedita) return 'sin Reserva abierta o sin Scolipedita';
    return null;
  });
  // Vuelta a Lúmina
  await d.walkTo(29, 1);
  await d.crossEdge('up', 'ciudad_lumina');
}

async function nightRest(d, slot) {
  await d.push(43, 9, 'up', 'lumina_hotel');
  await d.talk(18, 16, 'right', { choose: (s) => (s.choices.includes(slot) ? s.choices.indexOf(slot) : pick('Descansar')(s)) });
  await d.leave(13, 20, 'down', 'ciudad_lumina');
}

async function t06(d) {
  await nightRest(d, 'Noche');
  await d.milestone('noche', (s) => (s.hour >= 20 || s.hour < 6 ? null : `hora ${s.hour}`));
  // Museo, ala derecha: Rosalía
  await d.push(37, 23, 'up', 'lumina_museo');
  await d.expectSaid(/cambiado todas las etiquetas/, 'la segunda pista de T06');
  await d.milestone('t06_noche', (s) => (s.flags.b09_t06_noche && s.clues.some((c) => c.id === 'T06' && c.step === 2) ? null : 'sin segunda pista de T06'));
  // Sótano: báscula y ficha de 1962
  await d.push(30, 14, 'right', 'lumina_museo_taller');
  await d.talk(20, 6, 'up');
  await d.talk(3, 16, 'up');
  // Galería: foto; sala de Antea: calco y vitrina
  await d.push(3, 4, 'left', 'lumina_museo');
  await d.leave(28, 16, 'down', 'ciudad_lumina');
  await d.push(36, 23, 'up', 'lumina_museo');
  await d.push(8, 15, 'right', 'lumina_museo_galeria');
  await d.talk(14, 4, 'up');
  await d.pushTo(2, 5, 'up', 34, 11);
  await d.talk(32, 4, 'up');
  await d.talk(34, 5, 'up');
  await d.milestone('t06_pistas', (s) => ((Number(s.vars.b09_t06_pistas) & 31) === 31 ? null : `pistas ${s.vars.b09_t06_pistas}`));
  await d.pushTo(34, 12, 'down', 4, 5);
  await d.push(19, 13, 'left', 'lumina_museo');
  await d.leave(19, 16, 'down', 'ciudad_lumina');
  await d.push(37, 23, 'up', 'lumina_museo');
  await d.push(30, 14, 'right', 'lumina_museo_taller');
  // Sala de Réplicas: un error y la original
  const pallets = [[4, 7], [7, 7], [10, 7], [4, 11], [7, 11], [10, 11]];
  const yes = pick('Sí');
  if (RETRY) {
    const w = await d.eval(() => window.__b09a.wrongPos());
    await d.talk(pallets[w][0], pallets[w][1] + 1, 'up', { choose: yes });
    await d.expectSaid(/^No\.$/, 'el «No» de Rosalía');
    await d.milestone('t06_error', (s) => (Number(s.vars.b09_t06_intento) === 1 && s.x === 7 && s.y === 13 ? null : `tras el error (${s.x},${s.y})`));
  }
  const o = await d.eval(() => window.__b09a.originalPos());
  await d.talk(pallets[o][0], pallets[o][1] + 1, 'up', { choose: yes, watch: [{ re: /Cuarenta años mirándola/, name: 'rosalia_confirma', delay: 200 }] });
  await d.milestone('t06_original', (s) => (s.flags.b09_t06_original && s.flags.b09_t06_persecucion ? null : 'sin la original'));
  // Muelle de carga
  const watch = [{ scene: 'BattleScene', name: 'combate_muelle', delay: 3500 }];
  await d.walkTo(19, 15, { watch, stopWhen: (s) => s.flags.b09_t06_restauradores || s.lost.length > 0 && s.lost.includes('b09a_restaurador_bruno') });
  await d.settle({ watch });
  if (RETRY && !(await d.snapState()).flags.b09_t06_restauradores) {
    await d.milestone('muelle_reintento', (s) => (s.x === 17 && s.y === 15 ? null : `tras perder: (${s.x},${s.y})`));
    await d.walkTo(19, 15, { watch, stopWhen: (s) => s.flags.b09_t06_restauradores });
    await d.settle({ watch });
  }
  await d.expectSaid(/El museo no puede protegerla; tú sí\./, 'la frase de Rosalía');
  await d.milestone('t06_tablilla', (s) => {
    if (!s.tablets.includes('IRONPLATE')) return 'sin Tabla Acero';
    if (!s.partyList.includes('EEVEE')) return 'sin Eevee';
    if (!s.clues.some((c) => c.id === 'T08')) return 'sin pista T08';
    return null;
  });
  // Ficha de la Laguna Clara
  await d.talk(7, 16, 'up');
  await d.expectSaid(/Nunca publicaron nada\./, 'la ficha de la Laguna Clara');
  await d.milestone('ficha_laguna', (s) => (s.flags.b09_ficha_laguna ? null : 'sin ficha'));
  await d.leave(29, 17, 'down', 'ciudad_lumina');
}

async function gifts(d) {
  // Guardería: Piedra Oval y Audinita
  await d.push(53, 9, 'up', 'lumina_guarderia');
  await d.talk(9, 6, 'up');
  await d.interact();
  await d.milestone('guarderia', (s) => (s.flags.b09_piedra_oval && s.flags.b09_audinita ? null : 'sin regalos de la guardería'));
  await d.leave(7, 10, 'down', 'ciudad_lumina');
  // Tienda de trastos: Rotom de noche
  await d.push(5, 9, 'up', 'lumina_trastos');
  await d.talk(3, 5, 'up', { watch: [{ re: /Un Rotom sale de la tele/, name: 'rotom', delay: 200 }] });
  await d.milestone('rotom', (s) => (s.flags.b09_rotom && s.partyList.includes('ROTOM') ? null : 'sin Rotom'));
  await d.leave(7, 10, 'down', 'ciudad_lumina');
  // De día: fósil y Sala de las Crónicas
  await nightRest(d, 'Mañana');
  await d.push(37, 23, 'up', 'lumina_museo');
  await d.talk(27, 7, 'up', { choose: () => 0 });
  await d.milestone('fosil', (s) => (s.flags.b09_fosil_craneo || s.flags.b09_fosil_coraza ? null : 'sin fósil revivido'));
  await d.leave(28, 16, 'down', 'ciudad_lumina');
  await d.push(36, 23, 'up', 'lumina_museo');
  await d.push(8, 15, 'right', 'lumina_museo_galeria');
  await d.pushTo(21, 5, 'up', 43, 11);
  await d.talk(44, 11, 'up', { choose: () => 0 });
  await d.expectSaid(/Los Custodios escribían para no olvidar/, 'Rosalía lee la Crónica');
  await d.milestone('cronicas', (s) => (s.map === 'lumina_museo_galeria' ? null : `mapa ${s.map}`));
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
    await installB09aHelpers(page, { loseOnce: RETRY ? ['gael_3', 'VESPIQUEN', 'b09a_restaurador_bruno'] : [] });
    await d.until((s) => s.top !== null && (s.top === 'MapScene' || s.busy), { timeout: 30000, what: 'el mapa de arranque' });
    await d.eval(() => { window.__b09a.addItem('SKULLFOSSIL', 1); window.__b09a.addItem('ARMORFOSSIL', 1); });
    const stages = [['ruta7', ruta7], ['gala', gala], ['gael', gaelB3], ['t07', t07], ['t06', t06], ['gifts', gifts]];
    const first = { ruta7: 0, t07: 3, t06: 4 }[FROM];
    for (const [, run] of stages.slice(first)) await run(d);
    const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
    if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
  } catch (err) {
    failed = err;
    await d.shot('fallo').catch(() => {});
  }
  const log = await d.log().catch(() => []);
  fs.writeFileSync(path.join(OUT, 'e2e_b09a_dialogos.txt'), log.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  await browser.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d.milestones.join(' → ')} (${secs} s; ${log.length} diálogos en tools/cache/screens/e2e_b09a_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 9a completo de principio a fin.');
  }
}

await main();
