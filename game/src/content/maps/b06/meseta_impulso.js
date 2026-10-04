import { withB22bEvents } from '../../events/b22b_maps.js';
// Meseta del Impulso (docs/CAMPANA.md §1.4: 50×50, tileset 1 + 4, O Ruta 5, Embestida; BGM viento; fondo
// Acantilado). Altiplano con el Parque Eólico ocupado por el Consorcio/Genesis y la peña del Anillo de los Vientos.
// Construcción en ./meseta_impulso_build.js, coordenadas en ./layout.js, eventos en content/events/b06_meseta.js.
// Warps: nave del Colector → parque_eolico; puerta tallada de la peña → anillo_vientos.
import { buildMeseta } from './meseta_impulso_build.js';
import { mesetaEvents } from '../../events/b06_meseta.js';
import { F } from '../../events/b06_common.js';
import { MESETA_IMPULSO } from '../../encounters/b06.js';
import { MESETA, P3_VERTICAL } from './layout.js';

const M = MESETA;

export default {
  id: 'meseta_impulso',
  name: 'Meseta del Impulso',
  tileset: 1,
  width: M.width,
  height: M.height,
  outdoor: true,
  bgm: 'viento',
  battleback: 'Acantilado',
  start: { x: M.start.x, y: M.start.y, dir: M.start.dir },
  encounters: MESETA_IMPULSO,

  build: buildMeseta,

  connections: [{ dir: 'west', to: 'ruta_5', offset: 9 }],

  warps: [
    { x: M.ringGate.x, y: M.ringGate.y, to: 'anillo_vientos_base', tx: P3_VERTICAL.entry.x, ty: P3_VERTICAL.entry.y, dir: 8 },
  ],

  onEnter: async (ctx) => {
    // Gael se queda mirando las pantallas del Parque hasta que el jugador sale (CAMPANA §6.2).
    if (ctx.flag(F.gaelScreens) && !ctx.flag(F.gaelLeft)) ctx.setFlag(F.gaelLeft);
  },

  events: withB22bEvents('meseta_impulso', mesetaEvents()),
};
