// Lía entrega el Repartir Exp (EXPSHARE) de parte de Alerce en el Centro Pokémon de Villa Zaguán (docs/CAMPANA.md
// B03 punto 2; POKEDEX_DISTRIBUCION §7.1 «Repartir Exp desde B03 (desactivable)»). Es el Repartir Exp moderno
// (gen 6+, objeto clave de items_axis.json): activado desde la Mochila, los Pokémon del equipo que no combaten
// reciben el 50 % de la experiencia (ui/logic/expShare.js; ver README de b03).
// Aparece tras el P1 y espera hasta que se recoge (CAMPANA §2.6). zaguan_centro (B02) añade liaCentroEvents().
import { F, SPEAKER, SPRITE, say } from './b03_common.js';

/** Casilla de Lía en el Centro estándar (services/pokecenter.js CENTER_LAYOUT: junto al revistero). */
export const LIA_SPOT = Object.freeze({ x: 4, y: 7, dir: 2 });

export async function liaGift(ctx) {
  const L = SPEAKER.lia;
  await say(ctx, L, '¡\\PN! Por fin. Llevo toda la mañana vigilando la puerta.');
  await say(ctx, L, 'El profesor Alerce me ha pedido que te trajera esto. Dice que el camino hasta Caudal es largo.');
  await ctx.giveItem('EXPSHARE');
  ctx.setFlag(F.lia);
  await say(ctx, L, 'Es un Repartir Exp. Mientras esté activado, los Pokémon de tu equipo que no salgan a luchar se quedan con la mitad de la experiencia de cada combate.');
  await say(ctx, L, 'Si prefieres que no reparta, puedes desactivarlo desde la Mochila. Tú decides.');
  await say(ctx, L, 'Gael pasó por aquí hace un rato. No quiso esperar a que le diera nada. Iba hacia el sur, hacia Caudal.');
  await say(ctx, L, 'Yo vuelvo al laboratorio. ¡Suerte!');
  const lia = ctx.world?.events?.find((e) => e.id === 'lia');
  if (lia) {
    await ctx.move('lia', ['down', 'down', 'down', 'right', 'right', 'right', 'right', 'down', 'down'], { speed: 4 });
    ctx.se('door_exit');
    ctx.erase('lia');
  }
}

/** Eventos para zaguan_centro (plantilla pokemonCenterMap: opción `events`). */
export function liaCentroEvents(spot = LIA_SPOT) {
  return [{
    id: 'lia', x: spot.x, y: spot.y, sprite: SPRITE.lia, dir: spot.dir, move: 'still', trigger: 'action',
    when: (s) => Boolean(s?.flag(F.p1)) && !s.flag(F.lia),
    script: liaGift,
  }];
}
