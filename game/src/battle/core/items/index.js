// Carga los manejadores de objetos equipados (cada módulo los registra al importarse).
import './heldItems.js';
import './heldItems2.js';

export { ItemEffects, implementedHeldItems } from './registry.js';
export { BagItems, implementedBagItems } from './bagItems.js';
export { IMPLEMENTED_BALLS } from './pokeBalls.js';
