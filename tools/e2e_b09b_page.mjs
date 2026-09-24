// Ayudantes del recorrido E2E del Bloque 9b que se instalan DENTRO de la página (window.__b09b), además de los de
// tools/e2e_b01_page.mjs (window.__e2e): piloto automático de combate (entrenadores: luchar; salvajes: huir), derrotas
// simuladas una vez (entrenador por id o especie salvaje), opciones del menú abierto, estado de la Libreta, Tablillas,
// objetos de la Mochila, variables y eventos vivos.

export async function installB09bHelpers(page, { loseOnce = [] } = {}) {
  await page.evaluate(async (lose) => {
    const [{ engine }, api] = await Promise.all([import('/src/core/engine.js'), import('/src/battle/api.js')]);
    const pending = new Set(lose);
    const lost = [];
    api.installBattle(async (cfg) => {
      const trainer = typeof cfg.trainer === 'string' ? cfg.trainer : null;
      const trainers = Array.isArray(cfg.trainers) ? cfg.trainers.filter((t) => typeof t === 'string') : [];
      const wild = cfg.wild?.species || cfg.opponent?.party?.[0]?.species || null;
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
    const findEvent = (id) => map()?.world?.events?.find((e) => e.id === id) || null;
    window.__b09b = {
      lost,
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      clues: () => (engine.state?.clues || []).map((c) => ({ id: c.id, step: c.step, status: c.status })),
      tablets: () => [...(engine.state?.data?.tablets || [])],
      items: (ids) => Object.fromEntries(ids.map((id) => [id, engine.state?.itemCount?.(id) ?? 0])),
      hour: () => engine.state?.hour ?? null,
      choiceItems: () => {
        const top = engine.scenes.top;
        return (top?.items || []).map((it) => (typeof it === 'string' ? it : it?.label || ''));
      },
      eventAlive: (id) => {
        const ev = findEvent(id);
        return Boolean(ev && !ev.erased && ev.page);
      },
      eventPage: (id) => {
        const ev = findEvent(id);
        return ev ? ev.pageIndex ?? ev.pages?.indexOf?.(ev.page) ?? null : null;
      },
    };
  }, loseOnce);
}
