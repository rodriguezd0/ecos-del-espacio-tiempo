// Recorrido E2E del Bloque 6 — Pilar del Impulso (docs/CAMPANA.md B06) en navegador real (Chrome headless +
// playwright-core), con teclas reales. Estado de entrada por URL (ARCHITECTURE §9): P1 y P2 restaurados (Fragmentos
// F01–F02), Correr y Embestida, las 24 células A+B, el Core N1, equipo de nivel alto y sin encuentros aleatorios:
//   Ruta 5 (troncos con Embestida, C028) → Meseta (llegada, combate doble con Gael de aliado) → Parque Eólico
//   (dos técnicos, Casia: derrota simulada y reintento en la puerta del Colector; el Colector se rompe: C029–C032,
//   N2, Terreno complicado; Gael y las pantallas) → Anillo (Abril: derrota simulada y reintento; su reto) →
//   Galerías: Flechas (cadena, montar y remontar, C033) y Remolino (dos veletas) → Sala de las Campanas (C034,
//   Norte larga, Este corta, Oeste corta; el vendaval se calma; Abril sube) → núcleo (Fragmento 3, verso III,
//   p3_restored, pista T04, despedida de Abril) → salida y aerogeneradores girando en la Meseta.
// Cada escena se comprueba por sus flags y por su texto en la transcripción. Capturas en
// tools/cache/screens/e2e_b06_<nn>_<hito>.png y transcripción en e2e_b06_dialogos.txt.
// Uso: node tools/e2e_b06.mjs [--base=http://localhost:8080] [--headed] [--no-retry]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB06Helpers } from './e2e_b06_page.mjs';

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

/** Estado de entrada del bloque (CAMPANA B06 «Entrada: Embestida; nivel ~23»; aquí más alto para el piloto). */
const BASE_FLAGS = 'b01_dex_received,b01_left_town,p1_restored,p2_restored,zyg_10,b05_brontia';
const PARQUE_FLAGS = 'b06_meseta_intro,b06_gael_parque,b06_doble_ganado,b06_casia_presentada,b06_casia_vencida,b06_colector_roto,b06_gael_pantallas,b06_gael_se_fue,zyg_core_2';
const entry = (over) => new URLSearchParams({
  scene: 'map', party: 'TORTERRA:38,STARAPTOR:37,LUXRAY:37', fragments: '2', noenc: '1', time: '11',
  vars: 'starter:TURTWIG,gael_starter:LITTEN', ...over,
});
/** Puntos de arranque (--from=…) para depurar un tramo: cada uno preajusta lo anterior por URL. */
const STARTS = {
  ruta5: entry({ map: 'ruta_5', x: '2', y: '19', dir: '6', zygarde: 'run,ram', zcells: '24', zcores: '1', flags: BASE_FLAGS }),
  anillo: entry({ map: 'meseta_impulso', x: '39', y: '13', dir: '8', zygarde: 'run,ram,terrain', zcells: '32', zcores: '2', flags: `${BASE_FLAGS},${PARQUE_FLAGS}` }),
  galerias: entry({ map: 'galerias_soplo', x: '10', y: '28', dir: '8', zygarde: 'run,ram,terrain', zcells: '32', zcores: '2', flags: `${BASE_FLAGS},${PARQUE_FLAGS},b06_abril_conocida,b06_abril_vencida` }),
  sala: entry({ map: 'anillo_vientos', x: '24', y: '17', dir: '2', zygarde: 'run,ram,terrain', zcells: '33', zcores: '2', flags: `${BASE_FLAGS},${PARQUE_FLAGS},b06_abril_conocida,b06_abril_vencida,b06_galerias_vistas`, vars: 'starter:TURTWIG,gael_starter:LITTEN,b06_veleta_remolino_a:3,b06_veleta_remolino_b:1' }),
};
const FROM = (argv.find((a) => a.startsWith('--from=')) || '--from=ruta5').slice(7);
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
      riding: window.__b06.riding(),
      vars: window.__b06.vars(),
      abilities: window.__b06.abilities(),
      cores: window.__b06.cores(),
      fragments: window.__b06.fragments(),
      lost: window.__b06.lost.slice(),
    }));
  }

  async press(key, after = 180) {
    await this.page.keyboard.down(key);
    await this.wait(70);
    await this.page.keyboard.up(key);
    await this.wait(after);
  }

  async hold(key, ms) {
    await this.page.keyboard.down(key);
    await this.wait(ms);
    await this.page.keyboard.up(key);
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
    const file = path.join(OUT, `e2e_b06_${String(this.shots).padStart(2, '0')}_${name}.png`);
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
      if (s.top === 'MessageScene' || s.top === 'VerseScene' || s.top === 'TravelScene') { calm = 0; await this.press('KeyZ', 160); continue; }
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

  /**
   * Camina hasta (x, y) sin pisar ráfagas (salvo el destino si es ráfaga y `onto`). Atiende las escenas que
   * salten por el camino. `stopWhen(s)` corta antes. `face` gira al final.
   */
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
      const route = await this.eval(([tx, ty, o]) => window.__b06.calmRoute(tx, ty, { onto: o }), [x, y, onto]);
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
      await this.step(DIR[dir]);
      const s = await this.snapState();
      if (s.map === toMap) return s;
      if (s.busy || s.top !== 'MapScene') await this.settle();
    }
    throw new Error(`No se cruzó a ${toMap}`);
  }

  async toggleMount(want) {
    const s = await this.snapState();
    if (s.riding === want) return;
    await this.press('KeyE', 400);
    await this.until((st) => st.riding === want, { timeout: 4000, what: want ? 'montar' : 'bajar' });
  }
}

