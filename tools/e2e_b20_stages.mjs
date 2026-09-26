// Tramos del recorrido E2E del Bloque 20 (tools/e2e_b20.mjs): URL de entrada de cada uno y lo que se juega. Las
// coordenadas y las soluciones salen de los mismos módulos puros que usa el juego (layout.js y b20_logic.js).
import {
  PUERTA, T1, T2, T3, T4, T5, T6, T7, T8, T9, CIELO, TERRAZA, NUCLEO, ARRIVE, EXIT_STAND, INNER, tramoId,
} from '../game/src/content/maps/b20/layout.js';
import { F, V } from '../game/src/content/events/b20_common.js';
import { STONES, stonePresses, corridorPath, corridorLedge, doorExit, facetRoom6, VANE_TURNS_NORTH, t9Room, t9Local } from '../game/src/content/events/b20_logic.js';
import { solveAxis } from '../game/src/world/axis/logic.js';
import { CAMPAIGN_TABLETS } from '../game/src/content/story/tablets.js';
import { facetMasks } from '../game/src/world/impossible/logic.js';

const has = (s, f) => Boolean(s.flags[f]);
const need = (cond, msg) => (cond ? null : msg);

// ───────────────────────────── Estado de entrada ─────────────────────────────

const BASE_FLAGS = [
  'b01_dex_received', 'b01_left_town', 'b02_libreta', 'b02_salida',
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `p${n}_restored`), ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `verse_${n}`),
  'zyg_10', 'zyg_50', 'zyg_complete', 'zyg_core_2', 'zyg_core_3', 'zyg_core_4', 'zyg_core_5', 'zyg_dive', 'zyg_rebuild_tutorial',
  'b13_talasa', 'b15_n5', 'b16_hito', 'b17_vigilia', 'b19_calzada',
];
const AFTER = {
  puerta: [F.arrival, F.missingSeen, F.doorOpen, F.path, 'b20_puerta_centro'],
  t1: ['b20_t1_visto', F.t1Slab], t2: ['b20_t2_visto', F.t2Gate], t3: ['b20_t3_visto', F.t3Hint], t4: ['b20_t4_visto', F.t4Plate, F.t4Hint, F.spring(1)],
  t5: ['b20_t5_visto', F.t5Crossed], t6: ['b20_t6_visto', F.t6Anchor], t7: ['b20_t7_visto', F.t7Grate, F.t7Echo, F.spring(2)],
  t8: ['b20_t8_visto', F.t8Intro, F.t8Door], t9: ['b20_t9_visto', F.t9Crystal, F.t9Frozen, F.t9Fold, F.t9Gap, F.custodios, 'verse_10'],
  cielo: [F.skyArrival, F.tornadus, F.thundurus, F.landorus, F.trio],
  terraza: [F.gaelHeal, F.gaelB6, F.gaelTalk, F.gaelGone],
};
export const ORDER = ['puerta', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 'cielo', 'terraza', 'nucleo'];
const flagsUpTo = (stage) => {
  const i = ORDER.indexOf(stage);
  const done = ORDER.slice(0, i);
  return [...done.flatMap((k) => AFTER[k] || []), ...done.filter((k) => /^t\d$/.test(k)).map((k) => F.tramo(Number(k.slice(1))))].join(',');
};
const PARTY = 'GARCHOMP:100,METAGROSS:100,LUCARIO:98,TORTERRA:98,STARAPTOR:96';
const entry = (stage, over = {}) => new URLSearchParams({
  scene: 'map', party: PARTY, fragments: '9', tablets: stage === 'puerta' ? '14' : '15', noenc: '1', time: '12', core: '1',
  zygarde: 'all', zform: 'complete', zcells: '100', zcores: '5',
  vars: 'starter:TURTWIG,gael_starter:LITTEN,b16_mesprit_respuesta:lejos',
  ...over,
  flags: [BASE_FLAGS.join(','), flagsUpTo(stage), over.flags].filter(Boolean).join(','),
});
const at = (map, p) => ({ map, x: String(p.x), y: String(p.y), dir: String(p.dir ?? 8) });
const STARTS = {
  puerta: () => entry('puerta', at('puerta_quince', PUERTA.arrive)),
  t1: () => entry('t1', at(tramoId(1), ARRIVE)), t2: () => entry('t2', at(tramoId(2), ARRIVE)), t3: () => entry('t3', at(tramoId(3), ARRIVE)),
  t4: () => entry('t4', at(tramoId(4), ARRIVE)), t5: () => entry('t5', at(tramoId(5), ARRIVE)), t6: () => entry('t6', at(tramoId(6), T6.arrive)),
  t7: () => entry('t7', at(tramoId(7), ARRIVE)), t8: () => entry('t8', at(tramoId(8), ARRIVE)), t9: () => entry('t9', at(tramoId(9), ARRIVE)),
  cielo: () => entry('cielo', at('cielo_interior', CIELO.arrive)),
  terraza: () => entry('terraza', at('terraza_ultimo_sello', TERRAZA.arrive)),
  nucleo: () => entry('nucleo', at('nucleo_origen', NUCLEO.arrive)),
};
export const startUrl = (stage) => STARTS[stage]();
/** Objetos clave que da la URL de entrada (la Clave Glífica del P5: versos completos). */
export const ENTRY_KEY_ITEMS = ['GLYPHKEY', 'REDCHAIN', 'CLUENOTEBOOK', 'ZYGARDECUBE'];

