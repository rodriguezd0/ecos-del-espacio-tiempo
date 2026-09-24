// T10 · «La cuadrilla perdida» (docs/TABLILLAS.md T10), primera parte: Nilo, técnico de Genesis, escondido y
// aterrado en el Bosque Neblino. Solo aparece DE NOCHE (arco nocturno: se llega descansando en la hoguera del
// bosque). De día queda su vivac entre las raíces, que invita a volver. Pista inicial al encontrarlo y segunda
// pista («su cuadrilla subió a la Ruta 10 y no ha vuelto») al hablar con él de nuevo. Tras rescatar a la cuadrilla,
// Nilo sube a la Ruta 10 (la deserción la dirige b11_t10.js). Módulo puro salvo los guiones.
import { F, SPEAKER, SPRITE, OBJ, TELEPATHY, when, isNight, lines, zygardeSays } from './b11_common.js';
import { NEBLINO } from '../maps/b11/layout.js';

const N = NEBLINO;
const ARC = 'T10';

export const NILO_TEXT = Object.freeze({
  camp: 'Un maletín de instrumentos, y al lado una manta hecha un ovillo contra el cristal. En el asa cuelga un guante de trabajo con un emblema bordado: dos tubos de ensayo cruzados sobre un círculo.',
  campZygarde: 'Quien duerme aquí se esconde. Volverá cuando oscurezca.',
  first: [
    '¡No! ¡No me delates, por favor!',
    '…Tú no eres de la base. Perdona. Llevo dos días sin dormir.',
  ],
  firstZygarde: 'Tiene miedo. No de nosotros.',
  firstAfter: [
    'Me llamo Nilo. Técnico de campo de Genesis. Del «Consorcio», para los de fuera. …O lo era, ya no lo sé.',
    'No puedo volver al campamento. Todavía no. No así.',
  ],
  told: [
    'Hace dos noches subimos a la Ruta 10, al pinar muerto de arriba. La jefa quería lecturas junto a un dormidero de Honchkrow.',
    'Decía que allí «algo resuena». Colocamos los sensores y los Honchkrow se nos echaron encima.',
    'Yo corrí. Bajé por las raíces y no paré hasta el bosque. Los demás… no han vuelto.',
    'Si vuelvo al campamento sin ellos, preguntarán por qué los dejé. Y tendrán razón.',
    'Tú subes por las paredes como si nada. ¿Podrías… mirar si siguen ahí arriba?',
  ],
  waiting: 'Están en la Ruta 10, arriba, en el pinar muerto al este de la pared de raíces. Cuidado con los centinelas: los Honchkrow lo ven todo desde las ramas.',
});

const niloHere = (s) => isNight(s) && !s.flag(F.crewSaved) && !s.flag(F.niloDeserts);

/** Primer encuentro: pista inicial (descubrimiento directo: entra aunque haya 3 pistas activas). */
async function niloFirst(ctx) {
  ctx.se('exclaim');
  await ctx.emote('this', '!');
  await lines(ctx, SPEAKER.nilo, NILO_TEXT.first);
  await zygardeSays(ctx, NILO_TEXT.firstZygarde);
  await lines(ctx, SPEAKER.nilo, NILO_TEXT.firstAfter);
  ctx.setFlag(F.niloMet);
  await ctx.story.openClue(ARC, { direct: true });
}

/** Segunda conversación: la cuadrilla subió a la Ruta 10 (segunda pista, anillo de zona en el mapa regional). */
async function niloTells(ctx) {
  await lines(ctx, SPEAKER.nilo, NILO_TEXT.told);
  ctx.setFlag(F.niloTold);
  await ctx.story.advanceClue(ARC, 2);
}

async function niloTalk(ctx) {
  if (!ctx.flag(F.niloMet)) return niloFirst(ctx);
  if (!ctx.flag(F.niloTold)) return niloTells(ctx);
  await ctx.say(NILO_TEXT.waiting, { speaker: SPEAKER.nilo });
  return null;
}

/** Nilo (de noche) y su vivac (de día: el maletín de instrumentos) en el escondite junto al río. */
export function niloEvents() {
  const { x, y, dir } = N.nilo;
  return [
    {
      id: 'nilo_escondido', x, y, name: 'Nilo',
      pages: [
        {
          when: when({ none: [F.crewSaved, F.niloDeserts] }), sprite: OBJ.instrumentCase, dir: 2, directionFix: true,
          walkAnime: false, solid: true, trigger: 'action',
          script: async (ctx) => {
            await ctx.say(NILO_TEXT.camp);
            if (!ctx.flag('b11_t10_vivac')) {
              ctx.setFlag('b11_t10_vivac');
              await ctx.say(NILO_TEXT.campZygarde, TELEPATHY);
            }
          },
        },
        { when: niloHere, sprite: SPRITE.nilo, dir, move: 'still', trigger: 'action', script: niloTalk },
      ],
    },
  ];
}

export { niloTalk, niloHere };
