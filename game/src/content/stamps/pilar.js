// Kit común de Pilar (CAMPANA §1.8, X23) y tinte por Pilar. Módulo puro (sin DOM).
//
// Las piezas `pilar_*` son tiles propios del overlay (extraTiles.js) con los MISMOS nombres en todas las
// bibliotecas que lo llevan, de modo que un recinto se construye igual en cualquier tileset de Pilar:
//   kit completo:  tilesets 2 y 12–15 (Cueva1), 11 (InteriorTorre), 8 (InteriorLiga)
//   kit exterior:  tilesets 1 (Exterior1) y 7 (ExteriorBosqueCeleste) — explanadas y Sima
// La piedra del kit es neutra: el tinte de cada Pilar lo aporta el TONO DEL MAPA (propiedad `tone` de la
// definición del mapa, docs/ARCHITECTURE.md §5; se suma al día/noche y al clima en el compositor):
//
//   import { pilarTone } from '../../stamps/pilar.js';
//   export default { id: 'ruinas_dintel', tileset: 2, tone: pilarTone('P1'), … }
//   // en guiones: await ctx.tone(pilarTone('P1'), 30)   (p. ej. al restaurar: pilarTone('P1', 0.4))
import { EXTRA_LAYOUTS, EXTRA_PIECES } from './extraTiles.js';

/** Tinte de cada Pilar: tono RMXP [r, g, b, gris] (r/g/b en -255..255, gris 0..255). */
export const PILAR_TINTS = Object.freeze({
  P1: Object.freeze({ pilar: 'Umbral', tinte: 'ocre', tone: Object.freeze([26, 4, -26, 50]) }),
  P2: Object.freeze({ pilar: 'Corriente', tinte: 'azul', tone: Object.freeze([-26, -4, 26, 34]) }),
  P3: Object.freeze({ pilar: 'Impulso', tinte: 'blanco', tone: Object.freeze([30, 30, 34, 70]) }),
  P4: Object.freeze({ pilar: 'Masa', tinte: 'gris plomo', tone: Object.freeze([-18, -16, -10, 120]) }),
  P5: Object.freeze({ pilar: 'Memoria', tinte: 'sepia', tone: Object.freeze([22, 8, -18, 160]) }),
  P6: Object.freeze({ pilar: 'Invertido', tinte: 'violeta', tone: Object.freeze([16, -24, 34, 40]) }),
  P7: Object.freeze({ pilar: 'Ecos', tinte: 'verde agua', tone: Object.freeze([-22, 16, 8, 40]) }),
  P8: Object.freeze({ pilar: 'Alma', tinte: 'rosa pálido', tone: Object.freeze([30, 6, 16, 40]) }),
  P9: Object.freeze({ pilar: 'Convergencia', tinte: 'plata', tone: Object.freeze([10, 12, 22, 110]) }),
  P10: Object.freeze({ pilar: 'Origen', tinte: 'oro', tone: Object.freeze([38, 30, -36, 0]) }),
});

/**
 * Tono del mapa para un Pilar ('P1'…'P10' o 1…10). `intensity` escala el tinte (0 = neutro, 1 = pleno).
 * @returns {number[]} [r, g, b, gris] listo para `tone:` del mapa o `ctx.tone()`.
 */
export function pilarTone(pilar, intensity = 1) {
  const key = typeof pilar === 'number' ? `P${pilar}` : String(pilar).toUpperCase();
  const tint = PILAR_TINTS[key];
  if (!tint) throw new Error(`pilarTone: Pilar desconocido "${pilar}" (usa P1…P10)`);
  if (!Number.isFinite(intensity) || intensity < 0 || intensity > 1) throw new Error(`pilarTone: intensidad ${intensity} fuera de 0..1`);
  return tint.tone.map((v) => Math.round(v * intensity) || 0); // || 0 evita -0
}

const kitNames = (image) => Object.keys(EXTRA_LAYOUTS[image].pieces).filter((n) => n.startsWith('pilar_'));

/** Nombres del kit completo (tilesets 2, 8, 11, 12–15). */
export const PILAR_KIT = Object.freeze(kitNames('Cueva1'));
/** Subconjunto exterior del kit (tilesets 1 y 7). */
export const PILAR_KIT_EXTERIOR = Object.freeze(kitNames('ExteriorBosqueCeleste'));
/** Tilesets con kit completo / exterior. */
export const PILAR_TILESETS = Object.freeze({ completo: Object.freeze([2, 8, 11, 12, 13, 14, 15]), exterior: Object.freeze([1, 7]) });

/** Descripción de una pieza del kit (para guías y herramientas). */
export const pilarPiece = (name) => {
  const p = EXTRA_PIECES[name];
  if (!p || !name.startsWith('pilar_')) throw new Error(`Pieza de Pilar desconocida: "${name}"`);
  return p;
};
