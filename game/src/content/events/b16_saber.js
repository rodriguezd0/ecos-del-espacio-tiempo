// Ala del Saber — Uxie, el conocimiento (docs/CAMPANA.md B16; D17; reglas puras en b16_saber_logic.js):
//   1. «Lo que viste»: siete piedras con el glifo de la cámara de cada Pilar P1–P7 y siete relieves con lo que reparó
//      cada uno. Se coge un glifo de su pedestal y se ofrece a un relieve; si no es el suyo, vuelve a su pedestal.
//   2 y 3. «Lo que se deduce»: tres y luego cuatro puertas con inscripciones sobre lo vivido; solo una dice la verdad y
//      solo una puerta sigue adelante. Un error es el «olvido» de Uxie: la ronda vuelve a empezar (otras inscripciones).
//   4. Cámara de Uxie: la Hebra del Saber (KNOWLEDGETHREAD).
import { F, V, SPEAKER, SPRITE, OBJ, TRIO_COLORS, lines, examine, frame, placePlayer } from './b16_common.js';
import {
  GLYPHS, RELIEF_ORDER, offerGlyph, isPlaced, ALL_PLACED, roundVariant, roundExit, inscriptionText, roman,
  DOOR_RULES,
} from './b16_saber_logic.js';
import { SABER } from '../maps/b16/santuario_layout.js';

const G = SABER.glyphRoom;
const glyphName = (n) => `el glifo del ${GLYPHS[n - 1].name}`;

export const SABER_TEXT = Object.freeze({
  intro: 'Uxie habla sin boca, desde las paredes: «Siete piedras. Siete cosas que se arreglaron. Tú estuviste allí. ¿Lo recuerdas?»',
  diaryHint: 'Lo que has vivido está apuntado en la Libreta, en la pestaña «Diario».',
  plaque: 'Una placa: «Cada glifo junto a lo que su Pilar reparó. Un glifo equivocado vuelve a su piedra.»',
  pedestalEmpty: 'Un pedestal vacío.',
  take: (n) => `Coges la piedra con ${glyphName(n)}.`,
  swap: (a, n) => `Dejas ${glyphName(a)} en su pedestal y coges ${glyphName(n)}.`,
  reliefRead: (n) => `Un relieve: ${GLYPHS[n - 1].relief.charAt(0).toLowerCase()}${GLYPHS[n - 1].relief.slice(1)} Arriba, un hueco hexagonal vacío.`,
  reliefDone: (n) => `${GLYPHS[n - 1].relief} ${glyphName(n).charAt(0).toUpperCase()}${glyphName(n).slice(1)} brilla en su hueco.`,
  wrong: 'El relieve no acepta el glifo. La piedra se escurre de tus manos y vuelve sola a su pedestal.',
  right: 'El glifo encaja en el hueco del relieve y se enciende.',
  allPlaced: 'Los siete glifos brillan a la vez. Al fondo, el dintel se abre.',
  uxieAll: 'Lo recuerdas. Lo que viste sigue en ti. Ahora, deduce.',
  gateShut: 'Un velo dorado cierra el paso. Uxie espera a que coloques los glifos.',
  forgot: 'Uxie parpadea. Por un instante no recuerdas qué estabas haciendo… y la sala vuelve a estar como al principio.',
  forgotNote: 'Las inscripciones de las puertas han cambiado.',
  doorAsk: (i) => `¿Cruzar la puerta ${roman(i)}?`,
});

// ─────────────────────────────── Ronda 1: glifos ───────────────────────────────

async function checkAllPlaced(ctx) {
  if (ctx.var(V.placed, 0) !== ALL_PLACED || ctx.flag(F.glyphs)) return;
  ctx.se('PRSFX- Heal Bell');
  await ctx.flash([255, 238, 160], 20, 150);
  await ctx.say(SABER_TEXT.allPlaced);
  await ctx.say(SABER_TEXT.uxieAll, { speaker: SPEAKER.uxie });
  ctx.setFlag(F.glyphs);
}

