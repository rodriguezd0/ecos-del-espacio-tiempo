// Battler: usuario y objetivos de un movimiento, redirecciones (029_Battler/009).
import { Battler } from './battler.js';

Object.assign(Battler.prototype, {
  pbFindUser() { return this; },

  /** Robo (Snatch). */
  pbChangeUser(choice, move, user) {
    move.snatched = false;
    if (move.statusMove() && move.canSnatch()) {
      let newUser = null;
      let strength = 100;
      for (const b of this.battle.allBattlers()) {
        if (b.effects.Snatch === 0 || b.effects.Snatch >= strength) continue;
        if (b.effects.SkyDrop >= 0) continue;
        newUser = b;
        strength = b.effects.Snatch;
      }
      if (newUser) {
        user = newUser;
        user.effects.Snatch = 0;
        move.snatched = true;
        this.battle.moldBreaker = user.hasMoldBreaker();
        choice.target = -1;
      }
    }
    return user;
  },

  pbFindTargets(choice, move, user) {
    const battle = this.battle;
    const preTarget = choice.target ?? -1;
    const targets = [];
    const pre = preTarget >= 0 ? battle.battlers[preTarget] : null;
    switch (move.pbTarget(user).id) {
      case 'NearAlly':
        if (!this.pbAddTarget(targets, user, pre, move)) this.pbAddTargetRandomAlly(targets, user, move);
        break;
      case 'UserOrNearAlly':
        if (!this.pbAddTarget(targets, user, pre, move, true, true)) this.pbAddTarget(targets, user, user, move, true, true);
        break;
      case 'AllAllies':
        for (const b of battle.allSameSideBattlers(user.index)) {
          if (b.index !== user.index) this.pbAddTarget(targets, user, b, move, false, true);
        }
        break;
      case 'UserAndAllies':
        this.pbAddTarget(targets, user, user, move, true, true);
        for (const b of battle.allSameSideBattlers(user.index)) this.pbAddTarget(targets, user, b, move, false, true);
        break;
      case 'NearFoe':
      case 'NearOther':
        if (!this.pbAddTarget(targets, user, pre, move)) {
          if (preTarget >= 0 && !user.opposes(preTarget)) this.pbAddTargetRandomAlly(targets, user, move);
          else this.pbAddTargetRandomFoe(targets, user, move);
        }
        break;
      case 'RandomNearFoe':
        this.pbAddTargetRandomFoe(targets, user, move);
        break;
      case 'AllNearFoes':
        for (const b of battle.allOtherSideBattlers(user.index)) this.pbAddTarget(targets, user, b, move);
        break;
      case 'Foe':
      case 'Other':
        if (!this.pbAddTarget(targets, user, pre, move, false)) {
          if (preTarget >= 0 && !user.opposes(preTarget)) this.pbAddTargetRandomAlly(targets, user, move, false);
          else this.pbAddTargetRandomFoe(targets, user, move, false);
        }
        break;
      case 'AllFoes':
        for (const b of battle.allOtherSideBattlers(user.index)) this.pbAddTarget(targets, user, b, move, false);
        break;
      case 'AllNearOthers':
        for (const b of battle.allBattlers()) this.pbAddTarget(targets, user, b, move);
        break;
      case 'AllBattlers':
        for (const b of battle.allBattlers()) this.pbAddTarget(targets, user, b, move, false, true);
        break;
      default:
        move.pbAddTarget(targets, user); // Contraataque, Manto Espejo, Venganza…
        break;
    }
    if (targets.length > 0) {
      if (!battle.moldBreaker) battle.moldBreaker = user.hasMoldBreaker() || (move.statusMove() && user.hasActiveAbility('MYCELIUMMIGHT'));
      if (targets[0].hasActiveItem('ABILITYSHIELD')) battle.moldBreaker = false;
    }
    return targets;
  },

  /** Redirecciones: Foco, Señuelo, Polvo Ira, Pararrayos, Colector. */
  pbChangeTargets(move, user, targets) {
    const battle = this.battle;
    const td = move.pbTarget(user);
    if (battle.switching) return targets;
    if (move.cannotRedirect() || move.targetsPosition()) return targets;
    if (!td.canTargetOneFoe || targets.length !== 1) return targets;
    move.pbModifyTargets(targets, user);
    if (user.hasActiveAbility(['PROPELLERTAIL', 'STALWART'])) return targets;
    const priority = battle.pbPriority(true);
    const nearOnly = !td.canChooseDistantTarget;
    const pick = (effect, extraSkip) => {
      let newTarget = null;
      let strength = 100;
      for (const b of priority) {
        if (b.isFainted() || b.effects.SkyDrop >= 0) continue;
        if (extraSkip && extraSkip(b)) continue;
        if (b.effects[effect] === 0 || b.effects[effect] >= strength) continue;
        if (!b.opposes(user)) continue;
        if (nearOnly && !b.near(user)) continue;
        newTarget = b;
        strength = b.effects[effect];
      }
      return newTarget;
    };
    let nt = pick('Spotlight');
    if (nt) {
      const t = [];
      this.pbAddTarget(t, user, nt, move, nearOnly);
      return t;
    }
    nt = pick('FollowMe', (b) => b.effects.RagePowder && !user.affectedByPowder());
    if (nt) {
      const t = [];
      this.pbAddTarget(t, user, nt, move, nearOnly);
      return t;
    }
    targets = this.pbChangeTargetByAbility('LIGHTNINGROD', 'ELECTRIC', move, user, targets, priority, nearOnly);
    targets = this.pbChangeTargetByAbility('STORMDRAIN', 'WATER', move, user, targets, priority, nearOnly);
    return targets;
  },

  pbChangeTargetByAbility(drawingAbility, drawnType, move, user, targets, priority, nearOnly) {
    if (move.calcType !== drawnType) return targets;
    if (targets[0].hasActiveAbility(drawingAbility)) return targets;
    for (const b of priority) {
      if (b.index === user.index || b.index === targets[0].index) continue;
      if (!b.hasActiveAbility(drawingAbility)) continue;
      if (nearOnly && !b.near(user)) continue;
      this.battle.pbShowAbilitySplash(b);
      targets.length = 0;
      this.pbAddTarget(targets, user, b, move, nearOnly);
      this.battle.pbDisplay(`¡${b.pbThis()} recibió el ataque!`);
      this.battle.pbHideAbilitySplash(b);
      break;
    }
    return targets;
  },

  pbAddTarget(targets, user, target, move, nearOnly = true, allowUser = false) {
    if (!target || (target.isFainted() && !move.targetsPosition())) return false;
    if (!allowUser && target === user) return false;
    if (nearOnly && !user.near(target) && target !== user) return false;
    if (targets.some((b) => b.index === target.index)) return true;
    targets.push(target);
    return true;
  },

  pbAddTargetRandomAlly(targets, user, move, nearOnly = true) {
    const choices = [];
    for (const b of user.allAllies()) {
      if (nearOnly && !user.near(b)) continue;
      this.pbAddTarget(choices, user, b, move, nearOnly);
    }
    if (choices.length > 0) this.pbAddTarget(targets, user, choices[this.battle.pbRandom(choices.length)], move, nearOnly);
  },

  pbAddTargetRandomFoe(targets, user, move, nearOnly = true) {
    const choices = [];
    for (const b of user.allOpposing()) {
      if (nearOnly && !user.near(b)) continue;
      this.pbAddTarget(choices, user, b, move, nearOnly);
    }
    if (choices.length > 0) this.pbAddTarget(targets, user, choices[this.battle.pbRandom(choices.length)], move, nearOnly);
  },
});
