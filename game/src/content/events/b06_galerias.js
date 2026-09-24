// Eventos de las Galerías del Soplo (docs/CAMPANA.md B06, mazmorra secciones a y b): ráfagas de las Flechas y
// del Remolino, las dos veletas, C033, objetos, la bajada desde el Anillo y la subida a la Sala de las Campanas.
// Tras restaurar el Pilar (p3_restored) el viento recupera su rumbo y las ráfagas desaparecen.
import { FLECHAS, REMOLINO, CAMPANAS, marksInMap } from './b06_wind_rooms.js';
import { gustEvents, vaneEvents } from './b06_wind.js';
import { b06CellEvents } from './b06_cells.js';
import { F } from './b06_common.js';
import { salaIntro } from './b06_anillo.js';
import { GALERIAS, ANILLO } from '../maps/b06/layout.js';

const windy = (s) => !s.flag(F.restored);

/** Llegada a la Sala de las Campanas (casilla S de la sala ASCII en el mapa del Anillo). */
export function salaArrival() {
  const [[x, y]] = marksInMap(CAMPANAS, 'S', ANILLO.sala.ox, ANILLO.sala.oy);
  return { x, y };
}

export function galeriasEvents() {
  const R = GALERIAS.remolino;
  const Fl = GALERIAS.flechas;
  const [[xx, xy]] = marksInMap(REMOLINO, 'X', R.ox, R.oy);
  const up = salaArrival();
  return [
    ...gustEvents(FLECHAS, Fl.ox, Fl.oy, { prefix: 'flecha', active: windy }),
    ...gustEvents(REMOLINO, R.ox, R.oy, { prefix: 'remolino', active: windy }),
    ...vaneEvents(REMOLINO, R.ox, R.oy, { names: { a: 'junto al remolino', b: 'bajo el pasillo alto' } }),
    ...b06CellEvents('galerias_soplo'),
    // Objetos: la isla del noreste de las Flechas (se llega por otra cadena) y un rincón del Remolino.
    { id: 'objeto_flechas', type: 'item', x: Fl.ox + 19, y: Fl.oy + 5, item: 'SHARPBEAK' },
    { id: 'objeto_remolino', type: 'item', x: R.ox + 19, y: R.oy + 11, item: 'SUPERPOTION', hidden: true },
    { id: 'objeto_flechas_2', type: 'item', x: Fl.ox + 1, y: Fl.oy + 7, item: 'ETHER', hidden: true },
    // Subida a la Sala de las Campanas (boca del techo sobre el rellano del Remolino).
    {
      id: 'subida_sala', x: xx, y: xy, trigger: 'touch', through: true,
      script: async (ctx) => {
        ctx.se('Door exit');
        await ctx.warp('anillo_vientos', up.x, up.y, 2);
        await salaIntro(ctx);
      },
    },
  ];
}
