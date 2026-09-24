// Eventos de la Ruta 14 y la Reserva del Delta (docs/CAMPANA.md §1.4 y B09 parte A; TABLILLAS T07): la puerta de la
// Reserva con su guarda (cerrada por el enjambre; con la pista de Iván, o por descubrimiento directo, deja pasar),
// Iván dentro, el enjambre que cierra la Reserva interior hasta T07, el arco T07 (b09a_t07.js), Applin del huerto
// (visible fijo nv 34), el árbol de miel, el remolino de la laguna (Buceo → reserva_fondo), entrenadores, objetos,
// carteles, células (C043, C071) y el enlace con Ciudad Nexo (B09b).
import { F, V, SPEAKER, SPRITE, when, say, lines, examine, blockedLink, npc } from './b09a_common.js';
import { t07Events } from './b09a_t07.js';
import { t07Phase, swarmUp } from './b09a_t07_logic.js';
import { honeyTreeEvent, visibleWildEvent } from './b09a_wild.js';
import { b09aCellEvents } from './b09a_cells.js';
import { RESERVA_HONEY, APPLIN } from '../encounters/b09a.js';
import { EXITS, FENCE, SPOTS } from '../maps/b09a/ruta_14_layout.js';
import { blockedText } from '../maps/b09a/links.js';

const I = SPEAKER.ivan;
const G = SPEAKER.guard;

export const RESERVA_TEXT = Object.freeze({
  signNorth: 'RUTA 14 · Delta del Albo\n↑ Ciudad Lúmina · Ciudad Nexo ↓',
  signGate: 'RESERVA DEL DELTA\nPor favor, no molesten a los Pokémon salvajes.',
  signGateClosed: 'RESERVA DEL DELTA — CERRADA\nEnjambre activo. Prohibido el paso.',
  signSouth: 'RUTA 14\n↓ Ciudad Nexo',
  swarm: 'Un enjambre de Combee zumba en el paso del seto. No dejan pasar a nadie.',
});

// ------------------------------------------------------------ puerta y guarda
async function gateScene(ctx) {
  if (ctx.flag(F.gatePass) || ctx.flag(F.reserveOpen)) return;
  ctx.face('player', 'left');
  if (!ctx.flag(F.ivan)) {
    // Descubrimiento directo (TABLILLAS §4.2): el arco empieza igual aunque no se tuviera la pista.
    await lines(ctx, G, [
      '¡Espera! La Reserva está cerrada. Hay un enjambre enorme ahí dentro y hemos tenido que sacar a todos los visitantes.',
      'Iván, el guardabosques, ha ido al Centro Pokémon de Lúmina a pedir ayuda. Dice que va a quemar la colmena si no se va.',
      '…¿Tú vienes a ayudar? Entonces pasa. Pero con cuidado, y no te acerques demasiado sin hablar con él.',
    ]);
    await ctx.story.openClue('T07', { direct: true });
  } else {
    await say(ctx, G, 'Iván me ha dicho que vendrías. Pasa: te espera junto a la colmena.');
  }
  ctx.setFlag(F.gatePass);
}

function gateEvents() {
  const closed = (s) => Boolean(s) && !s.flag(F.gatePass) && !s.flag(F.reserveOpen);
  const strip = [];
  for (let y = FENCE.gate.y0; y <= FENCE.gate.y1; y++) strip.push({ id: `puerta_reserva_${y}`, x: FENCE.x, y, trigger: 'touch', through: true, when: closed, script: gateScene });
  return [
    ...strip,
    {
      id: 'guarda_reserva', x: SPOTS.guard.x, y: SPOTS.guard.y, name: G,
      pages: [
        { sprite: SPRITE.guard, dir: 2, move: 'look', trigger: 'action', script: async (ctx) => {
          if (!ctx.flag(F.gatePass) && !ctx.flag(F.reserveOpen)) { await gateScene(ctx); return; }
          await say(ctx, G, 'Dentro hay una colmena del tamaño de una casa. Y la gente quiere volver a pasear por aquí. Menudo lío.');
        } },
        { when: when({ all: [F.reserveOpen] }), sprite: SPRITE.guard, dir: 2, move: 'look', trigger: 'action', script: async (ctx) => {
          await say(ctx, G, '¡La Reserva vuelve a estar abierta! Iván no para de contar cómo sacaste a la reina de la colmena.');
        } },
      ],
    },
    { id: 'cartel_puerta', type: 'sign', x: SPOTS.signGate.x, y: SPOTS.signGate.y, script: async (ctx) => {
      await ctx.say(ctx.flag(F.reserveOpen) ? RESERVA_TEXT.signGate : RESERVA_TEXT.signGateClosed, { skin: 'signskin' });
    } },
  ];
}