// ───────────────────────────── Recorrido ─────────────────────────────

async function ruta5(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'ruta_5' && s.ready, { timeout: 30000, what: 'la Ruta 5' });
  await d.settle();
  await d.milestone('ruta_5', (s) => (s.cells.length === 24 && s.abilities.ram ? null : `células ${s.cells.length}, ram ${s.abilities.ram}`));
  const watch = [{ scene: 'BattleScene', name: 'ruta5_entrenador', delay: 3500 }];
  await d.walkTo(30, 15, { face: 'right', watch });
  await d.interact({ watch });
  await d.expectSaid(/¿Quieres que Zygarde embista\?/, 'la pregunta de la Embestida');
  if (await d.eval(() => window.__b06.eventAlive('troncos_paso_0') || window.__b06.eventAlive('troncos_paso_1'))) throw new Error('Los troncos del paso siguen en pie');
  await d.milestone('troncos_rotos');
  // C028: tronco del rincón norte y la célula.
  await d.walkTo(41, 11, { face: 'up', watch });
  await d.interact();
  await d.walkTo(41, 5, { watch });
  await d.settle();
  await d.milestone('c028', (s) => (s.cells.includes('cell_ruta_5_1') ? null : 'sin C028'));
  await d.walkTo(59, 14, { watch });
  await d.crossEdge('right', 'meseta_impulso');
  await d.settle();
}

async function meseta(d) {
  await d.walkTo(3, 23, { watch: [{ re: /algo que lo sujeta/, name: 'meseta_llegada', delay: 200 }] });
  await d.settle({ watch: [{ re: /algo que lo sujeta/, name: 'meseta_llegada', delay: 200 }] });
  await d.expectSaid(/Ahí dentro hay algo mío/, 'la llegada a la Meseta');
  const watch = [
    { re: /Tú también lo has notado/, name: 'gael_puerta', delay: 300 },
    { scene: 'BattleScene', name: 'combate_doble', delay: 4500 },
  ];
  await d.walkTo(17, 21, { watch, stopWhen: (s) => s.flags.b06_doble_ganado });
  await d.settle({ watch });
  await d.expectSaid(/Procedimiento de contención/, 'el reto de los técnicos');
  await d.expectSaid(/No ha estado mal/, 'Gael tras el combate doble');
  await d.milestone('doble_ganado', (s) => (s.flags.b06_doble_ganado ? null : 'sin b06_doble_ganado'));
  await d.walkTo(17, 15, { face: 'up' });
  await d.step(8);
  await d.until((s) => s.map === 'parque_eolico' && s.ready, { timeout: 15000, what: 'entrar al Parque' });
  await d.settle();
}

