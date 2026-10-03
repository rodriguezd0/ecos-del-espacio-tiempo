// Stamps y brushes del tileset 9 (ExteriorPrisma) — estilo oriental: Aldea Mnemos (cerezos, pabellones,
// toriis, linternas, casa de té, archivo), Islote Lumbre (cerezos y farolillos) y costas con playa.
// Base: las piezas idénticas píxel a píxel de ExteriorBosqueCeleste (node tools/stamps_compat.mjs 7 9).
// Tras editar: node tools/stamps_bake.mjs ExteriorPrisma · hoja: node tools/preview_stamps.mjs ExteriorPrisma
import base from './ExteriorBosqueCeleste.js';
import { deriveLibrary } from './derive.js';
import { extraDefs } from './extraTiles.js';

const T = (x, y) => 384 + y * 8 + x;

const SHARED_STAMPS = ['casa_roja', 'centro_pokemon', 'casa_verde_pequena', 'casa_verde', 'casa_gris', 'casa_rosa',
  'casa_turquesa_balcon', 'tienda_turquesa', 'fachada_turquesa', 'cabana_turquesa', 'edificio_turquesa_ancho', 'granero_verde',
  'casa_naranja', 'casa_naranja_ancha', 'molino', 'arbol', 'pino', 'arbol_alto', 'pino_alto', 'roca_gris', 'tocon', 'setas',
  'guijarros', 'brotes', 'flores_rosas', 'flores_blancas', 'macizo_flores', 'lupinos', 'arbustos', 'entrada_mina',
  'barrera_obras', 'farola_azul', 'meseta_hierba', 'banco', 'cartel_madera', 'tablon_anuncios', 'tablon_anuncios_2',
  'cartel_ruta', 'papelera', 'buzon_azul', 'buzon_rojo', 'farola', 'farola_blanca', 'columpio', 'estatua', 'estatua_2',
  'fuente_grande', 'estanque_pequeno', 'palmera_maceta', 'flor_amarilla_grande', 'flor_lila_grande', 'escalera_terraza',
  'escalera_terraza_ancha', 'parterre_octogonal', 'jardinera_flores', 'mesa_terraza', 'troncos', 'placa_piedra',
  'seto_marco', 'seto_corto', 'jardin_vallado', 'seto_largo'];
const SHARED_BRUSHES = ['cesped', 'cesped_claro', 'hierba_alta', 'camino_arena', 'camino_tierra', 'agua', 'orilla', 'bosque',
  'bosque_pinos', 'bosque_mixto', 'terraza', 'estanque', 'saliente', 'valla_blanca', 'valla_blanca_v'];

