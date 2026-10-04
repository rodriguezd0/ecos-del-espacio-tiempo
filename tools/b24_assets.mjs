// Marcadores propios del Registro, arte provisional DS16×2. No altera ningún atlas compartido.
import path from 'node:path';import{fileURLToPath}from 'node:url';
import{Img,hex,sheet,preview}from './pixel.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const p=(im,x,y,c)=>im.set(x,y,hex(c));
function marker(r,f){
 const im=new Img(16,16),accent=['#E4DAB3','#87DCE5','#EF9457','#C3B1E1'][r];
 for(let y=9;y<16;y++)for(let x=3;x<13;x++)p(im,x,y,x===3||y===9?'#BCB6A7':'#605E59');
 for(let y=3;y<11;y++)for(let x=5;x<11;x++)p(im,x,y,x===5||y===3?'#484D52':accent);
 for(let y=5;y<9;y+=2)for(let x=6;x<10;x++)p(im,x,y,'#556366');
 if(f%2)p(im,9,4,'#FFFCDA');return im;
}
function portal(r,f){
 const im=new Img(16,16),col=['#697C7F','#8DA55C','#866CAC','#B59667'][r];
 for(let y=2;y<16;y++)for(let x=2;x<14;x++)if(x<5||x>10||y<5)p(im,x,y,x===2||y===2?'#B8B7A9':col);else p(im,x,y,'#202C38');
 for(let y=6;y<14;y++)for(let x=6;x<10;x++)if((x+y+f)%3===0)p(im,x,y,'#AADAE3');return im;
}
function gear(){
 const im=new Img(16,16);for(let y=3;y<14;y++)for(let x=3;x<14;x++){const dx=x-8,dy=y-8,d=Math.hypot(dx,dy);if(d>2&&d<5||d>=5&&d<6&&(Math.abs(dx)<2||Math.abs(dy)<2))p(im,x,y,x+y<15?'#CEAD71':'#70674D');}return im;
}
function cradle(r,f){
 const im=new Img(16,16);for(let y=10;y<16;y++)for(let x=2;x<14;x++)p(im,x,y,(x+y)%2?'#C78982':'#856177');
 for(let y=3;y<12;y++)for(let x=5;x<12;x++)if(Math.abs(x-8)*1.4+Math.abs(y-7)<6)p(im,x,y,x<8?'#D3E8EC':'#7AB6CC');
 for(const[x,y]of[[7,5],[10,8],[6,9]])p(im,x,y,'#437A9E');if(f%2)p(im,8,4,'#FAF5D5');return im;
}
const makers={b24_hitos:marker,b24_umbral:portal,b24_engranaje:gear,b24_cuna:cradle};
export const buildB24Assets=()=>Object.fromEntries(Object.entries(makers).map(([id,fn])=>[id,sheet(Array.from({length:4},(_,r)=>Array.from({length:4},(_,f)=>fn(r,f))),16,16).scale(2)]));
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))for(const[id,im]of Object.entries(buildB24Assets())){
 const file=path.join(ROOT,'game/assets/objects',id+'.png');if(process.argv.includes('--check')){const old=Img.load(file);if(old.w!==im.w||old.h!==im.h||!Buffer.from(old.data).equals(Buffer.from(im.data)))throw new Error(id+': asset desactualizado');}else im.save(file);
 if(process.argv.includes('--preview'))preview(im,{scale:3,grid:32,bg:'#658178'}).save(path.join(ROOT,'tools/cache/pixel',id+'.png'));console.log(id);
}