// ------------------------------------------------------------ Iván dentro de la Reserva
function ivanEvents() {
  const inside = (s) => Boolean(s) && (s.flag(F.ivan) || s.flag(F.gatePass));
  return [{
    id: 'ivan_reserva', x: SPOTS.ivanGate.x, y: SPOTS.ivanGate.y, name: I,
    pages: [
      { when: (s) => inside(s) && !s.flag(F.t07Done), sprite: SPRITE.ivan, dir: 4, move: 'look', trigger: 'action', script: async (ctx) => {
        const phase = t07Phase(ctx.state);
        if (phase === 'open') { await say(ctx, I, 'Ve a ver la colmena, al noroeste de aquí. Te explicaré lo que sé.'); return; }
        if (phase === 'gather') { await say(ctx, I, 'Sigue a las obreras de la colmena. Cada una lleva polen de una flor distinta: pradera, orilla y huerto.'); return; }
        if (phase === 'ready') { await say(ctx, I, '¿Ya tienes las tres flores? Llévalas al pie de la colmena. Y apártate cuando salga la reina.'); return; }
        await say(ctx, I, 'La reina está furiosa. Si hace falta, descansa y vuelve: la colmena no se va a ir a ninguna parte.');
      } },
      { when: when({ all: [F.t07Done] }), sprite: SPRITE.ivan, dir: 2, move: 'look', trigger: 'action', script: async (ctx) => {
        await say(ctx, I, 'La colmena está en el fondo de la Reserva, junto al seto. Allí no molesta a nadie, y los visitantes pueden verla de lejos.');
      } },
    ],
  }];
}

// ------------------------------------------------------------ enjambre, huerto, laguna
function swarmEvents() {
  return SPOTS.swarm.map(([x, y], i) => ({
    id: `enjambre_${i}`, x, y, name: 'Enjambre',
    pages: [{ when: (s) => Boolean(s) && swarmUp(s), sprite: SPRITE.combee, dir: 2, move: 'still', stepAnime: true, speed: 5, solid: true, trigger: 'action',
      script: async (ctx) => { ctx.cry?.('COMBEE'); await ctx.say(RESERVA_TEXT.swarm); } }],
  }));
}

function wildEvents() {
  return [
    visibleWildEvent('applin', SPOTS.applin.x, SPOTS.applin.y, {
      species: APPLIN.species, level: APPLIN.level, sprite: SPRITE.applin, caughtFlag: F.applinCaught, restVar: V.applinRest,
      text: '¡Un Applin se asoma de entre las manzanas caídas!', move: { wander: 2 },
    }),
    honeyTreeEvent('arbol_miel', SPOTS.honeyTree.x, SPOTS.honeyTree.y, { varName: V.honey, table: RESERVA_HONEY }),
    { id: 'remolino_laguna', type: 'diveSpot', x: SPOTS.dive.x, y: SPOTS.dive.y, to: 'reserva_fondo', tx: 10, ty: 9, dir: 2 },
  ];
}

