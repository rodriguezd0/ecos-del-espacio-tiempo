// Reglas de los intercambios online (lógica pura): qué se puede ofrecer, validación estricta del Pokémon que llega
// por la red y aplicación del cambio a la partida.
import { evolutionTarget } from '../battle/core/pokemon.js';

const MAX_LEVEL = 100;
const MAX_MOVES = 4;
/** Especies que no se intercambian: el Core de Zygarde es el compañero de la historia (D06). */
export const UNTRADEABLE = new Set(['ZYGARDE']);

/** Motivo por el que no se puede ofrecer el Pokémon `index` del equipo, o null si se puede. */
export function cannotOffer(state, index) {
  const party = state.party;
  const p = party[index];
  if (!p) return 'No hay ningún Pokémon ahí.';
  if (UNTRADEABLE.has(p.species)) return 'Este Pokémon no se separa de ti.';
  const othersAble = party.some((o, i) => i !== index && o && !o.egg);
  return othersAble ? null : 'Necesitas quedarte con al menos otro Pokémon que no sea un Huevo.';
}

/**
 * Pokémon recibido por la red → copia limpia, o lanza Error si no es válido para esta base de datos.
 * Nunca se confía en el otro cliente: se comprueban especie, nivel, movimientos y PS.
 */
export function validateTradePokemon(db, raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('No es un Pokémon.');
  const p = JSON.parse(JSON.stringify(raw));
  if (!db.species[p.species]) throw new Error(`Especie desconocida: ${p.species}`);
  if (UNTRADEABLE.has(p.species)) throw new Error('Ese Pokémon no se puede intercambiar.');
  if (!Number.isInteger(p.level) || p.level < 1 || p.level > MAX_LEVEL) throw new Error('Nivel no válido.');
  if (!Array.isArray(p.moves) || p.moves.length > MAX_MOVES || (!p.egg && p.moves.length === 0)) throw new Error('Movimientos no válidos.');
  for (const m of p.moves) if (!m || !db.moves[m.id]) throw new Error(`Movimiento desconocido: ${m?.id}`);
  if (!Number.isFinite(p.hp) || p.hp < 0) throw new Error('PS no válidos.');
  if (p.heldItem && !db.items[p.heldItem]) p.heldItem = null;
  return p;
}

/**
 * Cambia el Pokémon `index` por `received` (ya validado). Registra la especie en la Pokédex y devuelve
 * { given, received, evolveTo } (evolveTo: especie si evoluciona por intercambio, o null).
 */
export function applyTrade(state, db, index, received) {
  const given = state.party[index];
  const party = state.party.map((p, i) => (i === index ? received : p));
  state.setParty(party);
  state.registerSeen?.(received.species);
  state.registerCaught?.(received.species);
  const evolveTo = received.egg ? null : evolutionTarget(db, received, { trigger: 'trade' });
  return { given, received, evolveTo };
}
