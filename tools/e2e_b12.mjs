// Recorrido E2E del Bloque 12 — Pilar Invertido (P6) (docs/CAMPANA.md B12) en navegador real (Chrome headless +
// playwright-core), con teclas reales. Estado de entrada por URL (ARCHITECTURE §9): B11 terminado (Gael B4, EXP-03),
// P1–P5 (F01–F05), Correr, Embestida, Terreno y Trepar, 49 células, N1+N2, equipo alto y sin encuentros aleatorios.
//   alba      Villa Alba de noche antes del P6: vuelven los temblores (Zygarde lo nota)
//   monte     llegada de día (Zygarde reconoce la piedra) · pozos de sondeo · C050 · repisa (Trepar) y gruta · C051 ·
//             sensores de Genesis · el aljibe responde y se baja al Mundo Distorsión (media vuelta de pantalla)
//   cara      Ancla de la explanada interior · La Cara Vuelta: Ancla, caída al vacío (sin daño, vuelta al poste), tres
//             salas resueltas con el giro de 90° (controles de pantalla) · C052 en la repisa girada · objetos
//   mirada    puentes que solo existen mirándolos · Ancla · girar sobre un puente = caer · salida
//   sumidero  pulsadores y cascadas invertidas · C053 · sombra de Giratina (≈4 s, Zygarde inmóvil) · Gengarita ·
//             dejarse caer desde la isla alta · salida al núcleo
//   nucleo    orden equivocado (se reinicia sin castigo) · veta → ojo → gota · sello · P6 (F06, verso VI) · N3 → 50 %
//   regreso   «Aquí lo empujé. Tres noches.» · aljibe de vuelta al Monte · puerta anclada: se vuelve a bajar (X16)
//   nadar     Nadar en la poza del Monte (C076) · la montañera tras el P6 · Nadar en el estanque de la Ruta 2
//   zaguan    Casilda entrega la Lucarita · Villa Alba de noche ya sin temblores
// Capturas en tools/cache/screens/e2e_b12_<nn>_<hito>.png y transcripción en e2e_b12_dialogos.txt.
// Uso: node tools/e2e_b12.mjs [--base=http://localhost:8080] [--headed] [--from=<tramo>] [--only=<tramo>]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Driver, KEY, dirTo } from './e2e_b12_driver.mjs';
import { MONTE, VESTIBULO, MIRADA, SUMIDERO, NUCLEO } from '../game/src/content/maps/b12/layout.js';
import { facetRoom, facetMapId, MARGIN } from '../game/src/content/maps/b12/rooms.js';
import { facetMasks, decodeAnchor } from '../game/src/world/impossible/logic.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const arg = (n, d) => (argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=').slice(1).join('=');
const BASE = arg('base', 'http://localhost:8080');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));

