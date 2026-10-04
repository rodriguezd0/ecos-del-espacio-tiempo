// Regreso por el evento de superficie del arrecife, observado en el mapa actual.
import {FONDO} from '../game/src/content/maps/b14/layout.js';

export const fondoCollected = s => Object.keys(FONDO.cells).every(key => s.cells.includes(`cell_${key}`));

export async function returnFromFondo(d) {
  if ((await d.snap()).map === 'fondo_mar_sur') await d.travel('arrecife_eco');
  const state = await d.snap();
  if (state.map === 'arrecife_eco') {
    const surface = await d.eval(() => {
      const ev = window.__campaign.map().world.events.find(e => !e.erased && e.page
        && e.def?.type === 'diveSpot' && e.def.surface && e.def.to === 'caleta_sonda');
      return ev ? {x:ev.x,y:ev.y} : null;
    });
    if (!surface) throw Error('No hay salida de superficie del Arrecife hacia Caleta.');
    await d.walkTo(surface.x, surface.y);
    await d.interact();
    await d.until(s => s.map === 'caleta_sonda' && s.ready, {timeout:20000,what:'emerger después del Fondo'});
  } else if (state.map !== 'caleta_sonda') throw Error(`Regreso del Fondo desde un mapa inesperado: ${state.map}`);
  if ((await d.snap()).surfing) await d.toLand();
}
