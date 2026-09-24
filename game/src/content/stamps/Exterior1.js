// Stamps y brushes del tileset 1 (Exterior1), derivados de ExteriorBosqueCeleste: ambos comparten la
// disposición de la imagen. Verificado dibujando toda la biblioteca con el tileset 1
// (node tools/preview_stamps.mjs ExteriorBosqueCeleste --as=1): edificios, árboles y mobiliario coinciden;
// las rarezas moradas/turquesa de Bosque Celeste no existen aquí y se excluyen.
// Excepciones con definición propia: en las mismas casillas de las rocas turquesa y del tocón gigante turquesa,
// Exterior1 trae su versión marrón (roca_grande, roca_peque, tocon_gigante); y sus filas 198–200 (troncos caídos de
// Bosque Celeste) están vacías, así que tronco_caido_h/_v son tiles del overlay calcados de Bosque Celeste.
// Piezas propias (nieve, puerto, ciudad): exterior1_extras.js · kit exterior de Pilar, terrenos y troncos: overlay.
import base from './ExteriorBosqueCeleste.js';
import { deriveLibrary } from './derive.js';
import { extraDefs } from './extraTiles.js';
import { EXTERIOR1_EXTRAS } from './exterior1_extras.js';

const s = base.stamps;
const b = base.brushes;
const KIT = extraDefs('Exterior1');

export default deriveLibrary(base, {
  tileset: 1,
  image: 'Exterior1',
  stamps: {
    exclude: ['cristales', 'cristal_grande', 'portal_raices', 'arbol_morado', 'pino_morado', 'arbol_morado_peque',
      'pino_morado_peque', 'roca_turquesa', 'roca_turquesa_peque', 'tocon_gigante', 'laboratorio_rojo',
      'tronco_caido_h', 'tronco_caido_v'],
    add: {
      roca_grande: { ...s.roca_turquesa, tags: ['roca'], desc: 'Roca marrón grande (2×2)' },
      roca_peque: { ...s.roca_turquesa_peque, tags: ['roca'], desc: 'Roca marrón pequeña' },
      // Tocón marrón propio de Exterior1 (Bosque Celeste tiene uno turquesa en las mismas casillas).
      tocon_gigante: { src: [5, 186, 3, 2], layer: 2, solid: true, tags: ['decoracion'], desc: 'Tocón gigante marrón con raíces (3×2; la fila de arriba tapa al personaje)' },
      laboratorio_rojo: { ...s.laboratorio_rojo, desc: 'Laboratorio de cúpula roja con anexo y buzón (Pueblo Paleta; en este tileset sin molino)' },
      ...EXTERIOR1_EXTRAS.stamps,
      ...KIT.stamps,
    },
  },
  brushes: {
    exclude: ['hierba_alta', 'hierba_alta_morada', 'flores_azules', 'bosque_morado', 'estanque_morado', 'acantilado'],
    add: {
      hierba_alta: { tile: 388, layer: 1, desc: 'Hierba alta clásica (encuentros, tag Grass)' },
      hierba_alta_oscura: { ...b.hierba_alta, desc: 'Hierba alta de hojas oscuras (encuentros)' },
      flores_amarillas: { autotile: 2, layer: 1, desc: 'Flores amarillas animadas' },
      acantilado: { ...b.acantilado, desc: 'Macizo rocoso marrón (convexo): borde, cuerpo y cara de 3 filas' },
      ...EXTERIOR1_EXTRAS.brushes,
      ...KIT.brushes,
    },
  },
});
