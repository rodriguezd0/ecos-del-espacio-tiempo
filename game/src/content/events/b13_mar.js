// Eventos del Mar del Sur (docs/CAMPANA.md B13, §1.4, §2.3): la llamada de Alerce al entrar por primera vez en el mar
// (la plataforma del Consorcio), nadadores y marineros (entrenadores), células C057–C058, C061–C062 y C065–C066,
// objetos de los bancos, boyas-farolillo hacia el Islote Lumbre, el aviso del Arrecife del Eco (B14) y aves.
import { cellEvent } from './b01_cells.js';
import { F, SPEAKER, SPRITE, OBJ, when, lines, isNight, byGender, mapRegistered } from './b13_common.js';
import { CELLS, TRAINERS, ITEMS, BUOYS, BIRDS, REEF_SIGN, WHIRLPOOLS } from '../maps/b13/mar_layout.js';

const A = { speaker: SPEAKER.alerce };

export const MAR_TEXT = Object.freeze({
  reef: 'ARRECIFE DEL ECO\nAguas de buceo. Corrientes fuertes y mareas a destiempo.\n—Cofradía de Caleta Sonda',
  buoy: 'Una boya con un farolillo de papel atado al mástil. Hay una fila de ellas camino del islote.',
  buoyNight: 'El farolillo de la boya está encendido. La fila de luces señala el camino del islote.',
});

/**
 * Primera vez en el mar con Nadar: Alerce llama por la Pokédex. Sin confesar nada: ha visto la plataforma y va a ir.
 * Si el jugador trae los planos de Nilo (B11), Alerce los menciona.
 */
async function alerceCall(ctx) {
  ctx.setFlag(F.marCall);
  ctx.me('Register phone');
  await ctx.say('¡La Pokédex está sonando!\nEs una llamada del Prof. Alerce.');
  ctx.se('GUI pokedex open');
  await ctx.say('\\PN. La Pokédex te sitúa en el Mar del Sur.', A);
  if (ctx.flag(F.plans)) {
    await lines(ctx, SPEAKER.alerce, [
      'Me ha escrito un tal Nilo, el técnico que dejó el Consorcio. Dice que te dio los planos de esa plataforma.',
      'La Estación Talasa. Abajo, en un tanque de presión, tienen lo que Zygarde busca.',
    ]);
  } else {
    await lines(ctx, SPEAKER.alerce, [
      'Esa plataforma del Consorcio que se ve desde Nexo se llama Estación Talasa.',
      'Si Zygarde nota algo ahí dentro, no me extrañaría. Allí no investigan el mar.',
    ]);
  }
  await ctx.wait(30);
  await lines(ctx, SPEAKER.alerce, [
    `No entres ${byGender(ctx.state, 'solo', 'sola')} en esa estación. Espérame en su embarcadero.`,
    'Salgo de Nexo en barca. Llegaré antes de que te canses de nadar.',
  ]);
  ctx.se('GUI pokedex open');
  // Zygarde habla muy poco (autor, 25-09-2026): la llamada basta para saber adónde ir.
}

function callEvent() {
  return {
    id: 'llamada_alerce_mar', x: 0, y: 0, trigger: 'auto',
    when: when({ all: [F.swimForm], none: [F.marCall, F.talArrival] }),
    script: alerceCall,
  };
}

function trainerEvents() {
  const TEXTS = {
    nadadora_ines: { intro: '¡Hasta el islote y vuelta, cada mañana! ¿Me sigues el ritmo?', after: 'De noche, las boyas se encienden. Los farolillos llevan al islote.' },
    nadador_hugo: { intro: 'Estas aguas son mías desde que paró el ferri. ¡A ver qué traes!', after: 'Los escollos cortan el paso a Talasa. Hay que buscar los huecos.' },
    pescador_ruben: { intro: 'Si picas tú, que piquen también los peces. ¡Venga!', after: 'Desde que plantaron esa plataforma, aquí no pica nada grande.' },
    nadadora_paula: { intro: 'No se nada cerca de la plataforma… ¡a no ser que me ganes!', after: 'Por la noche esa estación zumba como una colmena.' },
    marinero_ezequiel: { intro: '¡Este basalto lo pisé antes que tú! Defiéndete.', after: 'El volcán echa menos humo que nunca. Los de la forja andan de morros.' },
    nadador_ivan: { intro: 'El agua de por aquí está más fría que antes. ¡Entremos en calor!', after: 'Dicen que el Tizón se está apagando. Un volcán apagándose… qué cosas.' },
  };
  return TRAINERS.map((t) => ({
    id: t.id, type: 'trainer', trainer: t.trainer, name: t.name, sprite: t.sprite, x: t.x, y: t.y, dir: t.dir, sight: t.sight,
    intro: TEXTS[t.id].intro, after: TEXTS[t.id].after,
  }));
}

function buoyEvents() {
  return BUOYS.map(([x, y], i) => ({
    id: `boya_farolillo_${i + 1}`, x, y, name: 'Boya',
    pages: [
      { sprite: OBJ.buoy, dir: 2, stepAnime: true, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(MAR_TEXT.buoy); } },
      { when: (s) => isNight(s), sprite: OBJ.buoy, dir: 2, stepAnime: true, directionFix: true, walkAnime: false, solid: true, light: { radius: 56, intensity: 0.8 }, trigger: 'action', script: async (ctx) => { await ctx.say(MAR_TEXT.buoyNight); } },
    ],
  }));
}

function reefSign() {
  return { id: 'aviso_arrecife', x: REEF_SIGN.x, y: REEF_SIGN.y, name: 'Boya de aviso', sprite: OBJ.buoy, dir: 4, stepAnime: true, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(MAR_TEXT.reef); } };
}

function birdEvents() {
  return BIRDS.map(([x, y], i) => ({
    id: `ave_banco_${i + 1}`, x, y, name: 'Wingull', sprite: SPRITE.wingull, dir: [2, 4, 6, 8][i % 4], move: 'look', stepAnime: true,
    trigger: 'action', script: async (ctx) => { ctx.cry('WINGULL'); await ctx.say('¡Wiii!'); },
  }));
}

/** Remolinos al fondo (B14): sin destino fijo, bajan a la casilla equivalente (`dive` del mapa). */
function whirlpoolEvents() {
  if (!mapRegistered('fondo_mar_sur')) return [];
  return WHIRLPOOLS.map(([x, y], i) => ({ id: `remolino_fondo_${i + 1}`, type: 'diveSpot', x, y }));
}

export function marEvents() {
  return [
    ...whirlpoolEvents(),
    callEvent(),
    ...trainerEvents(),
    ...ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) })),
    ...Object.values(CELLS).map((c) => cellEvent({ id: c.key, x: c.x, y: c.y })),
    ...buoyEvents(),
    reefSign(),
    ...birdEvents(),
  ];
}