const inMap = (id) => (s) => s.map === id;

async function exitNorth(d, next) {
  await d.walkTo(EXIT_STAND.x, EXIT_STAND.y, { stopWhen: inMap(next) });
  await d.exitTo('up', next);
}

// ───────────────────────────── Puerta de las Quince ─────────────────────────────

async function puerta(d) {
  await d.expectSaid(/El fondo de la Sima del Eje/, 'la llegada');
  await d.milestone('puerta_llegada', (s) => need(has(s, F.arrival), 'sin llegada'));
  // Con catorce Tablillas la puerta dice cuál falta y la Libreta la anota
  await d.walkTo(PUERTA.slab.x, PUERTA.slab.y + 1, { face: 'up' });
  await d.interact({ watch: [{ re: /Queda un nicho vacío/, name: 'puerta_falta', delay: 100 }] });
  const last = CAMPAIGN_TABLETS[14];
  await d.expectSaid(new RegExp(last.name), 'el nombre de la Tablilla que falta');
  const clue = await d.eval((id) => window.__b20.clue(id), last.arc);
  await d.milestone('puerta_catorce', (s) => need(has(s, F.missingSeen) && !has(s, F.doorOpen) && Number(s.vars[V.niches]) === 0x3fff && clue, `nichos ${s.vars[V.niches]}, pista ${clue}`));
  await d.eval((id) => window.__b20.addTablet(id), last.id);
  await d.interact({ watch: [{ re: /la losa se hunde en el suelo/, name: 'puerta_losa', delay: 800 }] });
  await d.milestone('puerta_abierta', (s) => need(has(s, F.doorOpen) && Number(s.vars[V.niches]) === 0x7fff, `nichos ${s.vars[V.niches]}`));
  // Reconstrucción: las quince piedras sobre el vacío
  await d.walkTo(PUERTA.slab.x, PUERTA.threshold.y, { face: 'up' });
  await d.interact({ watch: [{ re: /Las quince piedras suben/, name: 'puerta_camino', delay: 600 }] });
  await d.milestone('puerta_camino', (s) => need(has(s, F.path), 'sin camino'));
  await d.walkTo(PUERTA.exitStand.x, PUERTA.exitStand.y, { stopWhen: inMap(tramoId(1)) });
  await d.exitTo('up', tramoId(1));
}

// ───────────────────────────── Tramos 1–3 ─────────────────────────────

async function t1(d) {
  await d.settle(); // sin línea de Zygarde al entrar (autor, 25-09-2026)
  await d.walkTo(T1.stele.x, T1.stele.y + 2, { face: 'up' });
  await d.interact();
  await d.expectSaid(/El primero mira al alba/, 'la inscripción');
  // La grava: a pie resbala; montado se sube
  await d.walkTo(12, 12, { face: 'up' });
  await d.pushUntil('up', (s) => s.y <= 10, 'subir la grava montado');
  await d.milestone('t1_grava', (s) => need(s.y <= 10, `en (${s.x},${s.y})`));
  for (const st of STONES) {
    await d.walkTo(st.x, st.y, { onto: false });
    await d.faceTo(st.x, st.y);
    await d.interactTimes(stonePresses(st));
  }
  await d.expectSaid(/la losa se hunde en el suelo/, 'la losa');
  await d.milestone('t1_losa', (s) => need(has(s, F.t1Slab), 'sin losa'));
  await exitNorth(d, tramoId(2));
}

