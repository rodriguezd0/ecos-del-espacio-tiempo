// MAQUETA DE PRUEBAS (no es un mapa de la campaña): el Nodo del Origen mientras `nucleo_origen` (B20) no exista.
// Sala dorada con el hexágono del Nodo en el centro y el evento del Salto de Convergencia (b21_salto.js). La usa el
// E2E del bloque y sirve para probar a mano: ?scene=map&map=dev_nodo_origen&flags=p10_restored,…&debug
import { pilarTone } from '../../stamps/pilar.js';
import { b21NodoOrigenEvents } from '../../events/b21_salto.js';

export const DEV_NODE = Object.freeze({ x: 9, y: 8 });

function rect(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

export default {
  id: 'dev_nodo_origen',
  name: 'Nodo del Origen (pruebas)',
  tileset: 8,
  width: 19,
  height: 15,
  outdoor: false,
  tone: pilarTone('P10', 0.6),
  bgm: 'Final2',
  escapeRope: false,
  encounters: {},
  start: { x: 9, y: 12, dir: 8 },
  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 17, 13, 'sala_dorado');
    b.paint('pilar_enlosado', rect(3, 4, 13, 9), { layer: 1 });
    b.stamp('pilar_camara_nucleo', DEV_NODE.x - 2, DEV_NODE.y - 2);
    b.stamp('pilar_columna', 4, 4);
    b.stamp('pilar_columna', 14, 4);
    b.stamp('pilar_monolito', 8, 2);
  },
  events: [...b21NodoOrigenEvents({ x: DEV_NODE.x, y: DEV_NODE.y })],
};
