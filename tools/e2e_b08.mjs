// Recorrido E2E del Bloque 8 — Pilar de la Masa (docs/CAMPANA.md B08; TABLILLAS T05) en navegador real (Chrome
// headless + playwright-core), con teclas reales. Estado de entrada por URL (ARCHITECTURE §9): P1–P3 y B07 hechos,
// Correr, Embestida y Terreno complicado, 35 células, equipo fuerte sin encuentros aleatorios; jugadora (textos en
// femenino; --gender=M para el masculino).
//   Estrato (temblor de llegada, discusión ante la mina) → Mina Galena (técnicos: derrota simulada y reintento;
//   Garrido y Fermín; C036) → Dunas de Ceniza (ceniza honda con Terreno; C037) → Cerro Plomo (Fermín abre la verja)
//   → Pilar, piso 1 (Blanca y Octavio) → piso 2: Cámara de los Contrapesos (bloques a pie por el puente, C040, caída montado por el suelo quebradizo, C039, placa
//   y plataforma, piedras, Balanza con el jugador montado en el platillo C) → Fermín (derrota simulada y reintento)
//   → piso 3, núcleo: restorePillar(4), verso IV, T05 → vuelta a Estrato: cooperativa, fósiles, segunda pista de T05 →
//   T05: Herminia, torneo (derrota en la 2.ª ronda y torneo reiniciado), noche con Sol (derrota y reintento), Losa →
//   Tabla Fuerte y Medichamita; revancha tras descansar; el tren ya funciona.
// Capturas en tools/cache/screens/e2e_b08_<nn>_<hito>.png y transcripción en e2e_b08_dialogos.txt.
// Uso: node tools/e2e_b08.mjs [--base=http://localhost:8080] [--headed] [--no-retry] [--gender=F|M]
//      [--from=estrato|mina|dunas|cerro|camara|nucleo|cooperativa|t05]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB08Helpers } from './e2e_b08_page.mjs';
import { Driver } from './e2e_b08_driver.mjs';
import { ESTRATO, ESTRATO_INTERIORS, MINA, DUNAS, CERRO, P4_VERTICAL as P } from '../game/src/content/maps/b08/layout.js';
import { SPOTS, SOLUTION_TARGETS, normalizePuzzle, planPiece, walkRoute, applyActions } from '../game/src/content/events/b08_balance_logic.js';
import { F, V } from '../game/src/content/events/b08_common.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'cache', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const arg = (n, d) => (argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).slice(n.length + 3);
const BASE = arg('base', 'http://localhost:8080');
const RETRY = !argv.includes('--no-retry');
const GENDER = arg('gender', 'F') === 'M' ? 'M' : 'F';
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
const NAME_DIR = { down: 2, left: 4, right: 6, up: 8 };

