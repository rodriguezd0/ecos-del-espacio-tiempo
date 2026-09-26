// Vigilia (docs/CAMPANA.md B17, paso 4: «cada Guardián sostiene su Pilar. En Caudal se reúnen Leandro, Olmedo y Alerce:
// "Van a intentarlo por la fuerza."»; salida: la Senda del Mirador, b17_vigilia).
//   · Cuando el jugador ha resuelto T14 y ha visto la ocupación del Mirador Sur, Alerce le escribe por la Pokédex.
//   · En la Esclusa mayor de Caudal (mapa de B03, eventos añadidos con una línea) esperan Leandro, Olmedo y Alerce. Cae
//     la noche; por la radio de los Guardianes, cada uno desde su Pilar; Olmedo cuenta lo del Consorcio; Alerce: «Van a
//     intentarlo por la fuerza.». La Policía Regional abrirá al jugador el paso al Puente (Senda del Mirador).
// Módulo puro salvo los guiones.
import { F, SPEAKER, SPRITE, MUSIC, vigilReady, lines, eventById, pause } from './b17_common.js';
import { minutesUntil } from '../../world/rest.js';

/** Grupo de la Vigilia en el Paseo del Albo, delante de la Casa de las Esclusas (content/maps/b03/caudal_layout.js). */
export const VIGIL = Object.freeze({
  alerce: Object.freeze({ x: 37, y: 8, dir: 2 }),
  leandro: Object.freeze({ x: 38, y: 8, dir: 2 }),
  olmedo: Object.freeze({ x: 39, y: 8, dir: 2 }),
  /** Casilla del jugador en la escena (en la pasarela de la esclusa, mirando al grupo). */
  player: Object.freeze({ x: 38, y: 9, dir: 8 }),
});

export const VIGIL_TEXT = Object.freeze({
  call: 'La Pokédex vibra: un mensaje del profesor Alerce.',
  hintCall: '\\PN, soy Alerce. El Agente Olmedo dice que el Consorcio ha vallado el Mirador Sur, al norte de Ciudad Lúmina. Si pasas por allí, mira qué están montando.',
  callLine: (s) => `\\PN, soy Alerce. Estoy en Caudal, en la Esclusa mayor, con Leandro y el Agente Olmedo. ${s.flag(F.reunion) && s.flag(F.mirador) ? 'Ven en cuanto puedas.' : ''}`.trim(),
  hello: '\\PN. Gracias por venir.',
  night: 'Cae la noche sobre Caudal. En la esclusa nadie piensa irse a dormir.',
  leandro: [
    'El Albo sube sin una gota de lluvia y baja sin motivo. Mientras yo esté aquí, las compuertas aguantan.',
    'Los demás están igual. Cada uno en lo suyo.',
  ],
  radio: 'La radio de Leandro crepita. En la frecuencia de los Guardianes hablan desde sus Pilares.',
  guardians: Object.freeze([
    Object.freeze({ speaker: `${SPEAKER.casilda} (radio)`, text: 'Casilda, en el Umbral. Las puertas quieren abrirse solas otra vez. Me he sentado en el dintel. No se abren.' }),
    Object.freeze({ speaker: `${SPEAKER.abril} (radio)`, text: 'Abril, en el Anillo de los Vientos. El viento no encuentra el camino, pero de aquí no pasa.' }),
    Object.freeze({ speaker: `${SPEAKER.fermin} (radio)`, text: 'Fermín, en el Cerro Plomo. La Balanza tiembla, pero no se inclina. Me quedo con ella.' }),
    Object.freeze({ speaker: `${SPEAKER.olvido} (radio)`, text: 'Olvido, en el Archivo Hondo. Leo en voz alta los rollos. Mientras alguien los nombre, no se pierden.' }),
  ]),
  olmedo: [
    'He cortado el paso al Puente en la Senda del Mirador. En el Mirador Sur no puedo hacer más: el Consorcio tiene permisos firmados hasta el borde de la Sima.',
    'Esta tarde han subido dos camiones más al Mirador Sur. Y las torres del borde zumban toda la noche.',
  ],
  towersOff: (n) => (n >= 3
    ? 'Las tres torres del borde se han callado. Mis agentes dicen que el anillo del Mirador parpadea como si le faltara el aire.'
    : `${n === 1 ? 'Una de las torres del borde se ha callado' : 'Dos de las torres del borde se han callado'}. El anillo del Mirador sigue encendido.`),
  alerceSilence: '…',
  key: 'Van a intentarlo por la fuerza.',
  leandroAsk: '¿Intentar qué?',
  alerceAnswer: [
    'Tienen una cadena copiada y un anillo que la hace sonar. Si el noveno Pilar, el del Puente, no les responde, harán que responda.',
    'O lo que haya dentro del Pilar.',
  ],
  olmedoPlan: 'Mis agentes te dejarán pasar al Puente, en la Senda del Mirador. Yo subiré con ellos en cuanto amanezca.',
  alercePlan: 'Estaré en el borde norte. Si tus Pokémon lo necesitan, allí me tendrás.',
  // Zygarde habla muy poco (autor, 25-09-2026): dónde está el noveno Pilar lo dice Alerce.
  leandroAfter: ['Vete. Las compuertas son cosa mía.', 'Y vuelve. Aquí te esperamos todos.'],
  leandroLater: ['El Albo ha vuelto a su cauce. Esta vez sin que yo haga nada.'],
});

