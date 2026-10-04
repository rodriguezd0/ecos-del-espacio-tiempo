// Recogida de opcionales en la misma partida: solo observa eventos y pulsa controles.
import { cellByKey } from '../game/src/content/zygarde/cells.js';
import { installB13Observer } from './e2e_campaign_b13_page.mjs';
import { Driver as SeaDriver } from './e2e_b13_driver.mjs';

export async function collectLandCells(d, keys) {
  for (const key of keys) {
    if ((await d.snap()).cells.includes(key)) continue;
    const cell = cellByKey(key);
    if (!cell) throw Error(`Célula desconocida: ${key}`);
    if (cell.scripted) throw Error(`${cell.id} se obtiene mediante su guion`);
    await d.travel(cell.map);
    const event = await d.eval(key => {
      const ev = window.__campaign.map().world.events.find(e => e.def?.type === 'zygardeCell' && e.def.cell === key);
      return ev && { id: ev.id, x: ev.x, y: ev.y };
    }, key);
    if (!event) throw Error(`No existe el evento físico ${cell.id} en ${cell.map}`);
    const reachable = () => d.eval(([x, y]) => window.__campaign.route(x, y), [event.x, event.y]);
    if (!(await reachable())) {
      const s = await d.snap();
      if (s.abilities.run && !s.riding) await d.mount();
      if (!(await reachable())) {
        const plan = await d.eval(target => window.__campaign.fieldPlan(target), { tx: event.x, ty: event.y });
        for (const id of plan || []) await d.talk(id);
      }
    }
    await d.walkTo(event.x, event.y);
    await d.settle();
    await d.milestone(`celula_${cell.id}`, s => s.cells.includes(key) ? null : `${cell.id} sin recoger`);
  }
}

export async function collectWaterCells(d, keys) {
  await installB13Observer(d.page);
  const swimWalk = (x, y) => SeaDriver.prototype.walkTo.call(d, x, y, {
    router: (tx, ty) => d.eval(([x,y]) => window.__b13.routeMixed(x,y), [tx,ty]),
  });
  for (const key of keys) {
    if ((await d.snap()).cells.includes(key)) continue;
    const cell = cellByKey(key);
    if (!cell) throw Error(`Célula desconocida: ${key}`);
    if (cell.scripted) throw Error(`${cell.id} se obtiene mediante su guion`);
    await d.travel(cell.map);
    const event = await d.eval(key => {
      const ev = window.__campaign.map().world.events.find(e => e.def?.type === 'zygardeCell' && e.def.cell === key);
      return ev && { id: ev.id, x: ev.x, y: ev.y };
    }, key);
    if (!event) throw Error(`No existe el evento físico ${cell.id} en ${cell.map}`);
    const shore = await d.eval(([x,y]) => window.__b13.shoreFor(x,y), [event.x,event.y]);
    if (!shore) throw Error(`No hay orilla hacia ${cell.id}`);
    if (!(await d.snap()).surfing) {
      await d.walkTo(shore.x, shore.y, { face: shore.face });
      if (!(await d.snap()).cells.includes(key)) {
        await d.interact();
        await d.until(s => !s.playerBusy && (s.surfing || s.cells.includes(key)), { timeout: 8000, what: 'Nadar o recoger desde la orilla' });
      }
      if (!(await d.snap()).surfing) {
        await d.milestone(`celula_${cell.id}`, s => s.cells.includes(key) ? null : `${cell.id} sin recoger`);
        continue;
      }
    }
    await swimWalk(event.x,event.y);
    await d.settle();
    await d.milestone(`celula_${cell.id}`, s => s.cells.includes(key) ? null : `${cell.id} sin recoger`);
    const s = await d.snap();
    if (!s.surfing && (s.x !== shore.x || s.y !== shore.y)) await SeaDriver.prototype.startSwim.call(d,shore.x,shore.y);
    await swimWalk(shore.x,shore.y);
    await d.settle();
  }
}

const DIVE_SURFACES = { pozo_albo:'garganta_albo', caleta_algas:'caleta_sonda', reserva_fondo:'ruta_14_reserva' };

export async function collectDiveCells(d, keys) {
  await installB13Observer(d.page);
  const swimWalk = (x,y) => SeaDriver.prototype.walkTo.call(d,x,y,{
    router:(tx,ty)=>d.eval(([x,y])=>window.__b13.routeMixed(x,y),[tx,ty]),
  });
  for (const key of keys) {
    if ((await d.snap()).cells.includes(key)) continue;
    const cell=cellByKey(key),surface=DIVE_SURFACES[cell?.map];
    if (!surface) throw Error(`No hay excursión submarina para ${key}`);
    await d.travel(surface);
    const entrance=await d.eval(to=>{
      const e=window.__campaign.map().world.events.find(e=>e.def?.type==='diveSpot'&&!e.def.surface&&e.def.to===to);
      return e&&{x:e.x,y:e.y};
    },cell.map);
    if(!entrance)throw Error(`No existe remolino hacia ${cell.map}`);
    const shore=await d.eval(([x,y])=>window.__b13.shoreFor(x,y),[entrance.x,entrance.y]);
    if(!shore)throw Error(`No hay orilla hacia ${cell.map}`);
    if(!(await d.snap()).surfing)await SeaDriver.prototype.startSwim.call(d,entrance.x,entrance.y);
    await swimWalk(entrance.x,entrance.y);
    await d.interact();
    await d.until(s=>s.map===cell.map&&s.ready,{timeout:20000,what:`Buceo real a ${cell.map}`});
    await d.settle();
    const points=await d.eval(({key,surface})=>{
      const es=window.__campaign.map().world.events;
      const cell=es.find(e=>e.def?.type==='zygardeCell'&&e.def.cell===key);
      const exit=es.find(e=>e.def?.type==='diveSpot'&&e.def.surface&&e.def.to===surface);
      const vents=es.filter(e=>e.def?.type==='diveVent').map(e=>({x:e.x,y:e.y}));
      return {cell:cell&&{x:cell.x,y:cell.y},exit:exit&&{x:exit.x,y:exit.y},vents};
    },{key,surface});
    if(!points.cell||!points.exit)throw Error(`Falta célula o regreso en ${cell.map}`);
    for(const vent of points.vents)await d.walkTo(vent.x,vent.y);
    await d.walkTo(points.cell.x,points.cell.y);
    await d.settle();
    await d.milestone(`celula_${cell.id}`,s=>s.cells.includes(key)?null:`${cell.id} sin recoger`);
    await d.walkTo(points.exit.x,points.exit.y);
    await d.interact();
    await d.until(s=>s.map===surface&&s.ready,{timeout:20000,what:`Emerger de ${cell.map}`});
    await swimWalk(shore.x,shore.y);
    await d.settle();
  }
}
