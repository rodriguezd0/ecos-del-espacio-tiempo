import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {prepareB16} from './e2e_campaign_pc.mjs';
import {reloadCheckpoint} from './e2e_campaign_checkpoint_reload.mjs?slot=1';
import {installB16Observer} from './e2e_campaign_b16_page.mjs';
import {
  PATIO, SABER, SENTIR, QUERER, TELAR, P8_MAPS, P8_UP, floorTop,
} from '../game/src/content/maps/b16/santuario_layout.js';
import { legacySantuarioFloor } from '../game/src/content/events/b16_vertical.js';
import { ARRIVAL, BRIDGE, CELL_LAGOS, SANCTUARY } from '../game/src/content/maps/b16/lagos_layout.js';
import { LAB, ESPLANADA, ALJIBE } from '../game/src/content/maps/b16/recuerdo_layout.js';
import { RELIEF_ORDER, roundExit, roundVariant } from '../game/src/content/events/b16_saber_logic.js';
import { MIRROR_ROOMS, mirrorStep, reachedTarget, mirrorX } from '../game/src/content/events/b16_mirror_logic.js';
import { corridorPath, START as WIND_START, EXIT as WIND_EXIT } from '../game/src/content/events/b16_wind_logic.js';
import { F, V } from '../game/src/content/events/b16_common.js';

const has = (s, f) => Boolean(s.flags[f]);
const need = (cond, msg) => (cond ? null : msg);
const items = (d, id) => d.eval((i) => window.__b16.items(i), id);
const zyg = (d) => d.eval(() => window.__b16.zygarde());

// ───────────────────────────── Estado de entrada ─────────────────────────────


const gateFloor = g => g===PATIO.gates.saber?1:g===PATIO.gates.sentir?2:3;
const SPIT_EAST = Object.freeze({ land: [46, 32], water: [47, 32], fromWest: [44, 33], westWater: [43, 33] });

async function landOnSpit(d) {
  await d.swimTo(...SPIT_EAST.water);
  await d.step(4);
  const s = await d.snapState();
  if (s.surfing || s.x !== SPIT_EAST.land[0] || s.y !== SPIT_EAST.land[1]) throw new Error(`No se desembarcó en la lengua del este: (${s.x},${s.y}) nadando ${s.surfing}`);
}

async function lagos(d) {
  await d.walkTo(ARRIVAL.x, ARRIVAL.y - 3, { stopWhen: (s) => has(s, F.arrival) });
  await d.settle();
  await d.expectSaid(/Tres lagos quietos bajo la nieve/, 'la llegada');
  await d.milestone('llegada', (s) => need(has(s, F.arrival), 'sin llegada'));
  await d.faceEvent('marta');
  await d.interact();
  await d.expectSaid(/Mi Snorunt me sigue desde que era un huevo/, 'a Marta');
  await d.faceEvent('genesis_tecnica');
  await d.interact({ watch: [{ re: /sección de campo/, name: 'genesis', delay: 150 }] });
  await d.expectSaid(/El registrador capta desde la orilla/, 'a la técnica de Genesis');
  // C095: islote del Lago del Sentir (Nadar)
  await d.swimTo(CELL_LAGOS.x, CELL_LAGOS.y + 2);
  await d.step(8);
  await d.walkTo(CELL_LAGOS.x, CELL_LAGOS.y);
  await d.settle();
  await d.milestone('c095', (s) => need(s.cells.includes('cell_lagos_1') && s.cells.length >= 96, `células ${s.cells.length}`));
  // De vuelta a la lengua de tierra del este y al arco del puente; de ahí, nadando, al islote del santuario.
  await landOnSpit(d);
  await d.swimTo(BRIDGE.x0, BRIDGE.gapA.y0);
  await d.step(8);
  const inSanctuary = (s) => s.map === 'santuario_alma';
  await d.walkTo(SANCTUARY.warps[0].x, SANCTUARY.warps[0].y + 2, { stopWhen: inSanctuary });
  await d.milestone('islote', (s) => need(!s.surfing, 'sigue nadando'));
  await d.walkTo(SANCTUARY.warps[0].x, SANCTUARY.warps[0].y + 1, { stopWhen: inSanctuary });
  await d.exitTo('up', 'santuario_alma');
  await d.expectSaid(/Tres voces suenan a la vez/, 'la bienvenida del trío');
  await d.milestone('patio', (s) => need(has(s, F.sanctuaryIntro), 'sin bienvenida'));
}

