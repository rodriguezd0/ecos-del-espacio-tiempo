import { SITES } from './layout.js';
import { buildBalcony } from './build.js';
import { roomEvents, roomEnter } from '../../events/b22c_rooms.js';
const S=SITES.rayquaza;
export default {id:S.id,name:'Balcón del Cielo',tileset:1,width:S.width,height:S.height,outdoor:true,voidBlocks:true,
  bgm:'Transicion',battleback:'CimaNevada',panorama:{image:'anil:Graphics/Panoramas/cielo.png',parallax:0.15},start:S.entry,
  brushes:{losas_centro:{nine:[3,216],inner:[3,219],layer:1,desc:'Losas de los Custodios sobre las nubes'}},
  build:buildBalcony,events:roomEvents('rayquaza'),onEnter:roomEnter('rayquaza'),
  warps:[{x:S.exit.x,y:S.exit.y,dirTrigger:2,to:S.back.map,tx:S.back.x,ty:S.back.y,dir:S.back.dir}]};
