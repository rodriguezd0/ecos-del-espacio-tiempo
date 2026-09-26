// Senda del Origen (docs/CAMPANA.md B20): piezas comunes de los nueve tramos — enlaces entre tramos, escena de entrada
// de cada eco, Manantiales del Origen (curan y guardan punto de control) y el contador de tramos superados.
// Los tramos: b20_tramos_a.js (1–3), b20_tramos_b.js (4–6), b20_tramos_c.js (7–9).
import { F, GOLD, pause, examine } from './b20_common.js';
import { tramoId, ARRIVE, EXIT_TOP, EXIT_STAND, BACK, LINKS, T6 } from '../maps/b20/layout.js';
import { setAnchor } from '../../world/impossible/actions.js';

// Zygarde habla muy poco (autor, 25-09-2026): sin líneas de Zygarde al entrar en cada tramo ni en los manantiales.

/** Warps de un tramo: boca norte (siguiente) y claridad sur (anterior). */
export function tramoWarps(n) {
  const out = [];
  // El tramo 6 (espacio imposible) tiene otra geometría: llegada y vuelta en sus propias casillas.
  const into = (k, spot) => (k === 6 ? { map: tramoId(6), ...spot } : null);
  const next = n < 9 ? (into(n + 1, T6.arrive) || { map: tramoId(n + 1), ...ARRIVE }) : LINKS.sendaToCielo;
  const prev = n > 1 ? (into(n - 1, T6.exitStand) || { map: tramoId(n - 1), ...EXIT_STAND }) : LINKS.sendaToPuerta;
  if (n !== 6) {
    out.push({ x: EXIT_TOP.x, y: EXIT_TOP.y, to: next.map, tx: next.x, ty: next.y, dir: next.dir });
    out.push({ x: BACK.x, y: BACK.y, to: prev.map, tx: prev.x, ty: prev.y, dir: prev.dir ?? 2 });
  }
  return out;
}

/**
 * Al entrar en el tramo n: el anterior cuenta como superado (se ha cruzado su boca) y se marca la primera visita.
 * `extra(ctx)` = guion adicional del tramo.
 */
export function tramoOnEnter(n, extra = null) {
  return async (ctx) => {
    for (let k = 1; k < n; k++) if (!ctx.flag(F.tramo(k))) ctx.setFlag(F.tramo(k));
    const seen = `b20_t${n}_visto`;
    if (!ctx.flag(seen)) {
      ctx.setFlag(seen);
      await pause(ctx, 16);
    }
    if (typeof extra === 'function') await extra(ctx);
  };
}

export const SPRING_TEXT = Object.freeze({
  look: 'Un manantial del Origen. El agua brilla con un tono dorado y no hace ningún ruido.',
  drink: 'Bebes del manantial. Tu equipo recupera todas sus fuerzas.',
  mark: 'El manantial recordará este lugar: si tu equipo cae, volverás aquí.',
});

/**
 * Manantial del Origen (pilar_manantial 3×3 con la esquina en `spring`): cura, fija el punto de cura (derrotas y Cuerda
 * Huida vuelven aquí) y, en los mapas del espacio imposible, el punto seguro de las caídas. `stand` = casilla desde la
 * que se usa (debajo de la pila, mirando arriba). El evento ocupa el borde sur de la pila (sólida).
 */
export function springEvent(id, n, spring) {
  const cx = spring.x + 1;
  const cy = spring.y + 2;
  return {
    id, x: cx, y: cy, name: 'Manantial del Origen',
    pages: [{
      solid: true, trigger: 'action', noOver: true,
      light: { radius: 70, intensity: 0.8 },
      glow: { name: 'softLight', radius: 60, intensity: 0.55, pulse: 0.4, color: [...GOLD] },
      script: async (ctx) => {
        await ctx.say(SPRING_TEXT.look);
        ctx.me('heal');
        await ctx.flash([255, 236, 170], 16, 150);
        ctx.heal();
        const s = spring.stand;
        ctx.setHealPoint(s.x, s.y, s.dir ?? 8);
        if (ctx.map?.def?.impossible) setAnchor(ctx, { map: ctx.map.id, x: s.x, y: s.y, dir: s.dir ?? 8 });
        await ctx.say(SPRING_TEXT.drink);
        if (!ctx.flag(F.spring(n))) {
          ctx.setFlag(F.spring(n));
          await ctx.say(SPRING_TEXT.mark);
        }
      },
    }],
  };
}

/**
 * Estela con una inscripción (dos eventos sobre la base de un pilar_placa_unown 2×2). `text` = línea, lista o función
 * del estado; `after(ctx)` = guion tras leerla (p. ej. revelar un verso).
 */
export function steleEvents(prefix, stele, text, after = null) {
  return [0, 1].map((dx) => {
    const ev = examine(`${prefix}_${dx}`, stele.x + dx, stele.y + 1, text);
    if (!after) return ev;
    const read = ev.script;
    return { ...ev, script: async (ctx) => { await read(ctx); await after(ctx); } };
  });
}

export { ARRIVE, EXIT_STAND, tramoId };