/** Estado de entrada del bloque (CAMPANA B12 «Entrada: B11»; equipo alto para el piloto). */
const BASE_FLAGS = [
  'b01_woke', 'b01_met_mom', 'b01_lab_intro_seen', 'b01_starter_chosen', 'b01_signal_heard', 'b01_police_entered',
  'b01_core_found', 'b01_escorted', 'b01_gael_duel_done', 'b01_mom_gift', 'b01_dex_received', 'b01_left_town',
  'p1_restored', 'p2_restored', 'p3_restored', 'p4_restored', 'p5_restored', 'zyg_10', 'zyg_core_2', 'b02_salida', 'b02_libreta',
  'b03_gael_b2', 'b05_brontia', 'b07_megaring', 'b09_gala', 'b09_gael_b3', 'b10_llegada', 'b10_niebla_levantada',
  'b10_archivo_abierto', 'b10_informe', 'b11_neblino_intro', 'b11_t10_nilo_visto', 'b11_t10_nilo_cuenta',
  'b11_t10_cuadrilla_vista', 'b11_t10_cuadrilla', 'b11_t10_alfa', 'b11_t10_tablilla', 'b11_nilo_desertor',
  'b11_planos_talasa', 'b11_regreso', 'b11_huevo', 'b11_huevo_aviso', 'b11_gael_alerce', 'b11_campamento_visto',
  'b11_exp03', 'b11_gael_b4', 'b11_cerro_visto',
].join(',');
/** Flags de lo ya recorrido del bloque (para empezar en un tramo intermedio). */
const DONE = {
  monte: 'b12_monte_llegada,b12_aljibe_abierto,b12_interior_visto,b12_ancla_vista',
  cara: 'b12_caida_vista,b12_cara_1_vista,b12_cara_2_vista,b12_cara_3_vista,b12_cara_vuelta',
  mirada: 'b12_mirada_vista,b12_mirada',
  sumidero: 'b12_sumidero_visto,b12_pulsador_1,b12_pulsador_2,b12_pulsador_3,b12_sombra,b12_pista_caida,b12_sumidero',
  nucleo: 'b12_nucleo_visto,b12_sello,p6_restored,zyg_50,zyg_core_3',
  regreso: 'b12_respuesta,b12_regreso',
};
const upTo = (...keys) => keys.map((k) => DONE[k]).join(',');
const entry = (over) => new URLSearchParams({
  scene: 'map', party: 'TORTERRA:66,STARAPTOR:64,LUXRAY:63,LUCARIO:62', fragments: '5', noenc: '1', time: '11',
  zygarde: 'run,ram,terrain,climb', zcells: '49', zcores: '2', vars: 'starter:TURTWIG,gael_starter:LITTEN', ...over,
  flags: [BASE_FLAGS, over?.flags].filter(Boolean).join(','),
});
const AFTER_P6 = { fragments: '6', zcores: '3', zcells: '53', zygarde: 'run,ram,terrain,climb,swim' };
const STARTS = {
  alba: entry({ map: 'villa_alba', x: '22', y: '30', dir: '2', time: '22' }),
  monte: entry({ map: 'montana_portal', x: String(MONTE.arrival.x), y: String(MONTE.arrival.y), dir: '8' }),
  cara: entry({ map: 'pilar_invertido', x: '19', y: '7', dir: '2', zcells: '51', flags: upTo('monte') }),
  mirada: entry({ map: 'pilar_invertido_mirada', x: '5', y: '20', dir: '8', zcells: '52', flags: upTo('monte', 'cara') }),
  sumidero: entry({ map: 'pilar_invertido_sumidero', x: '16', y: '42', dir: '8', zcells: '52', flags: upTo('monte', 'cara', 'mirada') }),
  nucleo: entry({ map: 'pilar_invertido_nucleo', x: '16', y: '25', dir: '8', zcells: '53', flags: upTo('monte', 'cara', 'mirada', 'sumidero') }),
  regreso: entry({ map: 'pilar_invertido_nucleo', x: '16', y: '22', dir: '8', ...AFTER_P6, flags: upTo('monte', 'cara', 'mirada', 'sumidero', 'nucleo') }),
  nadar: entry({ map: 'montana_portal', x: '17', y: '12', dir: '2', ...AFTER_P6, flags: upTo('monte', 'cara', 'mirada', 'sumidero', 'nucleo', 'regreso') }),
  zaguan: entry({ map: 'villa_zaguan', x: '19', y: '3', dir: '2', ...AFTER_P6, flags: upTo('monte', 'cara', 'mirada', 'sumidero', 'nucleo', 'regreso') }),
};
const ORDER = ['alba', 'monte', 'cara', 'mirada', 'sumidero', 'nucleo', 'regreso', 'nadar', 'zaguan'];
/** Tramos que cargan su propia URL aunque se venga del anterior. */
const FRESH = new Set(['alba', 'monte']);
const FROM = arg('from', 'alba');
const ONLY = arg('only', '');
if (!STARTS[FROM]) throw new Error(`--from desconocido: ${FROM} (${ORDER.join(', ')})`);
if (ONLY && !STARTS[ONLY]) throw new Error(`--only desconocido: ${ONLY} (${ORDER.join(', ')})`);

const has = (s, key) => Boolean(s.flags[key]);
const cellsHas = (s, key) => (s.cells.includes(key) ? null : `sin ${key}`);
/** ¿Está el jugador en la casilla guardada por la última Ancla? */
const atAnchor = (s) => {
  const a = decodeAnchor(s.anchor);
  if (!a) return 'sin Ancla';
  return a.map === s.map && a.x === s.x && a.y === s.y ? null : `en ${s.map} (${s.x},${s.y}); Ancla ${s.anchor}`;
};

// ───────────────────────────── utilidades de tramo ─────────────────────────────

