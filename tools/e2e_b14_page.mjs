// Ayudantes del recorrido E2E del Bloque 14 que se instalan DENTRO de la página (window.__b14), además de los de
// tools/e2e_b01_page.mjs (window.__e2e): piloto de combate (entrenadores y Alfas: luchar; salvajes: huir; derrotas
// simuladas una vez por etiqueta: id de entrenador, «bramaluna_eco» o «bramaluna_real»), registro de los combates
// (reglas: huida y catchCondition), estado (variables, objetos, pistas, Fragmentos, medidor de buceo), orillas de
// Caleta Sonda (empezar a nadar / volver a tierra), respiradero más cercano y el planificador de sigilo contra la
// Bramaluna Alfa (BFS en el tiempo con su patrulla determinista: b14_bramaluna.js#patrolAt).

export async function installB14Helpers(page, { loseOnce = [], captureReal = false } = {}) {
  await page.evaluate(async ({ lose, captureReal }) => {
    const [{ engine }, api, bram, stealth, pkmn] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'),
      import('/src/content/events/b14_bramaluna.js'), import('/src/content/events/b01_north_stealth.js'),
      import('/src/battle/core/pokemon.js'),
    ]);
    const pending = new Set(lose);
    const lost = [];
    const battles = [];
    const map = () => window.__map;
    const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
    const key = (x, y) => `${x},${y}`;
    let originalTeam = null;
    if (captureReal) {
      // El motor consume una Ball normal de la mochila y aplica la captura a la partida.
      engine.state.addItem('MASTERBALL', 1);
      const { Autopilot } = await import('/src/battle/scene/autopilot.js');
      const originalItem = Autopilot.prototype.item;
      Autopilot.prototype.item = function (battler, ctx) {
        const ball = this.mode === 'ball' && ctx.bag.find((it) => it.id === 'MASTERBALL');
        return ball ? { item: ball.id, target: battler.partyIndex, move: -1 } : originalItem.call(this, battler, ctx);
      };
    }

    /** Etiqueta de un combate: id del entrenador o la Bramaluna (eco con captura desactivada / real). */
    function battleTag(cfg) {
      if (typeof cfg.trainer === 'string') return cfg.trainer;
      if (cfg.type === 'wild' && cfg.wild?.species === 'ROARINGMOON') return cfg.rules?.catchCondition ? 'bramaluna_eco' : 'bramaluna_real';
      return null;
    }

    api.installBattle(async (cfg) => {
      const tag = battleTag(cfg);
      let catchRule = null;
      try { catchRule = typeof cfg.rules?.catchCondition === 'function' ? cfg.rules.catchCondition() : null; } catch (err) { catchRule = { error: String(err) }; }
      const record = {
        tag, type: cfg.type, species: cfg.wild?.species ?? null, level: cfg.wild?.level ?? null, alpha: Boolean(cfg.wild?.alpha),
        ability: cfg.wild?.ability ?? null, item: cfg.wild?.heldItem ?? cfg.wild?.item ?? null, moves: cfg.wild?.moves ?? null,
        canRun: cfg.rules?.canRun ?? null, canLose: Boolean(cfg.canLose ?? cfg.rules?.canLose), catchRule,
      };
      battles.push(record);
      if (tag && pending.has(tag)) {
        pending.delete(tag);
        lost.push(tag);
        return { outcome: 'lose', stored: true };
      }
      const alpha = cfg.type === 'wild' && cfg.wild?.alpha;
      const auto = captureReal && tag === 'bramaluna_real' ? 'ball' : cfg.type === 'wild' && !alpha ? 'run' : 'fight';
      const result = await api.startBattle({ ...cfg, auto });
      Object.assign(record, { outcome: result?.outcome, turns: result?.turns, stored: result?.stored });
      return result;
    });

    // ── Sigilo: casillas que ve la Bramaluna en cada estado (con la pasabilidad real del mapa) ──
    function sightCells(ev, x, y, dir, cache) {
      const k = `${x},${y},${dir}`;
      if (cache.has(k)) return cache.get(k);
      const p = map().world.player;
      const save = [ev.x, ev.y, ev.direction, p.x, p.y];
      let n = 0;
      try {
        ev.x = x; ev.y = y; ev.direction = dir; p.x = -50; p.y = -50;
        n = stealth.sightReach(ev, bram.SIGHT);
      } finally {
        [ev.x, ev.y, ev.direction, p.x, p.y] = save;
      }
      // canReachPlayer no comprueba la casilla del propio jugador: la siguiente al bloqueo también se ve.
      const cells = new Set([key(x, y)]);
      for (let i = 1; i <= Math.min(n + 1, bram.SIGHT); i++) cells.add(key(x + DV[dir][0] * i, y + DV[dir][1] * i));
      cache.set(k, cells);
      return cells;
    }

    /**
     * Siguiente acción segura hacia una de las casillas `goals` ([[x, y], …]) con el reloj de la patrulla:
     * 2/4/6/8, 0 (esperar) o null (sin plan). `hold` = fotogramas que la meta debe seguir sin vigilancia al llegar
     * (para hablar o golpear la caracola); `step` = fotogramas por casilla; `margin` = colchón de latencia.
     */
    function stealthNext(goals, { step = 16, margin = 16, hold = 150, horizon = 2600 } = {}) {
      const m = map();
      const mapId = m.world.map.id;
      const ev = m.world.events.find((e) => e.id === `bramaluna_${mapId}`);
      if (!ev || ev.erased || !ev.page) return null;
      const p = m.world.player;
      const gm = m.world.map;
      const cache = new Map();
      const watched = (k, f0, f1) => {
        for (let f = f0; f <= f1; f += 4) {
          const st = bram.patrolAt(mapId, f);
          if (sightCells(ev, st.x, st.y, st.dir, cache).has(k) || sightCells(ev, st.from.x, st.from.y, st.dir, cache).has(k)) return true;
        }
        return false;
      };
      const goalSet = new Set(goals.map(([x, y]) => key(x, y)));
      const t0 = m.frame;
      const px = p.x; const py = p.y;
      const seen = new Set();
      const queue = [{ x: px, y: py, t: t0, first: null }];
      try {
        while (queue.length) {
          const cur = queue.shift();
          if (cur.t - t0 > horizon) continue;
          if (goalSet.has(key(cur.x, cur.y)) && !watched(key(cur.x, cur.y), cur.t, cur.t + hold)) return cur.first ?? 0;
          const moves = [[0, cur.x, cur.y]];
          for (const d of [2, 4, 6, 8]) {
            const nx = cur.x + DV[d][0]; const ny = cur.y + DV[d][1];
            if (!gm.valid(nx, ny)) continue;
            p.x = cur.x; p.y = cur.y;
            if (!p.passable(cur.x, cur.y, d)) continue;
            moves.push([d, nx, ny]);
          }
          for (const [d, nx, ny] of moves) {
            const nt = cur.t + step;
            if (watched(key(cur.x, cur.y), cur.t, nt + margin) || watched(key(nx, ny), cur.t, nt + margin)) continue;
            const vk = `${nx},${ny},${Math.floor((nt - t0) / step)}`;
            if (seen.has(vk)) continue;
            seen.add(vk);
            queue.push({ x: nx, y: ny, t: nt, first: cur.first ?? d });
          }
        }
      } finally {
        p.x = px; p.y = py;
      }
      return null;
    }

    // ── Buceo y orillas ──
    const isWater = (x, y) => Boolean(map().world.map.terrainTagAt(x, y)?.canSurf);

    /** BFS con la pasabilidad real del jugador; `goal(x, y)` → ruta (direcciones) o null. */
    function bfs(goal, limit = 20000) {
      const m = map();
      const p = m.world.player;
      const gm = m.world.map;
      const px = p.x; const py = p.y;
      const prev = new Map([[key(px, py), null]]);
      const q = [[px, py]];
      try {
        while (q.length && prev.size < limit) {
          const [x, y] = q.shift();
          if (goal(x, y) && !(x === px && y === py)) {
            const out = [];
            let k = key(x, y);
            while (prev.get(k)) { const [pk, d] = prev.get(k); out.unshift(d); k = pk; }
            return { x, y, route: out };
          }
          for (const d of [2, 4, 6, 8]) {
            const nx = x + DV[d][0]; const ny = y + DV[d][1];
            if (!gm.valid(nx, ny) || prev.has(key(nx, ny))) continue;
            p.x = x; p.y = y;
            if (!p.passable(x, y, d)) continue;
            prev.set(key(nx, ny), [key(x, y), d]);
            q.push([nx, ny]);
          }
        }
      } finally {
        p.x = px; p.y = py;
      }
      return null;
    }

    /** Casilla de tierra desde la que empezar a nadar hacia (tx, ty): { x, y, face } (la más cercana al destino). */
    function shoreFor(tx, ty) {
      const m = map();
      const p = m.world.player;
      const gm = m.world.map;
      const px = p.x; const py = p.y;
      const seen = new Set([key(px, py)]);
      const q = [[px, py]];
      let best = null;
      try {
        while (q.length) {
          const [x, y] = q.shift();
          for (const d of [2, 4, 6, 8]) {
            const wx = x + DV[d][0]; const wy = y + DV[d][1];
            if (gm.valid(wx, wy) && isWater(wx, wy) && !isWater(x, y)) {
              const score = Math.abs(wx - tx) + Math.abs(wy - ty);
              if (!best || score < best.score) best = { x, y, face: d, score };
            }
          }
          for (const d of [2, 4, 6, 8]) {
            const nx = x + DV[d][0]; const ny = y + DV[d][1];
            if (!gm.valid(nx, ny) || seen.has(key(nx, ny))) continue;
            p.x = x; p.y = y;
            if (!p.passable(x, y, d)) continue;
            seen.add(key(nx, ny));
            q.push([nx, ny]);
          }
        }
      } finally {
        p.x = px; p.y = py;
      }
      return best;
    }

    /** Respiraderos (diveVent) con página activa del mapa actual. */
    const vents = () => (map()?.world?.events || []).filter((e) => !e.erased && e.page && e.def?.type === 'diveVent').map((e) => [e.x, e.y]);

    window.__b14 = {
      lost,
      battles,
      stealthNext,
      patrol: () => {
        const id = map()?.world?.map?.id;
        try { return id ? { ...bram.patrolAt(id, map().frame), frame: map().frame } : null; } catch { return null; }
      },
      shoreFor,
      /** Ruta a la casilla de tierra más cercana (nadando). */
      landRoute: () => bfs((x, y) => !isWater(x, y)),
      /** Ruta al respiradero más cercano (o null). */
      ventRoute: () => { const vs = new Set(vents().map(([x, y]) => key(x, y))); return vs.size ? bfs((x, y) => vs.has(key(x, y))) : null; },
      dive: () => {
        const d = map()?.zygarde?.dive;
        return d ? { segments: d.meter.segments, max: d.meter.max, vent: d.vent ? { ...d.vent } : null } : null;
      },
      surfing: () => Boolean(map()?.world?.player?.surfing),
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      items: (id) => engine.state?.itemCount?.(id) ?? 0,
      hasClue: (id) => Boolean(engine.state?.hasClue?.(id)),
      fragments: () => [...(engine.state?.data?.fragments || [])],
      money: () => engine.state?.player?.money ?? null,
      captured: () => [...engine.state.party, ...engine.state.boxes.flat()].filter(Boolean).map((p) => p.species),
      health: () => engine.state.party.map((p) => ({ hp: p.hp, maxHP: pkmn.maxHP(engine.data, p) })),
      realLossTeam: () => {
        originalTeam = engine.state.party;
        const weak = pkmn.createPokemon(engine.data, 'MAGIKARP', 1, { moves: ['SPLASH'], rng: () => 0.5 });
        engine.state.setParty([{ ...weak, hp: 1 }]);
        return true;
      },
      restoreTeam: () => {
        if (!originalTeam) throw new Error('No hay equipo anterior al intento de derrota');
        engine.state.setParty(originalTeam.map((p) => pkmn.healed(engine.data, p)));
        originalTeam = null;
      },
      choiceItems: () => [...(engine.scenes.top?.items || [])].map((i) => (typeof i === 'string' ? i : i?.label ?? i?.text ?? String(i))),
      /** La ventana de elección ya existe (ChoiceScene#enter es asíncrono: antes, las teclas se pierden). */
      choiceReady: () => Boolean(engine.scenes.top?.win),
      eventAlive: (id) => {
        const ev = map()?.world?.events?.find((e) => e.id === id);
        return Boolean(ev && !ev.erased && ev.page);
      },
      eventPos: (id) => {
        const ev = map()?.world?.events?.find((e) => e.id === id);
        return ev ? { x: ev.x, y: ev.y, dir: ev.direction, opacity: ev.opacity, alive: Boolean(!ev.erased && ev.page), sprite: ev.characterName || null } : null;
      },
      music: () => engine.audio?.nowPlaying?.()?.name ?? null,
      /** Cura al equipo (como haría un jugador con pociones antes de un jefe: el piloto no usa la Mochila). */
      heal: () => {
        const st = engine.state;
        if (!st?.party?.length) return false;
        st.setParty(st.party.map((p) => pkmn.healed(engine.data, p)));
        return true;
      },
      /**
       * Movimientos del Pokémon `index` del equipo (el piloto automático usa siempre el primer movimiento de daño:
       * se le deja uno eficaz delante, como haría un jugador antes de un jefe).
       */
      setMoves: (index, ids) => {
        const st = engine.state;
        const pk = st?.party?.[index];
        const db = engine.data?.moves || {};
        const moves = ids.filter((id) => db[id]).map((id) => ({ id, pp: db[id].pp, ppUps: 0 }));
        if (!pk || !moves.length) return false;
        st.setPartyMember(index, { ...pk, moves });
        return moves.map((m) => m.id);
      },
    };
  }, { lose: loseOnce, captureReal });
}
