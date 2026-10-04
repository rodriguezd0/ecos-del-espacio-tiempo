import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB08Observer} from './e2e_campaign_b08_page.mjs';
import { ESTRATO, ESTRATO_INTERIORS, MINA, DUNAS, CERRO, P4_VERTICAL as P } from '../game/src/content/maps/b08/layout.js';
import { SPOTS, SOLUTION_TARGETS, normalizePuzzle, planPiece, walkRoute, applyActions } from '../game/src/content/events/b08_balance_logic.js';
import { F, V } from '../game/src/content/events/b08_common.js';
const RETRY=false, GENDER='M';
const NAME_DIR={down:2,left:4,right:6,up:8};
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
  await d.rest('estrato_centro', 'Noche');
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
  await d.rest('estrato_centro', 'Mañana');
  await d.walkTo(T.herminia.x + 1, T.herminia.y, { face: 'left' });
  d.nextChoice = 1;
  await d.interact();
  await d.expectSaid(/¿Quieres la revancha del Torneo del Pulso\?/, 'la revancha semanal');
  // El tren vuelve a funcionar.
  const st = ESTRATO.buildings.estacion.door;
  await d.rest('estrato_centro', 'Mañana');
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

export async function runB08(d){
 await refreshDriver(d); await installB08Observer(d.page);
 await d.stages('B08',{estrato,mina,dunas,cerro,camara,cooperativa,t05});
 await d.exitTo('ciudad_estrato'); await d.travel('ruta_7');
}
