// Piezas propias de Exterior1 (tileset 1) que no están en ExteriorBosqueCeleste: nieve del norte (Ruta 11,
// Paso del Norte, Ruta 13, Villa Boreal), muelles y puerto (Ciudad Nexo, Caleta Sonda), faro, barcos, ciudad
// y mercado, playa de arena sobre el agua, estrado de piedra y cascada. Se añaden en Exterior1.js.
// Coordenadas en tiles de la imagen original (ID = 384 + y*8 + x).
const T = (x, y) => 384 + y * 8 + x;

/** Une piezas del tileset en un stamp `tiles` (capa 2): parts = [[srcX, srcY, w, h, dstX, dstY], …]. */
export function compose(w, h, parts, layer = 2) {
  const grid = new Array(w * h).fill(0);
  for (const [sx, sy, pw, ph, dx, dy] of parts) {
    for (let j = 0; j < ph; j++) for (let i = 0; i < pw; i++) grid[(dx + i) + (dy + j) * w] = T(sx + i, sy + j);
  }
  const layers = [null, null, null];
  layers[layer] = grid;
  return { w, h, layers };
}

const stamps = {
  // ─── Nieve ────────────────────────────────────────────────────────────────────────────────
  pino_nevado: { src: [0, 563, 2, 6], layer: 2, solid: true, tags: ['nieve', 'arbol'], desc: 'Pino nevado alto (2×6)' },
  pino_nevado_peque: { src: [2, 565, 2, 4], layer: 2, solid: true, tags: ['nieve', 'arbol'], desc: 'Pino nevado (2×4)' },
  arbusto_nevado: { src: [4, 564, 3, 1], layer: 2, tags: ['nieve', 'decoracion'], desc: 'Matas cubiertas de nieve (3×1)' },
  tocon_nevado: { src: [4, 567, 1, 1], layer: 2, solid: true, tags: ['nieve', 'decoracion'], desc: 'Tocón con nieve' },
  planta_nevada: { src: [5, 567, 1, 2], layer: 2, tags: ['nieve', 'decoracion'], desc: 'Planta de hojas anchas con nieve (1×2)' },
  meseta_nevada: { src: [0, 557, 6, 6], skip: [[5, 0]], layer: 1, solid: true, tags: ['nieve', 'terraza'], desc: 'Meseta nevada con cara de tierra (6×6)' },
  hoyo_nevado: { src: [1, 553, 4, 4], layer: 1, tags: ['nieve', 'cueva'], desc: 'Hoyo en la nieve con paredes de tierra (4×4)' },
  montones_nieve: { src: [0, 572, 5, 2], layer: 1, tags: ['nieve', 'decoracion'], desc: 'Montoncitos de nieve dispersos (5×2, pisables)' },
  empalizada: { src: [5, 569, 3, 3], layer: 2, solid: true, tags: ['nieve', 'madera'], desc: 'Empalizada de tablones oscuros (3×3)' },
  cueva_ladera: { src: [0, 540, 2, 4], layer: 2, door: [0, 2], tags: ['cueva', 'entrada'], desc: 'Boca de cueva en una ladera, en diagonal (2×4)' },
  escalera_ladera: { src: [3, 540, 4, 4], layer: 2, tags: ['escalera'], desc: 'Escalera de madera en diagonal por la ladera (4×4)' },

  // ─── Puerto y costa ───────────────────────────────────────────────────────────────────────
  faro: { src: [0, 352, 4, 13], layer: 2, solid: true, door: [1, 8], tags: ['edificio', 'puerto', 'faro'], desc: 'Faro blanco con linterna encendida y sombra (4×13; puerta en la base)' },
  poste_electrico: { src: [5, 356, 3, 6], layer: 2, solid: true, tags: ['mobiliario'], desc: 'Poste de madera con cables (3×6, sombra incluida)' },
  velero: { src: [0, 453, 5, 4], layer: 2, solid: true, tags: ['puerto', 'barco'], desc: 'Velero blanco amarrado (5×4, sobre el agua)' },
  velero_2: { src: [0, 458, 5, 4], layer: 2, solid: true, tags: ['puerto', 'barco'], desc: 'Velero blanco mirando al otro lado (5×4)' },
  yate: { tiles: compose(11, 5, [[0, 502, 8, 5, 0, 0], [0, 508, 3, 3, 8, 2]]), solid: true, tags: ['puerto', 'barco'], desc: 'Yate/ferri de pasajeros con popa (11×5, sobre el agua)' },
  camion: { src: [0, 512, 5, 4], layer: 2, solid: true, tags: ['vehiculo', 'puerto'], desc: 'Camión de carga (5×4)' },
  contenedores: { src: [0, 404, 4, 4], layer: 2, solid: true, tags: ['puerto', 'almacen'], desc: 'Dos contenedores de carga, verde y rojo (4×4)' },
  cajas_madera: { src: [0, 401, 5, 3], layer: 2, solid: true, tags: ['puerto', 'almacen'], desc: 'Pila de cajas de madera (5×3)' },
  sombrilla: { src: [6, 402, 2, 2], layer: 2, solid: true, tags: ['playa'], desc: 'Sombrilla de playa (2×2)' },
  farola_hierro: { src: [4, 404, 1, 4], layer: 2, solid: true, tags: ['mobiliario', 'luz'], desc: 'Farola de hierro (1×4)' },
  central: { from: { map: 23, x: 7, y: 65, w: 11, h: 9, layers: [2] }, solid: true, door: [5, 7], tags: ['edificio', 'industria', 'astillero'], desc: 'Nave industrial con depósitos y torres (11×9; astillero, central, subestación o fábrica)' },
  muelle_piedra: { from: { map: 216, x: 60, y: 38, w: 21, h: 24, layers: [1, 2] }, tags: ['puerto', 'muelle'], desc: 'Muelle de piedra en T con farolas, norays y veleros (21×24; va sobre `agua`)' },
  tienda_campana: { src: [1, 470, 4, 5], layer: 2, solid: true, door: [1, 3], tags: ['campamento'], desc: 'Tienda de campaña (4×5)' },
  arco_festivo: { src: [0, 435, 8, 4], layer: 2, tags: ['plaza', 'fiesta'], desc: 'Arco de luces de feria sobre la calle (8×4; se pasa por debajo)' },

  // ─── Mercado y plaza ──────────────────────────────────────────────────────────────────────
  puesto_mercado: { src: [0, 646, 3, 4], layer: 2, solid: true, tags: ['mercado'], desc: 'Puesto de mercado con toldo azul y tendero (3×4)' },
  puesto_mercado_2: { src: [0, 651, 3, 4], layer: 2, solid: true, tags: ['mercado'], desc: 'Puesto de mercado con toldo rosa y tendero (3×4)' },
  barriles: { src: [5, 653, 2, 2], layer: 2, solid: true, tags: ['mercado'], desc: 'Dos barriles (2×2)' },
  farolillos: { src: [0, 655, 6, 7], layer: 2, tags: ['fiesta', 'oriental', 'luz'], desc: 'Hilera de farolillos rojos entre postes (6×7; se pasa por debajo)' },
  campana: { src: [6, 663, 2, 4], layer: 2, solid: true, tags: ['campanario'], desc: 'Campana de bronce en su armazón (2×4)' },
  capilla: { src: [2, 662, 3, 5], layer: 2, solid: true, tags: ['vestigio', 'santuario'], desc: 'Capilla pequeña de tejado rojo (3×5)' },
  estrado: { src: [0, 670, 6, 6], layer: 1, tags: ['plaza', 'vestigio'], desc: 'Estrado de losas con bordillo (6×6; ampliable repitiendo el centro)' },

  // ─── Edificios de ciudad ──────────────────────────────────────────────────────────────────
  casa_turquesa_chimenea: { src: [0, 343, 7, 8], layer: 2, door: [2, 6], tags: ['edificio', 'casa', 'turquesa'], desc: 'Cabaña turquesa con chimenea (7×8)' },
  edificio_naranja: { src: [0, 411, 6, 8], layer: 2, door: [2, 6], tags: ['edificio', 'casa'], desc: 'Casa grande de tejado naranja (6×8)' },
  casa_azul_grande: { src: [0, 427, 6, 6], layer: 2, door: [2, 4], tags: ['edificio', 'casa'], desc: 'Casa de tejado azul con doble puerta (6×6)' },
  edificio_cupula: { src: [0, 444, 8, 8], layer: 2, door: [3, 6], tags: ['edificio', 'ciudad'], desc: 'Edificio de cúpula roja (8×8; museo, gimnasio o sede)' },
  torre_cristal: { from: { map: 216, x: 62, y: 0, w: 14, h: 12, layers: [2] }, solid: true, door: [6, 9], tags: ['edificio', 'ciudad'], desc: 'Torre acristalada azul con estatuas en la entrada (14×12; sede, estación o gran almacén)' },
};