/** Espera a que se diga `re` (atendiendo mensajes mientras tanto). */
async function waitSaid(d, re, { timeout = 60000, what = String(re), watch = [] } = {}) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if ((await d.log()).some((l) => re.test(l.text))) return d.settle({ watch });
    const s = await d.snapState();
    if (s.busy || s.top !== 'MapScene') await d.settle({ watch });
    else await d.wait(400);
  }
  throw new Error(`Tiempo agotado esperando que se diga ${what}`);
}

/** Pasos de La Cara Vuelta hacia `goal` hasta que done(s) o el planificador diga «ya está». */
async function facetRun(d, goal, done, watch = []) {
  for (let n = 0; n < 300; n++) {
    const s = await d.snapState();
    if (done(s)) return s;
    const a = await d.eval((g) => window.__b12.facetNext(g), goal);
    if (a === 0) return s;
    if (a === null) throw new Error(`La Cara Vuelta: sin plan hacia ${goal} desde ${s.map} (${s.x},${s.y})`);
    await d.step(a, { watch });
  }
  throw new Error(`La Cara Vuelta: demasiados pasos hacia ${goal}`);
}

/** Recoge un objeto de suelo que está al lado: lo encara y pulsa A. */
async function pickAdjacent(d, eventId, item) {
  const [s, pos] = [await d.snapState(), await d.eval((id) => window.__b12.eventPos(id), eventId)];
  if (!pos) throw new Error(`No existe el objeto ${eventId} en ${s.map}`);
  const before = await d.eval((id) => window.__b12.items(id), item);
  await d.face(dirTo(s.x, s.y, pos.x, pos.y));
  await d.interact();
  const after = await d.eval((id) => window.__b12.items(id), item);
  if (after <= before) throw new Error(`No se recogió ${item} (${eventId})`);
}

/** Pasos de La Mirada hacia (x, y) (o a su lado): girar en firme, avanzar sobre los puentes mirándolos. */
async function gazeRun(d, x, y, { adj = false, watch = [], stopWhen = null } = {}) {
  for (let n = 0; n < 300; n++) {
    const s = await d.snapState();
    if (stopWhen && stopWhen(s)) return s;
    const a = await d.eval(([gx, gy, o]) => window.__b12.gazeNext(gx, gy, { adj: o }), [x, y, adj]);
    if (a === 0) return s;
    if (a === null) throw new Error(`La Mirada: sin plan hacia (${x},${y}) desde (${s.x},${s.y}) dir ${s.dir}`);
    if (a.turn) await d.face(a.turn);
    else await d.step(a.step, { watch });
  }
  throw new Error(`La Mirada: demasiados pasos hacia (${x},${y})`);
}

/** Sube por una cascada invertida abierta (pisa la boca) y espera a la cima. */
async function rideFall(d, fall) {
  await d.walkTo(fall.base.x, fall.base.y, { stopWhen: (s) => s.x === fall.top.x && s.y === fall.top.y });
  await d.until((s) => s.x === fall.top.x && s.y === fall.top.y, { timeout: 15000, what: `subir por la cascada ${fall.id}` });
  return d.settle();
}

/** Se deja caer al vacío desde donde está (o desde `from`) y espera a volver al poste. */
async function dropIntoVoid(d, from = null) {
  const hp = await d.eval(() => window.__b12.hp());
  if (from) {
    // Con la máquina cargada un paso puede alargarse y caer antes de llegar al borde: eso ya es la caída buscada.
    const start = await d.snapState();
    let away = atAnchor(start) !== null; // se empieza lejos del poste (o se sale de él al andar)
    let fell = false;
    const stopWhen = (s) => {
      if (atAnchor(s) !== null) away = true;
      else if (away) fell = true;
      return fell;
    };
    await d.walkTo(from[0], from[1], { stopWhen });
    if (fell) {
      const hpEarly = await d.eval(() => window.__b12.hp());
      if (JSON.stringify(hp) !== JSON.stringify(hpEarly)) throw new Error(`La caída ha cambiado los PS: ${hp} → ${hpEarly}`);
      return d.settle();
    }
  }
  const dir = await d.eval(() => window.__b12.voidDir());
  if (!dir) {
    const s = await d.snapState();
    throw new Error(`No hay vacío junto a (${s.x},${s.y}) en ${s.map}`);
  }
  await d.step(dir, { settle: false });
  await d.until((s) => s.busy || s.top !== 'MapScene', { timeout: 5000, what: 'empezar a caer' });
  const s = await d.settle();
  const hpAfter = await d.eval(() => window.__b12.hp());
  if (JSON.stringify(hp) !== JSON.stringify(hpAfter)) throw new Error(`La caída ha cambiado los PS: ${hp} → ${hpAfter}`);
  return s;
}