/** Nota de la Libreta con el aviso de Alerce sobre el Mirador Sur (se resuelve al ver la ocupación). */
export const MIRADOR_HINT_NOTE = Object.freeze({
  id: 'b17_mirador_aviso',
  text: 'Mirador Sur, al norte de Ciudad Lúmina: el Consorcio lo ha vallado. Alerce quiere saber qué están montando.',
});

/**
 * Mensajes de Alerce por la Pokédex (una vez cada uno): tras T14 y el Mirador Sur, la cita en Caudal; con T14 resuelta
 * y el Mirador sin ver, el aviso para ir a mirar (si no, nada llevaría al jugador al Mirador Sur y la Vigilia no llegaría).
 */
export async function maybeAlerceCall(ctx) {
  if (ctx.flag(F.alerceCall) || ctx.flag(F.vigil)) return false;
  if (!vigilReady(ctx.state)) {
    if (!ctx.flag(F.reunion) || ctx.flag(F.mirador) || ctx.flag(F.alerceHint)) return false;
    ctx.me?.('Register phone');
    await ctx.say(VIGIL_TEXT.call);
    await ctx.say(VIGIL_TEXT.hintCall, { speaker: SPEAKER.alerce });
    ctx.setFlag(F.alerceHint);
    if (!ctx.state.hasClue(MIRADOR_HINT_NOTE.id)) ctx.state.addClue(MIRADOR_HINT_NOTE.id, MIRADOR_HINT_NOTE.text);
    return true;
  }
  ctx.me?.('Register phone');
  await ctx.say(VIGIL_TEXT.call);
  await ctx.say(VIGIL_TEXT.callLine(ctx.state), { speaker: SPEAKER.alerce });
  ctx.setFlag(F.alerceCall);
  return true;
}

async function nightFalls(ctx) {
  await ctx.fade('out', 30);
  const now = ctx.state.data?.clock?.minutes ?? 0;
  if (!ctx.state.isDay || ctx.state.isDay()) ctx.state.advanceMinutes(minutesUntil(now, 21 * 60));
  ctx.requestRefresh();
  await pause(ctx, 20);
  await ctx.fade('in', 30);
  await ctx.say(VIGIL_TEXT.night);
}

