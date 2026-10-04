import { pokemonCenterMap } from '../../services/pokecenter.js';
import { BASTION as B } from './bastion_layout.js';
export default pokemonCenterMap({ id: 'bastion_centro', exit: { map: 'bastion_axis', ...B.centerOutside } });
