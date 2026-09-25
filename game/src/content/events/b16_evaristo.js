// T14 «La carta sin destino» — pista inicial (docs/TABLILLAS.md §4.4 y ficha T14: «Correos de Nexo, Don Evaristo, 84:
// una carta de hace 60 años dirigida "a la Mesa de los Vientos", devuelta otra vez»; la abre B16 tras el P8). Es una
// página más del evento `evaristo` de content/maps/b09b/nexo_correos.js (B09b). La segunda pista (el acertijo del sobre)
// y la Mesa de los Vientos son de B17.
import { F } from './b16_common.js';

export const EVARISTO_SPEAKER = 'Don Evaristo';

export const EVARISTO_T14_TEXT = Object.freeze({
  first: Object.freeze([
    'Espera un momento. Hoy me la han vuelto a devolver.',
    'Esta carta. Tiene sesenta años. Va dirigida «a la Mesa de los Vientos», y cada vez que la mando, me la devuelven.',
    'Es para mi hermana. Se marchó a vivir allí cuando éramos jóvenes, y nunca he sabido cómo se llega.',
    'Ningún cartero de Axis ha encontrado esa Mesa. Dicen que no hay camino.',
    'Tú vas y vienes por toda la región… Si algún día das con ella, acuérdate de este viejo.',
  ]),
  again: Object.freeze([
    'La carta sigue aquí, en su casillero. Ya no la mando: la guardo para quien sepa llevarla.',
  ]),
});

/** Página de T14 del evento `evaristo` (se activa tras el P8). */
export async function evaristoT14(ctx) {
  if (ctx.flag(F.letter)) {
    for (const t of EVARISTO_T14_TEXT.again) await ctx.say(t, { speaker: EVARISTO_SPEAKER });
    return;
  }
  for (const t of EVARISTO_T14_TEXT.first) await ctx.say(t, { speaker: EVARISTO_SPEAKER });
  await ctx.say('Don Evaristo te enseña el sobre: amarillento, con muchos matasellos y una dirección de una sola línea.');
  ctx.setFlag(F.letter);
  await ctx.story.openClue('T14');
}

/** Condición de la página: el P8 restaurado. */
export const evaristoT14When = (s) => Boolean(s?.flag(F.restored));
