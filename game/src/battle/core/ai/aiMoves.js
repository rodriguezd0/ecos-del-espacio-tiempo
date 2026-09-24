// IA: puntuación de movimientos (adaptación simplificada de 032_AI/006-012 y 033 de Essentials).
// Puntuación base 100; 60 = inútil; 20 = fallará. Los movimientos de daño suman según el % de PS
// que quitarían; los de estado según su efecto y la situación.
import { STAT_STAGE_MAXIMUM, STAT_STAGE_MULTIPLIERS, STAT_STAGE_DIVISORS, OHKO_CODES } from '../constants.js';
import { Effectiveness } from '../typeChart.js';

export const MOVE_FAIL_SCORE = 20;
export const MOVE_USELESS_SCORE = 60;
export const MOVE_BASE_SCORE = 100;

const STATUS_CODES = {
  SleepTarget: 'SLEEP', SleepTargetNextTurn: 'SLEEP', ParalyzeTarget: 'PARALYSIS', ParalyzeTargetIfNotTypeImmune: 'PARALYSIS',
  BurnTarget: 'BURN', PoisonTarget: 'POISON', BadPoisonTarget: 'TOXIC', FreezeTarget: 'FROZEN',
};

function stagedStat(value, stage) {
  const s = Math.max(-STAT_STAGE_MAXIMUM, Math.min(STAT_STAGE_MAXIMUM, stage)) + STAT_STAGE_MAXIMUM;
  return Math.floor((value * STAT_STAGE_MULTIPLIERS[s]) / STAT_STAGE_DIVISORS[s]);
}

/** Estimación de daño sin aleatoriedad (media 92,5 %) ni críticos. */
export function roughDamage(battle, user, target, move) {
  if (!move.damagingMove()) return 0;
  const type = move.pbCalcType ? move.pbCalcType(user) : move.type;
  let typeMod = 1;
  try {
    typeMod = move.pbCalcTypeMod(type, user, target);
  } catch {
    typeMod = 1;
  }
  if (Effectiveness.ineffective(typeMod)) return 0;
  if (move.isFixedDamage) {
    try {
      return move.pbFixedDamage(user, target);
    } catch {
      return 40;
    }
  }
  if (OHKO_CODES.includes(move.functionCode)) return target.level > user.level ? 0 : target.hp;
  let power = move.power || 60;
  if (power <= 1) power = 60;
  const special = move.specialMove();
  const atk = special ? stagedStat(user.spatk, user.stages.SPECIAL_ATTACK) : stagedStat(user.attack, user.stages.ATTACK);
  const def = special ? stagedStat(target.spdef, target.stages.SPECIAL_DEFENSE) : stagedStat(target.defense, target.stages.DEFENSE);
  let dmg = Math.floor(Math.floor((Math.floor((2 * user.level) / 5 + 2) * power * atk) / Math.max(1, def)) / 50) + 2;
  let mult = 0.925 * typeMod;
  if (type && user.pbHasType(type)) mult *= user.hasActiveAbility('ADAPTABILITY') ? 2 : 1.5;
  if (user.status === 'BURN' && move.physicalMove() && !user.hasActiveAbility('GUTS')) mult *= 0.5;
  const w = user.effectiveWeather();
  if ((w === 'Sun' || w === 'HarshSun') && type === 'FIRE') mult *= 1.5;
  if ((w === 'Sun' || w === 'HarshSun') && type === 'WATER') mult *= 0.5;
  if ((w === 'Rain' || w === 'HeavyRain') && type === 'WATER') mult *= 1.5;
  if ((w === 'Rain' || w === 'HeavyRain') && type === 'FIRE') mult *= 0.5;
  if (move.multiHitMove && move.multiHitMove()) mult *= move.functionCode === 'HitTwoTimes' ? 2 : 3;
  dmg = Math.max(1, Math.floor(dmg * mult));
  return dmg;
}

function statusScore(battle, user, target, status, move, skill) {
  const canInflict = status === 'TOXIC' ? target.pbCanPoison(user, false, move)
    : status === 'SLEEP' ? target.pbCanSleep(user, false, move)
      : target.pbCanInflictStatus(status, user, false, move);
  if (!canInflict) return skill >= 48 ? -1 : MOVE_USELESS_SCORE;
  switch (status) {
    case 'SLEEP': return MOVE_BASE_SCORE + 40;
    case 'PARALYSIS': return MOVE_BASE_SCORE + (target.pbSpeed() > user.pbSpeed() ? 35 : 20);
    case 'TOXIC': return MOVE_BASE_SCORE + 30;
    case 'BURN': return MOVE_BASE_SCORE + (target.attack > target.spatk ? 35 : 15);
    case 'POISON': return MOVE_BASE_SCORE + 20;
    default: return MOVE_BASE_SCORE + 15;
  }
}

