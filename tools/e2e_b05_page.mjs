// Ayudantes que tools/e2e_b05.mjs instala DENTRO de la página (window.__e2e), con los mismos módulos ES que el juego:
// estado resumido (flags, vars, células, Tablillas, pistas, objetos), rutas a pie (BFS), transcripción de diálogos y
// piloto automático de combate (TODOS los combates se luchan: la horda de Elekid de T03 no se puede huir).

/** Instala window.__e2e en la página (espera a que el motor exista). */
export async function installHelpers(page) {
  await page.waitForFunction(() => document.querySelector('#stage') !== null, null, { timeout: 20000 });
  await page.evaluate(async () => {
    const [{ engine }, api, { MessageBox }, { maxHP }] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/ui/message/messageBox.js'),
      import('/src/battle/core/pokemon.js'),
    ]);
    const log = [];
    const show = MessageBox.prototype.show;
    MessageBox.prototype.show = function patchedShow(text, opts = {}) {
      log.push({ text: String(text), speaker: opts.telepathy ? 'Core' : (opts.speaker || '') });
      return show.call(this, text, opts);
    };
    const battles = [];
    api.installBattle((cfg) => {
      battles.push({ type: cfg.type || (cfg.trainer ? 'trainer' : 'wild'), format: cfg.format || 'single', trainer: typeof cfg.trainer === 'string' ? cfg.trainer : null });
      return api.startBattle({ ...cfg, auto: 'fight' });
    });

    const DIRS = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]];
    const map = () => window.__map;

    /** Ruta más corta (la hierba alta cuesta más) hasta (tx, ty) o a su lado. Devuelve direcciones 2/4/6/8. */
    function route(tx, ty, { onto = true } = {}) {
      const m = map();
      if (!m?.world?.map) return null;
      const p = m.world.player;
      const gm = m.world.map;
      const W = gm.width;
      const key = (x, y) => y * W + x;
      const goal = (x, y) => (onto ? x === tx && y === ty : Math.abs(x - tx) + Math.abs(y - ty) === 1);
      const dist = new Map([[key(p.x, p.y), 0]]);
      const prev = new Map();
      const open = [[p.x, p.y]];
      while (open.length) {
        let bi = 0;
        for (let i = 1; i < open.length; i++) if (dist.get(key(...open[i])) < dist.get(key(...open[bi]))) bi = i;
        const [x, y] = open.splice(bi, 1)[0];
        if (goal(x, y)) {
          const out = [];
          let k = key(x, y);
          while (prev.has(k)) { const [pk, d] = prev.get(k); out.unshift(d); k = pk; }
          return out;
        }
        for (const [d, ox, oy] of DIRS) {
          const nx = x + ox;
          const ny = y + oy;
          if (!gm.valid(nx, ny) || !p.passable(x, y, d)) continue;
          const tag = gm.terrainTagAt(nx, ny);
          const cost = (tag?.landWildEncounters || tag?.id === 'TallGrass' || tag?.id === 'Grass') ? 6 : 1;
          const nd = dist.get(key(x, y)) + cost;
          if (nd < (dist.get(key(nx, ny)) ?? Infinity)) {
            if (!dist.has(key(nx, ny))) open.push([nx, ny]);
            dist.set(key(nx, ny), nd);
            prev.set(key(nx, ny), [key(x, y), d]);
          }
        }
      }
      return null;
    }

    window.__e2e = {
      engine,
      log,
      battles,
      route,
      snap() {
        const top = engine.scenes.top;
        const m = map();
        const st = engine.state;
        const p = m?.world?.player;
        return {
          top: top?.constructor?.name || null,
          ready: Boolean(m?.ready),
          map: m?.world?.map?.id ?? null,
          x: p?.x ?? null,
          y: p?.y ?? null,
          dir: p?.direction ?? null,
          hour: st?.hour ?? null,
          busy: m ? Boolean(m.world.scriptBusy()) : false,
          playerBusy: p ? p.busy() : false,
          flags: { ...(st?.data?.flags || {}) },
          vars: { ...(st?.data?.vars || {}) },
          cells: [...(st?.data?.zygarde?.cells || [])],
          ram: Boolean(st?.zygardeAbility?.('ram')),
          riding: Boolean(m?.world?.zygMount?.riding || m?.world?.zygMount?.form),
          tablets: [...(st?.data?.tablets || [])],
          clues: (st?.data?.clues || []).map((c) => ({ id: c.id, step: c.step, status: c.status, solved: c.solved })),
          party: (st?.party || []).map((pk) => `${pk.species}:${pk.level}`),
          items: { HERACRONITE: st?.itemCount?.('HERACRONITE') ?? 0, RAICHUITEX: st?.itemCount?.('RAICHUITEX') ?? 0, SPLASHPLATE: st?.itemCount?.('SPLASHPLATE') ?? 0, ZAPPLATE: st?.itemCount?.('ZAPPLATE') ?? 0 },
          darkness: m?.darkness ? m.darkness.amount : 0,
          choiceIndex: top?.win?.index ?? 0,
          choiceReady: Boolean(top?.win),
          choiceItems: Array.isArray(top?.items) ? top.items.map((i) => (typeof i === 'string' ? i : i?.label ?? i?.text ?? String(i))) : [],
          lastText: log.length ? log[log.length - 1].text : '',
        };
      },
      eventPos(id) {
        const ev = map()?.world?.events?.find((e) => e.id === id);
        return ev ? { x: ev.x, y: ev.y, erased: ev.erased, page: ev.pageIndex } : null;
      },
      selfSwitch(mapId, id) { return Boolean(engine.state?.selfSwitch(mapId, id, 'A')); },
      warpTo(to) {
        const warps = (map()?.world?.current?.def?.warps || []).filter((w) => w.to === to);
        const w = warps.find((x) => !x.dirTrigger) || warps[Math.floor(warps.length / 2)];
        return w ? { x: w.x, y: w.y, dirTrigger: w.dirTrigger || 0 } : null;
      },
      /** Como haría un jugador entre combates: cura al equipo con la API de estado si va muy tocado. */
      patchUp(ratio = 0.5) {
        const st = engine.state;
        const pk = st?.party?.[0];
        if (!pk) return null;
        const hpMax = maxHP(engine.data, pk);
        if (!(pk.hp < hpMax * ratio) || !(st.itemCount('SUPERPOTION') > 0)) return null;
        st.removeItem('SUPERPOTION', 1);
        const hp = Math.min(hpMax, pk.hp + 60);
        st.setPartyMember(0, { ...pk, hp });
        return hp;
      },
      /** Transferencia fuera del bloque (solo para saltar un mapa de otro bloque que aún no sea transitable). */
      transfer(id, x, y, dir) { return map()?.transfer(id, x, y, dir); },
    };
  });
}
