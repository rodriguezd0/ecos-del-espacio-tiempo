// Tipos de evento genéricos (atajos de contenido) que se expanden a páginas con guion.
// Sin contenido narrativo: los textos son genéricos y sustituibles con las propiedades del evento.
//   sign, item, trainer            → mundo básico
//   ramRock, roughTerrain, climbWall, diveSpot, rebuildGap, zygardeCell → hooks de campo de Zygarde
//   (versiones completas en world/zygarde/eventTypes.js, que además añade gravelSlope, diveVent y
//   diveCurrent y SUSTITUYE a las de aquí: ver el final de EXPANDERS).
// Los guiones reciben `ctx` (script/context.js).
import { ZYGARDE_EVENT_TYPES } from './zygarde/eventTypes.js';
import { IMPOSSIBLE_EVENT_TYPES } from './impossible/eventTypes.js'; // B12: anclas, aristas, puentes, cascadas invertidas

const notA = (_s, ev) => !ev.selfSwitch('A');
const isA = (_s, ev) => ev.selfSwitch('A');

const T = {
  ramBlocked: 'Una roca agrietada bloquea el paso.',
  ramAsk: '¿Quieres que Zygarde embista la roca?',
  roughBlocked: 'El terreno es demasiado irregular para avanzar.',
  climbBlocked: 'Una pared escarpada. Parece que podría escalarse.',
  climbAsk: '¿Quieres trepar?',
  diveBlocked: 'El agua es muy profunda aquí.',
  diveAsk: '¿Quieres sumergirte?',
  rebuildBlocked: 'Falta un tramo del camino.',
  rebuildAsk: '¿Quieres que Zygarde reconstruya el camino?',
  cellFound: '¡Has encontrado una Célula de Zygarde!',
};

export function expandEventDef(raw, _mapDef) {
  if (!raw || !raw.type) return raw;
  const fn = EXPANDERS[raw.type];
  if (!fn) throw new Error(`Tipo de evento desconocido: "${raw.type}" (evento ${raw.id ?? '?'})`);
  return fn(raw);
}

