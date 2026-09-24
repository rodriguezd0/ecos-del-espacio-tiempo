// Campanario de Sixto (T03): planta baja con la escalera derrumbada (Embestida) y el campanil con la campana grande,
// el cable cortado del pararrayos y, tras el rayo, la Tablilla y la horda de Elekid. Tileset 4 (Interior1).
// Eventos en content/events/b05_t03.js (BELFRY).
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { BELFRY, belfryEvents } from '../../events/b05_t03.js';
import { TOWER } from './villa_brontia_layout.js';
import { blockers, examine } from '../../events/b05_common.js';

const B = BELFRY;
/** Sacos y cajas del Molino del Diezmo (b05_sacos.png: col 0 montón, 1 saco, 2 caja). */
const SACKS = Object.freeze({ sprite: 'asset:objects/b05_sacos.png', dir: 2, directionFix: true, walkAnime: false, shadow: false, solid: true, trigger: 'action' });

export default {
  id: 'brontia_campanario',
  name: 'Villa Brontia',
  tileset: 4,
  width: B.width,
  height: 12,
  outdoor: false,
  bgm: 'PuebloMarengo',
  battleback: 'indoor',
  showLocation: false,
  start: { x: B.door.x, y: B.door.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    const g = B.groundRoom;
    const r = B.bellRoom;
    b.rect(null, g.x, g.y, g.w, g.h, 'habitacion_casa');
    b.rect(null, r.x, r.y, r.w, r.h, 'habitacion_blanca');
    b.stamp('salida_casa', B.door.x - 2, B.door.y);
    b.stamp(B.stairsUp.stamp, B.stairsUp.x, B.stairsUp.y);
    b.stamp(B.stairsDown.stamp, B.stairsDown.x, B.stairsDown.y);
    // Planta baja: cuerdas y trastos del campanero
    b.stamp('estanteria_naranja', 1, 3);
    b.stamp('comoda', 2, 3);
    b.stamp('reloj_pared', 4, 2);
    b.stamp('ventana', 5, 2);
    b.stamp('planta', 1, 9);
    b.rect(null, 3, 7, 4, 2, 'alfombra_granate');
    // Campanil: vanos
    b.stamp('ventana', 13, 2);
    b.stamp('ventana', 15, 2);
  },

  warps: [
    ...exitWarps(B.door.x, B.door.y, { map: 'villa_brontia', x: TOWER.x, y: TOWER.y + 1, dir: 2 }),
    { x: B.stairsUp.warp.x, y: B.stairsUp.warp.y, to: 'brontia_campanario', tx: B.stairsDown.arrive.x, ty: B.stairsDown.arrive.y, dir: B.stairsDown.arrive.dir },
    { x: B.stairsDown.warp.x, y: B.stairsDown.warp.y, to: 'brontia_campanario', tx: B.stairsUp.arrive.x, ty: B.stairsUp.arrive.y, dir: B.stairsUp.arrive.dir },
  ],

  events: [
    ...exitArrowEvents(B.door.x, B.door.y + 1),
    ...belfryEvents(),
    ...blockers('campana_lado', [[B.bell.x - 1, B.bell.y], [B.bell.x + 1, B.bell.y]]),
    // Campanil: trastos del campanero junto a los muros (no estorban el paso a la campana ni a la Tablilla).
    { ...SACKS, id: 'caja_campanil', x: 12, y: 4, pattern: 2, script: async (ctx) => { await ctx.say('Una caja con badajos viejos y cuerdas de repuesto para la campana.'); } },
    { ...SACKS, id: 'saco_campanil', x: 18, y: 6, pattern: 1, script: async (ctx) => { await ctx.say('Un saco de arena. Sirve de contrapeso cuando hay que bajar la campana para arreglarla.'); } },
    examine('estanteria', 1, 5, 'Rollos de cuerda, un farol y una caja de velas. El material del campanero.', { solid: true }),
    examine('comoda', 2, 5, 'En un cajón hay un cuaderno con las horas de cada toque, escrito con dos letras distintas.', { solid: true }),
  ],
};
