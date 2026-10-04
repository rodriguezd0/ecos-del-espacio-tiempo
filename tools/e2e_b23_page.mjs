// Banco aislado de Almenara: prepara el equipo de prueba y decide acciones; el combate y las recompensas son reales.
import { installHelpers } from './e2e_b01_page.mjs';
export async function installB23Helpers(page, { carry = null, history = [] } = {}) {
  await installHelpers(page);
  await page.evaluate(async ({ carry, history }) => {
    const { engine } = await import('/src/core/engine.js');
    const api = await import('/src/battle/api.js');
    const { createPokemon, maxHP } = await import('/src/battle/core/pokemon.js');
    const { Autopilot } = await import('/src/battle/scene/autopilot.js');
    const s = engine.state;
    if (carry) { const position = { ...s.player }; s.data = carry; Object.assign(s.player, { mapId: position.mapId, x: position.x, y: position.y, dir: position.dir }); }
    const team = (mode = 'strong') => {
      const weak = mode === 'weak';
      const z = createPokemon(engine.data, 'ZYGARDE', weak ? 80 : 100, { form: 2, moves: weak ? ['SPLASH'] : ['THOUSANDARROWS', 'DRAGONHAMMER', 'CRUNCH', 'EXTREMESPEED'], rng: () => 0.5 });
      if (s.flag('dlc1_zygardita')) z.heldItem = 'ZYGARDITE';
      const m = createPokemon(engine.data, 'MEWTWO', 100, { moves: ['SHADOWBALL', 'AURASPHERE', 'PSYCHIC', 'ICEBEAM'], rng: () => 0.5 });
      s.setParty(weak ? [z] : mode === 'noMega' ? [m, z] : [z, m]);
      window.__map.refreshFollower?.();
    };
    if (!carry) {
      team(); s.player.name = 'QAAlmenara'; s.obtainPokedex(); s.addKeyItem('MEGARING'); s.addKeyItem('ZYGARDECUBE');
      s.addItem('MASTERBALL', 4); s.setHealPoint('brontia_centro', 9, 7, 8);
    }
    s.setOptions({ textSpeed: 3 });
    const pilot = { mode: 'fight', probeBall: false }, probed = new WeakSet();
    const battleNow = () => engine.scenes.stack.map(x => x.scene).find(x => x?.battle)?.battle;
    const oldAction = Autopilot.prototype.action, oldMove = Autopilot.prototype.move, oldItem = Autopilot.prototype.item;
    Autopilot.prototype.action = function (battler, ctx, bag) {
      const b = battleNow();
      if (ctx.wild && (pilot.mode === 'capture' || pilot.probeBall && b && !probed.has(b))) {
        if (b) probed.add(b); this.b23Ball = true; return 'bag';
      }
      return oldAction.call(this, battler, ctx, bag);
    };
    Autopilot.prototype.item = function (battler, ctx) {
      if (!this.b23Ball) return oldItem.call(this, battler, ctx);
      this.b23Ball = false; return { item: 'MASTERBALL', target: battler.partyIndex, move: -1 };
    };
    Autopilot.prototype.move = function (battler, moves, ctx) {
      const m = oldMove.call(this, battler, moves, ctx);
      const foe = battleNow()?.battlers[1];
      if (m && foe) {
        const ranked = moves.filter(p => p.selectable !== false && p.category !== 'Status').map(p => {
          const data = engine.data.moves[p.id], type = data?.type;
          let score = data?.power || 0;
          for (const t of foe.pbTypes(true)) {
            const d = engine.data.types[t];
            if (d?.immunities?.includes(type) && !(p.id === 'THOUSANDARROWS' && t === 'FLYING')) score = 0;
            if (d?.weaknesses?.includes(type)) score *= 2;
            if (d?.resistances?.includes(type)) score /= 2;
          }
          return { p, score };
        }).sort((a, b) => b.score - a.score);
        if (ranked[0]?.score > 0) m.index = ranked[0].p.index;
      }
      if (m) m.mega = pilot.mode === 'mega' && Boolean(ctx.canMega);
      return m;
    };
    const battles = history;
    api.installBattle(async cfg => {
      const result = await api.startBattle({ ...cfg, auto: 'fight', seed: 230 });
      battles.push({ trainer: cfg.trainer?.id || cfg.trainer || null, species: cfg.wild?.species || null,
        outcome: result.outcome, turns: result.turns, megaEvolutions: result.megaEvolutions || [], caught: result.caught?.species || null });
      return result;
    });
    const choices = () => (engine.scenes.top?.items || []).map(i => typeof i === 'string' ? i : i.label || i.text);
    window.__b23 = { team, pilot, battles, choices, mode: (mode, probeBall = false) => { pilot.mode = mode; pilot.probeBall = probeBall; },
      snap: () => ({ vars: { ...s.data.vars }, bag: { ...s.data.bag }, money: s.player.money, heal: s.healPoint,
        health: s.party.map(p => ({ species: p.species, form: p.form, hp: p.hp, maxHP: maxHP(engine.data, p), heldItem: p.heldItem })),
        battles: battles.slice(), choices: choices(), keys: Object.keys(s.data.bag).filter(id => engine.data.items[id]?.pocket === 8),
        visible: window.__map.world.events.filter(e => e.page && e.characterName && !e.erased).map(e => e.id),
        caught: [...s.party, ...s.boxes.flat()].filter(Boolean).map(p => ({ species: p.species, form: p.form })),
      }),
    };
    window.__map.world.refreshEvents();
    window.__b16 = { eventPos: window.__e2e.eventPos };
  }, { carry, history });
}
