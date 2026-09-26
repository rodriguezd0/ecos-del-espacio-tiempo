// Dunas de Ceniza (docs/CAMPANA.md B08, paso 2: «Cruzar las Dunas (arena profunda, Terreno) hasta el Cerro Plomo»):
// la ceniza honda (Terreno complicado) corta el paso por tres vados de la cresta y cubre los dos campos de las
// células C037 y C038; entrenadores del desierto, las ruinas de zócalos (Sigilyph) y la Cueva de las Dunas.
import { F, SPEAKER, examine } from './b08_common.js';
import { b08CellEvents } from './b08_cells.js';
import { zygardeArea } from '../../world/zygarde/eventTypes.js';
import { DUNAS, DUNAS_CUEVA } from '../maps/b08/layout.js';

export const DUNAS_TEXT = Object.freeze({
  sign: 'DUNAS DE CENIZA\nAl este: Cerro Plomo.\nNo se adentre en la ceniza honda sin preparación.',
  ruins: 'Zócalos de piedra hexagonales, gastados por el viento. Alguien los colocó en círculo hace muchísimo tiempo.',
  cave: 'Un boquete oscuro entre las rocas. Se oye el viento soplar dentro.',
  caveAsk: '¿Bajar a la cueva?',
});

/** Ruido determinista [0, 1) por casilla (formas orgánicas reproducibles). */
const noise = (x, y, seed) => {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Mancha orgánica (elipse con borde irregular) dentro del rectángulo x0..x1, y0..y1. */
export function organic(x0, y0, x1, y1, seed = 0) {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const rx = (x1 - x0) / 2 + 0.6;
  const ry = (y1 - y0) / 2 + 0.6;
  const out = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 0.78 + 0.4 * noise(x, y, seed)) out.push([x, y]);
    }
  }
  return out;
}

/**
 * Ceniza honda: un evento de Terreno complicado por casilla (tipo roughTerrain, arena). Los vados ocupan todo el ancho
 * de la cresta (no hay forma de rodearlos); los campos de las células son manchas orgánicas con la célula dentro.
 */
export function ashCells() {
  const out = new Map();
  const add = ([x, y]) => out.set(`${x},${y}`, [x, y]);
  for (const f of DUNAS.fords) for (let y = f.y0; y <= f.y1; y++) for (let x = f.x0; x <= f.x1; x++) add([x, y]);
  DUNAS.ashFields.forEach((f, i) => {
    organic(f.x0, f.y0, f.x1, f.y1, 11 + i).forEach(add);
    const { x, y } = f.cell;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) add([x + dx, y + dy]);
  });
  return [...out.values()];
}

function ashEvents() {
  return ashCells().flatMap(([x, y]) => zygardeArea('roughTerrain', 'ceniza_honda', x, y, 1, 1, { kind: 'sand' }));
}

function caveEvent() {
  const { door } = DUNAS.cave;
  return {
    id: 'boquete_cueva', x: door.x, y: door.y, trigger: 'touch', through: true,
    script: async (ctx) => {
      await ctx.say(DUNAS_TEXT.cave);
      if (!(await ctx.confirm(DUNAS_TEXT.caveAsk))) { await ctx.move('player', ['down'], { through: false }); return; }
      ctx.se('Door enter');
      await ctx.warp('dunas_cueva', DUNAS_CUEVA.arrive.x, DUNAS_CUEVA.arrive.y, DUNAS_CUEVA.arrive.dir);
    },
  };
}

export function dunasEvents() {
  return [
    ...ashEvents(),
    ...b08CellEvents('dunas_ceniza'),
    caveEvent(),
    examine('cartel_dunas', 4, 18, DUNAS_TEXT.sign, { solid: true }),
    examine('zocalos_ruinas', 44, 43, DUNAS_TEXT.ruins, { solid: true }),
    {
      id: 'excursionista_adrian', type: 'trainer', trainer: 'b08_excursionista_dunas', name: 'Excursionista Adrián', sprite: 'anil:excursionista',
      x: 11, y: 27, dir: 2, sight: 4,
      intro: '¡Alto ahí! Nadie cruza las Dunas sin un buen combate. Es la tradición. Me la acabo de inventar.',
      after: 'La ceniza honda te traga hasta las rodillas. Hay que saber pisarla.',
    },
    {
      id: 'excursionista_nerea', type: 'trainer', trainer: 'b08_excursionista_f_dunas', name: 'Excursionista Nerea', sprite: 'anil:excursionista_f',
      x: 33, y: 20, dir: 4, sight: 4,
      intro: '¿Vienes del oeste? ¿Has cruzado la ceniza honda? ¡Qué valor! Veamos si tienes el mismo con tus Pokémon.',
      after: 'Dicen que el Cerro Plomo «pesa». Yo solo sé que cuesta muchísimo subirlo.',
    },
    {
      id: 'arqueologa_carmen', type: 'trainer', trainer: 'b08_arqueologa_dunas', name: 'Arqueóloga Carmen', sprite: 'anil:cientifica',
      x: 41, y: 38, dir: 2, sight: 3,
      intro: 'Cuidado con los zócalos. Llevan aquí más que Estrato. ¿Un combate mientras tanto?',
      after: 'Los Sigilyph revolotean siempre alrededor de estas ruinas. Como si las vigilaran.',
    },
    { id: 'objeto_dunas_1', type: 'item', x: 5, y: 41, item: 'SOFTSAND' },
    { id: 'objeto_dunas_2', type: 'item', x: 36, y: 29, item: 'HEATROCK' },
    { id: 'objeto_dunas_3', type: 'item', x: 47, y: 45, item: 'STARDUST', hidden: true },
    { id: 'objeto_dunas_4', type: 'item', x: 57, y: 29, item: 'REVIVE' },
    { id: 'objeto_dunas_5', type: 'item', x: 13, y: 46, item: 'SUPERREPEL', hidden: true },
    {
      id: 'excavador_dunas', x: 27, y: 44, name: SPEAKER.minero, sprite: 'anil:minero', dir: 8, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.restored)) { await ctx.say('Hoy la ceniza se está quieta. Llevaba semanas moviéndose sola, como si algo tirara de ella desde el Cerro.', { speaker: SPEAKER.minero }); return; }
        await ctx.say('Vengo a buscar galena suelta, pero la ceniza se mueve sola. Hacia el Cerro, siempre hacia el Cerro.', { speaker: SPEAKER.minero });
      },
    },
  ];
}