/** Estado de entrada (CAMPANA B08 «Entrada: Ruta 6 abierta tras B07»). */
const BASE_FLAGS = [
  'b01_dex_received', 'b01_left_town', 'p1_restored', 'p2_restored', 'p3_restored', 'zyg_10', 'zyg_core_2', 'b05_brontia',
  'b06_colector_roto', 'b06_abril_vencida', 'b06_campanas', 'verse_1', 'verse_2', 'verse_3',
  'b07_llegada', 'b07_tecnicos', 'b07_garrido', 'b07_alerce', 'b07_timburr_1', 'b07_timburr_2', 'b07_timburr_3', 'b07_quino',
  'b07_tablilla', 'b07_piedra', 'b07_rescate', 'b07_denuncia', 'b07_megaring', 'b07_ruta_despejada',
];
const CHAIN = {
  mina: [F.arrival, F.argument],
  dunas: [F.arrival, F.argument, F.mineSeen, F.techs, F.garridoMet, F.garrido, F.ferminCerro],
  cerro: [F.arrival, F.argument, F.mineSeen, F.techs, F.garridoMet, F.garrido, F.ferminCerro],
  camara: [F.arrival, F.argument, F.mineSeen, F.techs, F.garridoMet, F.garrido, F.ferminCerro, F.cerroSeen, F.gateOpen],
  cooperativa: [F.arrival, F.argument, F.mineSeen, F.techs, F.garridoMet, F.garrido, F.ferminCerro, F.cerroSeen, F.gateOpen,
    F.chamberSeen, F.balance, F.fermin, F.restored, F.verse, F.ferminLeft],
};
CHAIN.t05 = [...CHAIN.cooperativa, F.coop, F.fossils, F.t05Hint];
CHAIN.nucleo = [...CHAIN.camara, F.chamberSeen, F.balance];
const entry = (map, x, y, dir, chain = []) => new URLSearchParams({
  scene: 'map', map, x: String(x), y: String(y), dir: String(dir), flags: [...BASE_FLAGS, ...chain].join(','),
  party: 'LUCARIO:46,TORTERRA:46,STARAPTOR:45', fragments: chain.includes(F.restored) ? '4' : '3', noenc: '1', time: '11',
  zygarde: 'run,ram,terrain', zcells: '35', zcores: '2', vars: 'starter:TURTWIG,gael_starter:LITTEN',
});
const STARTS = {
  estrato: entry('ciudad_estrato', 28, 1, 2),
  mina: entry('ciudad_estrato', 48, 26, 6, CHAIN.mina),
  dunas: entry('ciudad_estrato', 52, 39, 6, CHAIN.dunas),
  cerro: entry('cerro_plomo', CERRO.exit.arrive.x, CERRO.exit.arrive.y, 8, CHAIN.cerro),
  camara: entry('camara_contrapesos', SPOTS.entry.x, SPOTS.entry.y, 8, CHAIN.camara),
  nucleo: entry('camara_contrapesos', SPOTS.pedestalFront.x, SPOTS.pedestalFront.y, 8, CHAIN.nucleo),
  cooperativa: entry('dunas_ceniza', 2, 21, 4, CHAIN.cooperativa),
  t05: entry('ciudad_estrato', 25, 25, 8, CHAIN.t05),
};
const FROM = arg('from', 'estrato');
if (!STARTS[FROM]) throw new Error(`--from desconocido: ${FROM} (${Object.keys(STARTS).join(', ')})`);
const LOSE = RETRY ? ['b08_tecnico_pozo', 'b08_fermin', 'b08_t05_minera_2', 'b08_t05_tecnico+b08_t05_tecnica'] : [];

const hasCell = (s, key) => s.cells.includes(key);

// ───────────────────────────── Estrato y la mina ─────────────────────────────

async function estrato(d) {
  await d.until((s) => s.top === 'MapScene' && s.map === 'ciudad_estrato' && s.ready, { timeout: 30000, what: 'Ciudad Estrato' });
  await d.settle({ watch: [{ re: /El suelo tiembla/, name: 'temblor', delay: 200 }] });
  await d.milestone('llegada_estrato', (s) => (s.flags[F.arrival] ? null : 'sin b08_llegada'));
  const watch = [{ re: /La oferta sigue en pie/, name: 'discusion', delay: 200 }];
  await d.walkTo(ESTRATO.mine.door.x, ESTRATO.mine.door.y + 2, { watch, stopWhen: (s) => s.flags[F.argument] });
  await d.settle({ watch });
  await d.expectSaid(/Le prometí a mi padre que la Galena no se vende/, 'la promesa de Fermín');
  await d.expectSaid(GENDER === 'F' ? /Si eres entrenadora/ : /Si eres entrenador,/, 'el texto con género de Sol');
  await d.milestone('discusion_mina', (s) => (s.flags[F.argument] ? null : 'sin b08_discusion'));
}

