// P9 vertical: la columna domina la cabecera norte; el puente conserva sus coordenadas como primera planta.
import { paintPillarExterior } from '../../stamps/pilarVertical.js';

export const CORE_MAP = 'camara_cruce_nucleo';
export const EXTERIOR = Object.freeze({ centerX: 20, doorY: 48, arrive: Object.freeze({ x: 20, y: 49, dir: 2 }) });

export function buildP9Exterior(b) {
  // Rellano alrededor de la columna: se recorre por ambos lados, sin tocar las torres del Anillo ni la bajada B19.
  const cells = [];
  for (let y = 38; y <= 49; y++) for (let x = 14; x <= 26; x++) {
    for (let layer = 0; layer < 3; layer++) b.set(layer, x, y, 0);
    cells.push([x, y]);
  }
  b.paint('losas_centro', cells);
  // La parte alta del sprite permite dibujar detrás; la piedra que sostiene la columna sigue siendo sólida.
  const column = b.stampGrids(b.findStamp('pilar_columna'), 'pilar_columna');
  const stone = column.layers[2][column.w * column.h - 1];
  for (let y = EXTERIOR.doorY - 9; y <= EXTERIOR.doorY; y++) {
    for (let x = EXTERIOR.centerX - 3; x <= EXTERIOR.centerX + 3; x++) {
      if (x !== EXTERIOR.centerX || y !== EXTERIOR.doorY) b.set(1, x, y, stone);
    }
  }
  paintPillarExterior(b, EXTERIOR);
}

export function p9ExteriorWarps() {
  return [{ x: EXTERIOR.centerX, y: EXTERIOR.doorY, to: 'puente_convergencia', tx: 20, ty: 1, dir: 2 }];
}

export function p9NorthCordons() {
  // La ampliación del rellano no abre un camino por fuera de los dos policías originales.
  return [14, 15, 16, 17, 23, 24, 25, 26].map((x) => ({
    id: `p9_cordon_${x}`, x, y: 38, noOver: true,
    pages: [{ when: (s) => !s.flag('b17_vigilia'), solid: true, trigger: 'action', script: async (ctx) => {
      await ctx.say('La Policía Regional ha cerrado el acceso al Pilar. Alerce te espera en la Vigilia.');
    } }],
  }));
}
