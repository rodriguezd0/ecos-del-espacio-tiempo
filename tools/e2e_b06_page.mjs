// Ayudantes del recorrido E2E del Bloque 6 que se instalan DENTRO de la página (window.__b06), además de los de
// tools/e2e_b01_page.mjs (window.__e2e): ruta a pie que evita las ráfagas, estado de Zygarde/montura, variables y
// una derrota simulada contra un entrenador concreto (para probar los reintentos sin pérdida).

export async function installB06Helpers(page, { loseOnce = [] } = {}) {
  await page.evaluate(async (lose) => {
    const [{ engine }, api, mount] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/world/zygarde/mount.js'),
    ]);
    const pending = new Set(lose);
    const lost = [];
    // Piloto automático + derrota simulada (una vez) contra los entrenadores pedidos.
    api.installBattle(async (cfg) => {
      const id = typeof cfg.trainer === 'string' ? cfg.trainer : null;
      if (id && pending.has(id)) {
        pending.delete(id);
        lost.push(id);
        return { outcome: 'lose', stored: true };
      }
      return api.startBattle({ ...cfg, auto: cfg.type === 'wild' ? 'run' : 'fight' });
    });
    const DIRS = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]];
    const map = () => window.__map;
    const gustAt = (x, y) => (map()?.world?.events || []).some((e) => !e.erased && e.page && e.def?.gust && e.x === x && e.y === y);

    /** Ruta a pie que no pisa ráfagas (salvo el destino si `onto` y es ráfaga: para lanzarse a propósito). */
    function calmRoute(tx, ty, { onto = true } = {}) {
      const m = map();
      const p = m.world.player;
      const gm = m.world.map;
      const W = gm.width;
      const key = (x, y) => y * W + x;
      const goal = (x, y) => (onto ? x === tx && y === ty : Math.abs(x - tx) + Math.abs(y - ty) === 1);
      const prev = new Map();
      const seen = new Set([key(p.x, p.y)]);
      const queue = [[p.x, p.y]];
      while (queue.length) {
        const [x, y] = queue.shift();
        if (goal(x, y)) {
          const out = [];
          let k = key(x, y);
          while (prev.has(k)) { const [pk, d] = prev.get(k); out.unshift(d); k = pk; }
          return out;
        }
        for (const [d, ox, oy] of DIRS) {
          const nx = x + ox; const ny = y + oy;
          if (!gm.valid(nx, ny) || seen.has(key(nx, ny)) || !p.passable(x, y, d)) continue;
          if (gustAt(nx, ny) && !(onto && nx === tx && ny === ty)) continue;
          seen.add(key(nx, ny));
          prev.set(key(nx, ny), [key(x, y), d]);
          queue.push([nx, ny]);
        }
      }
      return null;
    }

    window.__b06 = {
      lost,
      calmRoute,
      gustAt,
      riding: () => Boolean(map()?.world && mount.isRiding(map().world)),
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      abilities: () => ({ ...(engine.state?.data?.zygarde?.abilities || {}) }),
      cores: () => [...(engine.state?.data?.zygarde?.cores || [])],
      fragments: () => [...(engine.state?.data?.fragments || [])],
      clues: () => (engine.state?.clues || []).map((c) => ({ id: c.id, step: c.step, status: c.status })),
      heal: () => engine.state?.healPoint || null,
      eventAlive: (id) => {
        const ev = map()?.world?.events?.find((e) => e.id === id);
        return Boolean(ev && !ev.erased && ev.page);
      },
      eventPage: (id) => map()?.world?.events?.find((e) => e.id === id)?.pageIndex ?? null,
      crisis: async () => (await import('/src/content/story/crisis.js')).crisisPhase(engine.state),
    };
  }, loseOnce);
}