// ───────────────────────────── Ala del Saber ─────────────────────────────

const inRoom = (room, floor = null) => (s) => s.map === P8_MAPS[floor || legacySantuarioFloor(room.x + Math.floor(room.w / 2), room.y + Math.floor(room.h / 2))] && s.x >= room.x && s.x < room.x + room.w && s.y >= room.y && s.y < room.y + room.h;
const atFront = (g) => (s) => s.map === P8_MAPS[gateFloor(g)] && s.x === g.front.x && s.y === g.front.y;

/** Escaleras reales entre alturas; cada llegada queda fuera del paso de retorno. */
async function toFloor(d, target) {
  let s = await d.snapState();
  while (s.map !== P8_MAPS[target]) {
    const floor = Number(Object.keys(P8_MAPS).find((f) => P8_MAPS[f] === s.map));
    if (!floor) throw new Error(`No está en una planta del Pilar: ${s.map}`);
    if (floor < target) {
      const up = P8_UP[floor];
      await d.walkTo(up.x, up.y + 1);
      await d.exitTo('up', P8_MAPS[floor + 1]);
    } else {
      await d.walkTo(PATIO.exit.arrive.x, PATIO.exit.arrive.y);
      await d.exitTo('down', P8_MAPS[floor - 1]);
    }
    await d.settle(); s = await d.snapState();
    await d.milestone(`p8_piso${Object.keys(P8_MAPS).find((f) => P8_MAPS[f] === s.map)}`);
  }
}

/**
 * Camina hasta la casilla delante de un dintel y empuja hasta entrar en `room`. Con el equipo lento, la tecla del
 * último paso puede seguir pulsada al llegar y cruzar ya el warp: por eso `stopWhen`.
 */
async function throughGate(d, front, room, what = 'cruzar el dintel') {
  await d.walkTo(front.x, front.y, { face: 'up', stopWhen: inRoom(room) });
  await d.pushUntil('up', inRoom(room), what);
}

const enterGate = (d, g, room) => throughGate(d, g.front, room);

async function takeGlyph(d, n) {
  await d.faceEvent(`pedestal_glifo_${n}`);
  await d.interact();
  const s = await d.snapState();
  if (Number(s.vars[V.carried]) !== n) throw new Error(`No se cogió el glifo ${n}: ${s.vars[V.carried]}`);
}

async function offerAt(d, n) {
  const r = SABER.glyphRoom.reliefs[RELIEF_ORDER.indexOf(n)];
  await d.walkTo(r.x, r.y + 1, { face: 'up' });
  await d.interact();
}

async function doorRound(d, key, doors, variantVar, { wrongFirst = false } = {}) {
  const room = SABER[key];
  const pick = async (door) => {
    const dd = room.doors[door - 1];
    await d.walkTo(dd.x, dd.y + 1, { face: 'up' });
    await d.interact();
  };
  if (wrongFirst) {
    const v = Number((await d.snapState()).vars[variantVar] || 0);
    const wrong = roundExit(roundVariant(doors, v)) === 1 ? 2 : 1;
    await pick(wrong);
    await d.expectSaid(/Uxie parpadea/, 'el olvido de Uxie');
    await d.milestone(`olvido_${doors}`, (s) => need(Number(s.vars[variantVar]) === v + 1 && s.x === room.entry.arrive.x && s.y === room.entry.arrive.y, `variante ${s.vars[variantVar]} en (${s.x},${s.y})`));
  }
  const v = Number((await d.snapState()).vars[variantVar] || 0);
  await pick(roundExit(roundVariant(doors, v)));
}

