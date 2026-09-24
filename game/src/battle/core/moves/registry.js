// Registro de clases de movimiento por código de función (functionCode de moves.json).
// Los módulos moves/effects/*.js registran sus clases al importarse (ver moves/effects/index.js).
import { UnimplementedMove, ConfusionMove, StruggleMove } from './baseEffects.js';
import { parseFunctionCode } from './move.js';
import './moveCalc.js';

const classes = new Map();
/** Códigos usados en combate que no tienen implementación (se usan como daño simple / fallan). */
export const unimplementedUsed = new Set();

export function registerMove(code, cls) {
  if (typeof cls !== 'function') throw new Error(`Clase de movimiento inválida para ${code}`);
  classes.set(code, cls);
}

/** Registra varias clases: registerMoves({ Code: Class, ... }). */
export function registerMoves(map) {
  for (const [code, cls] of Object.entries(map)) registerMove(code, cls);
}

export function isImplemented(code) {
  return classes.has(parseFunctionCode(code).code);
}

export function implementedCodes() {
  return [...classes.keys()];
}

/**
 * Crea el objeto de movimiento de combate para un movimiento del Pokémon.
 * @param {object} battle
 * @param {{id: string, pp: number, ppUps?: number}} pkmnMove
 * @param {{detached?: boolean, special?: boolean}} [opts] detached: no modifica el PP del Pokémon
 */
export function createMove(battle, pkmnMove, opts = {}) {
  const data = battle.db.moves[pkmnMove.id];
  if (!data) throw new Error(`Movimiento desconocido: ${pkmnMove.id}`);
  const { code } = parseFunctionCode(data.functionCode);
  let Cls = classes.get(code);
  if (!Cls) {
    unimplementedUsed.add(code);
    Cls = UnimplementedMove;
  }
  return new Cls(battle, pkmnMove, data, opts);
}

export function createConfusionMove(battle) {
  return new ConfusionMove(battle);
}

export function createStruggle(battle) {
  return new StruggleMove(battle);
}
