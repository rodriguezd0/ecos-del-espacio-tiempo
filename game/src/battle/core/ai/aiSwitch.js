// IA: cambios de Pokémon (adaptación simplificada de 032_AI/003_AI_Switch).
import { roughDamage, MOVE_USELESS_SCORE, scoreMoves } from './aiMoves.js';
import { calculateEffectiveness } from '../typeChart.js';

/** Efectividad media de los tipos del rival contra unos tipos defensores. */
function defensiveMatchup(battle, foeTypes, myTypes) {
  let worst = 0;
  for (const t of foeTypes) worst = Math.max(worst, calculateEffectiveness(battle.db.types, t, myTypes));
  return worst; // 0 inmune … 4 doble debilidad
}

/** Puntuación de un Pokémon del equipo como sustituto frente a los rivales actuales. */
function replacementScore(ai, idxBattler, pkmn) {
  const battle = ai.battle;
  const foes = battle.allOtherSideBattlers(idxBattler);
  const sp = battle.speciesOf(pkmn);
  let score = 100 * (pkmn.hp / Math.max(1, battle.maxHPOf(pkmn)));
  for (const foe of foes) {
    const worst = defensiveMatchup(battle, foe.pbTypes(true), sp.types);
    score -= worst * 25;
    let best = 0;
    for (const m of pkmn.moves) {
      const data = battle.db.moves[m.id];
      if (!data || data.category === 'Status' || m.pp <= 0) continue;
      const eff = calculateEffectiveness(battle.db.types, data.type, foe.pbTypes(true));
      const stab = sp.types.includes(data.type) ? 1.5 : 1;
      best = Math.max(best, (data.power || 60) * eff * stab);
    }
    score += Math.min(best, 300) / 6;
  }
  return score;
}

/** Mejor sustituto (índice de equipo) o -1. */
export function bestReplacement(ai, idxBattler) {
  const battle = ai.battle;
  const skill = ai.skill(idxBattler);
  const choices = [];
  battle.eachInTeamFromBattlerIndex(idxBattler, (pkmn, i) => {
    if (battle.pbCanSwitchIn(idxBattler, i)) choices.push(i);
  });
  if (choices.length === 0) return -1;
  if (skill < 32) return choices[0];
  let best = choices[0];
  let bestScore = -Infinity;
  for (const i of choices) {
    const s = replacementScore(ai, idxBattler, battle.pbParty(idxBattler)[i]);
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  }
  return best;
}

/** Decide si el combatiente cambia de Pokémon este turno; si lo hace, lo registra. */
export function chooseSwitch(ai, b, skill) {
  const battle = ai.battle;
  if (skill < 48) return false;
  if (!battle.pbCanSwitchOut(b.index) || !battle.pbCanChooseNonActive(b.index)) return false;
  let shouldSwitch = false;
  if (b.effects.PerishSong === 1) shouldSwitch = true;
  if (!shouldSwitch && b.effects.Encore > 0) {
    const idx = b.pbEncoredMoveIndex();
    if (idx >= 0 && b.moves[idx].statusMove()) shouldSwitch = battle.pbAIRandom(100) < 60;
  }
  if (!shouldSwitch && b.status === 'POISON' && b.statusCount > 0 && b.effects.Toxic >= 3 && b.hp < b.totalhp / 3) {
    shouldSwitch = battle.pbAIRandom(100) < 50;
  }
  if (!shouldSwitch) {
    const options = scoreMoves(ai, b, skill);
    const best = options.length ? Math.max(...options.map((o) => o.score)) : 0;
    if (best <= MOVE_USELESS_SCORE && b.turnCount > 0) shouldSwitch = battle.pbAIRandom(100) < 70;
    if (!shouldSwitch) {
      // Emparejamiento muy malo: el rival nos quita mucho y nosotros poco.
      const foe = b.pbDirectOpposing(true);
      if (foe && !foe.isFainted()) {
        const theirs = Math.max(0, ...foe.moves.map((m) => roughDamage(battle, foe, b, m)));
        const ours = Math.max(0, ...b.moves.map((m) => roughDamage(battle, b, foe, m)));
        if (theirs >= b.hp && ours < foe.hp * 0.5 && foe.pbSpeed() > b.pbSpeed()) shouldSwitch = battle.pbAIRandom(100) < 40;
      }
    }
  }
  if (!shouldSwitch) return false;
  const idxParty = bestReplacement(ai, b.index);
  if (idxParty < 0) return false;
  // Solo cambia si el sustituto es claramente mejor que el actual.
  if (skill >= 48) {
    const current = replacementScore(ai, b.index, b.pokemon);
    const cand = replacementScore(ai, b.index, battle.pbParty(b.index)[idxParty]);
    if (cand <= current && b.effects.PerishSong !== 1) return false;
  }
  return battle.pbRegisterSwitch(b.index, idxParty);
}