async function saber(d) {
  const G = SABER.glyphRoom;
  await enterGate(d, PATIO.gates.saber, G.room);
  await d.expectSaid(/pestaña «Diario»/, 'la pista del Diario');
  // Un glifo equivocado vuelve a su pedestal
  await takeGlyph(d, 1);
  await offerAt(d, RELIEF_ORDER.find((n) => n !== 1));
  await d.expectSaid(/no acepta el glifo/, 'el glifo equivocado');
  await d.milestone('glifo_equivocado', (s) => need(!Number(s.vars[V.carried] || 0) && !Number(s.vars[V.placed] || 0), `lleva ${s.vars[V.carried]}, máscara ${s.vars[V.placed]}`));
  for (const n of [1, 2, 3, 4, 5, 6, 7]) {
    await takeGlyph(d, n);
    await offerAt(d, n);
  }
  await d.expectSaid(/Los siete glifos brillan a la vez/, 'los siete glifos');
  await d.walkTo(G.gate.front.x, G.gate.front.y, { face: 'up', stopWhen: inRoom(SABER.doors3.room) });
  await d.settle();
  await d.milestone('c097_glifos', (s) => need(has(s, F.glyphs) && s.cells.includes('cell_alma_1'), `glifos ${has(s, F.glyphs)}, C097 ${s.cells.includes('cell_alma_1')}`));
  await throughGate(d, G.gate.front, SABER.doors3.room, 'pasar a las tres puertas');
  await doorRound(d, 'doors3', 3, V.variant3, { wrongFirst: true });
  await d.until((s) => inRoom(SABER.doors4.room)(s) && !s.busy, { what: 'la sala de las cuatro puertas' });
  await d.settle();
  await d.milestone('cuatro_puertas', (s) => need(has(s, F.doors3), 'sin tres puertas'));
  await doorRound(d, 'doors4', 4, V.variant4);
  await d.until((s) => inRoom(SABER.uxie.room)(s) && !s.busy, { what: 'la cámara de Uxie' });
  await d.settle();
  await d.faceEvent('uxie');
  await d.interact({ watch: [{ re: /Saber no es tener la respuesta/, name: 'uxie', delay: 150 }] });
  const thread = await items(d, 'KNOWLEDGETHREAD');
  await d.milestone('hebra_saber', (s) => need(has(s, F.saber) && thread === 1, `hebra ${thread}`));
  const ex = SABER.uxie.entry.exits[1];
  await d.leave(ex.x, ex.y, 'down', atFront(PATIO.gates.saber), 'volver al patio');
}

// ───────────────────────────── Ala del Sentir ─────────────────────────────

/** Paso de la sala de espejos con la losa de eco (reinicia el reflejo frente al jugador). */
function padStep(room, pad, s, dir) {
  const n = mirrorStep(room, s, dir);
  if (!n) return null;
  return n[0] === pad[0] && n[1] === pad[1] ? [n[0], n[1], mirrorX(n[0]), n[1]] : n;
}

function solveFrom(room, pad, start) {
  const k = (s) => s.join(',');
  const prev = new Map([[k(start), null]]);
  const q = [start];
  while (q.length) {
    const s = q.shift();
    if (reachedTarget(room, s)) {
      const path = [];
      let c = k(s);
      while (prev.get(c)) { const [pk, dd] = prev.get(c); path.unshift(dd); c = pk; }
      return path;
    }
    for (const dd of [2, 4, 6, 8]) {
      const n = padStep(room, pad, s, dd);
      if (!n || prev.has(k(n))) continue;
      prev.set(k(n), [k(s), dd]);
      q.push(n);
    }
  }
  return null;
}

async function mirrorRoom(d, m) {
  const room = MIRROR_ROOMS[m.n - 1];
  const top = floorTop(m.room);
  const pad = [m.reset.x - m.room.x, m.reset.y - top];
  const flag = [F.mirror1, F.mirror2, F.mirror3][m.n - 1];
  for (let i = 0; i < 200; i++) {
    let s = await d.snapState();
    if (s.busy || s.top !== 'MapScene') s = await d.settle({ watch: [{ re: /En el cristal aparece/, name: `espejo_${m.n}_emocion`, delay: 200 }] });
    if (has(s, flag)) return;
    const r = await d.eval((id) => window.__b16.eventPos(id), `reflejo_${m.n}`);
    if (r.moving) { await d.wait(60); continue; }
    const state = [s.x - m.room.x, s.y - top, r.x - m.room.x, r.y - top];
    const path = solveFrom(room, pad, state);
    if (!path || !path.length) throw new Error(`Sala de espejos ${m.n} sin solución desde ${state}`);
    await d.step(path[0]);
    await d.wait(90);
  }
  throw new Error(`Sala de espejos ${m.n}: demasiados pasos`);
}