async function mina(d) {
  await d.enter(ESTRATO.mine.door.x, ESTRATO.mine.door.y, 'up', 'mina_galena');
  // C036, al pie de la veta de cristal (el Minero Rufo la vigila).
  const watch = [{ scene: 'BattleScene', name: 'combate_rufo', delay: 3000 }];
  await d.walkTo(MINA.cell.x, MINA.cell.y, { watch });
  await d.settle();
  await d.milestone('celula_c036', (s) => (hasCell(s, 'cell_mina_galena_1') ? null : 'C036 sin recoger'));
  // Técnicos del pozo lateral: el primero gana una vez (derrota simulada) y se reintenta.
  const techWatch = [{ re: /Zona de estudio del terreno/, name: 'tecnicos', delay: 200 }, { scene: 'BattleScene', name: 'combate_tecnica', delay: 3000 }];
  const [tunnel] = MINA.tunnels.filter((t) => t.x0 > MINA.rooms.galeria.x1);
  for (let i = 0; i < 6; i++) {
    const s = await d.snapState();
    if (s.flags[F.techs]) break;
    // Mientras el primero tapa el túnel, delante de él; después, delante del segundo (los dos vigilan 3 casillas).
    const first = await d.eval(() => window.__b08.eventAt('tecnico_pozo'));
    const x = first?.blocks ? tunnel.x0 : tunnel.x1 - 1;
    await d.walkTo(x, tunnel.y, { watch: techWatch, stopWhen: (st) => st.flags[F.techs] });
    await d.settle({ watch: techWatch });
  }
  if (RETRY) await d.expectSaid(/Zona restringida\. Vuelva cuando tenga permiso/, 'el reintento con los técnicos');
  await d.milestone('tecnicos', (s) => (s.flags[F.techs] ? null : 'los técnicos siguen'));
  const [gx, gy] = MINA.garridoStrip[1];
  const gWatch = [{ re: /Ulises Garrido\. Operaciones/, name: 'garrido', delay: 200 }, { scene: 'BattleScene', name: 'combate_garrido', delay: 4000 }, { re: /Fuera de mi mina/, name: 'fermin_pozo', delay: 200 }];
  await d.walkTo(gx, gy, { watch: gWatch, stopWhen: (s) => s.flags[F.garrido] });
  await d.settle({ watch: gWatch });
  await d.expectSaid(/la cámara|brocas se doblan/, 'Garrido y la perforadora');
  await d.expectSaid(/Se entra por arriba: por el Cerro Plomo/, 'la ruta de Fermín al Cerro');
  await d.milestone('garrido_fermin', (s) => (s.flags[F.garrido] && s.flags[F.ferminCerro] ? null : 'sin b08_garrido o b08_fermin_cerro'));
  // Salida a Estrato.
  await d.walkTo(MINA.exit.arrive.x, MINA.exit.arrive.y);
  await d.step(2);
  await d.until((s) => s.map === 'ciudad_estrato' && s.ready, { timeout: 15000, what: 'salir de la mina' });
  await d.settle();
}

// ───────────────────────────── Dunas y Cerro Plomo ─────────────────────────────

async function dunas(d) {
  await d.walkTo(ESTRATO.east.x, ESTRATO.east.y0 + 1);
  await d.crossEdge('right', 'dunas_ceniza');
  await d.settle();
  await d.milestone('dunas_ceniza');
  const [c037] = DUNAS.ashFields;
  await d.walkTo(c037.cell.x, c037.cell.y);
  await d.settle();
  await d.milestone('celula_c037', (s) => (hasCell(s, 'cell_dunas_1') ? null : 'C037 sin recoger'));
  await d.enter(DUNAS.cerro.door.x, DUNAS.cerro.door.y, 'up', 'cerro_plomo');
}

