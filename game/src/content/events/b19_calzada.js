// Calzada del Rey — el Mirador y el campamento de los Peregrinos del Rey (docs/CAMPANA.md B19; TABLILLAS.md T15):
// bienvenida (Leocadia), Casandra junto al trozo del Resonador (segunda pista de T15), Tadeo guardando el primer tramo,
// el mito del Rey que cuenta Tarsicio, la hoguera (descanso de campamento), el puesto del Peregrino, estandartes, la
// estela del Mirador y los objetos y entrenadores del mapa. Tras la Crónica XV, parte de los Peregrinos se quedan a
// cuidar la Calzada (flag b19_cuidadores). Módulo puro salvo los guiones.
import {
  F, SPEAKER, SPRITE, OBJ, when, lines, byGender, pause, pilgrimsForcing,
} from './b19_common.js';
import { CAMP, NPC, MIRADOR, ARRIVAL_STRIP, ITEMS, TRAINERS } from '../maps/b19/calzada_layout.js';
import { openMart, shopStock } from '../services/shop.js';
import { runRest } from '../services/inn.js';
import TRAINER_DEFS from '../trainers/b19.js';

const ARC = 'T15';

export const CAMP_TEXT = Object.freeze({
  leocadia: {
    early: [
      (s) => `¡${byGender(s, 'Un visitante', 'Una visitante')}! ${byGender(s, 'Bienvenido', 'Bienvenida')} a la Calzada del Rey.`,
      'Somos los Peregrinos del Rey. Desde aquí se ve la Peña donde trabajó el Rey del Eje, al otro lado del abismo.',
      // Genesis ocupa el Mirador Sur desde el B17 (tras el P8): antes, Casandra solo espera una señal.
      (s) => (s?.flag?.('p8_restored')
        ? 'Casandra, nuestra guía, se ha ido a Lúmina. Dice que en el Mirador Sur hay gente con máquinas que hacen cantar a las piedras.'
        : 'Casandra, nuestra guía, se ha ido a Lúmina. Dice que la tierra anda revuelta y que las piedras de la Calzada no tardarán en moverse.'),
      'Cuando vuelva, a lo mejor por fin cruzamos.',
    ],
    welcome: [
      (s) => `¡${byGender(s, 'Otro peregrino', 'Otra peregrina')}! ${byGender(s, 'Bienvenido', 'Bienvenida')} a la Calzada del Rey.`,
      'Desde lo del Puente, la Sima ya no se ensancha. Y las piedras de la Calzada vuelven a subir: ¡el Rey nos abre el camino!',
      'Casandra está junto al Resonador, al borde del Mirador. Habla con ella antes de pisar nada.',
    ],
    welcomeBack: [
      '¡Has vuelto! Y Casandra también: se ha traído de Lúmina un trozo de metal que hace cantar a las piedras.',
      'Está junto al Resonador, al borde del Mirador. Habla con ella antes de pisar nada.',
    ],
    remind: 'Casandra está junto al Resonador, al borde del Mirador.',
    after: 'Ten cuidado ahí fuera. Las piedras aguantan lo justo… y el fondo no se ve.',
    caretakers: [
      'Así que el Rey se quedó a cuidar el puente…',
      'Yo vuelvo a Lúmina. Pero volveré a menudo: esta Calzada va a necesitar manos.',
    ],
  },
  casandra: {
    intro: [
      'Te he visto subir por el sendero. No eres de los nuestros.',
      'Soy Casandra. Guío a los Peregrinos del Rey.',
      'Mira enfrente: la Peña del Rey. Allí trabajó el Rey del Eje, el rey de Antea.',
      'Un rey justo. Sus propios sabios le quitaron la corona y lo arrojaron a la Sima. Con él tiraron su Calzada.',
      'Llevamos generaciones mirando esa peña desde esta orilla. Al taller del Rey se llega por su Calzada, a pie, o no se llega.',
      'Cuando se partió la máquina del Puente, este trozo cayó al Mirador Sur. Lo trajimos nosotros.',
      'Hace cantar a las piedras de la Calzada, y las piedras suben. Tramo a tramo, volvemos a cruzar.',
      'Cuando lleguemos a su taller, todo Axis sabrá lo que le hicieron.',
    ],
    letPass: [
      'Si quieres ver la Peña con tus propios ojos, cruza. Pero pisa con cuidado: cada piedra aguanta lo justo.',
      '¡Tadeo! Deja pasar.',
    ],
    // Regla del tramo: narración neutra (Zygarde habla muy poco, autor, 25-09-2026).
    tutorial: [
      'Las piedras forzadas no son la Calzada: las sostiene el trozo de metal, y cada una aguanta un solo paso.',
      'Debajo se adivina la Calzada verdadera, entera. No encajará mientras las forzadas ocupen su sitio.',
      'Pisadas todas, una sola vez cada una, y terminando junto a la aguja, dejarían sitio a la Calzada verdadera.',
    ],
    again: 'El Rey nos abre el camino. Lo noto en cada piedra que sube.',
    doubt: ['…Esa luz verde.', 'Las piedras que alzas tú no se caen. Las nuestras no aguantan ni un paso.'],
  },
  tadeo: {
    block: 'Aquí no pisa nadie sin que lo diga Casandra. Está junto al Resonador.',
    moves: 'Tú primero, entonces. Si te caes, no digas que no te avisé.',
    after: 'Nunca había visto una piedra que no se cayera.',
    caretaker: 'Casandra dice que nos quedamos a cuidar la Calzada. Pues a cuidarla. Empezaré por barrer.',
  },
  tarsicio: {
    myth: [
      '¿Quieres oír la historia del Rey? Mi abuelo me la contaba a mí.',
      'Era fuerte y justo. Los sabios de Antea le tenían envidia y le robaron la corona mientras dormía.',
      'Luego lo arrojaron a la Sima. Y la tierra, de pura pena, se abrió con él.',
      'Por eso cruzamos. Para decirle que no le hemos olvidado.',
    ],
    after: [
      '«Vivió muchos años sin corona, cuidando el puente»… Así que eso ponía.',
      'Toda la vida contando que lo tiraron. Y él aquí, remendando piedras.',
      'Bueno. Es mejor historia. Se la contaré así a mis nietos.',
    ],
  },
  cocinera: {
    before: 'Guiso de bayas para treinta. Los peregrinos cruzan mejor con el estómago lleno.',
    crisis: 'Guiso de bayas para treinta. Con esta luna tan grande no duerme nadie, así que por lo menos que cenen bien.',
    after: 'Los que se quedan a cuidar la Calzada también comen. Más que antes, diría yo.',
  },
  nino: {
    before: '¡Cuando sea mayor cruzaré la Calzada entera! ¡Hasta el taller del Rey!',
    span: '¡La he visto brillar en verde! ¿Has sido tú? ¡Hala!',
    after: 'Casandra dice que el Rey no era un héroe. Que era un señor que arreglaba puentes. Me gusta más.',
  },
  mercader: {
    hello: 'Los peregrinos viajamos ligeros, pero siempre hay algo que sobra. ¿Te interesa algo?',
    bye: 'Que el camino te sea firme.',
  },
  resonator: {
    on: 'Un trozo de metal oscuro, rajado, sobre un trípode de madera. Vibra con un zumbido que se nota en los dientes.',
    off: 'El trozo del Resonador está apagado. Alguien le ha echado una manta encima.',
  },
  banner: 'Un estandarte de los Peregrinos del Rey: una corona dorada sobre fondo azul.',
  bannerAfter: 'Un estandarte de los Peregrinos. Debajo de la corona alguien ha cosido, con prisa, la silueta de un puente.',
  fire: 'Te sientas junto a la hoguera de los Peregrinos. Huele a guiso y a leña de pino.',
  stele: [
    'Una estela antigua con letras Unown muy gastadas.',
    'Con la Clave Glífica se leen unas pocas palabras: «POR AQUÍ BAJABA EL QUE CUIDABA EL PUENTE».',
  ],
  // Visita temprana (la Ruta 7 abre el Mirador desde el P4): sin la Clave Glífica (P5) no se lee.
  steleNoKey: 'Una estela antigua con letras Unown muy gastadas. No sabes leerlas.',
  sign: 'MIRADOR DE LA CALZADA\nAl norte, la Peña del Rey. Nadie pisa las piedras sin permiso de la guía.',
});