// ───────────────────────────── tramos ─────────────────────────────

async function alba(d) {
  await d.milestone('alba_noche', (s) => (s.map === 'villa_alba' ? null : `mapa ${s.map}`));
  await waitSaid(d, /Tiembla otra vez\. Viene del Monte/, { timeout: 90000, what: 'el temblor nocturno', watch: [{ re: /Tiembla otra vez/, name: 'alba_temblor', delay: 100 }] });
  await d.milestone('alba_temblores', (s) => (has(s, 'b12_temblor_visto') ? null : 'sin b12_temblor_visto'));
}

async function monte(d) {
  await d.settle({ watch: [{ re: /piedra donde me rompí/, name: 'monte_llegada', delay: 100 }] });
  await d.expectSaid(/Esta es la piedra donde me rompí\./, 'la llegada al Monte');
  await d.milestone('monte_de_dia', (s) => (has(s, 'b12_monte_llegada') ? null : 'sin llegada'));
  // Pozos de sondeo de Genesis (tras EXP-03).
  const [hx, hy] = MONTE.drillHoles[1];
  await d.approach(hx, hy);
  await d.interact();
  await d.expectSaid(/pozo de sondeo/, 'el pozo de sondeo');
  await d.walkTo(MONTE.cells.C050.x, MONTE.cells.C050.y);
  await d.settle();
  await d.milestone('c050', (s) => cellsHas(s, 'cell_monte_1'));
  // Repisa de la cascada (Trepar) y su gruta.
  const [fx, fy] = MONTE.climb.foot;
  const [tx, ty] = MONTE.climb.top;
  await d.walkTo(fx, fy, { face: 'up' });
  await d.interact();
  await d.until((s) => s.x === tx && s.y === ty, { timeout: 10000, what: 'trepar a la repisa' });
  await d.settle();
  await d.walkTo(tx, ty - 1);
  await d.settle();
  await d.expectSaid(/Desde lo alto del macizo/, 'la vista de la repisa');
  await d.walkTo(MONTE.grutaDoor.x, MONTE.grutaDoor.y + 1);
  await d.step(8);
  await d.arrive('monte_gruta', 'entrar en la gruta');
  await d.milestone('gruta', (s) => (s.map === 'monte_gruta' ? null : s.map));
  await d.step(2);
  await d.arrive('montana_portal', 'salir de la gruta');
  await d.walkTo(tx, ty, { face: 'down' });
  await d.interact();
  await d.until((s) => s.x === fx && s.y === fy, { timeout: 10000, what: 'bajar de la repisa' });
  await d.settle();
  // Mitad de la escalinata (C051, obligatoria) y lo que dejó Genesis junto al aljibe.
  await d.walkTo(MONTE.cells.C051.x, MONTE.cells.C051.y);
  await d.settle();
  await d.milestone('c051', (s) => cellsHas(s, 'cell_monte_2'));
  await d.approach(MONTE.sensor.x, MONTE.sensor.y);
  await d.interact();
  await d.expectSaid(/Midieron desde fuera/, 'los sensores de Genesis');
  // El aljibe responde a Zygarde: se baja al Mundo Distorsión.
  await d.walkTo(MONTE.aljibeFront.x, MONTE.aljibeFront.y, { face: 'up' });
  const watch = [
    { re: /Me reconoce/, name: 'aljibe_responde', delay: 150 },
    { fn: (s) => Math.abs(s.rot) > 1.2, name: 'aljibe_media_vuelta' },
    { re: /Estamos dentro/, name: 'mundo_distorsion', delay: 150 },
  ];
  await d.interact({ watch });
  await d.arrive('pilar_invertido', 'bajar por el aljibe');
  await d.expectSaid(/Me reconoce\./, 'la respuesta del aljibe');
  await d.expectSaid(/Aquí arriba es abajo/, 'la llegada al Mundo Distorsión');
  const pano = await d.eval(() => window.__b12.panorama());
  await d.milestone('explanada_interior', (s) => (s.rot === 0 && pano && has(s, 'b12_interior_visto') ? null : `giro ${s.rot}, panorama ${pano}`));
}

