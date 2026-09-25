// Bloque 18 — Pilar de la Convergencia: guiones de punta a punta sobre los mapas reales, sin navegador (ctx de
// tests/b18_helpers.mjs, que mueve de verdad al jugador y a los personajes y guioniza elecciones y combates).
//   · Puente: llegada con Alerce, los tres zócalos de Reconstrucción (sin ella, no) y el puente entero.
//   · Genesis: Casia (una derrota: reintento curado en su casilla), Garrido y Vértice en orden, Alerce curando entre
//     combates, la frase de Vértice antes del combate, la irrupción, Gael y Vértice (líneas literales), el cuaderno,
//     la detención; la escena se retoma si se interrumpe; textos con el género del jugador.
//   · Cámara: llegada, tutorial del primer cristal, cristal sin Cadena Roja, salas superadas y atajo sellado.
//   · Núcleo: confirmación explícita, verso IX, derrota del elegido (P9, Fragmento 9, Cadena templada, T15, orbe,
//     reaparición tras descansar), captura a la primera, derrota del jugador (entrada de la Cámara, elección conservada).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { F, V, SPEAKER, chosenWaiting } from '../game/src/content/events/b18_common.js';
import { PUENTE_TEXT, arrivalSpot } from '../game/src/content/events/b18_puente.js';
import { GENESIS_TEXT } from '../game/src/content/events/b18_genesis.js';
import { CRUCE_TEXT, CRYSTAL_TUTORIAL } from '../game/src/content/events/b18_cruce.js';
import { NUCLEO_TEXT } from '../game/src/content/events/b18_nucleo.js';
import { ARRIVAL, BRIDGE, gapCells, CAST, RETRY, CAMP } from '../game/src/content/maps/b18/puente_layout.js';
import { VESTIBULO, NUCLEO, ENTRY } from '../game/src/content/maps/b18/cruce_layout.js';
import { AXIS_VAR, AXIS_TIME, AXIS_SPACE } from '../game/src/world/axis/logic.js';
import { AXIS_EVENT_TEXT } from '../game/src/world/axis/eventTypes.js';
import { entryState, fieldWorld, fieldCtx, runEvent, liveEvent, saidLine } from './b18_helpers.mjs';

const BRIDGE_FLAGS = [F.arrival, F.gap1, F.gap2, F.gap3, F.bridge];
const trainerOf = (b) => b.request.trainer;

// ───────────────────────────── Puente ─────────────────────────────

test('Puente: llegada con Alerce; los zócalos piden Reconstrucción y alzan su tramo; el tercero deja el puente entero', async () => {
  const t = await fieldWorld('puente_convergencia');
  t.p.moveTo(ARRIVAL.x, ARRIVAL.y);
  const ctx = fieldCtx(t);
  await runEvent(ctx, 'escena_llegada');
  assert.ok(t.state.flag(F.arrival) && !liveEvent(t.w, 'escena_llegada'));
  assert.ok(ctx.said.some((l) => l.speaker === SPEAKER.alerce && /Olmedo reúne a la Policía Regional/.test(l.text)), 'Alerce no menciona a Olmedo');
  assert.ok(ctx.said.some((l) => l.speaker === 'Zygarde' && /Tres puntos/.test(l.text)), 'Zygarde no señala los tres puntos');
  const [g1] = BRIDGE.gaps;
  t.state.setZygardeAbility('rebuild', false);
  t.p.moveTo(g1.socket.x, g1.socket.y - 1);
  await runEvent(ctx, 'zocalo_tramo_1');
  assert.ok(!t.state.flag(F.gap1) && saidLine(ctx, PUENTE_TEXT.socket), 'sin Reconstrucción se alza el tramo');
  t.state.setZygardeAbility('rebuild', true);
  for (const g of BRIDGE.gaps) {
    t.p.moveTo(g.socket.x, g.socket.y - 1);
    await runEvent(ctx, `zocalo_tramo_${g.n}`);
    assert.ok(t.state.flag(g.flag), `el tramo ${g.n} no queda alzado`);
    for (const [x, y] of gapCells(g)) assert.ok(t.map.playerPassable(x, y, 2, {}), `hueco ${g.n}: (${x},${y}) sigue vacío`);
  }
  assert.ok(t.state.flag(F.bridge), 'el tercer tramo no deja el puente entero');
  assert.ok(ctx.said.some((l) => l.speaker === SPEAKER.casia && /Es el portador/.test(l.text)), 'Genesis no reacciona al puente');
  assert.ok(liveEvent(t.w, 'alerce_borde') && !liveEvent(t.w, 'alerce_campamento'), 'Alerce no pasa al borde de la plataforma');
});

