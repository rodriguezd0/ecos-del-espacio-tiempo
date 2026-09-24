// Cámara del núcleo del Archivo Hondo (docs/CAMPANA.md B10: «combatir con Olvido; restaurar»; Revelaciones y
// Recompensas; §3.0 verso V; §5.5 escalón 5; §6.2 Gael «leyó el verso V antes que nadie y se fue»):
//   · Olvido Arrieta (fascinación) espera en la antesala: «¡Existes! Eres una nota a pie de página que camina.»
//     Combate de guion sin pérdida (Chimecho 38, Beheeyem 38, Bronzong 39, Spiritomb 40).
//   · Núcleo: restorePillar(5) → Olvido completa los versos I–V, entrega la Clave Glífica (GLYPHKEY) y el verso V se
//     lee entero; «Eres tú.»; Gael estuvo antes; la niebla se levanta; inscripción de T09; Trepar (hito climb);
//     Alerce, por la Pokédex, calla un momento largo al oír el verso V. Después, Olvido sube con el jugador al Archivo
//     de papel (informe tachado: b10_archivo.js).
import { F, SPEAKER, SPRITE, SEPIA, lines, zygardeSays, byGender, scriptedBattle, eventById, when } from './b10_common.js';
import { NUCLEO } from '../maps/b10/hondo_layout.js';
import { ARCHIVO_ROOM } from '../maps/b10/archivo_layout.js';
import { VERSES } from '../story/verses.js';
import { pilarTone } from '../stamps/pilar.js';

export const NUCLEO_TEXT = Object.freeze({
  coldPedestal: 'Un pedestal hexagonal, frío. Alrededor, el suelo está grabado con un gran hexágono.',
  afterPedestal: 'El pedestal guarda un calor leve. Los glifos del suelo brillan con un tono de papel antiguo.',
  t09: 'Bajo el verso hay otra inscripción, más pequeña. Ahora la lees sin ayuda: «La novena tabla sueña en voz ajena.»',
  fogLifts: 'Un soplo tibio sube por la espiral. Muy arriba, en la aldea, la niebla se retira hacia el bosque y no vuelve.',
  stairsClosed: 'Unos peldaños suben hacia la oscuridad y acaban en una losa cerrada.',
  stairsOpen: 'La losa de la escalera de los custodios se ha retirado. Sube derecha al Archivo de papel.',
  phone: '¡La Pokédex está sonando!\nEs una llamada del Prof. Alerce.',
  tellAlerce: 'Le cuentas lo del Archivo Hondo y le lees el verso quinto.',
});

// ------------------------------------------------------------ Olvido, la Guardiana

async function olvidoChallenge(ctx) {
  const sp = SPEAKER.olvido;
  const ev = eventById(ctx, 'olvido_hondo');
  if (ev) ev.turnToward(ctx.player);
  if (!ctx.flag(F.olvidoChallenged)) {
    await lines(ctx, sp, [
      'Has llegado. Lo tenía apuntado: «Llegará. No sé cuándo.»',
      'Sesenta años bajando aquí a leer lo que dicen las piedras. Y resulta que hablaban de alguien con nombre y zapatos.',
      '¡Existes! Eres una nota a pie de página que camina.',
      'Me llaman la guarda del Archivo. Yo solo apunto. Pero antes de dejarte tocar esa piedra quiero ver, con mis propios ojos, de qué está hecha la nota.',
    ]);
    ctx.setFlag(F.olvidoChallenged);
  } else {
    await lines(ctx, sp, ['Otra vez. Lo he apuntado como «primer intento». Los segundos son los que cuentan.']);
  }
  const outcome = await scriptedBattle(ctx, { trainer: 'b10_olvido' }, { x: NUCLEO.battleSpot.x, y: NUCLEO.battleSpot.y, dir: NUCLEO.battleSpot.dir });
  if (outcome !== 'win') return;
  ctx.setFlag(F.olvido);
  await lines(ctx, sp, [
    'Fascinante. La nota a pie de página tiene más peso que el texto.',
    'Adelante. La piedra del centro lleva mucho tiempo esperando a que alguien la despierte. Yo solo sabía leerla.',
  ]);
  const me = eventById(ctx, 'olvido_hondo');
  if (me) {
    await ctx.move(me, ['down', 'down', 'right', 'right', 'down', 'turn_left'], { through: true, speed: 3.5 });
    ctx.erase(me); // la sustituye «olvido_nucleo», que espera en ese mismo sitio
  }
  ctx.requestRefresh();
}

