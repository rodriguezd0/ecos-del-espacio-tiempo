import { SITES } from './layout.js';
import { buildMagma } from './build.js';
import { roomEvents, roomEnter } from '../../events/b22c_rooms.js';
const S=SITES.groudon;
export default {id:S.id,name:'Veta Magmática',tileset:13,width:S.width,height:S.height,cave:true,noSwim:true,
  bgm:'MansionQuemada',battleback:'CuevaRoja',dark:{amount:0.55,radius:120},tone:[28,-5,-24,0],start:S.entry,
  build:buildMagma,events:roomEvents('groudon'),onEnter:roomEnter('groudon'),
  warps:[{x:S.exit.x,y:S.exit.y,dirTrigger:2,to:S.back.map,tx:S.back.x,ty:S.back.y,dir:S.back.dir}]};