// ───────────────────────────── Genesis ─────────────────────────────

test('Genesis: Casia (una derrota: curado en su casilla), Garrido y Vértice en orden, con Alerce curando entre combates', async () => {
  const t = await fieldWorld('puente_convergencia', { flags: BRIDGE_FLAGS });
  const ctx = fieldCtx(t, { battles: ['lose', 'win', 'win'] });
  t.p.moveTo(CAST.vertice.x, CAST.vertice.y + 1);
  await runEvent(ctx, 'vertice');
  assert.equal(ctx.log.battles.length, 0, 'Vértice combate antes que sus directores');
  t.p.moveTo(RETRY.casia.x, RETRY.casia.y);
  await runEvent(ctx, 'casia');
  assert.ok(t.state.flag(F.casiaIntro) && !t.state.flag(F.casia));
  assert.deepEqual(ctx.log.warps.at(-1), { mapId: 'puente_convergencia', x: RETRY.casia.x, y: RETRY.casia.y, dir: RETRY.casia.dir });
  assert.equal(ctx.log.heals, 1, 'perder no cura');
  await runEvent(ctx, 'casia');
  assert.ok(t.state.flag(F.casia) && t.state.flag(F.heal1));
  assert.ok(saidLine(ctx, 'Repetimos la medición.', SPEAKER.casia), 'la intro de Casia se repite');
  const aside = liveEvent(t.w, 'casia_aparte');
  assert.ok(aside && !liveEvent(t.w, 'casia'), 'Casia no se aparta');
  assert.equal(ctx.log.heals, 2, 'Alerce no cura tras Casia');
  const edge = liveEvent(t.w, 'alerce_borde');
  assert.deepEqual([edge.x, edge.y], [CAST.alerceEdge.x, CAST.alerceEdge.y], 'Alerce no vuelve al borde');
  t.p.moveTo(RETRY.garrido.x, RETRY.garrido.y);
  await runEvent(ctx, 'garrido');
  assert.ok(t.state.flag(F.garrido) && t.state.flag(F.heal2) && liveEvent(t.w, 'garrido_aparte'));
  assert.deepEqual(ctx.log.battles.map(trainerOf), ['b18_casia', 'b18_casia', 'b18_garrido']);
  assert.ok(ctx.log.battles.every((b) => b.request.canLose && b.request.rules.noMoneyLoss), 'combates de guion sin las reglas de bossBattle');
  assert.equal(ctx.log.heals, 3);
});

