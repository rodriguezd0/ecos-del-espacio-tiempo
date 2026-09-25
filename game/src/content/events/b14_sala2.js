// Sala 2 de las Ruinas de Antea, «Calle de los Pescadores» (docs/CAMPANA.md B14: «Fausto (sala 2, capa Antea): repite
// el mismo día; hay que llevarle a una caracola en el orden de su rutina para que despierte. Vuelve a Caleta por su
// cuenta» y «cerrar una compuerta seca una sala del presente»).
//   Antea: Fausto repite su día (la fuente → el puesto de redes → la compuerta del aljibe → la caracola del muelle).
//     Se le acompaña eligiendo la siguiente parada (var b14_fausto); una parada fuera de orden reinicia el día. En la
//     compuerta, la rueda (dura para uno solo) se gira entre los dos: el aljibe queda estanco (flag b14_compuerta).
//     En la caracola, Fausto «despierta», regala un Real de plata y vuelve a Caleta por su cuenta.
//   Presente: el equipo de Fausto enredado en una columna; del aljibe sale una corriente violenta mientras la
//     compuerta siga abierta en Antea; cerrada, el aljibe es una bolsa de aire y deja pasar a la sala 3.
// Módulo puro salvo los guiones.
import { ROOM2 } from '../maps/b14/layout.js';
import { F, V, SPEAKER, SPRITE, OBJ, lines, zygardeSays, byGender, eventById, placePlayer, pause } from './b14_common.js';
import { ventEvents, echoCitizen, echoDoor, itemEvents, outflowCurrent, bigSprite } from './b14_antea_common.js';
import { caracolaEvents } from './b14_caracolas.js';

const STOPS = ROOM2.stops;
const step = (s) => Math.max(0, Math.min(3, Number(s?.var(V.fausto, 0)) || 0));
const closed = (s) => Boolean(s?.flag(F.cistern));

export const FAUSTO_TEXT = Object.freeze({
  first: [
    '¡Buenos días! ¿Eres de otro barrio? Hoy voy con prisa.',
    'Antes de que suba la marea hay que cerrar la compuerta del aljibe. La red, en cuanto le lleve el agua a madre. Y la caracola del muelle, siempre la última, al caer la tarde.',
    '…Qué raro. Juraría que esto ya te lo he dicho.',
  ],
  firstCore: [
    'Está atrapado en un día que ya pasó. Lo repite sin darse cuenta.',
    'Si lo acompañas por su día, en su orden, quizá despierte.',
  ],
  ask: '¿Me acompañas? ¿Adónde tocaba ir ahora?',
  notYet: 'Todavía no',
  later: 'Pues no te entretengo. ¡Que se me va el día!',
  wrong: '…No. Eso no toca ahora. Me he liado.',
  wrongCore: 'El día ha vuelto a empezar.',
  restart: 'Buenos días otra vez… ¿o era la primera? Voy a por el agua de madre.',
  arrive: {
    redes: ['La red del puesto. Madre la remendó anoche… ¿o fue hace mucho?', 'Ya está. Ahora, antes de la marea…'],
    compuerta: ['La compuerta del aljibe. Antes de la marea, siempre.', 'Échame una mano, que la rueda es dura para uno solo.'],
    compuertaDone: ['La compuerta ya estaba cerrada. Bien hecho.'],
    caracola: ['Y la caracola del muelle, al caer la tarde. Como siempre.'],
  },
  wheel: 'Giráis la rueda entre los dos. La compuerta baja con un golpe sordo y el agua deja de entrar en el aljibe.',
  wheelCore: 'El agua ya no entra en el aljibe. Allí abajo, en el presente, se notará.',
  wheelAlone: 'La rueda de la compuerta está agarrotada. Sola no se mueve.',
  wheelClosed: 'La compuerta del aljibe está cerrada. El aljibe queda estanco.',
  wake: [
    '¿Qué…? ¿Dónde está el agua? ¿Dónde está todo el mundo?',
    'Tú… Te he visto antes. Hoy. Muchas veces.',
    'Bajé a las ruinas siguiendo unas luces verdes que salían de la muralla. Una ola rara me arrastró… y amaneció otra vez aquí. Y otra. Y otra.',
  ],
  tell: 'Le cuentas que en Caleta Sonda lo buscan desde hace días.',
  wake2: [
    'Días… Mi madre estará… Tengo que volver.',
    'Sé el camino: por donde entré, por el lado del mar. No te preocupes por mí.',
    'Toma. Lo cogí en la fuente, en este día que no se acaba. No quiero llevarme nada de aquí.',
  ],
  bye: (s) => `Gracias, ${byGender(s, 'amigo', 'amiga')}. Nos vemos en la caleta.`,
  gone: 'Su eco ya no lo retiene. Volverá a su casa.',
  gear: 'Unas aletas y unas gafas de buceo, enredadas en una columna. En la goma, escrito a mano: «FAUSTO».',
  gearCore: 'Estuvo aquí. Su rastro sigue en el eco de esta calle.',
  cistern: 'Una corriente violenta sale del aljibe y te empuja hacia atrás.',
  cisternCore: 'El mar entra ahí por algún sitio… y sale con fuerza. En el eco de esta calle, quizá se pueda cerrar.',
  dry: 'El aljibe está seco: una bolsa de aire llena la sala. Huele a piedra vieja.',
  dryCore: 'Lo cerrasteis antes de que la ciudad se hundiera. El aire se quedó dentro.',
});

