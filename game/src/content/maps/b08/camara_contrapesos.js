// Cámara de los Contrapesos — Pilar de la Masa, P4 (docs/CAMPANA.md B08 «Mazmorra»; §1.5: Cueva1 + kit de Pilar,
// tinte gris plomo, 40×35). Una sima negra cruzada por plataformas: la sala de entrada (bloques de basalto y palanca
// de retorno), el puente de suelo quebradizo, la terraza de la Gran Balanza con sus tres platillos, el ala este (arena
// profunda, placa y foso con plataforma), la escalinata a la galería inferior (piedras sueltas, C039) y la cámara del
// núcleo al noroeste, tras una losa que solo baja cuando la Balanza cede. Trazado y reglas:
// content/events/b08_balance_logic.js · mecanismo: b08_camara.js · Fermín y núcleo: b08_camara_scenes.js.
import { CAMARA_W, CAMARA_H, SPOTS, SOLID_EVENTS } from '../../events/b08_balance_logic.js';
import { mechanismEvents } from '../../events/b08_camara.js';
import { ferminEvents, pedestalEvent, camaraOnEnter } from '../../events/b08_camara_scenes.js';
import { b08CellEvents } from '../../events/b08_cells.js';
import { CAMARA_CONTRAPESOS } from '../../encounters/b08.js';
import { pilarTone } from '../../stamps/pilar.js';
import { buildCamara } from './camara_build.js';
import { CERRO } from './layout.js';

const [itemSpot] = SOLID_EVENTS;

export default {
  id: 'camara_contrapesos',
  name: 'Pilar de la Masa',
  tileset: 2,
  width: CAMARA_W,
  height: CAMARA_H,
  cave: true,
  bgm: 'Cueva',
  battleback: 'Cueva',
  tone: pilarTone('P4'),
  start: { x: SPOTS.entry.x, y: SPOTS.entry.y, dir: SPOTS.entry.dir },
  encounters: CAMARA_CONTRAPESOS,

  build: buildCamara,

  // Salida: la claridad de la pared sur (se empuja hacia abajo) → antesala del Cerro Plomo.
  warps: [{ x: SPOTS.exitWarp.x, y: SPOTS.exitWarp.y, to: 'cerro_plomo', tx: CERRO.arrive.x, ty: CERRO.arrive.y, dir: CERRO.arrive.dir }],

  onEnter: camaraOnEnter,

  events: [
    ...mechanismEvents(),
    ...ferminEvents(),
    pedestalEvent(),
    ...b08CellEvents('camara_contrapesos'),
    { id: itemSpot.id, type: 'item', x: itemSpot.x, y: itemSpot.y, item: 'FLOATSTONE' },
  ],
};