/** Puntúa un movimiento contra un objetivo (o sin objetivo). */
function scoreMoveAgainst(ai, user, move, target, skill) {
  const battle = ai.battle;
  const code = move.functionCode;
  if (skill <= 0) return MOVE_BASE_SCORE;
  // Predicción de fallo (habilidad alta)
  if (target && skill >= 48) {
    const typeMod = move.pbCalcTypeMod(move.pbCalcType(user), user, target);
    if (move.damagingMove() && Effectiveness.ineffective(typeMod)) return -1;
    if (move.pbImmunityByAbility(user, target, false)) return -1;
    if (move.powderMove() && !target.affectedByPowder()) return -1;
    if (target.effects.Substitute > 0 && move.statusMove() && !move.ignoresSubstitute(user) && target.opposes(user)) return -1;
  }
  let score = MOVE_BASE_SCORE;
  if (move.damagingMove() && target) {
    const dmg = roughDamage(battle, user, target, move);
    const frac = Math.min(dmg / Math.max(1, target.hp), 1.2);
    score += Math.round(45 * frac) - 10;
    if (dmg >= target.hp) {
      score += 20;
      if (move.priority > 0) score += 10;
    }
    const acc = move.accuracy || 100;
    if (acc < 100) score = Math.round(score * (0.6 + 0.4 * (acc / 100)));
    if (code === 'AttackAndSkipNextTurn' && dmg < target.hp) score -= 15;
    if (/Recoil/.test(code) && user.hp < user.totalhp / 3) score -= 10;
    if (code === 'UserFaintsExplosive') score = user.hp < user.totalhp / 4 ? score : score - 50;
    if (!target.opposes(user)) score = Math.round(1.85 * MOVE_BASE_SCORE - score);
    return score;
  }
  if (!target || !target.opposes(user)) return scoreSelfStatus(ai, user, move, skill);
  // Movimientos de estado contra un rival
  if (STATUS_CODES[code]) return statusScore(battle, user, target, STATUS_CODES[code], move, skill);
  if (/^ConfuseTarget|RaiseTargetAttack2ConfuseTarget|RaiseTargetSpAtk1ConfuseTarget/.test(code)) {
    return target.pbCanConfuse(user, false, move) ? MOVE_BASE_SCORE + 15 : MOVE_USELESS_SCORE;
  }
  if (code === 'AttractTarget') return target.pbCanAttract(user, false) ? MOVE_BASE_SCORE + 15 : MOVE_USELESS_SCORE;
  if (/^LowerTarget/.test(code)) {
    const stat = (move.statDown || [])[0];
    if (stat && !target.pbCanLowerStatStage(stat, user, move)) return MOVE_USELESS_SCORE;
    return MOVE_BASE_SCORE + (stat && target.stages[stat] > -2 ? 10 : -10);
  }
  if (code === 'StartLeechSeedTarget') {
    return target.effects.LeechSeed >= 0 || target.pbHasType('GRASS') ? MOVE_USELESS_SCORE : MOVE_BASE_SCORE + 20;
  }
  if (code === 'DisableTargetStatusMoves') return target.effects.Taunt > 0 ? MOVE_USELESS_SCORE : MOVE_BASE_SCORE + 5;
  if (/^Add.*ToFoeSide/.test(code)) {
    const others = battle.pbAbleNonActiveCount(target.index);
    return others > 0 ? MOVE_BASE_SCORE + 20 : MOVE_USELESS_SCORE;
  }
  if (/^SwitchOutTarget/.test(code)) return battle.pbAbleNonActiveCount(target.index) > 0 ? MOVE_BASE_SCORE : MOVE_USELESS_SCORE;
  return MOVE_BASE_SCORE - 5;
}

