// Eventos de la Ruta 15 · Sendero de los Acantilados (docs/CAMPANA.md B09 paso 5): los pescadores de la cala hablan
// de las mareas que traen barcos antiguos (anticipa el P7), el mirador, entrenadores, Binacle en las rocas de la costa
// (visible fijo, POKEDEX §7.3; reaparecen al descansar), objetos y el aviso del mar abierto (Mar del Sur, B13).
import { F, SPEAKER, SPRITE, OBJ, lines, blockedLink } from './b09b_common.js';
import { W, H, LOOKOUT, BINACLE_ROCKS, SPOTS, TRAINERS, ITEMS, HUT } from '../maps/b09b/ruta_15_layout.js';
import { linkOpen, blockedText } from '../maps/b09b/links.js';
import { COAST_ROCKS } from '../encounters/b09b.js';

export const R15_TEXT = Object.freeze({
  signEast: 'RUTA 15 · SENDERO DE LOS ACANTILADOS\n→ Ciudad Nexo   ← Caleta Sonda',
  signWest: 'RUTA 15 · SENDERO DE LOS ACANTILADOS\n← Caleta Sonda   → Ciudad Nexo',
  signCove: '↓ Cala de los pescadores. Cuidado con la marea.',
  lookoutSign: 'MIRADOR DEL ACANTILADO\nNo se asome a la barandilla.',
  binoculars: 'Unos prismáticos del mirador.',
  view: [
    'Al oeste, las casas blancas de Caleta Sonda y su faro, en la punta de la caleta.',
    'Mar adentro, un islote con árboles en flor. Y más allá, solo agua, que hoy va y viene como si respirara.',
  ],
  fisher1: [
    'Las mareas de este mes vienen raras. Suben de golpe y se van igual, como si el mar respirara.',
    'Ni los viejos de Caleta se acuerdan de algo así.',
  ],
  fisher2: [
    'El otro día, con la marea alta, vimos pasar un barco de velas cuadradas. De los de antes, de los de los cuadros.',
    'Al rato ya no estaba. Ni estela, ni nada.',
    'Mi abuelo decía que el mar devuelve lo que se tragó. Yo nunca me lo creí.',
  ],
});

const REST_VAR = 'rest_count';

/** Pokémon visible en una roca de la costa (Binacle 97 %, Barbaracle 3 %): combate al hablarle; reaparece al descansar. */
export function coastRockEvent(rock) {
  const seenVar = `b09_roca_${rock.id}`;
  const visible = (s) => Boolean(s) && Number(s.var(REST_VAR, 0)) > Number(s.var(seenVar, -1));
  return {
    id: rock.id, x: rock.x, y: rock.y, name: 'Binacle',
    pages: [{
      when: visible, sprite: SPRITE.binacle, dir: 2, move: 'still', stepAnime: true, solid: true, trigger: 'action',
      script: async (ctx) => {
        const rare = Math.random() * 100 < COAST_ROCKS[1][0];
        const [, species, min, max] = rare ? COAST_ROCKS[1] : COAST_ROCKS[0];
        const level = min + Math.floor(Math.random() * (max - min + 1));
        ctx.cry(species);
        await ctx.say(rare ? '¡Un Barbaracle se despega de la roca!' : '¡Un Binacle asoma de su roca!');
        const outcome = await ctx.wildBattle({ species, level });
        if (outcome === 'win' || outcome === 'caught') ctx.setVar(seenVar, Number(ctx.var(REST_VAR, 0)));
      },
    }],
  };
}

async function lookoutScript(ctx) {
  await ctx.say(R15_TEXT.binoculars);
  if ((await ctx.choice(['Mirar', 'Dejarlo'], { cancel: 1 })) !== 0) return;
  ctx.se('PC access', { volume: 50 });
  for (const line of R15_TEXT.view) await ctx.say(line);
}

