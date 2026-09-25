// Ayudantes del recorrido E2E del Bloque 19 que se instalan DENTRO de la página (window.__b19), además de los de
// tools/e2e_b01_page.mjs (window.__e2e): piloto de combate (entrenadores: luchar; el Salamence Alfa: luchar; otros
// salvajes: huir; derrotas simuladas una vez contra ids concretos) y estado (variables, Tablillas, pistas, objetos,
// interruptores y eventos).

export async function installB19Helpers(page, { loseOnce = [] } = {}) {
  await page.evaluate(async (lose) => {
    const [{ engine }, api] = await Promise.all([import('/src/core/engine.js'), import('/src/battle/api.js')]);
    const pending = new Set(lose);
    const lost = [];
    const battles = [];
    api.installBattle(async (cfg) => {
      const id = typeof cfg.trainer === 'string' ? cfg.trainer : null;
      const wild = cfg.type === 'wild' ? (cfg.wild?.species || 'salvaje') : null;
      battles.push(id || wild || cfg.type || 'combate');
      if (id && pending.has(id)) {
        pending.delete(id);
        lost.push(id);
        return { outcome: 'lose', stored: true };
      }
      const fightWild = cfg.type === 'wild' && cfg.wild?.alpha;
      return api.startBattle({ ...cfg, auto: cfg.type === 'wild' && !fightWild ? 'run' : 'fight' });
    });
    const map = () => window.__map;
    window.__b19 = {
      lost,
      battles,
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      tablets: () => [...(engine.state?.data?.tablets || [])],
      items: (id) => engine.state?.itemCount?.(id) ?? 0,
      clue: (id) => (engine.state?.data?.clues || []).find((c) => c.id === id) || null,
      selfSwitch: (mapId, id) => Boolean(engine.state?.selfSwitch?.(mapId, id, 'A')),
      choiceItems: () => [...(engine.scenes.top?.items || [])].map((i) => (typeof i === 'string' ? i : i?.label ?? i?.text ?? String(i))),
      eventAlive: (id) => {
        const ev = map()?.world?.events?.find((e) => e.id === id);
        return Boolean(ev && !ev.erased && ev.page);
      },
      eventPos: (id) => { const ev = map()?.world?.events?.find((e) => e.id === id); return ev ? { x: ev.x, y: ev.y, dir: ev.direction } : null; },
      /** ¿Se puede pisar (x, y)? (pasabilidad real desde la casilla vecina en `dir`) */
      tileBlocked: (x, y) => {
        const gm = map()?.world?.map;
        return gm ? !gm.passableStrict(x, y) : null;
      },
    };
  }, loseOnce);
}
