// Piezas compartidas por las plantillas de interiores de servicio (Centro Pokémon, tienda, posada):
// pinceles de habitación y stamps en línea del tileset 4 (Interior1) sacados del Centro Pokémon de Añil
// (mapa 31: solo tiles, sin eventos ni textos), salida de 3 casillas y flechas. Módulo PURO.
//
// Los stamps de la biblioteca (`mostrador_centro`, `pc_centro`, `planta`… de content/stamps/Interior1.js)
// se usan por nombre; aquí solo se definen las piezas que la biblioteca aún no tiene, con prefijo `svc_`
// para no chocar con futuras versiones del catálogo (docs/stamps.md).

export const INTERIOR_TILESET = 4;

/** Marco rojo del Centro (mismo esquema que el marco de madera de las casas, +56 en el tileset). */
const CENTER_FRAME = Object.freeze({
  tl: 4251, t: 4257, tr: 4252, l: 4250, r: 4248,
  bl: [4280, 4281], br: [4282, 4283], bl2: [4288, 4289], br2: [4290, 4291], b: 4241,
});

/** Pinceles de habitación de los servicios (se pasan en `brushes` de la definición del mapa). */
export const SERVICE_BRUSHES = Object.freeze({
  // Pared crema con franja naranja y suelo de baldosa anaranjada del Centro Pokémon.
  svc_habitacion_centro: {
    room: { wall: [[754, 754, 754], [762, 762, 762], [770, 770, 770]], floor: 776, floorShade: 777, void: 384, frame: CENTER_FRAME },
  },
  svc_vacio: { tile: 384, layer: 0 },
  // Moqueta rosa de la zona de tienda y de descanso.
  svc_moqueta_rosa: { tile: 774, layer: 0 },
});

/** Stamps en línea (formato `tiles`: capas completas fila a fila; null = capa sin cambios). */
export const SERVICE_STAMPS = Object.freeze({
  // Salida con felpudo en el marco rojo (5×2; la fila 0 va en la última fila de suelo).
  svc_salida_centro: {
    tiles: { w: 5, h: 2, layers: [null, null, [0, 424, 425, 426, 0, 4261, 432, 433, 434, 4262]] },
    door: [2, 1], desc: 'Salida del Centro con felpudo rojo (3 casillas de ancho)',
  },
  // Mostrador azul de la tienda con moqueta rosa detrás (6×4; se apoya en la pared derecha).
  svc_mostrador_tienda: {
    tiles: {
      w: 6, h: 4,
      layers: [
        [0, 0, 0, 0, 0, 0, 0, 937, 937, 937, 937, 937, 0, 937, 774, 774, 774, 774, 0, 937, 774, 774, 774, 774],
        null,
        // La esquina inferior derecha se deja al marco de la habitación (como en Añil).
        [866, 867, 868, 868, 868, 869, 874, 875, 876, 876, 876, 877, 882, 883, 884, 884, 884, 885, 890, 891, 892, 892, 892, 0],
      ],
    },
    solid: true, desc: 'Mostrador azul de tienda (6×4) con el dependiente dentro',
  },
  // Revistero doble (4×3) apoyado en la pared: la fila 0 va sobre la última fila de pared.
  svc_revistero: {
    tiles: { w: 4, h: 3, layers: [null, null, [925, 926, 925, 926, 933, 934, 933, 934, 941, 942, 941, 942]] },
    solid: true, desc: 'Revistero doble de la sala del Centro',
  },
  // Mesa baja con dos taburetes (2×2 + taburete).
  svc_mesa_baja: {
    tiles: { w: 3, h: 2, layers: [null, null, [723, 724, 500, 731, 732, 0]] },
    solid: true, desc: 'Mesa baja con taburete',
  },
});

/**
 * Respaldo de los stamps de la biblioteca que usan las plantillas (`fallback` de la definición: solo se usan si
 * la biblioteca de Interior1 no los tiene o no carga, p. ej. con un horneado desfasado). Mismos tiles que el
 * horneado de content/stamps/baked/Interior1.js.
 */
export const SERVICE_FALLBACK = Object.freeze({
  stamps: {
    mostrador_centro: {
      tiles: {
        w: 7, h: 9,
        layers: [
          null,
          [0, 785, 384, 384, 384, 789, 0, 792, 793, 794, 795, 796, 797, 798, 800, 801, 802, 803, 804, 805, 806, 808, 0, 810, 811, 812, 0, 814,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 896, 897, 898, 899, 900, 0, 0, 904, 905, 906, 907, 908, 0, 0, 912, 913, 914, 915, 916, 0],
          [0, 0, 786, 787, 788, 0, 0, 0, 0, 818, 819, 820, 0, 0, 0, 0, 826, 827, 828, 0, 0, 832, 833, 834, 835, 836, 837, 838, 840, 841, 842,
            843, 844, 845, 846, 848, 849, 850, 851, 852, 853, 854, 0, 857, 858, 859, 860, 861, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
      },
      solid: true,
    },
    pc_centro: { tiles: { w: 2, h: 3, layers: [null, null, [1560, 1561, 1568, 1569, 1576, 1577]] }, solid: true },
    planta: { tiles: { w: 1, h: 2, layers: [null, null, [391, 399]] }, solid: true },
  },
  brushes: {},
});

/**
 * Salida de 3 casillas: warps por dirección (pulsar abajo sobre el felpudo) en (doorX-1..doorX+1, y)
 * hacia la casilla exterior (tx, ty) del mapa `to`.
 */
export function exitWarps(doorX, y, { map, x, y: ty, dir = 2 }) {
  if (!map || !Number.isInteger(x) || !Number.isInteger(ty)) {
    throw new Error(`Salida de interior sin destino válido: ${JSON.stringify({ map, x, y: ty })}`);
  }
  return [-1, 0, 1].map((dx) => ({ x: doorX + dx, y, dirTrigger: 2, to: map, tx: x, ty, dir, door: true }));
}

/** Flechas animadas bajo el felpudo (decorativas, como en Añil). */
export function exitArrowEvents(doorX, y) {
  return [-1, 0, 1].map((dx) => ({
    id: `svc_flecha_${doorX + dx}`, x: doorX + dx, y, sprite: 'FlechaSalida', dir: 8, through: true, stepAnime: true, shadow: false,
  }));
}

/** Objeto interactivo invisible (mueble): texto al pulsar A delante. */
export function examineEvent(id, x, y, text) {
  return { id, x, y, trigger: 'action', noOver: true, script: async (ctx) => { await ctx.say(text); } };
}

/**
 * Mueble de varias casillas cuya fila inferior el tileset deja pisable (revisteros, estanterías): un evento
 * de examinar SÓLIDO por columna, para que no se pueda entrar en él.
 */
export function furnitureEvents(id, x, y, width, text) {
  return Array.from({ length: width }, (_, i) => ({ ...examineEvent(`${id}_${i}`, x + i, y, text), solid: true }));
}
