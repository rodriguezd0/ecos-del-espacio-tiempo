import { SITES } from './layout.js';
import { buildMarine } from './build.js';
import { roomEvents, roomEnter } from '../../events/b22c_rooms.js';
const S=SITES.lugia;
export default {id:S.id,name:'Sima Marina',tileset:15,width:S.width,height:S.height,cave:true,noFollower:true,voidBlocks:true,
  bgm:'Cueva',battleback:'Sub',dark:{amount:0.96,radius:48},tone:[-26,0,25,40],start:S.entry,
  build:b=>buildMarine(b,'lugia'),events:roomEvents('lugia'),onEnter:roomEnter('lugia'),
  warps:[{x:S.exit.x,y:S.exit.y,dirTrigger:2,to:S.back.map,tx:S.back.x,ty:S.back.y,dir:S.back.dir}]};
