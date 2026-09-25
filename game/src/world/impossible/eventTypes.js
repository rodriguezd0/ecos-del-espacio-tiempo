// Tipos de evento del espacio imposible (registrados en world/eventTypes.js, aditivo). Genéricos: los textos por
// defecto son neutros y se sustituyen con propiedades del evento. Arte en game/assets/objects (tools/b12_assets.mjs).
//   ancla             poste de piedra: al tocarlo (empujar o A) fija el punto seguro. { text, firstFlag, sprite }
//   arista            veta violeta: pisarla gira la pantalla 90° y carga el gemelo. { twin, turn: 1 | -1 }
//   puenteMirada      losa que solo existe mientras se mira (la visibilidad la lleva world/impossible/field.js)
//   cascadaInvertida  base de un ascensor de agua de un solo sentido. { top: [x, y], open(state), closedText }
//   pulsador          losa que se hunde al pisarla y abre algo. { flag, text }
import { ANCHOR_VAR, decodeAnchor } from './logic.js';
import { touchAnchor, turnToTwin, rideInvertedFall } from './actions.js';

export const IMPOSSIBLE_ART = Object.freeze({
  anchor: 'asset:objects/ancla_poste.png', // fila 2 apagado · 4 activo (brillo con stepAnime)
  vein: 'asset:objects/arista_veta.png', // fila 2 veta que late
  bridge: 'asset:objects/puente_mirada.png', // fila 2 losa espectral
  fall: 'asset:objects/cascada_invertida.png', // fila 2 agua que sube · 4 boca cerrada · 6 boca abierta · 8 cima
  button: 'asset:objects/pulsador_losa.png', // fila 2 alzado · 4 hundido
});

const T = {
  anchor: 'Un poste de piedra con un anillo tallado. Al tocarlo, el aire a su alrededor se queda quieto.',
  anchorAgain: 'El poste sigue tibio. Este es el punto seguro.',
  fallClosed: 'Una boca de piedra cerrada con una losa. Detrás se oye agua que corre hacia arriba.',
  button: 'La losa se hunde con un chasquido. Algo se ha abierto a lo lejos.',
  buttonDone: 'La losa ya está hundida.',
};

/** ¿Es esta Ancla la última tocada? (la casilla guardada es la del jugador, junto al poste) */
export function isCurrentAnchor(state, ev) {
  const a = decodeAnchor(state?.var?.(ANCHOR_VAR, null));
  if (!a || !ev?.map) return false;
  return a.map === ev.map.id && Math.abs(a.x - ev.x) + Math.abs(a.y - ev.y) <= 1;
}

const extraWhen = (d) => (typeof d.when === 'function' ? d.when : null);

export const IMPOSSIBLE_EVENT_TYPES = {
  ancla(d) {
    const extra = extraWhen(d);
    const script = (ctx) => touchAnchor(ctx, { text: d.text ?? T.anchor, againText: d.againText ?? null, firstFlag: d.firstFlag ?? null, onTouch: d.onTouch });
    const base = { sprite: d.sprite ?? IMPOSSIBLE_ART.anchor, directionFix: true, walkAnime: false, solid: true, trigger: 'touch', script, name: d.name ?? 'Ancla' };
    return {
      ...d,
      when: undefined,
      pages: [
        { ...base, when: (s, ev) => !extra || Boolean(extra(s, ev)), dir: 2, stepAnime: false },
        { ...base, when: (s, ev) => (!extra || Boolean(extra(s, ev))) && isCurrentAnchor(s, ev), dir: 4, stepAnime: true, light: { radius: 60, intensity: 0.8 } },
      ],
    };
  },

  arista(d) {
    if (!d.twin) throw new Error(`arista ${d.id}: falta "twin" (mapa gemelo)`);
    return {
      ...d,
      sprite: d.sprite ?? IMPOSSIBLE_ART.vein,
      dir: 2,
      directionFix: true,
      stepAnime: true,
      walkAnime: false,
      through: true,
      shadow: false,
      trigger: 'touch',
      glow: d.glow ?? { name: 'softLight', radius: 44, intensity: 0.45, pulse: 0.6, color: [190, 120, 255] },
      script: d.script || ((ctx) => turnToTwin(ctx, { twin: d.twin, turn: d.turn ?? 1 })),
    };
  },

  puenteMirada(d) {
    return {
      ...d,
      sprite: d.sprite ?? IMPOSSIBLE_ART.bridge,
      dir: 2,
      directionFix: true,
      stepAnime: true,
      walkAnime: false,
      through: true,
      shadow: false,
      opacity: 0,
      gazeBridge: true,
    };
  },

  cascadaInvertida(d) {
    if (!Array.isArray(d.top)) throw new Error(`cascadaInvertida ${d.id}: falta "top" [x, y]`);
    const open = typeof d.open === 'function' ? d.open : () => true;
    const top = { x: d.top[0], y: d.top[1] };
    return {
      ...d,
      pages: [
        {
          sprite: d.sprite ?? IMPOSSIBLE_ART.fall, dir: 4, directionFix: true, walkAnime: false, solid: true, trigger: 'touch', noOver: true,
          script: async (ctx) => { await ctx.say(d.closedText ?? T.fallClosed); },
        },
        {
          when: (s, ev) => Boolean(open(s, ev)),
          sprite: d.sprite ?? IMPOSSIBLE_ART.fall, dir: 6, directionFix: true, walkAnime: false, stepAnime: true, through: true, trigger: 'touch',
          glow: { name: 'softLight', radius: 52, intensity: 0.5, pulse: 0.5, color: [150, 200, 255] },
          script: d.script || (async (ctx) => {
            await rideInvertedFall(ctx, { top });
            if (typeof d.onArrive === 'function') await d.onArrive(ctx);
          }),
        },
      ],
    };
  },

  pulsador(d) {
    if (!d.flag) throw new Error(`pulsador ${d.id}: falta "flag"`);
    const sprite = d.sprite ?? IMPOSSIBLE_ART.button;
    return {
      ...d,
      pages: [
        {
          sprite, dir: 2, directionFix: true, walkAnime: false, through: true, trigger: 'touch', shadow: false,
          script: async (ctx) => {
            ctx.se?.('Battle catch click', { volume: 80 });
            ctx.setFlag(d.flag);
            await ctx.shake?.(3, 6, 14);
            ctx.se?.('Door slide', { volume: 70 });
            if (d.text !== null) await ctx.say(d.text ?? T.button);
            if (typeof d.onPress === 'function') await d.onPress(ctx);
          },
        },
        {
          when: (s) => Boolean(s?.flag(d.flag)),
          sprite, dir: 4, directionFix: true, walkAnime: false, through: true, shadow: false, trigger: 'action',
          script: async (ctx) => { await ctx.say(d.doneText ?? T.buttonDone); },
        },
      ],
    };
  },
};
