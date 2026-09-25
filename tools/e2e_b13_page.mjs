// Ayudantes del recorrido E2E del Bloque 13 que se instalan DENTRO de la página (window.__b13), además de los de
// tools/e2e_b01_page.mjs (window.__e2e): piloto automático de combate (entrenadores: luchar; salvajes: huir) con derrotas
// simuladas una vez (por id de entrenador, también en dobles), rutas a nado (solo por agua), orillas desde las que
// empezar a nadar, rutas a pie que evitan casillas (las piedras del corro), células añadidas a mano (estado de
// entrada), Libreta, Tablillas, Mochila, variables, hora, eventos vivos y la burbuja de Buceo.

export async function installB13Helpers(page, { loseOnce = [] } = {}) {
  await page.evaluate(async (lose) => {
    const [{ engine }, api, { canSurfFreely }, { CELLS }] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/world/terrain.js'),
      import('/src/content/zygarde/cells.js'),
    ]);
    const pending = new Set(lose);
    const lost = [];
    const battles = [];
    api.installBattle(async (cfg) => {
      const trainer = typeof cfg.trainer === 'string' ? cfg.trainer : null;
      const trainers = Array.isArray(cfg.trainers) ? cfg.trainers.filter((t) => typeof t === 'string') : [];
      const wild = cfg.wild?.species || cfg.opponent?.party?.[0]?.species || null;
      battles.push({ trainer, trainers, wild, format: cfg.format || 'single', ally: cfg.ally?.name || null, phases: (cfg.phases || []).length });
      const key = [trainer, ...trainers, wild].find((k) => k && pending.has(k));
      if (key) {
        pending.delete(key);
        lost.push(key);
        return { outcome: 'lose', stored: true };
      }
      const isTrainer = cfg.type === 'trainer' || Boolean(cfg.trainer) || trainers.length;
      return api.startBattle({ ...cfg, auto: isTrainer ? 'fight' : 'run' });
    });

    const map = () => window.__map;
    const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
    const findEvent = (id) => map()?.world?.events?.find((e) => e.id === id) || null;
    const isWater = (x, y) => {
      const gm = map().world.map;
      return gm.valid(x, y) && canSurfFreely(gm.terrainTagAt(x, y)) && !gm.playerPassable(x, y, 0, {});
    };

    /**
     * BFS con la pasabilidad real del jugador desde su casilla. `ok(x, y)` filtra las casillas intermedias;
     * `goal(x, y)` marca el destino. → direcciones (2/4/6/8) o null.
     */
    function bfs(goal, ok = () => true, limit = 40000) {
      const m = map();
      const p = m.world.player;
      const gm = m.world.map;
      const W = gm.width;
      const key = (x, y) => y * W + x;
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
            return out;
          }
          if (!(x === px && y === py) && !ok(x, y)) continue;
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

    /** Casilla de tierra desde la que empezar a nadar hacia (tx, ty): { x, y, face }. */
    function shoreFor(tx, ty) {
      const m = map();
      const p = m.world.player;
      const gm = m.world.map;
      const px = p.x; const py = p.y;
      const key = (x, y) => `${x},${y}`;
      const seen = new Set([key(px, py)]);
      const q = [[px, py]];
      let best = null;
      try {
        while (q.length) {
          const [x, y] = q.shift();
          for (const d of [2, 4, 6, 8]) {
            const wx = x + DV[d][0]; const wy = y + DV[d][1];
            if (isWater(wx, wy) && !isWater(x, y)) {
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

    /**
     * Ruta nadando que puede terminar a pie: por agua mientras se nada; al pisar tierra se desembarca y desde ahí solo
     * se camina (sin volver a entrar en el agua). → direcciones o null.
     */
    function routeMixed(tx, ty, limit = 60000) {
      const m = map();
      const p = m.world.player;
      const gm = m.world.map;
      const [px, py, ps] = [p.x, p.y, p.surfing];
      const K = (x, y, s) => `${x},${y},${s ? 1 : 0}`;
      const start = K(px, py, ps);
      const prev = new Map([[start, null]]);
      const q = [[px, py, ps]];
      try {
        while (q.length && prev.size < limit) {
          const [x, y, s] = q.shift();
          if (x === tx && y === ty && !(x === px && y === py)) {
            const out = [];
            let k = K(x, y, s);
            while (prev.get(k)) { const [pk, d] = prev.get(k); out.unshift(d); k = pk; }
            return out;
          }
          for (const d of [2, 4, 6, 8]) {
            const nx = x + DV[d][0]; const ny = y + DV[d][1];
            if (!gm.valid(nx, ny)) continue;
            p.x = x; p.y = y; p.surfing = s;
            if (!p.passable(x, y, d)) continue;
            const water = isWater(nx, ny);
            if (!s && water) continue;
            const nk = K(nx, ny, s && water);
            if (prev.has(nk)) continue;
            prev.set(nk, [K(x, y, s), d]);
            q.push([nx, ny, s && water]);
          }
        }
      } finally {
        p.x = px; p.y = py; p.surfing = ps;
      }
      return null;
    }

    window.__b13 = {
      routeMixed,
      lost,
      battles,
      surfing: () => Boolean(map()?.world?.player?.surfing),
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      clues: () => (engine.state?.clues || []).map((c) => ({ id: c.id, step: c.step, status: c.status })),
      tablets: () => [...(engine.state?.data?.tablets || [])],
      items: (ids) => Object.fromEntries(ids.map((id) => [id, engine.state?.itemCount?.(id) ?? 0])),
      party: () => (engine.state?.party || []).map((p) => `${p.species}:${p.level}`),
      hour: () => engine.state?.hour ?? null,
      night: () => (typeof engine.state?.isDay === 'function' ? !engine.state.isDay() : null),
      abilities: () => ({ ...(engine.state?.data?.zygarde?.abilities || {}) }),
      cellCount: () => (engine.state?.data?.zygarde?.cells || []).length,
      choiceItems: () => {
        const top = engine.scenes.top;
        return (top?.items || []).map((it) => (typeof it === 'string' ? it : it?.label || ''));
      },
      eventAlive: (id) => { const ev = findEvent(id); return Boolean(ev && !ev.erased && ev.page); },
      eventPage: (id) => { const ev = findEvent(id); return ev ? ev.pageIndex ?? ev.pages?.indexOf?.(ev.page) ?? null : null; },
      eventPos: (id) => { const ev = findEvent(id); return ev ? { x: ev.x, y: ev.y, dir: ev.direction } : null; },
      /** Estado de entrada: células de otras zonas (ids C###) que el jugador ya tendría. */
      addCells: (ids) => { for (const c of CELLS) if (ids.includes(c.id)) engine.state.addCell(c.key); return engine.state.data.zygarde.cells.length; },
      isWater: (x, y) => isWater(x, y),
      shoreFor,
      /** Ruta nadando (solo casillas de agua; el destino puede ser tierra para desembarcar). */
      routeSurf: (tx, ty) => bfs((x, y) => x === tx && y === ty, (x, y) => isWater(x, y)),
      /** Ruta a pie hasta (tx, ty) que no pisa ninguna casilla de `avoid` ([[x, y]…]) salvo el destino. */
      routeAvoid: (tx, ty, avoid) => {
        const bad = new Set(avoid.map(([x, y]) => `${x},${y}`));
        return bfs((x, y) => x === tx && y === ty, (x, y) => !bad.has(`${x},${y}`));
      },
      dive: () => {
        const d = map()?.zygarde?.dive;
        return d ? { segments: d.meter?.segments ?? null, max: d.meter?.max ?? null } : null;
      },
    };
  }, loseOnce);
}