// ───────────────────────────── Llegada ─────────────────────────────

async function earlyArrival(ctx) {
  ctx.setFlag(F.arrivalEarly);
  await lines(ctx, SPEAKER.leocadia, CAMP_TEXT.leocadia.early);
}

async function welcome(ctx) {
  const back = ctx.flag(F.arrivalEarly);
  ctx.setFlag(F.arrival);
  // Descubrimiento directo (TABLILLAS §4.2): si la pista aún no estaba abierta, el arco empieza aquí.
  await ctx.story.openClue(ARC, { direct: true });
  await lines(ctx, SPEAKER.leocadia, back ? CAMP_TEXT.leocadia.welcomeBack : CAMP_TEXT.leocadia.welcome);
}

function arrivalEvents() {
  return ARRIVAL_STRIP.map(([x, y], k) => ({
    id: `llegada_calzada_${k}`, x, y,
    pages: [
      { when: when({ none: [F.p9, F.arrivalEarly] }), through: true, lock: false, trigger: 'touch', script: earlyArrival },
      { when: when({ all: [F.p9], none: [F.arrival] }), through: true, lock: false, trigger: 'touch', script: welcome },
    ],
  }));
}

// ───────────────────────────── Casandra y el Resonador ─────────────────────────────

async function casandraIntro(ctx) {
  await lines(ctx, SPEAKER.casandra, CAMP_TEXT.casandra.intro);
  await ctx.story.openClue(ARC, { direct: true, silent: true });
  await ctx.story.advanceClue(ARC, 2);
  await lines(ctx, SPEAKER.casandra, CAMP_TEXT.casandra.letPass);
  await ctx.fade('out', 12);
  ctx.setFlag(F.intro);
  await pause(ctx, 8);
  await ctx.fade('in', 12);
  await ctx.say(CAMP_TEXT.tadeo.moves, { speaker: SPEAKER.tadeo });
  if (!ctx.flag(F.spanTutorial)) {
    ctx.setFlag(F.spanTutorial);
    for (const t of CAMP_TEXT.casandra.tutorial) await ctx.say(t);
  }
}

