// Piezas compartidas por los mapas de Villa Alba (bloque 1): brushes de habitación, salidas y puntos de
// llegada. Módulo puro (se importa también en Node: tests y preview_map).
//
// Coordenadas de enlace con otros mapas: ver content/maps/b01/README.md (fuente de verdad documentada).

const WOOD_FRAME = {
  tl: 4195, t: 4201, tr: 4196, l: 4194, r: 4192,
  bl: [4224, 4225], br: [4226, 4227], bl2: [4232, 4233], br2: [4234, 4235], b: 4185,
};

/** Habitaciones de casa con la pared y el parqué cálidos de las casas de Añil (mapa 28). */
export const ROOM_BRUSHES = Object.freeze({
  // Salón: pared verde menta con zócalo de madera, parqué anaranjado.
  habitacion_calida: {
    room: { wall: [[388, 389, 390], [396, 397, 398], [404, 405, 405]], floor: 386, floorShade: 387, void: 384, frame: WOOD_FRAME },
  },
  // Dormitorio: pared beige con moldura, parqué anaranjado.
  habitacion_beige: {
    room: { wall: [[608, 609, 610], [616, 617, 618], [624, 625, 626]], floor: 386, floorShade: 387, void: 384, frame: WOOD_FRAME },
  },
});

/**
 * Salida de casa de 3 casillas: warps por dirección (pulsar abajo sobre el felpudo) en (doorX-1..doorX+1, y)
 * hacia (tx, ty) del mapa `to`. `y` = fila inferior del suelo (la del felpudo).
 */
export function houseExit(doorX, y, to, tx, ty) {
  return [-1, 0, 1].map((dx) => ({ x: doorX + dx, y, dirTrigger: 2, to, tx, ty, dir: 2, door: true }));
}

/** Flechas animadas de salida bajo el felpudo (decorativas, como en Añil). */
export function exitArrows(xs, y) {
  return xs.map((x) => ({ id: `flecha_${x}`, x, y, sprite: 'FlechaSalida', dir: 8, through: true, stepAnime: true, shadow: false }));
}

/** Cartel/objeto interactivo invisible (muebles, estanterías…): texto al pulsar A delante. */
export function examine(id, x, y, text) {
  return { id, x, y, trigger: 'action', noOver: true, script: async (ctx) => { await ctx.say(text); } };
}

/** Igual que examine() pero sobre todas las casillas de un rectángulo (muebles de varias casillas). */
export function examineRect(id, x, y, w, h, text) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push(examine(`${id}_${i}_${j}`, x + i, y + j, text));
  return out;
}
