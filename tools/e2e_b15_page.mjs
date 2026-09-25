// Ayudantes del recorrido E2E del Bloque 15 que se instalan DENTRO de la página (window.__b15), además de los de
// tools/e2e_b01_page.mjs (window.__e2e): piloto de combate (entrenadores: luchar; salvajes: huir; derrotas simuladas
// una vez contra ids concretos), estado (variables, Tablillas, objetos, núcleos, interruptores de evento) y una ruta a
// pie que evita casillas concretas (las coronaciones de las escaleras falsas de la Senda del Lazo).

export async function installB15Helpers(page, { loseOnce = [] } = {}) {
  await page.evaluate(async (lose) => {
    const [{ engine }, api] = await Promise.all([import('/src/core/engine.js'), import('/src/battle/api.js')]);
    const pending = new Set(lose);
    const lost = [];
    const battles = [];
    api.installBattle(async (cfg) => {
      const id = typeof cfg.trainer === 'string' ? cfg.trainer : null;
      battles.push(id || cfg.type || 'combate');
      if (id && pending.has(id)) {
        pending.delete(id);
        lost.push(id);
        return { outcome: 'lose', stored: true };
      }
      return api.startBattle({ ...cfg, auto: cfg.type === 'wild' ? 'run' : 'fight' });
    });
    const map = () => window.__map;
    const DIRS = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]];

    /** Ruta más corta a (tx, ty) (o a su lado) sin pisar las casillas de `avoid` ("x,y"). Direcciones 2/4/6/8. */
    function routeAvoid(tx, ty, avoid = [], { onto = true } = {}) {
      const m = map();
      if (!m?.world?.map) return null;
      const p = m.world.player;
      const gm = m.world.map;
      const bad = new Set(avoid);
      const key = (x, y) => `${x},${y}`;
      const goal = (x, y) => (onto ? x === tx && y === ty : Math.abs(x - tx) + Math.abs(y - ty) === 1);
      const prev = new Map([[key(p.x, p.y), null]]);
      const queue = [[p.x, p.y]];
      const px = p.x; const py = p.y;
      try {
        while (queue.length) {
          const [x, y] = queue.shift();
          if (goal(x, y)) {
            const out = [];
            let k = key(x, y);
            while (prev.get(k)) { const [pk, d] = prev.get(k); out.unshift(d); k = pk; }
            return out;
          }
          for (const [d, ox, oy] of DIRS) {
            const nx = x + ox; const ny = y + oy;
            const nk = key(nx, ny);
            if (!gm.valid(nx, ny) || prev.has(nk) || bad.has(nk)) continue;
            p.x = x; p.y = y;
            if (!p.passable(x, y, d)) continue;
            prev.set(nk, [key(x, y), d]);
            queue.push([nx, ny]);
          }
        }
        return null;
      } finally {
        p.x = px; p.y = py;
      }
    }

    window.__b15 = {
      lost,
      battles,
      routeAvoid,
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      tablets: () => [...(engine.state?.data?.tablets || [])],
      items: (id) => engine.state?.itemCount?.(id) ?? 0,
      cores: () => [...(engine.state?.data?.zygarde?.cores || [])],
      hour: () => engine.state?.hour ?? null,
      selfSwitch: (mapId, id) => Boolean(engine.state?.selfSwitch?.(mapId, id, 'A')),
      choiceItems: () => [...(engine.scenes.top?.items || [])].map((i) => (typeof i === 'string' ? i : i?.label ?? i?.text ?? String(i))),
      eventAlive: (id) => {
        const ev = map()?.world?.events?.find((e) => e.id === id);
        return Boolean(ev && !ev.erased && ev.page);
      },
      eventPos: (id) => { const ev = map()?.world?.events?.find((e) => e.id === id); return ev ? { x: ev.x, y: ev.y, dir: ev.direction } : null; },
    };
  }, loseOnce);
}