const EXPANDERS = {
  sign(d) {
    const text = d.text ?? '…';
    return {
      ...d, solid: d.solid ?? true, trigger: 'action', noOver: true,
      // 'sign' no existe en Graphics/Windowskins de Añil (404): marco de cartel real, sustituible con d.skin.
      script: d.script || (async (ctx) => { await ctx.say(text, { skin: d.skin ?? 'signskin' }); }),
    };
  },

  item(d) {
    if (!d.item) throw new Error(`Evento item ${d.id}: falta "item"`);
    const count = d.count ?? 1;
    const extra = typeof d.when === 'function' ? d.when : null; // condición extra de aparición (aditivo B12)
    const page = {
      when: (s, ev) => notA(s, ev) && (!extra || Boolean(extra(s, ev))),
      sprite: d.hidden ? '' : (d.sprite ?? 'Object ball'),
      trigger: 'action',
      noOver: true,
      solid: !d.hidden,
      script: async (ctx) => {
        await ctx.giveItem(d.item, count, { found: true });
        ctx.setSelfSwitch('A', true);
      },
    };
    return { ...d, pages: [page] };
  },

  trainer(d) {
    const sight = d.sight ?? 4;
    const battlePage = {
      when: notA,
      sprite: d.sprite,
      dir: d.dir,
      move: d.move,
      trigger: 'eventTouch',
      sight,
      script: async (ctx) => {
        const ev = ctx.event;
        if (d.eyeBgm) ctx.bgm(d.eyeBgm);
        await ctx.emote(ev, '!');
        await ctx.approach(ev);
        ctx.turnToPlayer(ev);
        ctx.face('player', ctx.directionTo(ctx.player, ev));
        if (d.intro) await ctx.say(d.intro, { speaker: d.name });
        const outcome = await ctx.battle({
          type: 'trainer',
          trainer: d.trainer || null,
          opponent: { name: d.name, trainerType: d.trainerType, party: d.party, ...(d.opponent || {}) },
          endSpeech: d.defeat,
          ...(d.battle || {}),
        });
        if (outcome === 'win') ctx.setSelfSwitch('A', true);
      },
    };
    const afterPage = {
      when: isA,
      sprite: d.sprite,
      dir: d.dir,
      move: d.move,
      trigger: 'action',
      script: async (ctx) => {
        // `after` puede depender del estado (B12: la Médium del Neblino tras el P6).
        const text = typeof d.after === 'function' ? d.after(ctx.state) : d.after;
        if (text) await ctx.say(text, { speaker: d.name });
      },
    };
    return { ...d, sight: undefined, pages: [battlePage, afterPage] };
  },

  // ---- Zygarde: Embestida (rocas frágiles)
  ramRock(d) {
    return {
      ...d,
      pages: [{
        when: notA,
        sprite: d.sprite ?? 'Object rock',
        trigger: 'action',
        script: async (ctx) => {
          if (!ctx.zygarde('ram')) { await ctx.say(d.blockedText ?? T.ramBlocked); return; }
          if ((await ctx.choice(['Sí', 'No'], { message: d.askText ?? T.ramAsk, cancel: 1 })) !== 0) return;
          ctx.se('Rock Smash');
          await ctx.shake(6, 8, 18);
          ctx.setSelfSwitch('A', true);
        },
      }],
    };
  },

  // ---- Zygarde: Terreno complicado (barro, arena profunda, nieve, vegetación densa)
  roughTerrain(d) {
    return {
      ...d,
      pages: [{
        when: (s) => !s?.zygardeAbility('terrain'),
        solid: true,
        trigger: 'action',
        noOver: true,
        script: async (ctx) => { await ctx.say(d.blockedText ?? T.roughBlocked); },
      }],
    };
  },

  // ---- Zygarde: Trepar (paredes/raíces señaladas). `to: [x, y]` destino.
  climbWall(d) {
    if (!d.to) throw new Error(`climbWall ${d.id}: falta "to"`);
    return {
      ...d,
      solid: true,
      trigger: 'action',
      noOver: true,
      script: async (ctx) => {
        if (!ctx.zygarde('climb')) { await ctx.say(d.blockedText ?? T.climbBlocked); return; }
        if ((await ctx.choice(['Sí', 'No'], { message: d.askText ?? T.climbAsk, cancel: 1 })) !== 0) return;
        ctx.se('Rock Climb EX');
        await ctx.movePlayerTo(d.to[0], d.to[1], { through: true, speed: 2.5 });
      },
    };
  },

  // ---- Zygarde: Buceo (casilla de agua profunda)
  diveSpot(d) {
    if (!d.to) throw new Error(`diveSpot ${d.id}: falta "to"`);
    return {
      ...d,
      through: true,
      trigger: 'action',
      script: async (ctx) => {
        if (!ctx.player.surfing) return;
        if (!ctx.zygarde('dive')) { await ctx.say(d.blockedText ?? T.diveBlocked); return; }
        if ((await ctx.choice(['Sí', 'No'], { message: d.askText ?? T.diveAsk, cancel: 1 })) !== 0) return;
        ctx.se('PRSFX- Dive1');
        await ctx.warp(d.to, d.tx, d.ty, d.dir ?? 2);
      },
    };
  },

  // ---- Zygarde: Reconstrucción del terreno. `tiles: [[x,y,capa,id], …]` que aparecen (y persisten).
  rebuildGap(d) {
    if (!Array.isArray(d.tiles)) throw new Error(`rebuildGap ${d.id}: falta "tiles"`);
    return {
      ...d,
      pages: [
        {
          when: notA,
          solid: true,
          noOver: true,
          trigger: 'action',
          script: async (ctx) => {
            if (!ctx.zygarde('rebuild')) { await ctx.say(d.blockedText ?? T.rebuildBlocked); return; }
            if ((await ctx.choice(['Sí', 'No'], { message: d.askText ?? T.rebuildAsk, cancel: 1 })) !== 0) return;
            const fx = ctx.effect('zygardeRebuild', { tiles: d.tiles });
            ctx.se('PRSFX- Rock Wrecker');
            await ctx.shake(4, 6, 40);
            for (const t of d.tiles) { ctx.setTile(...t); await ctx.wait(4); }
            fx?.remove?.(30);
            ctx.setSelfSwitch('A', true);
          },
        },
        { when: isA, through: true, patch: d.tiles },
      ],
    };
  },

  // ---- Zygarde: Célula en el suelo (brillo verde hexagonal). La colocación real está PENDIENTE (D10).
  // `text` puede ser una función (state) => texto (p. ej. con el recuento) y `onFound` un guion posterior
  // (p. ej. la reacción del Core). `when(state, ev)` opcional: condición extra de aparición (célula que
  // aparece tras un hito de historia).
  zygardeCell(d) {
    if (!d.cell) throw new Error(`zygardeCell ${d.id}: falta "cell"`);
    const extra = typeof d.when === 'function' ? d.when : null;
    return {
      ...d,
      pages: [{
        when: (s, ev) => !s?.hasCell(d.cell) && (!extra || Boolean(extra(s, ev))),
        glow: 'zygardeCell',
        through: true,
        trigger: 'touch',
        script: async (ctx) => {
          ctx.state.addCell(d.cell);
          ctx.se('Mining item get');
          ctx.requestRefresh();
          const text = typeof d.text === 'function' ? d.text(ctx.state) : (d.text ?? T.cellFound);
          await ctx.say(text);
          if (typeof d.onFound === 'function') await d.onFound(ctx);
        },
      }],
    };
  },

  // Sistema de campo de Zygarde (agente zygarde): sustituye a los tipos básicos anteriores y añade los nuevos.
  ...ZYGARDE_EVENT_TYPES,
  // Espacio imposible (B12, world/impossible/): ancla, arista, puenteMirada, cascadaInvertida, pulsador.
  ...IMPOSSIBLE_EVENT_TYPES,
};

export const EVENT_TYPES = Object.keys(EXPANDERS);