test('Vértice: la frase antes del combate; sobrecarga, irrupción, Gael, huida, detención y cuaderno (líneas literales)', async () => {
  const t = await fieldWorld('puente_convergencia', { flags: [...BRIDGE_FLAGS, F.casiaIntro, F.casia, F.heal1, F.garridoIntro, F.garrido, F.heal2] });
  const ctx = fieldCtx(t);
  t.p.moveTo(RETRY.vertice.x, RETRY.vertice.y);
  await runEvent(ctx, 'vertice');
  const line = ctx.said.findIndex((l) => l.text === 'Él te enseñó a escuchar. ¿Quién crees que le enseñó a él?' && l.speaker === SPEAKER.vertice);
  assert.ok(line >= 0, 'falta la frase de Vértice');
  const [battle] = ctx.log.battles;
  assert.equal(trainerOf(battle), 'b18_vertice');
  assert.ok(line < battle.saidAt, 'la frase de Vértice llega después del combate');
  assert.ok(saidLine(ctx, 'Ven conmigo. Tú sabes lo que es esperar.', SPEAKER.vertice));
  assert.ok(saidLine(ctx, 'No voy a pedirle permiso a nadie. Tampoco a usted.', SPEAKER.gael));
  for (const text of [GENESIS_TEXT.overload, GENESIS_TEXT.snap, GENESIS_TEXT.dive, GENESIS_TEXT.notebook, GENESIS_TEXT.gaelTakes]) assert.ok(saidLine(ctx, text), `falta «${text}»`);
  assert.ok(ctx.said.some((l) => l.speaker === SPEAKER.olmedo && /Quedan detenidos/.test(l.text)), 'Olmedo no los detiene');
  for (const f of [F.verticeLine, F.vertice, F.overload, F.irruption, F.gael, F.verticeGone, F.notebook, F.arrest, F.scene, F.heal3]) assert.ok(t.state.flag(f), `falta ${f}`);
  for (const id of ['casia_aparte', 'garrido_aparte', 'vertice', 'sello_boca', 'cuaderno_vertice', 'aerodeslizador', 'tecnico_resonador']) {
    assert.ok(!liveEvent(t.w, id), `${id} sigue en la plataforma tras la escena`);
  }
  assert.ok(liveEvent(t.w, 'vallado_sur_20'), 'el vallado sur se retira antes del P9 (la barrera de B17 sigue cerrada)');
  for (const id of ['olmedo_despues', 'agente_resonador', 'alerce_boca']) assert.ok(liveEvent(t.w, id), `falta ${id} tras la escena`);
  assert.equal(liveEvent(t.w, 'resonador').pageIndex, 2, 'el Resonador no queda roto');
  for (const id of ['gael_escena', 'olmedo_escena', 'agente_escena_1', 'agente_escena_2', 'irrupcion_dialga', 'irrupcion_palkia']) {
    assert.ok(!t.w.events.some((e) => e.id === id), `${id} se queda en el mapa`);
  }
  assert.ok(saidLine(ctx, 'Lo que haya dicho Vértice… puede esperar. Antes de bajar, tu equipo.', SPEAKER.alerce));
});

test('Escena interrumpida: se retoma donde quedó (sin repetir la irrupción) y respeta el género del jugador', async () => {
  const state = entryState({ gender: 'F' });
  const t = await fieldWorld('puente_convergencia', {
    state, flags: [...BRIDGE_FLAGS, F.casia, F.garrido, F.verticeLine, F.vertice, F.overload, F.irruption],
  });
  t.p.moveTo(RETRY.vertice.x, RETRY.vertice.y);
  const ctx = fieldCtx(t);
  await runEvent(ctx, 'escena_convergencia');
  assert.ok(!saidLine(ctx, GENESIS_TEXT.sky), 'la irrupción se repite');
  assert.ok(saidLine(ctx, 'No voy a pedirle permiso a nadie. Tampoco a usted.', SPEAKER.gael));
  assert.ok(t.state.flag(F.scene) && t.state.flag(F.notebook) && t.state.flag(F.arrest));
  assert.ok(ctx.said.some((l) => l.speaker === SPEAKER.olmedo && /Chica, tienes un don/.test(l.text)), 'Olmedo no usa el femenino');
  assert.ok(ctx.said.some((l) => l.speaker === SPEAKER.alerce && /respirar un poco, chica\./.test(l.text)), 'Alerce no usa el femenino');
  assert.ok(!liveEvent(t.w, 'escena_convergencia'));
});

test('Género: Casia se dirige a la jugadora en femenino («Portadora», «quieta», «la portadora»)', async () => {
  const t = await fieldWorld('puente_convergencia', { state: entryState({ gender: 'F' }), flags: [F.arrival, F.gap1, F.gap2] });
  const ctx = fieldCtx(t);
  const g3 = BRIDGE.gaps[2];
  t.p.moveTo(g3.socket.x, g3.socket.y - 1);
  await runEvent(ctx, 'zocalo_tramo_3');
  assert.ok(ctx.said.some((l) => l.speaker === SPEAKER.casia && /Es la portadora\.$/.test(l.text)));
  t.p.moveTo(RETRY.casia.x, RETRY.casia.y);
  await runEvent(ctx, 'casia');
  assert.ok(ctx.said.some((l) => l.speaker === SPEAKER.casia && /^Portadora del Core\. 100 células/.test(l.text)));
  assert.ok(saidLine(ctx, 'Solo nos falta compararlas. Quédate quieta y sigue siendo un dato.', SPEAKER.casia));
});

