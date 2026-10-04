// Lago interior de Escarcha: sala con lago y santuario de Añil, sin atlas nuevo (arte provisional D30).
import { withB22bEvents } from '../../events/b22b_maps.js';
import { LAKE } from './layout.js';
export default {
  id:LAKE.map,name:'Gruta Escarcha — Lago interior',tileset:12,width:36,height:40,cave:true,
  bgm:'Cueva',battleback:'CuevaHielo',tone:[-14,-2,22,14],start:LAKE.entry,
  build(b){b.fill(null,'vacio');b.stamp('sala_glaciar_santuario',LAKE.room.x,LAKE.room.y);},
  warps:[{x:LAKE.exit.x,y:LAKE.exit.y,to:LAKE.return.map,tx:LAKE.return.x,ty:LAKE.return.y,dir:LAKE.return.dir}],
  events:withB22bEvents(LAKE.map,[]),
};