function olvidoEvents() {
  const O = NUCLEO.olvido;
  const A = NUCLEO.olvidoAside;
  const strip = [];
  for (let x = O.x - 1; x <= O.x + 1; x++) {
    strip.push({ id: `antesala_${x}`, x, y: O.y - 1, trigger: 'touch', through: true, when: when({ all: [F.olvidoDown], none: [F.olvidoChallenged, F.olvido] }), script: olvidoChallenge });
  }
  return [
    ...strip,
    {
      id: 'olvido_hondo', x: O.x, y: O.y, name: SPEAKER.olvido,
      pages: [{ when: when({ all: [F.olvidoDown], none: [F.olvido] }), sprite: SPRITE.olvido, dir: O.dir, move: 'still', trigger: 'action', script: olvidoChallenge }],
    },
    {
      id: 'olvido_nucleo', x: A.x, y: A.y, name: SPEAKER.olvido,
      pages: [{
        when: when({ all: [F.olvido], none: [F.restored] }), sprite: SPRITE.olvido, dir: A.dir, move: 'still', trigger: 'action',
        script: async (ctx) => { await lines(ctx, SPEAKER.olvido, ['Adelante. El centro. Yo me quedo aquí, apuntando.']); },
      }],
    },
  ];
}

// ------------------------------------------------------------ núcleo

/** Olvido completa los versos I–V (los cuatro primeros los tenía copiados de los calcos de los otros Pilares). */
async function olvidoReadsVerses(ctx) {
  const sp = SPEAKER.olvido;
  const text = (n) => VERSES[n - 1].text;
  await lines(ctx, sp, [
    'Espera. Déjame leerlo entero, que llevo media vida esperando a que se encendiera.',
    `«${text(1)} ${text(2)} ${text(3)} ${text(4)}»`,
    'Eso lo tenía. Copiado de los calcos de los otros Pilares, verso a verso. Y ahora el quinto, el de esta piedra:',
    `«${text(5)}»`,
  ]);
}

async function giveGlyphKey(ctx) {
  const sp = SPEAKER.olvido;
  await lines(ctx, sp, [
    'Toma. Son mis tablas de glifos: sesenta años de letras apuntadas. Con esto ya no te hace falta la máquina esa para leer las piedras.',
  ]);
  await ctx.giveItem('GLYPHKEY', 1);
}

/** «Eres tú.» y la visita de Gael (CAMPANA §6.2 B10: esperanza y herida). */
async function afterVerse(ctx) {
  const sp = SPEAKER.olvido;
  const ev = eventById(ctx, 'olvido_nucleo');
  if (ev?.page) ev.turnToward(ctx.player);
  await ctx.wait(30);
  await lines(ctx, sp, ['«…llevando consigo al guardián roto.»', '…Eres tú.']);
  await zygardeSays(ctx, '……');
  await lines(ctx, sp, [
    'No eres la primera persona que lee este verso. Hace unos días vino un muchacho de Villa Alba. Firmó en mi libro de visitas: Gael.',
    'Le enseñé mis calcos de esta piedra. Leyó el quinto verso dos veces, despacio.',
    'Luego me preguntó si decía de quién hablaba. Le dije que no. Se quedó un rato mirando la hoja y se fue sin despedirse.',
  ]);
}

