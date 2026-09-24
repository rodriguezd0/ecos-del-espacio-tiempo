// Implementación de la interfaz BattleUI (battle/core/battleUI.js) sobre la BattleScene: decisiones del
// jugador (menús de Añil, Mochila y Equipo de ui/) y presentación de los eventos del motor.
import { engine } from '../../core/engine.js';
import { ui } from '../../ui/api.js';
import { syncBag } from './results.js';
import { contractArticles } from '../../shared/spanish.js';
import { Autopilot } from './autopilot.js';
import { playMoveAnimation } from './fx/moveAnims.js';
import { playCommonAnimation, statusAnimation, statAnimation } from './fx/commonAnims.js';
import {
  introSequence, sendOut, withdraw, faintSequence, damageSequence, animateBox, expSequence, captureAnim, trainerAppear,
} from './presenter.js';

const BRIEF_LINGER = 24;
const ITEM_TARGETS = ['OnPokemon', 'OnMove'];

export class SceneBattleUI {
  /** @param {import('./battleScene.js').BattleScene} scene */
  constructor(scene) {
    this.scene = scene;
    this.battle = null;
    this.victoryPlayed = false;
    this.auto = scene.meta?.auto ? new Autopilot(scene.meta.auto) : null;
  }

  attach(battle) {
    this.battle = battle;
    this.scene.battle = battle;
  }

  get db() { return engine.data; }

  // ---------------------------------------------------------------- mensajes
  async message(raw, opts = {}) {
    const s = this.scene;
    const text = contractArticles(raw); // también los textos propios de la escena (runner.js…), no solo pbDisplay
    if (this.battle && this.battle.decision > 0) s.message.battleEnd = true;
    if (s.message.lingeringBrief && s.message.lingering < BRIEF_LINGER) {
      await s.tasks.until(() => !s.message.lingeringBrief || s.message.lingering >= BRIEF_LINGER, BRIEF_LINGER);
    }
    if (/Escapas sin problemas/.test(text)) s.se('flee');
    const mode = opts.brief ? 'brief' : opts.paused ? 'paused' : 'normal';
    await s.message.show(text, mode);
  }

  /** Pregunta Sí/No con la caja de elección de ui/ sobre la barra del combate. */
  async confirm(raw) {
    const text = contractArticles(raw);
    const s = this.scene;
    if (this.auto) {
      await s.message.show(text, 'normal');
      return this.auto.confirm(text);
    }
    const shown = s.message.show(text, 'hold');
    s.message.box.fast = true;
    await shown;
    const i = await ui.choice(['Sí', 'No'], { cancel: 1 });
    s.message.clear();
    return i === 0;
  }

  // ---------------------------------------------------------------- decisiones
  async chooseAction(battler, ctx) {
    const s = this.scene;
    s.message.clear();
    if (this.auto) {
      await s.tasks.wait(20);
      return this.auto.action(battler, ctx, this.bagOptions());
    }
    s.selectedBattler = battler.index;
    s.field.cam.to('default', 0.06);
    s.field.cam.idle = !s.minimal;
    const cancelMode = !ctx.firstAction;
    const r = await s.command.open({ name: battler.name, battlerIndex: battler.index, cancelMode });
    s.selectedBattler = -1;
    return ['fight', 'bag', 'pokemon', cancelMode ? 'cancel' : 'run'][r] || 'fight';
  }

  async chooseMove(battler, moves, ctx) {
    const s = this.scene;
    if (this.auto) return this.auto.move(battler, moves, ctx);
    s.selectedBattler = battler.index;
    const r = await s.fight.open({ battlerIndex: battler.index, moves, canMega: Boolean(ctx.canMega) });
    s.selectedBattler = -1;
    return r;
  }

  async chooseTarget(battler, move, candidates) {
    if (this.auto) return this.auto.target(battler, candidates);
    const names = Object.fromEntries(candidates.map((c) => [c.index, c.battler.name]));
    return this.scene.target.open({ sideSizes: this.scene.sideSizes, candidates, names });
  }

  /** Pantalla de equipo de ui/ con el equipo del combate. Devuelve el índice en el equipo o -1. */
  async chooseSwitch(ctx) {
    const s = this.scene;
    if (this.auto) return this.auto.switchTo(ctx);
    s.field.cam.idle = false;
    const options = ctx.party.filter((p) => p.owned !== false);
    const list = options.map((p) => p.pokemon);
    const revive = ctx.reason === 'revive';
    for (;;) {
      let idx;
      if (revive) {
        idx = await ui.openParty({ mode: 'select', party: list, message: '¿A quién quieres revivir?', filter: (p) => p.hp <= 0 });
      } else if (ctx.canCancel) {
        idx = await ui.openParty({ mode: 'switch', party: list, activeIndex: options.findIndex((p) => p.active), message: '¿Qué Pokémon quieres sacar?' });
      } else {
        idx = await ui.openParty({ mode: 'select', party: list, message: 'Elige al siguiente Pokémon.', filter: (p) => p.hp > 0 });
      }
      if (Number.isInteger(idx) && options[idx]) return options[idx].partyIndex;
      if (ctx.canCancel) return -1;
    }
  }