// ───────────────────────────── Fausto (Antea) ─────────────────────────────

/** Casilla de Fausto según su parada (0–3). */
const at = (i) => STOPS[i].fausto;

/** Viaje con fundido: Fausto y el jugador llegan a la parada `i`. */
async function travel(ctx, i) {
  await ctx.fade('out', 16);
  const f = eventById(ctx, 'fausto_eco');
  if (f) { f.moveTo(at(i).x, at(i).y); f.direction = at(i).dir; }
  await placePlayer(ctx, STOPS[i].player);
  await pause(ctx, 8);
  await ctx.fade('in', 16);
}

async function resetDay(ctx) {
  await ctx.say(FAUSTO_TEXT.wrong, { speaker: SPEAKER.fausto });
  ctx.setVar(V.fausto, 0);
  await travel(ctx, 0);
  await zygardeSays(ctx, FAUSTO_TEXT.wrongCore);
  await ctx.say(FAUSTO_TEXT.restart, { speaker: SPEAKER.fausto });
}

async function doCompuerta(ctx) {
  if (closed(ctx.state)) { await lines(ctx, SPEAKER.fausto, FAUSTO_TEXT.arrive.compuertaDone); return; }
  await lines(ctx, SPEAKER.fausto, FAUSTO_TEXT.arrive.compuerta);
  ctx.se('PRSFX- Heavy Slam1', { volume: 70 });
  ctx.shake(3, 5, 30);
  await ctx.say(FAUSTO_TEXT.wheel);
  ctx.setFlag(F.cistern);
  ctx.requestRefresh();
  await zygardeSays(ctx, FAUSTO_TEXT.wheelCore);
}

async function wakeUp(ctx) {
  await lines(ctx, SPEAKER.fausto, FAUSTO_TEXT.arrive.caracola);
  ctx.se('Anim/Water1', { volume: 80 });
  await ctx.flash([104, 216, 192], 20, 200);
  const f = eventById(ctx, 'fausto_eco');
  if (f) { f.opacity = 255; f.turnToward?.(ctx.player); }
  await lines(ctx, SPEAKER.fausto, FAUSTO_TEXT.wake);
  await ctx.say(FAUSTO_TEXT.tell);
  await lines(ctx, SPEAKER.fausto, FAUSTO_TEXT.wake2);
  if (!ctx.flag(F.silverGift)) {
    await ctx.giveItem('RELICSILVER', 1);
    ctx.setFlag(F.silverGift);
  }
  await ctx.say(FAUSTO_TEXT.bye(ctx.state), { speaker: SPEAKER.fausto });
  await ctx.fade('out', 24);
  ctx.setFlag(F.faustoAwake);
  ctx.requestRefresh();
  await pause(ctx, 20);
  await ctx.fade('in', 24);
  await zygardeSays(ctx, FAUSTO_TEXT.gone);
}

async function faustoTalk(ctx) {
  const sp = SPEAKER.fausto;
  if (!ctx.flag(F.faustoMet)) {
    ctx.setFlag(F.faustoMet);
    await lines(ctx, sp, FAUSTO_TEXT.first);
    for (const t of FAUSTO_TEXT.firstCore) await zygardeSays(ctx, t);
  }
  const cur = step(ctx.state);
  const options = STOPS.map((s, i) => ({ i, label: s.label })).filter((o) => o.i !== cur);
  const pick = await ctx.choice([...options.map((o) => o.label), FAUSTO_TEXT.notYet], { message: FAUSTO_TEXT.ask, cancel: options.length });
  const chosen = options[pick];
  if (!chosen) { await ctx.say(FAUSTO_TEXT.later, { speaker: sp }); return; }
  if (chosen.i !== cur + 1) { await resetDay(ctx); return; }
  await travel(ctx, chosen.i);
  ctx.setVar(V.fausto, chosen.i);
  const key = STOPS[chosen.i].key;
  if (key === 'redes') await lines(ctx, sp, FAUSTO_TEXT.arrive.redes);
  else if (key === 'compuerta') await doCompuerta(ctx);
  else if (key === 'caracola') await wakeUp(ctx);
}

