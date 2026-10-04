// Solo lectura de salas, objetos y pistas.
export async function installB09aObserver(page){await page.evaluate(async()=>{
const [{engine}, t06]=await Promise.all([import('/src/core/engine.js'), import('/src/content/events/b09a_t06_logic.js')]);
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
      return window.__campaign.route(tx, ty, { onto });
    }
    window.__b09a = {
      lost: [],
      route: safeRoute,
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      clues: () => (engine.state?.clues || []).map((c) => ({ id: c.id, step: c.step, status: c.status })),
      tablets: () => [...(engine.state?.data?.tablets || [])],
      party: () => (engine.state?.party || []).map((p) => p.species),
      item: (id) => engine.state?.itemCount?.(id) ?? 0,
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

window.__e2e.route=window.__b09a.route;
});}
