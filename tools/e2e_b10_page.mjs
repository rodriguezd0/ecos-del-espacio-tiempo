// Ayudantes del recorrido E2E del Bloque 10 que se instalan DENTRO de la página (window.__b10), además de los de
// tools/e2e_b01_page.mjs (window.__e2e): ruta a pie que evita las casillas de contacto (trampas del Suelo Olvidado,
// losas de recuerdo, franjas de escena) salvo el destino, estado de Zygarde, variables, niebla del mapa y una
// derrota simulada contra un entrenador concreto (para probar los reintentos sin pérdida).

export async function installB10Helpers(page, { loseOnce = [] } = {}) {
  await page.evaluate(async (lose) => {
    const [{ engine }, api] = await Promise.all([import('/src/core/engine.js'), import('/src/battle/api.js')]);
    const pending = new Set(lose);
    const lost = [];
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
    /** ¿Hay en (x, y) un evento de contacto activo (se dispara al pisarlo)? */
    const touchAt = (x, y) => (map()?.world?.events || []).some((e) => !e.erased && e.page && e.x === x && e.y === y
      && e.trigger === 'touch' && (e.through || !e.characterName));

    /** Ruta a pie que no pisa casillas de contacto (salvo el destino si `onto`). */
    function safeRoute(tx, ty, { onto = true, avoid = [] } = {}) {
      const m = map();
      const p = m.world.player;
      const gm = m.world.map;
      const W = gm.width;
      const key = (x, y) => y * W + x;
      const banned = new Set(avoid.map(([x, y]) => key(x, y)));
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
          if (!gm.valid(nx, ny) || seen.has(key(nx, ny)) || banned.has(key(nx, ny)) || !p.passable(x, y, d)) continue;
          const isGoal = onto && nx === tx && ny === ty;
          if (touchAt(nx, ny) && !isGoal) continue;
          seen.add(key(nx, ny));
          prev.set(key(nx, ny), [key(x, y), d]);
          queue.push([nx, ny]);
        }
      }
      return null;
    }

    /**
     * Suelta la tecla `code` en el primer fotograma en que el jugador cambia de casilla (o a los `timeoutMs`). Con la
     * máquina cargada, soltarla desde Node llega tarde y el jugador da un segundo paso (en el Suelo Olvidado, al vacío).
     */
    function releaseOnMove(code, timeoutMs = 1500) {
      const p0 = map()?.world?.player;
      if (!p0) return;
      const [x0, y0] = [p0.x, p0.y];
      const t0 = performance.now();
      const tick = () => {
        const p = map()?.world?.player;
        if (!p || p !== p0 || p.x !== x0 || p.y !== y0 || performance.now() - t0 > timeoutMs) {
          window.dispatchEvent(new KeyboardEvent('keyup', { code, key: code }));
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    window.__b10 = {
      lost,
      safeRoute,
      touchAt,
      releaseOnMove,
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      abilities: () => ({ ...(engine.state?.data?.zygarde?.abilities || {}) }),
      cores: () => [...(engine.state?.data?.zygarde?.cores || [])],
      fragments: () => [...(engine.state?.data?.fragments || [])],
      clues: () => (engine.state?.clues || []).map((c) => ({ id: c.id, step: c.step, status: c.status })),
      items: (ids) => Object.fromEntries(ids.map((id) => [id, engine.state?.itemCount?.(id) ?? 0])),
      party: () => (engine.state?.party || []).map((p) => p.species),
      heal: () => engine.state?.healPoint || null,
      fog: () => map()?.weather?.mapFog?.name || null,
      eventAlive: (id) => {
        const ev = map()?.world?.events?.find((e) => e.id === id);
        return Boolean(ev && !ev.erased && ev.page);
      },
      eventPos: (id) => {
        const ev = map()?.world?.events?.find((e) => e.id === id);
        return ev ? { x: ev.x, y: ev.y, alive: !ev.erased && Boolean(ev.page), opacity: ev.opacity } : null;
      },
      /** Cambia el género del protagonista y recarga su sprite (el mapa lo carga al arrancar). */
      setGender: async (g) => {
        if (engine.state?.data?.player) engine.state.data.player.gender = g;
        const player = map()?.world?.player;
        if (!player?.setCharsets) return;
        const { playerCharsets } = await import('/src/render/charsets.js');
        player.setCharsets(await playerCharsets(g));
      },
      setHour: (h) => { if (engine.state?.data?.clock) engine.state.data.clock.minutes = h * 60; },
    };
  }, loseOnce);
}
