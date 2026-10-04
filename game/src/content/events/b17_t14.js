// T14 · Tabla Cielo, «La carta sin destino» (docs/TABLILLAS.md §4.5; CAMPANA B17 paso 1): de Correos de Nexo a la Mesa
// de los Vientos. B16 abre la pista (Don Evaristo enseña la carta tras el P8). Aquí:
//   1. Con Vuelo, Don Evaristo confía la carta al jugador y lee el acertijo del sobre (segunda pista): «Entre el rayo y
//      la sal, donde el sol de las cinco no hace sombra.» Entre los dos lo descifran (Brontia, las salinas de Estrato,
//      la Meseta) y Don Evaristo da con el sitio: la Mesa aparece en el mapa de Vuelo (state.unlockFlyPoint).
//   2. En la Mesa (b17_mesa.js) hay que recuperar el rebaño para que los cuidadores confíen.
//   3. Aurora (86), la hermana, lee la carta en su cabaña y el jugador la lleva volando a Nexo.
//   4. Los hermanos se reencuentran en Correos: Aurora entrega su «Piedra del Cielo» (Tabla Cielo, SKYPLATE; Crónica XIV)
//      y Don Evaristo, la Staraptorita. Aurora se queda unos días en Nexo.
// Reintento: sin estado de fallo (las preguntas del acertijo se repiten sin castigo). Módulo puro salvo los guiones.
import { F, SPEAKER, SPRITE, MUSIC, lines, eventById, pause } from './b17_common.js';
import { maybeAlerceCall } from './b17_vigilia.js';
import { BUILDINGS as NEXO } from '../maps/b09b/nexo_layout.js';

export const RIDDLE = '«Entre el rayo y la sal, donde el sol de las cinco no hace sombra.»';

/** Preguntas del acertijo: la primera opción de `options` en el orden de la lista es la buena (índice `answer`). */
export const RIDDLE_QUESTIONS = Object.freeze([
  Object.freeze({
    ask: '«El rayo»… ¿Qué sitio de Axis llama al rayo?',
    options: Object.freeze(['Villa Brontia', 'Ciudad Caudal', 'Ciudad Lúmina']),
    answer: 0,
    right: '¡Brontia, claro! El campanario. Mi hermana decía que allí los rayos caían por costumbre.',
    wrong: 'Hmm… no. En sesenta años de reparto no he visto caer allí un rayo que valiera la pena.',
  }),
  Object.freeze({
    ask: 'Entre Brontia y las salinas de Estrato, y en alto… ¿qué hay?',
    options: Object.freeze(['La Meseta del Impulso', 'La Sima del Eje', 'El Mar del Sur']),
    answer: 0,
    right: 'La Meseta. Sí… Sobre la Meseta.',
    wrong: 'No, no. Tiene que ser en alto: el sol de las cinco da en lo alto.',
  }),
]);

export const T14_TEXT = Object.freeze({
  evaristo: [
    '¿Qué es eso que te sigue? ¿Y dices que te lleva por el aire?',
    'Entonces tú puedes llegar donde no llega ningún cartero. Toma: lleva tú la carta.',
    'Por detrás del sobre copié lo único que me dijo mi hermana antes de irse, sus señas. Nunca las he entendido.',
  ],
  riddleRead: `Lees el reverso del sobre: ${RIDDLE}`,
  salt: '¿«La sal»? En mis tiempos, las salinas de Estrato daban sal a medio Axis. Ya no queda nada de ellas.',
  // Zygarde habla muy poco (autor, 25-09-2026): el sitio lo deduce Don Evaristo.
  mesa: 'Sobre la Meseta hay una mesa de roca más alta que todo lo que la rodea. A las cinco, nada le quita el sol. Tiene que ser allí.',
  unlocked: 'La Mesa de los Vientos aparece ahora en el mapa de Vuelo.',
  evaristoGo: 'Ve, ve. Y dile… no, no le digas nada. Dale la carta y ya está.',
  waiting: ['La carta la llevas tú. Yo me quedo aquí, que es lo que sé hacer.'],
  // cabaña de Aurora
  auroraHello: ['¿Una visita? Hace tantos años que no sube nadie que ya no sé ni ofrecer una silla.'],
  auroraLetter: [
    'Esta letra… es la de Evaristo.',
    '…',
    'Me escribió cuando me vine a vivir aquí. Sesenta años dando vueltas por Correos, y yo sin saber que existía.',
    'Aquí arriba no llega nada. Ni cartas, ni caminos. Por eso me quedé: los Altaria no necesitan caminos.',
  ],
  auroraAsk: '¿Me llevarías a verle? Aunque sea un rato.',
  auroraYes: 'Espera, que me pongo el chal. A mi edad, el viento de las alturas no perdona.',
  auroraNo: 'Claro, claro. Cuando tú puedas. Llevo sesenta años esperando: unos días más no me van a matar.',
  auroraAgain: '¿Nos vamos ya? Me he puesto el chal dos veces.',
  flight: 'Aurora se agarra a tu brazo en la explanada. Zygarde os envuelve a los dos en su red de hexágonos.',
  note: 'Una nota sobre la mesa: «Me voy unos días con mi hermano. Cuidad del rebaño. — Aurora».',
  // Correos
  reunion: {
    enter: 'Aurora entra en Correos detrás de ti, despacio, mirando las paredes llenas de casilleros.',
    evaristo1: '…¿Aurora?',
    aurora1: 'Tu carta ha llegado, Evaristo. Tarde, pero ha llegado.',
    evaristo2: 'Hay cartas que tardan en encontrar su camino. Pero llegan.',
    evaristo3: 'Casi todas.',
    aurora2: [
      'Esto es para ti. Cayó del cielo en la Mesa la noche que llegué, hace sesenta años. La hemos cuidado como a un Altaria más.',
      'Nosotros la llamamos la Piedra del Cielo. Tú la necesitas más que nosotros: se nota en cómo miras hacia arriba.',
    ],
    evaristo4: [
      'Y esto, de mi parte. Llegó en un paquete sin remite hace años, con un Staraptor dibujado en la etiqueta.',
      'Nunca supe para quién era. Ahora sí.',
    ],
    aurora3: 'Me quedo unos días con mi hermano. Diles a los de la Mesa que no se preocupen.',
  },
  afterEvaristo: ['Aurora se ríe de mi letra. Dice que no ha cambiado nada en sesenta años.'],
  afterAurora: ['Evaristo ha guardado todas las cartas que le devolvían. Todas. Qué cabezota.'],
});

