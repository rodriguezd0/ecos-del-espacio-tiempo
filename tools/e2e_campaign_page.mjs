// Observación y decisiones de combate para UNA partida real. No genera Pokémon, objetos ni progreso.
// El mapa se consulta desde la pila de escenas; no se necesita ?debug ni ninguna API de desarrollador.
export async function installCampaignHelpers(page) {
  await page.waitForFunction(() => document.querySelector('#stage'), null, { timeout: 30000 });
  await page.evaluate(async () => {
    const [{ engine }, api, { MessageBox }, { Autopilot }, { maxHP,types:pkTypes,calcStats }, { calculateEffectiveness }, { canSurfFreely }, { canOfferSwim }] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/ui/message/messageBox.js'),
      import('/src/battle/scene/autopilot.js'), import('/src/battle/core/pokemon.js'), import('/src/battle/core/typeChart.js'),
      import('/src/world/terrain.js'), import('/src/world/waterAccess.js'),
    ]);
    const previous = window.__campaign;
    const log = previous?.log || [], battles = previous?.battles || [];
    const map = () => engine.scenes.stack.find(e => e.scene.constructor.name === 'MapScene')?.scene;
    const show = previous?.originalShow || MessageBox.prototype.show;
    MessageBox.prototype.show = function (text, opts = {}) {
      log.push({ text: String(text), speaker: opts.telepathy ? 'Core' : opts.speaker || '' });
      return show.call(this, text, opts);
    };
    const control = previous?.control || { wild: 'run' };
    api.installBattle(async cfg => {
      const id = typeof cfg.trainer === 'string' ? cfg.trainer : cfg.trainers?.join('+') || null;
      const species = cfg.opponent?.party?.[0]?.species || cfg.wild?.species;
      let catchRule = null;
      try { if (typeof cfg.rules?.catchCondition === 'function') catchRule = cfg.rules.catchCondition(); } catch {}
      const tag = cfg.tag || id || (species === 'ROARINGMOON' ? cfg.rules?.catchCondition ? 'bramaluna_eco' : 'bramaluna_real'
        : species === 'AZELF' ? 'azelf' : ['DIALGA','PALKIA'].includes(species) ? 'p9'
        : ['TORNADUS','THUNDURUS','LANDORUS'].includes(species) ? species.toLowerCase() : cfg.type);
      const entry = { tag, id, outcome: null, wild: cfg.type === 'wild', type: cfg.type,
        trainer:id,trainers:cfg.trainers||[],phases:cfg.phases?.length||0,
        species,level:cfg.opponent?.party?.[0]?.level || cfg.wild?.level,alpha:Boolean(cfg.wild?.alpha),ability:cfg.wild?.ability,
        item:cfg.wild?.heldItem||cfg.wild?.item,canRun:cfg.rules?.canRun,
        catchRule,
        canCatch:cfg.rules?.canCatch,sealedBag:cfg.rules?.sealedBag,
        canLose:Boolean(cfg.canLose ?? cfg.rules?.canLose),noMoneyLoss:Boolean(cfg.rules?.noMoneyLoss),
        catchReason:catchRule?.reason,
        logAt:log.length,moneyBefore:engine.state?.player.money,
        ring: Boolean(engine.state?.hasKeyItem('MEGARING')), format: cfg.format || 'single', ally: cfg.ally?.name || cfg.ally || false };
      battles.push(entry);
      const requiredWild = cfg.canLose || cfg.rules?.canRun === false || cfg.wild?.alpha || cfg.format==='double';
      const auto = control.captureTags?.includes(tag) ? 'ball' : cfg.type === 'wild' && !requiredWild ? control.wild : 'mega';
      entry.mode = auto;
      const result = await api.startBattle({ ...cfg, auto });
      entry.outcome = result.outcome; entry.turns = result.turns; entry.caught = result.caught?.species || null;
      entry.moneyAfter = engine.state?.player.money;
      return result;
    });
    // Decide entre las opciones que ofrece el motor. No escribe estadísticas, PS, PP, resultados ni equipos.
    const oldMove = previous?.originalMove || Autopilot.prototype.move;
    const oldAction = previous?.originalAction || Autopilot.prototype.action;
    const oldItem = previous?.originalItem || Autopilot.prototype.item;
    const oldConfirm = previous?.originalConfirm || Autopilot.prototype.confirm;
    const oldSwitch = previous?.originalSwitch || Autopilot.prototype.switchTo;
    const healing = ['FULLRESTORE', 'HYPERPOTION', 'SUPERPOTION', 'POTION'];
    const sacrifice=['SELFDESTRUCT','EXPLOSION','FINALGAMBIT','MISTYEXPLOSION'];
    const liveBattle=()=>engine.scenes.stack.find(e=>e.scene.constructor.name==='BattleScene')?.scene.battle;
    function matchup(p,foe) {
      if(!p||!foe)return 0;
      const stats=calcStats(engine.data,p),types=pkTypes(engine.data,p),enemy=foe.pbTypes(true);
      let attack=0,threat=0;
      for(const pm of p.moves||[]) {
        const m=engine.data.moves[pm.id];if(!m||m.category==='Status'||sacrifice.includes(m.id)||pm.pp===0)continue;
        attack=Math.max(attack,(m.power||30)*(types.includes(m.type)?1.5:1)*calculateEffectiveness(engine.data.types,m.type,enemy)
          *(m.category==='Special'?stats.spa:stats.atk)*(m.accuracy||100)/100);
      }
      for(const fm of foe.moves||[]) {
        const m=engine.data.moves[fm.id];if(!m||m.category==='Status'||sacrifice.includes(m.id))continue;
        threat=Math.max(threat,(m.power||30)*(enemy.includes(m.type)?1.5:1)*calculateEffectiveness(engine.data.types,m.type,types)
          /Math.max(1,m.category==='Special'?stats.spd:stats.def));
      }
      return attack/Math.max(0.2,threat)*(Math.max(1,p.hp)/maxHP(engine.data,p));
    }
    Autopilot.prototype.switchTo=function(ctx) {
      if(ctx.reason==='revive')return oldSwitch.call(this,ctx);
      const battle=liveBattle(),side=ctx.battler?.side??0,foe=battle?.battlers.find(b=>b&&(b.index&1)!==side&&!b.isFainted());
      const available=ctx.party.filter(p=>p.owned!==false&&p.able&&!p.active&&!p.chosen);
      if(this.switchTarget!==undefined){const i=this.switchTarget;this.switchTarget=undefined;return available.some(p=>p.partyIndex===i)?i:-1;}
      if(ctx.canCancel&&ctx.reason==='command')return -1;
      return available.sort((a,b)=>matchup(b.pokemon,foe)-matchup(a.pokemon,foe))[0]?.partyIndex??oldSwitch.call(this,ctx);
    };
    Autopilot.prototype.action = function (battler, ctx, bag = []) {
      this.healTarget = null;
      if (['fight', 'mega','ball'].includes(this.mode) && battler.hp > 0 && battler.hp < battler.totalhp * 0.35
        && bag.some(it => healing.includes(it.id))) { this.healTarget = battler.partyIndex; return 'bag'; }
      const active=liveBattle();
      if(['fight','mega'].includes(this.mode)&&active?.turnCount===0&&ctx.firstAction) {
        const foe=active.battlers.find(b=>b&&(b.index&1)!==battler.side&&!b.isFainted());
        const options=active.partyOptions(battler.index).filter(p=>p.owned!==false&&p.able&&!p.active&&!p.chosen&&active.pbCanSwitch(battler.index,p.partyIndex,false));
        const best=options.sort((a,b)=>matchup(b.pokemon,foe)-matchup(a.pokemon,foe))[0];
        if(best&&matchup(best.pokemon,foe)>matchup(active.battlers[battler.index].pokemon,foe)*1.7){this.switchTarget=best.partyIndex;return 'pokemon';}
      }
      if (this.mode === 'ball') {
        const battle = engine.scenes.stack.find(e => e.scene.constructor.name === 'BattleScene')?.scene.battle;
        const foe = battle?.battlers.find(b => b && (b.index & 1) !== battler.side && !b.isFainted());
        if (!battle?.pbCatchRules().allowed || foe?.hp > foe?.totalhp * 0.5) return 'fight';
      }
      return oldAction.call(this, battler, ctx, bag);
    };
    Autopilot.prototype.item = function (battler, ctx) {
      if (this.healTarget !== null && this.healTarget !== undefined) {
        const item = healing.map(id => ctx.bag.find(it => it.id === id)).find(Boolean);
        if (item) return { item: item.id, target: this.healTarget, move: -1 };
      }
      if (this.mode === 'ball') {
        const order=['MASTERBALL','ULTRABALL','GREATBALL','DIVEBALL','POKEBALL'];
        const ball=order.map(id=>ctx.bag.find(it=>it.id===id&&it.battleUse==='OnFoe')).find(Boolean);
        if(ball)return {item:ball.id,target:battler.partyIndex,move:-1};
      }
      return oldItem.call(this, battler, ctx);
    };
    Autopilot.prototype.move = function (battler, moves, ctx) {
      if (this.mode === 'cycle') return oldMove.call(this, battler, moves, ctx);
      const battle = engine.scenes.stack.find(e => e.scene.constructor.name === 'BattleScene')?.scene.battle;
      const foe = battle?.battlers.find(b => b && (b.index & 1) !== battler.side && !b.isFainted());
      const score = m => ['SELFDESTRUCT','EXPLOSION','FINALGAMBIT','MISTYEXPLOSION'].includes(m.id) ? -1 : m.category === 'Status' ? 0 : (m.power || 30) * (battler.types.includes(m.type) ? 1.5 : 1)
        * calculateEffectiveness(engine.data.types, m.type, foe?.pbTypes(true) || []) * (m.accuracy || 100) / 100;
      const usable=moves.filter(m => m.selectable !== false);
      const pick = this.mode==='ball' ? usable.filter(m=>score(m)>0).sort((a,b)=>score(a)-score(b))[0]
        || usable[0] : usable.sort((a, b) => score(b) - score(a))[0];
      return pick ? { index: pick.index, mega: this.mode === 'mega' && Boolean(ctx?.canMega) } : null;
    };
    Autopilot.prototype.confirm = function(text) {
      if(/sacar a otro Pok/.test(text))return this.mode!=='run';
      return oldConfirm.call(this,text);
    };
    Autopilot.prototype.learnMove = function (pokemon, moveId) {
      if(['SELFDESTRUCT','EXPLOSION','FINALGAMBIT','MISTYEXPLOSION'].includes(moveId))return null;
      const moves = pokemon.moves || [], db = engine.data.moves;
      const power = id => db[typeof id === 'string' ? id : id.id]?.power || 0;
      const weakest = moves.reduce((best, m, i) => power(m) < power(moves[best]) ? i : best, 0);
      return power(moveId) >= power(moves[weakest]) ? weakest : null;
    };
    const DIRS = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]];
    function route(tx, ty, { onto = true, edge = null, start = null } = {}) {
      const m = map(); if (!m?.world?.map) return null;
      const p = m.world.player, gm = m.world.map, key = (x, y) => y * gm.width + x;
      const goal = (x, y) => edge ? ((edge === 4 && x === 0) || (edge === 6 && x === gm.width - 1)
        || (edge === 8 && y === 0) || (edge === 2 && y === gm.height - 1)) && p.passable(x, y, edge)
        : onto ? x === tx && y === ty : Math.abs(x - tx) + Math.abs(y - ty) === 1;
      const [sx,sy] = start || [p.x,p.y];
      const dist = new Map([[key(sx,sy), 0]]), prev = new Map(), open = [[sx,sy]];
      while (open.length) {
        let best = 0;
        for (let i = 1; i < open.length; i++) if (dist.get(key(...open[i])) < dist.get(key(...open[best]))) best = i;
        const [x, y] = open.splice(best, 1)[0];
        if (goal(x, y)) {
          const out = []; let k = key(x, y);
          while (prev.has(k)) { const [pk, d] = prev.get(k); out.unshift(d); k = pk; }
          return edge ? { x, y, dirs: out } : out;
        }
        for (const [d, dx, dy] of DIRS) {
          const nx = x + dx; let ny = y + dy;
          if (!gm.valid(nx, ny) || !p.passable(x, y, d)) continue;
          if (gm.terrainTagAt(nx, ny)?.ledge) { if (d !== 2) continue; ny++; if (!gm.valid(nx, ny)) continue; }
          const tag = gm.terrainTagAt(nx, ny), cost = tag?.landWildEncounters || ['TallGrass', 'Grass'].includes(tag?.id) ? 8 : 1;
          const nd = dist.get(key(x, y)) + cost, nk = key(nx, ny);
          if (nd >= (dist.get(nk) ?? Infinity)) continue;
          if (!dist.has(nk)) open.push([nx, ny]);
          dist.set(nk, nd); prev.set(nk, [key(x, y), d]);
        }
      }
      return null;
    }
    const eventPos = id => {
      const ev = map()?.world?.events?.find(e => e.id === id);
      return ev ? { x: ev.x, y: ev.y, erased: ev.erased, page: ev.pageIndex } : null;
    };
    const b02 = () => {
      const st = engine.state; if (!st) return {};
      return { keyItems: ['ZYGARDECUBE', 'CLUENOTEBOOK', 'AZUREFRAGMENT', 'ESCAPEROPE'].filter(k => st.hasKeyItem(k) || st.itemCount(k)),
        potions: st.itemCount('POTION'), fragments: [...st.data.fragments],
        clues: st.clues.map(c => `${c.id}:${c.status || (c.solved ? 'solved' : 'active')}`),
        form: st.data.zygarde?.form, run: Boolean(st.data.zygarde?.abilities?.run), room: st.var('b02_casilda_sala', 0),
        hour: st.hour, party: st.party.map(p => `${p.species}:${p.level}:${p.hp}`), healPoint: st.healPoint,
        stones: ['piedra_alba', 'piedra_agua', 'piedra_entrada'].map(id => st.var(`b02_${id}`, 8)) };
    };
    const snap = () => {
      if (!Object.hasOwn(window, '__map')) Object.defineProperty(window, '__map', { configurable: true, get: map });
      const m = map(), st = engine.state, p = m?.world?.player, top = engine.scenes.top;
      return {
        top: top?.constructor.name, titleStage: top?.stage, ready: Boolean(m?.ready), map: m?.world?.map?.id,
        cellCount:st?.data.zygarde.cells.length || 0,night:st ? !st.isDay() : null,
        dive:m?.zygarde?.dive ? {segments:m.zygarde.dive.meter.segments,max:m.zygarde.dive.meter.max} : null,
        zygarde:{form:st?.zygardeForm,jump:Boolean(st?.zygardeAbility('jump')),anchor:Boolean(st?.zygardeAbility('anchor'))},
        jumping:Boolean(m?.zygarde?.jump),cinematic:Boolean(m?.cinematic),
        choiceReady: Boolean(top?.win), kept: Boolean(top?.kept), partyList: st?.party.map(p => p.species) || [],
        partyFull: st?.party.map(p => ({species:p.species,egg:Boolean(p.egg),eggSteps:p.eggSteps})) || [],
        boxedPokemon: (st?.boxes || []).flat().filter(Boolean).map(p=>({species:p.species,egg:Boolean(p.egg),level:p.level})),
        ...(window.__b12 ? {anchor:window.__b12.anchor(),rot:window.__b12.rotation(),sil:window.__b12.silhouettes(),
          silK:window.__b12.silhouetteProgress(),still:window.__b12.coreStill()} : {}),
        x: p?.x, y: p?.y, dir: p?.direction, lastDir: p?.lastDir, busy: Boolean(m?.world?.scriptBusy()), playerBusy: Boolean(p?.busy()),
        mirror: Boolean(m?.world?.current?.def?.mirrorControls), surfing: Boolean(p?.surfing), riding: m?.world?.zygMount?.form === '10',
        abilities: { ...(st?.data.zygarde?.abilities || {}) }, ram: Boolean(st?.zygardeAbility('ram')),
        cores: [...(st?.data.zygarde?.cores || [])], fragments: [...(st?.data.fragments || [])],
        lost: battles.filter(b => b.outcome === 'lose').map(b => b.tag),
        flags: { ...(st?.data.flags || {}) }, vars: { ...(st?.data.vars || {}) }, cells: [...(st?.data.zygarde?.cells || [])],
        party: (st?.party || []).map(pk => pk.species), pokemon: (st?.party || []).map(pk => ({ species: pk.species,
          level: pk.level, hp: pk.hp, maxHP: maxHP(engine.data, pk), status:pk.status, exp:pk.exp,
          heldItem:pk.heldItem, ability:pk.ability, nature:pk.nature, moves: pk.moves })),
        hasDex: Boolean(st?.hasPokedex()), balls: st?.itemCount('POKEBALL') || 0, playerName: st?.player.name,
        money: st?.player.money, bag: st?.data.bag, keyItems: st?.data.keyItems, healPoint: st?.healPoint,options:{...(st?.options||{})},
        tablets: [...(st?.data.tablets || [])], clues: (st?.clues || []).map(c => ({ ...c })), items: { ...(st?.data.bag || {}) },
        puzzle: window.__e2e?.b04 && st ? window.__e2e.b04.puzzle() : null,
        hour: st?.hour, choices: top?.items?.map(i => typeof i === 'string' ? i : i.label || i.text) || [],
        choiceItems: top?.items?.map(i => typeof i === 'string' ? i : i.label || i.text) || [],
        choiceIndex: top?.win?.index || 0, lastText: log.at(-1)?.text || '', battles: battles.map(b => ({ ...b })), b02: b02(),
      };
    };
    const fieldPlan = destination => {
      const m=map(),p=m.world.player;
      if (!engine.state.zygardeAbility('climb')) return null;
      const walls=m.world.events.filter(e=>e.def?.type==='climbWall'&&!e.erased&&e.page&&Array.isArray(e.def.to));
      const q=[{start:[p.x,p.y],ids:[]}],seen=new Set([`${p.x},${p.y}`]);
      while(q.length){
        const cur=q.shift();
        const reached = typeof destination === 'number'
          ? route(0,0,{edge:destination,start:cur.start})
          : route(destination.tx,destination.ty,{start:cur.start});
        if(reached) return cur.ids;
        for(const e of walls){
          const k=e.def.to.join(','); if(seen.has(k)||!route(e.x,e.y,{onto:false,start:cur.start})) continue;
          seen.add(k);q.push({start:[...e.def.to],ids:[...cur.ids,e.id]});
        }
      }
      return null;
    };
    window.__campaign = { engine, canSurfFreely, canOfferSwim, map, log, battles, control, route, eventPos, snap, fieldPlan, edgeRoute: dir => route(0, 0, { edge: dir }),
      originalShow: show, originalMove: oldMove,
      originalAction: oldAction, originalItem: oldItem, originalConfirm:oldConfirm,originalSwitch:oldSwitch };
    window.__e2e = { ...window.__e2e, engine, log, route, eventPos, eventInfo: eventPos, snap, b02, battles,
      selfSwitch: (mapId, id, key = 'A') => engine.state.selfSwitch(mapId, id, key),
      titleIndex: () => engine.scenes.top?.menu?.index || 0,
      titleNewIndex: () => engine.scenes.top?.items?.findIndex(i => i.id === 'new'),
      warpTo: to => {
        const ws = (map()?.world?.current?.def?.warps || []).filter(w => w.to === to);
        const w = ws.find(w => !w.dirTrigger) || ws[Math.floor(ws.length / 2)];
        return w && { x: w.x, y: w.y, dirTrigger: w.dirTrigger || 0 };
      },
    };
    snap();
  });
}
