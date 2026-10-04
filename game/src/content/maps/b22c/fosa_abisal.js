import { SITES } from './layout.js';
import { buildMarine } from './build.js';
import { roomEvents, roomEnter } from '../../events/b22c_rooms.js';
const S=SITES.kyogre;
export default {id:S.id,name:'Fosa Abisal',tileset:15,width:S.width,height:S.height,cave:true,noFollower:true,voidBlocks:true,
  bgm:'Cueva',battleback:'Sub',dark:{amount:0.8,radius:100},tone:[-20,0,25,10],start:S.entry,
  build:b=>buildMarine(b,'kyogre'),events:roomEvents('kyogre'),onEnter:roomEnter('kyogre'),
  warps:[{x:S.exit.x,y:S.exit.y,dirTrigger:2,to:S.back.map,tx:S.back.x,ty:S.back.y,dir:S.back.dir}]};
