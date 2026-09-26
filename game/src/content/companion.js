// El Core de Zygarde como acompañante de campo (D06): sigue al jugador en el mapa, fuera del equipo.
// Gráfico según la forma (state.data.zygarde.form). DECIDIDO (autor, 25-09-2026): Zygarde es un legendario serio e
// imponente, no una mascota parlanchina: al hablarle no charla (sin frases de ambiente, pistas ni cariño) y al
// recoger una célula no reacciona ni da las gracias.

/**
 * Sprite de campo por forma: Core (arte propio) y seguidores de Añil para 10 % (Followers/ZYGARDE_1.png) y
 * 50 % (Followers/ZYGARDE.png). [PROVISIONAL D30] La Forma Completa no tiene seguidor en Añil: usa el del 50 %.
 */
const FORM_SPRITES = Object.freeze({
  core: 'zygarde_core',
  10: 'follower:ZYGARDE:1:0',
  50: 'follower:ZYGARDE:0:0',
  complete: 'follower:ZYGARDE:0:0',
});

/** Clave de gráfico del compañero para una forma de Zygarde ('' si no acompaña). */
export function coreSpriteKey(form) {
  if (!form) return '';
  return FORM_SPRITES[form] || FORM_SPRITES.core;
}

/** ¿Acompaña el Core al jugador con este estado? */
export function coreFollows(state) {
  return Boolean(state?.data?.zygarde?.form);
}

/**
 * Narración (no telepatía) al hablar con el compañero: se gira y no dice nada. Pura, para tests.
 * form = state.data.zygarde.form ('core' | '10' | '50' | 'complete').
 */
export function coreSilenceLine(form) {
  return !form || form === 'core' ? 'El Core te mira un instante. No dice nada.' : 'Zygarde te mira un instante. No dice nada.';
}

/**
 * Hablar con el Core/Zygarde fuera de un hito: se gira hacia el jugador en silencio. El recordatorio canónico
 * «Me faltan N partes» (hito esperando células) lo dice antes world/zygarde/field.js#zygardeTalk.
 */
export async function coreTalk(ctx, core) {
  core.turnToward(ctx.player);
  await ctx.say(coreSilenceLine(ctx.state?.data?.zygarde?.form));
}
