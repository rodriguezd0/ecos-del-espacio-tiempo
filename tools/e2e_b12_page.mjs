// Ayudantes del recorrido E2E del Bloque 12 que se instalan DENTRO de la página (window.__b12), además de los de
// tools/e2e_b01_page.mjs (window.__e2e): estado (variables, Ancla, forma y capacidades de Zygarde, objetos, giro de
// pantalla, siluetas del panorama), rutas que no pisan el vacío, planificadores de las salas del Pilar Invertido (La
// Cara Vuelta: estados casilla física × orientación; La Mirada: casilla × dirección, girando solo en suelo firme),
// espera de pasos dentro de la página y un salto de mapa conservando la partida (para comprobar Nadar en un mapa de
// otro bloque sin recorrer media región).

export async function installB12Helpers(page) {
  await page.evaluate(async () => {
    const [{ engine }, api, logic, rooms, terrain] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'),
      import('/src/world/impossible/logic.js'), import('/src/content/maps/b12/rooms.js'), import('/src/world/terrain.js'),
    ]);
    api.installBattle((cfg) => api.startBattle({ ...cfg, auto: cfg.type === 'wild' ? 'run' : 'fight' }));
    const map = () => window.__map;
    const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
    const k2 = (x, y) => `${x},${y}`;

    /** ¿Puede el jugador dar un paso de (x, y) hacia `d`? (pasabilidad real, con eventos) */
    function canStep(x, y, d) {
      const p = map().world.player;
      const [px, py] = [p.x, p.y];
      p.x = x; p.y = y;
      try { return p.passable(x, y, d); } finally { p.x = px; p.y = py; }
    }

    /** Ruta a pie (BFS) que no termina ningún paso en el vacío. → [dir…] | null */
    function safeRoute(tx, ty, { onto = true } = {}) {
      const m = map();
      if (!m?.world?.map) return null;
      const gm = m.world.map;
      const p = m.world.player;
      const goal = (x, y) => (onto ? x === tx && y === ty : Math.abs(x - tx) + Math.abs(y - ty) === 1);
      const prev = new Map([[k2(p.x, p.y), null]]);
      const q = [[p.x, p.y]];
      while (q.length) {
        const [x, y] = q.shift();
        if (goal(x, y)) {
          const out = [];
          let k = k2(x, y);
          while (prev.get(k)) { const [pk, d] = prev.get(k); out.unshift(d); k = pk; }
          return out;
        }
        for (const d of [2, 4, 6, 8]) {
          const nx = x + DV[d][0];
          const ny = y + DV[d][1];
          if (!gm.valid(nx, ny) || prev.has(k2(nx, ny))) continue;
          if (logic.isVoidCell(gm, nx, ny) || !canStep(x, y, d)) continue;
          prev.set(k2(nx, ny), [k2(x, y), d]);
          q.push([nx, ny]);
        }
      }
      return null;
    }

    /** Sala y orientación del mapa actual de La Cara Vuelta (o null). */
    function facetInfo() {
      const id = map()?.world?.map?.id || '';
      const m = /^pilar_invertido_(cara_\d)(_giro)?$/.exec(id);
      if (!m) return null;
      const room = rooms.facetRoom(m[1]);
      const o = m[2] ? 1 : 0;
      return { room, o, masks: logic.facetMasks(room, o, rooms.MARGIN) };
    }

    /** Casilla física de la sala para una casilla del mapa (inversa de facetMasks().map). */
    function toPhys(info, mx, my) {
      const M = rooms.MARGIN;
      if (!info.o) return [mx - M, my - M];
      const H = info.room.h + M * 2;
      const [x, y] = logic.rotatePoint(mx, my, H, info.room.w + M * 2, -1);
      return [x - M, y - M];
    }

    /**
     * Siguiente dirección de pantalla hacia `goal` ('exit' | 'cell' | 'item:<id>') en La Cara Vuelta, planificando
     * sobre estados (casilla física, orientación): pisar una arista gira. null = sin plan; 0 = ya está.
     */
    function facetNext(goal = 'exit') {
      const info = facetInfo();
      if (!info) return null;
      const { room } = info;
      const p = map().world.player;
      const [px, py] = toPhys(info, p.x, p.y);
      const blocked = new Set(room.anchors.map((a) => `${a.x},${a.y},0`).concat(room.anchors.map((a) => `${a.x},${a.y},1`)));
      for (const it of room.items) blocked.add(`${it.x},${it.y},${it.orient ?? 0}`);
      const base = logic.facetNeighbours(room);
      const next = (s) => base(s).filter((n) => !blocked.has(`${n.x},${n.y},${n.o}`) && !blocked.has(`${n.x},${n.y},${s.o}`));
      let target;
      if (goal === 'exit') target = (s) => s.x === room.exit.x && s.y === room.exit.y;
      else if (goal === 'cell') target = (s) => s.x === room.cell.x && s.y === room.cell.y && s.o === room.cellOrient;
      else {
        const it = room.items.find((i) => `item:${i.id}` === goal);
        if (!it) return null;
        target = (s) => Math.abs(s.x - it.x) + Math.abs(s.y - it.y) === 1 && s.o === (it.orient ?? 0);
      }
      const start = { x: px, y: py, o: info.o };
      const k = (s) => `${s.x},${s.y},${s.o}`;
      if (target(start)) return 0;
      const prev = new Map([[k(start), null]]);
      const q = [start];
      let hit = null;
      while (q.length && !hit) {
        const s = q.shift();
        for (const n of next(s)) {
          if (prev.has(k(n))) continue;
          prev.set(k(n), s);
          if (target(n)) { hit = n; break; }
          q.push(n);
        }
      }
      if (!hit) return null;
      let s = hit;
      while (k(prev.get(k(s))) !== k(start)) s = prev.get(k(s));
      const [ax, ay] = info.masks.map(px, py);
      const [bx, by] = info.masks.map(s.x, s.y);
      const d = Object.entries(DV).find(([, [dx, dy]]) => dx === bx - ax && dy === by - ay);
      return d ? Number(d[0]) : null;
    }

    /**
     * La Mirada: siguiente acción hacia (gx, gy) (o a su lado con adj) sobre estados (casilla, dirección): girar solo en
     * suelo firme; avanzar a suelo o a una losa de puente mirando hacia ella. → { turn } | { step } | null | 0 (llegó)
     */
    function gazeNext(gx, gy, { adj = false } = {}) {
      const m = map();
      const gm = m.world.map;
      const p = m.world.player;
      const bridges = new Set(m.world.events.filter((e) => e.def?.type === 'puenteMirada').map((e) => k2(e.x, e.y)));
      const firm = (x, y) => gm.valid(x, y) && !logic.isVoidCell(gm, x, y);
      const k = (x, y, d) => `${x},${y},${d}`;
      const goal = (x, y) => (adj ? Math.abs(x - gx) + Math.abs(y - gy) === 1 : x === gx && y === gy);
      if (goal(p.x, p.y)) return 0;
      const start = k(p.x, p.y, p.direction);
      const prev = new Map([[start, null]]);
      const q = [[p.x, p.y, p.direction]];
      while (q.length) {
        const [x, y, d] = q.shift();
        const moves = [];
        if (firm(x, y) && !bridges.has(k2(x, y))) for (const nd of [2, 4, 6, 8]) if (nd !== d) moves.push([x, y, nd, 'turn']);
        const nx = x + DV[d][0];
        const ny = y + DV[d][1];
        if (gm.valid(nx, ny) && (firm(nx, ny) || bridges.has(k2(nx, ny))) && canStep(x, y, d)) moves.push([nx, ny, d, 'step']);
        for (const [mx, my, md, kind] of moves) {
          const kk = k(mx, my, md);
          if (prev.has(kk)) continue;
          prev.set(kk, [k(x, y, d), kind, md]);
          if (kind === 'step' && goal(mx, my)) {
            let cur = kk;
            while (prev.get(cur)[0] !== start) cur = prev.get(cur)[0];
            const [, kind0, d0] = prev.get(cur);
            return kind0 === 'turn' ? { turn: d0 } : { step: d0 };
          }
          q.push([mx, my, md]);
        }
      }
      return null;
    }

    /** Dirección desde la casilla del jugador hacia una vecina que sea vacío (para dejarse caer). */
    function voidDir() {
      const m = map();
      const p = m.world.player;
      for (const d of [2, 4, 6, 8]) {
        const nx = p.x + DV[d][0];
        const ny = p.y + DV[d][1];
        if (logic.isVoidCell(m.world.map, nx, ny) && canStep(p.x, p.y, d)) return d;
      }
      return null;
    }

    /** Orilla más cercana a (x, y): casilla de tierra alcanzable con agua navegable al lado. → { x, y, dir } | null */
    function shoreNear(x, y, radius = 12) {
      const gm = map().world.map;
      let best = null;
      for (let yy = y - radius; yy <= y + radius; yy++) {
        for (let xx = x - radius; xx <= x + radius; xx++) {
          if (!gm.valid(xx, yy) || !gm.passableStrict(xx, yy) || terrain.canSurfFreely(gm.terrainTagAt(xx, yy))) continue;
          for (const d of [2, 4, 6, 8]) {
            const wx = xx + DV[d][0];
            const wy = yy + DV[d][1];
            if (!gm.valid(wx, wy) || !terrain.canSurfFreely(gm.terrainTagAt(wx, wy))) continue;
            const dist = Math.abs(xx - x) + Math.abs(yy - y);
            if (!best || dist < best.dist) best = { x: xx, y: yy, dir: d, dist };
          }
        }
      }
      return best;
    }

    window.__b12 = {
      safeRoute,
      facetNext,
      facetInfo: () => { const i = facetInfo(); return i ? { room: i.room.id, o: i.o } : null; },
      gazeNext,
      voidDir,
      shoreNear,
      vars: () => ({ ...(engine.state?.data?.vars || {}) }),
      anchor: () => engine.state?.var?.(logic.ANCHOR_VAR, null) ?? null,
      form: () => engine.state?.zygardeForm ?? null,
      ability: (k) => Boolean(engine.state?.zygardeAbility?.(k)),
      cores: () => [...(engine.state?.data?.zygarde?.cores || [])],
      fragments: () => [...(engine.state?.data?.fragments || [])],
      items: (id) => engine.state?.itemCount?.(id) ?? 0,
      hp: () => (engine.state?.party || []).map((pk) => pk.hp),
      surfing: () => Boolean(map()?.world?.player?.surfing),
      eventAlive: (id) => { const ev = map()?.world?.events?.find((e) => e.id === id); return Boolean(ev && !ev.erased && ev.page); },
      eventPos: (id) => { const ev = map()?.world?.events?.find((e) => e.id === id); return ev ? { x: ev.x, y: ev.y, dir: ev.direction, opacity: ev.opacity } : null; },
      bridgesVisible: () => (map()?.world?.events || []).filter((e) => e.def?.type === 'puenteMirada' && e.opacity > 0).length,
      rotation: () => map()?.fx?.rotation ?? 0,
      panorama: () => Boolean(map()?.panorama?.active),
      silhouettes: () => map()?.panorama?.silhouettes?.length ?? 0,
      /** Avance (0..1) de la primera silueta que cruza el fondo, o -1 si no hay ninguna. */
      silhouetteProgress: () => { const s = map()?.panorama?.silhouettes?.[0]; return s ? s.t / s.frames : -1; },
      coreStill: () => { const c = map()?.world?.core; return c ? !c.stepAnime && !c.walkAnime : null; },
      /** Espera (dentro de la página) a que el paso empiece o algo lo interrumpa. → true si cambió */
      waitChange({ x, y, map: id, timeout = 1500 }) {
        return new Promise((resolve) => {
          const t0 = performance.now();
          const tick = () => {
            const m = window.__map;
            const p = m?.world?.player;
            const changed = !p || m.world.map?.id !== id || p.x !== x || p.y !== y || m.world.scriptBusy() || engine.scenes.top !== m;
            if (changed || performance.now() - t0 > timeout) { resolve(changed); return; }
            setTimeout(tick, 4);
          };
          tick();
        });
      },
      /** Espera (dentro de la página) a que arranque un guion o se abra otra escena. → true si arrancó */
      waitBusy(timeout = 1200) {
        return new Promise((resolve) => {
          const t0 = performance.now();
          const tick = () => {
            const m = window.__map;
            const busy = Boolean(m && (m.world.scriptBusy() || engine.scenes.top !== m));
            if (busy || performance.now() - t0 > timeout) { resolve(busy); return; }
            setTimeout(tick, 4);
          };
          tick();
        });
      },
      /** Salto de mapa conservando la partida (solo pruebas; el guion normal no lo usa). */
      warp(id, x, y, dir = 2) {
        const m = map();
        m.runScript(async (ctx) => { await ctx.warp(id, x, y, dir, { fade: true, frames: 10 }); }, null, 'e2e: salto');
        return true;
      },
      /** Pone la hora del reloj de juego (para la noche de Villa Alba). */
      setHour(h) {
        const c = engine.state?.data?.clock;
        if (c) c.minutes = Math.floor(c.minutes / 1440) * 1440 + h * 60;
      },
    };
  });
}