/** La Vigilia (escena única). */
export async function vigilScene(ctx) {
  const V = VIGIL;
  if (ctx.player.x !== V.player.x || ctx.player.y !== V.player.y) {
    try {
      await ctx.movePlayerTo(V.player.x, V.player.y, { through: true });
    } catch (err) {
      console.warn('[b17] vigilia: no se pudo colocar al jugador', err);
    }
  }
  ctx.face('player', 'up');
  for (const id of ['vigilia_alerce', 'vigilia_leandro', 'vigilia_olmedo']) { const ev = eventById(ctx, id); if (ev) ctx.face(ev, ctx.player); }
  ctx.bgm?.(MUSIC.vigil, { fadeOutPrevious: 30 });
  await ctx.say(VIGIL_TEXT.hello, { speaker: SPEAKER.alerce });
  await nightFalls(ctx);
  await lines(ctx, SPEAKER.leandro, VIGIL_TEXT.leandro);
  ctx.me?.('Register phone');
  await ctx.say(VIGIL_TEXT.radio);
  for (const g of VIGIL_TEXT.guardians) await ctx.say(g.text, { speaker: g.speaker });
  await lines(ctx, SPEAKER.olmedo, VIGIL_TEXT.olmedo);
  const off = Number(ctx.var('b17_torres_apagadas', 0)) || 0;
  if (off > 0) await ctx.say(VIGIL_TEXT.towersOff(off), { speaker: SPEAKER.olmedo });
  await pause(ctx, 30);
  await ctx.say(VIGIL_TEXT.alerceSilence, { speaker: SPEAKER.alerce });
  await pause(ctx, 20);
  await ctx.say(VIGIL_TEXT.key, { speaker: SPEAKER.alerce });
  await ctx.say(VIGIL_TEXT.leandroAsk, { speaker: SPEAKER.leandro });
  await lines(ctx, SPEAKER.alerce, VIGIL_TEXT.alerceAnswer);
  await ctx.say(VIGIL_TEXT.olmedoPlan, { speaker: SPEAKER.olmedo });
  await ctx.say(VIGIL_TEXT.alercePlan, { speaker: SPEAKER.alerce });
  ctx.setFlag(F.vigil);
  if (!ctx.flag(F.alerceCall)) ctx.setFlag(F.alerceCall);
  // Olmedo y Alerce se van hacia el sur (la Senda); Leandro se queda en la esclusa.
  await ctx.fade('out', 16);
  for (const id of ['vigilia_alerce', 'vigilia_olmedo']) { const ev = eventById(ctx, id); if (ev) ctx.erase(ev); }
  ctx.requestRefresh();
  await ctx.fade('in', 16);
  ctx.bgm?.('CiudadCeleste', { fadeOutPrevious: 30 });
}

const waiting = (s) => vigilReady(s) && !s.flag(F.vigil);

/** Eventos que añade Ciudad Caudal (ciudad_caudal.js, una línea). */
export function b17CaudalEvents() {
  const V = VIGIL;
  const talk = { trigger: 'action', script: vigilScene };
  return [
    { id: 'vigilia_alerce', x: V.alerce.x, y: V.alerce.y, name: SPEAKER.alerce, pages: [{ when: waiting, sprite: SPRITE.alerce, dir: V.alerce.dir, move: 'still', ...talk }] },
    {
      id: 'vigilia_leandro', x: V.leandro.x, y: V.leandro.y, name: SPEAKER.leandro,
      pages: [
        { when: waiting, sprite: SPRITE.leandro, dir: V.leandro.dir, move: 'still', ...talk },
        { when: (s) => s.flag(F.vigil) && !s.flag(F.p9), sprite: SPRITE.leandro, dir: 2, move: 'still', trigger: 'action', script: (ctx) => lines(ctx, SPEAKER.leandro, VIGIL_TEXT.leandroAfter) },
      ],
    },
    { id: 'vigilia_olmedo', x: V.olmedo.x, y: V.olmedo.y, name: SPEAKER.olmedo, pages: [{ when: waiting, sprite: SPRITE.olmedo, dir: V.olmedo.dir, move: 'still', ...talk }] },
    // Llegando por la pasarela de la esclusa, la escena empieza sola.
    ...[37, 38, 39].map((x) => ({ id: `vigilia_aviso_${x}`, x, y: V.player.y + 1, through: true, trigger: 'touch', when: waiting, script: vigilScene })),
  ];
}
