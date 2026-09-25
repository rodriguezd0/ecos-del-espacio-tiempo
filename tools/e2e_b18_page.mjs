// Ayudantes del recorrido E2E del Bloque 18 que se instalan DENTRO de la página (window.__b18), además de los de
// tools/e2e_b01_page.mjs (window.__e2e) y e2e_b16_page.mjs (window.__b16: estado, eventos, variables):
//   · piloto de combate propio (sustituye al de B16): entrenadores y el elegido del P9, a luchar; salvajes, huir;
//     derrotas simuladas por etiqueta (una vez cada una: «b18_casia», «p9»…); el elegido en modo «captura» baja al
//     40 % de sus PS y se le lanza la Poké Ball del piloto (la regla del juego decide si se puede).
//   · registro de cada combate con sus reglas (sin huida, canLose, catchCondition evaluada con PS al 100 % y al 40 %).
//   · eje tensado, tono del mapa y estado de las salas de la Cámara.

export async function installB18Helpers(page, { loseOnce = [] } = {}) {
  await page.evaluate(async (lose) => {
    const [{ engine }, api, { maxHP }] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/battle/core/pokemon.js'),
    ]);
    const pending = new Set(lose);
    const lost = [];
    const battles = [];
    const LEGENDS = new Set(['DIALGA', 'PALKIA']);
    const state = { catchNext: false };

    /** Regla de captura del combate con el rival a `ratio` de sus PS (el mismo objeto de función que usa el motor). */
    const verdict = (cfg, ratio) => {
      if (typeof cfg.rules?.catchCondition !== 'function') return null;
      const totalhp = 200;
      const foe = { hp: Math.floor(totalhp * ratio), totalhp, isFainted: () => false };
      try {
        const r = cfg.rules.catchCondition({ battlers: [{ hp: 1, totalhp: 1, isFainted: () => false }, foe] });
        return { allowed: Boolean(r?.allowed), reason: r?.reason ?? null };
      } catch (err) {
        return { error: String(err) };
      }
    };

    const tagOf = (cfg) => {
      if (typeof cfg.trainer === 'string') return cfg.trainer;
      const sp = cfg.opponent?.party?.[0]?.species ?? cfg.wild?.species;
      return cfg.type === 'wild' && LEGENDS.has(sp) ? 'p9' : null;
    };

    api.installBattle(async (cfg) => {
      const tag = tagOf(cfg);
      const foe = cfg.opponent?.party?.[0] || cfg.wild || null;
      const entry = {
        tag, type: cfg.type, species: foe?.species ?? null, level: foe?.level ?? null,
        moves: (foe?.moves || []).map((m) => (typeof m === 'string' ? m : m?.id)).filter(Boolean),
        canRun: cfg.rules?.canRun ?? null, canLose: Boolean(cfg.canLose ?? cfg.rules?.canLose), noMoneyLoss: Boolean(cfg.rules?.noMoneyLoss),
        catchFull: verdict(cfg, 1), catchLow: verdict(cfg, 0.4), mode: null, outcome: null,
        logAt: window.__e2e?.log?.length ?? null, // líneas mostradas antes del combate (orden de las escenas)
      };
      battles.push(entry);
      if (tag && pending.has(tag)) {
        pending.delete(tag);
        lost.push(tag);
        entry.mode = 'lose';
        entry.outcome = 'lose';
        return { outcome: 'lose', stored: true };
      }
      let run = { ...cfg, auto: cfg.type === 'wild' && tag !== 'p9' ? 'run' : 'fight' };
      if (tag === 'p9' && state.catchNext && cfg.opponent?.party?.[0]) {
        state.catchNext = false;
        const pk = cfg.opponent.party[0];
        const hp = Math.max(1, Math.floor(maxHP(engine.data, pk) * 0.4));
        run = { ...cfg, auto: 'ball', opponent: { ...cfg.opponent, party: [{ ...pk, hp }] } };
      }
      entry.mode = run.auto;
      const res = await api.startBattle(run);
      entry.outcome = res?.outcome ?? null;
      return res;
    });

    const map = () => window.__map;
    window.__b18 = {
      lost,
      battles,
      /** El próximo combate contra el elegido se juega en modo captura (40 % de PS y Poké Ball). */
      catchNext: () => { state.catchNext = true; return true; },
      /** Anula las derrotas simuladas pendientes (tramos que se cargan de nuevo y no deben perder). */
      clearLosses: () => { pending.clear(); return true; },
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
  }, loseOnce);
}
