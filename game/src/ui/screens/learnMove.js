// Aprender movimiento fuera de combate: elegir qué movimiento olvidar (pantalla de datos en modo olvido).
import { engine } from '../../core/engine.js';
import { openForget } from './summary.js';
import { message, confirm } from './common.js';
import { displayName } from '../../battle/core/pokemon.js';

/**
 * Devuelve el índice (0–3) del movimiento a olvidar o null si decide no aprender `moveId`.
 * Muestra los mensajes clásicos ("¿Debería olvidar un movimiento…?").
 */
export async function open(pokemon, moveId) {
  const db = engine.data;
  const name = displayName(db, pokemon);
  const moveName = db.moves[moveId]?.name || moveId;
  for (;;) {
    await message(`${name} quiere aprender ${moveName}, pero ya conoce cuatro movimientos.`);
    if (await confirm(`¿Quieres que olvide un movimiento para aprender ${moveName}?`)) {
      const idx = await openForget(pokemon, moveId);
      if (idx !== null && idx !== undefined) {
        const old = db.moves[pokemon.moves[idx].id]?.name || pokemon.moves[idx].id;
        await message(`1, 2 y... ¡Tachán!\\n${name} ha olvidado ${old}. Y...`);
        await message(`¡${name} ha aprendido ${moveName}!`);
        return idx;
      }
    }
    if (await confirm(`¿Dejar de intentar que aprenda ${moveName}?`)) {
      await message(`${name} no ha aprendido ${moveName}.`);
      return null;
    }
  }
}
