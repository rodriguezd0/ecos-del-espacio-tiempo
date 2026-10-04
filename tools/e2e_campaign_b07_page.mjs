// Observadores de las capas: rutas, eventos e inventario real.
export async function installB07Observer(page){await page.evaluate(async()=>{const {engine}=await import('/src/core/engine.js'); const battles=window.__campaign.battles,lost=[];
    const DIRS = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]];
    /** Ruta más corta a (tx, ty) que salta los salientes (como el jugador: pisar un saliente hacia el sur lo salta). */
    function route(tx, ty) {
      const m = window.__map;
      const p = m.world.player;
      const gm = m.world.map;
      const key = (x, y) => `${x},${y}`;
      const prev = new Map();
      const seen = new Set([key(p.x, p.y)]);
      const queue = [[p.x, p.y]];
      while (queue.length) {
        const [x, y] = queue.shift();
        if (x === tx && y === ty) {
          const out = [];
          let k = key(x, y);
          while (prev.has(k)) { const [pk, d] = prev.get(k); out.unshift(d); k = pk; }
          return out;
        }
        for (const [d, ox, oy] of DIRS) {
          let nx = x + ox; let ny = y + oy;
          if (!gm.valid(nx, ny) || !p.passable(x, y, d)) continue;
          if (gm.terrainTagAt(nx, ny, 0)?.ledge) { nx += ox; ny += oy; }
          if (!gm.valid(nx, ny) || seen.has(key(nx, ny))) continue;
          seen.add(key(nx, ny));
          prev.set(key(nx, ny), [key(x, y), d]);
          queue.push([nx, ny]);
        }
      }
      return null;
    }
    window.__b07 = {
      lost,
      battles,
      route,
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      has: (item) => Boolean(engine.state?.hasItem?.(item) || engine.state?.hasKeyItem?.(item)),
      clues: () => (engine.state?.clues || []).map((c) => ({ id: c.id, step: c.step, status: c.status })),
      tablets: () => [...(engine.state?.data?.tablets || [])],
      eventAlive: (id) => {
        const ev = window.__map?.world?.events?.find((e) => e.id === id);
        return Boolean(ev && !ev.erased && ev.page);
      },

};});}
