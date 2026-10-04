export async function installB19Observer(page){await page.evaluate(async()=>{const {engine}=await import('/src/core/engine.js');
    const map = () => window.__map;
    window.__b19 = {
      lost: [],
      battles: window.__campaign.battles,
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

});}
