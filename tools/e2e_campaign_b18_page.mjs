export async function installB18Observer(page){await page.evaluate(async()=>{const {engine}=await import('/src/core/engine.js');
    const map = () => window.__map;
    window.__b18 = {
      lost: [],
      battles: window.__campaign.battles,
      /** El próximo combate contra el elegido se juega en modo captura (40 % de PS y Poké Ball). */
      /** Anula las derrotas simuladas pendientes (tramos que se cargan de nuevo y no deben perder). */
      axis: () => engine.state?.var?.('cadena_eje', null) ?? null,
      tone: () => {
        const t = map()?.world?.current?.def?.tone;
        return Array.isArray(t) ? [...t] : null;
      },
      voidAt: (x, y) => Boolean(map()?.world?.map?.isVoid?.(x, y)),
      walkable: (x, y) => Boolean(map()?.world?.map?.playerPassable?.(x, y, 2, {})),
      party: () => (engine.state?.party || []).map((p) => p.species),
      boxHas: (sp) => (engine.state?.data?.boxes || []).some((b) => b.some((p) => p?.species === sp)),
      restCount: () => engine.state?.var?.('rest_count', 0) ?? 0,
    };

});}