function pedestalEvents() {
  return G.pedestals.map((p, i) => {
    const n = i + 1;
    const here = (s) => !isPlaced(s.var(V.placed, 0), n) && s.var(V.carried, 0) !== n;
    return {
      id: `pedestal_glifo_${n}`, x: p.x, y: p.y, name: 'Pedestal',
      pages: [
        { solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(SABER_TEXT.pedestalEmpty); } },
        {
          when: here, sprite: OBJ.glyph, ...frame(i), solid: true, trigger: 'action',
          script: async (ctx) => {
            const carried = ctx.var(V.carried, 0);
            ctx.se('GUI sel cursor');
            await ctx.say(carried ? SABER_TEXT.swap(carried, n) : SABER_TEXT.take(n));
            ctx.setVar(V.carried, n);
          },
        },
      ],
    };
  });
}

function reliefEvents() {
  return G.reliefs.map((r, i) => {
    const n = RELIEF_ORDER[i];
    return {
      id: `relieve_${n}`, x: r.x, y: r.y, name: 'Relieve',
      pages: [
        {
          sprite: OBJ.relief, ...frame(n - 1), solid: true, trigger: 'action',
          script: async (ctx) => {
            const carried = ctx.var(V.carried, 0);
            if (!carried) { await ctx.say(SABER_TEXT.reliefRead(n)); return; }
            if (!(await ctx.confirm(`¿Colocar ${glyphName(carried)} en este relieve?\n«${GLYPHS[n - 1].relief}»`))) return;
            const res = offerGlyph(ctx.var(V.placed, 0), carried, n);
            ctx.setVar(V.carried, 0);
            if (res.ok) {
              ctx.se('Mining item get');
              ctx.setVar(V.placed, res.mask);
              await ctx.say(SABER_TEXT.right);
              await checkAllPlaced(ctx);
            } else {
              ctx.se('buzzer');
              await ctx.say(SABER_TEXT.wrong);
            }
          },
        },
        {
          when: (s) => isPlaced(s.var(V.placed, 0), n), sprite: OBJ.relief, ...frame(n - 1 + 8), solid: true, trigger: 'action',
          glow: { name: 'softLight', radius: 34, intensity: 0.4, color: [...TRIO_COLORS.saber] },
          script: async (ctx) => { await ctx.say(SABER_TEXT.reliefDone(n)); },
        },
      ],
    };
  });
}

function glyphRoomEvents() {
  const intro = {
    id: 'saber_intro', x: G.entry.arrive.x, y: G.entry.arrive.y,
    pages: [{
      when: (s) => !s.flag('b16_saber_intro'), trigger: 'auto',
      script: async (ctx) => {
        ctx.setFlag('b16_saber_intro');
        await ctx.say(SABER_TEXT.intro);
        await ctx.say(SABER_TEXT.diaryHint);
      },
    }],
  };
  const gate = {
    id: 'saber_velo', x: G.gate.warp.x, y: G.gate.warp.y,
    pages: [{
      when: (s) => !s.flag(F.glyphs), trigger: 'touch',
      script: async (ctx) => { await ctx.say(SABER_TEXT.gateShut); },
    }],
  };
  return [
    intro, gate, ...pedestalEvents(), ...reliefEvents(),
    examine('saber_placa', G.uxiePlaque.x, G.uxiePlaque.y, SABER_TEXT.plaque),
    { id: 'celula_alma_1', type: 'zygardeCell', cell: 'cell_alma_1', x: SABER.cell.x, y: SABER.cell.y },
  ];
}

// ─────────────────────────────── Rondas 2 y 3: puertas ───────────────────────────────

/** El «olvido» de Uxie: la ronda vuelve a empezar con la variante siguiente (sin más castigo). */
async function forget(ctx, room, variantVar) {
  ctx.se('PRSFX- Psychic');
  await ctx.flash([255, 238, 160], 30, 230);
  ctx.setVar(variantVar, ctx.var(variantVar, 0) + 1);
  ctx.setVar(V.forgot, ctx.var(V.forgot, 0) + 1);
  await placePlayer(ctx, room.entry.arrive.x, room.entry.arrive.y, 8, { frames: 20 });
  await ctx.say(SABER_TEXT.forgot);
  await ctx.say(SABER_TEXT.forgotNote);
}

