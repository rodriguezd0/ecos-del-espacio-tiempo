// Consultas del desenlace: equipo, escena, epilogo y creditos reales.
export async function installB21Observer(page){await page.evaluate(async()=>{
const [{engine},crisis]=await Promise.all([import('/src/core/engine.js'),import('/src/content/story/crisis.js')]);
const map=()=>window.__map;window.__b21={battles:window.__campaign.battles,
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      items: (id) => engine.state?.itemCount?.(id) ?? 0,
      tablets: () => [...(engine.state?.data?.tablets || [])],
      party: () => (engine.state?.party || []).map((p) => ({ species: p.species, form: p.form, level: p.level, ball: p.ball, ability: p.ability, egg: Boolean(p.egg), hp: p.hp, moves: p.moves.map((m) => m.id) })),
      boxed: () => (engine.state?.data?.boxes || []).flat().filter(Boolean).map((p) => p.species),
      /** Como hacerlo en un PC: deja al Pokémon `i` del equipo en la caja 1. */
      zygarde: () => ({ form: engine.state?.zygardeForm ?? null, jump: Boolean(engine.state?.zygardeAbility?.('jump')), anchor: Boolean(engine.state?.zygardeAbility?.('anchor')) }),
      clock: () => engine.state?.data?.clock?.minutes ?? null,
      crisis: () => crisis.crisisPhase(engine.state),
      jumping: () => Boolean(map()?.zygarde?.jump),
      cinematic: () => Boolean(map()?.cinematic),
      eventPos: (id) => {
        const ev = map()?.world?.events?.find((e) => e.id === id);
        return ev ? { x: ev.x, y: ev.y, alive: Boolean(!ev.erased && ev.page) } : null;
      },
      choiceItems: () => [...(engine.scenes.top?.items || [])].map((i) => (typeof i === 'string' ? i : i?.label ?? i?.text ?? String(i))),
      mapHas: (id) => Boolean(window.__mapsRegistered?.[id]),

};
});}