async function recuerdo(d) {
  await d.until((s) => s.map === 'santuario_alma_recuerdo' && s.ready, { timeout: 15000, what: 'entrar en el recuerdo' });
  await d.settle();
  await d.expectSaid(/izquierda y derecha se invierten/, 'los controles en espejo');
  // Flecha izquierda → Gael va a la derecha
  const before = await d.snapState();
  await d.press('ArrowLeft', 300, 110);
  await d.until((s) => !s.playerBusy, { what: 'fin del paso en espejo' });
  await d.milestone('recuerdo_espejo', (s) => need(s.mirror && s.x === before.x + 1 && s.y === before.y, `de (${before.x},${before.y}) a (${s.x},${s.y}) con espejo ${s.mirror}`));
  const phase = (s) => Number(s.vars.b16_recuerdo_fase || 0);
  await d.walkTo(LAB.alerceFront.x, LAB.alerceFront.y, { face: 'up' });
  await d.interact({ watch: [{ re: /Esperaremos a la policía/, name: 'alerce_policia', delay: 150 }] });
  await d.walkTo(LAB.wait.x, LAB.wait.y, { stopWhen: (s) => phase(s) >= 2, watch: [{ re: /Vuelves tú, con el agente Olmedo/, name: 'recuerdo_vuelven', delay: 150 }] });
  await d.settle();
  await d.walkTo(ESPLANADA.front.x, ESPLANADA.front.y, { stopWhen: (s) => phase(s) >= 3, watch: [{ re: /Aquí no entra nadie a hacer turismo/, name: 'casilda', delay: 150 }] });
  await d.settle();
  await d.walkTo(ESPLANADA.bench.x, ESPLANADA.bench.y, { stopWhen: (s) => phase(s) >= 4, watch: [{ re: /se va sin decir nada/, name: 'atardecer', delay: 150 }] });
  await d.settle();
  await d.walkTo(ALJIBE.front.x, ALJIBE.front.y, { face: 'up' });
  d.want = ['Tú también llegaste lejos'];
  await d.interact({ watch: [{ re: /Contéstame/, name: 'aljibe', delay: 150 }, { scene: 'ChoiceScene', name: 'mesprit_pregunta', delay: 200 }] });
}

async function sentir(d) {
  await toFloor(d, 2);
  const [m1, m2, m3] = SENTIR.mirrors;
  await enterGate(d, PATIO.gates.sentir, m1.room);
  await d.expectSaid(/Atrápame con tu reflejo/, 'a Mesprit');
  for (const m of [m1, m2, m3]) {
    await mirrorRoom(d, m);
    const flag = [F.mirror1, F.mirror2, F.mirror3][m.n - 1];
    await d.milestone(`espejo_${m.n}`, (s) => need(has(s, flag), 'sin captura'));
    const next = m.n < 3 ? SENTIR.mirrors[m.n].room : SENTIR.lastMirror.room;
    await throughGate(d, m.gate.front, next, `salir del espejo ${m.n}`);
  }
  await d.expectSaid(/el orgullo|Orgullo\./, 'la emoción de Leandro');
  await d.expectSaid(/Carga\./, 'la emoción de Fermín');
  await d.expectSaid(/Miedo\./, 'la emoción de Fausto');
  const L = SENTIR.lastMirror;
  await d.milestone('c098', (s) => need(s.cells.includes('cell_alma_2'), 'sin C098'));
  await d.walkTo(L.front.x, L.front.y, { face: 'up' });
  await d.interact();
  await recuerdo(d);
  await d.expectSaid(/Él oyó lo mismo que tú/, 'a Mesprit tras el recuerdo');
  const thread = await items(d, 'EMOTIONTHREAD');
  await d.milestone('hebra_sentir', (s) => need(s.map === P8_MAPS[2] && has(s, F.sentir) && s.vars[V.answer] === 'lejos' && thread === 1 && !s.mirror, `respuesta ${s.vars[V.answer]}, hebra ${thread}, mapa ${s.map}`));
  const ex = SENTIR.mesprit.entry.exits[1];
  await d.leave(ex.x, ex.y, 'down', atFront(PATIO.gates.sentir), 'volver al patio');
}

// ───────────────────────────── Ala del Querer ─────────────────────────────

