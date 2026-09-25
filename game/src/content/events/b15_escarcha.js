// Eventos de la Gruta Escarcha (docs/CAMPANA.md §1.4 y §2.3: C094 «Lago helado»; POKEDEX §7.7: Glalita y Baxcaliburita
// «al fondo»; B22: el lago interior es del postgame, Articuno con la pista de Rosendo). Llegada, célula, objetos,
// megapiedras, entrenadores (55–56) y los derrumbes que tapan las bocas sin salida. Coordenadas en
// content/maps/b15/layout_escarcha.js.
import { F, zygardeSays, when } from './b15_common.js';
import { b15CellEvents } from './b15_cells.js';
import { ESCARCHA, ESCARCHA2 } from '../maps/b15/layout_escarcha.js';

export const ESCARCHA_TEXT = Object.freeze({
  arrival: 'El aire de la gruta huele a hielo limpio. Del fondo llega el rumor de una cascada que no se congela.',
  arrivalZygarde: 'Este hielo es de ahora. El viejo, el que recuerda, está en el lago del pueblo.',
  sealed: 'Un derrumbe de bloques de hielo tapa esta boca. Detrás se oye correr el agua.',
});

async function arrival(ctx) {
  ctx.setFlag(F.escarchaIntro);
  await ctx.say(ESCARCHA_TEXT.arrival);
  await zygardeSays(ctx, ESCARCHA_TEXT.arrivalZygarde);
}

export function escarchaEvents() {
  const E = ESCARCHA;
  return [
    // Al entrar por primera vez (automático: no depende de por dónde se eche a andar desde la repisa).
    { id: 'llegada_escarcha', x: E.entry.x, y: E.entry.y - 1, through: true, trigger: 'auto', when: when({ none: [F.escarchaIntro] }), script: arrival },
    ...b15CellEvents('gruta_escarcha'),
    { id: 'objeto_escarcha_glalita', type: 'item', ...E.glalita, item: 'GLALITITE' },
    { id: 'objeto_escarcha_1', type: 'item', ...E.item, item: 'FULLRESTORE' },
    {
      id: 'excursionista_lucio', type: 'trainer', trainer: 'b15_excursionista_lucio', name: 'Excursionista Lucio', sprite: 'anil:excursionista',
      ...E.trainers.lucio, sight: 3,
      intro: 'Esta gruta se abrió cuando se fue el hielo raro. ¡Soy el primero en explorarla! Bueno, el segundo.',
      after: 'Al fondo hay una sala donde todo resbala. Hay que pensar antes de dar un paso.',
    },
  ];
}

export function escarcha2Events() {
  const E = ESCARCHA2;
  return [
    ...E.sealed.map((p, i) => ({
      id: `derrumbe_escarcha_${i}`, x: p.x, y: p.y, name: 'Derrumbe', sprite: 'Object Ice', dir: 2, pattern: i % 4, directionFix: true, walkAnime: false,
      solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(ESCARCHA_TEXT.sealed); },
    })),
    { id: 'objeto_escarcha_baxcaliburita', type: 'item', ...E.baxcaliburita, item: 'BAXCALIBRITE' },
    ...E.items.map((it, i) => ({ id: `objeto_escarcha2_${i}`, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count || 1, hidden: Boolean(it.hidden) })),
    {
      id: 'montanero_fidel', type: 'trainer', trainer: 'b15_montanero_fidel', name: 'Montañero Fidel', sprite: 'anil:montanero',
      ...E.fidel, sight: 3,
      intro: 'He cruzado esa pista de hielo tres veces para llegar aquí abajo. No pienso irme sin un combate.',
      after: 'Dicen que en el lago de dentro, más al fondo, duerme algo muy frío. El viejo Rosendo lo sabrá.',
    },
  ];
}