const own = {
  // ─── Cerezos ──────────────────────────────────────────────────────────────────────────────
  cerezo_grande: { src: [0, 443, 7, 9], layer: 2, solid: true, tags: ['oriental', 'arbol', 'cerezo'], desc: 'Cerezo grande en flor con dos troncos (7×9)' },
  cerezo: { src: [0, 477, 5, 6], layer: 2, solid: true, tags: ['oriental', 'arbol', 'cerezo'], desc: 'Cerezo en flor (5×6, copa entera)' },
  lluvia_petalos: { src: [0, 483, 5, 3], layer: 1, tags: ['oriental', 'cerezo', 'suelo'], desc: 'Corro de pétalos caídos sobre la hierba (5×3)' },
  nenufares: { src: [5, 483, 2, 2], layer: 2, tags: ['agua', 'decoracion'], desc: 'Nenúfares con flor (2×2, sobre el agua)' },
  secadero: { src: [0, 463, 2, 2], layer: 2, solid: true, tags: ['puerto', 'pesca'], desc: 'Secadero de redes/pescado (2×2)' },
  // ─── Arquitectura oriental ───────────────────────────────────────────────────────────────
  torii: { src: [0, 610, 7, 6], layer: 2, tags: ['oriental', 'vestigio', 'puerta'], desc: 'Torii naranja con placa (7×6; se pasa por debajo)' },
  torii_rosa: { src: [0, 495, 7, 6], layer: 2, tags: ['oriental', 'vestigio', 'puerta'], desc: 'Torii rosa (7×6)' },
  torii_negro: { src: [0, 577, 7, 6], layer: 2, tags: ['oriental', 'vestigio', 'puerta'], desc: 'Torii grande de madera oscura (7×6)' },
  pabellon_verde: { src: [0, 588, 7, 9], layer: 2, door: [2, 6], tags: ['oriental', 'edificio'], desc: 'Pabellón de tejado verde y dorado (7×9; archivo, santuario o casa de té)' },
  pabellon_verde_2: { src: [0, 598, 7, 9], layer: 2, door: [3, 6], tags: ['oriental', 'edificio'], desc: 'Pabellón de tejado verde con ventanas redondas (7×9)' },
  casa_oriental_rosa: { src: [0, 548, 7, 9], layer: 2, door: [2, 6], tags: ['oriental', 'edificio', 'casa'], desc: 'Casa oriental de tejado granate y paredes rosas (7×9)' },
  pabellon_rosa: { src: [0, 558, 7, 9], layer: 2, door: [3, 6], tags: ['oriental', 'edificio'], desc: 'Pabellón rosa de dos aleros (7×9)' },
  templo_oscuro: { src: [0, 616, 6, 9], layer: 2, door: [2, 6], tags: ['oriental', 'edificio', 'vestigio'], desc: 'Templo de tejado oscuro con pórtico rojo (6×9)' },
  salon_oscuro: { src: [0, 625, 6, 9], layer: 2, door: [2, 6], tags: ['oriental', 'edificio'], desc: 'Salón grande de tejado negro con farolillos (6×9)' },
  santuario_negro: { src: [1, 634, 5, 7], layer: 2, door: [2, 5], tags: ['oriental', 'vestigio'], desc: 'Santuario de tejado negro con pórtico rojo (5×7)' },
  dojo: { src: [0, 487, 8, 8], layer: 2, door: [3, 5], tags: ['oriental', 'edificio'], desc: 'Edificio largo de madera oscura con escalinata (8×8; dojo o Archivo Hondo)' },
  capilla_roja: { src: [2, 662, 3, 5], layer: 2, solid: true, tags: ['oriental', 'vestigio'], desc: 'Capilla pequeña de tejado rojo (3×5)' },
  campana_templo: { src: [6, 663, 2, 4], layer: 2, solid: true, tags: ['oriental', 'campanario'], desc: 'Campana de bronce en armazón (2×4)' },
  linterna_piedra: { src: [0, 607, 1, 2], layer: 2, solid: true, tags: ['oriental', 'luz'], desc: 'Linterna de piedra gris (1×2)' },
  linterna_rosa: { src: [1, 607, 1, 2], layer: 2, solid: true, tags: ['oriental', 'luz'], desc: 'Linterna de piedra rosada (1×2)' },
  linterna_oscura: { src: [2, 607, 1, 2], layer: 2, solid: true, tags: ['oriental', 'luz'], desc: 'Linterna de piedra oscura (1×2)' },
  farolillos: { src: [0, 655, 6, 7], layer: 2, tags: ['oriental', 'fiesta', 'luz'], desc: 'Hilera de farolillos rojos entre postes (6×7; se pasa por debajo)' },
  menhir: { src: [0, 471, 3, 4], layer: 2, solid: true, tags: ['oriental', 'vestigio', 'roca'], desc: 'Piedra erguida antigua (3×4, sombra incluida)' },
  surtidor: { src: [5, 476, 1, 1], layer: 2, tags: ['agua', 'decoracion'], desc: 'Surtidor de agua (1×1)' },
  pila_bambu: { src: [5, 480, 2, 2], layer: 2, solid: true, tags: ['oriental', 'agua'], desc: 'Pila de agua con caño (2×2)' },
  puesto_festival: { src: [0, 572, 5, 5], layer: 2, solid: true, tags: ['oriental', 'mercado', 'fiesta'], desc: 'Puesto de feria con estandarte rojo (5×5)' },
  puesto_mercado: { src: [0, 645, 4, 4], layer: 2, solid: true, tags: ['mercado'], desc: 'Puesto de mercado con toldo y tendero (4×4)' },
  // ─── Puentes, escaleras y agua ──────────────────────────────────────────────────────────────
  puente_rojo: { src: [0, 438, 6, 4], layer: 2, tags: ['oriental', 'puente'], desc: 'Puente arqueado rojo de madera (6×4; va sobre agua)' },
  puente_rojo_peque: { src: [0, 545, 6, 2], layer: 2, tags: ['oriental', 'puente'], desc: 'Puente rojo pequeño (6×2)' },
  escalera_roja: { src: [0, 567, 3, 3], layer: 2, tags: ['escalera', 'oriental'], desc: 'Escalera de piedra con barandilla roja (3×3)' },
  pedregal: { src: [0, 570, 5, 2], layer: 1, tags: ['roca', 'decoracion'], desc: 'Pedregal de cantos blancos (5×2)' },
  bote_remos: { src: [0, 466, 4, 2], layer: 2, solid: true, tags: ['puerto', 'barco'], desc: 'Bote de remos de madera (4×2, sobre el agua)' },
  velero: { src: [0, 453, 5, 4], layer: 2, solid: true, tags: ['puerto', 'barco'], desc: 'Velero amarrado (5×4)' },
  estrado: { src: [0, 670, 6, 6], layer: 1, tags: ['plaza', 'vestigio'], desc: 'Estrado de losas con bordillo (6×6)' },
  boquete: { src: [0, 197, 4, 4], layer: 1, tags: ['cueva', 'vestigio'], desc: 'Boquete oscuro rodeado de rocas (4×4)' },
  casa_azul_larga: { src: [0, 192, 5, 5], layer: 2, door: [2, 3], tags: ['edificio', 'casa'], desc: 'Casa baja de tejado azul (5×5)' },
  casa_tejado_naranja: { src: [0, 420, 6, 6], layer: 2, door: [2, 4], tags: ['edificio', 'casa'], desc: 'Casa de tejado naranja (6×6)' },
};