async function cerro(d) {
  await d.until((s) => s.map === 'cerro_plomo' && s.ready, { timeout: 30000, what: 'Cerro Plomo' });
  await d.settle();
  const [fx, fy] = CERRO.gateFront[1];
  const watch = [{ re: /En casa la llamamos la Cámara de los Contrapesos/, name: 'fermin_verja', delay: 200 }];
  await d.walkTo(fx, fy, { watch, stopWhen: (s) => s.flags[F.gateOpen] });
  await d.settle({ watch });
  await d.milestone('verja_abierta', (s) => (s.flags[F.gateOpen] ? null : 'la verja sigue cerrada'));
  await d.walkTo(CERRO.door.x, CERRO.door.y + 1);
  await d.step(8);
  await d.until((s) => s.map === 'camara_contrapesos_base' && s.ready, { timeout: 15000, what: 'entrar en la base del Pilar' });
  await d.settle();
  await d.milestone('pilar_masa_base');
  for (const [x, y, face] of [[7, 16, 'right'], [19, 10, 'left']]) {
    await d.walkTo(x, y, { face });
    await d.interact();
  }
  await d.milestone('entrenadores_piso1');
  await d.walkTo(P.up.x, P.up.y + 1);
  await d.step(8);
  await d.until((s) => s.map === 'camara_contrapesos' && s.ready, { timeout: 15000, what: 'subir a los contrapesos' });
}

// ───────────────────────────── Cámara de los Contrapesos ─────────────────────────────

/** Estado del puzle y del jugador leídos de la partida (para planificar desde lo real). */
async function puzzleNow(d) {
  const s = await d.snapState();
  return { s, st: normalizePuzzle(s.vars[V.puzzle]), player: { x: s.x, y: s.y, mounted: s.riding } };
}

/**
 * Ejecuta acciones del planificador comprobando cada una contra las reglas (posición del jugador y contrapesos).
 * → null si todo fue como se esperaba, o la descripción de la primera acción que se desvió (para replanificar).
 */
async function runActions(d, actions) {
  for (const [i, a] of actions.entries()) {
    const before = await puzzleNow(d);
    const expected = applyActions(before.st, before.player, [a]);
    if (a === 'montar' || a === 'bajar') await d.setMount(a === 'montar');
    else if (a.startsWith('pull:')) await d.pull(NAME_DIR[a.slice(5)]);
    else await d.step(NAME_DIR[a]);
    const now = await puzzleNow(d);
    const same = now.player.x === expected.player.x && now.player.y === expected.player.y && now.player.mounted === expected.player.mounted
      && JSON.stringify(now.st.pieces) === JSON.stringify(expected.state.pieces);
    if (!same) {
      return `acción ${i + 1}/${actions.length} «${a}»: jugador (${now.player.x},${now.player.y},${now.player.mounted}) en vez de ` +
        `(${expected.player.x},${expected.player.y},${expected.player.mounted}); contrapesos ${JSON.stringify(now.st.pieces)} en vez de ${JSON.stringify(expected.state.pieces)}`;
    }
  }
  return null;
}

/** Camina por la Cámara con las reglas del puzle (nunca pisa montado el suelo quebradizo); re-traza si se desvía. */
async function goTo(d, x, y, mounted, watch = []) {
  const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
  await d.setMount(mounted);
  for (let attempt = 0; attempt < 6; attempt++) {
    const { s, st } = await puzzleNow(d);
    if (s.x === x && s.y === y) break;
    const route = walkRoute(st, [s.x, s.y], [x, y], { mounted });
    if (!route) throw new Error(`Cámara: sin ruta de (${s.x},${s.y}) a (${x},${y}) ${mounted ? 'montado' : 'a pie'}`);
    let [px, py] = [s.x, s.y];
    for (const dir of route) {
      await d.step(dir);
      [px, py] = [px + DV[dir][0], py + DV[dir][1]];
      const now = await d.snapState();
      if (now.x !== px || now.y !== py) break; // re-trazar desde donde esté
    }
  }
  await d.settle({ watch });
}

/** Lleva un contrapeso a su platillo; si una pulsación se desvía (latencia del navegador), replanifica desde lo real. */
async function movePiece(d, id, target) {
  for (let attempt = 0; ; attempt++) {
    const { st, player } = await puzzleNow(d);
    const plan = planPiece(st, id, target, player);
    if (!plan) throw new Error(`Cámara: sin plan para ${id} → (${target})`);
    const deviation = await runActions(d, plan.actions);
    if (!deviation) break;
    console.log(`    ${id}: ${deviation}; se replanifica`);
    if (attempt >= 5) throw new Error(`Cámara: ${id} no llega a su platillo (${deviation})`);
  }
  const after = await puzzleNow(d);
  if (after.st.pieces[id][0] !== target[0] || after.st.pieces[id][1] !== target[1]) {
    throw new Error(`Cámara: ${id} quedó en (${after.st.pieces[id]}) y no en (${target}); jugador (${after.player.x},${after.player.y})`);
  }
}

