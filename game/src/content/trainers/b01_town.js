// Entrenadores del bloque 1 en Villa Alba (Gael). Ver docs/bloques/B01_apertura.md §4.7 y §6; D05.
import { gaelStarterFor, STARTER_LEVEL, V } from '../events/b01_town_common.js';

/** Inicial de Gael: la variable gael_starter o, si falta, el de ventaja sobre el del jugador. */
export function gaelStarterSpecies(state) {
  const saved = state?.var?.(V.gaelStarter, null);
  if (saved) return saved;
  const mine = state?.var?.(V.starter, null);
  return mine ? gaelStarterFor(mine) : 'LITTEN';
}

export default {
  gael_1: {
    name: 'Gael',
    class: 'Rival',
    sprite: 'gael_front',
    overworld: 'gael',
    party: (state) => [{ species: gaelStarterSpecies(state), level: STARTER_LEVEL }],
    items: [],
    ai: 16, // IA básica (guion §4.7)
    money: 0,
    bgm: 'battle_rival',
    // El reto ("…combate conmigo.") lo dice la escena del laboratorio (content/events/b01_town_return.js).
    loseText: '…Vale. No ha sido suerte. Todavía no sé qué ha sido, pero suerte no.',
    winText: 'Ya está. Sigo sin entenderlo.',
    canLose: true,
  },
};
