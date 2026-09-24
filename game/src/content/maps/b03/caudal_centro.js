// Centro Pokémon de Ciudad Caudal (CAMPANA §1.3): plantilla de content/services (curación, PC, tienda y rincón
// de descanso). Salida delante de la puerta del Centro en la plaza (caudal_layout.js).
import { pokemonCenterMap } from '../../services/pokecenter.js';
import { BUILDINGS } from './caudal_layout.js';
import { say } from '../../events/b03_common.js';

const door = BUILDINGS.centro.door;

export default pokemonCenterMap({
  id: 'caudal_centro',
  exit: { map: 'ciudad_caudal', x: door.x, y: door.y + 1, dir: 2 },
  shop: { list: 'general', greeting: '¡Bienvenido! Aquí tenemos lo básico para el camino.' },
  events: [
    {
      id: 'entrenador_mesa', x: 4, y: 11, sprite: 'anil:guay', dir: 8, move: 'look', trigger: 'action',
      script: async (ctx) => {
        await say(ctx, 'Entrenador', 'Vine a Caudal a por el Pilar del que hablan en la Garganta, pero con el río así nadie se atreve a subir.');
        await say(ctx, 'Entrenador', 'Dicen que río arriba hay cuestas de grava que no hay quien suba a pie. Hace falta algo que corra de verdad.');
      },
    },
    {
      id: 'abuela_centro', x: 15, y: 7, sprite: 'anil:anciana1', dir: 4, move: 'look', trigger: 'action',
      script: async (ctx) => {
        await say(ctx, 'Abuela', 'Mi nieto vive en el barrio bajo. Cada mañana le entra el agua en casa y cada noche el canal se queda en los huesos.');
        await say(ctx, 'Abuela', 'El Maestre de Esclusas no quiere que nadie le ayude. Orgullo de los Alcántara. Toda la vida igual.');
      },
    },
  ],
});
