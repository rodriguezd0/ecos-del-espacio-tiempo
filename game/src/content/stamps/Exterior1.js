// Stamps y brushes del tileset 1 (Exterior1), derivados de ExteriorBosqueCeleste: ambos comparten la
// disposición de la imagen. Verificado dibujando toda la biblioteca con el tileset 1
// (node tools/preview_stamps.mjs ExteriorBosqueCeleste --as=1): edificios, árboles y mobiliario coinciden;
// las rarezas moradas/turquesa de Bosque Celeste no existen aquí y se excluyen.
import base from './ExteriorBosqueCeleste.js';
import { deriveLibrary } from './derive.js';

const s = base.stamps;
const b = base.brushes;

export default deriveLibrary(base, {
  tileset: 1,
  image: 'Exterior1',
  stamps: {
    exclude: ['cristales', 'cristal_grande', 'portal_raices', 'arbol_morado', 'pino_morado', 'arbol_morado_peque',
      'pino_morado_peque', 'roca_turquesa', 'roca_turquesa_peque', 'tocon_gigante', 'laboratorio_rojo'],
    add: {
      roca_grande: { ...s.roca_turquesa, tags: ['roca'], desc: 'Roca marrón grande (2×2)' },
      roca_peque: { ...s.roca_turquesa_peque, tags: ['roca'], desc: 'Roca marrón pequeña' },
      tocon_gigante: { ...s.tocon_gigante, tags: ['decoracion'], desc: 'Tocón gigante (3×2)' },
      laboratorio_rojo: { ...s.laboratorio_rojo, desc: 'Laboratorio de cúpula roja con anexo y buzón (Pueblo Paleta; en este tileset sin molino)' },
    },
  },
  brushes: {
    exclude: ['hierba_alta', 'hierba_alta_morada', 'flores_azules', 'bosque_morado', 'estanque_morado', 'acantilado'],
    add: {
      hierba_alta: { tile: 388, layer: 1, desc: 'Hierba alta clásica (encuentros, tag Grass)' },
      hierba_alta_oscura: { ...b.hierba_alta, desc: 'Hierba alta de hojas oscuras (encuentros)' },
      flores_amarillas: { autotile: 2, layer: 1, desc: 'Flores amarillas animadas' },
      acantilado: { ...b.acantilado, desc: 'Macizo rocoso marrón (convexo): borde, cuerpo y cara de 3 filas' },
    },
  },
});
