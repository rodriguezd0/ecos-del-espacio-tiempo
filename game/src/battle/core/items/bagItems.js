// Objetos de la mochila usables en combate (041_Items/004_Item_BattleEffects de Essentials).
// canUse(item, ctx) → bool (muestra el motivo si showMessages); use(item, ctx) aplica el efecto.
// ctx = { battle, pokemon, battler, moveIndex, firstAction, showMessages, userBattler }
import { Settings } from '../settings.js';
import { calcStats, totalPP } from '../pokemon.js';

const noEffect = (ctx) => {
  if (ctx.showMessages) ctx.battle.pbDisplay('No tendría ningún efecto.');
  return false;
};
const maxHP = (ctx) => (ctx.battler ? ctx.battler.totalhp : calcStats(ctx.battle.db, ctx.pokemon).hp);
const able = (p) => p && p.hp > 0;
const name = (ctx) => (ctx.battler ? ctx.battler.pbThis() : ctx.battle.pokemonName(ctx.pokemon));

/** Cura PS a un Pokémon del equipo (esté o no en combate). Devuelve si hubo efecto. */
function hpItem(ctx, amount) {
  const { battle, pokemon, battler } = ctx;
  const max = maxHP(ctx);
  if (!able(pokemon) || pokemon.hp >= max) {
    battle.pbDisplay('No tendría ningún efecto.');
    return false;
  }
  let healed;
  if (battler) {
    healed = battler.pbRecoverHP(amount);
  } else {
    healed = Math.min(Math.max(1, Math.round(amount)), max - pokemon.hp);
    pokemon.hp += healed;
  }
  battle.pbDisplay(`Los PS de ${name(ctx)} han sido restaurados en ${healed} puntos.`);
  return true;
}

function cureStatusItem(ctx, statuses, msg) {
  const { pokemon, battler, battle } = ctx;
  pokemon.status = null;
  pokemon.statusCount = 0;
  if (battler) battler.pbCureStatus(false);
  battle.pbDisplay(msg(name(ctx)));
  void statuses;
}

function canCureStatus(ctx, statuses) {
  const { pokemon, battler } = ctx;
  if (!able(pokemon)) return noEffect(ctx);
  const st = battler ? battler.status : pokemon.status || 'NONE';
  if (!statuses.includes(st)) return noEffect(ctx);
  return true;
}

function restorePP(ctx, idxMove, amount) {
  const { pokemon, battler, battle } = ctx;
  const m = pokemon.moves[idxMove];
  if (!m) return 0;
  const total = totalPP(battle.db, m);
  const newPP = Math.min(total, m.pp + amount);
  const diff = newPP - m.pp;
  m.pp = newPP;
  if (battler && battler.moves[idxMove] && battler.moves[idxMove].realMove !== m && !battler.effects.Transform) {
    battler.moves[idxMove].pp = newPP;
  }
  return diff;
}

function canRaiseStat(ctx, stat) {
  const { battler } = ctx;
  if (!battler || !battler.pbCanRaiseStatStage(stat, battler)) return noEffect(ctx);
  return true;
}

const HP_ITEMS = {
  POTION: 20, SUPERPOTION: Settings.REBALANCED_HEALING_ITEM_AMOUNTS ? 60 : 50,
  HYPERPOTION: Settings.REBALANCED_HEALING_ITEM_AMOUNTS ? 120 : 200, BERRYJUICE: 20, SWEETHEART: 20,
  FRESHWATER: Settings.REBALANCED_HEALING_ITEM_AMOUNTS ? 30 : 50, SODAPOP: Settings.REBALANCED_HEALING_ITEM_AMOUNTS ? 50 : 60,
  LEMONADE: Settings.REBALANCED_HEALING_ITEM_AMOUNTS ? 70 : 80, MOOMOOMILK: 100, ORANBERRY: 10, RAGECANDYBAR: 20,
  ENERGYPOWDER: Settings.REBALANCED_HEALING_ITEM_AMOUNTS ? 60 : 50, ENERGYROOT: Settings.REBALANCED_HEALING_ITEM_AMOUNTS ? 120 : 200,
};

