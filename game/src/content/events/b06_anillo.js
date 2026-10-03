// Segundo piso del P3: viento y campanas. El campamento y los entrenadores están en la base;
// Abril y la restauración esperan en la sala del núcleo, después de resolver el ritmo.
import { CAMPANAS, REMOLINO, marksInMap } from './b06_wind_rooms.js';
import { gustEvents } from './b06_wind.js';
import { b06CellEvents } from './b06_cells.js';
import { bellEvents } from './b06_nucleo.js';
import { F } from './b06_common.js';
import { ANILLO, GALERIAS, P3_VERTICAL } from '../maps/b06/layout.js';

const S = ANILLO.sala;
const galeKeys = new Set(CAMPANAS.gale.map(([x, y]) => `${x},${y}`));
const isGale = (g) => galeKeys.has(`${g.x},${g.y}`);

export const ANILLO_TEXT = Object.freeze({
  monoliths: Object.freeze({
    N: 'Un monolito del anillo. Arriba tiene tallado un solo hexágono. Debajo, un surco largo, muy largo, como un golpe que no se suelta. La cara de la piedra mira hacia la campana del norte.',
    E: 'Un monolito del anillo. Tiene tallados dos hexágonos. Debajo, un surco corto. La cara de la piedra mira hacia la campana del este.',
    W: 'Un monolito del anillo. Tiene tallados tres hexágonos. Debajo, un surco corto. La cara de la piedra mira hacia la campana del oeste.',
  }),
  plaque: 'Una estela cubierta de glifos. La Pokédex solo reconoce una palabra: «viento».',
  sign: 'GALERÍAS DEL SOPLO\nPeligro: corrientes de aire. — La guarda del Anillo',
  tentNote: 'Hay una nota sujeta con una piedra: «Me he ido a Brontia. Si me aburro, vuelvo. —A.»',
  mouthGale: 'De la escalera sale un viento que te empuja hacia atrás. No hay manera de subir.',
  losa: 'Una losa con un hueco que da a las galerías. Se oye el viento de abajo.',
  losaAsk: '¿Volver a las galerías?',
});

export async function salaIntro(ctx) {
  if (!ctx.flag(F.salaSeen)) ctx.setFlag(F.salaSeen);
}

export function anilloEvents() {
  const windy = (s) => !s.flag(F.restored);
  const [[lx, ly]] = marksInMap(CAMPANAS, 'E', S.ox, S.oy);
  const [[dx, dy]] = marksInMap(REMOLINO, 'X', GALERIAS.remolino.ox, GALERIAS.remolino.oy);
  const [ux, uy] = CAMPANAS.pedestal.at;
  return [
    ...gustEvents(CAMPANAS, S.ox, S.oy, { prefix: 'sala', active: windy, only: (g) => !isGale(g) }),
    ...gustEvents(CAMPANAS, S.ox, S.oy, { prefix: 'vendaval', roomKey: 'campanas_sur', active: (s) => windy(s) && !s.flag(F.bells), only: isGale }),
    ...bellEvents(), ...b06CellEvents('anillo_vientos'),
    {
      id: 'subida_nucleo', x: S.ox + ux, y: S.oy + uy, trigger: 'action', solid: true,
      script: async (ctx) => {
        if (!ctx.flag(F.bells) && !ctx.flag(F.restored)) {
          await ctx.say('La escalera termina ante una losa. En ella, tres campanas grabadas.');
          return;
        }
        ctx.se('Door enter');
        await ctx.warp('anillo_vientos_nucleo', P3_VERTICAL.entry.x, P3_VERTICAL.entry.y, 8);
      },
    },
    {
      id: 'losa_bajada', x: lx, y: ly, trigger: 'action', noOver: true, through: true,
      script: async (ctx) => {
        await ctx.say(ANILLO_TEXT.losa);
        if (!(await ctx.confirm(ANILLO_TEXT.losaAsk))) return;
        ctx.se('Door enter');
        await ctx.warp('galerias_soplo', dx, dy + 1, 2);
      },
    },
  ];
}