  /** Mochila de ui/ en modo combate (sincronizada con la del motor) + objetivo del objeto. */
  async chooseItem(battler, ctx) {
    if (this.auto) return this.auto.item(battler, ctx);
    const state = engine.state;
    if (!state) return this.chooseItemFallback(battler, ctx);
    if (this.battle?.bag) syncBag(state, this.battle.bag);
    for (;;) {
      const itemId = await ui.openBag({ mode: 'battle' });
      if (!itemId) return null;
      const item = this.db.items[itemId] || {};
      const use = item.battleUse;
      const options = ctx.party.filter((p) => p.owned !== false);
      let target = battler.partyIndex;
      let move = -1;
      const needsTarget = ITEM_TARGETS.includes(use) || (use === 'OnBattler' && this.scene.sideSizes[0] > 1);
      if (needsTarget) {
        const filter = use === 'OnBattler' ? (p) => options.some((o) => o.pokemon.uid === p.uid && o.active) : undefined;
        const i = await ui.openParty({ mode: 'select', party: options.map((p) => p.pokemon), message: `¿En quién quieres usar ${item.name}?`, filter });
        if (!Number.isInteger(i) || !options[i]) continue;
        target = options[i].partyIndex;
      }
      if (use === 'OnMove') {
        const pk = options.find((p) => p.partyIndex === target)?.pokemon;
        const names = (pk?.moves || []).map((m) => this.db.moves[m.id]?.name || m.id);
        if (!names.length) continue;
        const j = await ui.choice([...names, 'Cancelar'], { message: '¿Qué movimiento?', cancel: names.length });
        if (j < 0 || j >= names.length) continue;
        move = j;
      }
      return { item: itemId, target, move };
    }
  }

  /** Sin partida (banco de pruebas sin estado): lista simple de objetos. */
  async chooseItemFallback(battler, ctx) {
    if (!ctx.bag.length) { await this.message('No tienes objetos que usar.'); return null; }
    const labels = ctx.bag.map((it) => `${it.name} x${it.qty}`);
    const i = await ui.choice([...labels, 'Cancelar'], { cancel: labels.length });
    if (i < 0 || i >= labels.length) return null;
    return { item: ctx.bag[i].id, target: battler.partyIndex, move: -1 };
  }

  async learnMove(pokemon, moveId) {
    if (this.auto && !this.auto.manualLearn) return this.auto.learnMove(pokemon, moveId);
    const auto = this.auto;
    this.auto = null;
    try {
      return await this.learnMoveUI(pokemon, moveId);
    } finally {
      this.auto = auto;
    }
  }

  /** Olvidar un movimiento para aprender otro: Sí/No y pantalla de datos en modo olvido (ui/screens/summary). */
  async learnMoveUI(pokemon, moveId) {
    const name = pokemon.nickname || this.db.species[pokemon.species]?.name || pokemon.species;
    const moveName = this.db.moves[moveId]?.name || moveId;
    for (;;) {
      if (await this.confirm(`¿Quieres que ${name} olvide un movimiento para aprender ${moveName}?`)) {
        let idx = null;
        try {
          const { openForget } = await import('../../ui/screens/summary.js');
          idx = await openForget(pokemon, moveId);
        } catch (err) {
          console.error('[combate] Pantalla de olvidar movimiento', err);
          idx = await ui.learnMove(pokemon, moveId);
        }
        if (Number.isInteger(idx) && idx >= 0 && idx < 4) return idx;
      }
      if (await this.confirm(`¿Dejar de intentar que aprenda ${moveName}?`)) return null;
    }
  }

  /** Objetos de la mochila del motor usables en combate (para el piloto automático). */
  bagOptions() {
    const bag = this.battle?.bag || {};
    return Object.entries(bag)
      .filter(([id, q]) => q > 0 && this.db.items[id]?.battleUse)
      .map(([id, qty]) => ({ id, qty, battleUse: this.db.items[id].battleUse }));
  }

  // ---------------------------------------------------------------- presentación
  async start(snapshot) {
    const s = this.scene;
    s.setupBattlers(snapshot);
    await s.setWeather(snapshot.weather);
    s.setTerrain(snapshot.terrain);
    await introSequence(s, snapshot);
  }

