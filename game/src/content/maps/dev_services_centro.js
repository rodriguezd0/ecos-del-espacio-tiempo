// Centro Pokémon de PRUEBA (sin canon) de dev_services, hecho con la plantilla de content/services.
import { pokemonCenterMap } from '../services/pokecenter.js';
import { DEV_SERVICES_DOORS } from './dev_services.js';

const door = DEV_SERVICES_DOORS.centro;

export default pokemonCenterMap({
  id: 'dev_services_centro',
  name: 'Pruebas de servicios',
  exit: { map: 'dev_services', x: door.x, y: door.y + 1, dir: 2 },
});