async function querer(d) {
  await toFloor(d, 3);
  const Wd = QUERER.wind;
  await enterGate(d, PATIO.gates.querer, Wd.room);
  await d.expectSaid(/Quien se para, vuelve atrás/, 'a Azelf');
  const local = (s) => [s.x - Wd.room.x, s.y - floorTop(Wd.room)];
  // Pararse fuera de una repisa: el viento devuelve a la de la entrada
  const full = corridorPath(...WIND_START, ...WIND_EXIT);
  await d.holdPath(full.slice(0, 6));
  await d.wait(2500);
  await d.settle();
  await d.until((s) => s.x === Wd.entry.x && s.y === Wd.entry.y && !s.busy, { timeout: 15000, what: 'el empujón del viento' });
  await d.expectSaid(/El viento de Azelf te devuelve/, 'el viento');
  await d.milestone('viento_empuja');
  for (let tries = 0; tries < 5; tries++) {
    const s = await d.snapState();
    const [gx, gy] = local(s);
    if (gx === WIND_EXIT[0] && gy === WIND_EXIT[1]) break;
    const path = corridorPath(gx, gy, ...WIND_EXIT);
    const n = await d.holdPath(path);
    const e = await d.pos();
    console.log(`  viento: ${n}/${path.length} pasos desde (${gx},${gy}) → (${e.x - Wd.room.x},${e.y - floorTop(Wd.room)})`);
    await d.settle();
  }
  await d.milestone('c099_viento', (s) => need(has(s, F.wind) && s.cells.includes('cell_alma_3'), `viento ${has(s, F.wind)}, C099 ${s.cells.includes('cell_alma_3')}`));
  await d.pushUntil('up', inRoom(QUERER.azelf.room), 'subir a la cámara de Azelf');
  await d.faceEvent('azelf');
  await d.interact({ watch: [{ re: /queda sellada durante el combate/, name: 'azelf_sello', delay: 150 }, { scene: 'BattleScene', name: 'azelf_combate', delay: 4000 }] });
  await d.expectSaid(/No podrás usar ningún objeto/, 'el sello de la Mochila');
  if (d.retry) await d.expectSaid(/Azelf espera, flotando/, 'el reintento');
  const log = await d.eval(() => window.__b16.battles.filter((b) => b.tag === 'azelf'));
  const thread = await items(d, 'WILLTHREAD');
  await d.milestone('hebra_querer', (s) => {
    const b = log[log.length - 1];
    if (!b || b.level !== 58 || b.canRun !== false || b.canCatch !== false || !/sello de Azelf/.test(b.sealedBag || '') || !b.canLose || !b.noMoneyLoss) return `combate: ${JSON.stringify(b)}`;
    if (d.retry && (log.length < 2 || !s.lost.includes('azelf') || log.slice(0, -1).some((r) => r.outcome !== 'lose' || r.moneyBefore !== r.moneyAfter || !Number.isInteger(r.turns)) || s.vars[V.azelfTries] !== log.length - 1)) return `reintentos: ${JSON.stringify(log)}`;
    if (b.outcome !== 'win') return `Azelf sin victoria real: ${JSON.stringify(b)}`;
    return need(has(s, F.querer) && thread === 1, `hebra ${thread}`);
  });
  const ex = QUERER.azelf.entry.exits[1];
  await d.leave(ex.x, ex.y, 'down', atFront(PATIO.gates.querer), 'volver al patio');
}

// ───────────────────────────── Telar ─────────────────────────────

async function telar(d) {
  await toFloor(d, 3);
  await d.faceEvent('sello_telar');
  await d.interact({ watch: [{ re: /escalera de luz/, name: 'hexagono', delay: 200 }] });
  await d.until((s) => inRoom(TELAR.room)(s) && !s.busy, { what: 'el Telar' });
  await d.settle();
  await d.walkTo(TELAR.cell.x, TELAR.cell.y, { face: 'up' });
  await d.settle();
  await d.milestone('c100', (s) => need(s.cells.includes('cell_alma_4') && s.cells.length === 100, `células ${s.cells.length}`));
  await d.turn('up');
  // Ritual: una pulsación a destiempo (hebra apagada) y luego A con cada hebra encendida.
  let early = false;
  let last = 0;
  const onBusy = async () => {
    const r = await d.eval(() => window.__b16.ritual());
    if (!r) return false;
    if (!r.lit && !early && r.index === 0) { early = true; await d.press('KeyZ', 120, 60); return true; }
    if (r.lit && Date.now() - last > 500) { last = Date.now(); await d.press('KeyZ', 80, 60); return true; }
    await d.wait(25);
    return true;
  };
  await d.press('KeyZ', 300);
  await d.settle({ onBusy, watch: [{ re: /Sabrá,/, name: 'trio_verso', delay: 150 }, { scene: 'VerseScene', name: 'verso_viii', delay: 1500 }] });
  const st = await d.eval(() => ({ chain: window.__b16.items('REDCHAIN'), threads: ['KNOWLEDGETHREAD', 'EMOTIONTHREAD', 'WILLTHREAD'].map((i) => window.__b16.items(i)), fragments: window.__b16.fragments(), crisis: window.__b16.vars().crisis_phase }));
  await d.milestone('p8_restaurado', (s) => need(has(s, F.restored) && has(s, 'verse_8') && st.chain === 1 && st.threads.every((n) => n === 0) && st.fragments.includes('F08') && st.crisis === 2 && Number(s.vars[V.weaves]) === 3,
    `P8 ${has(s, F.restored)}, ${JSON.stringify(st)}, hebras tejidas ${s.vars[V.weaves]}`));
  await d.expectSaid(/Desde fuera del santuario llega un crujido largo/, 'el crujido de fuera');
  const ex = TELAR.entry.exits[1];
  await d.leave(ex.x, ex.y, 'down', inRoom(PATIO.room, 3), 'bajar al rellano');
}

