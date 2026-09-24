// Stamps y brushes del tileset 7 (ExteriorBosqueCeleste) — pueblo inicial, rutas y bosques de Axis.
// Formato: docs/ARCHITECTURE.md §5 y docs/stamps.md. Tras editar: node tools/stamps_bake.mjs ExteriorBosqueCeleste
// y revisar la hoja: node tools/preview_stamps.mjs ExteriorBosqueCeleste
//
// src: [x, y, w, h] en tiles de la imagen ORIGINAL (8 columnas; ID = 384 + y*8 + x).
// from: recorte de un mapa de Añil (tools/cache/anil_maps). Los mapas del tileset 1 (Exterior1) comparten casi
//       todos los IDs con este tileset; cada recorte se verificó dibujándolo con el tileset 7.
// door: [dx, dy] casilla de la puerta relativa al stamp. solid: true si bloquea el paso (pasabilidad real = tileset).
// Al final: kit exterior de Pilar y grava (tiles propios del overlay, extraTiles.js; no se heredan).
import { extraDefs } from './extraTiles.js';

const KIT = extraDefs('ExteriorBosqueCeleste');

export default {
  tileset: 7,
  image: 'ExteriorBosqueCeleste',
  preview: { ground: 'cesped', under: { orilla: 'agua', playa: 'agua' } },
  stamps: {
    // ─── Edificios (capa 2, como en Añil; incluyen su sombra) ────────────────────────────────
    casa_roja: { src: [0, 60, 7, 11], layer: 2, door: [4, 7], tags: ['edificio', 'casa'], desc: 'Casa de tejado rojo a dos aguas con mirador (7×11, sombra incluida)' },
    laboratorio_rojo: { from: { map: 2, x: 25, y: 21, w: 9, h: 16, layers: [2] }, skip: [[1, 0], [6, 0], [0, 15], [6, 15]], door: [2, 11], tags: ['edificio', 'laboratorio'], desc: 'Edificio de cúpula roja con molino, anexo y buzón (laboratorio de Pueblo Paleta, 9×16)' },
    centro_pokemon: { src: [0, 94, 7, 11], layer: 2, door: [3, 8], tags: ['edificio', 'centro'], desc: 'Centro Pokémon' },
    casa_verde_pequena: { src: [0, 106, 6, 8], layer: 2, door: [2, 5], tags: ['edificio', 'casa'], desc: 'Casa pequeña de tejado verde con chimenea' },
    casa_verde: { src: [0, 114, 6, 10], layer: 2, door: [3, 6], tags: ['edificio', 'casa'], desc: 'Casa de tejado verde con jardineras' },
    casa_gris: { src: [0, 246, 6, 7], layer: 2, door: [3, 4], tags: ['edificio', 'casa'], desc: 'Casa de pizarra gris con porche' },
    casa_rosa: { src: [0, 279, 5, 5], layer: 2, door: [1, 3], tags: ['edificio', 'casa'], desc: 'Casa baja de tejado granate' },
    casa_turquesa_balcon: { src: [0, 284, 7, 9], layer: 2, door: [2, 6], tags: ['edificio', 'casa', 'turquesa'], desc: 'Casa turquesa con balcón y chimenea' },
    tienda_turquesa: { src: [0, 294, 7, 8], layer: 2, door: [3, 5], tags: ['edificio', 'tienda', 'turquesa'], desc: 'Tienda turquesa con toldo a rayas' },
    fachada_turquesa: { src: [0, 303, 7, 6], layer: 2, door: [3, 4], tags: ['edificio', 'laboratorio', 'turquesa'], desc: 'Fachada turquesa compacta (candidata a laboratorio de Axis)' },
    cabana_turquesa: { src: [0, 343, 6, 9], layer: 2, door: [2, 6], tags: ['edificio', 'casa', 'turquesa'], desc: 'Cabaña de troncos con tejado turquesa' },
    edificio_turquesa_ancho: { src: [0, 376, 7, 8], layer: 2, door: [3, 5], tags: ['edificio', 'laboratorio', 'turquesa'], desc: 'Edificio ancho de madera con tejado turquesa' },
    granero_verde: { src: [0, 385, 5, 7], layer: 2, door: [2, 5], tags: ['edificio'], desc: 'Granero de tejado verde' },
    casa_naranja: { src: [0, 411, 7, 8], layer: 2, door: [3, 5], tags: ['edificio', 'casa'], desc: 'Casa de tejado naranja a cuatro aguas' },
    casa_naranja_ancha: { src: [0, 420, 6, 7], layer: 2, door: [2, 4], tags: ['edificio', 'casa'], desc: 'Casa de tejado naranja con puerta doble (puerta en x 2–3)' },
    casa_azul: { src: [0, 427, 6, 7], layer: 2, door: [3, 4], tags: ['edificio', 'casa'], desc: 'Casa de tejado azul' },
    edificio_rojo_grande: { src: [0, 444, 7, 8], layer: 2, door: [3, 6], tags: ['edificio'], desc: 'Edificio grande de tejado rojo (gimnasio/sala)' },
    molino: { src: [6, 116, 2, 4], layer: 2, tags: ['decoracion'], desc: 'Molino de viento pequeño' },

    // ─── Árboles y naturaleza ────────────────────────────────────────────────────────────────
    arbol: { src: [4, 41, 2, 4], layer: 2, solid: true, tags: ['arbol'], desc: 'Árbol redondo suelto (2×4)' },
    pino: { src: [6, 41, 2, 4], layer: 2, solid: true, tags: ['arbol'], desc: 'Pino suelto (2×4)' },
    arbol_alto: { src: [0, 39, 2, 6], layer: 2, solid: true, tags: ['arbol'], desc: 'Árbol redondo del bosque (2×6, apilable cada 4 filas)' },
    pino_alto: { src: [2, 39, 2, 6], layer: 2, solid: true, tags: ['arbol'], desc: 'Pino del bosque (2×6, apilable cada 4 filas)' },
    roca_turquesa: { src: [6, 46, 2, 2], layer: 2, solid: true, tags: ['roca'], desc: 'Roca turquesa grande (2×2)' },
    roca_turquesa_peque: { src: [6, 48, 1, 1], layer: 2, solid: true, tags: ['roca'], desc: 'Roca turquesa pequeña' },
    roca_gris: { src: [5, 15, 2, 1], layer: 2, solid: true, tags: ['roca'], desc: 'Roca gris' },
    roca_agua: { src: [7, 15, 1, 1], layer: 2, solid: true, tags: ['roca', 'agua'], desc: 'Roca que asoma en el agua' },
    tocon: { src: [5, 5, 1, 1], layer: 2, solid: true, tags: ['decoracion'], desc: 'Tocón con musgo' },
    setas: { src: [4, 6, 1, 1], layer: 2, tags: ['decoracion'], desc: 'Grupo de setas' },
    guijarros: { src: [3, 6, 1, 1], layer: 1, tags: ['decoracion'], desc: 'Guijarros sobre la hierba' },
    brotes: { src: [4, 3, 1, 1], layer: 2, tags: ['decoracion'], desc: 'Matojo de hierba (decorativo)' },
    flores_rosas: { src: [5, 3, 1, 1], layer: 1, tags: ['flor'], desc: 'Flores rosas sueltas' },
    flores_blancas: { src: [6, 2, 1, 1], layer: 1, tags: ['flor'], desc: 'Flores blancas sueltas' },
    macizo_flores: { src: [5, 4, 2, 1], layer: 1, tags: ['flor'], desc: 'Macizo de flores de colores (2×1)' },
    lupinos: { src: [0, 36, 3, 2], layer: 2, tags: ['flor'], desc: 'Lupinos lila altos' },
    arbustos: { src: [3, 7, 2, 2], layer: 2, tags: ['decoracion'], desc: 'Matas de arbusto oscuro' },

    // ─── Bosque Celeste (morado/turquesa): vestigios, cuevas y rarezas ───────────────────────────
    arbol_morado: { src: [0, 208, 2, 6], layer: 2, solid: true, tags: ['arbol', 'bosque_celeste'], desc: 'Árbol morado del Bosque Celeste (2×6)' },
    pino_morado: { src: [2, 208, 2, 6], layer: 2, solid: true, tags: ['arbol', 'bosque_celeste'], desc: 'Pino morado del Bosque Celeste (2×6)' },
    arbol_morado_peque: { src: [4, 210, 2, 4], layer: 2, solid: true, tags: ['arbol', 'bosque_celeste'], desc: 'Árbol morado suelto (2×4)' },
    pino_morado_peque: { src: [6, 210, 2, 4], layer: 2, solid: true, tags: ['arbol', 'bosque_celeste'], desc: 'Pino morado suelto (2×4)' },
    cristales: { src: [0, 195, 6, 2], layer: 2, solid: true, tags: ['roca', 'bosque_celeste'], desc: 'Grupo de cristales turquesa (6×2)' },
    cristal_grande: { src: [2, 195, 2, 2], layer: 2, solid: true, tags: ['roca', 'bosque_celeste'], desc: 'Cristal turquesa grande (2×2)' },
    boquete: { src: [0, 198, 4, 3], layer: 1, tags: ['cueva', 'vestigio'], desc: 'Boquete oscuro rodeado de rocas (entrada a cueva/ruina)' },
    tronco_caido_h: { src: [4, 198, 3, 1], layer: 2, solid: true, tags: ['decoracion'], desc: 'Tronco caído horizontal (3×1)' },
    tronco_caido_v: { src: [7, 198, 1, 3], layer: 2, solid: true, tags: ['decoracion'], desc: 'Tronco caído vertical (1×3)' },
    tocon_gigante: { src: [5, 186, 3, 2], layer: 2, solid: true, tags: ['vestigio', 'bosque_celeste'], desc: 'Tocón gigante turquesa (vestigio)' },
    portal_raices: { src: [5, 192, 3, 3], layer: 2, solid: true, tags: ['vestigio', 'bosque_celeste'], desc: 'Telón de raíces moradas (decorativo, bloquea)' },
    entrada_mina: { src: [0, 226, 3, 4], layer: 2, door: [1, 2], tags: ['cueva', 'entrada'], desc: 'Entrada de mina con marco de madera y raíles' },
    barrera_obras: { src: [3, 227, 2, 1], layer: 2, solid: true, tags: ['mobiliario'], desc: 'Barrera de obras amarilla y negra' },
    farola_azul: { src: [6, 215, 1, 4], layer: 2, solid: true, tags: ['mobiliario', 'luz'], desc: 'Farola azul moderna' },
    meseta_hierba: { src: [0, 230, 5, 5], layer: 1, solid: true, tags: ['terraza'], desc: 'Meseta de hierba con bordes de tierra (5×5)' },
    escalera_diagonal: { src: [5, 229, 3, 5], layer: 2, tags: ['escalera'], desc: 'Escalera de madera en diagonal' },

    // ─── Mobiliario urbano ───────────────────────────────────────────────────────────────────
    banco: { src: [0, 10, 3, 1], layer: 2, solid: true, tags: ['mobiliario'], desc: 'Banco de madera (3×1)' },
    cartel_madera: { src: [7, 10, 1, 1], layer: 2, solid: true, tags: ['cartel'], desc: 'Cartel de madera pequeño' },
    tablon_anuncios: { src: [0, 21, 2, 2], layer: 2, solid: true, tags: ['cartel'], desc: 'Tablón de madera de entrada (2×2)' },
    tablon_anuncios_2: { src: [2, 21, 2, 2], layer: 2, solid: true, tags: ['cartel'], desc: 'Tablón de madera con marco (2×2)' },
    cartel_ruta: { src: [5, 20, 3, 2], layer: 2, solid: true, tags: ['cartel'], desc: 'Cartel de ruta sobre postes (3×2)' },
    papelera: { src: [7, 22, 1, 1], layer: 2, solid: true, tags: ['mobiliario'], desc: 'Papelera roja' },
    buzon_azul: { src: [4, 24, 1, 2], layer: 2, solid: true, tags: ['mobiliario'], desc: 'Buzón/panel azul' },
    buzon_rojo: { src: [5, 24, 1, 2], layer: 2, solid: true, tags: ['mobiliario'], desc: 'Buzón rojo' },
    maquinas_expendedoras: { src: [6, 24, 2, 2], layer: 2, solid: true, tags: ['mobiliario'], desc: 'Dos máquinas expendedoras' },
    farola: { src: [6, 135, 1, 5], layer: 2, solid: true, tags: ['mobiliario', 'luz'], desc: 'Farola verde con sombra' },
    farola_blanca: { src: [5, 316, 1, 3], layer: 2, solid: true, tags: ['mobiliario', 'luz'], desc: 'Farola de globo blanco' },
    columpio: { src: [4, 142, 3, 3], layer: 2, solid: true, tags: ['mobiliario'], desc: 'Columpio de madera' },
    estatua: { src: [0, 146, 2, 2], layer: 2, solid: true, tags: ['mobiliario'], desc: 'Estatua de Pokémon en pedestal' },
    estatua_2: { src: [3, 146, 2, 2], layer: 2, solid: true, tags: ['mobiliario'], desc: 'Estatua de Pokémon ave en pedestal' },
    fuente_grande: { src: [0, 326, 4, 6], layer: 2, solid: true, tags: ['mobiliario', 'agua'], desc: 'Fuente de piedra de dos pisos' },
    estanque_pequeno: { src: [5, 327, 3, 3], layer: 1, solid: true, tags: ['agua', 'jardin'], desc: 'Estanque cuadrado pequeño con marco de hierba' },
    palmera_maceta: { src: [6, 421, 2, 4], layer: 2, solid: true, tags: ['decoracion'], desc: 'Palmera en maceta' },
    flor_amarilla_grande: { tiles: { w: 1, h: 2, layers: [null, [240, 192], null] }, tags: ['flor'], desc: 'Flor amarilla alta animada (autotiles 4/3)' },
    flor_lila_grande: { tiles: { w: 1, h: 2, layers: [null, [336, 288], null] }, tags: ['flor'], desc: 'Flor lila alta animada (autotiles 6/5)' },
    escalera_terraza: { src: [5, 56, 3, 3], layer: 2, tags: ['terraza', 'escalera'], desc: 'Escalera de madera para subir una terraza (sobre la cara de 3 filas)' },
    escalera_terraza_ancha: { tiles: { w: 5, h: 3, layers: [null, null, [837, 838, 838, 838, 839, 845, 846, 846, 846, 847, 853, 854, 854, 854, 855]] }, tags: ['terraza', 'escalera'], desc: 'Escalera de terraza de 5 de ancho' },
    parterre_octogonal: { src: [0, 311, 3, 3], layer: 2, solid: true, tags: ['flor', 'jardin'], desc: 'Parterre octogonal de flores (foco de plaza)' },
    jardinera_flores: { src: [5, 28, 3, 3], layer: 2, solid: true, tags: ['flor', 'jardin'], desc: 'Jardinera de madera con tulipanes' },
    mesa_terraza: { src: [4, 312, 2, 2], layer: 2, solid: true, tags: ['mobiliario'], desc: 'Mesa de terraza' },
    troncos: { src: [6, 386, 2, 2], layer: 2, solid: true, tags: ['decoracion'], desc: 'Pila de troncos' },
    placa_piedra: { src: [0, 135, 6, 3], layer: 1, tags: ['suelo', 'plaza'], desc: 'Losa de piedra con musgo (plaza)' },

    // ─── Setos y vallas ──────────────────────────────────────────────────────────────────────
    seto_marco: { src: [0, 26, 5, 5], layer: 2, solid: true, tags: ['seto'], desc: 'Seto florido cerrado en cuadro (5×5)' },
    seto_corto: { src: [6, 26, 2, 2], layer: 2, solid: true, tags: ['seto'], desc: 'Seto florido corto (2×2)' },

    // ─── Recortes probados de mapas de Añil (tileset 1, compatibles) ──────────────────────────
    jardin_vallado: { from: { map: 2, x: 8, y: 22, w: 8, h: 4, layers: [1, 2] }, tags: ['jardin', 'flor', 'valla'], desc: 'Valla blanca con dos jardineras de tulipanes y flores (Pueblo Paleta)' },
    seto_largo: { from: { map: 2, x: 24, y: 23, w: 10, h: 2, layers: [1] }, tags: ['seto'], desc: 'Seto florido largo (10×2)' },

    // ─── Kit exterior de Pilar (explanada del P1) ─────────────────────────────────────────────
    ...KIT.stamps,
  },

  brushes: {
    cesped: { pattern: [0, 0, 4, 4], layer: 0, desc: 'Césped base (mosaico 4×4)' },
    cesped_claro: { nine: [0, 15], inner: [3, 15], layer: 1, desc: 'Zona de césped claro con bordes suaves' },
    hierba_alta: { tile: 396, layer: 1, desc: 'Hierba alta verde (encuentros, tag Grass)' },
    hierba_alta_morada: { tile: 388, layer: 1, desc: 'Hierba alta morada de Bosque Celeste (encuentros)' },
    camino_arena: { nine: [0, 4], inner: [3, 4], layer: 1, desc: 'Camino de arena con bordes de hierba' },
    camino_tierra: { nine: [3, 12], inner: [6, 12], layer: 1, desc: 'Camino de tierra con bordes de hierba' },
    agua: { grid: [[136, 134], [130, 132]], layer: 0, desc: 'Agua (autotile 1 con sus 4 patrones válidos). Añadir orilla encima' },
    orilla: { nine: [0, 520], inner: [3, 520], fill: 0, layer: 1, desc: 'Orilla de hierba del agua (misma máscara que agua)' },
    flores_azules: { autotile: 2, layer: 1, desc: 'Flores azules animadas' },
    bosque: { forest: { trees: [[0, 39]], size: [2, 6], period: [2, 4] }, layer: 2, trunkLayer: 1, desc: 'Bosque denso de árboles redondos (ancho par; alto 4k+2 ideal)' },
    bosque_pinos: { forest: { trees: [[2, 39]], size: [2, 6], period: [2, 4] }, layer: 2, trunkLayer: 1, desc: 'Bosque denso de pinos' },
    bosque_morado: { forest: { trees: [[0, 208], [2, 208]], size: [2, 6], period: [2, 4] }, layer: 2, trunkLayer: 1, desc: 'Bosque morado del Bosque Celeste' },
    estanque_morado: { nine: [0, 179], inner: [3, 179], layer: 1, desc: 'Estanque con marco de musgo morado' },
    bosque_mixto: { forest: { trees: [[0, 39], [2, 39]], size: [2, 6], period: [2, 4] }, layer: 2, trunkLayer: 1, desc: 'Bosque mixto' },
    acantilado: { cliff: { src: [0, 45], width: 4, faceRows: 3 }, layer: 1, desc: 'Macizo rocoso turquesa (convexo): borde, cuerpo y cara de 3 filas' },
    terraza: {
      terrace: {
        rim: { w0: 824, w1: 817, mid: 818, e1: 819, e0: 828 },
        side: { w0: [840], w1: [825, 833], e1: [827, 835], e0: [844] },
        face: { w0: [840, 848, 856], w1: [841, 849, 857], mid: [842, 850, 858], e1: [843, 851, 859], e0: [844, 852, 860] },
      },
      layer: 1,
      desc: 'Terraza elevada de muros finos (convexa, ancho ≥ 5): borde norte, laterales dobles y cara sur de 3 filas',
    },
    estanque: { nine: [0, 18], inner: [3, 18], layer: 1, desc: 'Estanque con agua fija y marco de hierba (alternativa a agua+orilla)' },
    saliente: { line: { ids: [651, 657, 652] }, layer: 1, desc: 'Saliente horizontal (ledge): se salta hacia el sur' },
    valla_blanca: { line: { ids: [568, 565, 569] }, layer: 1, desc: 'Valla blanca horizontal' },
    valla_blanca_v: { line: { ids: [578, 586, 586], axis: 'v' }, layer: 1, desc: 'Valla blanca vertical (remate arriba)' },
    cascada: { autotile: 0, layer: 2, desc: 'Cascada animada (autotile 0): rectángulo sobre el acantilado, con agua arriba y abajo' },
    ...KIT.brushes,
  },
};
