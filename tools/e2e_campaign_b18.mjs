import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB16Observer} from './e2e_campaign_b16_page.mjs';
import {installB18Observer} from './e2e_campaign_b18_page.mjs';
import {Driver18} from './e2e_b18_driver.mjs';
import { ARRIVAL, BRIDGE, MOUTH, CAMP } from '../game/src/content/maps/b18/puente_layout.js';
import { ROOM_PLACES, VESTIBULO, NUCLEO, SHORTCUT, ENTRY } from '../game/src/content/maps/b18/cruce_layout.js';
import { F, V } from '../game/src/content/events/b18_common.js';
import { solveAxisRoom, solveAxis } from '../game/src/world/axis/logic.js';

const has = (s, f) => Boolean(s.flags[f]);
const need = (cond, msg) => (cond ? null : msg);
const vars = (d) => d.eval(() => window.__b16.vars());
const items = (d, id) => d.eval((i) => window.__b16.items(i), id);
const inRect = (r) => (s) => s.map === (r === NUCLEO.room ? 'camara_cruce_nucleo' : 'camara_cruce') && s.x >= r.x && s.x < r.x + r.w && s.y >= r.y && s.y < r.y + r.h;

// ───────────────────────────── Estado de entrada (CAMPANA B18: b17_vigilia, Cadena Roja, Reconstrucción) ─────────


async function exterior(d) {
  await d.walkTo(25, 38);
  await d.walkTo(25, 49);
  await d.walkTo(20, 49);
  await d.shot('columna_exterior');
  await d.pushUntil('up', (s) => s.map === 'puente_convergencia', 'entrar por la columna visible');
  await d.settle();
  await d.walkTo(20, 0);
  await d.pushUntil('up', (s) => s.map === 'senda_mirador', 'salir de la primera planta');
  await d.milestone('columna_regreso', (s) => need(s.x === 20 && s.y === 49, 'la salida rebota sobre el warp exterior'));
  await d.pushUntil('up', (s) => s.map === 'puente_convergencia', 'volver a entrar al Pilar');
  await d.settle();
}

// ───────────────────────────── Puente: llegada y Reconstrucción ─────────────────────────────

async function puente(d) {
  await d.settle();
  await d.expectSaid(/Olmedo reúne a la Policía Regional en la Senda/, 'a Alerce en la llegada');
  await d.expectSaid(/En el tramo central se abren tres huecos/, 'la narración de los huecos');
  await d.milestone('llegada', (s) => need(has(s, F.arrival), 'sin llegada'));
  for (const g of BRIDGE.gaps) {
    await d.walkTo(g.socket.x, g.socket.y - 1, { face: 'down' });
    await d.interact();
    await d.milestone(`tramo_${g.n}`, (s) => need(has(s, g.flag), `el tramo ${g.n} no se alza`));
  }
  await d.expectSaid(/Tres activaciones seguidas\. Es el portador\./, 'a Casia viendo el puente');
  await d.milestone('puente_entero', (s) => need(has(s, F.bridge), 'el puente no queda entero'));
}

// ───────────────────────────── Genesis ─────────────────────────────

async function genesis(d) {
  // Casia intercepta en la franja; la primera derrota es simulada (reintento curado en su casilla)
  await d.walkTo(20, 33, { stopWhen: (s) => has(s, F.casia), watch: [{ re: /sigue siendo un dato/, name: 'casia_intro', delay: 100 }] });
  await d.settle();
  const b = await d.battles();
  const casia = b.filter((x) => x.tag === 'b18_casia');
  for(let attempt=0;attempt<8&&!has(await d.snap(),F.casia);attempt++)await d.talk('casia');
  const casiaDone=(await d.battles()).filter(b=>b.tag==='b18_casia').at(-1);
  await d.milestone('casia',s=>need(has(s,F.casia)&&has(s,F.heal1)&&casiaDone?.outcome==='win','Casia sin victoria real'));
  await d.walkTo(20, 36, { stopWhen: (s) => has(s, F.garrido) });
  await d.settle();
  await d.milestone('garrido', (s) => need(has(s, F.garrido) && has(s, F.heal2), 'Garrido sin vencer o sin cura'));
  // Vértice: la frase antes del combate y la escena completa
  await d.faceEvent('vertice');
  await d.interact({
    watch: [
      { re: /Él te enseñó a escuchar/, name: 'vertice_frase', delay: 120 },
      { re: /El aire se desgarra sobre la Sima/, name: 'irrupcion', delay: 250 },
      { re: /No voy a pedirle permiso a nadie/, name: 'gael', delay: 120 },
      { re: /Quedan detenidos/, name: 'detencion', delay: 120 },
    ],
  });
  const log = await d.log();
  const line = log.findIndex((l) => l.text === 'Él te enseñó a escuchar. ¿Quién crees que le enseñó a él?' && l.speaker === 'Vértice');
  const vb = (await d.battles()).find((x) => x.tag === 'b18_vertice');
  if (line < 0 || !vb || vb.logAt <= line) throw new Error(`la frase de Vértice no llega antes del combate (línea ${line}, combate en ${vb?.logAt})`);
  await d.expectSaid(/^Ven conmigo\. Tú sabes lo que es esperar\.$/, 'la oferta de Vértice a Gael');
  await d.expectSaid(/^No voy a pedirle permiso a nadie\. Tampoco a usted\.$/, 'la respuesta de Gael');
  await d.milestone('escena', (s) => need([F.vertice, F.irruption, F.gael, F.verticeGone, F.notebook, F.arrest, F.scene, F.heal3].every((f) => has(s, f)), 'faltan flags de la escena'));
}