async function cara(d) {
  // Ancla de la explanada interior y portal a La Cara Vuelta.
  await d.bump(VESTIBULO.anchor.x, VESTIBULO.anchor.y);
  await d.milestone('ancla_explanada', (s) => (String(s.anchor).startsWith('pilar_invertido|') ? null : `Ancla ${s.anchor}`));
  await d.walkTo(VESTIBULO.portalCara.x, VESTIBULO.portalCara.y, { stopWhen: (s) => s.map !== 'pilar_invertido' });
  await d.arrive(facetMapId('cara_1', 0), 'entrar en La Cara Vuelta');
  await d.expectSaid(/Aquí la piedra tiene dos caras\./, 'la entrada a la primera sala');
  // Ancla de la sala y caída al vacío: vuelve al poste, sin daño.
  const room = facetRoom('cara_1');
  const m0 = facetMasks(room, 0, MARGIN);
  const [ax, ay] = m0.map(room.anchors[0].x, room.anchors[0].y);
  await d.bump(ax, ay);
  const [sx, sy] = m0.map(room.start.x, room.start.y);
  await dropIntoVoid(d, [sx, sy]);
  await d.expectSaid(/No pasa nada: aquí nada se rompe al caer/, 'la primera caída');
  await d.milestone('cara_caida', (s) => atAnchor(s) || (has(s, 'b12_caida_vista') ? null : 'sin b12_caida_vista'));
  // Sala 1: una arista (la pantalla gira 90° y se carga el gemelo).
  const turnWatch = [{ fn: (s) => Math.abs(s.rot) > 0.5, name: 'cara_giro' }];
  await facetRun(d, 'exit', (s) => s.map === facetMapId('cara_2', 0), turnWatch);
  await d.settle();
  await d.milestone('cara_sala_1', (s) => (s.map === facetMapId('cara_2', 0) ? null : s.map));
  // Sala 2: C052 en la repisa que solo existe girada y el objeto de la repisa.
  await facetRun(d, 'cell', (s) => s.cells.includes('cell_invertido_1'));
  await d.settle();
  await d.milestone('c052', (s) => cellsHas(s, 'cell_invertido_1'));
  await facetRun(d, 'item:objeto_repisa', () => false);
  await pickAdjacent(d, 'objeto_repisa', 'MAXETHER');
  await facetRun(d, 'exit', (s) => s.map === facetMapId('cara_3', 0));
  await d.settle();
  // Sala 3: la espiral (cuatro aristas).
  await facetRun(d, 'item:objeto_espiral', () => false);
  await pickAdjacent(d, 'objeto_espiral', 'FULLRESTORE');
  await facetRun(d, 'exit', (s) => s.map === 'pilar_invertido_mirada');
  await d.arrive('pilar_invertido_mirada', 'salir de La Cara Vuelta');
  await d.milestone('cara_vuelta_hecha', (s) => (has(s, 'b12_cara_vuelta') && s.rot === 0 ? null : `flag ${has(s, 'b12_cara_vuelta')} giro ${s.rot}`));
}

async function mirada(d) {
  await d.settle();
  await d.expectSaid(/Aquí los caminos solo están mientras los miras\./, 'la llegada a La Mirada');
  const anchor = MIRADA.anchors[0];
  await gazeRun(d, anchor.x, anchor.y, { adj: true });
  const s0 = await d.snapState();
  await d.face(dirTo(s0.x, s0.y, anchor.x, anchor.y));
  await d.bump(anchor.x, anchor.y);
  await d.milestone('mirada_ancla', (s) => (String(s.anchor).startsWith('pilar_invertido_mirada|') ? null : `Ancla ${s.anchor}`));
  // Girar encima de un puente: el puente deja de existir y se cae al poste.
  const [bx, by] = MIRADA.bridges[1].from;
  await gazeRun(d, bx, by);
  const visible = await d.eval(() => window.__b12.bridgesVisible());
  await d.shot('mirada_puente');
  if (!visible) throw new Error('Sobre el puente no se ve ninguna losa');
  for (let i = 0; i < 4; i++) {
    await d.press(KEY[8], 150, 25);
    const s = await d.snapState();
    if (s.busy || s.top !== 'MapScene' || s.dir !== 6) break;
  }
  await d.until((s) => s.busy || s.top !== 'MapScene' || s.dir !== 6, { timeout: 4000, what: 'girar sobre el puente' });
  await d.settle();
  await d.milestone('mirada_giro_caida', atAnchor);
  // Salida (isla del noreste).
  await gazeRun(d, MIRADA.exit.x, MIRADA.exit.y, { stopWhen: (s) => s.map !== 'pilar_invertido_mirada' });
  await d.arrive('pilar_invertido_sumidero', 'salir de La Mirada');
  await d.milestone('mirada_hecha', (s) => (has(s, 'b12_mirada') ? null : 'sin b12_mirada'));
}

