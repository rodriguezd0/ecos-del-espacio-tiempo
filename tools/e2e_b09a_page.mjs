// Ayudantes del recorrido E2E del Bloque 9a que se instalan DENTRO de la página (window.__b09a), además de los de
// tools/e2e_b01_page.mjs (window.__e2e): piloto automático de combate (entrenadores y el Alfa de T07: luchar; resto de
// salvajes: huir), derrotas simuladas una vez (entrenador por id o especie salvaje), opciones del menú abierto, estado
// de la Libreta, Tablillas, variables y eventos, y la posición de la losa original de la Sala de Réplicas.

export async function installB09aHelpers(page, { loseOnce = [] } = {}) {
  await page.evaluate(async (lose) => {
    const [{ engine }, api, t06] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/content/events/b09a_t06_logic.js'),
    ]);
    const pending = new Set(lose);
    const lost = [];
    const FIGHT_WILD = new Set(['VESPIQUEN']);
    api.installBattle(async (cfg) => {
      const trainer = typeof cfg.trainer === 'string' ? cfg.trainer : null;
      const trainers = Array.isArray(cfg.trainers) ? cfg.trainers.filter((t) => typeof t === 'string') : [];
      const wild = cfg.wild?.species || cfg.opponent?.party?.[0]?.species || null;
      const key = [trainer, ...trainers, wild].find((k) => k && pending.has(k));
      if (key) {
        pending.delete(key);
        lost.push(key);
        return { outcome: 'lose', stored: true };
      }
      const isTrainer = cfg.type === 'trainer' || Boolean(cfg.trainer) || trainers.length;
      return api.startBattle({ ...cfg, auto: isTrainer || FIGHT_WILD.has(wild) ? 'fight' : 'run' });
    });
    const map = () => window.__map;
    /** Casillas que no se pisan de camino (puertas, alfombras y eventos de contacto activos), salvo la meta. */
    function hazards(tx, ty) {
      const w = map()?.world;
      const out = new Set();
      if (!w?.map) return out;
      const W = w.map.width;
      for (const wp of w.current?.def?.warps || []) if (!wp.dirTrigger) out.add(wp.y * W + wp.x);
      for (const ev of w.events || []) {
        if (!ev.erased && ev.page && (ev.trigger === 'touch' || ev.trigger === 'eventTouch')) out.add(ev.y * W + ev.x);
      }
      out.delete(ty * W + tx);
      return out;
    }
    /** Como __e2e.route, pero rodeando puertas y eventos de contacto; si no hay otra, usa la ruta normal. */
    function safeRoute(tx, ty, { onto = true } = {}) {
      const m = map();
      if (!m?.world?.map) return null;
      const p = m.world.player;
      const gm = m.world.map;
      const W = gm.width;
      const avoid = hazards(tx, ty);
      const key = (x, y) => y * W + x;
      const goal = (x, y) => (onto ? x === tx && y === ty : Math.abs(x - tx) + Math.abs(y - ty) === 1);
      const DIRS = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]];
      const prev = new Map([[key(p.x, p.y), null]]);
      const queue = [[p.x, p.y]];
      while (queue.length) {
        const [x, y] = queue.shift();
        if (goal(x, y)) {
          const out = [];
          let k = key(x, y);
          while (prev.get(k)) { const [pk, d] = prev.get(k); out.unshift(d); k = pk; }
          return out;
        }
        for (const [d, ox, oy] of DIRS) {
          const nx = x + ox;
          const ny = y + oy;
          const k = key(nx, ny);
          if (prev.has(k) || !gm.valid(nx, ny) || !p.passable(x, y, d) || avoid.has(k)) continue;
          prev.set(k, [key(x, y), d]);
          queue.push([nx, ny]);
        }
      }
      return window.__e2e.route(tx, ty, { onto });
    }
    window.__b09a = {
      lost,
      route: safeRoute,
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      clues: () => (engine.state?.clues || []).map((c) => ({ id: c.id, step: c.step, status: c.status })),
      tablets: () => [...(engine.state?.data?.tablets || [])],
      party: () => (engine.state?.party || []).map((p) => p.species),
      item: (id) => engine.state?.itemCount?.(id) ?? 0,
      addItem: (id, n = 1) => engine.state?.addItem?.(id, n),
      hour: () => engine.state?.hour ?? null,
      choiceItems: () => {
        const top = engine.scenes.top;
        return (top?.items || []).map((it) => (typeof it === 'string' ? it : it?.label || ''));
      },
      choiceReady: () => Boolean(engine.scenes.top?.win),
      kept: () => Boolean(engine.scenes.top?.kept),
      eventAlive: (id) => {
        const ev = map()?.world?.events?.find((e) => e.id === id);
        return Boolean(ev && !ev.erased && ev.page);
      },
      eventPos: (id) => {
        const ev = map()?.world?.events?.find((e) => e.id === id);
        return ev ? { x: ev.x, y: ev.y, alive: Boolean(!ev.erased && ev.page) } : null;
      },
      originalPos: () => t06.originalPosition(engine.state),
      wrongPos: () => { const o = t06.originalPosition(engine.state); return o === 0 ? 1 : 0; },
    };
  }, loseOnce);
}
