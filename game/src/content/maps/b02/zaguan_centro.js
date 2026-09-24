// Centro Pokémon de Villa Zaguán — el primer Centro del viaje (docs/CAMPANA.md B02, paso 1: tutorial de curación y
// PC). Plantilla de content/services (pokemonCenterMap): enfermera, máquina, PC, rincón de descanso y mostrador de
// tienda con el stock por progreso. La primera vez, la enfermera explica el Centro.
import { pokemonCenterMap, CENTER_LAYOUT } from '../../services/pokecenter.js';
import { TOWN_DOORS } from './villa_zaguan_layout.js';
import { F, SPEAKER } from '../../events/b02_common.js';
import { liaCentroEvents } from '../../events/b03_lia.js'; // B03: Lía entrega el Repartir Exp

const say = (ctx, text) => ctx.say(text, { speaker: SPEAKER.nurse });

/** Tutorial de la primera visita (curación, PC y tienda). */
async function tutorial(ctx) {
  const L = CENTER_LAYOUT;
  ctx.face('player', 'up');
  await ctx.wait(16);
  await say(ctx, `¡Hola! ¿Es tu primera vez en un Centro Pokémon? ${ctx.state.player?.gender === 'F' ? 'Bienvenida' : 'Bienvenido'} a Zaguán.`);
  await say(ctx, 'Si hablas conmigo en el mostrador, curaré a tus Pokémon por completo. Gratis, y tantas veces como haga falta.');
  await say(ctx, 'Además, si algún día tus Pokémon no pueden seguir combatiendo, volverás al último Centro donde te hayan curado.');
  await say(ctx, 'El PC de la pared guarda en cajas los Pokémon que no lleves contigo. Y en el mostrador de la derecha venden lo básico para el viaje.');
  await say(ctx, 'Y en la mesita del rincón se puede descansar un rato. ¡Que te vaya bien!');
  ctx.face('enfermera', L.nurse.dir);
  ctx.setFlag(F.centroTutorial);
}

export default pokemonCenterMap({
  id: 'zaguan_centro',
  exit: { map: 'villa_zaguan', x: TOWN_DOORS.zaguan_centro.x, y: TOWN_DOORS.zaguan_centro.y + 1, dir: 2 },
  shop: { greeting: '¡Hola! ¿Qué necesitas para el camino?' },
  events: [
    { id: 'tutorial_centro', x: 0, y: 0, trigger: 'auto', when: (s) => !s.flag(F.centroTutorial), script: tutorial },
    ...liaCentroEvents(),
  ],
});
