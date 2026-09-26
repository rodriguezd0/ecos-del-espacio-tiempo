// Eventos de la Ruta 11 (docs/CAMPANA.md §1.4 y B15 «Problema: desvinculación»): primera entrada tras el P7 con los
// restos del hielo-eco y la montañera cuyo Snover ya no la reconoce (fija el estado del mundo b15_desvinculacion),
// células C089 (nieve honda, Terreno) y C090 (repisa alta tras una roca nevada, Embestida), entrenadores (52–54),
// objetos y carteles. Coordenadas en content/maps/b15/layout_ruta11.js.
import { F, SPEAKER, SPRITE, OBJ, isNorthUnbound, markNorthUnbound, lines, pause, when } from './b15_common.js';
import { b15CellEvents } from './b15_cells.js';
import { zygardeArea } from '../../world/zygarde/eventTypes.js';
import { RUTA11 } from '../maps/b15/layout_ruta11.js';

const R = RUTA11;
const unbound = (s) => isNorthUnbound(s);
const rebound = (s) => Boolean(s) && s.flag(F.p8);

export const RUTA11_TEXT = Object.freeze({
  sign: 'RUTA 11 · VERTIENTE NEVADA\n↑ Paso del Norte · ↓ Villa Brontia',
  signTop: 'PASO DEL NORTE ↑\nRefugio de montaña abierto todo el año.',
  remains: 'Un resto del hielo-eco. Se va deshaciendo en agua clara, sin un solo crujido.',
  arrival: 'Donde la ruta empieza a subir, el hielo-eco que cerraba la vertiente se está deshaciendo en agua clara.',
  call: ['¡Escarcha! Ven aquí, bonito… Soy yo.'],
  callAgain: '…Escarcha.',
  woman: [
    'Nada. Me mira como si no me hubiera visto nunca.',
    'Lo crié desde que era una semilla. Desde que se retiró el hielo no viene cuando lo llamo.',
    'Y no es solo él. En el refugio del Paso dicen que les pasa a todos en el norte: los Pokémon miran a sus entrenadores como a extraños.',
  ],
  womanAfter: 'No me voy sin él. Aunque no me reconozca, sigue siendo mi compañero.',
  womanBack: '¡Ha vuelto él solo! Esta mañana me empujó con la cabeza, como cuando era pequeño.',
  snover: 'El Snover retrocede un paso. No deja que nadie se le acerque, ni siquiera su entrenadora.',
  snoverBack: '¡Snoo!',
});

async function unboundScene(ctx) {
  ctx.setFlag(F.r11Intro);
  markNorthUnbound(ctx);
  await ctx.say(RUTA11_TEXT.arrival);
  await ctx.camera?.pan?.(R.unbound.woman.x + 2, R.unbound.woman.y, 40);
  ctx.face('montanera_escarcha', 'right');
  await lines(ctx, SPEAKER.montanera, RUTA11_TEXT.call);
  ctx.face('snover_escarcha', 'left');
  await pause(ctx, 20);
  await ctx.emote('snover_escarcha', '?');
  await ctx.move('snover_escarcha', ['turn_right', 'right', { wait: 10 }, 'turn_up'], { through: true });
  await ctx.say(RUTA11_TEXT.callAgain, { speaker: SPEAKER.montanera });
  await ctx.camera?.reset?.(30);
  ctx.face('montanera_escarcha', 'down');
  await lines(ctx, SPEAKER.montanera, RUTA11_TEXT.woman); // Zygarde habla muy poco (autor, 25-09-2026).
}

function sceneEvents() {
  const T = R.unbound.trigger;
  const out = [];
  for (let x = T.x0; x <= T.x1; x++) {
    out.push({ id: `llegada_r11_${x}`, x, y: T.y, trigger: 'touch', when: (s) => Boolean(s) && !s.flag(F.r11Intro) && !s.flag(F.p8), script: unboundScene });
  }
  const W = R.unbound.woman;
  const S = R.unbound.snover;
  out.push({
    id: 'montanera_escarcha', x: W.x, y: W.y, name: SPEAKER.montanera,
    pages: [
      { sprite: SPRITE.montanera, dir: W.dir, move: 'still', trigger: 'action', script: async (ctx) => { await ctx.say(RUTA11_TEXT.womanAfter, { speaker: SPEAKER.montanera }); } },
      { when: rebound, sprite: SPRITE.montanera, dir: 6, move: 'look', trigger: 'action', script: async (ctx) => { await ctx.say(RUTA11_TEXT.womanBack, { speaker: SPEAKER.montanera }); } },
    ],
  });
  out.push({
    id: 'snover_escarcha', x: S.x, y: S.y, name: 'Snover',
    pages: [
      { when: (s) => Boolean(s) && !rebound(s), sprite: SPRITE.snover, dir: 4, move: 'look', stepAnime: true, trigger: 'action', script: async (ctx) => { ctx.cry('SNOVER'); await ctx.say(RUTA11_TEXT.snover); } },
    ],
  });
  out.push({
    id: 'snover_escarcha_vuelta', x: W.x + 1, y: W.y, name: 'Snover',
    pages: [{ when: rebound, sprite: SPRITE.snover, dir: 4, stepAnime: true, trigger: 'action', script: async (ctx) => { ctx.cry('SNOVER'); await ctx.say(RUTA11_TEXT.snoverBack, { speaker: 'Snover' }); } }],
  });
  return out;
}