async function t2(d) {
  await d.settle();
  await d.swimTo(T2.islet.x0 - 1, T2.leverStand.y);
  await d.step(6);
  await d.walkTo(T2.leverStand.x, T2.leverStand.y, { face: 'up' });
  await d.interact({ watch: [{ re: /el fondo queda al aire/, name: 't2_vaciado', delay: 300 }] });
  await d.milestone('t2_compuerta', (s) => need(has(s, F.t2Gate), 'sin compuerta'));
  await exitNorth(d, tramoId(3));
}

async function t3(d) {
  await d.settle();
  const rock = { x: T3.rock[0] + INNER.x, y: T3.rock[1] + INNER.y };
  await d.walkTo(rock.x + 1, rock.y, { face: 'left' });
  await d.interact({ watch: [{ re: /abierto paso/, name: 't3_roca', delay: 100 }] });
  await d.walkTo(rock.x, rock.y, { face: 'left' });
  await d.interactTimes(VANE_TURNS_NORTH);
  await d.milestone('t3_veleta', (s) => need(Number(s.vars.b06_veleta_b20_t3_a) === VANE_TURNS_NORTH, `veleta ${s.vars.b06_veleta_b20_t3_a}`));
  const channel = { x: 15 + INNER.x, y: 8 + INNER.y };
  await d.walkTo(channel.x, channel.y);
  await d.step(8);
  await d.until((s) => s.y <= 2 + INNER.y && !s.playerBusy && !s.busy, { timeout: 10000, what: 'el canal sube al jugador' });
  await d.milestone('t3_canal', (s) => need(s.y === 2 + INNER.y, `en (${s.x},${s.y})`));
  await exitNorth(d, tramoId(4));
}

// ───────────────────────────── Tramos 4–6 ─────────────────────────────

async function t4(d) {
  await d.settle();
  await d.walkTo(T4.spring.stand.x, T4.spring.stand.y, { face: 'up' });
  await d.interact();
  await d.milestone('t4_manantial', (s) => need(has(s, F.spring(1)), 'sin manantial'));
  await d.walkTo(T4.plate.x, T4.plate.y + 1);
  await d.step(8);
  await d.settle();
  await d.until((s) => has(s, F.t4Plate) && !s.busy, { timeout: 20000, what: 'la placa' });
  await d.milestone('t4_placa', (s) => need(has(s, F.t4Plate), 'sin placa'));
  await exitNorth(d, tramoId(5));
}

async function t5(d) {
  await d.settle();
  await d.walkTo(T5.losa.x, T5.losa.y);
  await d.settle({ watch: [{ re: /huele a papel viejo/, name: 't5_losa', delay: 1500 }] });
  // Pisar fuera del camino: vuelta al borde, sin daño
  await d.walkTo(T5.fallBack.x + 1, T5.fallBack.y);
  await d.step(8);
  await d.settle();
  await d.expectSaid(/te devuelve, sin daño, al borde/, 'la caída');
  const [lx, ly] = T5.path[T5.path.length - 1];
  await d.walkTo(lx, ly, { face: 'up' });
  await d.milestone('t5_cruzado', (s) => need(has(s, F.t5Crossed), 'sin cruzar'));
  await d.interact();
  await d.until((s) => s.y === T5.climb.to[1] && !s.busy && !s.playerBusy, { timeout: 15000, what: 'trepar' });
  await exitNorth(d, tramoId(6));
}