function doorEvents(key, doors, variantVar, next) {
  const room = SABER[key];
  const total = room.doors.length;
  return room.doors.map((d, i) => {
    const self = i + 1;
    return {
      id: `puerta_${total}_${self}`, x: d.x, y: d.y, name: `Puerta ${roman(self)}`,
      pages: [{
        sprite: OBJ.door, ...frame(i), solid: true, trigger: 'action',
        script: async (ctx) => {
          const round = roundVariant(doors, ctx.var(variantVar, 0));
          await ctx.say(`En la puerta ${roman(self)} hay una inscripción:\n${inscriptionText(round[i], self)}`);
          if (!(await ctx.confirm(SABER_TEXT.doorAsk(self)))) return;
          if (roundExit(round) !== self) { await forget(ctx, room, variantVar); return; }
          ctx.se('Door enter');
          await next(ctx);
        },
      }],
    };
  });
}

function steleEvents(key) {
  const st = SABER[key].stele;
  const read = async (ctx) => { for (const t of DOOR_RULES) await ctx.say(t); };
  return [0, 1].map((i) => ({ id: `estela_${key}_${i}`, x: st.x + i, y: st.y + 1, trigger: 'action', solid: true, noOver: true, script: read }));
}

async function toDoors4(ctx) {
  ctx.setFlag(F.doors3);
  await ctx.say('La puerta se abre sin ruido. Detrás, otra sala: cuatro puertas.');
  const a = SABER.doors4.entry.arrive;
  await ctx.warp(ctx.map.id, a.x, a.y, 8);
}

async function toUxie(ctx) {
  ctx.setFlag(F.doors4);
  await ctx.say('La puerta se abre. Al otro lado, una luz dorada que no hace sombra.');
  const a = SABER.uxie.entry.arrive;
  await ctx.warp(ctx.map.id, a.x, a.y, 8);
}

// ─────────────────────────────── Cámara de Uxie ───────────────────────────────

async function uxieScene(ctx) {
  if (ctx.flag(F.saber)) {
    await ctx.say('Lo que se sabe no se pierde. Solo se olvida un rato.', { speaker: SPEAKER.uxie });
    return;
  }
  ctx.cry('UXIE');
  await lines(ctx, SPEAKER.uxie, [
    'Recordaste lo que viste. Y dedujiste lo que no se dice.',
    'Saber no es tener la respuesta. Es no conformarse con la primera que suena bien.',
    'Toma. Es una parte de algo que atará lo que el tiempo y el espacio no retienen. Las otras dos las tienen mis hermanos.',
  ]);
  ctx.se('PRSFX- Heal Bell');
  await ctx.flash([...TRIO_COLORS.saber], 16, 160);
  await ctx.giveItem('KNOWLEDGETHREAD', 1);
  ctx.setFlag(F.saber); // Zygarde habla muy poco (autor, 25-09-2026).
}

function uxieEvents() {
  const U = SABER.uxie.uxie;
  return [{
    id: 'uxie', x: U.x, y: U.y, name: SPEAKER.uxie,
    pages: [{ sprite: SPRITE.uxie, dir: U.dir, move: 'still', stepAnime: true, solid: true, script: uxieScene }],
  }];
}

export function saberEvents() {
  return [
    ...glyphRoomEvents(),
    ...doorEvents('doors3', 3, V.variant3, toDoors4),
    ...steleEvents('doors3'),
    ...doorEvents('doors4', 4, V.variant4, toUxie),
    ...steleEvents('doors4'),
    ...uxieEvents(),
  ];
}

/** Warps del ala (se añaden a los del mapa): la puerta de los glifos y las escalinatas de vuelta al patio. */
export function saberWarps(patioFront) {
  const back = (s) => s.exits.map((e) => ({ x: e.x, y: e.y, dirTrigger: 2, to: 'santuario_alma', tx: patioFront.x, ty: patioFront.y, dir: 2 }));
  const a3 = SABER.doors3.entry.arrive;
  return [
    ...back(G.entry), ...back(SABER.doors3.entry), ...back(SABER.doors4.entry), ...back(SABER.uxie.entry),
    { x: G.gate.warp.x, y: G.gate.warp.y, to: 'santuario_alma', tx: a3.x, ty: a3.y, dir: 8 },
  ];
}