async function sumidero(d) {
  await d.settle();
  await d.expectSaid(/Aquí el agua cae hacia arriba\./, 'la llegada al Sumidero');
  const [a0, a1] = SUMIDERO.anchors;
  const [W1, W2, W3] = SUMIDERO.falls;
  const [p1, p2, p3] = SUMIDERO.buttons;
  await d.bump(a0.x, a0.y);
  await d.walkTo(p1.x, p1.y);
  await d.settle();
  await d.milestone('sumidero_pulsador_1', (s) => (has(s, 'b12_pulsador_1') ? null : 'sin pulsador'));
  await rideFall(d, W1);
  await d.milestone('sumidero_cascada_1', (s) => (s.x === W1.top.x && s.y === W1.top.y ? null : `(${s.x},${s.y})`));
  await d.bump(a1.x, a1.y);
  await d.walkTo(p2.x, p2.y);
  await d.settle();
  await rideFall(d, W2);
  // La sombra de Giratina cruza el vacío mayor (una vez): la dispara la mitad este de la isla alta, donde está C053
  // (obligatoria), así que salta de camino a la célula o al asomarse al borde. Captura a mitad del cruce (por
  // fotogramas del juego, no por reloj: con la máquina cargada el juego va más lento).
  let still = null;
  const watch = [{ fn: (s) => { if (s.sil > 0 && still === null) still = s.still; return s.silK >= 0.45; }, name: 'sombra_giratina' }];
  await d.walkTo(SUMIDERO.cell.x, SUMIDERO.cell.y, { watch });
  await d.settle({ watch });
  await d.milestone('c053', (s) => cellsHas(s, 'cell_invertido_2'));
  const edge = { x: SUMIDERO.shadowStrip.x, y: 14 };
  if (!has(await d.snapState(), 'b12_sombra')) await d.walkTo(edge.x, edge.y, { watch, stopWhen: (s) => has(s, 'b12_sombra') });
  await d.settle({ watch });
  await d.expectSaid(/No mires\. No nos busca\. Aún\./, 'la frase de Zygarde ante la sombra');
  await d.milestone('sumidero_sombra', (s) => (has(s, 'b12_sombra') && still !== false ? null : `sombra ${has(s, 'b12_sombra')}, Zygarde quieto ${still}`));
  await d.walkTo(p3.x, p3.y);
  await d.settle();
  await d.expectSaid(/Salvo caer/, 'la pista de dejarse caer');
  // Gengarita en el rincón.
  await d.walkTo(SUMIDERO.gengarita.x + 1, SUMIDERO.gengarita.y);
  await d.settle();
  await pickAdjacent(d, 'b12_gengarita', 'GENGARITEX');
  await d.milestone('gengarita', () => null);
  // Desde la isla alta no hay bajada: caer y volver al poste de la isla media.
  await dropIntoVoid(d, [edge.x, edge.y - 1]);
  await d.milestone('sumidero_caida', atAnchor);
  await rideFall(d, W3);
  await d.walkTo(SUMIDERO.exit.x, SUMIDERO.exit.y, { stopWhen: (s) => s.map !== 'pilar_invertido_sumidero' });
  await d.arrive('pilar_invertido_nucleo', 'salir del Sumidero');
  await d.milestone('sumidero_hecho', (s) => (has(s, 'b12_sumidero') ? null : 'sin b12_sumidero'));
}

