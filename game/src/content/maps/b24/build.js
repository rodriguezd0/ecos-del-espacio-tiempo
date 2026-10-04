import { rectCells } from '../../stamps/brushes.js';
import { WEIGHT_PADS } from '../../events/b24_ultra.js';
const cells=(x,y,w,h)=>rectCells(x,y,w,h);
export function buildExpeditionMap(b,S){
 const t=S.theme;
 if(S.tileset===1){
  b.fill(null,['flowers','island'].includes(t)?'agua':'cesped');
  b.blob(null,cells(3,3,21,21),['flowers','island'].includes(t)?'playa':'cesped');
  b.paint('camino_tierra',[...cells(12,5,3,19),...cells(6,17,15,2)]);
  if(['grove','justiceForest','jungle'].includes(t)){
   // Árboles enteros de 2×6, apartados de las dos ramas y del umbral de regreso.
   for(const[x,y]of[[3,3],[21,3],[3,10],[21,10]])b.stamp('arbol_alto',x,y);
   if(t==='jungle')for(const[x,y]of[[9,10],[15,10]])b.stamp('arbol_alto',x,y);
  }
  if(t==='flowers')for(const[x,y]of[[6,8],[17,8],[6,13],[17,13]])b.rect(null,x,y,4,3,'flores_amarillas');
  if(t==='island')b.stamp('estrado',11,4);
  if(t==='crater'){
   for(const[x,y]of[[5,5],[19,5],[5,13],[19,13]])b.stamp('roca_grande',x,y);
   b.rect(null,10,4,7,5,'grava');
  }
  b.paint('camino_tierra',cells(12,21,3,3));
 }else{
  b.fill(null,'vacio');
  if(S.tileset===4){
   b.rect(null,1,1,25,23,'habitacion_casa');
   b.stamp('mesa_comedor',7,7);b.stamp('mesa_comedor',17,7);b.stamp('estanteria_lab',3,3);b.stamp('estanteria_lab',21,3);
   // El hueco atraviesa también el borde inferior del brush de habitación.
   for(let l=0;l<3;l++)for(const[x,y]of cells(12,21,3,3))b.set(l,x,y,0);
   b.paint('suelo_madera',cells(12,21,3,3));b.stamp('salida_casa',11,22);b.set(2,13,23,0);
  }else{
   const variant=S.tileset===11?'solemne':['thermal','dunes'].includes(t)?(t==='thermal'?'volcan':'arcilla'):t==='venom'?'morada':t==='sky'?'hielo':'gris';
   const sala=S.tileset===11?'sala_azul':`sala_${variant}`;
   b.rect(null,1,1,25,23,sala);
   b.paint(S.tileset===11?'suelo_solemne':`suelo_${variant}`,cells(3,4,21,19));
   if(t==='crystal'||t==='diamond'||t==='coral')for(const[x,y]of[[4,5],[20,5],[4,13],[20,13]])b.stamp('cristales',x,y);
   if(t==='thermal')b.blob(null,cells(5,8,5,4),'estanque_volcan');
   if(t==='fortress')for(const p of WEIGHT_PADS)b.stamp('pilar_glifo',p.x,p.y);
   if(t==='sky'){
    // Dos plataformas separadas por el vacío; ambas tienen pasarela de regreso permanente.
    b.fill(null,'vacio');
    b.paint('suelo_hielo',[...cells(5,5,6,5),...cells(16,5,6,5),...cells(9,9,2,12),...cells(16,9,2,12),...cells(6,20,15,3)]);
   }
   b.paint(S.tileset===11?'suelo_solemne':'pilar_enlosado',cells(12,21,3,3));
  }
 }
}