function remainsEvents() {
  return R.iceRemains.map(([x, y], i) => ({
    id: `hielo_eco_resto_${i}`, x, y, name: 'Hielo-eco',
    pages: [{
      when: (s) => Boolean(s) && !s.flag(F.p8), sprite: SPRITE.iceObject, dir: 8, pattern: i % 4, directionFix: true, walkAnime: false,
      solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(RUTA11_TEXT.remains); },
    }],
  }));
}

function trainerEvents() {
  const T = R.trainers;
  return [
    {
      id: 'excursionista_begona', type: 'trainer', trainer: 'b15_excursionista_begona', name: 'Excursionista Begoña', sprite: 'anil:excursionista_f',
      ...T.begona, sight: 3,
      intro: '¡Por fin se puede subir! Llevaba semanas esperando a que se fuera ese hielo raro.',
      after: 'Mi Piloswine me ha seguido hasta aquí, pero ya no me mira igual. Como si dudara.',
    },
    {
      id: 'montanero_abel', type: 'trainer', trainer: 'b15_montanero_abel', name: 'Montañero Abel', sprite: 'anil:montanero',
      ...T.abel, sight: 3,
      intro: 'Esta vertiente la conozco piedra a piedra. ¿Y tú? ¿Conoces a tus Pokémon?',
      after: 'Ayer mi Machamp se quedó quieto en mitad del camino y no me respondió. Hoy combate como siempre… casi.',
    },
    {
      id: 'fotografa_sabina', type: 'trainer', trainer: 'b15_fotografa_sabina', name: 'Fotógrafa Sabina', sprite: 'anil:fotografa',
      ...T.sabina, sight: 3,
      intro: 'Los Staraptor bajan de la cumbre cuando cambia el tiempo. ¡Y hoy ha cambiado!',
      after: 'Desde el Paso se ve una columna de luz sobre la Cumbre Azur. Los pájaros no se acercan a ella.',
    },
    {
      id: 'veterano_hilario', type: 'trainer', trainer: 'b15_veterano_hilario', name: 'Veterano Hilario', sprite: 'anil:veterano',
      ...T.hilario, sight: 3,
      intro: 'Treinta inviernos subiendo al Paso. Este es el más extraño de todos. Veamos si tú lo arreglas.',
      after: 'Mi Absol no se separa de mí desde que empezó lo del cielo. Él lo nota antes que nadie.',
    },
  ];
}

function itemEvents() {
  const I = R.items;
  const L = R.ledge;
  return [
    { id: 'objeto_r11_hiperpocion', type: 'item', ...I.hyper, item: 'HYPERPOTION' },
    { id: 'objeto_r11_piedra_hielo', type: 'item', ...I.iceStone, item: 'ICESTONE' },
    { id: 'objeto_r11_ultraball', type: 'item', ...I.ultra, item: 'ULTRABALL', count: 2 },
    { id: 'objeto_r11_antiderretir', type: 'item', ...I.neverMelt, item: 'NEVERMELTICE', hidden: true },
    { id: 'objeto_r11_repelente', type: 'item', ...L.item, item: 'MAXREPEL' },
  ];
}

function fieldEvents() {
  const d = R.deepSnow;
  const L = R.ledge;
  return [
    ...zygardeArea('roughTerrain', 'nieve_honda_r11', d.x0, d.y0, d.x1 - d.x0 + 1, d.y1 - d.y0 + 1, { kind: 'snow' }),
    { id: 'roca_repisa_r11', type: 'ramRock', x: L.rock.x, y: L.rock.y, kind: 'rock', sprite: OBJ.veins, dir: 8, directionFix: true, stepAnime: true },
  ];
}

export function ruta11Events() {
  return [
    ...sceneEvents(),
    ...remainsEvents(),
    ...trainerEvents(),
    ...itemEvents(),
    ...fieldEvents(),
    ...b15CellEvents('ruta_11'),
    { id: 'cartel_r11', type: 'sign', x: R.sign.x, y: R.sign.y, text: RUTA11_TEXT.sign },
    { id: 'cartel_r11_paso', type: 'sign', x: R.signTop.x, y: R.signTop.y, text: RUTA11_TEXT.signTop },
  ];
}

export { when };