async function casandraTalk(ctx) {
  if (!ctx.flag(F.intro)) { await casandraIntro(ctx); return; }
  if (ctx.flag(F.span1) || ctx.flag(F.span2)) { await lines(ctx, SPEAKER.casandra, CAMP_TEXT.casandra.doubt); return; }
  await ctx.say(CAMP_TEXT.casandra.again, { speaker: SPEAKER.casandra });
}

async function resonatorLook(ctx) {
  if (ctx.flag(F.resonatorOff)) { await ctx.say(CAMP_TEXT.resonator.off); return; }
  ctx.se?.('PRSFX- Stealth Rocks', { volume: 40 });
  await ctx.say(CAMP_TEXT.resonator.on);
}

function casandraCampEvents() {
  const R = CAMP.resonator;
  const C = CAMP.casandra;
  const res = { sprite: OBJ.resonator, directionFix: true, walkAnime: false, solid: true, trigger: 'action', script: resonatorLook };
  return [
    {
      id: 'resonador', x: R.x, y: R.y, name: 'Trozo del Resonador',
      pages: [
        { ...res, when: pilgrimsForcing, dir: 2, stepAnime: true, speed: 3, light: { radius: 48, intensity: 0.7 } },
        { ...res, when: when({ all: [F.resonatorOff] }), dir: 4 },
      ],
    },
    {
      id: 'casandra_campamento', x: C.x, y: C.y, name: 'Casandra',
      pages: [{ when: when({ all: [F.p9], none: [F.casandraArrived] }), sprite: SPRITE.casandra, dir: C.dir, move: 'still', trigger: 'action', script: casandraTalk }],
    },
  ];
}

