// Decisiones de prueba; el motor resuelve realmente captura, KO y derrota.
import { installHelpers } from './e2e_b01_page.mjs';

export async function installB22bHelpers(page, { carry = null, battles = [], mode = 'capture' } = {}) {
  await installHelpers(page);
  await page.evaluate(async ({ carry, battles, mode }) => {
    const [{ engine }, api, { Autopilot }, { createPokemon, maxHP }] = await Promise.all([
      import('/src/core/engine.js'), import('/src/battle/api.js'), import('/src/battle/scene/autopilot.js'),
      import('/src/battle/core/pokemon.js'),
    ]);
    const s = engine.state;
    if (carry) {
      const position = { mapId: s.player.mapId, x: s.player.x, y: s.player.y, dir: s.player.dir };
      s.data = carry;
      Object.assign(s.player, position);
    }
    const legends = new Set(['TORNADUS','THUNDURUS','LANDORUS','ARTICUNO','ZAPDOS','MOLTRES','RAIKOU','ENTEI','SUICUNE']);
    function team(list) {
      // Cambiar el equipo de la prueba conserva las capturas reales en el PC.
      for (const p of s.party) if (legends.has(p.species)) {
        const box = s.boxes.findIndex((b) => b.includes(null));
        if (box < 0) throw new Error('PC lleno en el fixture B22b');
        s.setBoxPokemon(box, s.boxes[box].indexOf(null), p);
      }
      s.setParty(list.map(([species,level,moves]) => createPokemon(engine.data,species,level,{moves,rng:()=>0.5})));
      window.__map?.refreshFollower?.();
    }
    if (!carry) {
      team([['BLISSEY',100,['SOFTBOILED','PSYCHIC']]]);
      s.obtainPokedex(); s.addKeyItem('ZYGARDECUBE'); s.addKeyItem('CLUENOTEBOOK');
      s.addItem('MASTERBALL',20); s.addItem('POKEBALL',3);
      s.setHealPoint('brontia_centro',7,8,2);
      s.data.clock.minutes=11*60;
    }
    s.setOptions({textSpeed:3});
    const pilot = { mode };
    const oldAction=Autopilot.prototype.action, oldMove=Autopilot.prototype.move, oldItem=Autopilot.prototype.item;
    Autopilot.prototype.action=function(battler,ctx,bag){
      if(!ctx.wild)return oldAction.call(this,battler,ctx,bag);
      if(pilot.mode==='capture'){this.wantBall='MASTERBALL';return 'bag';}
      return 'fight';
    };
    Autopilot.prototype.item=function(battler,ctx){
      if(this.wantBall){const item=this.wantBall;this.wantBall=null;return {item,target:battler.partyIndex,move:-1};}
      return oldItem.call(this,battler,ctx);
    };
    Autopilot.prototype.move=function(battler,moves,ctx){
      const wanted=pilot.mode==='lose'?'SPLASH':pilot.mode==='ko'?'SMACKDOWN':'PSYCHIC';
      const pick=moves.find((m)=>m.id===wanted&&m.selectable!==false);
      return pick?{index:pick.index,mega:false}:oldMove.call(this,battler,moves,ctx);
    };
    api.installBattle(async(cfg)=>{
      const outcome=await api.startBattle({...cfg,auto:'fight'});
      battles.push({species:cfg.wild?.species,level:cfg.wild?.level,mode:pilot.mode,
        outcome:outcome?.outcome||outcome,turns:outcome?.turns,stored:outcome?.stored,itemsUsed:outcome?.itemsUsed});
      return outcome;
    });
    window.__b16={eventPos:window.__e2e.eventPos};
    window.__map?.world?.refreshEvents?.();
    window.__b22b={
      battles,pilot,team,mode:(mode)=>{pilot.mode=mode;},
      choices:()=>[...(engine.scenes.top?.items||[])].map((i)=>typeof i==='string'?i:i.label||i.text),
      snap:()=>({
        vars:{...s.data.vars},bag:{...s.data.bag},battles:battles.slice(),money:s.player.money,heal:s.healPoint,
        caught:[...s.party,...s.boxes.flat()].filter(Boolean).map((p)=>p.species),
        health:s.party.map((p)=>({species:p.species,hp:p.hp,maxHP:maxHP(engine.data,p)})),
        mounted:window.__map?.world?.zygMount?.form||null,
        active:window.__map?.world?.events.filter((e)=>e.page).map((e)=>e.id)||[],
      }),
    };
  }, { carry, battles, mode });
}
