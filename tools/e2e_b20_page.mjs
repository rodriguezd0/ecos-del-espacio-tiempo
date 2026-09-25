// Ayudantes del recorrido E2E del Bloque 20 que se instalan DENTRO de la página (window.__b20), además de los de
// tools/e2e_b01_page.mjs (window.__e2e) y tools/e2e_b16_page.mjs (window.__b16: orillas, nado, estado): piloto de
// combate con derrotas simuladas por etiqueta (Trío: 'tornadus' | 'thundurus' | 'landorus'; Gael: su id de entrenador),
// rutas a pie que no pisan el vacío del espacio imposible ni las trampas/ráfagas del bloque, Tablillas y datos de estado.

export async function installB20Helpers(page, { loseOnce = [] } = {}) {
  await page.evaluate(async (lose) => {
    const [{ engine }, api, impossible] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/world/impossible/logic.js'),
    ]);
    const pending = new Set(lose);
    const b16 = window.__b16;
    const map = () => window.__map;
    const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
    const key = (x, y) => `${x},${y}`;

    const battleTag = (cfg) => {
      if (typeof cfg.trainer === 'string') return cfg.trainer;
      if (cfg.type === 'wild' && cfg.wild?.species) return String(cfg.wild.species).toLowerCase();
      return null;
    };
    api.installBattle(async (cfg) => {
      const tag = battleTag(cfg);
      const catchRule = typeof cfg.rules?.catchCondition === 'function' ? cfg.rules.catchCondition() : null;
      b16.battles.push({
        tag, type: cfg.type, species: cfg.wild?.species ?? null, level: cfg.wild?.level ?? null, moves: cfg.wild?.moves ?? null,
        canRun: cfg.rules?.canRun ?? null, canCatch: cfg.rules?.canCatch ?? null, catchReason: catchRule?.reason ?? null,
        bgm: cfg.bgm ?? null, canLose: Boolean(cfg.canLose ?? cfg.rules?.canLose), noMoneyLoss: Boolean(cfg.rules?.noMoneyLoss),
      });
      if (tag && pending.has(tag)) {
        pending.delete(tag);
        b16.lost.push(tag);
        return { outcome: 'lose', stored: true };
      }
      const boss = cfg.type === 'wild' && (cfg.canLose || cfg.rules?.canRun === false);
      return api.startBattle({ ...cfg, auto: cfg.type === 'wild' && !boss ? 'run' : 'fight' });
    });

    /** Casillas que las rutas no pisan: vacío del espacio imposible y eventos que disparan algo al pisarlos. */
    function avoidSet(avoid) {
      const out = new Set();
      const w = map().world;
      for (const ev of w.events) {
        if (ev.erased || !ev.page) continue;
        if (avoid.test(String(ev.id))) out.add(key(ev.x, ev.y));
      }
      return out;
    }

    /** Ruta más corta a (tx, ty) (o a su lado) con la pasabilidad real. → direcciones 2/4/6/8 o null */
    function route(tx, ty, { onto = true, avoid = '^(t5_trampa|t3_rafaga|t9_pliegue|t9_corriente|trio_.*_franja|puerta_sima|t6_vuelta|cielo_vuelta)' } = {}) {
      const m = map();
      const w = m.world;
      const gm = w.map;
      const p = w.player;
      const impossibleMap = Boolean(w.current?.def?.impossible);
      const bad = avoidSet(new RegExp(avoid));
      const px = p.x; const py = p.y;
      const goal = (x, y) => (onto ? x === tx && y === ty : Math.abs(x - tx) + Math.abs(y - ty) === 1);
      const prev = new Map([[key(px, py), null]]);
      const q = [[px, py]];
      try {
        while (q.length) {
          const [x, y] = q.shift();
          if (goal(x, y)) {
            const out = [];
            let k = key(x, y);
            while (prev.get(k)) { const [pk, d] = prev.get(k); out.unshift(d); k = pk; }
            return out;
          }
          for (const d of [2, 4, 6, 8]) {
            const nx = x + DV[d][0]; const ny = y + DV[d][1];
            if (!gm.valid(nx, ny) || prev.has(key(nx, ny))) continue;
            if (impossibleMap && impossible.isVoidCell(gm, nx, ny)) continue;
            if (bad.has(key(nx, ny)) && !(nx === tx && ny === ty && onto)) continue;
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

    window.__b20 = {
      route,
      riding: () => Boolean(map()?.world?.zygMount?.riding),
      ride: (on = true) => { const m = map().world.zygMount || (map().world.zygMount = {}); m.riding = on; return on; },
      addTablet: (id) => { engine.state.addTablet(id); if (!engine.state.hasItem(id)) engine.state.addItem(id, 1); return engine.state.data.tablets.length; },
      tablets: () => [...(engine.state?.data?.tablets || [])],
      keyItem: (id) => Boolean(engine.state?.hasKeyItem?.(id)),
      clue: (id) => (engine.state?.data?.clues || []).find((c) => c.id === id)?.status ?? null,
      healPoint: () => ({ ...(engine.state?.data?.lastHeal || {}) }),
      music: () => engine.audio?.nowPlaying?.()?.name ?? null,
      party: () => (engine.state?.party || []).map((pk) => ({ species: pk.species, hp: pk.hp, level: pk.level })),
      crisis: async () => (await import('/src/content/story/crisis.js')).crisisPhase(engine.state),
    };
  }, loseOnce);
}
