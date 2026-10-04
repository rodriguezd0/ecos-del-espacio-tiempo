import { SITES, LUGIA_ROUTE } from './layout.js';
import { rect } from '../b14/paint.js';

export function marineFloor(key) {
  const S=SITES[key];
  if(key!=='lugia') return rect(3,3,S.width-4,S.height-3);
  const cells=[...rect(12,23,20,27),...rect(11,3,21,9)];
  const route=[S.entry,...LUGIA_ROUTE];
  for(let i=1;i<route.length;i++) {
    const a=route[i-1],c=route[i],n=Math.max(Math.abs(c.x-a.x),Math.abs(c.y-a.y));
    for(let j=0;j<=n;j++) {
      const x=a.x+Math.sign(c.x-a.x)*j,y=a.y+Math.sign(c.y-a.y)*j;
      cells.push(...rect(x-1,y-1,x+1,y+1));
    }
  }
  return cells;
}
export function buildMarine(b,key) {
  const S=SITES[key];b.fill(null,'vacio');
  b.rect(null,1,1,S.width-2,S.height-2,'sala_gris');
  if(key==='lugia') {
    const floor=new Set(marineFloor(key).map(([x,y])=>`${x},${y}`));
    for(let y=2;y<S.height-1;y++) for(let x=2;x<S.width-1;x++) if(!floor.has(`${x},${y}`)) {
      for(let l=0;l<3;l++) b.set(l,x,y,0);
    }
  }
  b.paint('suelo_gris',marineFloor(key));
  // Un umbral pisable fuera de la sala, independiente de los stamps de salida con musgo sólido.
  b.paint('pilar_enlosado',rect(S.exit.x-1,S.exit.y-1,S.exit.x+1,S.exit.y));
  b.stamp('pilar_escalinata',S.exit.x-1,S.exit.y-2);
  if(key==='kyogre') {
    for(const[x,y]of [[7,7],[23,7],[7,17],[23,17]]) b.stamp('cristales',x,y);
    b.stamp('pilar_camara_nucleo',14,5);
  }
}
export function buildMagma(b) {
  const S=SITES.groudon;b.fill(null,'vacio');b.rect(null,2,2,28,24,'sala_volcan');
  b.paint('suelo_volcan',rect(6,4,25,23));
  for(const[x,y]of [[6,6],[24,6],[6,16],[24,16]]) b.stamp('roca_grande_volcan',x,y);
  b.stamp('pilar_camara_nucleo',14,5);b.paint('pilar_enlosado',rect(15,23,17,25));
  b.stamp('pilar_escalinata',S.exit.x-1,S.exit.y-2);
}
export function buildBalcony(b) {
  b.fill(0,0);b.paint('losas_centro',rect(8,3,22,25));
  b.stamp('estrado',12,3);b.stamp('escalera_terraza',14,23);
  for(const[x,y]of [[8,3],[22,3],[8,12],[22,12],[8,22],[22,22]]) b.stamp('pilar_columna',x,y);
  for(const[x,y]of [[10,17],[20,17],[10,7],[20,7]]) b.stamp('pilar_glifo',x,y);
}
