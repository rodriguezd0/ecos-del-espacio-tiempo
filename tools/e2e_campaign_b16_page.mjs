// Observador puro del P8: consultas y rutas; los cambios ocurren con controles reales.
export async function installB16Observer(page){
 await page.evaluate(async()=>{
  const [{engine},clues,hito,water]=await Promise.all([import('/src/core/engine.js'),import('/src/content/story/clueLogic.js'),import('/src/content/events/b16_hito.js'),import('/src/world/waterAccess.js')]);
    const map = () => window.__map;
    const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
    const key = (x, y) => `${x},${y}`;

    // Agua en la que se nada según el juego (no cuenta el puente de hielo, que se pisa a pie).
    const isWater = (x, y) => water.isSwimWater(map().world.map, x, y);
    /** ¿El juego ofrecería nadar desde (x, y) mirando a `d`? (misma regla que al pulsar A) */
    const offersSwim = (x, y, d) => {
      const w = map().world;
      const p = w.player;
      const simulated = Object.create(w), player = Object.create(p);
      Object.defineProperties(player,{x:{value:x},y:{value:y},direction:{value:d}});
      Object.defineProperty(simulated,'player',{value:player});
      return water.canOfferSwim(simulated);
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
            if (!p.passable(x, y, d)) continue;
            prev.set(key(nx, ny), [key(x, y), d]);
            q.push([nx, ny]);
          }
        }
      } finally {
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
            if (!p.passable(x, y, d)) continue;
            seen.add(key(nx, ny));
            q.push([nx, ny]);
          }
        }
      } finally {
      }
      return best;
    }

    const eventOf = (id) => map()?.world?.events?.find((e) => e.id === id) || null;

    window.__b16 = {
      lost: [],
      battles: window.__campaign.battles,
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
    };
 });
}