async function t6(d) {
  await d.settle();
  const room = facetRoom6();
  const base = facetMasks(room, 0, T6.margin);
  const twin = facetMasks(room, 1, T6.margin);
  const [ax, ay] = base.map(room.anchors[0].x, room.anchors[0].y);
  await d.walkTo(ax, ay + 1, { face: 'up' });
  await d.pushUntil('up', (s) => has(s, F.t6Anchor), 'tocar el poste');
  const west = room.aristas.reduce((a, b) => (b.x < a.x ? b : a));
  const east = room.aristas.find((a) => a !== west);
  const [a1x, a1y] = base.map(west.x, west.y);
  await d.walkTo(a1x, a1y, { stopWhen: inMap(`${tramoId(6)}_giro`) });
  await d.until((s) => s.map === `${tramoId(6)}_giro` && s.ready && !s.busy, { timeout: 15000, what: 'girar al gemelo' });
  await d.milestone('t6_giro', (s) => need(s.map === `${tramoId(6)}_giro`, s.map));
  const [a2x, a2y] = twin.map(east.x, east.y);
  await d.walkTo(a2x, a2y, { stopWhen: inMap(tramoId(6)) });
  await d.until((s) => s.map === tramoId(6) && s.ready && !s.busy, { timeout: 15000, what: 'volver a la base' });
  const [ex, ey] = base.map(room.exit.x, room.exit.y);
  await d.walkTo(ex, ey, { stopWhen: inMap(tramoId(7)) });
  await d.until((s) => s.map === tramoId(7) && s.ready, { timeout: 15000, what: 'la grieta al tramo 7' });
}

// ───────────────────────────── Tramos 7–9 ─────────────────────────────

async function t7(d) {
  await d.settle();
  await d.walkTo(T7.spring.stand.x, T7.spring.stand.y, { face: 'up' });
  await d.interact();
  await d.swimTo(T7.dive.x, T7.dive.y);
  await d.interact();
  await d.until((s) => s.map === `${tramoId(7)}_fondo` && s.ready, { timeout: 15000, what: 'bucear a la cisterna' });
  await d.settle();
  await d.milestone('t7_fondo');
  const C = T7.caracola;
  await d.walkTo(C.stand.x, C.stand.y, { face: 'left' });
  await d.interact();
  await d.until((s) => s.map === `${tramoId(7)}_eco` && s.ready && !s.busy, { timeout: 15000, what: 'el eco de la cisterna' });
  await d.settle();
  await d.milestone('t7_eco', (s) => need(has(s, F.t7Echo), 'sin eco'));
  await d.walkTo(T7.crankStand.x, T7.crankStand.y, { face: 'up' });
  await d.interact();
  await d.milestone('t7_reja', (s) => need(has(s, F.t7Grate), 'sin reja'));
  await d.walkTo(C.stand.x, C.stand.y, { face: 'left' });
  await d.interact();
  await d.until((s) => s.map === `${tramoId(7)}_fondo` && s.ready && !s.busy, { timeout: 15000, what: 'volver al presente' });
  await d.settle();
  await d.walkTo(T7.surfaceSpot.x, T7.surfaceSpot.y);
  await d.interact();
  await d.until((s) => s.map === tramoId(7) && s.ready && !s.busy, { timeout: 15000, what: 'emerger en el pozo norte' });
  await d.step(8);
  await exitNorth(d, tramoId(8));
}

async function t8(d) {
  await d.settle();
  await d.expectSaid(/Solo una dice la verdad/, 'la voz del Saber');
  await d.expectSaid(/Aquí todo se siente al revés/, 'la voz del Sentir');
  await d.expectSaid(/quien se para, vuelve atrás/, 'la voz del Querer');
  const local = (s) => [s.x - INNER.x, s.y - INNER.y];
  const toLane = async () => {
    for (let tries = 0; tries < 6; tries++) {
      const s = await d.snapState();
      const [c, r] = local(s);
      if (r === 0) return;
      const path = corridorPath(c, r, 9, 0);
      await d.holdPath(path);
      await d.settle();
    }
    throw new Error('no se llega al pasillo de las puertas');
  };
  await toLane();
  await d.milestone('t8_pasillo', (s) => need(s.mirror && local(s)[1] === 0, `espejo ${s.mirror} en (${s.x},${s.y})`));
  const s0 = await d.snapState();
  const v = Number(s0.vars[V.t8Variant] || 0);
  const wrong = T8.doors.find((dd) => dd.n !== doorExit(v));
  await d.walkTo(wrong.x, wrong.y + 1, { face: 'up' });
  await d.interact();
  await d.expectSaid(/Las inscripciones han cambiado/, 'el olvido');
  await d.milestone('t8_olvido', (s) => need(Number(s.vars[V.t8Variant]) === v + 1 && s.x === ARRIVE.x && s.y === ARRIVE.y, `variante ${s.vars[V.t8Variant]} en (${s.x},${s.y})`));
  await toLane();
  const right = T8.doors.find((dd) => dd.n === doorExit(v + 1));
  await d.walkTo(right.x, right.y + 1, { face: 'up' });
  await d.interact();
  await d.until((s) => s.map === tramoId(9) && s.ready, { timeout: 15000, what: 'cruzar la puerta verdadera' });
}

