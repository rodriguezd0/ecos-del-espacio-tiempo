// El Core de Zygarde como acompañante de campo (D06): sigue al jugador en el mapa, fuera del equipo.
// Gráfico según la forma (state.data.zygarde.form) y frases telepáticas breves y contextuales al hablarle.
// Voz: sobria y telepática (docs/bloques/B01_apertura.md). Nada de explicar la profecía (D02b).

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

// Frases por contexto. Se elige la primera regla que se cumple; dentro de ella, una al azar.
const RULES = [
  {
    when: ({ mapId }) => mapId === 'laberinto_profundidad',
    lines: ['Aquí me escondí. Las piedras me dejaron descansar.'],
  },
  {
    when: ({ mapId, flag }) => mapId === 'laboratorio_alerce' && !flag('b01_dex_received'),
    lines: ['Este humano sabe qué soy.', '…'],
  },
  {
    when: ({ mapId, cellsLeftHere }) => mapId === 'ruta_1' && cellsLeftHere > 0,
    lines: ['Hay partes de mí cerca. Las noto.', 'Por aquí. Algo mío late bajo la hierba.'],
  },
  {
    when: ({ mapId }) => mapId === 'ruta_1',
    lines: ['Al sur. Algo antiguo se ha movido.', 'Sigue. Te sigo.'],
  },
  {
    when: ({ mapId }) => mapId === 'casa_prota_1f' || mapId === 'casa_prota_2f',
    lines: ['Descansa. Yo escucho.', 'Tu casa es tranquila.'],
  },
  // B02 — Pilar del Umbral
  {
    when: ({ mapId, flag }) => mapId === 'ruinas_dintel' && !flag('p1_restored'),
    lines: ['Estas piedras me conocen.', 'Más adentro. Algo mío espera.'],
  },
  {
    when: ({ mapId, flag }) => (mapId === 'villa_zaguan' || mapId === 'explanada_umbral') && !flag('p1_restored'),
    lines: ['Al oeste. Las piedras antiguas llaman.', 'Hay algo viejo cerca. Lo noto.'],
  },
  {
    when: () => true,
    lines: ['Sigo aquí.', 'Te escucho.', 'Estoy contigo.'],
  },
];

/** Células del mapa actual aún sin recoger (eventos de tipo zygardeCell). */
function cellsLeftOnMap(ctx) {
  const defs = ctx.world?.current?.def?.events || [];
  return defs.filter((e) => e.type === 'zygardeCell' && !ctx.state.hasCell(e.cell)).length;
}

/** Frase contextual (pura, para tests): info = { mapId, flag(k), cellsLeftHere }, rng. */
export function coreLine(info, rng = Math.random) {
  const rule = RULES.find((r) => r.when(info)) || RULES[RULES.length - 1];
  return rule.lines[Math.floor(rng() * rule.lines.length) % rule.lines.length];
}

/** Hablar con el Core: se gira, late un instante (brillo) y dice una línea telepática breve. */
export async function coreTalk(ctx, core) {
  core.turnToward(ctx.player);
  ctx.se('core_signal', { volume: 45 });
  await ctx.flash([185, 255, 102], 10, 50);
  const line = coreLine({
    mapId: ctx.world?.map?.id,
    flag: (k) => ctx.flag(k),
    cellsLeftHere: cellsLeftOnMap(ctx),
  });
  await ctx.say(line, { telepathy: true });
}

/** Reacción del Core al recoger una célula (B01 §4.8). */
export async function coreCellReaction(ctx) {
  if (!coreFollows(ctx.state)) return;
  const core = ctx.world?.core;
  if (core?.visible) {
    core.turnToward(ctx.player);
    await ctx.emote(core, '!');
  }
  await ctx.say('Una parte de mí. Gracias.', { telepathy: true });
}
