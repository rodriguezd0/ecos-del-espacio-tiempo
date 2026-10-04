// Piso 1 del Pilar del Alma: Saber y Uxie. ID histórico conservado para partidas anteriores.
import { santuarioFloorDef } from './santuario_def.js';
import { PATIO, SABER, SENTIR, QUERER } from './santuario_layout.js';

export default santuarioFloorDef(1);
export const SANTUARIO_ROOMS = Object.freeze({ PATIO, SABER, SENTIR, QUERER });