async function parque(d) {
  const watch = [
    { scene: 'BattleScene', name: 'parque_tecnico', delay: 3500 },
    { re: /Somos Genesis/, name: 'casia_genesis', delay: 300 },
  ];
  await d.milestone('parque_almacen');
  await d.walkTo(12, 5, { face: 'up', watch });
  await d.step(8); // empuja la puerta de servicio
  await d.until((s) => s.map === 'parque_eolico' && s.x === 35 && s.y === 13, { timeout: 15000, what: 'sala del Colector' });
  await d.settle({ watch });
  await d.walkTo(35, 11, { watch, stopWhen: (s) => s.flags.b06_casia_presentada || s.lost.includes('b06_casia') });
  await d.settle({ watch });
  await d.expectSaid(/No somos un consorcio\. Somos Genesis\./, 'la presentación de Casia');
  await d.expectSaid(/¿Quién votó a Dialga\?/, 'la doctrina de Genesis');
  if (RETRY) {
    // Derrota simulada: vuelve a la puerta del Colector con el equipo curado y Casia sigue ahí.
    await d.milestone('casia_derrota', (s) => (s.map === 'parque_eolico' && s.x === 35 && s.y === 13 && !s.flags.b06_colector_roto ? null : `tras perder: ${s.map} (${s.x},${s.y})`));
    await d.walkTo(35, 11, { watch, stopWhen: (s) => s.flags.b06_colector_roto });
    await d.settle({ watch });
    await d.expectSaid(/Otra medición/, 'el reintento con Casia');
  }
  await d.expectSaid(/Solo lo estábamos escuchando/, 'la retirada de Casia');
  await d.expectSaid(/Ahora recuerdo cómo se pisa la tierra blanda/, 'la fusión de N2');
  await d.expectSaid(/Cada punto verde es una célula/, 'Gael ante las pantallas');
  await d.milestone('colector_roto', (s) => {
    if (!s.flags.b06_colector_roto || !s.flags.zyg_core_2) return 'sin Colector roto o sin N2';
    if (!['cell_colector_1', 'cell_colector_2', 'cell_colector_3', 'cell_colector_4'].every((c) => s.cells.includes(c))) return 'faltan C029–C032';
    if (!s.abilities.terrain) return 'sin Terreno complicado';
    return s.flags.b06_gael_pantallas ? null : 'Gael no ha visto las pantallas';
  });
  // Salida del Parque: hueco de la sala → almacén → puerta sur.
  await d.walkTo(35, 13);
  await d.step(2);
  await d.until((s) => s.x === 12 && s.y === 5 && s.ready, { timeout: 15000, what: 'volver al almacén' });
  await d.settle();
  await d.walkTo(10, 18);
  await d.step(2);
  await d.press('ArrowDown', 400);
  await d.until((s) => s.map === 'meseta_impulso' && s.ready, { timeout: 15000, what: 'salir a la Meseta' });
  await d.settle();
}

async function anillo(d) {
  await d.walkTo(39, 10);
  await d.step(8);
  await d.until((s) => s.map === 'anillo_vientos' && s.ready, { timeout: 15000, what: 'subir al Anillo' });
  await d.settle();
  await d.milestone('anillo_llegada');
  const watch = [
    { re: /Termina rápido/, name: 'abril_reto', delay: 300 },
    { scene: 'BattleScene', name: 'combate_abril', delay: 4500 },
  ];
  // La boca se abre por arriba: desde (31,23) se empuja hacia abajo.
  const intoMouth = async () => {
    await d.walkTo(31, 23, { watch });
    await d.step(2);
    await d.settle({ watch });
  };
  await intoMouth();
  await d.expectSaid(/Cinco años vigilando una piedra que no hace nada/, 'Abril y su tedio');
  await d.expectSaid(/Termina rápido, que se me enfría la comida/, 'el reto de Abril');
  if (RETRY) {
    await d.milestone('abril_derrota', (s) => (!s.flags.b06_abril_vencida && s.map === 'anillo_vientos' && s.x === 34 && s.y === 24 ? null : `tras perder: ${s.map} (${s.x},${s.y})`));
    await intoMouth();
  }
  await d.milestone('abril_vencida', (s) => (s.flags.b06_abril_vencida ? null : 'sin b06_abril_vencida'));
  await intoMouth();
  await d.until((s) => s.map === 'galerias_soplo' && s.ready, { timeout: 15000, what: 'bajar a las galerías' });
  await d.settle();
}

