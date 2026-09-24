// Stamps y brushes del tileset 8 (InteriorLiga): salas solemnes rojas, salas de la Liga y kit de Pilar.
// Definición común en interior_solemne.js. Tras editar: node tools/stamps_bake.mjs InteriorLiga
import { solemnLibrary } from './interior_solemne.js';

export default solemnLibrary({ tileset: 8, image: 'InteriorLiga', floorDesc: 'suelo de baldosa roja', variant: 'liga' });
