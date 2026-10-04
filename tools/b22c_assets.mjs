// Arte de eventos B22c a escala DS16px, ampliado×2; no modifica atlas compartidos.
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Img,hex,sheet,preview} from './pixel.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const put=(img,x,y,c)=>img.set(x,y,hex(c));
function line(img,x0,y0,x1,y1,c) {
 const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);
 for(let i=0;i<=n;i++) put(img,Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),c);
}
function prism(row,f) {
 const img=new Img(16,16),base=['#245FA4','#A74428','#6670BB','#385F56'][row],hi=['#9DE7FA','#FFBB70','#E9E3FF','#C7EEE3'][row];
 for(let y=6;y<15;y++)for(let x=2;x<14;x++)put(img,x,y,y===6||x===2?'#9E9588':'#494D50');
 for(let y=3;y<=11;y++)for(let x=4;x<=11;x++)if(Math.abs(x-7.5)+Math.abs(y-7)<=5)put(img,x,y,x<8?hi:base);
 line(img,7,3,7,11,'#F5EEDD');if(f%2)line(img,4,4,6,4,hi);return img;
}
function plate() {
 const img=new Img(16,16);
 for(let y=3;y<15;y++)for(let x=2;x<14;x++)put(img,x,y,y===3||x===2?'#C4C3AB':'#696F6A');
 for(const[x,y]of [[5,6],[6,6],[10,6],[5,7],[10,7],[5,8],[6,8],[9,8],[10,8],[9,9],[6,11],[9,11]])put(img,x,y,'#DDEBE2');
 line(img,4,13,11,13,'#3D484B');return img;
}
function current(row,f) {
 const img=new Img(16,16), dirs=[[0,1],[-1,0],[1,0],[0,-1]], [dx,dy]=dirs[row];
 const ox=8,oy=8;
 line(img,ox-dx*5,oy-dy*5,ox+dx*4,oy+dy*4,'#A9D6DB');
 line(img,ox+dx*4,oy+dy*4,ox+dx-dy*3,oy+dy+dx*3,'#DAF8F1');
 line(img,ox+dx*4,oy+dy*4,ox+dx+dy*3,oy+dy-dx*3,'#DAF8F1');
 for(let k=0;k<4;k++)put(img,3+k*3,(row%2?3:13)+((f+k)%2),'#46828E');return img;
}
function threshold(row) {
 const img=new Img(16,16),m=row===1?'#A8472D':'#4E797C';
 for(let y=3;y<16;y++)for(let x=2;x<14;x++) {
  if(y>5&&x>4&&x<11)put(img,x,y,'#171D24');else put(img,x,y,x===2||y===3?'#959995':m);
 }
 line(img,5,14,10,14,'#D0CDB4');return img;
}
function reflection(row,f) {
 const img=new Img(16,16),color=row===0?'#DCCDEA':'#ABCEDC';
 for(let y=4;y<14;y++)for(let x=2;x<14;x++) if(Math.abs(x-7.5)*0.65+Math.abs(y-8)<6&&(y+f)%3===0)put(img,x,y,color);
 line(img,4,14,11,14,'#5D9CA4');return img;
}
export function buildB22cAssets() {
 const makers={b22c_prismas:prism,b22c_placa:plate,b22c_corriente:current,b22c_umbral:threshold,b22c_reflejo:reflection};
 return Object.fromEntries(Object.entries(makers).map(([id,fn])=>[id,sheet(Array.from({length:4},(_,r)=>Array.from({length:4},(_,f)=>fn(r,f))),16,16).scale(2)]));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 for(const[id,img]of Object.entries(buildB22cAssets())) {
  const file=path.join(ROOT,'game/assets/objects',`${id}.png`);
  if(process.argv.includes('--check')) {const old=Img.load(file);if(old.w!==img.w||old.h!==img.h||!Buffer.from(old.data).equals(Buffer.from(img.data)))throw new Error(`${id}: PNG desactualizado`);}else img.save(file);
  if(process.argv.includes('--preview'))preview(img,{scale:3,grid:32,bg:'#76969B'}).save(path.join(ROOT,'tools/cache/pixel',`${id}.png`));
  console.log(`✓ ${id}`);
 }
}
