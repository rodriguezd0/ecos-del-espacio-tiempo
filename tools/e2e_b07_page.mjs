// Ayudantes del recorrido E2E del Bloque 7 que se instalan DENTRO de la página (window.__b07), además de los de
// tools/e2e_b01_page.mjs (window.__e2e): piloto automático de combate que megaevoluciona en cuanto puede (para
// comprobar que el Mega Aro funciona solo después de recibirlo), derrotas simuladas contra entrenadores concretos
// (reintentos sin pérdida), estado de la partida (variables, mochila, pistas) y equipar objetos.

export async function installB07Helpers(page, { loseOnce = [] } = {}) {
  await page.evaluate(async (lose) => {
    const [{ engine }, api, { createPokemon, healed }] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/battle/core/pokemon.js'),
    ]);
    const pending = new Set(lose);
    const lost = [];
    const battles = [];
    api.installBattle(async (cfg) => {
      const id = typeof cfg.trainer === 'string' ? cfg.trainer : null;
      if (id && pending.has(id)) {
        pending.delete(id);
        lost.push(id);
        return { outcome: 'lose', stored: true };
      }
      const hasRing = Boolean(engine.state?.hasKeyItem?.('MEGARING'));
      battles.push({ id, type: cfg.type || (cfg.trainer ? 'trainer' : 'wild'), ring: hasRing });
      return api.startBattle({ ...cfg, auto: cfg.type === 'wild' ? 'run' : 'mega' });
    });
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
      /** Pone al frente del equipo un Pokémon con su megapiedra equipada (para la prueba de la Megaevolución). */
      leadWithStone(species, level, item) {
        const st = engine.state;
        const pk = { ...createPokemon(engine.data, species, level, { ot: { name: st.player.name, id: st.player.id } }), heldItem: item };
        st.setParty([pk, ...st.party.filter((p) => p.species !== species)].slice(0, 6));
        window.__map?.refreshFollower?.();
        return st.party.map((p) => `${p.species}${p.heldItem ? `@${p.heldItem}` : ''}`);
      },
      heal: () => { const st = engine.state; st.setParty(st.party.map((p) => healed(engine.data, p))); },
    };
  }, loseOnce);
}
