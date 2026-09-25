// Eventos de la Ruta 13 (docs/CAMPANA.md §1.4 «Nieve profunda», Terreno complicado): nieve honda (roughTerrain en
// cada casilla), células C091–C092, Abomasnowita (POKEDEX §7.7), entrenadores (54–55), un viajero que echa de menos la
// Torre de Hielo (T13) y el cartel. Coordenadas en content/maps/b15/layout_ruta13.js.
import { F, SPEAKER, SPRITE, markNorthUnbound, zygardeSays, when } from './b15_common.js';
import { b15CellEvents } from './b15_cells.js';
import { zygardeArea } from '../../world/zygarde/eventTypes.js';
import { RUTA13 } from '../maps/b15/layout_ruta13.js';

const R = RUTA13;

export const RUTA13_TEXT = Object.freeze({
  sign: 'RUTA 13\n↑ Villa Boreal · ↓ Paso del Norte\nNieve honda: no se aparte del camino con ventisca.',
  arrival: 'La nieve se hace honda y blanda. Cada paso se hunde hasta la rodilla.',
  arrivalZygarde: 'Aquí la tierra está dormida bajo la nieve. Pisa donde yo.',
  traveler: [
    'Otros años, desde aquí ya se veía la Torre de Hielo de Boreal. Con ventisca, era lo único que te decía hacia dónde tirar.',
    'Este invierno no la han levantado. Dicen que el hielo del lago no está bien.',
  ],
  travelerTower: '¡Ahí está la Torre! Con esa luz no se pierde nadie entre Boreal y el Paso.',
});

async function arrival(ctx) {
  ctx.setFlag(F.r13Intro);
  markNorthUnbound(ctx);
  await ctx.say(RUTA13_TEXT.arrival);
  await zygardeSays(ctx, RUTA13_TEXT.arrivalZygarde);
}

function trainerEvents() {
  const T = R.trainers;
  return [
    {
      id: 'montanera_yolanda', type: 'trainer', trainer: 'b15_montanera_yolanda', name: 'Montañera Yolanda', sprite: 'anil:excursionista_f',
      ...T.yolanda, sight: 3,
      intro: 'En la nieve honda se aprende a no correr. ¿Tú sabes esperar?',
      after: 'Mi Mamoswine me sigue, pero ya no se tumba a mi lado por la noche. Como si le diera igual quién soy.',
    },
    {
      id: 'excursionista_emilio', type: 'trainer', trainer: 'b15_excursionista_emilio', name: 'Excursionista Emilio', sprite: 'anil:excursionista',
      ...T.emilio, sight: 3,
      intro: '¡Eh! Llevo una hora abriendo huella en la nieve. Me vendrá bien entrar en calor.',
      after: 'En Boreal hay una posada donde te dejan dormir hasta que llega la ventisca. Hay quien lo hace a propósito.',
    },
    {
      id: 'veterana_genoveva', type: 'trainer', trainer: 'b15_veterana_genoveva', name: 'Veterana Genoveva', sprite: 'anil:veterana',
      ...T.genoveva, sight: 3,
      intro: 'He visto muchos inviernos en este valle, pero ninguno con el cielo así. Enséñame qué traes.',
      after: 'En el pueblo miran las auroras desde hace siglos. Este año nadie quiere mirar hacia arriba.',
    },
  ];
}

export function ruta13Events() {
  const I = R.items;
  const out = [];
  for (let x = R.arrival.x0; x <= R.arrival.x1; x++) {
    out.push({ id: `llegada_r13_${x}`, x, y: R.arrival.y, trigger: 'touch', when: when({ none: [F.r13Intro] }), script: arrival });
  }
  for (let x = R.arrivalNorth.x0; x <= R.arrivalNorth.x1; x++) {
    out.push({ id: `llegada_r13_norte_${x}`, x, y: R.arrivalNorth.y, trigger: 'touch', when: when({ none: [F.r13Intro] }), script: arrival });
  }
  for (const d of R.deep) out.push(...zygardeArea('roughTerrain', `nieve_honda_r13_${d.id}`, d.x0, d.y0, d.x1 - d.x0 + 1, d.y1 - d.y0 + 1, { kind: 'snow' }));
  out.push(
    ...trainerEvents(),
    ...b15CellEvents('ruta_13'),
    {
      id: 'viajero_torre', x: R.traveler.x, y: R.traveler.y, name: 'Viajero', sprite: 'campista', dir: R.traveler.dir, move: 'look',
      pages: [
        { trigger: 'action', script: async (ctx) => { for (const t of RUTA13_TEXT.traveler) await ctx.say(t, { speaker: 'Viajero' }); } },
        { when: when({ all: [F.tower] }), trigger: 'action', script: async (ctx) => { await ctx.say(RUTA13_TEXT.travelerTower, { speaker: 'Viajero' }); } },
      ],
    },
    { id: 'cartel_r13', type: 'sign', x: R.sign.x, y: R.sign.y, text: RUTA13_TEXT.sign },
    { id: 'objeto_r13_abomasnowita', type: 'item', ...I.abomasite, item: 'ABOMASITE' },
    { id: 'objeto_r13_revivir_max', type: 'item', ...I.maxRevive, item: 'MAXREVIVE' },
    { id: 'objeto_r13_oculto', type: 'item', ...I.hidden, item: 'ULTRABALL', count: 3, hidden: true },
  );
  return out;
}

export { SPEAKER, SPRITE };
