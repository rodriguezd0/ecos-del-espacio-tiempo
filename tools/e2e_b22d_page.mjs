// Fixtures y piloto de decisiones; captura, daño, KO, derrota y Mochila usan el motor real.
import { installHelpers } from './e2e_b01_page.mjs';
import { installB16Helpers } from './e2e_b16_page.mjs';

export async function installB22dHelpers(page, { carry = null, battles = [], mode = 'capture' } = {}) {
  await installHelpers(page);
  await installB16Helpers(page);
  await page.evaluate(async ({ carry, battles, mode }) => {
    const [{ engine }, api, { Autopilot }, { createPokemon, maxHP }] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/battle/scene/autopilot.js'), import('/src/battle/core/pokemon.js'),
    ]);
    const s = engine.state;
    if (carry) {
      const position = { mapId: s.player.mapId, x: s.player.x, y: s.player.y, dir: s.player.dir };
      s.data = carry; Object.assign(s.player, position);
    }
    const team = (list) => {
      for (const p of s.party) if (s.data.dex.caught[p.species]) {
        const box = s.boxes.findIndex((b) => b.includes(null));
        if (box < 0) throw new Error('PC lleno en el fixture B22d');
        s.setBoxPokemon(box, s.boxes[box].indexOf(null), p);
      }
      s.setParty(list.map(([species, level, moves]) => createPokemon(engine.data, species, level, { moves, rng: () => 0.5 })));
      window.__map?.refreshFollower?.();
    };
    const combatTeam = () => team([['MEWTWO', 100, ['SHADOWBALL', 'AURASPHERE', 'PSYCHIC', 'DAZZLINGGLEAM']]]);
    if (!carry) {
      combatTeam(); s.obtainPokedex();
      for (const id of ['ZYGARDECUBE', 'CLUENOTEBOOK', 'GLYPHKEY']) s.addKeyItem(id);
      s.addItem('MASTERBALL', 32); s.addItem('POKEBALL', 3);
      s.setHealPoint('brontia_centro', 9, 7, 8); s.data.clock.minutes = 11 * 60;
    }
    s.setOptions({ textSpeed: 3 });
    const pilot = { mode }; const tried = new WeakSet();
    const current = () => engine.scenes.stack.map((e) => e.scene).find((x) => x?.battle)?.battle;
    const action = Autopilot.prototype.action, item = Autopilot.prototype.item, move = Autopilot.prototype.move;
    Autopilot.prototype.action = function (battler, ctx, bag) {
      const b = current();
      if (!ctx.wild || !b) return action.call(this, battler, ctx, bag);
      if (b.rules.canCatch === false) {
        if (!tried.has(b)) { tried.add(b); this.wantBall = 'MASTERBALL'; return 'bag'; }
        return 'fight';
      }
      if (pilot.mode === 'capture') { this.wantBall = 'MASTERBALL'; return 'bag'; }
      return 'fight';
    };
    Autopilot.prototype.item = function (battler, ctx) {
      if (!this.wantBall) return item.call(this, battler, ctx);
      const wanted = this.wantBall; this.wantBall = null;
      return { item: wanted, target: battler.partyIndex, move: -1 };
    };
    Autopilot.prototype.move = function (battler, moves, ctx) {
      const b = current();
      const target = pilot.mode === 'lose' ? 'SPLASH' : b?.battlers[1]?.pokemon?.species === 'DARKRAI' ? 'AURASPHERE' : 'SHADOWBALL';
      const pick = moves.find((m) => m.id === target && m.selectable !== false);
      return pick ? { index: pick.index, mega: false } : move.call(this, battler, moves, ctx);
    };
    api.installBattle(async (cfg) => {
      if (pilot.mode === 'lose') team([['MAGIKARP', 1, ['SPLASH']]]);
      const outcome = await api.startBattle({ ...cfg, player: { ...cfg.player, party: s.party }, auto: 'fight', seed: 2214 });
      battles.push({ species: cfg.wild?.species, level: cfg.wild?.level, mode: pilot.mode, prototype: cfg.rules?.canCatch === false, outcome: outcome.outcome });
      return outcome;
    });
    const regiParty = () => {
      combatTeam();
      for (const species of ['REGIROCK', 'REGICE', 'REGISTEEL']) {
        const bi = s.boxes.findIndex((box) => box.some((p) => p?.species === species));
        if (bi < 0) throw new Error(`Falta la captura real ${species}`);
        const pi = s.boxes[bi].findIndex((p) => p?.species === species); const pk = s.boxes[bi][pi];
        s.setBoxPokemon(bi, pi, null); s.addPokemon(pk);
      }
      window.__map?.refreshFollower?.();
    };
    window.__b16 = { ...window.__b16, eventPos: window.__e2e.eventPos };
    window.__map.world.refreshEvents();
    window.__b22d = {
      team, combatTeam, regiParty, battles, pilot, mode: (m) => { pilot.mode = m; },
      choices: () => [...(engine.scenes.top?.items || [])].map((i) => typeof i === 'string' ? i : i.label || i.text),
      night: () => { s.data.clock.minutes = 22 * 60; window.__map.world.refreshEvents(); },
      seen: (n) => { for (const species of Object.keys(engine.data.species).slice(0, n)) s.registerSeen(species); window.__map.world.refreshEvents(); },
      snap: () => ({ vars: { ...s.data.vars }, bag: { ...s.data.bag }, battles: battles.slice(), money: s.player.money, heal: s.healPoint,
        hour: s.hour, surfing: Boolean(window.__map.world.player.surfing), caught: [...s.party, ...s.boxes.flat()].filter(Boolean).map((p) => p.species),
        health: s.party.map((p) => ({ species: p.species, hp: p.hp, maxHP: maxHP(engine.data, p) })),
        active: window.__map.world.events.filter((e) => e.page).map((e) => e.id),
      }),
    };
  }, { carry, battles, mode });
}
