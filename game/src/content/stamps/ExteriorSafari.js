// Stamps y brushes del tileset 6 (ExteriorSafari) — sabana y marisma: Ruta 8 (Marisma Turbia y Palafitos),
// Ruta 14 y Reserva del Delta, Ruta 6 (Cantería), Dunas de Ceniza y palmeras de Caleta Sonda.
// La disposición de las filas 0–60 y 192–235 es la de ExteriorBosqueCeleste con otra paleta (sabana).
// Piezas propias del overlay (filas 672+, extraTiles.js): ceniza, ceniza honda, barro, arena honda, grava
// y zócalos hexagonales. Tras editar: node tools/stamps_bake.mjs ExteriorSafari
import { extraDefs } from './extraTiles.js';

const T = (x, y) => 384 + y * 8 + x;
const KIT = extraDefs('ExteriorSafari');

export default {
  tileset: 6,
  image: 'ExteriorSafari',
  preview: { ground: 'cesped', under: { orilla: 'agua', playa: 'agua', ceniza_honda: 'ceniza' } },
  stamps: {
    // ─── Árboles y vegetación de sabana ───────────────────────────────────────────────────────
    arbol: { src: [4, 41, 2, 4], layer: 2, solid: true, tags: ['arbol'], desc: 'Árbol redondo suelto (2×4)' },
    pino: { src: [6, 41, 2, 4], layer: 2, solid: true, tags: ['arbol'], desc: 'Pino suelto (2×4)' },
    arbol_grande: { src: [0, 60, 3, 7], layer: 2, solid: true, tags: ['arbol', 'sabana'], desc: 'Árbol frondoso grande de la sabana (3×7)' },
    arbol_grande_2: { src: [3, 60, 3, 6], layer: 2, solid: true, tags: ['arbol', 'sabana'], desc: 'Árbol frondoso de copa ancha (3×6)' },
    matorral: { src: [0, 67, 3, 2], layer: 2, solid: true, tags: ['sabana', 'decoracion'], desc: 'Matorral alargado (3×2)' },
    mata: { src: [3, 68, 1, 1], layer: 2, solid: true, tags: ['sabana', 'decoracion'], desc: 'Mata redonda pequeña' },
    poste: { src: [4, 68, 1, 1], layer: 2, solid: true, tags: ['valla', 'madera'], desc: 'Poste de madera (valla de postes, palafitos)' },
    helechos: { src: [5, 434, 3, 1], layer: 2, tags: ['sabana', 'tropical'], desc: 'Helechos tropicales en fila (3×1)' },
    matas_redondas: { src: [5, 436, 2, 1], layer: 2, tags: ['sabana'], desc: 'Dos matas redondas (2×1)' },
    palmera_maceta: { src: [3, 537, 2, 3], layer: 2, solid: true, tags: ['tropical', 'palmera'], desc: 'Palmera en maceta (2×3)' },
    tocon_grande: { src: [5, 186, 3, 2], layer: 2, solid: true, tags: ['decoracion'], desc: 'Tocón grande (3×2)' },
    seto_redondo: { src: [2, 187, 3, 3], layer: 2, solid: true, tags: ['seto'], desc: 'Seto en anillo (3×3)' },
    roca_grande: { src: [6, 46, 2, 2], layer: 2, solid: true, tags: ['roca'], desc: 'Roca grande (2×2)' },
    roca_peque: { src: [6, 48, 1, 1], layer: 2, solid: true, tags: ['roca'], desc: 'Roca pequeña' },
    boquete: { src: [0, 198, 4, 3], layer: 1, tags: ['cueva', 'vestigio'], desc: 'Boquete oscuro rodeado de rocas (4×3)' },
    entrada_mina: { src: [0, 226, 3, 4], layer: 2, door: [1, 2], tags: ['cueva', 'entrada', 'mina'], desc: 'Entrada de mina con marco de madera y raíles (Cantería, Cerro Plomo)' },
    barrera_obras: { src: [3, 227, 2, 1], layer: 2, solid: true, tags: ['mobiliario', 'mina'], desc: 'Barrera de obras amarilla y negra' },
    meseta_hierba: { src: [0, 230, 5, 5], layer: 1, solid: true, tags: ['terraza'], desc: 'Meseta de hierba con bordes de tierra (5×5)' },
    escalera_diagonal: { src: [5, 229, 3, 5], layer: 2, tags: ['escalera'], desc: 'Escalera de madera en diagonal' },
    fardo_paja: { src: [2, 522, 3, 2], layer: 2, solid: true, tags: ['granja'], desc: 'Fardo de paja deshecho (3×2)' },
    comedero: { src: [6, 522, 2, 2], layer: 2, solid: true, tags: ['granja'], desc: 'Comedero de madera con heno (2×2)' },
    abrevadero: { src: [3, 519, 3, 1], layer: 2, solid: true, tags: ['granja', 'agua'], desc: 'Abrevadero de piedra (3×1)' },

    // ─── Marisma y palafitos ─────────────────────────────────────────────────────────────────
    palafito: { src: [0, 493, 6, 8], layer: 2, door: [3, 5], tags: ['edificio', 'palafito', 'madera'], desc: 'Cabaña de madera de tejado rojo (6×8; palafito sobre `pasarela` o posada)' },
    puente_tablas: { src: [5, 435, 3, 1], layer: 2, tags: ['puente', 'madera'], desc: 'Tablones sobre el agua (puente corto horizontal, 3×1)' },
    pasarela_diagonal: { src: [3, 435, 2, 3], layer: 2, tags: ['puente', 'madera'], desc: 'Pasarela de madera en diagonal (2×3)' },
    muelle: { src: [0, 480, 3, 6], layer: 1, tags: ['madera', 'muelle'], desc: 'Embarcadero de tablones (3×6)' },
    tarima: { src: [3, 480, 5, 7], layer: 1, tags: ['madera', 'muelle'], desc: 'Embarcadero elevado: tablero con cajón arriba y frente de madera sobre el agua (5×7; el frente bloquea)' },
    tendedero: { src: [0, 116, 6, 6], layer: 2, tags: ['palafito', 'decoracion'], desc: 'Cuerda con farolillos/ropa entre dos postes (6×6; se pasa por debajo)' },

    // ─── Edificios ───────────────────────────────────────────────────────────────────────────
    centro_pokemon: { src: [0, 94, 7, 11], layer: 2, door: [3, 8], tags: ['edificio', 'centro'], desc: 'Centro Pokémon' },
    casa_morada: { src: [0, 82, 5, 8], layer: 2, door: [1, 5], tags: ['edificio', 'casa'], desc: 'Casa de tejado morado con puerta de corazón (5×8)' },
    casa_cupula_roja: { src: [0, 106, 6, 9], layer: 2, door: [3, 5], tags: ['edificio'], desc: 'Casa de tejado rojo abovedado (6×9; puesto de guardas de la Reserva)' },
    casa_granate: { src: [0, 279, 5, 5], layer: 2, door: [1, 3], tags: ['edificio', 'casa'], desc: 'Casa baja de tejado granate (5×5)' },
    casa_tejado_azul: { src: [0, 192, 5, 5], layer: 2, door: [2, 3], tags: ['edificio', 'casa'], desc: 'Casa baja de tejado azul (5×5)' },
    caseta_turquesa: { src: [0, 439, 7, 7], layer: 2, door: [3, 4], tags: ['edificio', 'turquesa'], desc: 'Caseta de tejado turquesa (7×7; puesto de la Reserva)' },
    caseta_turquesa_peque: { src: [0, 446, 5, 7], layer: 2, door: [2, 4], tags: ['edificio', 'turquesa'], desc: 'Caseta turquesa pequeña (5×7)' },
    invernadero: { src: [0, 158, 8, 13], layer: 2, door: [4, 8], tags: ['edificio', 'cupula'], desc: 'Gran cúpula de cristal (8×13; invernadero, acuario o laboratorio)' },
    museo: { src: [0, 172, 8, 10], layer: 2, door: [4, 7], tags: ['edificio', 'museo'], desc: 'Edificio de columnas y arco (8×10; museo o sede)' },
    torre_campana: { src: [0, 236, 8, 20], layer: 2, door: [3, 15], tags: ['edificio', 'campanario'], desc: 'Torre con campana y jardineras (8×20)' },
    molino_viento: { src: [0, 535, 2, 5], layer: 2, solid: true, tags: ['energia'], desc: 'Aerogenerador blanco (2×5; Parque Eólico)' },
    fuente: { src: [0, 264, 4, 6], layer: 2, solid: true, tags: ['agua', 'plaza'], desc: 'Fuente de piedra (4×6)' },
    empalizada: { src: [5, 266, 3, 3], layer: 2, solid: true, tags: ['madera', 'valla'], desc: 'Empalizada de tablones (3×3)' },
    farola: { src: [6, 135, 1, 5], layer: 2, solid: true, tags: ['mobiliario', 'luz'], desc: 'Farola verde con sombra' },
    cartel_madera: { src: [7, 10, 1, 1], layer: 2, solid: true, tags: ['cartel'], desc: 'Cartel de madera pequeño' },
    cartel_ruta: { src: [5, 20, 3, 2], layer: 2, solid: true, tags: ['cartel'], desc: 'Cartel de ruta sobre postes (3×2)' },
    troncos: { src: [6, 386, 2, 2], layer: 2, solid: true, tags: ['decoracion'], desc: 'Pila de troncos' },
    escalera_terraza: { src: [5, 56, 3, 3], layer: 2, tags: ['terraza', 'escalera'], desc: 'Escalera de madera para subir una terraza' },
    guijarros: { src: [3, 6, 1, 1], layer: 1, tags: ['decoracion'], desc: 'Guijarros' },

    // ─── Playa ───────────────────────────────────────────────────────────────────────────────
    islote_arena: { src: [0, 365, 4, 6], layer: 1, tags: ['playa', 'agua'], desc: 'Islote de arena en el agua con bajío (4×6)' },

    // ─── Kit (zócalos) del overlay ───────────────────────────────────────────────────────────
    ...KIT.stamps,
  },

  brushes: {
    cesped: { pattern: [0, 0, 4, 4], layer: 0, desc: 'Hierba de sabana (mosaico 4×4)' },
    cesped_claro: { nine: [0, 15], inner: [3, 15], layer: 1, desc: 'Hierba clara con bordes suaves' },
    hierba_alta: { tile: 396, layer: 1, desc: 'Hierba alta (encuentros)' },
    camino_arena: { nine: [0, 4], inner: [3, 4], layer: 1, desc: 'Arena con bordes de hierba (playa interior, caminos)' },
    camino_tierra: { nine: [3, 12], inner: [6, 12], layer: 1, desc: 'Tierra rojiza de marisma con bordes de hierba' },
    agua: { grid: [[136, 134], [130, 132]], layer: 0, desc: 'Agua (autotile 1 con sus patrones válidos). Añadir orilla o playa encima' },
    orilla: { nine: [0, 433], inner: [3, 433], fill: 0, layer: 1, desc: 'Orilla de hierba del agua (misma máscara que `agua`)' },
    playa: { edge2: { src: [0, 366] }, layer: 1, desc: 'Playa de arena con bajío sobre el agua (borde doble; formas convexas)' },
    estanque: { nine: [0, 18], inner: [3, 18], layer: 1, desc: 'Estanque con agua fija y marco de hierba' },
    bosque: { forest: { trees: [[0, 39]], size: [2, 6], period: [2, 4] }, layer: 2, trunkLayer: 1, desc: 'Bosque de árboles redondos' },
    bosque_pinos: { forest: { trees: [[2, 39]], size: [2, 6], period: [2, 4] }, layer: 2, trunkLayer: 1, desc: 'Bosque de pinos' },
    bosque_sabana: { forest: { trees: [[0, 60]], size: [3, 7], period: [3, 4], crownRows: 4 }, layer: 2, trunkLayer: 1, desc: 'Arboleda frondosa de la sabana (árboles 3×7; ancho múltiplo de 3)' },
    acantilado: { cliff: { src: [0, 45], width: 4, faceRows: 3 }, layer: 1, desc: 'Macizo de roca rojiza (convexo): borde, cuerpo y cara de 3 filas' },
    saliente: { line: { ids: [651, 657, 652] }, layer: 1, desc: 'Saliente horizontal (ledge): se salta hacia el sur' },
    valla_postes: { line: { ids: [T(4, 68), T(4, 68), T(4, 68)], axis: 'v' }, layer: 1, desc: 'Valla de postes de madera (vertical; para horizontal usa el stamp `poste` en fila)' },
    cascada: { autotile: 0, layer: 2, desc: 'Cascada animada (autotile 0)' },
    ...KIT.brushes,
  },
};