test('Despedida tras el P9: Alerce y Olmedo notan los relojes sincronizados', async () => {
  const t = await fieldWorld('puente_convergencia', { flags: [...BRIDGE_FLAGS, F.casia, F.garrido, F.vertice, F.scene, F.restored] });
  const ctx = fieldCtx(t);
  await runEvent(ctx, 'escena_despedida');
  assert.ok(t.state.flag(F.farewell));
  assert.ok(saidLine(ctx, 'Mi reloj y el de Olmedo marcan lo mismo. Por primera vez en semanas.', SPEAKER.alerce));
  assert.ok(ctx.said.some((l) => l.speaker === 'Zygarde' && /La Sima ya no se abre/.test(l.text)));
});

test('Llegada por cualquier casilla del borde norte: Alerce se acerca por el tablero, nunca por el vacío', async () => {
  const t = await fieldWorld('puente_convergencia');
  for (let x = BRIDGE.x0; x <= BRIDGE.x1; x++) {
    for (const y of [0, 1]) {
      const spot = arrivalSpot({ x, y });
      assert.ok(!t.map.isVoid(spot.x, spot.y) && t.map.playerPassable(spot.x, spot.y, 2, {}), `(${x},${y}) → (${spot.x},${spot.y}) no es tablero`);
      assert.equal(Math.abs(spot.x - x) + Math.abs(spot.y - y), 1, `Alerce no queda junto al jugador en (${x},${y})`);
    }
  }
});

test('Detención: los agentes se llevan a Casia y a Garrido por el tablero (sin cruzar el vacío)', async () => {
  const t = await fieldWorld('puente_convergencia', { flags: [...BRIDGE_FLAGS, F.casia, F.garrido, F.vertice, F.overload, F.irruption, F.gael, F.verticeGone] });
  t.p.moveTo(RETRY.vertice.x, RETRY.vertice.y);
  await runEvent(fieldCtx(t), 'escena_convergencia');
  assert.ok(t.state.flag(F.arrest) && t.state.flag(F.scene));
  for (const id of ['casia_aparte', 'garrido_aparte']) {
    const ev = t.w.events.find((e) => e.id === id);
    assert.ok(!t.map.isVoid(ev.x, ev.y) && t.map.playerPassable(ev.x, ev.y, 2, {}), `${id} acaba en (${ev.x},${ev.y}), fuera del tablero`);
    assert.ok(BRIDGE.rebuiltX.includes(ev.x), `${id} no sale por el tablero reconstruido`);
  }
});

test('Despedida desde el campamento: Alerce y Olmedo se acercan y vuelven a la boca; tras la Tabla Draco dejan el Puente', async () => {
  const flags = [...BRIDGE_FLAGS, F.casia, F.garrido, F.vertice, F.scene, F.restored];
  const t = await fieldWorld('puente_convergencia', { flags });
  t.p.moveTo(CAMP.healPoint.x, CAMP.healPoint.y);
  await runEvent(fieldCtx(t), 'escena_despedida');
  const at = (id) => { const ev = liveEvent(t.w, id); return [ev.x, ev.y]; };
  assert.deepEqual(at('alerce_boca'), [CAST.alerceMouth.x, CAST.alerceMouth.y], 'Alerce no vuelve junto a la boca');
  assert.deepEqual(at('olmedo_despues'), [CAST.olmedoAfter.x, CAST.olmedoAfter.y], 'Olmedo no vuelve a su sitio');
  // B19: con la Tabla Draco, Alerce espera en la Calzada del Rey; la policía ya se ha ido del Puente
  t.state.setFlag(F.t15Tablet);
  t.w.refreshEvents();
  for (const id of ['alerce_boca', 'olmedo_despues', 'agente_resonador']) assert.ok(!liveEvent(t.w, id), `${id} sigue en el Puente tras B19`);
  const late = await fieldWorld('puente_convergencia', { flags: [...flags, F.t15Tablet] });
  assert.ok(!liveEvent(late.w, 'escena_despedida'), 'la despedida salta sin Alerce ni Olmedo');
});