async function camara(d) {
  await d.settle();
  await d.milestone('camara_contrapesos');
  // La estela de las reglas (lectura de lado).
  await d.walkTo(SPOTS.plaque.x - 1, SPOTS.plaque.y, { face: 'right' });
  await d.interact();
  await d.expectSaid(/quien cabalga al guardián, lo que tres/, 'las reglas de la estela');
  // Los tres bloques, a pie por el puente: A = b2 + b3, B = b1.
  for (const [id, target] of SOLUTION_TARGETS.slice(0, 3)) await movePiece(d, id, target);
  await d.milestone('bloques_colocados');
  await goTo(d, SPOTS.c040.x, SPOTS.c040.y, false);
  await d.milestone('celula_c040', (s) => (hasCell(s, 'cell_masa_2') ? null : 'C040 sin recoger'));
  // Caída a propósito: montado sobre el suelo quebradizo (peso 3).
  await goTo(d, 18, 17, false);
  await d.setMount(true);
  const fall = [{ re: /La losa se parte/, name: 'suelo_se_parte', delay: 100 }];
  await d.step(2);
  await d.settle({ watch: fall });
  await d.milestone('caida_galeria', (s) => (s.x === SPOTS.landing.x && s.y === SPOTS.landing.y && s.flags[F.fallSeen] ? null : `(${s.x},${s.y})`));
  await goTo(d, SPOTS.c039.x, SPOTS.c039.y, true);
  await d.milestone('celula_c039', (s) => (hasCell(s, 'cell_masa_1') ? null : 'C039 sin recoger'));
  // La placa (montado) sube la plataforma del foso.
  await goTo(d, 34, 21, true, [{ re: /una plataforma de piedra sube/, name: 'plataforma', delay: 300 }]);
  await d.milestone('placa_hundida', (s) => (normalizePuzzle(s.vars[V.puzzle]).plate ? null : 'la placa no se ha hundido'));
  // Las tres piedras suben por la escalinata y la plataforma: B = b1 + o1 + o2, C = o3.
  for (const [id, target] of SOLUTION_TARGETS.slice(3)) await movePiece(d, id, target);
  await d.milestone('piedras_colocadas');
  // A pie en el hueco del platillo C la Balanza se inclina; montado, cede.
  await goTo(d, SPOTS.leverFrom.x, SPOTS.leverFrom.y, false);
  await d.face('up');
  await d.interact();
  await d.expectSaid(/La palanca vuelve sola a su sitio/, 'la Balanza inclinada a pie');
  await d.setMount(true);
  await d.face('up');
  const watch = [{ re: /algo enorme cede/, name: 'balanza_cede', delay: 300 }];
  await d.interact({ watch });
  await d.milestone('gran_balanza', (s) => (s.flags[F.balance] ? null : 'sin b08_balanza'));
  await d.setMount(false);
  await d.walkTo(SPOTS.pedestalFront.x, SPOTS.pedestalFront.y, { face: 'up' });
  await d.interact();
  await d.until((s) => s.map === 'camara_contrapesos_nucleo' && s.ready, { timeout: 15000, what: 'subir al Guardián' });
  await d.settle({ watch: [{ re: /¡La Balanza! Cuarenta años/, name: 'fermin_llega', delay: 200 }] });
  await d.expectSaid(GENDER === 'F' ? /pesáis la chavala y ese bicho verde/ : /pesáis el chaval y ese bicho verde/, 'Fermín (texto con género)');
  await fermin(d);
  await nucleo(d);
}

