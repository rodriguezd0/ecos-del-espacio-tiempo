// Observaciones y planes puros; los controles ejecutan todos los pasos de la partida.
export async function installB11Observer(page){await page.evaluate(async()=>{
const [{engine},t10,stealth]=await Promise.all([import('/src/core/engine.js'),import('/src/content/events/b11_t10.js'),import('/src/content/events/b01_north_stealth.js')]);
    const map = () => window.__map;
    const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
    const key = (x, y) => `${x},${y}`;

    /** Casillas que vigila cada centinela en cada dirección (con la pasabilidad real). */
    function sightTable() {
      const out = new Map();
      for (const s of t10.SENTINELS) {
        const ev = map().world.events.find((e) => e.id === s.id);
        if (!ev || ev.erased || !ev.page) continue;

        const byDir = {};
        for (const d of [2, 4, 6, 8]) {
          const view = Object.create(ev); Object.defineProperty(view, "direction", {value:d});
          const n = stealth.sightReach(view, t10.SIGHT);
          byDir[d] = new Set(Array.from({ length: n }, (_, i) => key(s.x + DV[d][0] * (i + 1), s.y + DV[d][1] * (i + 1))));
        }

        out.set(s.id, { s, byDir });
      }
      return out;
    }

    /**
     * Siguiente acción segura hacia (gx, gy) con el reloj de los centinelas: 2/4/6/8 o 0 (esperar) o null (sin plan).
     * `step` = fotogramas por casilla; `margin` = colchón de fotogramas (latencia de las teclas).
     */
    function stealthNext(gx, gy, { step = 16, margin = 14, horizon = 3000 } = {}) {
      const m = map();
      const p = m.world.player;
      const gm = m.world.map;
      const table = sightTable();
      const watched = (k, f0, f1) => {
        for (let f = f0; f <= f1; f += 4) {
          for (const { s, byDir } of table.values()) if (byDir[t10.sentinelDir(s, f)].has(k)) return true;
        }
        return false;
      };
      const start = { x: p.x, y: p.y, t: m.frame, first: null };
      const seen = new Set();
      const queue = [start];

      while (queue.length) {
        const cur = queue.shift();
        if (cur.t - start.t > horizon) continue;
        const moves = [[0, cur.x, cur.y]];
        for (const d of [2, 4, 6, 8]) {
          const nx = cur.x + DV[d][0]; const ny = cur.y + DV[d][1];
          if (!gm.valid(nx, ny)) continue;

          if (!p.passable(cur.x, cur.y, d)) continue;
          moves.push([d, nx, ny]);
        }
        for (const [d, nx, ny] of moves) {
          const nt = cur.t + step;
          if (watched(key(cur.x, cur.y), cur.t, nt + margin) || watched(key(nx, ny), cur.t, nt + margin)) continue;
          const vk = `${nx},${ny},${Math.floor(nt / step)}`;
          if (seen.has(vk)) continue;
          seen.add(vk);
          const first = cur.first ?? d;
          if (nx === gx && ny === gy) { return first; }
          queue.push({ x: nx, y: ny, t: nt, first });
        }
      }

      return null;
    }

    /** Casillas vigiladas AHORA (para provocar a propósito una alarma). */
    function watchedNow() {
      const table = sightTable();
      const out = [];
      for (const { s, byDir } of table.values()) for (const k of byDir[t10.sentinelDir(s, map().frame)]) out.push(k);
      return out;
    }

    window.__b11 = {
      lost: [],
      stealthNext,
      watchedNow,
      frame: () => map()?.frame ?? 0,
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      tablets: () => [...(engine.state?.data?.tablets || [])],
      items: (id) => engine.state?.itemCount?.(id) ?? 0,
      clues: () => (engine.state?.clues || []).map((c) => ({ id: c.id, step: c.step, status: c.status })),
      hasClue: (id) => Boolean(engine.state?.hasClue?.(id)),
      party: () => (engine.state?.party || []).map((p) => ({ species: p.species, egg: Boolean(p.egg), eggSteps: p.eggSteps ?? null })),
      choiceItems: () => [...(engine.scenes.top?.items || [])].map((i) => (typeof i === 'string' ? i : i?.label ?? i?.text ?? String(i))),
      eventAlive: (id) => {
        const ev = map()?.world?.events?.find((e) => e.id === id);
        return Boolean(ev && !ev.erased && ev.page);
      },
      eventPos: (id) => { const ev = map()?.world?.events?.find((e) => e.id === id); return ev ? { x: ev.x, y: ev.y, dir: ev.direction } : null; },
      hour: () => engine.state?.hour ?? null,
    };


});}
