// Fondo del Mar del Sur (docs/CAMPANA.md §1.4 y §2.3: C077–C081, etapa G; POKEDEX §7.7 Tatsugirita «Fondo del Mar del
// Sur (sector este)»). Células, respiraderos, objetos, dos buceadores y las salidas a la superficie: cada haz de luz
// sube a la misma casilla de `mar_del_sur` en cuanto B13 registre ese mapa (hasta entonces el haz solo alumbra y se
// sale por el Arrecife del Eco, al oeste). Módulo puro salvo los guiones.
import { FONDO } from '../maps/b14/layout.js';
import { MAPS } from '../maps/index.js';
import { OBJ } from './b14_common.js';
import { ventEvents, itemEvents } from './b14_antea_common.js';
import { coralEvents } from '../maps/b14/paint.js';
import { cellEvent } from './b01_cells.js';

/** ¿Existe ya la superficie del mar del sur (B13)? */
export const surfaceReady = () => Object.hasOwn(MAPS, 'mar_del_sur');

export const FONDO_TEXT = Object.freeze({
  shaft: 'Un haz de luz baja desde la superficie. Arriba se ve el cielo, muy lejos.',
  shaftClosed: 'Un haz de luz baja desde la superficie. Arriba, las olas rompen desordenadas: mejor volver por el arrecife.',
  abyss: 'El fondo cae de golpe hacia una oscuridad sin luz. No se ve el final de la Fosa Abisal.',
});

function shaftEvents() {
  return FONDO.surface.map((p, i) => (surfaceReady()
    ? { id: `superficie_${i}`, type: 'diveSpot', surface: true, x: p.x, y: p.y, to: 'mar_del_sur', tx: p.x, ty: p.y, dir: 2 }
    : {
      id: `haz_${i}`, x: p.x, y: p.y, sprite: OBJ.shaft, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 3,
      through: true, trigger: 'action', script: async (ctx) => { await ctx.say(FONDO_TEXT.shaftClosed); },
    }));
}

export function fondoEvents() {
  const c = FONDO.cells;
  return [
    ...Object.entries(c).map(([key, p]) => cellEvent({ id: `cell_${key}`, x: p.x, y: p.y })),
    ...ventEvents('respiradero_fondo', FONDO.vents),
    ...shaftEvents(),
    ...itemEvents([
      { id: 'objeto_fondo_tatsugirita', x: 152, y: 42, item: 'TATSUGIRINITE', hidden: true },
      { id: 'objeto_fondo_diente', x: 17, y: 44, item: 'DEEPSEATOOTH' },
      { id: 'objeto_fondo_escama', x: 93, y: 20, item: 'DEEPSEASCALE' },
      { id: 'objeto_fondo_estrella', x: 67, y: 44, item: 'STARPIECE', hidden: true },
      { id: 'objeto_fondo_perla', x: 44, y: 14, item: 'BIGPEARL', hidden: true },
      { id: 'objeto_fondo_buceo', x: 123, y: 12, item: 'DIVEBALL', count: 3 },
      { id: 'objeto_fondo_elixir', x: 160, y: 12, item: 'ELIXIR' },
    ]),
    ...coralEvents('coral_fondo', [
      [34, 31, 2], [37, 29, 6], [59, 21, 4], [72, 15, 8], [85, 33, 2], [101, 25, 6], [118, 36, 4], [137, 22, 8],
      [149, 27, 2], [162, 16, 4], [168, 30, 6], [48, 9, 8], [23, 40, 4], [110, 44, 2], [128, 7, 6],
    ]),
    {
      id: 'buceadora_anselma', type: 'trainer', trainer: 'b14_buceadora_anselma', name: 'Buceadora Anselma', sprite: 'anil:buceadora',
      x: 64, y: 22, dir: 6, sight: 4,
      intro: 'Nadie cruza mis praderas de algas sin un combate. ¡Es la costumbre!',
      after: 'Al este las algas se acaban y empiezan las rocas negras de las islas. Y luego, la Fosa.',
    },
    {
      id: 'buceador_genaro', type: 'trainer', trainer: 'b14_buceador_genaro', name: 'Buceador Genaro', sprite: 'anil:buceador',
      x: 156, y: 28, dir: 4, sight: 4,
      intro: 'Buceas cerca de la Fosa, ¿eh? Veamos si aguantas la presión.',
      after: 'Dicen que en el fondo de la Fosa duerme algo enorme. Yo no pienso comprobarlo.',
    },
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `fosa_abisal_${i}`, x: FONDO.abyssX - 1, y: 25 + i, solid: false, through: true, trigger: 'action',
      script: async (ctx) => { await ctx.say(FONDO_TEXT.abyss); },
    })),
  ];
}
