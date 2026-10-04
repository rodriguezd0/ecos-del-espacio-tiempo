import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB16Observer} from './e2e_campaign_b16_page.mjs';
import * as SENDA from '../game/src/content/maps/b17/senda_layout.js';
import * as MIR from '../game/src/content/maps/b17/mirador_layout.js';
import * as MESA from '../game/src/content/maps/b17/mesa_layout.js';
import { CIRCLE_POINTS, DANCE_ORDER } from '../game/src/content/events/b17_circulo_logic.js';
import { parseRoom, solveRoom } from '../game/src/content/events/b17_torres_logic.js';
import { VIGIL } from '../game/src/content/events/b17_vigilia.js';
import { F, V } from '../game/src/content/events/b17_common.js';

const has = (s, f) => Boolean(s.flags[f]);
const need = (cond, msg) => (cond ? null : msg);
const b17 = (d, fn, arg) => d.eval(fn, arg);
const hourOf = (d) => d.eval(() => window.__e2e.engine.state.hour);

// ───────────────────────────── Estado de entrada (CAMPANA B17: p8_restored, zyg_complete, crisis en fase 3) ─────────


async function t14(d) {
  d.want.push('Villa Brontia', 'La Meseta del Impulso');
  await d.interact();
  await d.expectSaid(/Entre el rayo y la sal/, 'el acertijo del sobre');
  await d.expectSaid(/salinas de Estrato/, 'la sal de Estrato');
  await d.milestone('acertijo', async (s) => {
    const fp = await b17(d, () => [...(window.__e2e.engine.state.data.flyPoints || [])]);
    return need(has(s, F.envelope) && has(s, F.riddle) && fp.includes('mesa_vientos'), `sin acertijo o Vuelo (${fp})`);
  });
  // Se sale a la calle (en un interior no se vuela) y Zygarde lleva al jugador a la Mesa.
  await d.walkTo(4, 9, { stopWhen: (s) => s.map !== 'nexo_correos' });
  await d.exitTo('down', 'ciudad_nexo');
  await d.fly('mesa_vientos');
  await d.until((s) => s.map === 'mesa_vientos', { timeout: 30000, what: 'volar a la Mesa' });
  await d.settle();
}

// ───────────────────────────── Mesa de los Vientos ─────────────────────────────

/** Se acerca a un Altaria y lo toca (encuentro visible): combate de guion hasta calmarlo. */
async function calmAltaria(d, n) {
  const id = `altaria_rebano_${n}`;
  for (let tries = 0; tries < 6; tries++) {
    const pos = await b17(d, (e) => window.__b16.eventPos(e), id);
    if (!pos?.alive) return;
    const at = await d.faceEvent(id);
    const s = await d.snapState();
    const dir = at.x > s.x ? 6 : at.x < s.x ? 4 : at.y > s.y ? 2 : 8;
    await d.press(d.keyFor(dir, s), 250, 120);
    await d.settle({ timeout: 300000 });
    if (has(await d.snapState(), [F.altaria1, F.altaria2, F.altaria3][n - 1])) return;
  }
  throw new Error(`No se pudo calmar al Altaria ${n}`);
}

