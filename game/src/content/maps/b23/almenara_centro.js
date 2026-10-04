import { pokemonCenterMap } from '../../services/pokecenter.js';
import { PORT } from './layout.js';
export default pokemonCenterMap({ id: 'almenara_centro', exit: { map: 'puerto_almenara', ...PORT.centerOutside } });