function scoreSelfStatus(ai, user, move, skill) {
  const battle = ai.battle;
  const code = move.functionCode;
  const hpFrac = user.hp / Math.max(1, user.totalhp);
  if (move.healingMove()) {
    if (user.hp >= user.totalhp) return MOVE_USELESS_SCORE;
    return MOVE_BASE_SCORE + (hpFrac < 0.5 ? 50 : hpFrac < 0.75 ? 10 : -20);
  }
  if (move.statUp) {
    const list = move.statUp;
    let any = false;
    let low = false;
    for (let i = 0; i < list.length; i += 2) {
      if (user.pbCanRaiseStatStage(list[i], user, move)) any = true;
      if (user.stages[list[i]] < 2) low = true;
    }
    if (!any) return MOVE_USELESS_SCORE;
    let s = MOVE_BASE_SCORE + (low ? 20 : 0);
    if (hpFrac < 0.5) s -= 25;
    if (user.turnCount > 3) s -= 10;
    return s;
  }
  if (/^ProtectUser/.test(code)) {
    if (user.effects.ProtectRate > 1) return MOVE_BASE_SCORE - 40;
    return MOVE_BASE_SCORE + (user.status === 'POISON' || user.effects.LeechSeed >= 0 ? -10 : 5);
  }
  if (/^Start(Sun|Rain|Sandstorm|Hail)Weather$/.test(code)) {
    const w = { StartSunWeather: 'Sun', StartRainWeather: 'Rain', StartSandstormWeather: 'Sandstorm', StartHailWeather: 'Hail' }[code];
    return battle.field.weather === w ? MOVE_USELESS_SCORE : MOVE_BASE_SCORE + 10;
  }
  if (/^Start.*Terrain$/.test(code)) return MOVE_BASE_SCORE + 5;
  if (/^StartWeaken.*AgainstUserSide/.test(code)) {
    const side = user.pbOwnSide().effects;
    const eff = code.includes('Physical') ? side.Reflect : code.includes('Special') ? side.LightScreen : side.AuroraVeil;
    return eff > 0 ? MOVE_USELESS_SCORE : MOVE_BASE_SCORE + 20;
  }
  if (code === 'UserMakeSubstitute') {
    return user.effects.Substitute > 0 || hpFrac <= 0.3 ? MOVE_USELESS_SCORE : MOVE_BASE_SCORE + 10;
  }
  if (code === 'StartUserSideDoubleSpeed') return user.pbOwnSide().effects.Tailwind > 0 ? MOVE_USELESS_SCORE : MOVE_BASE_SCORE + 15;
  if (code === 'HealUserFullyAndFallAsleep') return hpFrac < 0.4 && user.pbCanSleep(user, false, move, true) ? MOVE_BASE_SCORE + 40 : MOVE_USELESS_SCORE;
  return MOVE_BASE_SCORE - 5;
}

/**
 * Lista de opciones {moveIndex, target, score} para el combatiente.
 * Los salvajes (skill 0) puntúan todo igual → elección aleatoria.
 */
export function scoreMoves(ai, user, skill) {
  const battle = ai.battle;
  const out = [];
  battle.moldBreaker = user.hasMoldBreaker();
  user.moves.forEach((move, idx) => {
    if (!battle.pbCanChooseMove(user.index, idx, false)) return;
    const td = move.pbTarget(user);
    if (td.numTargets === 1) {
      for (const b of battle.allBattlers()) {
        if (!battle.pbMoveCanTarget(user.index, b.index, td)) continue;
        if (td.targetsFoe && !user.opposes(b)) continue;
        const s = scoreMoveAgainst(ai, user, move, b, skill);
        if (s >= 0) out.push({ moveIndex: idx, target: b.index, score: s });
      }
    } else if (td.numTargets === 0) {
      out.push({ moveIndex: idx, target: -1, score: scoreMoveAgainst(ai, user, move, null, skill) });
    } else {
      const targets = battle.allBattlers().filter((b) => battle.pbMoveCanTarget(user.index, b.index, td));
      let total = 0;
      let n = 0;
      for (const t of targets) {
        const s = scoreMoveAgainst(ai, user, move, t, skill);
        if (s < 0) continue;
        total += t.opposes(user) ? s : Math.round(1.85 * MOVE_BASE_SCORE - s) - MOVE_BASE_SCORE;
        n += 1;
      }
      const score = n > 0 ? Math.round(total / Math.max(1, targets.filter((t) => t.opposes(user)).length || 1)) : (move.worksWithNoTargets() ? MOVE_BASE_SCORE : MOVE_FAIL_SCORE);
      out.push({ moveIndex: idx, target: -1, score: Math.max(0, score) });
    }
  });
  battle.moldBreaker = false;
  return out;
}