  async abilitySplash(view, visible) {
    const sp = this.scene.splash[view.side];
    if (visible) {
      sp.show(view.abilityName || view.ability || '', view.name);
      await this.scene.tasks.wait(14);
    } else {
      sp.hide();
      await this.scene.tasks.wait(6);
    }
  }

  async animateMove(user, moveId, targets, hitNum = 0) {
    const move = this.db.moves[moveId];
    if (!move) return;
    this.scene.field.cam.idle = false;
    await playMoveAnimation(this.scene.fx, {
      user: user ? user.index : null, targets: (targets || []).map((t) => t.index), move, hitNum: hitNum || 0,
    });
  }

  async animateCommon(name, user, targets = []) {
    await playCommonAnimation(this.scene.fx, name, user ? user.index : undefined, targets.map((t) => t.index));
  }

  async animateDamage(entries) {
    await damageSequence(this.scene, entries);
    this.scene.field.cam.to('default', 0.06);
  }

  async animateHP(battler, from, to) {
    const box = this.scene.boxes[battler.index];
    if (box?.visible) await animateBox(this.scene, box, from, to, battler);
    else box?.setView(battler);
  }

  async animateStatus(battler, status) {
    this.scene.boxes[battler.index]?.setView(battler, { keepHp: true });
    await statusAnimation(this.scene.fx, battler.index, status);
  }

  async animateStat(battler, stat, stages, showAnim = true) {
    if (showAnim === false || !stages) return;
    await statAnimation(this.scene.fx, battler.index, stages);
  }

  async faint(view) {
    await faintSequence(this.scene, view);
    if (view.side === 1 && this.battle?.pbAllFainted?.(1)) this.playVictory();
  }

  playVictory() {
    if (this.victoryPlayed) return;
    this.victoryPlayed = true;
    this.scene.bgm(this.scene.meta.victoryBgm || 'victory_wild');
  }

  async switchOut(view) {
    await withdraw(this.scene, view);
  }

  async switchIn(view, opts = {}) {
    await sendOut(this.scene, view, opts);
  }

  async throwBall(ball, shakes, caught, target, critical) {
    await captureAnim(this.scene, { ball, shakes, caught, target, critical });
    if (caught) {
      const me = engine.audio?.playME?.('capture');
      this.playVictory();
      await Promise.race([Promise.resolve(me), this.scene.tasks.wait(150)]).catch(() => {});
    }
  }

  async expGain(pokemon, battler, from, to, levelMin, levelMax) {
    await expSequence(this.scene, battler, from, to, levelMin, levelMax);
  }

  async levelUp(pokemon, battler, oldStats, newStats) {
    const s = this.scene;
    s.se('level_up');
    const box = battler ? s.boxes[battler.index] : null;
    if (box) { box.setView(battler); box.expFrac = 0; box.flash = 12; }
    await s.levelUp.open(oldStats, newStats);
  }

  async changeForm(view) {
    const s = this.scene;
    const sprite = s.battlers[view.index];
    const shown = view.transformInto ? { ...view, species: view.transformInto.species, form: view.transformInto.form } : view;
    if (sprite) await sprite.setPokemon(shown);
    s.boxes[view.index]?.setView(view, { keepHp: true });
  }

  async refresh(view) {
    const s = this.scene;
    if (view) {
      const box = s.boxes[view.index];
      if (box && !box.hpAnim) box.setView(view);
      return;
    }
    for (const b of this.battle?.battlers || []) {
      if (b?.pokemon && s.boxes[b.index] && !s.boxes[b.index].hpAnim) s.boxes[b.index].setView(b.view());
    }
  }

  async weather(w) { await this.scene.setWeather(w); }
  async terrain(t) { this.scene.setTerrain(t); }

  async showOpponent(name) {
    const i = Math.max(0, (this.battle?.opponent || []).findIndex((o) => o.name === name));
    await trainerAppear(this.scene, i);
  }

  async swapBattlers(a, b) {
    const s = this.scene;
    const sa = s.battlers[a];
    const sb = s.battlers[b];
    if (!sa || !sb) return;
    s.battlers[a] = sb; s.battlers[b] = sa;
    sb.index = a; sa.index = b;
    const ba = s.boxes[a]; const bb = s.boxes[b];
    [ba.view, bb.view] = [bb.view, ba.view];
    [ba.displayHp, bb.displayHp] = [bb.displayHp, ba.displayHp];
    await s.tasks.wait(10);
  }

  async end() {
    this.scene.message.battleEnd = true;
    this.scene.field.cam.idle = false;
  }
}
