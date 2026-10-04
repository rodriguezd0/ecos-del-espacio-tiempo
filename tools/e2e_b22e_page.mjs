// Decisiones de prueba sobre combates REALES; nunca sustituye el resultado del Bastión.
export async function installBastionHelpers(page) {
  await page.evaluate(async () => {
    const [{ engine }, api, { Autopilot }, { createPokemon }, { scoreMoves }, { SceneBattleUI }] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/battle/scene/autopilot.js'),
      import('/src/battle/core/pokemon.js'), import('/src/battle/core/ai/aiMoves.js'),
      import('/src/battle/scene/sceneUI.js'),
    ]);
    const battles = [], requests = [], bagProof = { pending: true, waiting: false, choice: null, notice: false };
    const current = () => engine.scenes.stack.map((e) => e.scene).find((s) => s?.battle)?.battle;
    const oldMove = Autopilot.prototype.move;
    const oldAction = SceneBattleUI.prototype.chooseAction, oldMessage = SceneBattleUI.prototype.message;
    SceneBattleUI.prototype.chooseAction = async function (battler, ctx) {
      if (!bagProof.pending || !this.battle?.rules.sealedBag) return oldAction.call(this, battler, ctx);
      bagProof.pending = false; bagProof.waiting = true;
      const auto = this.auto; this.auto = null;
      try { return bagProof.choice = await oldAction.call(this, battler, ctx); }
      finally { this.auto = auto; bagProof.waiting = false; }
    };
    SceneBattleUI.prototype.message = function (text, opts) {
      if (text.includes('En el Bastión no se usan objetos de la Mochila.')) bagProof.notice = true;
      return oldMessage.call(this, text, opts);
    };
    Autopilot.prototype.move = function (battler, moves, ctx) {
      const battle = current();
      if (!battle || ctx.wild) return oldMove.call(this, battler, moves, ctx);
      const options = scoreMoves(battle.ai, battle.battlers[battler.index], 100)
        .filter((p) => moves.some((m) => m.index === p.moveIndex && m.selectable !== false));
      const pick = options.sort((a, b) => b.score - a.score)[0];
      return pick ? { index: pick.moveIndex, mega: Boolean(ctx.canMega) } : oldMove.call(this, battler, moves, ctx);
    };
    api.installBattle(async (cfg) => {
      requests.push({ exhibition: cfg.exhibition, player: cfg.player.party.map((p) => ({ level: p.level, hp: p.hp, status: p.status })), rules: cfg.rules });
      const result = await api.startBattle({ ...cfg, auto: 'fight' });
      battles.push({ outcome: result.outcome, turns: result.turns });
      return result;
    });
    const s = engine.state, db = engine.data;
    const setVar = s.setVar.bind(s);
    s.setVar = (id, value) => setVar(id, id === 'b22e_bastion_semilla' ? 2026 : value);
    const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    const p = (species, moves, item, evs, nature) => createPokemon(db, species, 80, {
      moves, heldItem: item, ivs, evs, nature, rng: () => 0.5,
    });
    s.setParty([
      p('MEWTWO', ['PSYSTRIKE', 'AURASPHERE', 'ICEBEAM', 'FLAMETHROWER'], 'MEWTWONITEY', { spa: 252, spe: 252, hp: 4 }, 'TIMID'),
      p('KYOGRE', ['WATERSPOUT', 'ORIGINPULSE', 'THUNDER', 'ICEBEAM'], 'BLUEORB', { spa: 252, spe: 252, hp: 4 }, 'MODEST'),
      p('GROUDON', ['PRECIPICEBLADES', 'FIREPUNCH', 'STONEEDGE', 'DRAGONCLAW'], 'REDORB', { atk: 252, spe: 252, hp: 4 }, 'ADAMANT'),
    ]);
    s.party[0].hp = 17; s.party[0].status = 'BURN'; s.party[0].moves[0].pp = 0;
    s.addKeyItem('MEGARING');
    const snapshot = () => ({ party: JSON.stringify(s.party), bag: JSON.stringify(s.data.bag), money: s.player.money, heal: JSON.stringify(s.healPoint) });
    const before = snapshot();
    window.__bastion = {
      battles, requests, before, snapshot, bagProof,
      weak: () => {
        s.setParty(Array.from({ length: 3 }, () => createPokemon(db, 'MAGIKARP', 1, { moves: ['SPLASH'], rng: () => 0.5 })));
        window.__map.refreshFollower();
        return snapshot();
      },
    };
    window.__map.refreshFollower();
  });
}