// ───────────────────────────── Hito de la Forma Completa ─────────────────────────────

async function hito(d) {
  await toFloor(d, 1);
  const ex = PATIO.exit.exits[1];
  const toLakes = (s) => s.map === 'lagos_alma';
  await d.leave(ex.x, ex.y, 'down', toLakes, 'salir a los lagos', {
    watch: [
      { re: /El cielo se abre/, name: 'cielo_roto', delay: 400 },
      { re: /El tramo de la orilla se hunde/, name: 'puente_hundido', delay: 150 },
      { re: /Forma Completa/, name: 'forma_completa', delay: 150 },
      { re: /Junto a la orilla queda otro hueco/, name: 'hueco_a_alzado', delay: 150 },
    ],
  });
  const z = await zyg(d);
  const boiling = await d.eval(() => window.__b16.boiling());
  await d.milestone('forma_completa_hecha', (s) => need(has(s, F.milestoneScene) && has(s, F.bridgeA) && has(s, F.bridgeBroken) && !has(s, F.milestone) && z.form === 'complete' && z.fly && z.rebuild && boiling && Number(s.vars.crisis_phase) === 3,
    `zygarde ${JSON.stringify(z)}, hierve ${boiling}, crisis ${s.vars.crisis_phase}`));
  const B = BRIDGE.sockets.B[0];
  await d.walkTo(B.x, B.y - 1, { face: 'down' });
  await d.interact({ watch: [{ re: /zócalo con hexágonos gastados/, name: 'tutorial_reconstruccion', delay: 150 }, { re: /Aquí Leandro, en Caudal/, name: 'radio', delay: 150 }] });
  await d.expectSaid(/¡Me reconoce otra vez!/, 'a Marta y su Snorunt');
  await d.expectSaid(/Abril, desde la Meseta/, 'la radio de Abril');
  await d.expectSaid(/Fermín\. Apuntalo la mina/, 'la radio de Fermín');
  await d.expectSaid(/Registro completo/, 'la despedida de Genesis');
  await d.milestone('hito', (s) => need([F.bridgeB, F.milestone, F.bond, F.radio, F.genesis, F.flyHint, 'zyg_rebuild_tutorial'].every((f) => has(s, f)) && !has(s, F.milestonePartial), 'faltan flags del hito'));
  await d.walkTo(BRIDGE.cx, BRIDGE.y1 + 2);
  await d.milestone('puente_a_pie', (s) => need(!s.surfing, 'cruzó nadando'));
  await d.faceEvent('marta');
  await d.interact();
  await d.expectSaid(/Ha vuelto a mi lado en cuanto hemos pisado la orilla/, 'a Marta después');
}


async function evaristo(d) {
  await d.talk(7, 8, 'right', { watch: [{ re: /Mesa de los Vientos/, name: 'evaristo_t14', delay: 200 }] });
  await d.expectSaid(/Va dirigida «a la Mesa de los Vientos»/, 'la carta sin destino');
  const clue = await d.eval(() => window.__b16.clue('T14'));
  await d.milestone('t14', (s) => need(has(s, F.letter) && clue === 'active', `pista T14: ${clue}`));
}


export async function runB16(d,name){
 await refreshDriver(d);await installB16Observer(d.page);d.retry=false;
 await d.stages('B16',{codigoIntegrado:async d=>{await reloadCheckpoint(d,name,'B15');await installB16Observer(d.page);},
  preparacion:prepareB16,entrada:async d=>d.travel('lagos_alma'),lagos,saber,sentir,querer,telar,hito,evaristo:async d=>{await d.travel('nexo_correos');await evaristo(d);}});
}