const STATUS_ITEMS = {
  AWAKENING: [['SLEEP'], (n) => `${n} se ha despertado.`],
  CHESTOBERRY: [['SLEEP'], (n) => `${n} se ha despertado.`],
  BLUEFLUTE: [['SLEEP'], (n) => `${n} se ha despertado.`],
  ANTIDOTE: [['POISON'], (n) => `${n} se ha curado del envenenamiento.`],
  PECHABERRY: [['POISON'], (n) => `${n} se ha curado del envenenamiento.`],
  BURNHEAL: [['BURN'], (n) => `${n} se ha curado de la quemadura.`],
  RAWSTBERRY: [['BURN'], (n) => `${n} se ha curado de la quemadura.`],
  PARALYZEHEAL: [['PARALYSIS'], (n) => `${n} se ha curado de la parálisis.`],
  PARLYZHEAL: [['PARALYSIS'], (n) => `${n} se ha curado de la parálisis.`],
  CHERIBERRY: [['PARALYSIS'], (n) => `${n} se ha curado de la parálisis.`],
  ICEHEAL: [['FROZEN', 'FROSTBITE'], (n) => `${n} se ha descongelado.`],
  ASPEARBERRY: [['FROZEN', 'FROSTBITE'], (n) => `${n} se ha descongelado.`],
};

const FULL_HEAL_ITEMS = ['FULLHEAL', 'LAVACOOKIE', 'OLDGATEAU', 'CASTELIACONE', 'LUMIOSEGALETTE', 'SHALOURSABLE',
  'BIGMALASADA', 'PEWTERCRUNCHIES', 'LUMBERRY', 'HEALPOWDER'];

const X_ITEMS = {
  XATTACK: ['ATTACK', 2], XATTACK2: ['ATTACK', 2], XATTACK3: ['ATTACK', 3], XATTACK6: ['ATTACK', 6],
  XDEFENSE: ['DEFENSE', 2], XDEFENSE2: ['DEFENSE', 2], XDEFENSE3: ['DEFENSE', 3], XDEFENSE6: ['DEFENSE', 6],
  XDEFEND: ['DEFENSE', 2], XSPATK: ['SPECIAL_ATTACK', 2], XSPATK2: ['SPECIAL_ATTACK', 2], XSPATK3: ['SPECIAL_ATTACK', 3],
  XSPATK6: ['SPECIAL_ATTACK', 6], XSPECIAL: ['SPECIAL_ATTACK', 2], XSPDEF: ['SPECIAL_DEFENSE', 2], XSPDEF2: ['SPECIAL_DEFENSE', 2],
  XSPDEF3: ['SPECIAL_DEFENSE', 3], XSPDEF6: ['SPECIAL_DEFENSE', 6], XSPEED: ['SPEED', 2], XSPEED2: ['SPEED', 2],
  XSPEED3: ['SPEED', 3], XSPEED6: ['SPEED', 6], XACCURACY: ['ACCURACY', 2], XACCURACY2: ['ACCURACY', 2],
  XACCURACY3: ['ACCURACY', 3], XACCURACY6: ['ACCURACY', 6],
};

/** Tabla item → { canUse, use }. Las Poké Balls se tratan aparte (battleCatch.js). */
export const BagItems = {};