// ───────────────────────────── Correos: la carta y el acertijo ─────────────────────────────

async function askQuestion(ctx, q) {
  for (let tries = 0; tries < 8; tries++) {
    const i = await ctx.choice([...q.options], { message: q.ask });
    if (i === q.answer) { await ctx.say(q.right, { speaker: SPEAKER.evaristo }); return true; }
    await ctx.say(q.wrong, { speaker: SPEAKER.evaristo });
  }
  return false;
}

/** El acertijo del sobre (se puede repetir sin castigo). */
async function solveRiddle(ctx) {
  await ctx.say(T14_TEXT.riddleRead);
  if (!(await askQuestion(ctx, RIDDLE_QUESTIONS[0]))) return;
  await ctx.say(T14_TEXT.salt, { speaker: SPEAKER.evaristo });
  if (!(await askQuestion(ctx, RIDDLE_QUESTIONS[1]))) return;
  await ctx.say(T14_TEXT.mesa, { speaker: SPEAKER.evaristo });
  ctx.state.unlockFlyPoint('mesa_vientos');
  ctx.setFlag(F.riddle);
  ctx.se('Mining item get');
  await ctx.say(T14_TEXT.unlocked);
  await ctx.say(T14_TEXT.evaristoGo, { speaker: SPEAKER.evaristo });
}

/** Página de B17 del evento `evaristo` (Correos de Nexo): con Vuelo, tras la pista de B16. */
export async function evaristoB17(ctx) {
  if (!ctx.flag(F.envelope)) {
    await lines(ctx, SPEAKER.evaristo, T14_TEXT.evaristo);
    ctx.setFlag(F.envelope);
    await ctx.story.advanceClue('T14', 2);
    await solveRiddle(ctx);
    return;
  }
  if (!ctx.flag(F.riddle)) { await solveRiddle(ctx); return; }
  await lines(ctx, SPEAKER.evaristo, T14_TEXT.waiting);
}

/** Condición de la página: la pista abierta (B16), Vuelo y aún sin el reencuentro. */
export const evaristoB17When = (s) => Boolean(s) && s.flag(F.t14Open) && Boolean(s.zygardeAbility?.('fly')) && !s.flag(F.reunion);
/** Tras el reencuentro. */
export const evaristoAfterWhen = (s) => Boolean(s?.flag(F.reunion));
export async function evaristoAfter(ctx) { await lines(ctx, SPEAKER.evaristo, T14_TEXT.afterEvaristo); }

// ───────────────────────────── cabaña de Aurora ─────────────────────────────

/** Casilla de Correos (exterior) donde aterriza el Vuelo con Aurora: delante de la puerta. */
export const NEXO_LANDING = Object.freeze({ x: NEXO.correos.door.x, y: NEXO.correos.door.y + 1, dir: 8 });

async function flyWithAurora(ctx) {
  await ctx.say(T14_TEXT.auroraYes, { speaker: SPEAKER.aurora });
  ctx.setFlag(F.journey);
  await ctx.say(T14_TEXT.flight);
  const { flyTransition } = await import('../../world/zygarde/actions.js');
  await flyTransition(ctx, { map: 'ciudad_nexo', x: NEXO_LANDING.x, y: NEXO_LANDING.y, dir: NEXO_LANDING.dir });
  await pause(ctx, 10);
  await ctx.warp('nexo_correos', 4, 9, 8, { door: true, doorSource: NEXO.correos.door });
}

