// Interfaz BattleUI entre el motor (battle/core, sin DOM) y la presentación (battle/scene).
// ARCHITECTURE §7. Todos los métodos son async. El motor encola mensajes/animaciones y los
// entrega en orden; las decisiones se piden solo cuando la cola se ha vaciado, así el estado que
// muestra la presentación coincide con el lógico.
//
// Métodos OBLIGATORIOS (decisiones): message, chooseAction, chooseMove, chooseTarget, chooseSwitch,
// chooseItem, confirm, learnMove.
// Métodos OPCIONALES (presentación; si no existen se ignoran): start, abilitySplash, animateMove,
// animateCommon, animateDamage, animateHP, animateStatus, animateStat, faint, switchOut, switchIn,
// throwBall, expGain, levelUp, changeForm, refresh, end.

/**
 * Instantánea inmutable de un combatiente (nunca el objeto vivo).
 * @typedef {object} BattlerView
 * @property {number} index        Posición: 0/2 bando del jugador, 1/3 bando rival.
 * @property {number} side         0 jugador, 1 rival.
 * @property {boolean} ownedByPlayer
 * @property {boolean} wild
 * @property {number} partyIndex
 * @property {string} name
 * @property {string} species
 * @property {number} form
 * @property {number} level
 * @property {number} hp
 * @property {number} totalhp
 * @property {string} status       'NONE'|'SLEEP'|'POISON'|'BURN'|'PARALYSIS'|'FROZEN'|'FROSTBITE'
 * @property {boolean} toxic       Envenenamiento grave.
 * @property {'M'|'F'|null} gender
 * @property {boolean} shiny
 * @property {boolean} alpha
 * @property {boolean} mega
 * @property {string[]} types
 * @property {string|null} ability
 * @property {string|null} item
 * @property {Object<string, number>} stages
 * @property {boolean} fainted
 */

/**
 * Movimiento ofrecido en el menú de lucha.
 * @typedef {object} MoveOption
 * @property {number} index
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {'Physical'|'Special'|'Status'} category
 * @property {number} power
 * @property {number} accuracy
 * @property {number} pp
 * @property {number} totalPP
 * @property {boolean} selectable
 * @property {string} [reason]     Motivo si no es seleccionable (sin PP, Mofa…).
 */

/**
 * @typedef {object} BattleUI
 * @property {(text: string, opts?: {brief?: boolean, paused?: boolean}) => Promise<void>} message
 * @property {(battler: BattlerView, ctx: {firstAction: boolean, canRun: boolean, canSwitch: boolean, canUseItems: boolean, wild: boolean}) => Promise<'fight'|'bag'|'pokemon'|'run'|'cancel'>} chooseAction
 * @property {(battler: BattlerView, moves: MoveOption[], ctx: {canMega: boolean}) => Promise<{index: number, mega?: boolean}|null>} chooseMove
 * @property {(battler: BattlerView, move: MoveOption, candidates: {index: number, battler: BattlerView}[]) => Promise<number>} chooseTarget
 *   Devuelve el índice de combatiente elegido o -1 para cancelar.
 * @property {(ctx: {battler: BattlerView|null, reason: 'command'|'replace'|'uturn'|'batonpass'|'forced'|'revive', canCancel: boolean, party: object[]}) => Promise<number>} chooseSwitch
 *   Devuelve el índice en el equipo o -1 (cancelar, solo si canCancel).
 * @property {(battler: BattlerView, ctx: {bag: object[], party: object[], firstAction: boolean}) => Promise<{item: string, target?: number, move?: number}|null>} chooseItem
 * @property {(text: string) => Promise<boolean>} confirm
 * @property {(pokemon: object, moveId: string) => Promise<number|null>} learnMove
 *   Índice del movimiento a olvidar (0..3) o null para no aprender.
 */

const DEFAULT_OPTS = Object.freeze({
  script: [],        // acciones del jugador en orden (ver HeadlessBattleUI)
  confirm: true,     // respuesta por defecto a preguntas sí/no
  learnMove: 'skip', // 'skip' | 'replaceFirst' | 'replaceLast' | (pokemon, moveId) => índice|null
  log: false,        // true → imprime los mensajes en consola
});

/**
 * Implementación sin pantalla para tests y simulaciones. Decide automáticamente o sigue un guion.
 * Entradas del guion (`opts.script`), consumidas cuando el jugador debe elegir acción:
 *   { action: 'fight', move: 'TACKLE'|índice, target?: índiceCombatiente, mega?: true }
 *   { action: 'switch', index: índiceEquipo }
 *   { action: 'item', item: 'POTION', target?: índiceEquipo, move?: índiceMov }
 *   { action: 'run' }
 * Sin guion: usa el primer movimiento de daño seleccionable (o el primero seleccionable) contra el
 * primer rival válido. `opts.chooseMove(battler, moves)` permite otra política (p. ej. aleatoria).
 * `opts.switchTo` (array) fija las elecciones de chooseSwitch; si se agota, elige el primero válido.
 */
