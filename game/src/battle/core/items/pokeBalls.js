// Efectos de las Poké Balls (034_Other battle code/011_Battle_PokeBallEffects), gen 7+.
import { Settings } from '../settings.js';
import { speciesData } from '../pokemon.js';

const cap = (n) => Math.min(n, 255);

/** Captura garantizada. */
export function isUnconditional(ball) {
  return ball === 'MASTERBALL';
}

/** Multiplicador de ratio de captura de cada Ball. */
export function modifyCatchRate(ball, rate, battle, battler) {
  switch (ball) {
    case 'GREATBALL': return rate * 1.5;
    case 'ULTRABALL': return rate * 2;
    case 'SAFARIBALL':
    case 'SPORTBALL': return rate * 1.5;
    case 'NETBALL':
      if (battler.pbHasType('BUG') || battler.pbHasType('WATER')) rate *= Settings.NEW_POKE_BALL_CATCH_RATES ? 3.5 : 3;
      return cap(rate);
    case 'DIVEBALL':
      if (battle.environment === 'Underwater') rate *= 3.5;
      return cap(rate);
    case 'NESTBALL':
      if (battler.level <= 30) rate *= Math.max((41 - battler.level) / 10.0, 1);
      return cap(rate);
    case 'REPEATBALL':
      if (battle.player[0].caughtSpecies.has(battler.species)) rate *= Settings.NEW_POKE_BALL_CATCH_RATES ? 3.5 : 3;
      return cap(rate);
    case 'TIMERBALL':
      return cap(rate * Math.min(1 + 0.3 * battle.turnCount, 4));
    case 'DUSKBALL':
      if (battle.time === 'night' || battle.environment === 'Cave') rate *= Settings.NEW_POKE_BALL_CATCH_RATES ? 3 : 3.5;
      return cap(rate);
    case 'QUICKBALL':
      if (battle.turnCount === 0) rate *= 5;
      return cap(rate);
    case 'FASTBALL':
      if (speciesData(battle.db, battler.species, battler.form).baseStats.spe >= 100) rate *= 4;
      return cap(rate);
    case 'LEVELBALL': {
      let maxLevel = 0;
      for (const b of battle.allSameSideBattlers(0)) if (b.level > maxLevel) maxLevel = b.level;
      if (maxLevel >= battler.level * 4) rate *= 8;
      else if (maxLevel >= battler.level * 2) rate *= 4;
      else if (maxLevel > battler.level) rate *= 2;
      return cap(rate);
    }
    case 'LUREBALL':
      if (battle.config.encounterType === 'fishing') rate *= Settings.NEW_POKE_BALL_CATCH_RATES ? 5 : 3;
      return cap(rate);
    case 'HEAVYBALL': {
      if (rate === 0) return 0;
      const w = battler.pbWeight();
      if (w >= 3000) rate += 30;
      else if (w >= 2000) rate += 20;
      else if (w < 1000) rate -= 20;
      return Math.max(1, Math.min(255, rate));
    }
    case 'LOVEBALL':
      for (const b of battle.allSameSideBattlers(0)) {
        if (b.species !== battler.species) continue;
        if (b.gender === battler.gender || b.gender === 2 || battler.gender === 2) continue;
        rate *= 8;
        break;
      }
      return cap(rate);
    case 'MOONBALL': {
      const family = speciesData(battle.db, battler.species, battler.form).evolutions || [];
      if (family.some(([, method, param]) => method === 'Item' && param === 'MOONSTONE')) rate *= 4;
      return cap(rate);
    }
    case 'DREAMBALL':
      if (battler.asleep()) rate *= 4;
      return cap(rate);
    case 'BEASTBALL':
      if ((speciesData(battle.db, battler.species, battler.form).flags || []).includes('UltraBeast')) return rate * 5;
      return rate / 10;
    default:
      return rate;
  }
}

/** Efecto al capturar (Sana Ball, Amigo Ball). */
export function onCatch(ball, battle, pkmn) {
  if (ball === 'HEALBALL') {
    pkmn.hp = battle.maxHPOf(pkmn);
    pkmn.status = null;
    pkmn.statusCount = 0;
  } else if (ball === 'FRIENDBALL') {
    pkmn.happiness = 150;
  }
}

export const IMPLEMENTED_BALLS = ['POKEBALL', 'GREATBALL', 'ULTRABALL', 'MASTERBALL', 'SAFARIBALL', 'SPORTBALL', 'NETBALL',
  'DIVEBALL', 'NESTBALL', 'REPEATBALL', 'TIMERBALL', 'LUXURYBALL', 'PREMIERBALL', 'DUSKBALL', 'HEALBALL', 'QUICKBALL',
  'CHERISHBALL', 'FASTBALL', 'LEVELBALL', 'LUREBALL', 'HEAVYBALL', 'LOVEBALL', 'FRIENDBALL', 'MOONBALL', 'DREAMBALL', 'BEASTBALL'];