// ───────────────────────────── Cámara del Cruce ─────────────────────────────

test('Cámara: llegada, tutorial del primer cristal (Zygarde), tensiones y cristal sin Cadena Roja', async () => {
  const t = await fieldWorld('camara_cruce', { flags: [F.scene] });
  const ctx = fieldCtx(t, { choices: [0, 2, 1] });
  await runEvent(ctx, 'escena_camara');
  assert.ok(t.state.flag(F.chamberIn) && saidLine(ctx, CRUCE_TEXT.arrive[0]));
  const c = VESTIBULO.grid.crystals.findIndex((k) => k.x === 5 && k.y === 5);
  assert.ok(c >= 0, 'el cristal junto a la entrada del vestíbulo no está');
  t.p.moveTo(VESTIBULO.ox + 6, VESTIBULO.oy + 5);
  await runEvent(ctx, `vestibulo_cristal_${c}`);
  assert.ok(t.state.flag(F.tutorial) && saidLine(ctx, CRYSTAL_TUTORIAL[0], 'Zygarde'), 'sin tutorial del cristal');
  assert.equal(t.state.var(AXIS_VAR, null), AXIS_TIME);
  const before = ctx.said.length;
  await runEvent(ctx, `vestibulo_cristal_${c}`); // «Dejarla así»
  assert.equal(t.state.var(AXIS_VAR, null), AXIS_TIME);
  assert.ok(!ctx.said.slice(before).some((l) => l.text === CRYSTAL_TUTORIAL[0]), 'el tutorial se repite');
  await runEvent(ctx, `vestibulo_cristal_${c}`);
  assert.equal(t.state.var(AXIS_VAR, null), AXIS_SPACE);
  // Sin la Cadena Roja el cristal no responde
  t.state.removeKeyItem('REDCHAIN');
  const c2 = fieldCtx(t, { choices: [0] });
  await runEvent(c2, `vestibulo_cristal_${c}`);
  assert.ok(saidLine(c2, AXIS_EVENT_TEXT.blocked) && t.state.var(AXIS_VAR, null) === AXIS_SPACE);
});

test('Cámara: cada sala queda superada al pisar su salida; el atajo del vestíbulo sigue sellado hasta ver el núcleo', async () => {
  const t = await fieldWorld('camara_cruce', { flags: [F.scene, F.chamberIn] });
  const ctx = fieldCtx(t);
  for (const [id, flag, n] of [['caida_superada', F.room1, 1], ['rio_superada', F.room2, 2], ['cruce_superada', F.room3, 3]]) {
    await runEvent(ctx, id);
    assert.ok(t.state.flag(flag) && ctx.log.toasts.includes(CRUCE_TEXT.roomDone(n)), `${id}: sin marca`);
  }
  assert.ok(liveEvent(t.w, 'atajo_sellado')?.solid, 'el atajo está abierto antes de llegar al núcleo');
  t.state.setFlag(F.nucleus);
  t.w.refreshEvents();
  assert.ok(!liveEvent(t.w, 'atajo_sellado'));
});

// ───────────────────────────── Núcleo ─────────────────────────────

async function nucleo(state = entryState()) {
  const t = await fieldWorld('camara_cruce', { state, flags: [F.scene, F.chamberIn, F.room1, F.room2, F.room3] });
  t.p.moveTo(NUCLEO.arrival.x, NUCLEO.arrival.y);
  await runEvent(fieldCtx(t), `nucleo_llegada_${NUCLEO.arrival.x}`);
  assert.ok(t.state.flag(F.nucleus), 'la llegada al núcleo no queda vista');
  t.p.moveTo(NUCLEO.coreFront.x, NUCLEO.coreFront.y);
  t.p.direction = 8;
  return t;
}

