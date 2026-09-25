// Tipos de evento de la tensión de ejes (registrados en world/eventTypes.js, aditivo B18; B20 los reutiliza). Genéricos:
// los textos por defecto son neutros y se sustituyen con propiedades del evento. Arte: game/assets/objects/eje_*.png
// (tools/b18_assets.mjs). Todos aceptan `axisVar` (por defecto AXIS_VAR) y `when(state, ev)` (condición extra).
//   axisCrystal  cristal de cambio (sólido): A → «¿hacia dónde tensas la Cadena?». { safe, requires = 'REDCHAIN',
//                blockedText, askText, tutorial: [líneas telepáticas la primera vez], tutorialFlag, onTense(ctx, modo) }
//   axisDebris   escombro sobre el vacío: cae en bucle; con el tiempo tensado queda en el aire y se pisa (patch de un
//                tile transparente y pasable en la capa 2). { passTile = AXIS_PASS_TILE, phase (fotograma inicial) }
//   axisCurrent  corriente: pisarla arrastra (salvo con el tiempo tensado: cristal pisable). { dir: 2|4|6|8, safe }
//   axisFold     marca violeta de un pliegue: con el espacio tensado, pisarla lleva a la otra marca. { to: { x, y } }
import { AXIS_VAR, AXIS_TIME, AXIS_SPACE, axisMode, isFrozen, foldsOpen } from './logic.js';
import { tenseChain, rideCurrent, crossFold } from './actions.js';

/** Tile transparente, pasable y de prioridad 0 que se usa como «suelo invisible» bajo los escombros congelados. Es el
 *  385 de InteriorLiga (8) e InteriorTorre (11); en otro tileset se pasa `passTile`. */
export const AXIS_PASS_TILE = 385;

export const AXIS_ART = Object.freeze({
  crystal: 'asset:objects/eje_cristal.png', // 32×64 · fila 2 sin tensar · 4 tiempo · 6 espacio (brillo animado)
  debris: 'asset:objects/eje_escombro.png', // 32×32 · fila 2 cae al abismo (bucle de 4) · 4 detenido en el aire
  current: 'asset:objects/eje_corriente.png', // 32×32 · filas 2/4/6/8 = sentido del agua de luz (animada)
  currentFrozen: 'asset:objects/eje_corriente_cristal.png', // 32×32 · filas 2/4/6/8: cristal pisable (destello lento)
  fold: 'asset:objects/eje_pliegue.png', // 32×32 · fila 2 cerrado · 4 abierto (remolino violeta)
});

export const AXIS_EVENT_TEXT = Object.freeze({
  crystal: 'Un cristal de cambio. Late con dos luces: una azul y fría, otra violeta y cálida.',
  blocked: 'El cristal vibra, pero no tienes nada con lo que tirar de él.',
  ask: '¿Hacia dónde tensas la Cadena Roja?',
  now: { time: 'La Cadena está tensada hacia Dialga (el tiempo).', space: 'La Cadena está tensada hacia Palkia (el espacio).' },
  options: Object.freeze(['Hacia Dialga (tiempo)', 'Hacia Palkia (espacio)', 'Dejarla así']),
});

const extraWhen = (d) => (typeof d.when === 'function' ? d.when : () => true);
const modeOf = (d) => (s) => axisMode(s, d.axisVar || AXIS_VAR);

