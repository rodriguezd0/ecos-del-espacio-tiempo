// Utilidades compartidas por los tests del motor de combate (no es un test por sí mismo).
import fs from 'node:fs';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url)));

export const db = {
  species: load('species.json'),
  moves: load('moves.json'),
  types: load('types.json'),
  items: load('items.json'),
  abilities: load('abilities.json'),
  trainerTypes: load('trainer_types.json'),
};

/** RNG constante: 0.9999 → sin críticos, tirada de daño máxima, siempre acierta, sin efectos secundarios. */
export const MAX_ROLL = () => 0.9999;
/** RNG constante: 0 → críticos, tirada mínima y efectos secundarios siempre. */
export const MIN_ROLL = () => 0;

const FLAT_IVS = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

/** Pokémon con IV 31, sin EV, naturaleza neutra (Fuerte) y los movimientos indicados. */
export function mon(species, level, moves, opts = {}) {
  return createPokemon(db, species, level, {
    rng: () => 0.5, ivs: FLAT_IVS, nature: 'HARDY', gender: 'M', shiny: false, moves, ...opts,
  });
}

/** Señal para detener un combate tras agotar el guion (los tests inspeccionan el estado). */
export class StopBattle extends Error {
  constructor() { super('fin del guion de prueba'); }
}

/** UI de prueba: sigue el guion y, si `stopAfterScript`, detiene el combate cuando se agota. */
export class ScriptUI extends HeadlessBattleUI {
  constructor(opts = {}) {
    super(opts);
    this.stopAfterScript = !!opts.stopAfterScript;
    this.actionsAsked = 0;
  }
  async chooseAction(battler, ctx) {
    this.actionsAsked += 1;
    if (this.stopAfterScript && this.script.length === 0) throw new StopBattle();
    return super.chooseAction(battler, ctx);
  }
}

/** Crea el combate y lo ejecuta; devuelve { battle, ui, result, stopped }. */
export async function play(config, uiOpts = {}) {
  const ui = new ScriptUI(uiOpts);
  const battle = new Battle({ db, rng: MAX_ROLL, ...config }, ui);
  let result = null;
  let stopped = false;
  try {
    result = await battle.run();
  } catch (err) {
    if (!(err instanceof StopBattle)) throw err;
    stopped = true;
  }
  return { battle, ui, result, stopped };
}

/** Primer evento de daño recibido por el combatiente `index`. */
export function damageEvents(ui, index) {
  return ui.events.filter((e) => e.type === 'animateDamage').flatMap((e) => e.entries).filter((e) => e.index === index);
}

/** Índice del primer mensaje que contiene `text` (o -1). */
export function msgIndex(ui, text) {
  return ui.messages.findIndex((m) => m.includes(text));
}
