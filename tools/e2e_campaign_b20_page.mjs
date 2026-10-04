export async function installB20Observer(page){await page.evaluate(async()=>{const [{engine},impossible]=await Promise.all([import('/src/core/engine.js'),import('/src/world/impossible/logic.js')]);
    const b16=window.__b16;
    const map = () => window.__map;
    const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
    const key = (x, y) => `${x},${y}`;

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
            if (!p.passable(x, y, d)) continue;
            prev.set(key(nx, ny), [key(x, y), d]);
            q.push([nx, ny]);
          }
        }
      } finally {
      }
      return null;
    }

    window.__b20 = {
      route,
      riding: () => Boolean(map()?.world?.zygMount?.riding),
      tablets: () => [...(engine.state?.data?.tablets || [])],
      keyItem: (id) => Boolean(engine.state?.hasKeyItem?.(id)),
      clue: (id) => (engine.state?.data?.clues || []).find((c) => c.id === id)?.status ?? null,
      healPoint: () => ({ ...(engine.state?.data?.lastHeal || {}) }),
      music: () => engine.audio?.nowPlaying?.()?.name ?? null,
      party: () => (engine.state?.party || []).map((pk) => ({ species: pk.species, hp: pk.hp, level: pk.level })),
      crisis: async () => (await import('/src/content/story/crisis.js')).crisisPhase(engine.state),
    };

});}