/** Recorre una lista de acciones del solucionador ('up', 'montar', …) desde la posición actual. */
async function ride(d, actions) {
  for (const a of actions) {
    if (a === 'montar') await d.toggleMount(true);
    else if (a === 'bajar') await d.toggleMount(false);
    else await d.step(DIR[a]);
    await d.settle();
  }
}

async function galerias(d) {
  await d.milestone('flechas');
  // (a) Flechas: bajar al pasillo de la izquierda, dejarse llevar hasta la isla NO, coger C033, río al rellano,
  // montar y remontar la rampa de fuerza 1 hasta la salida.
  await d.walkTo(9, 28);
  await ride(d, ['up']); // la ráfaga lleva al oeste y luego al norte
  let s = await d.snapState();
  if (!(s.x === 4 && s.y === 23)) throw new Error(`Las Flechas no han llevado a la isla NO: (${s.x},${s.y})`);
  await d.walkTo(6, 21);
  await d.settle();
  await d.milestone('c033', (st) => (st.cells.includes('cell_impulso_1') ? null : 'sin C033'));
  await ride(d, ['right']);
  s = await d.snapState();
  if (!(s.x === 12 && s.y === 21)) throw new Error(`El río no ha llevado al rellano: (${s.x},${s.y})`);
  // A pie, la rampa devuelve (pista de Zygarde); montado, se remonta.
  await ride(d, ['up']);
  await d.expectSaid(/Súbete\. A mí no me arrastra/, 'la pista de montar');
  await ride(d, ['montar', 'up', 'up', 'up', 'up']);
  await d.until((st) => st.y <= 17, { timeout: 8000, what: 'salir de las Flechas' });
  await d.milestone('flechas_superada');
  // (b) Remolino: probar el bucle, girar las dos veletas y dejarse llevar hasta el rellano.
  await d.walkTo(8, 9);
  await ride(d, ['down']);
  await d.expectSaid(/da vueltas sobre sí mismo/, 'la pista del bucle');
  await d.walkTo(14, 11, { face: 'left' });
  for (let i = 0; i < 3; i++) await d.interact();
  await d.walkTo(9, 8, { face: 'left' });
  await d.interact();
  const v = (await d.snapState()).vars;
  if ((v.b06_veleta_remolino_a % 4) !== 3 || (v.b06_veleta_remolino_b % 4) !== 1) throw new Error(`Veletas mal giradas: ${JSON.stringify(v)}`);
  await d.milestone('veletas');
  await d.walkTo(8, 9);
  await ride(d, ['down']);
  s = await d.snapState();
  if (!(s.x === 7 && s.y === 5)) throw new Error(`El remolino no ha llevado al rellano: (${s.x},${s.y})`);
  await d.milestone('remolino_superado');
  await ride(d, ['up']);
  await d.until((st) => st.map === 'anillo_vientos' && st.ready, { timeout: 15000, what: 'subir a la Sala' });
  await d.settle();
}

