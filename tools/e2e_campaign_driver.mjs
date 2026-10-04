import fs from 'node:fs';
import path from 'node:path';
import { Driver, KEY, DIR } from './e2e_b16_driver.mjs';
import {findTravelPath} from './e2e_campaign_routes.mjs';

export class CampaignDriver extends Driver {
  constructor(page, errors, options) { super(page, errors, options); this.choiceRules = [{ re: /mote/i, index: 1 }]; }
  snapState() { return this.eval(() => window.__campaign.snap()); }
  snap() { return this.snapState(); }
  pos(id) { return id ? this.eval(id => window.__campaign.eventPos(id), id) : super.pos(); }
  async step(dir, { settle = true } = {}) {
    const before = await this.snap();
    if (before.map !== 'camara_contrapesos') return super.step(dir);
    await this.page.keyboard.down(KEY[dir]);
    try { await this.eval(a => window.__b08.waitChange(a), { x: before.x, y: before.y, map: before.map,
      puzzle: JSON.stringify(before.vars.b08_camara ?? null), timeout: 1500 }); }
    finally { await this.page.keyboard.up(KEY[dir]); }
    await this.until(s => !s.playerBusy || s.busy || s.top !== 'MapScene', { what: 'paso de Contrapesos', timeout: 4000 });
    if (settle && ((await this.snap()).busy || (await this.snap()).top !== 'MapScene')) await this.settle();
  }
  async face(dir) {
    const d = DIR[dir] || dir; const s = await this.snap(); if (s.dir === d) return;
    if (s.lastDir === d) { const other = [2,4,6,8].find(v => v !== d && v !== s.dir); await this.press(KEY[other], 120, 25); }
    await this.press(KEY[d], 150, 25);
    await this.until(s => s.dir === d || s.busy, { what: 'girar sin empujar', timeout: 2000 });
  }
  setMount(want) { return this.toggleMount(want); }
  async pull(dir) {
    await this.face(dir); this.nextChoice = 1; await this.hold('KeyZ', 260); await this.wait(120);
    await this.settle(); this.nextChoice = null;
  }
  async hold(key, ms) { await this.page.keyboard.down(key); await this.wait(ms); await this.page.keyboard.up(key); }
  async walkTo(x, y, opts = {}) {
    const original = await this.snap();
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const s = await super.walkTo(x, y, { ...opts, stopWhen: s => opts.stopWhen?.(s) || this.whiteout(original, s) });
        if (opts.stopWhen?.(s) || !this.whiteout(original, s)) return s;
      }
      catch (e) {
        const s = await this.snap();
        if (!this.whiteout(original, s)) throw e;
      }
      console.log(`DERROTA REAL: ${original.map} → ${(await this.snap()).map}. Regreso por caminos y puertas.`);
      await this.travel(original.map);
      if (original.riding) await this.mount();
    }
    throw new Error(`Tres derrotas reales intentando llegar a ${original.map}(${x},${y}); hace falta entrenar.`);
  }
  whiteout(before, after) {
    return after.map !== before.map && after.map === after.healPoint?.mapId && after.battles.at(-1)?.outcome === 'lose';
  }
  async travel(target) {
    const from = (await this.snap()).map;
    const route = await findTravelPath(from,target);
    if (!route) throw new Error(`No hay camino de regreso de ${from} a ${target}`);
    for (const next of route) {
      const edge = await this.eval(async next => {
        const def = window.__campaign.map().world.current.def;
        const c = def.connections?.find(c => c.to === next);
        if(c)return {dir:{north:8,south:2,west:4,east:6}[c.dir]};
        if(def.warps?.some(w=>w.to===next))return null;
        const {loadMapDefinition}=await import('/src/content/maps/index.js');
        const back=(await loadMapDefinition(next)).warps?.find(w=>w.to===def.id&&w.door);
        return back?{scriptDoor:true,x:back.tx,y:back.ty,dir:{2:8,4:6,6:4,8:2}[back.dir]||8}:null;
      }, next);
      if (!edge) { await this.exitTo(next); await this.settle(); continue; }
      if(edge.scriptDoor) {
        await this.walkTo(edge.x,edge.y);await this.pushUntil(edge.dir,s=>s.map===next,`puerta real ${next}`);continue;
      }
      let spot = await this.eval(dir => window.__campaign.edgeRoute(dir), edge.dir);
      if (!spot && (await this.snap()).abilities.run && !(await this.snap()).riding) {
        const canRide = await this.eval(async () => (await import('/src/world/zygarde/mount.js')).canRide(window.__campaign.map().world));
        if (canRide) { await this.mount(); spot = await this.eval(dir => window.__campaign.edgeRoute(dir), edge.dir); }
      }
      if (!spot) {
        const plan = await this.eval(dir => window.__campaign.fieldPlan(dir), edge.dir);
        for (const id of plan || []) await this.talk(id);
        spot = await this.eval(dir => window.__campaign.edgeRoute(dir), edge.dir);
      }
      if (!spot) throw new Error(`No hay salida transitable hacia ${next}`);
      await this.walkTo(spot.x, spot.y); await this.crossEdge(edge.dir, next);
    }
  }
  pickChoice(s, choose) {
    if (this.nextChoice !== undefined && this.nextChoice !== null) { const i = this.nextChoice; this.nextChoice = null; return i; }
    const rule = this.choiceRules.find(r => r.re.test(s.lastText || ''));
    return rule ? rule.index : super.pickChoice(s, choose);
  }
  async settle(options = {}) {
    const end = Date.now() + (options.timeout || 300000); let calm = 0, stuck = 0;
    while (Date.now() < end) {
      let s = await this.snap();
      for (const w of options.watch || []) {
        if (w.done || !(w.re?.test(s.lastText || '') || w.scene === s.top || w.when?.(s))) continue;
        w.done = true; if (w.delay) await this.wait(w.delay); await this.shot(w.name); s = await this.snap();
      }
      if (options.onText && s.top === 'MessageScene' && await options.onText(s)) { calm = 0; continue; }
      if (['MessageScene', 'VerseScene', 'TravelScene', 'ObtainScene', 'CaptionScene', 'PictureScene'].includes(s.top)) {
        calm = 0; await this.press('KeyZ', 120); continue;
      }
      if (s.top === 'ChoiceScene') {
        calm = 0; if (!s.choiceReady) { await this.wait(100); continue; }
        const target = Math.max(0,Math.min(s.choices.length-1,this.pickChoice(s, options.choose)));
        for (let n = 0; n < 30; n++) {
          const cur = await this.snap(); if (cur.top !== 'ChoiceScene' || cur.choiceIndex === target) break;
          await this.press(cur.choiceIndex < target ? 'ArrowDown' : 'ArrowUp', 130);
        }
        if ((await this.snap()).top === 'ChoiceScene') await this.press('KeyZ', 220); continue;
      }
      if (options.onBusy && s.top === 'MapScene' && s.busy && await options.onBusy(s)) { calm = 0; continue; }
      if (s.top === 'MapScene' && s.ready && !s.busy && !s.playerBusy) {
        if (++calm >= 4) return s;
      } else calm = 0;
      if (!['MapScene', 'BattleScene', 'BattleTransitionScene', 'CineOverlay'].includes(s.top) && ++stuck > 20) {
        stuck = 0; await this.press('KeyZ', 120);
      }
      await this.wait(120);
    }
    throw new Error(`La campaña no vuelve al mapa: ${JSON.stringify(await this.snap())}`);
  }
  async faceEvent(id) {
    const e = await this.eval(id => window.__campaign.eventPos(id), id);
    if (!e) throw new Error(`No existe ${id}`);
    if (id === 'enfermera') { await this.walkTo(e.x, e.y + 2, { face: 8 }); return; }
    if (id === 'dependiente') { await this.walkTo(e.x - 2, e.y, { face: 6 }); return; }
    await this.walkTo(e.x, e.y, { onto: false });
    const s = await this.snapState(); await this.turn(e.x > s.x ? 6 : e.x < s.x ? 4 : e.y > s.y ? 2 : 8);
    return e;
  }
  async interact(x, y, face, opts = {}) {
    const original = await this.snap();
    for (let attempt = 0; attempt < 3; attempt++) {
      if (typeof x === 'number') await this.walkTo(x, y, { face, watch: opts.watch });
      const result = await super.interact(typeof x === 'number' ? opts : x || {});
      if (!this.whiteout(original, await this.snap())) return result;
      console.log(`DERROTA REAL al interactuar en ${original.map}; regreso y reintento.`);
      await this.travel(original.map);
      if (original.riding) await this.mount();
    }
    throw new Error(`Tres derrotas reales al interactuar en ${original.map}; hace falta entrenar.`);
  }
  async enter(x, y, dir, to) {
    const d = DIR[dir] || dir, delta = { 2: [0, -1], 4: [1, 0], 6: [-1, 0], 8: [0, 1] }[d];
    await this.walkTo(x + delta[0], y + delta[1]); return this.pushInto(dir, to);
  }
  async push(x, y, dir, to, opts = {}) {
    await this.walkTo(x, y, { ...opts, stopWhen: s => s.map === to });
    if ((await this.snap()).map !== to) await this.pushInto(dir, to, opts);
    return this.settle(opts);
  }
  async leave(x, y, dir, to, opts = {}) {
    if (typeof to !== 'string') return super.leave(...arguments);
    return this.push(x, y, dir, to, opts);
  }
  async pushTo(x, y, dir, tx, ty) {
    const goal = s => s.x === tx && s.y === ty;
    await this.walkTo(x, y, { stopWhen: goal });
    if (!goal(await this.snap())) await this.pushUntil(dir, goal, `puerta interior ${tx},${ty}`);
    return this.settle();
  }
  async talkTo(x, y, opts = {}) {
    const s = await this.walkTo(x, y, { onto: false });
    await this.face(x > s.x ? 6 : x < s.x ? 4 : y > s.y ? 2 : 8);
    return this.interact(opts);
  }
  async stages(block, steps) {
    if (!this.liveTicker) {
      this.liveTicker = setInterval(async () => {
        try { fs.writeFileSync(path.join(this.outDir,'campaign_live.json'),JSON.stringify({stage:this.currentStage,state:await this.snap()},null,2)); }
        catch {}
      },15000); this.liveTicker.unref();
    }
    this.completedStages ||= new Set();
    for (const [name, run] of Object.entries(steps)) {
      const id = `${block}:${name}`; if (this.completedStages.has(id)) continue;
      this.currentStage = id; await run(this); this.completedStages.add(id);
    }
    this.currentStage = null;
  }
  async enterDoor(x, y, to) {
    if (typeof x === 'object') { to = y; y = x.y; x = x.x; }
    await this.walkTo(x, y + 1);
    return this.pushUntil('up', s => s.map === to, `entrar en ${to}`);
  }
  async exitTo(to, second, opts = {}) {
    if (second) return super.exitTo(to, second, opts);
    const warp = await this.eval(to => window.__e2e.warpTo(to), to);
    if (!warp) throw new Error(`No hay warp a ${to}`);
    const direct = await this.eval(([x, y]) => window.__e2e.route(x, y), [warp.x, warp.y]);
    await this.walkTo(warp.x, warp.y + (direct ? 0 : 1), { stopWhen: s => s.map === to });
    if (!direct && (await this.snap()).map !== to) await this.hold('ArrowUp', 400);
    if ((await this.snap()).map !== to && warp.dirTrigger) await this.hold(KEY[warp.dirTrigger], 400);
    return this.until(s => s.map === to && s.ready, { timeout: 20000, what: `warp ${to}` });
  }
  async crossEdge(dir, to) { return this.pushUntil(DIR[dir] || dir, s => s.map === to, `conexión ${to}`); }
  async mount() {
    const s = await this.snap(); if (s.riding) return;
    await this.press('KeyE', 400); await this.settle();
    await this.until(s => s.riding, { timeout: 5000, what: 'montura 10 %' });
  }
  async toggleMount(on) {
    if (Boolean((await this.snap()).riding) !== on) { await this.press('KeyE', 300); await this.settle(); }
    if (Boolean((await this.snap()).riding) !== on) throw new Error('La montura no cambió con el control R.');
  }
  use(x, y, face, opts = {}) { return this.interact(x, y, face, opts); }
  pushInto(dir, to, opts = {}) { return this.pushUntil(dir, s => s.map === to, `entrada ${to}`, opts); }
  async talk(id, opts = {}) {
    if (typeof id !== 'string') return super.talk(...arguments);
    const before = await this.snap();
    for (let n = 0; n < 3; n++) {
      await this.faceEvent(id); const result = await super.interact(opts);
      if (!this.whiteout(before, await this.snap())) return result;
      await this.travel(before.map);
      if (before.riding) await this.mount();
    }
    throw new Error(`Tres derrotas reales ante ${id}; hace falta entrenar.`);
  }
  async purchase(items) {
    await this.faceEvent('dependiente'); await this.press('KeyZ', 250);
    for (let n = 0; n < 60 && (await this.snap()).top !== 'BuyScene'; n++) {
      const s = await this.snap();
      if (s.top === 'MessageScene' || s.top === 'ChoiceScene') await this.press('KeyZ', 120); else await this.wait(100);
    }
    if ((await this.snap()).top !== 'BuyScene') throw new Error('No se abrió la lista de compra.');
    for (const [id, qty] of Object.entries(items)) {
      const menu = await this.eval(id => { const top = window.__campaign.engine.scenes.top, c = window.__campaign;
        return { index: top.cursor.index, target: top.stock.indexOf(id), price:c.engine.data.items[id]?.price,
          money:c.engine.state.player.money }; }, id);
      if (menu.target < 0) throw new Error(`La tienda no vende ${id}`);
      if (menu.money < menu.price) { console.log(`Sin dinero para otra unidad de ${id}; se conserva lo comprado.`); continue; }
      for (let n = 0; n < 30; n++) {
        const index = await this.eval(() => window.__campaign.engine.scenes.top.cursor.index);
        if (index === menu.target) break; await this.press(index < menu.target ? 'ArrowDown' : 'ArrowUp', 140);
      }
      if (await this.eval(() => window.__campaign.engine.scenes.top.current) !== id) throw new Error(`El cursor no eligió ${id}`);
      await this.press('KeyZ', 200); await this.dialogUntil('NumberScene', `cantidad de ${id}`);
      const max = await this.eval(() => window.__campaign.engine.scenes.top.max);
      const amount = Math.min(qty, max);
      for (let n = 0; n < 110; n++) {
        const value = await this.eval(() => window.__campaign.engine.scenes.top.value);
        if (value === amount) break; await this.press(value < amount ? 'ArrowUp' : 'ArrowDown', 140);
      }
      await this.press('KeyZ', 220); await this.dialogUntil('ChoiceScene', 'confirmación de compra');
      await this.press('KeyZ', 200);
      while ((await this.snap()).top !== 'BuyScene') {
        if ((await this.snap()).top === 'MessageScene') await this.press('KeyZ', 120); else await this.wait(100);
      }
      if (((await this.snap()).items[id] || 0) < amount) throw new Error(`No se compró ${id}`);
    }
    await this.press('KeyX', 200); await this.until(s => s.top === 'ChoiceScene', { what: 'salir de la tienda' });
    this.nextChoice = 2; await this.settle();
  }
  async dialogUntil(top, what) {
    for (let n = 0; n < 80; n++) {
      const s = await this.snap(); if (s.top === top) return s;
      if (s.top === 'MessageScene') await this.press('KeyZ', 100); else await this.wait(100);
    }
    throw new Error(`No se abrió ${what}: ${(await this.snap()).top}`);
  }
  async closeDialogs() {
    for (let n = 0; n < 100; n++) {
      const s = await this.snap(); if (s.top === 'MapScene' && !s.busy) return;
      if (s.top === 'MessageScene') await this.press('KeyZ', 100);
      else if (['ChoiceScene','BuyScene','NumberScene'].includes(s.top)) await this.press('KeyX', 120);
      else await this.wait(100);
    }
    throw new Error('No se cerraron los menús pendientes.');
  }
  async rest(center, slot = 'Mañana') {
    const from = (await this.snap()).map;
    await this.travel(center); this.want.push('Descansar', slot);
    await this.talk(center === 'casa_prota_2f' ? 'b22d_cama_0' : 'descanso');
    await this.travel(from);
  }
  async climb(x, y, face, target) {
    await this.walkTo(x,y,{face}); await this.interact();
    await this.until(s => s.x === target[0] && s.y === target[1], {what:`trepar a ${target}`,timeout:10000});
    return this.settle();
  }
  async stepsExact(dirs, options={}) { for (const dir of dirs) { await this.step(DIR[dir] || dir); await this.settle(options); } }
  steps(dirs, options={}) {return this.stepsExact(dirs,options);}
  fightTrainer(map,id,from,face){return this.interact(from[0],from[1],face);}
  async depositAtPC(species) {
    const before=await this.snap();if(!before.partyList.includes(species))return;
    if(before.partyList.length<=1)throw new Error('El PC debe conservar un equipo capaz de combatir.');
    await this.faceEvent('pc_0');await this.press('KeyZ',250);
    await this.dialogUntil('ChoiceScene','sistema de almacenamiento');await this.press('KeyZ',250);
    await this.until(s=>s.top==='StorageScene',{what:'PC real'});
    for(const key of ['ArrowUp','ArrowUp','KeyZ'])await this.press(key,200);
    if(!await this.eval(()=>window.__campaign.engine.scenes.top.partyOpen))throw new Error('No se abrio el equipo en el PC.');
    for(let n=0;n<16;n++){
      const nav=await this.eval(species=>{const s=window.__campaign.engine.scenes.top;return {at:s.partySel,target:s.party.findIndex(p=>p.species===species)};},species);
      if(nav.at===nav.target)break;
      const key=nav.at===6?'ArrowDown':Math.floor(nav.at/2)!==Math.floor(nav.target/2)?nav.at<nav.target?'ArrowDown':'ArrowUp':'ArrowRight';
      await this.press(key,150);
    }
    await this.press('KeyZ',200);await this.dialogUntil('ChoiceScene','depositar Pokemon');
    for(let n=0;n<10;n++){
      const s=await this.snap(),target=s.choiceItems.indexOf('Depositar');
      if(target<0)throw new Error('Falta la opcion Depositar del PC.');
      if(s.choiceIndex===target)break;await this.press(s.choiceIndex<target?'ArrowDown':'ArrowUp',150);
    }
    await this.press('KeyZ',200);
    for(let n=0;n<40;n++){
      if((await this.snap()).top==='StorageScene'&&!await this.eval(()=>window.__campaign.engine.scenes.top.busy))break;
      if((await this.snap()).top==='MessageScene')await this.press('KeyZ',120);else await this.wait(100);
    }
    await this.shot('deposito_pc');await this.press('KeyX',200);await this.press('KeyX',200);
    await this.dialogUntil('ChoiceScene','apagar PC');await this.press('ArrowDown',150);await this.press('KeyZ',200);await this.settle();
    const after=await this.snap();
    if(after.partyList.includes(species)||!after.boxedPokemon.some(p=>p.species===species))throw new Error(`El PC no guardo ${species}.`);
  }
  async configureOptions() {
    if(this.optionsConfigured)return;
    await this.settle();await this.press('KeyC',300);
    await this.until(s=>s.top==='PauseMenuScene',{what:'Opciones'});
    const target=await this.eval(()=>window.__campaign.engine.scenes.top.entries.findIndex(e=>e.key==='options'));
    for(let n=0;n<25;n++){
      const i=await this.eval(()=>window.__campaign.engine.scenes.top.index);if(i===target)break;
      await this.press(i<target?'ArrowDown':'ArrowUp',150);
    }
    await this.press('KeyZ',300);await this.until(s=>s.top==='OptionsScene',{what:'opciones de juego'});
    for(const [index,key,value] of [[0,'textSpeed',3],[4,'battleScene',false]]){
      for(let n=0;n<15;n++){
        const i=await this.eval(()=>window.__campaign.engine.scenes.top.index);if(i===index)break;
        await this.press(i<index?'ArrowDown':'ArrowUp',150);
      }
      for(let n=0;n<5;n++){
        const v=await this.eval(async key=>(await import('/src/ui/core/options.js')).currentOptions()[key],key);
        if(v===value)break;await this.press('ArrowRight',150);
      }
    }
    const options=await this.eval(async()=>{const o=(await import('/src/ui/core/options.js')).currentOptions();return {textSpeed:o.textSpeed,battleScene:o.battleScene};});
    if(options.textSpeed!==3||options.battleScene!==false)throw new Error('La UI no aplico las opciones rapidas.');
    await this.shot('opciones_rapidas');await this.press('KeyX',200);await this.press('KeyX',200);await this.settle();
    this.optionsConfigured=true;
    await this.page.keyboard.down('ShiftLeft');
  }
  async fly(place) {
    await this.settle();await this.press('KeyC',300);
    await this.until(s=>s.top==='PauseMenuScene',{what:'menu Vuelo'});
    const target=await this.eval(()=>window.__campaign.engine.scenes.top.entries.findIndex(e=>e.key==='zygarde'));
    for(let n=0;n<25;n++){
      const i=await this.eval(()=>window.__campaign.engine.scenes.top.index);if(i===target)break;
      await this.press(i<target?'ArrowDown':'ArrowUp',150);
    }
    await this.press('KeyZ',300);await this.until(s=>s.top==='ZygardeScene',{what:'capacidades de Zygarde'});
    const cap=await this.eval(()=>window.__campaign.engine.scenes.top.info.capabilities.findIndex(c=>c.key==='fly'&&c.unlocked));
    if(cap<0)throw new Error('Vuelo aun no disponible');
    for(let n=0;n<30;n++){
      const s=await this.eval(()=>({i:window.__campaign.engine.scenes.top.capIndex,focus:window.__campaign.engine.scenes.top.focus}));
      if(s.focus==='forms'){await this.press('ArrowDown',150);continue;}
      if(s.i===cap)break;
      const key=Math.floor(s.i/3)!==Math.floor(cap/3)?s.i<cap?'ArrowDown':'ArrowUp':s.i<cap?'ArrowRight':'ArrowLeft';
      await this.press(key,150);
    }
    await this.press('KeyZ',300);await this.until(s=>s.top==='RegionMapScene',{what:'atlas de Vuelo'});
    for(let n=0;n<35;n++){
      const current=await this.eval(()=>{const s=window.__campaign.engine.scenes.top;return s.map.places.find(p=>p.x===s.cx&&p.y===s.cy)?.id;});
      if(current===place)break;await this.press('KeyE',180);
    }
    await this.press('KeyZ',250);await this.settle();
    await this.until(s=>s.map===place&&s.ready,{what:`Vuelo real a ${place}`});
  }
  exitInterior(entry, to) { return this.leave(entry.x,entry.y,'down',to); }
  async useFrom(x, y, fx, fy, opts = {}) {
    const s = await this.walkTo(fx, fy);
    await this.turn(x > s.x ? 6 : x < s.x ? 4 : y > s.y ? 2 : 8);
    return super.interact(opts);
  }
  story() {
    return this.eval(() => {
      const st = window.__campaign.engine.state;
      return { tablets: [...st.data.tablets], clues: st.clues.map(c => ({ ...c })),
        items: { ...st.data.bag }, riding: Boolean(window.__map.world.player.riding || window.__map.zygarde?.riding) };
    });
  }
  async save(name) {
    await this.settle(); await this.press('KeyC', 300);
    await this.until(s => s.top === 'PauseMenuScene', { what: 'menú para guardar' });
    const menu = await this.eval(() => { const s = window.__campaign.engine.scenes.top;
      return { at: s.index, target: s.entries.findIndex(e => e.key === 'save') }; });
    for (let n = 0; n < 20; n++) {
      const i = await this.eval(() => window.__campaign.engine.scenes.top.index); if (i === menu.target) break;
      await this.press(i < menu.target ? 'ArrowDown' : 'ArrowUp', 130);
    }
    await this.press('KeyZ', 350);
    await this.until(s => s.top === 'SaveLoadScene', { what: 'ranura de QA' });
    await this.press('KeyZ', 350);
    await this.until(s => s.top === 'ChoiceScene', { what: 'confirmar guardado' });
    await this.press('KeyZ', 450);
    for (let i = 0; i < 20; i++) {
      const s = await this.snap();
      if (s.top === 'PauseMenuScene') break;
      if (s.top === 'MessageScene') await this.press('KeyZ', 120); else await this.wait(150);
    }
    await this.press('KeyX', 250); await this.settle();
    await this.page.context().storageState({ path: path.join(this.outDir, 'campaign_browser_storage.json') });
    const state = await this.snap();
    const checkpoint=JSON.stringify({name,state,milestones:this.milestones},null,2);
    fs.writeFileSync(path.join(this.outDir,'campaign_checkpoint.json'),checkpoint);
    fs.writeFileSync(path.join(this.outDir,`campaign_checkpoint_${name}.json`),checkpoint);
    fs.writeFileSync(path.join(this.outDir,`campaign_dialogos_${name}.json`),JSON.stringify(await this.log(),null,2));
    console.log(`GUARDADO REAL ${name}: ${state.map}, ${state.pokemon.map(p => `${p.species} ${p.level}`).join(', ')}`);
  }
  goto() { throw new Error('La campaña continua no carga fixtures ni mapas por URL.'); }
}