async function mesa(d) {
  await d.settle();
  await d.expectSaid(/Aquí no sube nadie desde las tormentas/, 'a Brisa');
  await d.milestone('mesa', (s) => need(has(s, F.mesaArrival), 'sin llegada'));
  // 1 · prado del oeste
  await calmAltaria(d, 1);
  await d.milestone('altaria_prado', (s) => need(has(s, F.altaria1), 'el Altaria del prado sigue suelto'));
  // 3 · el Alto (Trepar)
  await d.walkTo(MESA.CLIMB.up.x, MESA.CLIMB.up.y + 1, { face: 'up' });
  await d.interact();
  await d.until((s) => s.y === MESA.CLIMB.top[1] && !s.busy, { timeout: 15000, what: 'trepar al Alto' });
  await calmAltaria(d, 3);
  await d.walkTo(MESA.CLIMB.top[0], MESA.CLIMB.top[1], { face: 'down' });
  await d.interact();
  await d.until((s) => s.y === MESA.CLIMB.bottom[1] && !s.busy, { timeout: 15000, what: 'bajar del Alto' });
  await d.milestone('altaria_alto', (s) => need(has(s, F.altaria3), 'el Altaria del Alto sigue suelto'));
  // 2 · la Aguja (Reconstrucción)
  const sock = MESA.AGUJA_GAP.sockets[0];
  await d.walkTo(sock.x - 1, sock.y, { face: 'right' });
  await d.interact();
  await d.until((s) => has(s, 'b17_aguja'), { timeout: 20000, what: 'alzar el paso a la Aguja' });
  await calmAltaria(d, 2);
  await d.settle();
  await d.expectSaid(/Han vuelto los tres/, 'la confianza de los cuidadores');
  await d.milestone('rebano', (s) => need(has(s, F.trust), 'sin confianza'));
  // Aurora: la cabaña, la carta y el vuelo a Nexo
  const door = MESA.BUILDINGS.aurora.door;
  await d.walkTo(door.x, door.y + 1, { stopWhen: (s) => s.map === 'mesa_vientos_casa' });
  await d.exitTo('up', 'mesa_vientos_casa');
  await d.faceEvent('aurora');
  await d.interact({ timeout: 300000 });
  await d.until((s) => s.map === 'nexo_correos' && has(s, F.reunion), { timeout: 60000, what: 'el reencuentro en Correos' });
  await d.settle();
  await d.expectSaid(/Tu carta ha llegado, Evaristo/, 'a Aurora');
  await d.expectSaid(/mira qué están montando/, 'el aviso de Alerce (Mirador Sur sin ver)');
  await d.milestone('reencuentro', async (s) => {
    const tablets = await b17(d, () => [...(window.__e2e.engine.state.data.tablets || [])]);
    const stara = await b17(d, () => window.__b16.items('STARAPTITE'));
    const clue = await b17(d, () => window.__b16.clue('T14'));
    return need(tablets.includes('SKYPLATE') && stara === 1 && clue === 'solved', `tablillas ${tablets} · Staraptorita ${stara} · T14 ${clue}`);
  });
}

// ───────────────────────────── Mirador Sur: la ocupación ─────────────────────────────

async function mirador(d) {
  // La escena salta en el paso estrecho de la avenida (COMPOUND.approaches) y lleva al jugador ante la puerta.
  const T = MIR.COMPOUND.trigger;
  await d.walkTo(T.x0 + 2, T.y, { stopWhen: (s) => has(s, F.mirador), watch: [{ re: /colgado sobre el vacío/, name: 'resonador', delay: 200 }] });
  await d.settle();
  await d.expectSaid(/Estudio geotécnico del Consorcio/, 'al técnico de la puerta');
  await d.expectSaid(/Cadena Sintética ya resuena/, 'a los técnicos del Resonador');
  await d.expectSaid(/soy Alerce/, 'el mensaje de Alerce');
  await d.milestone('mirador', (s) => need(has(s, F.mirador) && has(s, F.alerceCall), 'sin escena o sin mensaje'));
}

// ───────────────────────────── Torres ─────────────────────────────

/** Recorre una sala de torre con la solución del solucionador (alzar mirando al zócalo + A + «Sí»). */
async function crossTower(d, t) {
  const room = parseRoom(t.room);
  const e = { x: t.ox + room.entry.x, y: t.oy + room.entry.y };
  await d.walkTo(e.x, e.y);
  await d.settle();
  const sol = solveRoom(room);
  for (const a of sol) {
    if (a.move) { await d.step(a.move); await d.settle({ timeout: 300000 }); continue; }
    await d.turn(a.face);
    await d.interact();
  }
}

async function tower(d, t, flag) {
  await crossTower(d, t);
  await d.settle({ timeout: 400000 });
  await d.milestone(`tecnicos_${t.id}`, (s) => need(has(s, `b17_torre_${t.id}_tecnicos`), 'sin combate de técnicos'));
  const stand = { x: t.ox + t.room.stand.x, y: t.oy + t.room.stand.y };
  await d.walkTo(stand.x, stand.y, { face: t.room.face });
  await d.interact();
  await d.milestone(`torre_${t.id}`, async (s) => {
    const fr = await b17(d, () => window.__b16.items('FULLRESTORE'));
    const rc = await b17(d, () => window.__b16.items('RARECANDY'));
    return need(has(s, flag) && Number(s.vars[V.towersOff]) >= 1 && fr >= 1 && rc >= 1, `torre ${has(s, flag)} · var ${s.vars[V.towersOff]} · objetos ${fr}/${rc}`);
  });
}

async function temblor(d) {
  await tower(d, MIR.TOWER, F.towerTemblor);
}

async function viento(d) {
  await tower(d, SENDA.TOWERS.viento, F.towerViento);
}

// ───────────────────────────── Vigilia (Caudal) ─────────────────────────────

