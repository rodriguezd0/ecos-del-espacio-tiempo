// Envoltorio aditivo: no cambia presencia, coordenadas ni condiciones de los Guardianes.
import { LEGENDS, isPostgame } from './b22b_common.js';
const delivered = new WeakMap();
export const GUARDIAN_HINTS = Object.freeze({
  abril: Object.freeze({ tornadus: 'En la Meseta hay una columna de vendaval que se mueve entre las aspas. Súbete a Zygarde y alcánzala: a pie se te escapa.', zapdos: 'En la sala de turbinas del Parque ha crecido una cáscara de fulgurita. Un Pokémon de tu equipo debe usar un movimiento de Roca o Hielo para romperla.' }),
  fermin: Object.freeze({ thundurus: 'En las Dunas caen rayos sin una gota de lluvia. Sigue las tres marcas de descarga, desde el oeste hacia el Cerro. La última señala a Thundurus.' }),
  rosendo: Object.freeze({ articuno: 'Al fondo de la Gruta Escarcha se ha abierto el paso al lago interior. Hay un capullo de hielo. Llévate un Pokémon que conozca un movimiento de Fuego para fundirlo.' }),
  brasa: Object.freeze({ moltres: 'La costra del cráter frío encierra un latido de fuego. Enfríala de golpe con un movimiento de Agua de tu equipo: el basalto cede por choque térmico.' }),
});
export async function giveHint(ctx, guardian) {
  if (!isPostgame(ctx.state)) return false;
  const hints = GUARDIAN_HINTS[guardian];
  if (!hints) return false;
  delivered.set(ctx,(delivered.get(ctx)||0)+1);
  for (const [key, text] of Object.entries(hints)) {
    if (ctx.state.flag(LEGENDS[key].caught)) continue;
    await ctx.say(text, { speaker: { abril: 'Abril', fermin: 'Fermín', rosendo: 'Rosendo', brasa: 'Maestra Brasa' }[guardian] });
    ctx.setFlag(LEGENDS[key].hint);
  }
  return true;
}
function guardianOf(id) {
  return /^(?:b22d_)?(abril|fermin|rosendo|brasa)(?:_|$)/.exec(id)?.[1] || null;
}
export function withB22bHints(events) {
  return events.map((ev) => {
    const guardian = guardianOf(ev.id);
    if (!guardian) return ev;
    const wrap = (page) => typeof page.script !== 'function' ? page : { ...page, script: async (ctx) => {
      const keys = Object.keys(GUARDIAN_HINTS[guardian]);
      const before = keys.map((key) => ctx.state.flag(LEGENDS[key].hint));
      const count = delivered.get(ctx)||0;
      await page.script(ctx);
      // Otra escena puede haber dado la misma pista mientras se ejecutaba (avisos de B22d).
      if ((delivered.get(ctx)||0) === count && !keys.some((key, i) => !before[i] && ctx.state.flag(LEGENDS[key].hint))) await giveHint(ctx, guardian);
    } };
    return ev.pages ? { ...ev, pages: ev.pages.map(wrap) } : wrap(ev);
  });
}