async function fermin(d) {
  await d.setMount(false);
  const watch = [{ re: /demuéstrame que aguantas el peso/, name: 'reto_fermin', delay: 200 }, { scene: 'BattleScene', name: 'combate_fermin', delay: 4000 }];
  for (let i = 0; i < 3; i++) {
    const s = await d.snapState();
    if (s.flags[F.fermin]) break;
    await d.walkTo(P.guardian.x, P.guardian.y + 1, { watch, stopWhen: (st) => st.flags[F.fermin] });
    await d.settle({ watch });
  }
  if (RETRY) await d.expectSaid(/Descansa\. Cuando quieras, aquí estaré/, 'el reintento con Fermín');
  await d.milestone('fermin_vencido', (s) => (s.flags[F.fermin] ? null : 'Fermín sin vencer'));
}

async function pisoTres(d) {
  await d.setMount(false);
  await d.walkTo(SPOTS.pedestalFront.x, SPOTS.pedestalFront.y, { face: 'up' });
  await d.interact();
  await d.until((s) => s.map === 'camara_contrapesos_nucleo' && s.ready, { timeout: 15000, what: 'subir al Guardián' });
  await d.settle();
  await d.expectSaid(GENDER === 'F' ? /pesáis la chavala y ese bicho verde/ : /pesáis el chaval y ese bicho verde/, 'Fermín (texto con género)');
  await fermin(d);
  await nucleo(d);
}

async function nucleo(d) {
  const f = { x: P.pedestal.x, y: P.pedestal.y + 1 };
  await d.walkTo(f.x, f.y, { face: 'up' });
  const watch = [{ scene: 'VerseScene', name: 'verso_iv', delay: 1200 }];
  await d.interact({ watch, timeout: 300000 });
  await d.expectSaid(/«…y la tierra, su peso\.»/, 'el verso IV leído por Fermín');
  await d.expectSaid(/La quinta tabla se gana con las manos/, 'la inscripción de T05');
  const clues = await d.eval(() => window.__b08.clues());
  const frags = await d.eval(() => window.__b08.fragments());
  await d.milestone('pilar_restaurado', (s) => {
    if (!s.flags[F.restored] || !s.flags[F.verse]) return 'sin p4_restored o verse_4';
    if (!frags.includes('F04')) return `fragmentos ${frags}`;
    return clues.some((c) => c.id === 'T05') ? null : `pistas ${JSON.stringify(clues)}`;
  });
  // Se baja por los tres pisos conservando la solución de la Cámara.
  await d.walkTo(P.down.x, P.down.y - 1);
  await d.step(2);
  await d.until((s) => s.map === 'camara_contrapesos' && s.ready, { timeout: 15000, what: 'volver al puzzle' });
  await d.settle();
  await d.walkTo(SPOTS.entry.x, SPOTS.entry.y);
  await d.step(2);
  await d.until((s) => s.map === 'camara_contrapesos_base' && s.ready, { timeout: 15000, what: 'volver a la base' });
  await d.settle();
  await d.walkTo(P.down.x, P.down.y - 1);
  await d.step(2);
  await d.until((s) => s.map === 'cerro_plomo' && s.ready, { timeout: 15000, what: 'volver al Cerro' });
  await d.settle();
  await d.walkTo(CERRO.exit.arrive.x, CERRO.exit.arrive.y);
  await d.step(2);
  await d.until((s) => s.map === 'dunas_ceniza' && s.ready, { timeout: 15000, what: 'volver a las Dunas' });
  await d.settle();
}

// ───────────────────────────── Estrato tras el P4 y T05 ─────────────────────────────

