// Cámara de los Contrapesos — Pilar de la Masa, P4 (docs/CAMPANA.md B08 «Mazmorra»; §1.5: Cueva1 + kit de Pilar,
// tinte gris plomo, 40×35). Una sima negra cruzada por plataformas: la sala de entrada (bloques de basalto y palanca
// de retorno), el puente de suelo quebradizo, la terraza de la Gran Balanza con sus tres platillos, el ala este (arena
// profunda, placa y foso con plataforma), la escalinata a la galería inferior (piedras sueltas, C039) y la cámara del
// núcleo al noroeste, tras una losa que solo baja cuando la Balanza cede. Trazado y reglas:
// content/events/b08_balance_logic.js · mecanismo: b08_camara.js · Fermín y núcleo: b08_camara_scenes.js.
import { CAMARA_W, CAMARA_H, SPOTS, SOLID_EVENTS } from '../../events/b08_balance_logic.js';
import { mechanismEvents } from '../../events/b08_camara.js';
import { camaraOnEnter } from '../../events/b08_camara_scenes.js';
import { F } from '../../events/b08_common.js';
import { b08CellEvents } from '../../events/b08_cells.js';
import { CAMARA_CONTRAPESOS } from '../../encounters/b08.js';
import { pilarTone } from '../../stamps/pilar.js';
import { buildCamara } from './camara_build.js';
import { P4_VERTICAL } from './layout.js';

const [itemSpot] = SOLID_EVENTS;

export default {
  id: 'camara_contrapesos',
  name: 'Pilar de la Masa',
  tileset: 2,
  width: CAMARA_W,
  height: CAMARA_H,
  cave: true,
  pillar: { id: 'P4', floor: 2 },
  bgm: 'Cueva',
  battleback: 'Cueva',
  tone: pilarTone('P4'),
  start: { x: SPOTS.entry.x, y: SPOTS.entry.y, dir: SPOTS.entry.dir },
  encounters: CAMARA_CONTRAPESOS,

  build: buildCamara,

  // Salida: la claridad de la pared sur (se empuja hacia abajo) → antesala del Cerro Plomo.
  warps: [{ x: SPOTS.exitWarp.x, y: SPOTS.exitWarp.y, to: 'camara_contrapesos_base', tx: P4_VERTICAL.baseReturn.x, ty: P4_VERTICAL.baseReturn.y, dir: 2 }],

  onEnter: camaraOnEnter,

  events: [
    ...mechanismEvents(),
    {
      id: 'subida_nucleo', x: SPOTS.pedestal.x, y: SPOTS.pedestal.y, solid: true, trigger: 'action',
      script: async (ctx) => {
        if (!ctx.flag(F.balance) && !ctx.flag(F.restored)) { await ctx.say('Una losa pesada tapa la escalera.'); return; }
        ctx.se('Door enter');
        await ctx.warp('camara_contrapesos_nucleo', P4_VERTICAL.entry.x, P4_VERTICAL.entry.y, 8);
      },
    },
    ...b08CellEvents('camara_contrapesos'),
    { id: itemSpot.id, type: 'item', x: itemSpot.x, y: itemSpot.y, item: 'FLOATSTONE' },
  ],
};
