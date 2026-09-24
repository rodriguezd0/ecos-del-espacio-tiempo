// Battle: lanzamiento de Poké Balls y captura (034_Other battle code/006, fórmula gen 7+).
// Reglas configurables: config.rules.canCatch (false bloquea), config.rules.catchCondition(battle)
// → { allowed, reason }. Si no se permite, se comunica el motivo y NO se gasta ni la Ball ni el turno.
import { Battle } from './battle.js';
import { Settings } from './settings.js';
import { calcStats, speciesData } from './pokemon.js';
import { isUnconditional, modifyCatchRate, onCatch } from './items/pokeBalls.js';
import { makeUnmega } from './pokemonUtil.js';

Object.assign(Battle.prototype, {
  maxHPOf(pkmn) { return calcStats(this.db, pkmn).hp; },

  /** Reglas de captura del combate: { allowed, reason }. */
  pbCatchRules() {
    const rules = this.rules;
    if (rules.canCatch === false) {
      return { allowed: false, reason: rules.catchReason || '¡No es posible capturar a este Pokémon!' };
    }
    if (typeof rules.catchCondition === 'function') {
      let res;
      try {
        res = rules.catchCondition(this);
      } catch (err) {
        console.error('[combate] catchCondition lanzó un error:', err);
        return { allowed: false, reason: '¡No es posible capturar a este Pokémon ahora!' };
      }
      if (res === false) return { allowed: false, reason: '¡No es posible capturar a este Pokémon ahora!' };
      if (res && res.allowed === false) return { allowed: false, reason: res.reason || '¡No es posible capturar a este Pokémon ahora!' };
    }
    return { allowed: true, reason: null };
  },

  pbCanThrowBall(ball, userBattler, firstAction, showMessages = true) {
    const say = (m) => { if (showMessages) this.pbDisplay(m); };
    if (this.rules.storageFull) {
      say('¡No queda espacio en el PC!');
      return false;
    }
    if (this.disablePokeBalls) {
      say('¡No puedes lanzar una Poké Ball!');
      return false;
    }
    const rules = this.pbCatchRules();
    if (!rules.allowed) {
      say(rules.reason);
      return false;
    }
    if (!firstAction) {
      say('¡Es imposible apuntar sin estar concentrado!');
      return false;
    }
    const count = this.pbOpposingBattlerCount(userBattler.index);
    if (count > 1) {
      say('¡Es imposible apuntar cuando hay dos Pokémon!');
      return false;
    }
    const target = this.allOtherSideBattlers(userBattler.index)[0];
    if (target && target.semiInvulnerable()) {
      say('¡No se puede apuntar a un Pokémon que no tienes delante!');
      return false;
    }
    return true;
  },

  async pbThrowPokeBall(idxBattler, ball, catchRate = null) {
    let battler = this.opposes(idxBattler) ? this.battlers[idxBattler] : this.battlers[idxBattler].pbDirectOpposing(true);
    if (battler.isFainted() && battler.allAllies().length > 0) battler = battler.allAllies()[0];
    const itemName = this.itemName(ball);
    const playerName = this.player[0].name;
    if (battler.isFainted()) {
      this.pbDisplay(`¡${playerName} ha lanzado una ${itemName}!`);
      this.pbDisplay('Pero no había objetivo...');
      return;
    }
    this.pbDisplayBrief(`¡${playerName} ha lanzado una ${itemName}!`);
    if (this.trainerBattle()) {
      this.queueEvent('throwBall', ball, -1, false, battler.view(), false);
      this.pbDisplay('¡El Entrenador bloqueó tu Ball! ¡Robar está mal!');
      return;
    }
    const pkmn = battler.pokemon;
    this.criticalCapture = false;
    const numShakes = this.pbCaptureCalc(pkmn, battler, catchRate, ball);
    this.queueEvent('throwBall', ball, numShakes, numShakes === 4, battler.view(), this.criticalCapture);
    const failMsgs = ['¡Oh, no! ¡El Pokémon se ha escapado!', '¡Vaya! ¡Parecía que lo habías atrapado!',
      '¡Qué pena! ¡Te ha faltado poco!', '¡Uy! ¡Casi lo consigues!'];
    if (numShakes < 4) {
      this.pbDisplay(failMsgs[numShakes]);
      if (!this.pokeBallFailed) this.firstPokeBall = ball;
      this.pokeBallFailed = true;
      return;
    }
    this.pbDisplayBrief(`¡Ya está! ¡${this.pokemonName(pkmn)} atrapado!`);
    this.pbRemoveFromParty(battler.index, battler.pokemonIndex);
    if (Settings.GAIN_EXP_FOR_CAPTURE) {
      battler.captured = true;
      await this.pbGainExp();
      battler.captured = false;
    }
    battler.pbReset();
    if (this.pbAllFainted(battler.index)) this.decision = this.trainerBattle() ? 1 : 4;
    onCatch(ball, this, pkmn);
    pkmn.ball = ball;
    makeUnmega(this.db, pkmn);
    if (!pkmn.ot) pkmn.ot = { name: playerName, id: this.player[0].id };
    pkmn.obtainedMode = 'caught';
    pkmn.statusCount = pkmn.status === 'POISON' ? 0 : pkmn.statusCount || 0;
    this.pbSetCaught(pkmn);
    this.caughtPokemon.push(pkmn);
  },

  /** Número de sacudidas (4 = captura). */
  pbCaptureCalc(pkmn, battler, catchRate, ball) {
    const sp = speciesData(this.db, pkmn.species, pkmn.form);
    let rate = catchRate ?? sp.catchRate ?? 45;
    if (!(sp.flags || []).includes('UltraBeast') || ball === 'BEASTBALL') rate = modifyCatchRate(ball, rate, this, battler);
    else rate /= 10;
    const a = battler.totalhp;
    const b = battler.hp;
    let x = ((3 * a - 2 * b) * rate) / (3 * a);
    if (battler.status === 'SLEEP' || battler.status === 'FROZEN') x *= 2.5;
    else if (battler.status !== 'NONE') x *= 1.5;
    x = Math.floor(x);
    if (x < 1) x = 1;
    if (x >= 255 || isUnconditional(ball)) return 4;
    const y = Math.floor(65536 / (255.0 / x) ** 0.1875);
    if (Settings.ENABLE_CRITICAL_CAPTURES) {
      const owned = this.player[0].dexCaught || 0;
      let dexMod = 0;
      if (owned > 600) dexMod = 5;
      else if (owned > 450) dexMod = 4;
      else if (owned > 300) dexMod = 3;
      else if (owned > 150) dexMod = 2;
      else if (owned > 30) dexMod = 1;
      if ((this.bag.CATCHINGCHARM || 0) > 0) dexMod *= 2;
      const c = Math.floor((x * dexMod) / 12);
      if (c > 0 && this.pbRandom(256) < c) {
        this.criticalCapture = true;
        return this.pbRandom(65536) < y ? 4 : 0;
      }
    }
    let numShakes = 0;
    for (let i = 0; i < 4; i++) {
      if (numShakes < i) break;
      if (this.pbRandom(65536) < y) numShakes += 1;
    }
    return numShakes;
  },
});