for (const [id, amount] of Object.entries(HP_ITEMS)) {
  BagItems[id] = {
    canUse: (ctx) => (!able(ctx.pokemon) || ctx.pokemon.hp >= maxHP(ctx) ? noEffect(ctx) : true),
    use: (ctx) => {
      const ok = hpItem(ctx, amount);
      if (ok && id === 'ENERGYPOWDER') ctx.battle.changeHappiness(ctx.pokemon, 'powder');
      if (ok && id === 'ENERGYROOT') ctx.battle.changeHappiness(ctx.pokemon, 'energyroot');
    },
  };
}
BagItems.SITRUSBERRY = {
  canUse: BagItems.POTION.canUse,
  use: (ctx) => hpItem(ctx, Math.floor(maxHP(ctx) / 4)),
};
BagItems.MAXPOTION = {
  canUse: BagItems.POTION.canUse,
  use: (ctx) => hpItem(ctx, maxHP(ctx) - ctx.pokemon.hp),
};
for (const [id, [statuses, msg]] of Object.entries(STATUS_ITEMS)) {
  BagItems[id] = { canUse: (ctx) => canCureStatus(ctx, statuses), use: (ctx) => cureStatusItem(ctx, statuses, msg) };
}
for (const id of FULL_HEAL_ITEMS) {
  BagItems[id] = {
    canUse: (ctx) => {
      const st = ctx.battler ? ctx.battler.status : ctx.pokemon.status || 'NONE';
      if (!able(ctx.pokemon) || (st === 'NONE' && (!ctx.battler || ctx.battler.effects.Confusion === 0))) return noEffect(ctx);
      return true;
    },
    use: (ctx) => {
      ctx.pokemon.status = null;
      ctx.pokemon.statusCount = 0;
      if (ctx.battler) {
        ctx.battler.pbCureStatus(false);
        ctx.battler.pbCureConfusion();
      }
      if (id === 'HEALPOWDER') ctx.battle.changeHappiness(ctx.pokemon, 'powder');
      ctx.battle.pbDisplay(`${name(ctx)} se ha curado.`);
    },
  };
}
BagItems.FULLRESTORE = {
  canUse: (ctx) => {
    const st = ctx.battler ? ctx.battler.status : ctx.pokemon.status || 'NONE';
    if (!able(ctx.pokemon) || (ctx.pokemon.hp >= maxHP(ctx) && st === 'NONE' && (!ctx.battler || ctx.battler.effects.Confusion === 0))) {
      return noEffect(ctx);
    }
    return true;
  },
  use: (ctx) => {
    ctx.pokemon.status = null;
    ctx.pokemon.statusCount = 0;
    if (ctx.battler) {
      ctx.battler.pbCureStatus(false);
      ctx.battler.pbCureConfusion();
    }
    if (ctx.pokemon.hp < maxHP(ctx)) hpItem(ctx, maxHP(ctx));
    else ctx.battle.pbDisplay(`${name(ctx)} se ha curado.`);
  },
};
const reviveCan = (ctx) => (ctx.pokemon.hp > 0 ? noEffect(ctx) : true);
BagItems.REVIVE = {
  canUse: reviveCan,
  use: (ctx) => {
    ctx.pokemon.hp = Math.max(1, Math.floor(maxHP(ctx) / 2));
    ctx.pokemon.status = null;
    ctx.pokemon.statusCount = 0;
    ctx.battle.pbDisplay(`¡${ctx.battle.pokemonName(ctx.pokemon)} ya no está debilitado!`);
  },
};
for (const id of ['MAXREVIVE', 'MAXHONEY', 'REVIVALHERB']) {
  BagItems[id] = {
    canUse: reviveCan,
    use: (ctx) => {
      ctx.pokemon.hp = maxHP(ctx);
      ctx.pokemon.status = null;
      ctx.pokemon.statusCount = 0;
      if (id === 'REVIVALHERB') ctx.battle.changeHappiness(ctx.pokemon, 'revivalherb');
      ctx.battle.pbDisplay(`¡${ctx.battle.pokemonName(ctx.pokemon)} ya no está debilitado!`);
    },
  };
}
const etherCan = (ctx) => {
  const m = ctx.pokemon.moves[ctx.moveIndex];
  if (!able(ctx.pokemon) || !m || m.pp >= totalPP(ctx.battle.db, m)) return noEffect(ctx);
  return true;
};
for (const [id, amt] of [['ETHER', 10], ['LEPPABERRY', 10], ['HOPOBERRY', 10], ['MAXETHER', 999]]) {
  BagItems[id] = {
    canUse: etherCan,
    use: (ctx) => {
      restorePP(ctx, ctx.moveIndex, amt);
      ctx.battle.pbDisplay('Ha recuperado sus PP.');
    },
  };
}
for (const [id, amt] of [['ELIXIR', 10], ['MAXELIXIR', 999]]) {
  BagItems[id] = {
    canUse: (ctx) => {
      if (!able(ctx.pokemon)) return noEffect(ctx);
      if (!ctx.pokemon.moves.some((m) => m.pp < totalPP(ctx.battle.db, m))) return noEffect(ctx);
      return true;
    },
    use: (ctx) => {
      ctx.pokemon.moves.forEach((_m, i) => restorePP(ctx, i, amt));
      ctx.battle.pbDisplay('Ha recuperado sus PP.');
    },
  };
}
for (const [id, [stat, n]] of Object.entries(X_ITEMS)) {
  BagItems[id] = {
    onBattler: true,
    canUse: (ctx) => canRaiseStat(ctx, stat),
    use: (ctx) => {
      const inc = id.match(/[236]$/) ? n : Settings.X_STAT_ITEMS_RAISE_BY_TWO_STAGES ? 2 : 1;
      ctx.battler.pbRaiseStatStage(stat, inc, ctx.battler);
      ctx.battle.changeHappiness(ctx.pokemon, 'battleitem');
    },
  };
}
BagItems.MAXMUSHROOMS = {
  onBattler: true,
  canUse: (ctx) => {
    const b = ctx.battler;
    if (!b || !['ATTACK', 'DEFENSE', 'SPECIAL_ATTACK', 'SPECIAL_DEFENSE', 'SPEED'].some((s) => b.pbCanRaiseStatStage(s, b))) return noEffect(ctx);
    return true;
  },
  use: (ctx) => {
    let showAnim = true;
    for (const s of ['ATTACK', 'DEFENSE', 'SPECIAL_ATTACK', 'SPECIAL_DEFENSE', 'SPEED']) {
      if (!ctx.battler.pbCanRaiseStatStage(s, ctx.battler)) continue;
      ctx.battler.pbRaiseStatStage(s, 1, ctx.battler, showAnim);
      showAnim = false;
    }
  },
};
for (const [id, lvl] of [['DIREHIT', 2], ['DIREHIT2', 2], ['DIREHIT3', 3]]) {
  BagItems[id] = {
    onBattler: true,
    canUse: (ctx) => (!ctx.battler || ctx.battler.effects.FocusEnergy >= (id === 'DIREHIT' ? 1 : lvl) ? noEffect(ctx) : true),
    use: (ctx) => {
      ctx.battler.effects.FocusEnergy = lvl;
      ctx.battle.pbDisplay(`¡${ctx.battler.pbThis()} se está preparando para luchar!`);
    },
  };
}
BagItems.PERSIMBERRY = {
  onBattler: true,
  canUse: (ctx) => (!ctx.battler || ctx.battler.effects.Confusion === 0 ? noEffect(ctx) : true),
  use: (ctx) => {
    ctx.battler.pbCureConfusion();
    ctx.battle.pbDisplay(`${ctx.battler.pbThis()} ya no está confuso.`);
  },
};
BagItems.YELLOWFLUTE = {
  onBattler: true,
  canUse: (ctx) => (!ctx.battler || ctx.battler.effects.Confusion === 0 || ctx.battler.hasActiveAbility('SOUNDPROOF') ? noEffect(ctx) : true),
  use: BagItems.PERSIMBERRY.use,
};
BagItems.REDFLUTE = {
  onBattler: true,
  canUse: (ctx) => (!ctx.battler || ctx.battler.effects.Attract < 0 || ctx.battler.hasActiveAbility('SOUNDPROOF') ? noEffect(ctx) : true),
  use: (ctx) => {
    ctx.battler.pbCureAttract();
    ctx.battle.pbDisplay(`${ctx.battler.pbThis()} se libró del enamoramiento.`);
  },
};
// Uso directo
BagItems.GUARDSPEC = {
  direct: true,
  canUse: (ctx) => (!ctx.userBattler || ctx.userBattler.pbOwnSide().effects.Mist > 0 ? noEffect(ctx) : true),
  use: (ctx) => {
    ctx.userBattler.pbOwnSide().effects.Mist = 5;
    ctx.battle.pbDisplay(`¡${ctx.userBattler.pbTeam()} se ha envuelto en niebla!`);
  },
};
for (const id of ['POKEDOLL', 'FLUFFYTAIL', 'POKETOY']) {
  BagItems[id] = {
    direct: true,
    canUse: (ctx) => {
      if (!ctx.battle.wildBattle()) {
        if (ctx.showMessages) ctx.battle.pbDisplay('Mejor no usarlo ahora... ¡Cada cosa en su momento!');
        return false;
      }
      if (!ctx.battle.canRun) {
        if (ctx.showMessages) ctx.battle.pbDisplay('¡No puedes huir!');
        return false;
      }
      return true;
    },
    use: (ctx) => {
      ctx.battle.decision = 3;
      ctx.battle.pbDisplayPaused('¡Escapaste sin problemas!');
    },
  };
}
BagItems.POKEFLUTE = {
  direct: true,
  canUse: (ctx) => (ctx.battle.allBattlers().some((b) => b.status === 'SLEEP' && !b.hasActiveAbility('SOUNDPROOF')) ? true : noEffect(ctx)),
  use: (ctx) => {
    for (const b of ctx.battle.allBattlers()) if (b.status === 'SLEEP' && !b.hasActiveAbility('SOUNDPROOF')) b.pbCureStatus(false);
    ctx.battle.pbDisplay('¡Todos los Pokémon se despertaron con la melodía!');
  },
};

export function implementedBagItems() {
  return Object.keys(BagItems);
}
