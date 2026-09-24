// Faro de Ciudad Nexo (docs/CAMPANA.md §1.3 «faro»), al final del espigón. Desde el catalejo se ve la plataforma del
// Consorcio mar adentro (Estación Talasa, B13). Tileset 4 (Interior1).
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { BUILDINGS, INTERIOR_ENTRIES } from './nexo_layout.js';
import { F, SPRITE, lines, zygardeSays, examine } from '../../events/b09b_common.js';

const E = INTERIOR_ENTRIES.nexo_faro;
const OUT = BUILDINGS.faro.door;

async function telescope(ctx) {
  await ctx.say('Un catalejo de latón apunta mar adentro, al sureste.');
  if ((await ctx.choice(['Mirar', 'Dejarlo'], { cancel: 1 })) !== 0) return;
  ctx.se('PC access', { volume: 50 });
  await lines(ctx, null, [
    'En el círculo del catalejo aparece una plataforma sobre pilotes: grúas, una torre de perforación y módulos blancos.',
    'Parpadean luces magenta. En un costado, pintado en grande: «Consorcio Meridiano».',
  ]);
  ctx.setFlag(F.talasaSeen);
  await zygardeSays(ctx, 'Allí… algo me llama. Muy lejos. Todavía no.');
}

export default {
  id: 'nexo_faro',
  name: 'Ciudad Nexo',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'CiudadCarmin',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_blanca');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('estanteria_lab', 1, 2);
    b.stamp('maquina_lab', 9, 2);
    b.stamp('ventanal_lab', 5, 1);
    b.stamp('ventanal_lab', 7, 1);
    b.stamp('mesa_lab_verde', 4, 5);
    b.stamp('planta', 11, 7);
  },

  warps: exitWarps(E.x, E.y, { map: 'ciudad_nexo', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(E.x, E.y + 1),
    {
      id: 'farera_nexo', x: 3, y: 5, name: 'Farera', sprite: SPRITE.youthF, dir: 6, move: 'look',
      script: (ctx) => lines(ctx, 'Farera', [
        'Llevo el faro de Nexo desde que mi padre se retiró. Es más aburrido que el de Caleta: aquí los barcos ya conocen el camino.',
        'Lo que no conocían es esa plataforma de ahí fuera. Apareció una mañana, como si la hubiera traído la marea.',
      ]),
    },
    { id: 'catalejo', x: 6, y: 3, solid: true, noOver: true, trigger: 'action', script: telescope },
    examine('diario_faro', 4, 6, 'El diario del faro: «Mar de fondo sin viento. Marea a destiempo. Tercera noche seguida».', { solid: true }),
  ],
};