const AXIS_LABEL = { time: 'Hacia Dialga (tiempo)', space: 'Hacia Palkia (espacio)' };

/**
 * Tramo 9: recorre la sala de ejes con el solucionador de world/axis (replanifica tras cada acción desde la posición y
 * el eje reales): pasos con las teclas y, en los cristales, mirar al cristal y elegir el eje. → estado al llegar
 */
async function t9Drive(d, room, goal, what, watch = []) {
  for (let n = 0; n < 120; n++) {
    const s = await d.snapState();
    const p = t9Local(s.x, s.y);
    const mode = s.vars[V.t9Axis] || null;
    if (goal(p.x, p.y)) return s;
    const plan = solveAxis(room, { x: p.x, y: p.y, mode }, goal);
    if (!plan?.actions.length) throw new Error(`tramo 9: sin plan hacia ${what} desde (${s.x},${s.y}) con el eje ${mode}`);
    const a = plan.actions[0];
    if (a.type === 'tense') {
      await d.turn(a.face);
      d.want = [AXIS_LABEL[a.mode]];
      await d.interact({ watch });
    } else {
      await d.step(a.dir);
    }
    await d.settle({ watch });
  }
  throw new Error(`tramo 9: demasiadas acciones hacia ${what}`);
}

async function t9(d) {
  await d.settle(); // sin línea de Zygarde al entrar (autor, 25-09-2026)
  const stand = t9Local(T9.gap.stand.x, T9.gap.stand.y);
  const atStand = (x, y) => x === stand.x && y === stand.y;
  // Hasta el cristal de la llegada: tiempo (la cascada se para), repisa del oeste: espacio (el pliegue se abre)
  const watch = [{ re: /La cascada se ha parado/, name: 't9_cascada', delay: 100 }, { re: /Las marcas violetas se han abierto/, name: 't9_pliegue', delay: 100 }];
  await t9Drive(d, t9Room({ rebuilt: false }), atStand, 'el zócalo roto', watch);
  await d.milestone('t9_ejes', (s) => need(has(s, F.t9Crystal) && has(s, F.t9Frozen) && has(s, F.t9Fold) && s.vars[V.t9Axis] === 'space', `eje ${s.vars[V.t9Axis]}`));
  await d.turn(T9.gap.stand.dir);
  await d.interact({ watch: [{ re: /camino ha vuelto/, name: 't9_hueco', delay: 200 }] });
  await d.milestone('t9_reconstruido', (s) => need(has(s, F.t9Gap), 'sin hueco'));
  const [wx, wy] = T9.wallScene[1];
  const wall = t9Local(wx, wy);
  const verse = [{ scene: 'VerseScene', name: 't9_verso_x', delay: 1500 }];
  await t9Drive(d, t9Room(), (x, y) => x === wall.x && y === wall.y, 'la pared escrita', verse);
  await d.settle({ watch: verse });
  await d.expectSaid(/Aquí termina el camino que grabamos/, 'el mensaje de los Custodios');
  await d.milestone('t9_custodios', (s) => need(has(s, F.custodios) && has(s, 'verse_10'), 'sin verso X'));
  await exitNorth(d, 'cielo_interior');
}

// ───────────────────────────── Cielo Interior ─────────────────────────────

async function trioFight(d, key, tag, { expectLoss = false } = {}) {
  const T = CIELO.trio[key];
  const [sx, sy] = T.strip[1];
  await d.walkTo(sx, sy + 1, { face: 'up' });
  const lostBefore = (await d.snapState()).lost.length;
  await d.pushUntil('up', (s) => s.busy || s.top !== 'MapScene' || has(s, F[key]) || s.lost.length > lostBefore, `entrar en la terraza de ${key}`, { watch: [{ scene: 'BattleScene', name: `cielo_${key}`, delay: 4000 }] });
  await d.settle();
  if (expectLoss) {
    await d.milestone(`cielo_${key}_derrota`, (s) => need(!has(s, F[key]) && s.lost.includes(tag) && s.x === T.retry.x && s.y === T.retry.y, `(${s.x},${s.y}) perdidos ${s.lost}`));
    await trioFight(d, key, tag);
    return;
  }
  const b = await d.eval((t) => window.__b16.battles.filter((x) => x.tag === t).pop(), tag);
  await d.milestone(`cielo_${key}`, (s) => need(has(s, F[key]) && b?.catchReason === 'No es momento: es un sello.' && b?.canRun === false, `combate ${JSON.stringify(b)}`));
}