async function nucleo(d) {
  await d.settle();
  await d.expectSaid(/Tres postes\. Tócalos en el orden/, 'la llegada al núcleo');
  const [veta, ojo, gota] = NUCLEO.anchors;
  // Orden equivocado: el sello se abre más y se empieza de nuevo (sin castigo).
  await d.bump(ojo.x, ojo.y);
  await d.expectSaid(/No\. Así se abre más\./, 'el aviso del orden equivocado');
  const order0 = await d.eval(() => window.__b12.vars().b12_nucleo_orden ?? 0);
  if (order0 !== 0) throw new Error(`El orden no se reinició: ${order0}`);
  await d.bump(veta.x, veta.y);
  await d.bump(ojo.x, ojo.y);
  await d.milestone('nucleo_dos_anclas', async () => {
    const n = await d.eval(() => window.__b12.vars().b12_nucleo_orden);
    return n === 2 ? null : `orden ${n}`;
  });
  const watch = [
    { scene: 'VerseScene', name: 'verso_vi', delay: 1500 },
    { re: /…Vuelve\./, name: 'n3_libre', delay: 200 },
  ];
  await d.bump(gota.x, gota.y, { watch });
  await d.expectSaid(/Arriba, muy lejos, el aljibe deja de gemir/, 'el efecto local del Pilar');
  const z = await d.eval(() => ({ form: window.__b12.form(), swim: window.__b12.ability('swim'), cores: window.__b12.cores(), fragments: window.__b12.fragments() }));
  await d.milestone('p6_restaurado', (s) => {
    if (!has(s, 'p6_restored')) return 'sin p6_restored';
    if (!z.fragments.includes('F06')) return `Fragmentos ${z.fragments}`;
    if (!z.cores.includes('N3')) return `núcleos ${z.cores}`;
    return z.form === '50' && z.swim ? null : `forma ${z.form}, Nadar ${z.swim}`;
  });
}

async function regreso(d) {
  await d.walkTo(NUCLEO.portalBack.x, NUCLEO.portalBack.y, { stopWhen: (s) => s.map !== 'pilar_invertido_nucleo' });
  await d.arrive('pilar_invertido', 'volver a la explanada interior');
  await d.settle({ watch: [{ re: /Aquí lo empujé/, name: 'respuesta', delay: 150 }] });
  await d.expectSaid(/Aquí lo empujé\. Tres noches\./, 'la Respuesta de Zygarde');
  await d.expectSaid(/Tú has vuelto\./, 'la gratitud de Zygarde');
  await d.milestone('respuesta', (s) => (has(s, 'b12_respuesta') ? null : 'sin b12_respuesta'));
  // Aljibe de vuelta al Monte.
  await d.approach(VESTIBULO.aljibe.x, VESTIBULO.aljibe.y);
  await d.interact();
  await d.arrive('montana_portal', 'subir al Monte');
  await d.expectSaid(/La puerta ya no necesita a nadie dentro/, 'el regreso al Monte');
  await d.milestone('monte_tras_p6', (s) => (has(s, 'b12_regreso') ? null : 'sin b12_regreso'));
  // Puerta anclada: se puede volver a bajar (X16) y subir otra vez.
  await d.walkTo(MONTE.aljibeFront.x, MONTE.aljibeFront.y, { face: 'up' });
  await d.interact();
  await d.arrive('pilar_invertido', 'volver a bajar por el aljibe');
  await d.expectSaid(/¿Vuelves a bajar al otro lado\?|Ya no se filtra nada/, 'el aljibe en calma');
  await d.milestone('aljibe_reentrada', (s) => (s.map === 'pilar_invertido' ? null : s.map));
  await d.approach(VESTIBULO.aljibe.x, VESTIBULO.aljibe.y);
  await d.interact();
  await d.arrive('montana_portal', 'subir al Monte otra vez');
}