const brushes = {
  nieve: { pattern: [0, 547, 6, 6], layer: 0, desc: 'Suelo nevado (mosaico 6×6)' },
  nieve_parche: { nine: [0, 569], inner: [3, 569], layer: 1, desc: 'Parche de nieve con borde suave sobre el césped' },
  arena_nevada: { nine: [0, 544], inner: [3, 544], layer: 1, desc: 'Claro de arena/tierra con borde de nieve' },
  playa: { edge2: { src: [0, 366] }, layer: 1, desc: 'Playa de arena con espuma sobre el agua (borde doble): `agua` en toda la zona y encima `playa` con la máscara de la arena (formas convexas)' },
  cascada: { autotile: 0, layer: 2, desc: 'Cascada animada (autotile 0): rectángulo sobre el acantilado, con agua arriba y abajo' },
  muelle: { pattern: [0, 523, 4, 5], layer: 1, desc: 'Tablones de muelle (mosaico 4×5; pasarela o embarcadero)' },
  palmeral: { forest: { trees: [[6, 421]], size: [2, 4], period: [2, 2], crownRows: 2 }, layer: 2, trunkLayer: 1, desc: 'Hilera de palmeras apiladas (paseo marítimo; ancho par)' },
};

export const EXTERIOR1_EXTRAS = { stamps, brushes };