async function vigilia(d) {
  await d.walkTo(VIGIL.player.x, VIGIL.player.y + 1, { stopWhen: (s) => has(s, F.vigil) || s.busy });
  await d.settle({ timeout: 300000 });
  await d.expectSaid(/Van a intentarlo por la fuerza\./, 'la frase de Alerce');
  await d.expectSaid(/Casilda, en el Umbral/, 'la radio de los Guardianes');
  const h = await hourOf(d);
  await d.milestone('vigilia', (s) => need(has(s, F.vigil) && (h >= 20 || h < 6), `vigilia ${has(s, F.vigil)} hora ${h}`));
}

// ───────────────────────────── Senda del Mirador (salida) ─────────────────────────────

async function senda(d) {
  const sock = SENDA.GAP.sockets[0];
  await d.walkTo(sock.x, sock.y - 1, { face: 'down' });
  await d.interact();
  await d.until((s) => has(s, F.sendaGap), { timeout: 20000, what: 'reconstruir el tramo derrumbado' });
  await d.settle();
  await d.milestone('tramo', (s) => need(has(s, F.sendaGap), 'sin tramo'));
  const b = SENDA.BRIDGE;
  await d.walkTo(b.x0 + 2, b.y1 - 1, { stopWhen: (s) => s.map !== 'senda_mirador' });
  await d.milestone('salida', (s) => need(has(s, F.vigil) && s.map === 'senda_mirador' && s.y === b.y1 - 1, `en ${s.map} (${s.x},${s.y})`));
  // B18 engancha su Puente por el borde sur: se cruza si su mapa está registrado (si no, el aviso neutro del tablero).
  const puente = await d.eval(async () => Object.hasOwn((await import('/src/content/maps/index.js')).MAPS, 'puente_convergencia'));
  if (puente) {
    await d.pushUntil('down', (s) => s.map === 'puente_convergencia', 'cruzar al Puente de la Convergencia (B18)');
    await d.milestone('puente_b18', (s) => need(s.map === 'puente_convergencia', `en ${s.map}`));
  }
}

// ───────────────────────────── Círculo del Jardín (Villa Alba) ─────────────────────────────

async function raiseSlab(d, i) {
  await d.faceEvent(`circulo_piedra_${i}`);
  await d.interact({ timeout: 300000 });
}

async function circulo(d) {
  await d.settle();
  await d.expectSaid(/los Clefairy bajan del bosque y bailan en el jardín/, 'a Mamá');
  const h = await hourOf(d);
  await d.milestone('mama', (s) => need(has(s, F.momClefairy) && (h >= 20 || h < 6), `hora ${h}`));
  await d.walkTo(7, 10, { stopWhen: (s) => s.map === 'villa_alba' });
  await d.exitTo('down', 'villa_alba');
  await d.settle({ timeout: 300000 });
  const elderHome = await b17(d, () => window.__b16.eventPos('anciano'));
  await d.expectSaid(/un corro de Clefairy baila/, 'la danza');
  await d.milestone('danza', (s) => need(has(s, F.danceSeen), 'sin danza'));
  // Un error: la segunda de la danza en primer lugar → se hunden y vuelven a bailar
  await raiseSlab(d, DANCE_ORDER[1]);
  await d.expectSaid(/vuelven a hundirse/, 'el error');
  await d.milestone('error', (s) => need(Number(s.vars[V.circleStep] || 0) === 0, 'las piedras no se hundieron'));
  for (const i of DANCE_ORDER) await raiseSlab(d, i);
  await d.settle({ timeout: 300000 });
  await d.expectSaid(/No dijo nada de levantarlas/, 'al anciano');
  await d.expectSaid(/en el jardín dormía algo/, 'a Mamá');
  await d.milestone('circulo', async (s) => {
    const moon = await b17(d, () => window.__b16.items('MOONSTONE'));
    const elder = await b17(d, () => window.__b16.eventPos('anciano'));
    const home = !elderHome || (elder && elder.x === elderHome.x && elder.y === elderHome.y);
    return need(has(s, F.circle) && moon === 3 && home, `círculo ${has(s, F.circle)} · Piedras Lunares ${moon} · anciano ${JSON.stringify(elder)} (su piedra ${JSON.stringify(elderHome)})`);
  });
}


export async function runB17(d){
 await refreshDriver(d);await installB16Observer(d.page);
 await d.stages('B17',{t14:async d=>{await d.travel('nexo_correos');await t14(d);},mesa,
 mirador:async d=>{await d.travel('mirador_sur');await mirador(d);},temblor,
 viento:async d=>{await d.travel('senda_mirador');await viento(d);},
 vigilia:async d=>{await d.travel('ciudad_caudal');await vigilia(d);},
 circulo:async d=>{await d.travel('casa_prota_1f');await d.talk('mama');await circulo(d);},
 senda:async d=>{await d.travel('senda_mirador');await senda(d);}});
}
