import * as MAR from '../game/src/content/maps/b13/mar_layout.js';
import * as CL from '../game/src/content/maps/b09b/caleta_layout.js';

// El recorrido aislado del Tizón empezaba en el sector este con un fixture.
// La campaña continua llega desde la fiesta de Caleta y cruza el mar de verdad.
export async function collectEasternSea(d) {
  const s=await d.snap();
  if(s.map==='volcan_tizon')return;
  if(s.map==='caleta_sonda') {
    const c=CL.CELLS.c064;
    await d.startSwim(c.x,c.y);await d.swimTo(c.x,c.y);
    await d.milestone('c064',s=>s.cells.includes('cell_caleta_1')?null:'sin C064');
    await d.startSwim(CL.DIVERS.resonance.x+8,31);
    await d.swimTo(CL.DIVERS.resonance.x+8,31);
    await d.crossEdge(2,'mar_del_sur');
  }
  await d.until(s=>s.map==='mar_del_sur'&&s.ready,{what:'cruce real hacia el este del Mar del Sur'});
  for(const id of ['c065','c066']) {
    const c=MAR.CELLS[id];
    await d.startSwim(c.x,c.y);await d.swimTo(c.x,c.y);
    await d.milestone(id,s=>s.cells.includes(c.key)?null:`sin ${id}`);
  }
}
