// Cámara del Coloso (docs/CAMPANA.md B22: Regigigas, «Cámara del Coloso (Archivo Hondo)»): una cámara más antigua que
// el propio Archivo, bajo la cámara del núcleo del P5. Mismo lenguaje que el Archivo Hondo (InteriorTorre con el kit
// común de Pilar, enlosado sobre el vacío y tinte sepia), pero más grande y sin estanterías: columnas con siete puntos,
// tres pedestales vacíos (roca, hielo, acero) y el coloso sobre un emblema. Sin encuentros. Eventos: b22d_regigigas.js.
import { COLOSO, HOOKS } from './layout.js';
import { colosoEvents } from '../../events/b22d_regigigas.js';
import { pilarTone } from '../../stamps/pilar.js';

const C = COLOSO;
const back = HOOKS.hondo.arriveBack;

function cells(x0, y0, x1, y1) {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
}

function build(b) {
  b.fill(null, 'vacio');
  b.paint('pilar_enlosado', cells(C.floor.x0, C.floor.y0, C.floor.x1, C.floor.y1));
  b.stamp('pilar_escalinata', C.stairs.x, C.stairs.y);
  b.stamp('pilar_camara_nucleo', C.emblem.x, C.emblem.y);
  // Hileras de columnas a los lados de la nave y columnas quebradas junto a la escalera.
  for (const y of [3, 9, 14]) { b.stamp('pilar_columna', 5, y); b.stamp('pilar_columna', 17, y); }
  b.stamp('pilar_columna_quebrada', 8, 17);
  b.stamp('pilar_columna_quebrada', 14, 17);
  // Pedestales vacíos de los tres custodios.
  for (const n of C.niches) b.stamp('pilar_pedestal', n.x, n.y - 1);
  // Glifos y aristas: la cámara es tan vieja como los Pilares.
  for (const [s, x, y] of [
    ['pilar_glifo', 8, 11], ['pilar_glifo_2', 14, 11], ['pilar_glifo', 11, 14], ['pilar_arista', 3, 12], ['pilar_arista', 19, 7],
    ['pilar_arista_grande', 3, 2], ['pilar_monolito', 18, 16], ['pilar_monolito', 3, 16], ['pilar_losa_eco', 10, 12],
  ]) b.stamp(s, x, y);
  // Canales de resonancia a los lados del coloso.
  b.paint('pilar_canal_v', cells(8, 4, 8, 8));
  b.paint('pilar_canal_v', cells(14, 4, 14, 8));
}

export default {
  id: C.id,
  name: 'Cámara del Coloso',
  tileset: 11,
  width: C.width,
  height: C.height,
  outdoor: false,
  cave: true,
  bgm: 'Emociones',
  battleback: 'Templo',
  tone: pilarTone('P5', 0.8),
  start: C.arrive,
  build,
  warps: C.exitTiles.map(([x, y]) => ({ x, y, dirTrigger: 2, to: 'archivo_hondo', tx: back.x, ty: back.y, dir: back.dir })),
  events: colosoEvents(),
};