// ───────────────────────────── Peregrinos del campamento ─────────────────────────────

const talk = (list, speaker) => async (ctx) => { await lines(ctx, speaker, [].concat(list)); };

async function leocadiaTalk(ctx) {
  const L = CAMP_TEXT.leocadia;
  if (ctx.flag(F.caretakers)) return lines(ctx, SPEAKER.leocadia, L.caretakers);
  if (!ctx.flag(F.p9)) return lines(ctx, SPEAKER.leocadia, L.early);
  if (!ctx.flag(F.intro)) return lines(ctx, SPEAKER.leocadia, [L.remind]);
  return lines(ctx, SPEAKER.leocadia, [L.after]);
}

async function tarsicioTalk(ctx) {
  await lines(ctx, SPEAKER.tarsicio, ctx.flag(F.tablet) ? CAMP_TEXT.tarsicio.after : CAMP_TEXT.tarsicio.myth);
}

async function ninoTalk(ctx) {
  const N = CAMP_TEXT.nino;
  const text = ctx.flag(F.tablet) ? N.after : ctx.flag(F.span1) ? N.span : N.before;
  await ctx.say(text, { speaker: SPEAKER.nino });
}

/**
 * Lo que vende el Peregrino, dentro de lo que ya vende una tienda general con el progreso actual (services/shop.js):
 * el campamento se visita desde el P4 (Ruta 7) y no debe adelantar objetos de tramos posteriores.
 */
export const CAMP_STOCK = Object.freeze(['ULTRABALL', 'HYPERPOTION', 'MAXPOTION', 'FULLHEAL', 'REVIVE', 'MAXREPEL']);
export const campStock = (state) => shopStock(state).filter((id) => CAMP_STOCK.includes(id));

async function merchant(ctx) {
  await ctx.say(CAMP_TEXT.mercader.hello, { speaker: SPEAKER.mercader });
  await openMart(ctx, { items: campStock(ctx.state) });
  await ctx.say(CAMP_TEXT.mercader.bye, { speaker: SPEAKER.mercader });
}

async function restAtFire(ctx) {
  await ctx.say(CAMP_TEXT.fire);
  await runRest(ctx, { kind: 'camp' });
}

