// GENERADO por tools/gen_registries.mjs — no editar a mano (ejecuta: node tools/gen_registries.mjs).
// Registro de entrenadores de Axis. Cada archivo de zona exporta por defecto { id: definición }.
// Formato de definición: ver docs/ARCHITECTURE.md (Entrenadores) y content/trainers/README.md.
import t_b01_ruta1 from './b01_ruta1.js';
import t_b01_town from './b01_town.js';
import t_b02 from './b02.js';
import t_b03 from './b03.js';
import t_b04 from './b04.js';
import t_b05 from './b05.js';
import t_b06 from './b06.js';
import t_b07 from './b07.js';
import t_b08 from './b08.js';
import t_b09a from './b09a.js';
import t_b09b from './b09b.js';
import t_b10 from './b10.js';
import t_b11 from './b11.js';
import t_b13 from './b13.js';
import t_b14 from './b14.js';
import t_b15 from './b15.js';

export const TRAINERS = {
  ...t_b01_ruta1,
  ...t_b01_town,
  ...t_b02,
  ...t_b03,
  ...t_b04,
  ...t_b05,
  ...t_b06,
  ...t_b07,
  ...t_b08,
  ...t_b09a,
  ...t_b09b,
  ...t_b10,
  ...t_b11,
  ...t_b13,
  ...t_b14,
  ...t_b15,
};

/** Devuelve la definición resuelta (party evaluada con el estado actual) o lanza un error claro. */
export function getTrainer(id, state) {
  const def = TRAINERS[id];
  if (!def) throw new Error(`Entrenador desconocido: ${id}`);
  const party = typeof def.party === 'function' ? def.party(state) : def.party;
  return { id, ...def, party };
}
