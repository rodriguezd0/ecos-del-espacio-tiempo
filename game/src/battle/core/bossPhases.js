// Fases de jefe: al quedar debilitado, el combatiente objetivo cambia de forma/tipo/estadísticas y
// sigue luchando (mecánica genérica; las reglas del combate de Arceus, D23, están en content/events/b21_arceus_logic.js).
//
// config.phases = [ {                 // una entrada por cada transición (fase 2, fase 3…)
//   form?: número,                    // nueva forma de la especie (p. ej. Tabla de Arceus)
//   types?: ['GHOST'],                // tipos a imponer (si no se cambia de forma)
//   ability?: 'ID', item?: 'ID', moves?: ['ID', …],
//   statMultipliers?: { atk: 1.2, … }, // multiplicadores sobre las estadísticas calculadas
//   level?: número,
//   heal?: 1.0,                       // fracción de PS restaurados (por defecto 1)
//   cureStatus?: true, resetStages?: true, clearEffects?: false,
//   message?: 'texto',                // mensaje de transición (por defecto uno genérico)
//   name?: 'etiqueta',                // nombre interno de la fase (para catchCondition)
//   faint?: true, messages?: ['…'],   // fase de DIÁLOGO (aditivo B13): muestra los mensajes y el combatiente cae
//                                     // con normalidad (una escena «a mitad del combate», sin transformarse)
//   before?: (battle, battler) => {}, // ganchos (aditivo B21): antes de transformarse y al terminar la transición
//   onEnter?: (battle, battler) => {}, // (mensajes propios, limpiar el campo, curar al equipo del jugador…)
// }, … ]
// config.phaseTarget = índice del combatiente jefe (por defecto 1).
// config.rules.onEndOfRound?: (battle) => {} — gancho al final de cada ronda (aditivo B21; lo llama
// battleEndOfRound.js mediante pbBossRoundHook) para reglas de jefe que dependen de los PS (p. ej. soltar una Tabla).
// battle.phaseState = { index, total, target } — `index` es el número de transiciones ya ocurridas.
import { Battle } from './battle.js';
import { BATTLE_STATS } from './constants.js';
import { createMove } from './moves/registry.js';

const STAT_KEYS = { atk: 'attack', def: '_defense', spa: 'spatk', spd: '_spdef', spe: 'speed' };

Object.assign(Battle.prototype, {
  /** Fase actual del jefe (0 = inicial). */
  bossPhase() { return this.phaseState.index; },
  /** ¿Quedan fases por delante? */
  bossHasMorePhases() { return this.phaseState.index < this.phaseState.total; },
  /** ¿Estamos en la última fase? (útil en rules.catchCondition). */
  bossInFinalPhase() { return this.phaseState.total > 0 && this.phaseState.index >= this.phaseState.total; },

  /** Ejecuta un gancho de fase o de ronda sin romper el combate si falla (aditivo B21). */
  pbBossHook(fn, ...args) {
    if (typeof fn !== 'function') return;
    try {
      fn(this, ...args);
    } catch (err) {
      console.error('[combate] gancho de jefe:', err);
    }
  },

  /** Final de ronda: rules.onEndOfRound(battle) (aditivo B21). */
  pbBossRoundHook() {
    if (this.decision > 0) return;
    this.pbBossHook(this.rules?.onEndOfRound);
  },

  /** Llamado desde Battler.pbFaint: si procede, transforma en lugar de debilitar. */
  pbBossPhaseTransition(battler) {
    const st = this.phaseState;
    if (!st || st.total === 0 || battler.index !== st.target) return false;
    if (st.index >= st.total || !battler.pokemon) return false;
    const phase = this.config.phases[st.index];
    st.index += 1;
    if (phase.faint) {
      // Fase de diálogo: solo mensajes; el combatiente se debilita con normalidad (return false).
      const lines = Array.isArray(phase.messages) ? phase.messages : [phase.message].filter(Boolean);
      for (const text of lines) this.pbDisplay(text);
      return false;
    }
    this.pbBossHook(phase.before, battler);
    const pkmn = battler.pokemon;
    if (phase.level) pkmn.level = phase.level;
    if (phase.form !== undefined) {
      pkmn.form = phase.form;
      battler.form = phase.form;
    }
    if (phase.ability) pkmn.ability = phase.ability;
    if (phase.item !== undefined) {
      pkmn.heldItem = phase.item;
      battler.item = phase.item;
    }
    if (Array.isArray(phase.moves)) {
      pkmn.moves = phase.moves.filter((m) => this.db.moves[m]).slice(0, 4).map((id) => ({ id, pp: this.db.moves[id].pp, ppUps: 0 }));
    }
    // Restaurar PS antes de recalcular (pbUpdate limita a los nuevos máximos).
    pkmn.hp = 1;
    battler.hp = 1;
    battler.pbUpdate(true);
    if (phase.types) battler.types = [...phase.types];
    if (phase.statMultipliers) {
      for (const [k, mult] of Object.entries(phase.statMultipliers)) {
        const field = STAT_KEYS[k];
        if (field) battler[field] = Math.max(1, Math.floor(battler[field] * mult));
      }
    }
    const heal = phase.heal ?? 1;
    battler.hp = Math.max(1, Math.floor(battler.totalhp * heal));
    if (phase.cureStatus !== false) battler.status = 'NONE';
    if (phase.resetStages !== false) for (const s of BATTLE_STATS) battler.stages[s] = 0;
    if (phase.clearEffects) battler.pbInitEffects(false);
    battler.effects.Transform = false;
    battler.fainted = false;
    battler.damageState.fainted = false;
    battler.refreshMoves();
    if (Array.isArray(phase.moves)) battler.moves = pkmn.moves.map((m) => createMove(this, m));
    this.queueEvent('changeForm', battler.view());
    this.queueEvent('animateHP', battler.view(), 0, battler.hp, true);
    this.pbDisplay(phase.message || `¡${battler.pbThis()} se niega a caer y cambia de forma!`);
    this.pbBossHook(phase.onEnter, battler);
    this.pbClearChoice(battler.index);
    this.pbCalculatePriority(false, [battler.index]);
    return true;
  },
});