// ───────────────────────────── Cámara del Cruce ─────────────────────────────

async function cruce(d) {
  await d.walkTo(MOUTH.front.x, MOUTH.front.y);
  await d.pushUntil('up', (s) => s.map === 'camara_cruce', 'subir a la Cámara del Cruce');
  await d.settle();
  await d.expectSaid(/Una sala de mármol plateado suspendida sobre el abismo/, 'la llegada a la Cámara');
  await d.milestone('camara', (s) => need(has(s, F.chamberIn) && s.x === ENTRY.x && s.y === ENTRY.y, 'sin llegada a la Cámara'));
  let mode = await d.axis();
  const roomFlags = [null, F.room1, F.room2, F.room3];
  for (const [i, place] of ROOM_PLACES.entries()) {
    await d.walkTo(place.entry.x, place.entry.y);
    const plan = solveAxisRoom(place.grid, { mode });
    if (!plan) throw new Error(`${place.name}: sin solución con ${mode}`);
    const end = await d.playRoom(place, plan, { ...place.grid.entry, mode });
    mode = end.mode;
    if (i === 0) await d.expectSaid(/El cristal vibra con la Cadena Roja/, 'el tutorial del primer cristal');
    await d.milestone(`sala_${place.name}`, (s) => need(!roomFlags[i] || has(s, roomFlags[i]), `${place.name} sin superar`));
    const next = ROOM_PLACES[i + 1]?.room || NUCLEO.room;
    await d.pushUntil('up', inRect(next), `cruzar la puerta de ${place.name}`);
  }
  await d.walkTo(NUCLEO.arrival.x, NUCLEO.arrival.y, { stopWhen: (s) => has(s, F.nucleus) });
  await d.settle();
  await d.expectSaid(/Una sala blanca partida en dos/, 'la llegada al núcleo');
  await d.milestone('nucleo', (s) => need(has(s, F.nucleus), 'el núcleo no queda visto'));
  await coreReturn(d, 'regreso_antes_restaurar');
}

async function coreReturn(d, name) {
  await d.walkTo(NUCLEO.stairs.arrive.x, NUCLEO.stairs.exits[1].y);
  await d.pushUntil('down', (s) => s.map === 'camara_cruce', 'bajar de la tercera a la segunda planta');
  await d.milestone(name, (s) => need(s.x === SHORTCUT.front.x && s.y === SHORTCUT.front.y, 'llegada sobre un warp o fuera del vestíbulo'));
  await shortcut(d);
}

/** Del vestíbulo al núcleo por el atajo (con el eje que haya; el solucionador dice cómo cruzar los escombros). */
async function shortcut(d) {
  const mode = await d.axis();
  const goal = { x: SHORTCUT.front.x - VESTIBULO.ox, y: SHORTCUT.front.y - VESTIBULO.oy };
  await d.walkTo(VESTIBULO.entry.x, VESTIBULO.entry.y);
  const plan = solveAxis(VESTIBULO.grid, { ...VESTIBULO.grid.entry, mode }, (x, y) => x === goal.x && y === goal.y);
  if (!plan) throw new Error(`sin camino al atajo con ${mode}`);
  await d.playRoom(VESTIBULO, plan, { ...VESTIBULO.grid.entry, mode });
  await d.pushUntil('up', inRect(NUCLEO.room), 'tomar el atajo del vestíbulo');
  await d.settle();
}

// ───────────────────────────── Núcleo: elección, combate y P9 ─────────────────────────────

