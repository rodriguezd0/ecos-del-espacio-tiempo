// Observa el puzle, eventos y destinos; nunca escribe progreso ni estad?sticas.
export async function installB08Observer(page){await page.evaluate(async()=>{
 const [{engine},mount,transport]=await Promise.all([import('/src/core/engine.js'),import('/src/world/zygarde/mount.js'),import('/src/world/transport.js')]);
    window.__b08 = {
      lost: [],
      battles: window.__campaign.battles,
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      riding: () => mount.isRiding(window.__map?.world),
      has: (item) => Boolean(engine.state?.hasItem?.(item) || engine.state?.hasKeyItem?.(item)),
      clues: () => (engine.state?.clues || []).map((c) => ({ id: c.id, step: c.step, status: c.status })),
      tablets: () => [...(engine.state?.data?.tablets || [])],
      fragments: () => [...(engine.state?.data?.fragments || [])],
      gender: () => engine.state?.player?.gender,
      eventAt(id) {
        const ev = window.__map?.world?.events?.find((e) => e.id === id);
        return ev ? { x: ev.x, y: ev.y, alive: Boolean(!ev.erased && ev.page), blocks: Boolean(!ev.erased && ev.page && !ev.page.through), dir: ev.direction } : null;
      },
      /** Destinos de tren disponibles desde una estación (para elegir «Cancelar», que va el último). */
      trainDestinations: (from) => transport.destinations(engine.state, transport.TRAIN, from).map((s) => s.id),
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

});}