async function auroraTalk(ctx) {
  if (!ctx.flag(F.aurora)) {
    await lines(ctx, SPEAKER.aurora, T14_TEXT.auroraHello);
    await ctx.say('Le das la carta de Don Evaristo.');
    ctx.bgm?.(MUSIC.reunion, { fadeOutPrevious: 30 });
    await lines(ctx, SPEAKER.aurora, T14_TEXT.auroraLetter);
    ctx.setFlag(F.aurora);
  } else {
    await ctx.say(T14_TEXT.auroraAgain, { speaker: SPEAKER.aurora });
  }
  if (await ctx.confirm(T14_TEXT.auroraAsk, { speaker: SPEAKER.aurora })) await flyWithAurora(ctx);
  else await ctx.say(T14_TEXT.auroraNo, { speaker: SPEAKER.aurora });
}

/** Eventos de la cabaña de Aurora (mesa_vientos_casa). */
export function auroraCabinEvents({ aurora, table }) {
  return [
    {
      id: 'aurora', x: aurora.x, y: aurora.y, name: SPEAKER.aurora,
      pages: [{ when: (s) => !s.flag(F.journey), sprite: SPRITE.aurora, dir: aurora.dir, move: 'look', trigger: 'action', script: auroraTalk }],
    },
    {
      id: 'nota_aurora', x: table.x, y: table.y, trigger: 'action', noOver: true, solid: true,
      script: async (ctx) => {
        if (ctx.flag(F.journey)) await ctx.say(T14_TEXT.note);
        else await ctx.say('Una mesa con un tapete de ganchillo y una taza de té frío.');
      },
    },
  ];
}

// ───────────────────────────── Correos: el reencuentro ─────────────────────────────

/** Posiciones del reencuentro dentro de Correos (geometría de tienda: services/shop.js SHOP_LAYOUT). */
export const REUNION = Object.freeze({
  player: Object.freeze({ x: 7, y: 8, dir: 6 }),
  aurora: Object.freeze({ x: 6, y: 8, dir: 6 }),
});

async function reunionScene(ctx) {
  const R = T14_TEXT.reunion;
  const aurora = eventById(ctx, 'aurora_correos');
  await pause(ctx, 10);
  await ctx.say(R.enter);
  const p = ctx.player;
  if (p.x !== REUNION.player.x || p.y !== REUNION.player.y) {
    try { await ctx.movePlayerTo(REUNION.player.x, REUNION.player.y, { through: true }); } catch (err) { console.warn('[b17] reencuentro', err); }
  }
  if (aurora) ctx.face(aurora, 6);
  ctx.face('player', 6);
  const ev = eventById(ctx, 'evaristo');
  if (ev) await ctx.emote(ev, '!');
  ctx.bgm?.(MUSIC.reunion, { fadeOutPrevious: 30 });
  await ctx.say(R.evaristo1, { speaker: SPEAKER.evaristo });
  await ctx.say(R.aurora1, { speaker: SPEAKER.aurora });
  await pause(ctx, 30);
  await ctx.say(R.evaristo2, { speaker: SPEAKER.evaristo });
  await pause(ctx, 20);
  await ctx.say(R.evaristo3, { speaker: SPEAKER.evaristo });
  if (aurora) ctx.face(aurora, 6);
  await lines(ctx, SPEAKER.aurora, R.aurora2);
  await ctx.story.giveTablet('SKYPLATE');
  await lines(ctx, SPEAKER.evaristo, R.evaristo4);
  await ctx.giveItem('STARAPTITE', 1);
  await ctx.say(R.aurora3, { speaker: SPEAKER.aurora });
  ctx.setFlag(F.reunion);
  ctx.requestRefresh();
  ctx.bgm?.('CiudadCarmin', { fadeOutPrevious: 30 });
  await maybeAlerceCall(ctx);
}

/** Eventos que B17 añade a Correos de Nexo (nexo_correos.js, B09b): Aurora y el reencuentro. */
export function correosB17Events() {
  const pending = (s) => Boolean(s) && s.flag(F.journey) && !s.flag(F.reunion);
  return [
    {
      id: 'aurora_correos', x: REUNION.aurora.x, y: REUNION.aurora.y, name: SPEAKER.aurora,
      pages: [
        { when: pending, sprite: SPRITE.aurora, dir: REUNION.aurora.dir, move: 'still', through: true },
        { when: (s) => s.flag(F.reunion), sprite: SPRITE.aurora, dir: 6, move: 'look', trigger: 'action', script: (ctx) => lines(ctx, SPEAKER.aurora, T14_TEXT.afterAurora) },
      ],
    },
    { id: 'reencuentro_correos', x: 0, y: 0, trigger: 'auto', when: pending, script: reunionScene },
  ];
}