async function sala(d) {
  await d.milestone('sala_llegada', (s) => (s.x === 24 && s.y === 17 ? null : `llegada (${s.x},${s.y})`));
  await d.toggleMount(false);
  // Carril sur (fuerza 2, al oeste) hasta el pasillo del oeste.
  await ride(d, ['up']);
  let s = await d.snapState();
  if (!(s.x === 13 && s.y === 16)) throw new Error(`El carril sur no ha llevado al oeste: (${s.x},${s.y})`);
  // Norte: remontar montado el carril del oeste y pasar por C034.
  await d.walkTo(13, 12);
  await ride(d, ['montar', 'up', 'up', 'up', 'up', 'up']);
  // A pie por la cornisa norte: montado se avanza más deprisa y un paso de más cae en el río de la campana Este.
  await d.toggleMount(false);
  await d.walkTo(21, 7, { face: 'up' });
  s = await d.snapState();
  if (!s.cells.includes('cell_impulso_2')) throw new Error('Sin C034 camino de la campana Norte');
  await d.hold('KeyZ', 1100); // golpe largo
  await d.settle();
  await d.expectSaid(/tañido largo/, 'el golpe largo');
  // Este: el río del norte lleva hasta la campana del este.
  await ride(d, ['right']);
  s = await d.snapState();
  if (!(s.x === 29 && s.y === 12)) throw new Error(`El río norte no ha llevado a la campana Este: (${s.x},${s.y})`);
  await d.turn('right');
  await d.interact();
  await d.expectSaid(/golpe corto/, 'el golpe corto');
  // Oeste: bajar al carril sur y dejarse llevar; subir a la campana del oeste.
  await d.walkTo(29, 15);
  await ride(d, ['down']);
  await d.walkTo(13, 14, { face: 'left' });
  await d.interact({ watch: [{ re: /suenan a la vez/, name: 'campanas', delay: 200 }] });
  await d.settle();
  await d.expectSaid(/Cinco años aquí arriba y nunca las había oído sonar/, 'Abril sube a la Sala');
  await d.milestone('campanas_resueltas', (st) => (st.flags.b06_campanas && st.flags.b06_abril_sala ? null : 'sin b06_campanas'));
  // Núcleo.
  await d.toggleMount(false);
  await d.walkTo(21, 11, { face: 'up', watch: [] });
  await d.interact({ watch: [{ scene: 'VerseScene', name: 'verso_iii', delay: 1200 }] });
  await d.expectSaid(/Fragmento Azur 3/, 'el Fragmento Azur 3');
  await d.expectSaid(/Aquí arriba el viento nunca ha tenido camino/, 'Abril lee el verso');
  await d.expectSaid(/La cuarta tabla duerme entre capas de piedra/, 'la inscripción de T04');
  await d.expectSaid(/Vale\. Esto no es aburrido\./, 'la respuesta de Abril');
  const clues = await d.eval(() => window.__b06.clues());
  const crisis = await d.eval(() => window.__b06.crisis());
  await d.milestone('p3_restaurado', (st) => {
    if (!st.flags.p3_restored || !st.flags.verse_3) return 'sin p3_restored o sin verso III';
    if (!st.fragments.includes('F03')) return 'sin Fragmento 3';
    if (!clues.some((c) => c.id === 'T04')) return 'sin pista T04';
    return crisis === 1 ? null : `crisis ${crisis}`;
  });
}

async function salida(d) {
  // Sin viento: el hueco del sur ya deja pasar en ambos sentidos.
  await d.walkTo(21, 21);
  await d.walkTo(21, 19);
  await d.walkTo(21, 36);
  await d.walkTo(21, 39);
  await d.press('ArrowDown', 500);
  await d.until((s) => s.map === 'meseta_impulso' && s.ready, { timeout: 15000, what: 'bajar a la Meseta' });
  await d.settle();
  await d.walkTo(29, 20);
  await d.turn('up');
  const spinning = await d.eval(() => window.__b06.eventPage('aerogenerador_3'));
  await d.milestone('aerogeneradores_giran', (s) => (s.flags.p3_restored && spinning === 1 ? null : `p3 ${s.flags.p3_restored}, página ${spinning}`));
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
    await installB06Helpers(page, { loseOnce: RETRY ? ['b06_casia', 'b06_abril'] : [] });
    await d.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'el mapa de arranque' });
    const stages = [['ruta5', ruta5], ['meseta', meseta], ['parque', parque], ['anillo', anillo], ['galerias', galerias], ['sala', sala], ['salida', salida]];
    const first = stages.findIndex(([n]) => n === FROM);
    for (const [, run] of stages.slice(first)) await run(d);
    const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
    if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
  } catch (err) {
    failed = err;
    await d.shot('fallo').catch(() => {});
  }
  const log = await d.log().catch(() => []);
  fs.writeFileSync(path.join(OUT, 'e2e_b06_dialogos.txt'), log.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  await browser.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d.milestones.join(' → ')} (${secs} s; ${log.length} diálogos en tools/cache/screens/e2e_b06_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 6 completo de principio a fin.');
  }
}

await main();
