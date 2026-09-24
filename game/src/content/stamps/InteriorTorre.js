// Stamps y brushes del tileset 11 (InteriorTorre): salas solemnes azules, salas de la Liga y kit de Pilar.
// Definición común en interior_solemne.js. Tras editar: node tools/stamps_bake.mjs InteriorTorre
import { solemnLibrary } from './interior_solemne.js';

export default solemnLibrary({ tileset: 11, image: 'InteriorTorre', floorDesc: 'suelo de baldosa azul', variant: 'torre' });