// ------------------------------------------------------------ entrenadores, objetos, carteles
function trainerEvents() {
  return [
    { id: 'bichera_lola', type: 'trainer', trainer: 'b09a_r14_bichera_lola', name: 'Bichera Lola', sprite: 'anil:bichera',
      x: 16, y: 12, dir: 4, sight: 3, intro: '¡Los bichos del delta están raros! Vuelan en enjambres hacia el sur. ¿Combatimos?',
      after: 'Los enjambres migran fuera de temporada. Algo va a cambiar, ¿verdad?' },
    { id: 'pescador_andres', type: 'trainer', trainer: 'b09a_r14_pescador_andres', name: 'Pescador Andrés', sprite: 'anil:pescador',
      x: 24, y: 44, dir: 2, sight: 3, intro: 'Aquí se pesca bien con una buena caña. Y se combate mejor.',
      after: 'Con una Caña Buena sacarías Barboach del brazo sur. En Nexo regalan cañas, o eso dicen.' },
    { id: 'excursionista_ruben', type: 'trainer', trainer: 'b09a_r14_excursionista_ruben', name: 'Excursionista Rubén', sprite: 'anil:excursionista',
      x: 30, y: 38, dir: 8, sight: 4, intro: '¡Del delta a Nexo a pie! Pero antes, un combate.',
      after: 'Ciudad Nexo está al sur. Desde el puerto se ve el mar entero.' },
    { id: 'fotografa_sara', type: 'trainer', trainer: 'b09a_r14_ornitologa_sara', name: 'Fotógrafa Sara', sprite: 'anil:fotografa',
      x: 50, y: 32, dir: 4, sight: 3, intro: '¡Me han dejado entrar a fotografiar la colmena! Tú también, ¿eh? Combate primero.',
      after: 'La foto de la reina saliendo de la colmena… eso sí que sería una portada.' },
    { id: 'dama_elena', type: 'trainer', trainer: 'b09a_r14_dama_elena', name: 'Dama Elena', sprite: 'anil:dama',
      x: 43, y: 51, dir: 6, sight: 3, intro: '¡Por fin puedo volver a pasear por la Reserva interior! Celebrémoslo.',
      after: 'Las flores del fondo de la Reserva son las más bonitas del delta.' },
  ];
}

function detailEvents(open) {
  const out = [
    { id: 'cartel_norte', type: 'sign', x: SPOTS.signNorth.x, y: SPOTS.signNorth.y, text: RESERVA_TEXT.signNorth },
    { id: 'cartel_sur', type: 'sign', x: SPOTS.signSouth.x, y: SPOTS.signSouth.y, text: RESERVA_TEXT.signSouth },
    { id: 'objeto_r14_1', type: 'item', x: 4, y: 12, item: 'BIGMUSHROOM' },
    { id: 'objeto_r14_2', type: 'item', x: 21, y: 32, item: 'ULTRABALL', hidden: true },
    { id: 'objeto_r14_3', type: 'item', x: 55, y: 31, item: 'MIRACLESEED', hidden: true },
    { id: 'objeto_r14_4', type: 'item', x: 40, y: 51, item: 'SILVERPOWDER' },
    { id: 'objeto_r14_5', type: 'item', x: 52, y: 16, item: 'DEEPSEASCALE' },
    { id: 'objeto_r14_6', type: 'item', x: 9, y: 52, item: 'TINYMUSHROOM', hidden: true },
    npc('vecino_delta', 23, 5, SPRITE.neighborM, 'Paseante', (s) => (s.flag(F.reserveOpen)
      ? ['¡Han vuelto a abrir la Reserva! Dicen que alguien sacó a la reina de la colmena con tres flores. …Espera, ¿fuiste tú?']
      : ['Venía a ver la Reserva y está cerrada por un enjambre. En el Centro de Lúmina anda el guardabosques buscando ayuda.']), { dir: 2 }),
    examine('puesto_guardas', 33, 30, 'PUESTO DE GUARDAS DE LA RESERVA\nHoy no se venden entradas.', { solid: true }),
  ];
  if (!open.south) {
    const cells = [];
    for (let x = EXITS.south.x0; x <= EXITS.south.x1; x++) cells.push([x, EXITS.south.y]);
    out.push(...blockedLink('borde_nexo', cells, blockedText('ruta_14_reserva', 'ciudad_nexo'), 'up', 'down'));
  }
  return out;
}

export function reservaEvents(open = {}) {
  return [
    ...gateEvents(),
    ...ivanEvents(),
    ...swarmEvents(),
    ...t07Events(),
    ...wildEvents(),
    ...trainerEvents(),
    ...detailEvents(open),
    ...b09aCellEvents('ruta_14_reserva'),
  ];
}
