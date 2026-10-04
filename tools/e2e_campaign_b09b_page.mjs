// Solo lectura de salas, objetos y pistas.
export async function installB09bObserver(page){await page.evaluate(async()=>{
const {engine}=await import('/src/core/engine.js');
    const map = () => window.__map;
    const findEvent = (id) => map()?.world?.events?.find((e) => e.id === id) || null;
    window.__b09b = {
      lost: [],
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


});}
