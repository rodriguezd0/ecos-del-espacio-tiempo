// Carga todos los manejadores de habilidades (cada módulo los registra al importarse).
import './statusSpeed.js';
import './damage.js';
import './contact.js';
import './endOfRound.js';
import './switchIn.js';

export { AbilityEffects, implementedAbilities, PASSIVE_ABILITIES } from './registry.js';