async function nadar(d) {
  // Nadar (50 %) en la poza al pie de la cascada: C076.
  const c = MONTE.cells.C076;
  const shore = await d.eval(([x, y]) => window.__b12.shoreNear(x, y), [c.x, c.y]);
  if (!shore) throw new Error('No hay orilla junto a la poza');
  await d.walkTo(shore.x, shore.y, { face: shore.dir });
  await d.interact();
  await d.until((s) => !s.busy, { timeout: 8000, what: 'meterse en el agua' });
  const surf = await d.eval(() => window.__b12.surfing());
  if (!surf) throw new Error('No se pudo nadar en la poza del Monte');
  await d.walkTo(c.x, c.y);
  await d.settle();
  await d.milestone('c076_nadar', (s) => cellsHas(s, 'cell_monte_3'));
  await d.walkTo(shore.x, shore.y);
  await d.settle();
  // La montañera, ya sin temblores.
  await d.approach(MONTE.hiker.x, MONTE.hiker.y);
  await d.interact();
  await d.expectSaid(/La montaña se ha quedado quieta/, 'la montañera tras el P6');
  // Nadar también en el agua de un mapa de otro bloque (estanque de la Ruta 2, B03).
  await d.eval(() => window.__b12.warp('ruta_2', 14, 2, 2));
  await d.arrive('ruta_2', 'saltar a la Ruta 2');
  const pond = await d.eval(() => window.__b12.shoreNear(21, 31));
  if (!pond) throw new Error('No hay orilla junto al estanque de la Ruta 2');
  await d.walkTo(pond.x, pond.y, { face: pond.dir });
  await d.interact();
  await d.until((s) => !s.busy, { timeout: 8000, what: 'meterse en el estanque' });
  const surf2 = await d.eval(() => window.__b12.surfing());
  await d.milestone('nadar_ruta_2', () => (surf2 ? null : 'no se nada en la Ruta 2'));
}

async function zaguan(d) {
  const s0 = await d.snapState();
  if (s0.map !== 'villa_zaguan') {
    await d.eval(() => window.__b12.setHour(11));
    await d.eval(() => window.__b12.warp('villa_zaguan', 19, 3, 2));
    await d.until((s) => s.map === 'villa_zaguan' && s.ready, { timeout: 20000, what: 'llegar a Villa Zaguán' });
  }
  await d.settle({ watch: [{ re: /Mi marido la encontró/, name: 'casilda_lucarita', delay: 150 }] });
  await d.expectSaid(/Toma\. Mi marido la encontró hace años\. Ahora sé para quién era\./, 'la frase de Casilda');
  const lucarita = await d.eval(() => window.__b12.items('LUCARIONITE'));
  await d.milestone('lucarita', (s) => (has(s, 'b12_lucarita') && lucarita === 1 ? null : `flag ${has(s, 'b12_lucarita')}, Lucarita ${lucarita}`));
  // Villa Alba de noche, ya sin temblores.
  await d.eval(() => window.__b12.setHour(22));
  await d.eval(() => window.__b12.warp('villa_alba', 22, 30, 2));
  await d.arrive('villa_alba', 'volver a Villa Alba');
  const before = (await d.log()).filter((l) => /Tiembla otra vez/.test(l.text)).length;
  const alive = await d.eval(() => window.__b12.eventAlive('b12_temblor_nocturno'));
  await d.wait(15000);
  await d.settle();
  const after = (await d.log()).filter((l) => /Tiembla otra vez/.test(l.text)).length;
  await d.milestone('alba_sin_temblores', () => (!alive && after === before ? null : `temblor activo ${alive}, textos ${before}→${after}`));
}

const STAGES = { alba, monte, cara, mirada, sumidero, nucleo, regreso, nadar, zaguan };

// ───────────────────────────── Principal ─────────────────────────────

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME, headless: !argv.includes('--headed'),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
  const errors = [];
  const t0 = Date.now();
  let failed = null;
  let d = null;
  const transcript = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();
    page.on('pageerror', (err) => errors.push(`[pageerror] ${err.stack || err.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[error] ${msg.text()}`); });
    page.on('response', (res) => { if (res.status() >= 400) errors.push(`[http ${res.status()}] ${res.url()}`); });
    d = new Driver(page, errors, { outDir: OUT, root: ROOT, prefix: 'e2e_b12' });
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
    const log = [...transcript, ...(await d.log().catch(() => []))];
    fs.writeFileSync(path.join(OUT, 'e2e_b12_dialogos.txt'), log.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
    console.log(`Hitos: ${d.milestones.join(' → ')} (${Math.round((Date.now() - t0) / 1000)} s; ${log.length} diálogos en tools/cache/screens/e2e_b12_dialogos.txt)`);
  } finally {
    await browser.close();
  }
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 12 completo de principio a fin.');
  }
}

await main();