async function cooperativa(d) {
  await d.until((s) => s.map === 'dunas_ceniza' && s.ready, { timeout: 30000, what: 'las Dunas' });
  await d.walkTo(0, DUNAS.west.y0 + 1);
  const watch = [{ re: /La opción ha caducado/, name: 'opcion_caducada', delay: 200 }, { re: /Una cooperativa/, name: 'cooperativa', delay: 200 }];
  await d.crossEdge('left', 'ciudad_estrato');
  await d.settle({ watch });
  await d.expectSaid(/El suelo es estable desde esta mañana\. Sin intervención nuestra/, 'la caducidad de la opción');
  await d.expectSaid(/«La quinta tabla se gana con las manos»/, 'la segunda pista de T05');
  const has = await d.eval(() => ['SKULLFOSSIL', 'ARMORFOSSIL'].map((i) => window.__b08.has(i)));
  const clues = await d.eval(() => window.__b08.clues());
  await d.milestone('cooperativa', (s) => {
    if (!s.flags[F.coop] || has.includes(false)) return `coop ${s.flags[F.coop]} fósiles ${has}`;
    const t05 = clues.find((c) => c.id === 'T05');
    return t05 && t05.step >= 2 ? null : `pista T05: ${JSON.stringify(t05)}`;
  });
}