export const AXIS_EVENT_TYPES = {
  axisCrystal(d) {
    const extra = extraWhen(d);
    const mode = modeOf(d);
    const script = async (ctx) => {
      const requires = d.requires === undefined ? 'REDCHAIN' : d.requires;
      if (requires && !ctx.state.hasKeyItem?.(requires) && !ctx.state.hasItem?.(requires)) {
        await ctx.say(d.blockedText ?? AXIS_EVENT_TEXT.blocked);
        return;
      }
      if (Array.isArray(d.tutorial) && d.tutorialFlag && !ctx.flag(d.tutorialFlag)) {
        for (const line of d.tutorial) await ctx.say(line, { telepathy: true });
        ctx.setFlag(d.tutorialFlag);
      }
      const now = mode(ctx.state);
      const message = now ? `${AXIS_EVENT_TEXT.now[now]} ${d.askText ?? AXIS_EVENT_TEXT.ask}` : (d.askText ?? AXIS_EVENT_TEXT.ask);
      const i = await ctx.choice([...AXIS_EVENT_TEXT.options], { message, cancel: 2 });
      const want = i === 0 ? AXIS_TIME : i === 1 ? AXIS_SPACE : null;
      if (!want || want === now) return;
      await tenseChain(ctx, want, { axisVar: d.axisVar || AXIS_VAR, safe: d.safe || null });
      if (typeof d.onTense === 'function') await d.onTense(ctx, want);
    };
    const page = (dir, when) => ({
      when: (s, ev) => extra(s, ev) && when(s), sprite: d.sprite ?? AXIS_ART.crystal, dir, directionFix: true, walkAnime: false,
      stepAnime: true, speed: 2, solid: true, trigger: 'action', noOver: true, script,
      light: { radius: 44, intensity: 0.7 },
    });
    return {
      ...d, axisKind: 'crystal', when: undefined, name: d.name ?? 'Cristal de cambio',
      pages: [
        page(2, (s) => !mode(s)),
        page(4, (s) => mode(s) === AXIS_TIME),
        page(6, (s) => mode(s) === AXIS_SPACE),
      ],
    };
  },

  axisDebris(d) {
    const extra = extraWhen(d);
    const mode = modeOf(d);
    const pass = d.passTile ?? AXIS_PASS_TILE;
    const base = { sprite: d.sprite ?? AXIS_ART.debris, through: true, directionFix: true, walkAnime: false, pattern: (d.phase ?? 0) % 4 };
    return {
      ...d, axisKind: 'debris', when: undefined, name: d.name ?? 'Escombro',
      pages: [
        { ...base, when: (s, ev) => extra(s, ev) && !isFrozen(mode(s)), dir: 2, stepAnime: true, speed: 4, patch: [[d.x, d.y, 2, 0]] },
        { ...base, when: (s, ev) => extra(s, ev) && isFrozen(mode(s)), dir: 4, stepAnime: true, speed: 1, patch: [[d.x, d.y, 2, pass]] },
      ],
    };
  },

  axisCurrent(d) {
    if (![2, 4, 6, 8].includes(d.dir)) throw new Error(`axisCurrent ${d.id}: falta "dir" (2, 4, 6 u 8)`);
    const extra = extraWhen(d);
    const mode = modeOf(d);
    const base = { through: true, directionFix: true, walkAnime: false, dir: d.dir };
    return {
      ...d, axisKind: 'current', when: undefined, name: d.name ?? 'Corriente',
      pages: [
        {
          ...base, when: (s, ev) => extra(s, ev) && !isFrozen(mode(s)), sprite: d.sprite ?? AXIS_ART.current, stepAnime: true, speed: 4,
          trigger: 'touch', lock: false, script: (ctx) => rideCurrent(ctx, { axisVar: d.axisVar || AXIS_VAR, safe: d.safe || null }),
        },
        { ...base, when: (s, ev) => extra(s, ev) && isFrozen(mode(s)), sprite: d.frozenSprite ?? AXIS_ART.currentFrozen, stepAnime: true, speed: 1 },
      ],
    };
  },

  axisFold(d) {
    if (!d.to || !Number.isInteger(d.to.x) || !Number.isInteger(d.to.y)) throw new Error(`axisFold ${d.id}: falta "to" ({ x, y })`);
    const extra = extraWhen(d);
    const mode = modeOf(d);
    const base = { sprite: d.sprite ?? AXIS_ART.fold, through: true, directionFix: true, walkAnime: false, stepAnime: true };
    return {
      ...d, axisKind: 'fold', when: undefined, name: d.name ?? 'Pliegue',
      pages: [
        { ...base, when: (s, ev) => extra(s, ev) && !foldsOpen(mode(s)), dir: 2, speed: 1 },
        {
          ...base, when: (s, ev) => extra(s, ev) && foldsOpen(mode(s)), dir: 4, speed: 4, trigger: 'touch', lock: false,
          light: { radius: 40, intensity: 0.8 }, script: (ctx) => crossFold(ctx, d.to),
        },
      ],
    };
  },
};
