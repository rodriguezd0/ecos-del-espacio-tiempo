// Ayudantes de página del recorrido E2E del Bloque 4 (tools/e2e_b04.mjs). Se instalan DESPUÉS de los del Bloque 1
// (tools/e2e_b01_page.mjs: window.__e2e con snap, log, route, eventPos, piloto automático de combate) y añaden
// window.__e2e.b04: estado del puzle de la Escalera, montura del 10 %, ruta con salientes y resumen de la historia.

export async function installB04Helpers(page) {
  await page.evaluate(async () => {
    const [hyd, mount, clues] = await Promise.all([
      import('/src/content/events/b04_hydraulics.js'), import('/src/world/zygarde/mount.js'), import('/src/content/story/clueLogic.js'),
    ]);
    const map = () => window.__map;
    const DIRS = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]];

    /**
     * Ruta más corta a (tx, ty) (o a su lado con onto=false) con saltos de saliente (bajar sobre una casilla de
     * saliente cuenta como un paso que aterriza dos casillas más allá). Evita la hierba alta si puede.
     */
    function route(tx, ty, { onto = true } = {}) {
      const m = map();
      if (!m?.world?.map) return null;
      const p = m.world.player;
      const gm = m.world.map;
      const W = gm.width;
      const key = (x, y) => y * W + x;
      const goal = (x, y) => (onto ? x === tx && y === ty : Math.abs(x - tx) + Math.abs(y - ty) === 1);
      const dist = new Map([[key(p.x, p.y), 0]]);
      const prev = new Map();
      const open = [[p.x, p.y]];
      while (open.length) {
        let bi = 0;
        for (let i = 1; i < open.length; i++) if (dist.get(key(...open[i])) < dist.get(key(...open[bi]))) bi = i;
        const [x, y] = open.splice(bi, 1)[0];
        if (goal(x, y)) {
          const out = [];
          let k = key(x, y);
          while (prev.has(k)) { const [pk, d] = prev.get(k); out.unshift(d); k = pk; }
          return out;
        }
        for (const [d, ox, oy] of DIRS) {
          let nx = x + ox;
          let ny = y + oy;
          if (!gm.valid(nx, ny) || !p.passable(x, y, d)) continue;
          if (gm.terrainTagAt(nx, ny).ledge) {
            if (d !== 2) continue;
            ny += 1;
            if (!gm.valid(nx, ny)) continue;
          }
          const tag = gm.terrainTagAt(nx, ny);
          const cost = tag?.landWildEncounters ? 6 : 1;
          const nd = dist.get(key(x, y)) + cost;
          if (nd < (dist.get(key(nx, ny)) ?? Infinity)) {
            if (!dist.has(key(nx, ny))) open.push([nx, ny]);
            dist.set(key(nx, ny), nd);
            prev.set(key(nx, ny), [key(x, y), d]);
          }
        }
      }
      return null;
    }

    window.__e2e.route = route;
    window.__e2e.b04 = {
      puzzle() {
        const st = window.__e2e.engine.state;
        const p = hyd.readPuzzle(st);
        return { gates: p.gates, noria: p.noria, water: p.water, text: hyd.describePuzzle(p), cycle: hyd.cycleComplete(p) };
      },
      riding: () => mount.isRiding(map()?.world),
      canRide: () => mount.canRide(map()?.world),
      story() {
        const st = window.__e2e.engine.state;
        return {
          fragments: [...(st.data.fragments || [])],
          t02: clues.clueEntry(st, 'T02'),
          t03: clues.clueEntry(st, 'T03'),
          beacons: st.itemCount('RESONANCEBEACON'),
          vars: { ...(st.data.vars || {}) },
        };
      },
    };
  });
}
