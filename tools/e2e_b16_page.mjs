// Ayudantes del recorrido E2E del Bloque 16 que se instalan DENTRO de la página (window.__b16), además de los de
// tools/e2e_b01_page.mjs (window.__e2e): piloto de combate (entrenadores y legendarios: luchar; salvajes: huir; una
// derrota simulada por etiqueta, p. ej. «azelf»), registro de los combates (reglas: huida, captura, Mochila sellada),
// estado (variables, objetos, Fragmentos, pistas, Zygarde, controles en espejo, ritual del Telar), posiciones de
// eventos, orillas para nadar, tierra más cercana, células añadidas a mano (variante sin células) y Vuelo con el
// destino elegido (el mapa regional se sustituye por la elección; el resto del Vuelo es el del juego).

export async function installB16Helpers(page, { loseOnce = [] } = {}) {
  await page.evaluate(async (lose) => {
    const [{ engine }, api, clues, hito, water] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/content/story/clueLogic.js'),
      import('/src/content/events/b16_hito.js'), import('/src/world/waterAccess.js'),
    ]);
    const pending = new Set(lose);
    const lost = [];
    const battles = [];
    const map = () => window.__map;
    const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
    const key = (x, y) => `${x},${y}`;

    const battleTag = (cfg) => {
      if (typeof cfg.trainer === 'string') return cfg.trainer;
      if (cfg.type === 'wild' && cfg.wild?.species === 'AZELF') return 'azelf';
      return null;
    };

    api.installBattle(async (cfg) => {
      const tag = battleTag(cfg);
      battles.push({
        tag, type: cfg.type, species: cfg.wild?.species ?? null, level: cfg.wild?.level ?? null, moves: cfg.wild?.moves ?? null,
        shiny: cfg.wild?.shiny ?? null, canRun: cfg.rules?.canRun ?? null, canCatch: cfg.rules?.canCatch ?? null,
        sealedBag: cfg.rules?.sealedBag ?? null, canLose: Boolean(cfg.canLose ?? cfg.rules?.canLose), noMoneyLoss: Boolean(cfg.rules?.noMoneyLoss),
      });
      if (tag && pending.has(tag)) {
        pending.delete(tag);
        lost.push(tag);
        return { outcome: 'lose', stored: true };
      }
      const legendary = cfg.type === 'wild' && (cfg.canLose || cfg.rules?.canRun === false);
      return api.startBattle({ ...cfg, auto: cfg.type === 'wild' && !legendary ? 'run' : 'fight' });
    });

    // Agua en la que se nada según el juego (no cuenta el puente de hielo, que se pisa a pie).
    const isWater = (x, y) => water.isSwimWater(map().world.map, x, y);
    /** ¿El juego ofrecería nadar desde (x, y) mirando a `d`? (misma regla que al pulsar A) */
    const offersSwim = (x, y, d) => {
      const w = map().world;
      const p = w.player;
      const save = [p.x, p.y, p.direction];
      try {
        p.x = x; p.y = y; p.direction = d;
        return water.canOfferSwim(w);
      } finally {
        [p.x, p.y, p.direction] = save;
      }
    };

    /** BFS con la pasabilidad real del jugador; `goal(x, y)` → { x, y, route } o null. `allow(x, y)` filtra casillas. */
    function bfs(goal, limit = 20000, allow = null) {
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
            if (!gm.valid(nx, ny) || prev.has(key(nx, ny)) || (allow && !allow(nx, ny))) continue;
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

    /** Casilla de tierra desde la que empezar a nadar hacia (tx, ty): { x, y, face } (agua más cercana al destino). */
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
            if (gm.valid(wx, wy) && isWater(wx, wy) && !isWater(x, y) && offersSwim(x, y, d)) {
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

    const eventOf = (id) => map()?.world?.events?.find((e) => e.id === id) || null;

    window.__b16 = {
      lost,
      battles,
      shoreFor,
      landRoute: () => bfs((x, y) => !isWater(x, y)),
      /** Ruta nadando sin pisar tierra hasta (tx, ty) (agua). */
      waterRoute: (tx, ty) => bfs((x, y) => x === tx && y === ty, 20000, (x, y) => isWater(x, y))?.route ?? null,
      surfing: () => Boolean(map()?.world?.player?.surfing),
      mirror: () => Boolean(map()?.world?.current?.def?.mirrorControls),
      ritual: () => (window.__b16Ritual ? { ...window.__b16Ritual } : null),
      boiling: () => hito.lakesBoiling(),
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      items: (id) => engine.state?.itemCount?.(id) ?? 0,
      fragments: () => [...(engine.state?.data?.fragments || [])],
      clue: (id) => clues.clueStatus(engine.state, id),
      zygarde: () => {
        const z = engine.state?.data?.zygarde || {};
        return { form: z.form ?? null, cells: (z.cells || []).length, fly: Boolean(z.abilities?.fly), rebuild: Boolean(z.abilities?.rebuild) };
      },
      gender: (g) => { engine.state.player.gender = g; return g; },
      addCells: (keys) => { for (const k of keys) engine.state.addCell(k); return engine.state.data.zygarde.cells.length; },
      choiceItems: () => [...(engine.scenes.top?.items || [])].map((i) => (typeof i === 'string' ? i : i?.label ?? i?.text ?? String(i))),
      eventAlive: (id) => {
        const ev = eventOf(id);
        return Boolean(ev && !ev.erased && ev.page);
      },
      eventPos: (id) => {
        const ev = eventOf(id);
        return ev ? { x: ev.x, y: ev.y, dir: ev.direction, moving: Boolean(ev.busy?.()), alive: Boolean(!ev.erased && ev.page) } : null;
      },
      tile: (x, y, l) => map()?.world?.map?.data?.(x, y, l) ?? null,
      walkable: (x, y) => Boolean(map()?.world?.map?.playerPassable?.(x, y, 2, {})),
      music: () => engine.audio?.nowPlaying?.()?.name ?? null,
      /** Vuelo con Zygarde hacia el lugar `pick` del atlas (sin abrir el mapa regional). No espera: se sondea el mapa. */
      fly: (pick) => {
        window.__b16Fly = { pick, done: false, result: null, error: null };
        map().runScript(async (ctx) => {
          try {
            const { runZygardeAction } = await import('/src/world/zygarde/actions.js');
            const c = Object.create(ctx);
            c.ui = { ...ctx.ui, openRegionMap: async () => pick };
            window.__b16Fly.result = await runZygardeAction(c, { action: 'fly' });
          } catch (err) {
            window.__b16Fly.error = String(err?.stack || err);
          } finally {
            window.__b16Fly.done = true;
          }
        }, null, 'e2e_vuelo');
        return true;
      },
      flyState: () => (window.__b16Fly ? { ...window.__b16Fly } : null),
    };
  }, loseOnce);
}