function faustoEvents() {
  const start = at(0);
  return [{
    id: 'fausto_eco', x: start.x, y: start.y, name: SPEAKER.fausto,
    pages: [{ when: (s) => !s.flag(F.faustoAwake), sprite: SPRITE.fausto, dir: start.dir, move: 'still', opacity: 190, trigger: 'action', script: faustoTalk }],
  }];
}

/** Coloca a Fausto en su parada actual al entrar (el evento se crea en la fuente). */
export async function placeFausto(ctx) {
  const f = eventById(ctx, 'fausto_eco');
  const i = step(ctx.state);
  if (f && i > 0) { f.moveTo(at(i).x, at(i).y); f.direction = at(i).dir; }
}

function wheelEvent() {
  const w = ROOM2.wheel;
  return {
    id: 'rueda_compuerta', x: w.x, y: w.y, name: 'Compuerta',
    pages: [
      { sprite: OBJ.wheel, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(FAUSTO_TEXT.wheelAlone); } },
      { when: closed, sprite: OBJ.wheel, dir: 4, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(FAUSTO_TEXT.wheelClosed); } },
    ],
  };
}

const ECHOES = Object.freeze({
  fisher: ['La marea sube a media tarde. Hay que cerrar el aljibe antes, o se llena de agua salada.', 'El chico de las redes lo sabe. Siempre llega a tiempo.'],
  woman: ['¿Has visto a mi chico? Anda de acá para allá toda la mañana, como si el día se le escapara.'],
  vendor: ['¡Redes nuevas, redes remendadas! Aquí, en el puesto de la esquina.'],
});

export function sala2AnteaEvents() {
  const st = ROOM2.stall;
  return [
    ...caracolaEvents(2, 'antea'),
    ...faustoEvents(),
    wheelEvent(),
    ...bigSprite('puesto_redes', st.x, st.y, OBJ.stall, 2, 'Un puesto de redes con toldo a rayas. Hay cestas de pescado brillante y redes recién remendadas.', {
      block: [[st.x - 1, st.y], [st.x + 1, st.y]], extra: { stepAnime: true, speed: 1 },
    }),
    echoCitizen('eco_pescador_s2', 20, 17, SPRITE.echoFisher, 2, ECHOES.fisher, { name: 'Pescador' }),
    echoCitizen('eco_madre_s2', 11, 13, SPRITE.echoWoman, 4, ECHOES.woman, { name: 'Vecina' }),
    echoCitizen('eco_redera_s2', 28, 15, SPRITE.echoVendor, 4, ECHOES.vendor, { name: 'Redera' }),
    echoDoor('puerta_casa_s2_e', 26, 8), echoDoor('puerta_casa_s2_o', 3, 15),
    ...itemEvents([{ id: 'objeto_s2a_red', x: 29, y: 12, item: 'NETBALL', count: 2 }]),
  ];
}

// ───────────────────────────── presente ─────────────────────────────

function gearEvent() {
  const g = ROOM2.gear;
  return {
    id: 'equipo_fausto', x: g.x, y: g.y, name: 'Equipo de buceo',
    pages: [{
      sprite: OBJ.gear, dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action',
      script: async (ctx) => {
        await ctx.say(FAUSTO_TEXT.gear);
        if (!ctx.flag(F.gearFound)) { ctx.setFlag(F.gearFound); await zygardeSays(ctx, FAUSTO_TEXT.gearCore); }
      },
    }],
  };
}

function cisternEvents() {
  const open = (s) => !closed(s);
  const currents = ROOM2.currents.map((c, i) => outflowCurrent(`corriente_aljibe_${i}`, c.x, c.y, {
    dir: 2, length: c.length, open, seenFlag: F.cisternSeen, firstText: FAUSTO_TEXT.cistern, coreText: FAUSTO_TEXT.cisternCore,
  }));
  const inner = ROOM2.cistern.inner;
  return [
    ...currents,
    { id: 'bolsa_aljibe', x: inner.x0 + 3, y: inner.y0 + 1, when: closed, type: 'diveVent', kind: 'bolsa' },
    {
      id: 'aljibe_seco', x: 16, y: ROOM2.cistern.door.y - 1,
      pages: [{
        when: (s) => closed(s) && !s.flag(F.cisternDry), through: true, trigger: 'touch', lock: false,
        script: async (ctx) => { ctx.setFlag(F.cisternDry); await ctx.say(FAUSTO_TEXT.dry); await zygardeSays(ctx, FAUSTO_TEXT.dryCore); },
      }],
    },
  ];
}

export function sala2PresenteEvents() {
  return [
    ...caracolaEvents(2, 'presente'),
    gearEvent(),
    ...cisternEvents(),
    ...ventEvents('respiradero_s2', ROOM2.vents),
    ...itemEvents([
      { id: 'objeto_s2_perla', x: 25, y: 20, item: 'PEARL', hidden: true },
      { id: 'objeto_s2_hiper', x: 4, y: 13, item: 'HYPERPOTION' },
    ]),
  ];
}
