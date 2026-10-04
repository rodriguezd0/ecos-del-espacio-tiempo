// Sellos, vendaval y rastros de B22b. Arte provisional D30, nativo16 px con ampliación exacta×2.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, fromRows, sheet, outline, preview } from './pixel.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'game/assets/objects');
function line(img,x0,y0,x1,y1,color){
  let x=x0,y=y0;const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;
  while(true){img.set(x,y,hex(color));if(x===x1&&y===y1)break;const e2=e*2;if(e2>=dy){e+=dy;x+=sx;}if(e2<=dx){e+=dx;y+=sy;}}
}
function seal(row,frame){
  const img=new Img(16,32);
  const cols=row===0?['#E9FBFF','#ADD8EE','#659BBC','#344F7F']:row===1?['#FFF5B4','#C6B674','#7C7553','#423E32']:['#BAA1A3','#756166','#4C414A','#292631'];
  for(let y=9;y<30;y++)for(let x=2;x<14;x++){
    const dx=Math.abs(x-7.5),dy=(y-20)/1.8;
    if(dx*dx+dy*dy<37)img.set(x,y,hex(cols[Math.min(3,Math.floor((x+y)%9/3))]));
  }
  line(img,7,12,10,20,cols[3]);line(img,10,20,6,25,cols[3]);
  line(img,4,13,4,22,cols[0]);
  if(row===1){line(img,9,10,6,17,frame%2?'#FFE65B':'#FFF8C8');line(img,6,17,10,17,'#FFE65B');line(img,10,17,7,24,'#FFE65B');}
  if(row===2){line(img,8,14,9,20,frame%2?'#EC7441':'#FCB964');line(img,9,20,6,27,'#EF833D');}
  if(row===3){
    for(let y=5;y<30;y++)for(let x=4;x<12;x++)img.set(x,y,hex(Math.abs(x-7.5)<2&&y>11?'#223C65':cols[1]));
    line(img,5,8,10,5,'#E9FBFF');line(img,5,7,5,13,'#E9FBFF');
  }
  return outline(img,row===0||row===3?'#233E63':'#292631');
}
function wind(frame){
  const img=new Img(16,32);
  for(let y=4;y<29;y++){
    const cx=7.5+Math.sin((y+frame*2)/4)*2;
    const radius=2+(29-y)/8;
    for(let x=1;x<15;x++){
      const d=Math.abs(x-cx);
      if(d<=radius&&((y+frame*2)%7<3||d>radius-1))img.set(x,y,hex(d>radius-1?'#C9E5DB':'#7EB9B8'));
    }
  }
  line(img,4,28,11,28,'#8EB4A4');
  return img;
}
function track(row,frame){
  const pal={k:'#293D35',g:'#B9FF66',y:'#E3C879',d:'#6E6144',c:'#44413B',b:'#6A5042',w:'#CCEAE6',s:'#67AAA9'};
  const shapes=[
    ['...yy.......','..yy........','...ydd......','....dd......','..yyyy......','....yd......','.....ydd....','......dd....'],
    ['c...bc...c..','.ccbcc...cb.','..cb.cccbc..','.cc..bcbc...','c..ccbc...c.','..c...cccb..','..bcc..bc...','...ccbc.....'],
    ['...wwwww....','..w.....w...','.s.......s..','..ss...ss...','....sss.....','..wwwww.....','.w.....w....','..ssss......'],
    ['..b...b.....','...b.b......','....d.......','...ddd......','..d...d.....','.d.....d....','...b.b......','....b.......'],
  ];
  const part=fromRows(shapes[row],pal);const img=new Img(16,16);img.blit(part,2,6);
  if(row===0&&frame%2)img.set(7,10,hex('#B9FF66'));
  return img;
}
export function buildB22bAssets(){
  return {b22b_sellos:sheet(Array.from({length:4},(_,r)=>Array.from({length:4},(_,p)=>seal(r,p))),16,32).scale(2),
    b22b_vendaval:sheet(Array.from({length:4},()=>Array.from({length:4},(_,p)=>wind(p))),16,32).scale(2),
    b22b_rastros:sheet(Array.from({length:4},(_,r)=>Array.from({length:4},(_,p)=>track(r,p))),16,16).scale(2)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  for(const [id,img]of Object.entries(buildB22bAssets())){
    const file=path.join(OUT,`${id}.png`);
    if(process.argv.includes('--check')){
      const old=Img.load(file);if(old.w!==img.w||old.h!==img.h||!Buffer.from(old.data).equals(Buffer.from(img.data)))throw new Error(`${id}: PNG desactualizado`);
    }else img.save(file);
    if(process.argv.includes('--preview'))preview(img,{scale:3,grid:32,bg:'#88C070'}).save(path.join(ROOT,'tools/cache/pixel',`${id}.png`));
    console.log(`✓ ${id}`);
  }
}