async function cielo(d) {
  await d.settle();
  await d.expectSaid(/hay cielo/, 'la llegada al Cielo Interior');
  await d.milestone('cielo_llegada');
  await trioFight(d, 'tornadus', 'tornadus');
  const [s1] = CIELO.springs;
  await d.walkTo(s1.stand.x, s1.stand.y, { face: 'up' });
  await d.interact();
  await trioFight(d, 'thundurus', 'thundurus', { expectLoss: d.retry });
  const s2 = CIELO.springs[1];
  await d.walkTo(s2.stand.x, s2.stand.y, { face: 'up' });
  await d.interact();
  d.want = ['No lo sé; Zygarde me lo pidió'];
  await trioFight(d, 'landorus', 'landorus');
  await d.settle({ watch: [{ re: /Yo respondo por/, name: 'cielo_zygarde_responde', delay: 100 }] });
  await d.expectSaid(/Yo respondo por él\./, 'a Zygarde');
  await d.milestone('cielo_trio', (s) => need(has(s, F.trio) && s.vars[V.trioAnswer] === 'zygarde', `respuesta ${s.vars[V.trioAnswer]}`));
  await d.walkTo(CIELO.gate.x, CIELO.gate.y, { stopWhen: inMap('terraza_ultimo_sello') });
  await d.until((s) => s.map === 'terraza_ultimo_sello' && s.ready, { timeout: 15000, what: 'la Terraza' });
}

// ───────────────────────────── Terraza y Núcleo ─────────────────────────────

async function terraza(d) {
  await d.settle();
  const [mx, my] = TERRAZA.meet[1];
  await d.walkTo(mx, my + 1, { face: 'up' });
  await d.step(8);
  await d.settle({ watch: [{ re: /No voy a pelear contra un equipo roto/, name: 'terraza_cura', delay: 100 }, { scene: 'BattleScene', name: 'terraza_b6', delay: 5000 }] });
  if (d.retry) {
    await d.milestone('terraza_derrota', (s) => need(has(s, F.gaelHeal) && !has(s, F.gaelB6) && s.lost.includes('b20_gael_b6'), `perdidos ${s.lost}`));
    await d.faceEvent('gael');
    await d.interact({ watch: [{ scene: 'BattleScene', name: 'terraza_b6_revancha', delay: 5000 }] });
  }
  await d.settle({ watch: [{ scene: 'VerseScene', name: 'terraza_verso_x', delay: 1500 }] });
  await d.expectSaid(/Eso sí lo entiendo/, 'a Gael con el verso X');
  await d.expectSaid(/Lejos no es a tu lado/, 'la línea de Mesprit');
  await d.expectSaid(/Gael\. No respondí contra ti/, 'a Zygarde');
  await d.milestone('terraza_gael', (s) => need(has(s, F.gaelB6) && has(s, F.gaelGone), 'sin B6 o sin despedida'));
  await d.walkTo(TERRAZA.door.x, TERRAZA.door.y + 1, { stopWhen: inMap('nucleo_origen') });
  await d.pushUntil('up', inMap('nucleo_origen'), 'entrar en el núcleo');
}

async function nucleo(d) {
  await d.settle();
  await d.walkTo(NUCLEO.coreStand.x, NUCLEO.coreStand.y, { face: 'up' });
  await d.interact({ watch: [{ scene: 'ObtainScene', name: 'nucleo_flauta', delay: 1500 }, { re: /El Eje está entero/, name: 'nucleo_falsa_calma', delay: 100 }] });
  const flute = await d.eval(() => window.__b20.keyItem('AZUREFLUTE'));
  const crisis = await d.eval(() => window.__b20.crisis());
  await d.expectSaid(/X\. Dos partirán del mismo alba/, 'la profecía entera');
  await d.milestone('nucleo_flauta', (s) => need(has(s, 'p10_restored') && has(s, F.flute) && flute && crisis === 4, `flauta ${flute}, crisis ${crisis}`));
}

export const STAGES = { puerta, t1, t2, t3, t4, t5, t6, t7, t8, t9, cielo, terraza, nucleo };
export { corridorLedge };