async function nucleo(d) {
  const s0 = await d.snapState();
  if (!has(s0, F.nucleus)) {
    await d.walkTo(NUCLEO.arrival.x, NUCLEO.arrival.y, { stopWhen: (s) => has(s, F.nucleus) });
    await d.settle();
  }
  // «No» en la confirmación: nada queda fijado (el verso IX sí se lee)
  await d.faceEvent('nucleo_p9');
  d.want.push('Atar a Palkia (el espacio)', 'No');
  await d.interact({ watch: [{ scene: 'VerseScene', name: 'verso_ix', delay: 700 }] });
  d.want = [];
  await d.milestone('eleccion_no', async (s) => need(!(await vars(d))[V.choice] && has(s, F.verse), 'la elección quedó fijada sin confirmar o sin verso IX'));
  // Dialga, confirmado; la primera vez el jugador pierde (derrota simulada): entrada de la Cámara, elección conservada
  d.want.push('Atar a Dialga (el tiempo)', 'Sí');
  await d.interact({ watch: [{ re: /La Cadena Roja solo retendrá a Dialga/, name: 'aviso_captura', delay: 100 }] });
  d.want = [];
  for(let attempt=0;attempt<12&&!has(await d.snap(),F.bound);attempt++){
    if((await d.snap()).map==='camara_cruce')await shortcut(d);
    await d.faceEvent('nucleo_p9');await d.interact();
  }
  const clue = await d.eval(() => window.__b16.clue('T15'));
  const frags = await d.eval(() => window.__b16.fragments());
  await d.milestone('p9', async (s) => {
    const v = await vars(d);
    const won = (await d.battles()).filter((x) => x.tag === 'p9').at(-1);
    return need(has(s, F.bound) && has(s, F.restored) && has(s, F.tempered) && frags.includes('F09') && ['active', 'queued'].includes(clue)
      && v[V.choice] === 'DIALGA' && v[V.caught] === false && won?.outcome === 'win' && (await items(d, 'REDCHAIN')) > 0,
    `P9 incompleto: ${JSON.stringify({ clue, frags, choice: v[V.choice], caught: v[V.caught], won })}`);
  });
  await d.faceEvent('orbe_no_elegido');
  await d.interact();
  await d.milestone('orbe', async () => need((await items(d, 'LUSTROUSORB')) === 1 && (await items(d, 'ADAMANTORB')) === 0, 'Palkia no deja la Lustresfera'));
}

// ───────────────────────────── El elegido vuelve tras descansar: captura ─────────────────────────────


async function miradorReturn(d) {
  await d.walkTo(NUCLEO.stairs.arrive.x, NUCLEO.stairs.exits[1].y);
  await d.pushUntil('down', (s) => s.map === 'camara_cruce', 'bajar al vestíbulo');
  const mode = await d.axis();
  const now = await d.snapState();
  const from = { x: now.x - VESTIBULO.ox, y: now.y - VESTIBULO.oy, mode };
  const goal = VESTIBULO.grid.entry;
  const plan = solveAxis(VESTIBULO.grid, from, (x, y) => x === goal.x && y === goal.y);
  if (!plan) throw new Error('sin regreso del atajo a la entrada del vestíbulo');
  await d.playRoom(VESTIBULO, plan, from);
  await d.walkTo(ENTRY.x, ENTRY.y);
  await d.pushUntil('down', (s) => s.map === 'puente_convergencia', 'bajar a la primera planta');
  await d.walkTo(20, 59);
  await d.pushUntil('down', (s) => s.map === 'mirador_sur', 'salir al Mirador Sur');
  await d.milestone('mirador_sur', (s) => need(s.x === 20 && s.y === 1, 'salida sur incorrecta'));
  await d.pushUntil('up', (s) => s.map === 'puente_convergencia', 'volver desde el Mirador Sur');
  await d.walkTo(20, 0);
  await d.pushUntil('up', (s) => s.map === 'senda_mirador', 'cruzar desde el Sur al Norte');
  await d.milestone('miradores_conectados', (s) => need(s.x === 20 && s.y === 49, 'no se vuelve a la columna norte'));
}


export async function runB18(d){
 await refreshDriver(d);await installB16Observer(d.page);await installB18Observer(d.page);
 for(const method of ['axis','battles','playRoom'])d[method]=Driver18.prototype[method];
 await d.stages('B18',{puente,genesis,cruce,nucleo,regreso:miradorReturn});
 for(const method of ['axis','battles','playRoom'])delete d[method];
}
