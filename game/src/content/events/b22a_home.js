// Casa del protagonista en el postgame (B01, casa_prota_2f): al despertar del epílogo (b21_fin) se apunta cuántas veces
// se había descansado. Arceus, si quedó debilitado en la cima (B21), vuelve a medir tras el primer descanso DESPUÉS del
// final (docs/CAMPANA.md B22: «Arceus (si no se capturó) · Columna Lanza · Descansar tras el final»). Evento invisible e
// instantáneo; aditivo.
import { F, LEGENDS, restCount } from './b22a_common.js';

/** ¿Falta la línea base del descanso de Arceus? (postgame recién empezado, Arceus debilitado y sin capturar). Pura. */
export function needsArceusBaseline(s) {
  if (!s?.flag(F.postgame) || !s.flag(F.arceusFainted) || s.flag(F.arceusCaught)) return false;
  const v = s.var(LEGENDS.arceus.rest, null);
  return v === null || v === undefined || v === '';
}

/** Eventos que añade el cuarto (casa_prota_2f.js). */
export function b22aCuartoEvents() {
  return [{
    id: 'b22a_despertar_postgame', x: 0, y: 2, trigger: 'auto', when: needsArceusBaseline,
    script: async (ctx) => { ctx.setVar(LEGENDS.arceus.rest, restCount(ctx.state)); },
  }];
}