async function localEffect(ctx) {
  ctx.se('PRSFX- Aromatic Mist', { volume: 70 });
  await ctx.tone(pilarTone('P5', 0.2), 40);
  await ctx.say(NUCLEO_TEXT.fogLifts);
}

/** Llamada de Alerce: calla un momento largo al oír el verso V (CAMPANA B10; §5.5, sin revelar nada). */
async function alerceCall(ctx) {
  const A = SPEAKER.alerce;
  ctx.me('Register phone');
  await ctx.say(NUCLEO_TEXT.phone);
  ctx.se('GUI pokedex open');
  await ctx.say('\\PN. Las lecturas del oeste se han calmado de golpe. ¿Estás en Mnemos?', { speaker: A });
  await ctx.say(NUCLEO_TEXT.tellAlerce);
  await ctx.say('……', { speaker: A });
  await ctx.wait(90);
  await ctx.say('……', { speaker: A });
  await ctx.wait(60);
  await ctx.say('Guárdalo bien en la Libreta.', { speaker: A });
  await ctx.say(`Y ten cuidado, ${byGender(ctx.state, 'chico', 'chica')}. Te llamaré más tarde.`, { speaker: A });
  ctx.se('GUI pokedex open');
  ctx.setFlag(F.alerce);
}

async function coreScene(ctx) {
  await zygardeSays(ctx, 'Aquí. La memoria del orden. Me recuerda.');
  const ok = await ctx.story.restorePillar(5, {
    core: { x: NUCLEO.pedestal.x, y: NUCLEO.pedestal.y },
    showVerse: false,
    onRestored: async (c) => {
      await olvidoReadsVerses(c);
      await giveGlyphKey(c);
      await c.story.revealVerse(5);
      await afterVerse(c);
      await localEffect(c);
    },
  });
  if (!ok) return;
  await ctx.say(NUCLEO_TEXT.t09);
  await ctx.story.openClue('T09');
  const { reachMilestone } = await import('../../world/zygarde/scenes.js');
  await reachMilestone(ctx, 'climb');
  await alerceCall(ctx);
  await lines(ctx, SPEAKER.olvido, [
    'Sube conmigo por la escalera de los custodios, que es más corta. Quiero ver qué nos ha devuelto la tinta allá arriba.',
  ]);
  const up = ARCHIVO_ROOM.playerTable;
  await ctx.warp('mnemos_archivo', up.x, up.y, up.dir);
}

function pedestalEvent() {
  const P = NUCLEO.pedestal;
  return {
    id: 'nucleo_memoria', x: P.x, y: P.y, name: 'Núcleo',
    pages: [
      { solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(NUCLEO_TEXT.coldPedestal); } },
      {
        when: when({ all: [F.olvido], none: [F.restored] }), solid: true, trigger: 'action',
        glow: { name: 'softLight', radius: 110, intensity: 0.6, pulse: 0.5, color: [...SEPIA] },
        script: coreScene,
      },
      {
        when: when({ all: [F.restored] }), solid: true, trigger: 'action',
        glow: { name: 'softLight', radius: 80, intensity: 0.3, pulse: 0.2, color: [...SEPIA] },
        script: async (ctx) => { await ctx.say(NUCLEO_TEXT.afterPedestal); },
      },
    ],
  };
}

/** Escalera de los custodios (tras el P5): atajo al Archivo de papel. */
function stairsEvent() {
  const S = NUCLEO.stairsUp;
  return {
    id: 'escalera_custodios', x: S.x, y: S.y - 2, trigger: 'touch', through: true,
    script: async (ctx) => {
      if (!ctx.flag(F.restored)) {
        await ctx.say(NUCLEO_TEXT.stairsClosed);
        await ctx.move('player', ['down'], { through: false });
        return;
      }
      ctx.se('Door enter');
      const up = ARCHIVO_ROOM.stairsArrival;
      await ctx.warp('mnemos_archivo', up.x, up.y, up.dir);
    },
  };
}

export function nucleoEvents() {
  return [...olvidoEvents(), pedestalEvent(), stairsEvent()];
}
