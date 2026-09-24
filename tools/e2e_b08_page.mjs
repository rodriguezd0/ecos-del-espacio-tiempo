// Ayudantes del recorrido E2E del Bloque 8 que se instalan DENTRO de la página (window.__b08), además de los de
// tools/e2e_b01_page.mjs (window.__e2e): piloto automático de combate, derrotas simuladas contra entrenadores
// concretos (reintentos sin pérdida), estado de la partida (variables, montura, mochila, pistas, tablillas),
// género del jugador, hora del reloj de juego y curar al equipo entre tramos.

export async function installB08Helpers(page, { loseOnce = [], gender = 'M' } = {}) {
  await page.evaluate(async ({ lose, g }) => {
    const [{ engine }, api, { healed }, mount, transport] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/battle/core/pokemon.js'),
      import('/src/world/zygarde/mount.js'), import('/src/world/transport.js'),
    ]);
    const pending = new Set(lose);
    const lost = [];
    const battles = [];
    // Clave de un combate: el entrenador, o los dos unidos con «+» en los dobles.
    const keyOf = (cfg) => (typeof cfg.trainer === 'string' ? cfg.trainer : (Array.isArray(cfg.trainers) ? cfg.trainers.join('+') : null));
    api.installBattle(async (cfg) => {
      const id = keyOf(cfg);
      if (id && pending.has(id)) {
        pending.delete(id);
        lost.push(id);
        return { outcome: 'lose', stored: true };
      }
      battles.push({ id, type: cfg.type || (cfg.trainer ? 'trainer' : 'wild'), format: cfg.format || 'single', ally: Boolean(cfg.ally) });
      return api.startBattle({ ...cfg, auto: cfg.type === 'wild' ? 'run' : 'fight' });
    });
    if (engine.state?.data?.player) engine.state.data.player.gender = g;
    window.__b08 = {
      lost,
      battles,
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      riding: () => mount.isRiding(window.__map?.world),
      has: (item) => Boolean(engine.state?.hasItem?.(item) || engine.state?.hasKeyItem?.(item)),
      clues: () => (engine.state?.clues || []).map((c) => ({ id: c.id, step: c.step, status: c.status })),
      tablets: () => [...(engine.state?.data?.tablets || [])],
      fragments: () => [...(engine.state?.data?.fragments || [])],
      gender: () => engine.state?.player?.gender,
      /** Pone el reloj de juego a la hora `h` y refresca los eventos (páginas de noche/día). */
      setHour(h) {
        engine.state.data.clock.minutes = ((h * 60) % 1440 + 1440) % 1440;
        window.__map?.world?.requestRefresh?.();
        return engine.state.hour;
      },
      setVar(k, v) { engine.state.setVar(k, v); window.__map?.world?.requestRefresh?.(); },
      eventAt(id) {
        const ev = window.__map?.world?.events?.find((e) => e.id === id);
        return ev ? { x: ev.x, y: ev.y, alive: Boolean(!ev.erased && ev.page), blocks: Boolean(!ev.erased && ev.page && !ev.page.through), dir: ev.direction } : null;
      },
      /** Destinos de tren disponibles desde una estación (para elegir «Cancelar», que va el último). */
      trainDestinations: (from) => transport.destinations(engine.state, transport.TRAIN, from).map((s) => s.id),
      heal: () => { const st = engine.state; st.setParty(st.party.map((p) => healed(engine.data, p))); },
      /**
       * Espera (dentro de la página, sin ida y vuelta por cada comprobación) a que el jugador empiece a moverse,
       * cambie de mapa, salte un guion o cambie el puzle de la Cámara. → true si cambió algo antes de `timeout` ms.
       */
      waitChange({ x, y, map, puzzle, timeout = 1500 }) {
        return new Promise((resolve) => {
          const t0 = performance.now();
          const tick = () => {
            const m = window.__map;
            const p = m?.world?.player;
            const pz = JSON.stringify(engine.state?.data?.vars?.b08_camara ?? null);
            const changed = !p || m.world.map?.id !== map || p.x !== x || p.y !== y || m.world.scriptBusy() || engine.scenes.top !== m || pz !== puzzle;
            if (changed || performance.now() - t0 > timeout) { resolve(changed); return; }
            setTimeout(tick, 4);
          };
          tick();
        });
      },
    };
  }, { lose: loseOnce, g: gender });
}
