import { installHelpers } from './e2e_b01_page.mjs';
import { installB12Helpers } from './e2e_b12_page.mjs';

export async function installB22aHelpers(page, { mode = 'capture', lead = 'BLISSEY' } = {}) {
  await installHelpers(page);
  await installB12Helpers(page);
  await page.evaluate(async (opts) => {
    const [{ engine }, api, { Autopilot }, { createPokemon }, { CAMPAIGN_TABLETS }] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/battle/scene/autopilot.js'),
      import('/src/battle/core/pokemon.js'), import('/src/content/story/tablets.js'),
    ]);
    const battles = [];
    const pilot = { mode: opts.mode, early: false };
    const currentBattle = () => engine.scenes.stack.map((e) => e.scene).find((s) => s?.battle)?.battle;
    const oldAction = Autopilot.prototype.action;
    Autopilot.prototype.action = function (battler, ctx, bag) {
      const b = currentBattle();
      if (!b || !ctx.wild) return oldAction.call(this, battler, ctx, bag);
      if (pilot.mode === 'lose') { b.decision = 2; return 'fight'; }
      const foe = b.battlers[1];
      if (foe.pokemon.species === 'GIRATINA') {
        if (!pilot.early) { this.wantBall = 'POKEBALL'; return 'bag'; }
        if (b.turnCount < 2) return 'fight';
      }
      if (foe.pokemon.species === 'ARCEUS' && foe.hp * 2 >= foe.totalhp) return 'fight';
      this.wantBall = 'MASTERBALL';
      return 'bag';
    };
    Autopilot.prototype.item = function (battler) {
      const ball = this.wantBall;
      this.wantBall = null;
      if (!ball) return null;
      if (ball === 'POKEBALL') pilot.early = true;
      return { item: ball, target: battler.partyIndex, move: -1 };
    };
    const oldMove = Autopilot.prototype.move;
    Autopilot.prototype.move = function (battler, moves, ctx) {
      const b = currentBattle();
      const want = b?.battlers[1]?.pokemon?.species === 'GIRATINA' ? 'SOFTBOILED' : 'PSYCHIC';
      const pick = moves.find((m) => m.id === want && m.selectable !== false);
      return pick ? { index: pick.index, mega: false } : oldMove.call(this, battler, moves, ctx);
    };
    api.installBattle(async (cfg) => {
      const outcome = await api.startBattle({ ...cfg, auto: 'fight' });
      battles.push({ species: cfg.wild?.species, outcome });
      return outcome;
    });
    const normalRoute = window.__e2e.route;
    window.__e2e.route = (x, y, o) => window.__map?.world.current?.def?.impossible
      ? window.__b12.safeRoute(x, y, o) : normalRoute(x, y, o);
    window.__b16 = { eventPos: window.__e2e.eventPos };
    const s = engine.state;
    s.setOptions({ textSpeed: 3 });
    const leadMoves = opts.lead === 'BLISSEY' ? ['SOFTBOILED', 'PSYCHIC'] : ['PSYCHIC', 'RECOVER'];
    s.setParty([createPokemon(engine.data, opts.lead, 100, { moves: leadMoves, rng: () => 0.5 }),
      createPokemon(engine.data, 'DIALGA', 75, { rng: () => 0.5 })]);
    s.obtainPokedex();
    for (const id of ['POKEDEXAXIS', 'CLUENOTEBOOK', 'ZYGARDECUBE', 'REDCHAIN', 'GLYPHKEY', 'AZUREFLUTE']) s.addKeyItem(id);
    for (const t of CAMPAIGN_TABLETS) { s.addTablet(t.id); s.addItem(t.id); }
    for (const id of ['LUSTROUSORB', 'ADAMANTORB']) s.addItem(id);
    s.addItem('POKEBALL', 3);
    s.addItem('MASTERBALL', 10);
    window.__map?.refreshFollower?.();
    window.__b22a = {
      battles, pilot,
      mode: (m) => { pilot.mode = m; pilot.early = false; },
      choices: () => [...(engine.scenes.top?.items || [])].map((i) => typeof i === 'string' ? i : i.label || i.text),
      rotor: (id) => window.__map?.world.events.find((e) => e.id === `b22a_rotor_${id}`)?.b22a?.phase ?? 0,
    };
  }, { mode, lead });
}