function npcEvents() {
  const [f1, f2] = SPOTS.fishers;
  return [
    { id: 'pescador_mareas_1', x: f1.x, y: f1.y, name: SPEAKER.fisher, sprite: SPRITE.fisher, dir: f1.dir, move: 'still', trigger: 'action', script: (ctx) => lines(ctx, SPEAKER.fisher, R15_TEXT.fisher1) },
    {
      id: 'pescador_mareas_2', x: f2.x, y: f2.y, name: SPEAKER.fisher, sprite: 'anil:pescadoraow', dir: f2.dir, move: 'still', trigger: 'action',
      script: async (ctx) => { await lines(ctx, 'Pescadora', R15_TEXT.fisher2); ctx.setFlag(F.tides); },
    },
    { id: 'prismaticos_mirador', x: LOOKOUT.binoculars.x, y: LOOKOUT.binoculars.y, sprite: OBJ.binoculars, dir: 2, directionFix: true, solid: true, trigger: 'action', script: lookoutScript },
  ];
}

function signEvents() {
  return [
    { id: 'cartel_r15_este', type: 'sign', x: SPOTS.signEast.x, y: SPOTS.signEast.y, text: R15_TEXT.signEast, skin: 'sign hgss dir' },
    { id: 'cartel_r15_oeste', type: 'sign', x: SPOTS.signWest.x, y: SPOTS.signWest.y, text: R15_TEXT.signWest, skin: 'sign hgss dir' },
    { id: 'cartel_cala', type: 'sign', x: SPOTS.signCove.x, y: SPOTS.signCove.y, text: R15_TEXT.signCove },
    { id: 'cartel_mirador', type: 'sign', x: LOOKOUT.sign.x, y: LOOKOUT.sign.y, text: R15_TEXT.lookoutSign },
    {
      id: 'caseta_redes', x: HUT.door.x, y: HUT.door.y, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('La caseta de los pescadores. Está cerrada; huele a sal y a redes mojadas.'); },
    },
  ];
}

const TRAINER_TEXT = Object.freeze({
  nadadora_marina: { intro: '¿Vienes a nadar? ¡Primero, un combate para calentar!', after: 'Con estas mareas raras, prefiero quedarme en la orilla.' },
  pescador_andres: { intro: '¡Eh! Me espantas los peces. Por lo menos, que valga la pena.', after: 'Desde esta roca se ve pasar de todo. Hasta cosas que no deberían estar.' },
  ornitologo_bruno: { intro: 'Los Wingull anidan en la pared del acantilado. ¿Sabías que vuelan contra el viento para quedarse quietos?', after: 'Esta semana los Wingull vuelan muy bajo. Algo cambia en el mar.' },
  excursionista_elena: { intro: '¡El Sendero de los Acantilados es el más bonito de Axis! Y el más cansado.', after: 'Al llegar a Caleta, pide un pescado frito. Te lo has ganado.' },
  veterano_tomas: { intro: 'Treinta años subiendo a este mirador. Veamos qué traes.', after: 'El mar de estos días me recuerda a un cuento de mi abuela. Ella hablaba de una ciudad que se hundió.' },
});

function trainerEvents() {
  return TRAINERS.map((t) => ({ ...t, type: 'trainer', ...TRAINER_TEXT[t.id] }));
}

function itemEvents() {
  return ITEMS.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, hidden: Boolean(it.hidden) }));
}

function edgeEvents() {
  if (linkOpen('ruta_15', 'mar_del_sur')) return [];
  const cells = [];
  for (let x = 0; x < W; x++) cells.push([x, H - 1]);
  return blockedLink('mar_r15', cells, blockedText('ruta_15', 'mar_del_sur'), 'up', 'down');
}

export function ruta15Events() {
  return [
    ...signEvents(),
    ...npcEvents(),
    ...BINACLE_ROCKS.map(coastRockEvent),
    ...trainerEvents(),
    ...itemEvents(),
    ...edgeEvents(),
  ];
}