function campEvents() {
  const N = NPC;
  const npc = (id, name, p, sprite, script, whenFn = null, extra = {}) => ({
    id, x: p.x, y: p.y, name,
    pages: [{ ...(whenFn ? { when: whenFn } : {}), sprite, dir: p.dir, move: 'still', trigger: 'action', script, ...extra }],
  });
  const F_ = CAMP_TEXT;
  return [
    npc('leocadia', 'Leocadia', N.leocadia, SPRITE.leocadia, leocadiaTalk),
    npc('tadeo_paso', 'Tadeo', N.tadeoPaso, SPRITE.tadeo, talk(F_.tadeo.block, SPEAKER.tadeo), when({ all: [F.p9], none: [F.intro] })),
    npc('tadeo', 'Tadeo', N.tadeo, SPRITE.tadeo, async (ctx) => {
      const T = F_.tadeo;
      await ctx.say(ctx.flag(F.caretakers) ? T.caretaker : ctx.flag(F.span1) ? T.after : T.moves, { speaker: SPEAKER.tadeo });
    }, when({ all: [F.intro] })),
    npc('tarsicio', 'Tarsicio', N.tarsicio, SPRITE.tarsicio, tarsicioTalk),
    npc('cocinera_peregrina', 'Peregrina', N.cocinera, SPRITE.cocinera, async (ctx) => {
      const C = F_.cocinera;
      await ctx.say(ctx.flag(F.caretakers) ? C.after : ctx.flag('p8_restored') ? C.crisis : C.before, { speaker: SPEAKER.cocinera });
    }),
    npc('nino_peregrino', 'Niño peregrino', N.nino, SPRITE.nino, ninoTalk),
    npc('mercader_peregrino', 'Peregrino', N.mercader, SPRITE.mercader, merchant),
    npc('cuidador_calzada', 'Peregrino', N.cuidador, SPRITE.peregrino, talk('Barro el primer tramo cada mañana. El Rey lo haría.', SPEAKER.peregrino), when({ all: [F.caretakers] })),
    {
      id: 'hoguera_peregrinos', x: CAMP.fire.x, y: CAMP.fire.y, name: 'Hoguera',
      pages: [{ sprite: OBJ.fire, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 4, solid: true, trigger: 'action', light: { radius: 64, intensity: 0.8 }, script: restAtFire }],
    },
    ...CAMP.banners.map(([x, y], i) => ({
      id: `estandarte_${i}`, x, y, name: 'Estandarte',
      pages: [{
        sprite: OBJ.banner, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, pattern: i % 4, solid: true, trigger: 'action',
        script: async (ctx) => { await ctx.say(ctx.flag(F.caretakers) ? F_.bannerAfter : F_.banner); },
      }],
    })),
    {
      id: 'estela_mirador', x: MIRADOR.stele.x, y: MIRADOR.stele.y + 1, name: 'Estela',
      pages: [{
        trigger: 'action',
        script: async (ctx) => {
          if (!ctx.state.hasItem?.('GLYPHKEY')) { await ctx.say(F_.steleNoKey); return; }
          for (const t of F_.stele) await ctx.say(t);
        },
      }],
    },
    { id: 'cartel_mirador', type: 'sign', x: 6, y: 46, text: F_.sign },
  ];
}

// ───────────────────────────── Objetos y entrenadores ─────────────────────────────

export const TRAINER_AFTER = Object.freeze({
  peregrino_ciriaco: ['Crucé el primer tramo cuando aún aguantaba. Desde aquí no hay vuelta sin la Calzada.', 'Ahora cuido esta pila. Alguien tiene que hacerlo.'],
  peregrina_benigna: ['Mis Pokémon podrían sacarme de aquí volando. Pero un peregrino no vuelve sin terminar el camino.', 'Me quedo a cuidar la Calzada con Casandra.'],
  peregrino_nicanor: ['La segunda pila es la más vieja. Mira las losas: aquí nunca se cayó nada.', 'La Calzada aguanta porque alguien la cuidó. Me quedo a seguir haciéndolo.'],
  peregrina_ursula: ['¿Cómo has cruzado? Las piedras se me deshacían bajo los pies…', 'Me quedo. Por lo menos hasta que la Calzada esté barrida entera.'],
  veterano_isidro: ['Llevo cuarenta años de peregrino. Nunca había pisado la Peña.', '«El Eje no elige reyes»… A mi edad, uno agradece que se lo digan.'],
});

export function itemEvents(items = ITEMS) {
  return items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count || 1, hidden: Boolean(it.hidden) }));
}

export function trainerEvents(trainers = TRAINERS) {
  return trainers.map((t) => {
    const def = TRAINER_DEFS[t.trainer] || {};
    return {
      id: t.id, type: 'trainer', x: t.x, y: t.y, dir: t.dir, sight: t.sight, trainer: t.trainer,
      name: def.name, sprite: def.overworld,
      after: (s) => (s?.flag(F.caretakers) ? TRAINER_AFTER[t.id]?.[1] : TRAINER_AFTER[t.id]?.[0]) || '…',
    };
  });
}

export function campAllEvents() {
  return [...arrivalEvents(), ...casandraCampEvents(), ...campEvents(), ...itemEvents()];
}