export class HeadlessBattleUI {
  constructor(opts = {}) {
    this.opts = { ...DEFAULT_OPTS, ...opts };
    this.script = [...(this.opts.script || [])];
    this.switchQueue = [...(this.opts.switchTo || [])];
    this.messages = [];
    this.events = [];
    this.pending = null;
  }

  record(type, data) {
    this.events.push({ type, ...data });
  }

  async message(text) {
    this.messages.push(text);
    this.record('message', { text });
    if (this.opts.log) console.log(`[combate] ${text}`);
  }

  async abilitySplash(battler, visible) {
    if (visible) this.record('ability', { battler: battler.index, ability: battler.ability });
  }

  async chooseAction(battler) {
    const next = this.script[0];
    if (!next) return 'fight';
    switch (next.action) {
      case 'switch': return 'pokemon';
      case 'item': return 'bag';
      case 'run': this.script.shift(); return 'run';
      default: return 'fight';
    }
  }

  async chooseMove(battler, moves) {
    const next = this.script[0];
    if (!next && typeof this.opts.chooseMove === 'function') return this.opts.chooseMove(battler, moves);
    if (next && next.action === 'fight') {
      this.script.shift();
      this.pending = next;
      const idx = typeof next.move === 'number' ? next.move : moves.findIndex((m) => m.id === next.move);
      if (idx >= 0 && moves[idx] && moves[idx].selectable) return { index: idx, mega: !!next.mega };
    }
    this.pending = null;
    const usable = moves.find((m) => m.selectable && m.category !== 'Status') || moves.find((m) => m.selectable);
    return usable ? { index: usable.index, mega: false } : { index: 0, mega: false };
  }

  async chooseTarget(battler, move, candidates) {
    const wanted = this.pending && this.pending.target;
    this.pending = null;
    if (wanted !== undefined && candidates.some((c) => c.index === wanted)) return wanted;
    const foe = candidates.find((c) => c.battler.side !== battler.side);
    return (foe || candidates[0] || { index: -1 }).index;
  }

  async chooseSwitch(ctx) {
    const next = this.script[0];
    if (ctx.reason === 'command' && next && next.action === 'switch') {
      this.script.shift();
      return next.index;
    }
    while (this.switchQueue.length) {
      const idx = this.switchQueue.shift();
      if (ctx.party.some((p) => p.partyIndex === idx && p.able && !p.active)) return idx;
    }
    const pick = ctx.party.find((p) => p.able && !p.active && !p.chosen);
    return pick ? pick.partyIndex : -1;
  }

  async chooseItem(battler, ctx) {
    const next = this.script[0];
    if (next && next.action === 'item') {
      this.script.shift();
      return { item: next.item, target: next.target ?? battler.partyIndex, move: next.move ?? -1 };
    }
    return null;
  }

  async confirm(text) {
    this.record('confirm', { text });
    return typeof this.opts.confirm === 'function' ? this.opts.confirm(text) : !!this.opts.confirm;
  }

  async learnMove(pokemon, moveId) {
    const rule = this.opts.learnMove;
    this.record('learnMove', { species: pokemon.species, move: moveId });
    if (typeof rule === 'function') return rule(pokemon, moveId);
    if (rule === 'replaceFirst') return 0;
    if (rule === 'replaceLast') return pokemon.moves.length - 1;
    return null;
  }

  // Presentación: solo se registra.
  async start(state) { this.record('start', { state }); }
  async animateMove(user, moveId, targets, hitNum) { this.record('animateMove', { user: user?.index, moveId, targets: targets.map((t) => t.index), hitNum }); }
  async animateCommon(name, user, targets) { this.record('animateCommon', { name, user: user?.index }); }
  async animateDamage(entries) { this.record('animateDamage', { entries: entries.map((e) => ({ index: e.battler.index, from: e.from, to: e.to, effectiveness: e.effectiveness })) }); }
  async animateHP(battler, from, to) { this.record('animateHP', { index: battler.index, from, to }); }
  async animateStatus(battler, status) { this.record('animateStatus', { index: battler.index, status }); }
  async animateStat(battler, stat, stages) { this.record('animateStat', { index: battler.index, stat, stages }); }
  async faint(battler) { this.record('faint', { index: battler.index, species: battler.species }); }
  async switchOut(battler) { this.record('switchOut', { index: battler.index, species: battler.species }); }
  async switchIn(battler) { this.record('switchIn', { index: battler.index, species: battler.species }); }
  async throwBall(ball, shakes, caught, target, critical) { this.record('throwBall', { ball, shakes, caught, critical }); }
  async expGain(pokemon, battler, from, to) { this.record('expGain', { species: pokemon.species, from, to }); }
  async levelUp(pokemon, battler, oldStats, newStats) { this.record('levelUp', { species: pokemon.species, level: pokemon.level }); }
  async changeForm(battler) { this.record('changeForm', { index: battler.index, species: battler.species, form: battler.form }); }
  async end(result) { this.record('end', { outcome: result.outcome }); }
}
