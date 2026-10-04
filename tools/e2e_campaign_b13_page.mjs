// Rutas y observaciones; los escenarios posibles se calculan sobre copias, sin mover al jugador.
export async function installB13Observer(page){await page.evaluate(async()=>{
 const [{engine},{canSurfFreely}]=await Promise.all([import('/src/core/engine.js'),import('/src/world/terrain.js')]);
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
            if (!p.passable(x, y, d)) continue;
            prev.set(key(nx, ny), [key(x, y), d]);
            q.push([nx, ny]);
          }
        }
      } finally {
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
            if (!p.passable(x, y, d)) continue;
            seen.add(key(nx, ny));
            q.push([nx, ny]);
          }
        }
      } finally {
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
            const view = Object.create(p); Object.defineProperties(view,{x:{value:x},y:{value:y},surfing:{value:s}});
            if (!view.passable(x, y, d)) continue;
            const water = isWater(nx, ny);
            if (!s && water) continue;
            const nk = K(nx, ny, s && water);
            if (prev.has(nk)) continue;
            prev.set(nk, [K(x, y, s), d]);
            q.push([nx, ny, s && water]);
          }
        }
      } finally {

      }
      return null;
    }

    window.__b13 = {
      routeMixed,
      lost: [],
      battles: window.__campaign.battles,
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

});}