const brushes = {
  cerezal: {
    cliff: { src: [1, 443], width: 4, faceRows: 6, rows: [443, 444, 446, 447, 448, 449, 450, 451] },
    layer: 2, desc: 'Bosque de cerezos en flor (masa convexa: copas rosas y fila de troncos al sur)',
  },
  petalos: { tile: T(3, 483), layer: 0, desc: 'Suelo alfombrado de pétalos rosas' },
  mar: { grid: [[T(0, 677), T(1, 677)], [T(0, 678), T(1, 678)]], layer: 0, desc: 'Mar de fondo DECORATIVO (mosaico 2×2, sin terrain de agua: no se navega). Agua navegable: `agua` + `playa`/`orilla`' },
  playa: { edge2: { src: [0, 366] }, layer: 1, desc: 'Playa de arena con espuma sobre el agua (borde doble; formas convexas)' },
  cielo: { pattern: [0, 681, 8, 8], layer: 0, desc: 'Cielo con nubes (panorama de cumbres y mapas sobre las nubes)' },
  cascada: { autotile: 0, layer: 2, desc: 'Cascada animada (autotile 0) sobre un acantilado' },
};

export default deriveLibrary(base, {
  tileset: 9,
  image: 'ExteriorPrisma',
  preview: { ground: 'cesped', under: { orilla: 'agua', playa: 'agua' } },
  stamps: { include: SHARED_STAMPS, add: { ...own, ...extraDefs('ExteriorPrisma').stamps } },
  brushes: { include: SHARED_BRUSHES, add: brushes },
});