test('Núcleo: el verso IX se lee antes de elegir; «No» en la confirmación y «Todavía no» no fijan nada', async () => {
  const t = await nucleo();
  const ctx = fieldCtx(t, { choices: [0, 1] });
  await runEvent(ctx, 'nucleo_p9');
  assert.ok(t.state.flag(F.verse), 'el verso IX no se revela');
  assert.equal(t.state.var(V.choice, null), null, 'la elección queda fijada sin confirmar');
  assert.equal(ctx.log.battles.length, 0);
  const confirm = ctx.log.choices[1];
  assert.deepEqual(confirm.options, ['Sí', 'No']);
  assert.match(confirm.message, /^Atarás a Dialga, el tiempo\..*¿Estás seguro de tu elección\?$/);
  const c2 = fieldCtx(t, { choices: [2] });
  await runEvent(c2, 'nucleo_p9');
  assert.equal(t.state.var(V.choice, null), null);
  const fem = await nucleo(entryState({ gender: 'F' }));
  const c3 = fieldCtx(fem, { choices: [1, 1] });
  await runEvent(c3, 'nucleo_p9');
  assert.match(c3.log.choices[1].message, /^Atarás a Palkia, el espacio\..*¿Estás segura de tu elección\?$/);
});

test('Núcleo: derrotar a Palkia ata el eje y restaura el P9 (Fragmento 9, Cadena templada, T15); Dialga deja la Diamansfera; Palkia vuelve tras descansar', async () => {
  const t = await nucleo();
  const s = t.state;
  const ctx = fieldCtx(t, { choices: [1, 0], battles: ['win'] });
  await runEvent(ctx, 'nucleo_p9');
  assert.equal(s.var(V.choice, null), 'PALKIA');
  assert.equal(s.var(V.caught, null), false);
  const [battle] = ctx.log.battles;
  assert.deepEqual([battle.request.wild.species, battle.request.wild.level], ['PALKIA', 65]);
  assert.equal(typeof battle.request.rules.catchCondition, 'function');
  const warn = ctx.said.findIndex((l) => l.text === NUCLEO_TEXT.chainRule('Palkia'));
  assert.ok(warn >= 0 && warn < battle.saidAt, 'no se avisa de la regla de captura antes del combate');
  assert.ok(saidLine(ctx, NUCLEO_TEXT.optional));
  for (const f of [F.bound, F.restored, F.tempered, F.inscription, F.verse]) assert.ok(s.flag(f), `falta ${f}`);
  assert.ok(s.data.fragments.includes('F09'), 'sin Fragmento 9');
  assert.ok(s.hasKeyItem('REDCHAIN'), 'la Cadena Roja se consume');
  assert.ok(['active', 'queued'].includes(ctx.story.clueStatus('T15')), 'la pista T15 no se abre');
  assert.ok(saidLine(ctx, '«La última tabla está donde el rey trabajó.»'));
  assert.ok(saidLine(ctx, NUCLEO_TEXT.leaves('Dialga')) && saidLine(ctx, NUCLEO_TEXT.promise('Dialga', 'Diamansfera')));
  assert.ok(!liveEvent(t.w, 'dialga_nucleo') && !liveEvent(t.w, 'palkia_nucleo'), 'los legendarios siguen en el núcleo');
  // El orbe del no elegido
  t.p.moveTo(NUCLEO.orb.x, NUCLEO.orb.y + 1);
  await runEvent(ctx, 'orbe_no_elegido');
  assert.equal(s.itemCount('ADAMANTORB'), 1);
  assert.equal(s.itemCount('LUSTROUSORB'), 0);
  assert.ok(s.flag(F.orb) && !liveEvent(t.w, 'orbe_no_elegido'));
  // Debilitado sin capturar: reaparece tras descansar, y se puede capturar después
  assert.ok(!chosenWaiting(s) && !liveEvent(t.w, 'elegido_reaparece'));
  s.setVar(V.restCount, Number(s.var(V.restCount, 0)) + 1);
  t.w.refreshEvents();
  const again = liveEvent(t.w, 'elegido_reaparece');
  assert.ok(chosenWaiting(s) && again?.characterName === 'follower:PALKIA:0:0', 'Palkia no reaparece tras descansar');
  t.p.moveTo(NUCLEO.bound.x, NUCLEO.bound.y + 1);
  const c2 = fieldCtx(t, { battles: ['caught'] });
  await runEvent(c2, 'elegido_reaparece');
  assert.equal(s.var(V.caught, null), true);
  assert.ok(!chosenWaiting(s) && !liveEvent(t.w, 'elegido_reaparece'));
  assert.equal(s.data.fragments.filter((f) => f === 'F09').length, 1, 'el Fragmento 9 se duplica');
});

