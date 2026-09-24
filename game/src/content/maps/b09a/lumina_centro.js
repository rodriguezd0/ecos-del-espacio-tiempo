// Centro Pokémon de Ciudad Lúmina (plantilla de services/pokecenter.js). Aquí espera Iván, el guardabosques de la
// Reserva del Delta, que abre la pista T07 (TABLILLAS §4.4: «el guardabosques Iván, en el Centro de Lúmina»).
import { pokemonCenterMap } from '../../services/pokecenter.js';
import { OUTSIDE } from './lumina_layout.js';
import { centerEvents } from '../../events/b09a_shops.js';

const OUT = OUTSIDE.centro;

export default pokemonCenterMap({
  id: 'lumina_centro',
  exit: { map: 'ciudad_lumina', x: OUT.x, y: OUT.y },
  events: centerEvents(),
});
