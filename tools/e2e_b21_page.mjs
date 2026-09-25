// Ayudantes del recorrido E2E del Bloque 21 que se instalan DENTRO de la página (window.__b21), además de los de
// tools/e2e_b01_page.mjs (window.__e2e):
//   · setup(): estado de entrada «p10_restored + b20_flute» que la URL no puede fijar (Flauta Azur, Arca, Clave Glífica,
//     las quince Tablillas, equipo de seis con movimientos elegidos, Balls y Master Ball).
//   · Piloto del combate de Arceus (parche del Autopilot de la escena): movimiento eficaz por fase, una Poké Ball en la
//     fase 1 (debe rebotar sin gastarse), una derrota forzada en la fase indicada (Reintentar/Retirarse) y la Master Ball
//     cuando Arceus suelta la Tabla Legendaria.
//   · Menú obligatorio del Arca: la pantalla de equipo se sustituye por una lista de elecciones (primero «cancelar»).
//   · Estado: variables, objetos, Tablillas, equipo y cajas, Zygarde, reloj, crisis, eventos, salto en curso.

export async function installB21Helpers(page, { forfeitAt = null, partyPicks = [null, 3], creditsSpeed = 8 } = {}) {
  await page.evaluate(async (opts) => {
    const [{ engine }, api, { Autopilot }, { ui }, pokemon, crisis, tablets, texts] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/battle/scene/autopilot.js'),
      import('/src/ui/api.js'), import('/src/battle/core/pokemon.js'), import('/src/content/story/crisis.js'),
      import('/src/content/story/tablets.js'), import('/src/content/events/b21_texts.js'),
    ]);
    // Registro del Salto en el Nodo del Origen de B20 (en el juego lo hace el mapa nucleo_origen al importarlo).
    await import('/src/content/events/b21_salto.js');
    globalThis.__b21CreditsSpeed = opts.creditsSpeed;
    const map = () => window.__map;
    const battles = [];
    const pilot = { forfeitAt: opts.forfeitAt, forfeited: false, earlyBall: 'POKEBALL', earlyDone: false, finalDone: false, log: [] };
    const PHASE_MOVE = ['SURF', 'DARKPULSE', 'AURASPHERE'];
    const FORM_PHASE = { 4: 0, 7: 1, 0: 2 };
    const arceusBattle = () => {
      const b = engine.scenes.stack.map((e) => e.scene).find((s) => s?.battle)?.battle;
      const foe = b?.battlers?.[1];
      return foe?.pokemon?.species === 'ARCEUS' ? b : null;
    };
    const phaseOf = (b) => FORM_PHASE[b.battlers[1]?.pokemon?.form ?? 0] ?? 2;

    const action = Autopilot.prototype.action;
    Autopilot.prototype.action = function patched(battler, ctx, bag) {
      const b = arceusBattle();
      if (!b) return action.call(this, battler, ctx, bag);
      const ph = phaseOf(b);
      if (pilot.forfeitAt === ph && !pilot.forfeited) {
        pilot.forfeited = true;
        pilot.log.push(`derrota forzada en la fase ${ph}`);
        b.decision = 2;
        return 'fight';
      }
      if (ph === 0 && !pilot.earlyDone) { this.wantBall = pilot.earlyBall; return 'bag'; }
      if (ph === 2 && b.b21LegendDropped && !pilot.finalDone) { this.wantBall = 'MASTERBALL'; return 'bag'; }
      return 'fight';
    };
    const item = Autopilot.prototype.item;
    Autopilot.prototype.item = function patched(battler, ctx) {
      const b = arceusBattle();
      if (!b) return item.call(this, battler, ctx);
      if (!this.wantBall) return null; // la Ball rebotó: se cierra la Mochila como haría un jugador
      const ball = this.wantBall;
      this.wantBall = null;
      if (ball === 'MASTERBALL') pilot.finalDone = true; else pilot.earlyDone = true;
      pilot.log.push(`Ball ${ball} en la fase ${phaseOf(b)} (bolsa ${b.bag[ball] || 0})`);
      return { item: ball, target: battler.partyIndex, move: -1 };
    };
    const move = Autopilot.prototype.move;
    Autopilot.prototype.move = function patched(battler, moves, ctx) {
      const b = arceusBattle();
      if (!b) return move.call(this, battler, moves, ctx);
      const want = PHASE_MOVE[phaseOf(b)];
      const m = moves.find((x) => x.id === want && x.selectable !== false);
      return m ? { index: m.index, mega: false } : move.call(this, battler, moves, ctx);
    };

    api.installBattle(async (cfg) => {
      battles.push({ species: cfg.wild?.species ?? null, form: cfg.wild?.form ?? null, canRun: cfg.rules?.canRun ?? null, canLose: Boolean(cfg.canLose), phases: (cfg.phases || []).length, bgm: cfg.bgm, battleback: cfg.battleback });
      return api.startBattle({ ...cfg, auto: 'fight' });
    });

    // Menú obligatorio del Arca: elecciones fijadas (null = cancelar, que debe volver a abrirse).
    const picks = [...opts.partyPicks];
    const openParty = ui.openParty.bind(ui);
    ui.openParty = async (o = {}) => {
      if (o.message === texts.ZYGARDE_TEXT.pick && picks.length) return picks.shift();
      return openParty(o);
    };

    const PARTY = [
      ['MEWTWO', 100, ['SURF', 'DARKPULSE', 'AURASPHERE', 'RECOVER']],
      ['MEWTWO', 100, ['SURF', 'DARKPULSE', 'AURASPHERE', 'RECOVER']],
      ['GARCHOMP', 80, ['EARTHQUAKE', 'DRAGONCLAW', 'CRUNCH', 'SWORDSDANCE']],
      ['LUCARIO', 76, ['AURASPHERE', 'CLOSECOMBAT', 'DARKPULSE', 'EXTREMESPEED']],
      ['STARAPTOR', 75, ['BRAVEBIRD', 'CLOSECOMBAT', 'UTURN', 'QUICKATTACK']],
      ['TORTERRA', 75, ['WOODHAMMER', 'EARTHQUAKE', 'STONEEDGE', 'CRUNCH']],
    ];

    window.__b21 = {
      battles,
      pilot,
      setup: () => {
        const st = engine.state;
        const ot = { name: st.player.name, id: st.player.id };
        st.setParty(PARTY.map(([sp, lv, mv]) => pokemon.createPokemon(engine.data, sp, lv, { moves: mv, ot, shiny: false, ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } })));
        for (const k of ['AZUREFLUTE', 'ZYGARDECUBE', 'GLYPHKEY', 'POKEDEXAXIS', 'CLUENOTEBOOK', 'REDCHAIN']) st.addKeyItem(k);
        st.obtainPokedex?.();
        for (const t of tablets.CAMPAIGN_TABLETS) { st.addTablet(t.id); if (!st.hasItem(t.id)) st.addItem(t.id, 1); }
        st.addItem('POKEBALL', 10);
        st.addItem('MASTERBALL', 1);
        st.addItem('FULLRESTORE', 3);
        map()?.refreshFollower?.();
        return st.party.length;
      },
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      items: (id) => engine.state?.itemCount?.(id) ?? 0,
      tablets: () => [...(engine.state?.data?.tablets || [])],
      party: () => (engine.state?.party || []).map((p) => ({ species: p.species, form: p.form, level: p.level, ball: p.ball, ability: p.ability, egg: Boolean(p.egg), hp: p.hp, moves: p.moves.map((m) => m.id) })),
      boxed: () => (engine.state?.data?.boxes || []).flat().filter(Boolean).map((p) => p.species),
      /** Como hacerlo en un PC: deja al Pokémon `i` del equipo en la caja 1. */
      deposit: (i) => { engine.state.depositPokemon(i, 0); return engine.state.party.length; },
      zygarde: () => ({ form: engine.state?.zygardeForm ?? null, jump: Boolean(engine.state?.zygardeAbility?.('jump')), anchor: Boolean(engine.state?.zygardeAbility?.('anchor')) }),
      clock: () => engine.state?.data?.clock?.minutes ?? null,
      crisis: () => crisis.crisisPhase(engine.state),
      jumping: () => Boolean(map()?.zygarde?.jump),
      cinematic: () => Boolean(map()?.cinematic),
      eventPos: (id) => {
        const ev = map()?.world?.events?.find((e) => e.id === id);
        return ev ? { x: ev.x, y: ev.y, alive: Boolean(!ev.erased && ev.page) } : null;
      },
      choiceItems: () => [...(engine.scenes.top?.items || [])].map((i) => (typeof i === 'string' ? i : i?.label ?? i?.text ?? String(i))),
      mapHas: (id) => Boolean(window.__mapsRegistered?.[id]),
    };
    const { MAPS } = await import('/src/content/maps/index.js');
    window.__mapsRegistered = Object.fromEntries(Object.keys(MAPS).map((k) => [k, true]));
  }, { forfeitAt, partyPicks, creditsSpeed });
}