test('Núcleo: en otra visita, la revancha usa el elegido que reaparece (el del núcleo, ya sin página, no se mueve)', async () => {
  const t = await nucleo();
  const s = t.state;
  await runEvent(fieldCtx(t, { choices: [1, 0], battles: ['win'] }), 'nucleo_p9');
  s.setVar(V.restCount, Number(s.var(V.restCount, 0)) + 1);
  const again = await fieldWorld('camara_cruce', { state: s }); // nueva visita: los eventos se crean de nuevo
  again.p.moveTo(NUCLEO.bound.x, NUCLEO.bound.y + 1);
  await runEvent(fieldCtx(again, { battles: ['caught'] }), 'elegido_reaparece');
  const ghost = again.w.events.find((e) => e.id === 'palkia_nucleo');
  assert.deepEqual([ghost.x, ghost.y], [NUCLEO.palkia.x, NUCLEO.palkia.y], 'se mueve el Palkia oculto del núcleo');
  assert.equal(s.var(V.caught, null), true);
});

test('Núcleo: capturar a Dialga a la primera deja p9_chosen_caught y la Lustresfera; no reaparece al descansar', async () => {
  const t = await nucleo();
  const s = t.state;
  const ctx = fieldCtx(t, { choices: [0, 0], battles: ['caught'] });
  await runEvent(ctx, 'nucleo_p9');
  assert.deepEqual([s.var(V.choice, null), s.var(V.caught, null)], ['DIALGA', true]);
  assert.ok(s.flag(F.restored) && s.flag(F.bound) && saidLine(ctx, NUCLEO_TEXT.caught('Dialga')));
  t.p.moveTo(NUCLEO.orb.x, NUCLEO.orb.y + 1);
  await runEvent(ctx, 'orbe_no_elegido');
  assert.equal(s.itemCount('LUSTROUSORB'), 1);
  s.setVar(V.restCount, 5);
  t.w.refreshEvents();
  assert.ok(!liveEvent(t.w, 'elegido_reaparece'), 'un elegido capturado reaparece');
});

test('Núcleo: perder vuelve a la entrada de la Cámara curado y conserva la elección; el reintento ata el eje', async () => {
  const t = await nucleo();
  const s = t.state;
  const ctx = fieldCtx(t, { choices: [0, 0], battles: ['lose'] });
  await runEvent(ctx, 'nucleo_p9');
  assert.deepEqual(ctx.log.warps.at(-1), { mapId: 'camara_cruce', x: ENTRY.x, y: ENTRY.y, dir: ENTRY.dir });
  assert.equal(ctx.log.heals, 1);
  assert.ok(saidLine(ctx, NUCLEO_TEXT.lose));
  assert.equal(s.var(V.choice, null), 'DIALGA');
  assert.equal(s.var(V.defeats, 0), 1);
  assert.ok(!s.flag(F.bound) && !s.flag(F.restored));
  assert.ok(liveEvent(t.w, 'dialga_nucleo') && liveEvent(t.w, 'palkia_nucleo'), 'los legendarios desaparecen al perder');
  t.p.moveTo(NUCLEO.coreFront.x, NUCLEO.coreFront.y);
  const c2 = fieldCtx(t, { battles: ['win'] });
  await runEvent(c2, 'nucleo_p9');
  assert.ok(saidLine(c2, NUCLEO_TEXT.retry('Dialga')), 'el reintento no recuerda la elección');
  assert.equal(c2.log.choices.filter((c) => c.options.length === 3).length, 0, 'se vuelve a elegir');
  assert.equal(c2.log.battles[0].request.wild.species, 'DIALGA');
  assert.ok(s.flag(F.bound) && s.flag(F.restored));
});