async function t05(d) {
  await d.until((s) => s.map === 'ciudad_estrato' && s.ready, { timeout: 30000, what: 'Ciudad Estrato' });
  await d.settle();
  // Herminia en la Escuela del Pico.
  const school = ESTRATO.buildings.escuela.door;
  await d.enter(school.x, school.y, 'up', 'estrato_escuela');
  await d.walkTo(8, 5, { face: 'up' });
  await d.interact();
  await d.expectSaid(/Cuando yo era niña, cada domingo se echaba el Torneo del Pulso/, 'Herminia y el torneo');
  await d.milestone('herminia', (s) => (s.flags[F.tournamentOpen] ? null : 'torneo sin abrir'));
  const inside = ESTRATO_INTERIORS.estrato_escuela;
  await d.walkTo(inside.x, inside.y);
  await d.step(2);
  await d.until((s) => s.map === 'ciudad_estrato' && s.ready, { timeout: 15000, what: 'salir de la escuela' });
  await d.settle();
  // Torneo: con la derrota simulada en la 2.ª ronda se reinicia; se vuelve a hablar con Herminia.
  const T = ESTRATO.tournament;
  const watch = [{ re: /Ronda 1/, name: 'torneo_ronda_1', delay: 200 }, { re: /¡Y ahora, la final!/, name: 'torneo_final', delay: 200 }];
  for (let i = 0; i < 3; i++) {
    const s = await d.snapState();
    if (s.flags[F.tournament]) break;
    await d.walkTo(T.herminia.x + 1, T.herminia.y, { face: 'left' });
    await d.interact({ watch, timeout: 900000 });
  }
  if (RETRY) await d.expectSaid(GENDER === 'F' ? /Eliminada en esta ronda/ : /Eliminado en esta ronda/, 'la eliminación (con género) y el reinicio del torneo');
  await d.expectSaid(/gana el Torneo del Pulso/, 'la victoria en el torneo');
  await d.milestone('torneo_ganado', (s) => (s.flags[F.tournament] && s.battles.some((b) => b.id === 'b08_t05_sol') ? null : 'sin torneo o sin final contra Sol'));
  // Noche: los técnicos intentan llevarse la Losa (combate doble con Sol).
  await d.eval(() => window.__b08.setHour(21));
  const night = [{ re: /Alguien intenta mover la Losa/, name: 'noche_losa', delay: 300 }, { scene: 'BattleScene', name: 'combate_doble', delay: 4000 }];
  await d.until((s) => s.flags[F.defenseStarted] || s.busy || s.top !== 'MapScene', { timeout: 10000, what: 'la escena nocturna' });
  await d.settle({ watch: night, timeout: 600000 });
  for (let i = 0; i < 3; i++) {
    const s = await d.snapState();
    if (s.flags[F.defended]) break;
    await d.walkTo(T.solNight.x, T.solNight.y + 1, { face: 'up' });
    await d.interact({ watch: night, timeout: 600000 });
  }
  await d.milestone('losa_defendida', (s) => (s.flags[F.defended] && s.battles.some((b) => b.format === 'double' && b.ally) ? null : 'sin defensa o sin combate doble'));
  await d.walkTo(ESTRATO.losa.front.x, ESTRATO.losa.front.y, { face: 'up' });
  await d.interact({ watch: [{ re: /La costra de piedra se agrieta/, name: 'losa_tablilla', delay: 200 }] });
  const tablets = await d.eval(() => window.__b08.tablets());
  const mega = await d.eval(() => window.__b08.has('MEDICHAMITE'));
  await d.milestone('tabla_fuerte', (s) => (tablets.includes('FISTPLATE') && mega && s.flags[F.tablet] ? null : `tablillas ${tablets} medichamita ${mega}`));
  // Revancha semanal: tras descansar, Herminia la ofrece (se rechaza para acabar).
  await d.eval(() => window.__b08.setVar('rest_count', 1));
  await d.walkTo(T.herminia.x + 1, T.herminia.y, { face: 'left' });
  d.nextChoice = 1;
  await d.interact();
  await d.expectSaid(/¿Quieres la revancha del Torneo del Pulso\?/, 'la revancha semanal');
  // El tren vuelve a funcionar.
  const st = ESTRATO.buildings.estacion.door;
  await d.eval(() => window.__b08.setHour(11));
  await d.enter(st.x, st.y, 'up', 'estrato_estacion');
  await d.walkTo(20, 8, { face: 'up' });
  const dests = await d.eval(() => window.__b08.trainDestinations('estrato'));
  d.nextChoice = dests.length; // «Cancelar», si hay destinos
  await d.interact();
  const log = await d.log();
  if (log.some((l) => /El servicio de tren está suspendido/.test(l.text))) throw new Error('El tren sigue suspendido tras el P4');
  await d.milestone('tren_en_servicio', () => (log.some((l) => /no hay otros destinos|Adónde quieres ir/.test(l.text)) ? null : 'la taquilla no ofrece el tren'));
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
  const d = new Driver(page, errors, { outDir: OUT, root: ROOT });
  const t0 = Date.now();
  let failed = null;
  try {
    await page.goto(`${BASE}/?${STARTS[FROM].toString()}&debug`, { waitUntil: 'load' });
    await installHelpers(page);
    await installB08Helpers(page, { loseOnce: LOSE, gender: GENDER });
    await d.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'el mapa de arranque' });
    // El arranque de desarrollo sustituye el estado tras cargar datos; se fija el género cuando ya está listo.
    await d.eval(async (gender) => {
      const { engine } = await import('/src/core/engine.js');
      engine.state.data.player.gender = gender;
    }, GENDER);
    const stages = [
      ['estrato', estrato], ['mina', mina], ['dunas', dunas], ['cerro', cerro], ['camara', camara],
      ['cooperativa', cooperativa], ['t05', t05],
    ];
    const first = stages.findIndex(([n]) => n === FROM);
    const selected = FROM === 'nucleo' ? [['nucleo', pisoTres], ...stages.slice(stages.findIndex(([n]) => n === 'cooperativa'))] : stages.slice(first);
    for (const [name, run] of selected) {
      console.log(`— ${name}`);
      await d.eval(() => window.__b08.heal());
      await run(d);
    }
    const fatal = errors.filter((e) => /pageerror|http 5/.test(e));
    if (fatal.length) throw new Error(`errores de página:\n${fatal.join('\n')}`);
  } catch (err) {
    failed = err;
    await d.shot('fallo').catch(() => {});
  }
  const log = await d.log().catch(() => []);
  fs.writeFileSync(path.join(OUT, 'e2e_b08_dialogos.txt'), log.map((l) => `${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'));
  await browser.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`Hitos: ${d.milestones.join(' → ')} (${secs} s; ${log.length} diálogos en tools/cache/screens/e2e_b08_dialogos.txt)`);
  if (errors.length) console.log(`Avisos de consola (${errors.length}):\n${errors.slice(0, 12).join('\n')}`);
  if (failed) {
    console.log(`✖ ${failed.message}`);
    process.exitCode = 1;
  } else {
    console.log('✔ Bloque 8 completo de principio a fin.');
  }
}

await main();
