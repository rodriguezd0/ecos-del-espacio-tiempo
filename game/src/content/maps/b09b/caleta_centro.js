// Centro Pokémon de Caleta Sonda (docs/CAMPANA.md §1.3 «Centro pequeño»): plantilla de content/services sin mostrador
// de tienda (la tienda del pueblo es la de pesca). Un buzo descansa en el rincón.
import { pokemonCenterMap } from '../../services/pokecenter.js';
import { BUILDINGS } from './caleta_layout.js';
import { SPRITE, lines } from '../../events/b09b_common.js';

const door = BUILDINGS.centro.door;

export default pokemonCenterMap({
  id: 'caleta_centro',
  exit: { map: 'caleta_sonda', x: door.x, y: door.y + 1 },
  shop: false,
  events: [
    {
      id: 'buzo_centro', x: 14, y: 9, name: 'Buzo', sprite: SPRITE.diver, dir: 4, move: 'look',
      script: (ctx) => lines(ctx, 'Buzo', [
        'Después de una buena inmersión, nada como que te curen a los Pokémon.',
        'Aunque últimamente el agua del arrecife hace cosas raras. Hay días que bajas y no reconoces el fondo.',
      ]),
    },
  ],
});
