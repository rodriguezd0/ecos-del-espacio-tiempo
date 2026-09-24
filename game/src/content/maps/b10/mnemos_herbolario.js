// Herbolario de Tomé (B10; CAMPANA §1.3 «herbolario»): la tienda de Mnemos (plantilla shopMap de content/services).
// Vende las hierbas de la aldea además del surtido general. Tras el mostrador, el aprendiz Elio (su saludo cambia
// cuando el maestro recupera su nombre); Tomé recibe una de las notas de nombres de Olvido (b10_notes.js).
import { shopMap, openMart } from '../../services/shop.js';
import { BUILDINGS } from './mnemos_layout.js';
import { SPEAKER, SPRITE } from '../../events/b10_common.js';
import { tomeTalk, elioGreeting } from '../../events/b10_notes.js';

const door = BUILDINGS.herbolario.door;
const EXTRA = Object.freeze(['HEALPOWDER', 'ENERGYPOWDER', 'ENERGYROOT', 'REVIVALHERB', 'HONEY']);

const base = shopMap({
  id: 'mnemos_herbolario',
  exit: { map: 'aldea_mnemos', x: door.x, y: door.y + 1 },
  extra: [...EXTRA],
  sprite: SPRITE.elio,
  events: [
    { id: 'tome', x: 6, y: 5, name: SPEAKER.tome, sprite: SPRITE.tome, dir: 2, move: 'look', script: tomeTalk },
  ],
});

/** Elio atiende con el mismo surtido que la plantilla, pero con un saludo que depende de la historia. */
async function elioShop(ctx) {
  await openMart(ctx, { extra: [...EXTRA], greeting: elioGreeting(ctx.state) });
}

export default {
  ...base,
  events: base.events.map((e) => (e.id === 'dependiente' ? { ...e, name: SPEAKER.elio, script: elioShop } : e)),
};
