// Taller del Rey (docs/TABLILLAS.md T15): la última Tablilla «donde el rey trabajó». Piezas del taller que se examinan
// (la cama de piedra, el banco, los sillares hexagonales, la losa con el puente grabado y cientos de rayas), la Tabla
// Draco en su hornacina (API de historia: giveTablet → Crónica XV y cierre de la pista T15), la reacción de Casandra,
// la Salamencita y el cambio en el mundo: se apaga el Resonador y parte de los Peregrinos se queda a cuidar la
// Calzada. Módulo puro salvo los guiones.
import { F, SPEAKER, SPRITE, OBJ, when, lines, zygardeSays, pause } from './b19_common.js';
import { chronicleFor } from '../story/chronicle.js';
import { NICHE, PIECES, CASANDRA } from '../maps/b19/taller_layout.js';

export const TALLER_TEXT = Object.freeze({
  enter: 'Una sala excavada en la roca de la Peña. El aire huele a polvo de piedra muy viejo.',
  enterZygarde: 'Aquí trabajó alguien durante mucho tiempo.',
  look: Object.freeze({
    cama: 'Una cama tallada en la roca, con una manta que el tiempo ha vuelto de piedra. Es estrecha y dura.',
    banco: 'Un banco de piedra lleno de cinceles gastados hasta el mango. Alguien los usó durante años.',
    sillares: 'Sillares hexagonales a medio tallar: las mismas losas de la Calzada, preparadas para sustituir a las rotas.',
    losa: 'Una losa con un puente grabado. Debajo, cientos de rayas en grupos de siete: días, o semanas, o años.',
    cantaro: 'Un cántaro de barro con una grieta remendada con resina.',
    herramientas: 'Un martillo, una escuadra y una cuerda cuelgan de la pared, como si su dueño fuera a volver mañana.',
  }),
  niche: 'En la hornacina del fondo descansa una tabla de piedra azul oscuro. Tiene grabado un dragón.',
  nicheZygarde: 'Esta es la última.',
  casandraSees: '¿Eso es… lo que guardaba?',
  chronicleIntro: 'La tabla está grabada. Zygarde traduce en voz baja:',
  casandra: [
    '«Cuidando el puente que había roto.»',
    'No lo tiraron. Nadie lo traicionó.',
    'Se equivocó… y se quedó a arreglarlo. Toda una vida.',
    'Llevamos generaciones gritando que le robaron algo. Y él estaba aquí, remendando piedras.',
    '«El Eje no elige reyes; elige a quien camina.»',
    '…Apagaré el Resonador. Esa máquina hace lo mismo que su corona: obligar.',
    'Toma. Mi Noivern la trajo hace años del nido de la cima. Decíamos que era una escama de su corona.',
  ],
  casandraAfterGift: [
    'Ya no sé lo que es. Sé que tú sabrás usarla mejor que nosotros.',
    'Algunos volverán a casa. Yo me quedo: alguien tendrá que cuidar esta Calzada. Como él.',
  ],
  zygardeEnd: 'Ahora la Crónica llega hasta el fondo. Ya sé por dónde se baja.',
  emptyNiche: 'La hornacina está vacía. En la piedra queda la marca de la tabla.',
  casandraInside: 'Pasa. Llevamos toda la vida esperando a ver esto.',
});

async function onEnter(ctx) {
  ctx.setFlag(F.tallerSeen);
  await pause(ctx, 10);
  await ctx.say(TALLER_TEXT.enter);
  await zygardeSays(ctx, TALLER_TEXT.enterZygarde);
}

/** La Tabla Draco: Crónica XV, Casandra, Salamencita y el cambio en el mundo. */
export async function takeTablet(ctx) {
  const withCasandra = ctx.flag(F.casandraBeaten);
  await ctx.say(TALLER_TEXT.niche);
  await zygardeSays(ctx, TALLER_TEXT.nicheZygarde);
  if (withCasandra) await ctx.say(TALLER_TEXT.casandraSees, { speaker: SPEAKER.casandra });
  await ctx.story.giveTablet('DRACOPLATE');
  ctx.setFlag(F.tablet);
  ctx.requestRefresh?.();
  const entry = chronicleFor('DRACOPLATE');
  await ctx.say(TALLER_TEXT.chronicleIntro);
  await ctx.say(`«${entry?.text || ''}»`, { telepathy: true });
  if (withCasandra) await lines(ctx, SPEAKER.casandra, TALLER_TEXT.casandra);
  await ctx.giveItem('SALAMENCITE', 1);
  ctx.setFlag(F.salamencite);
  if (withCasandra) await lines(ctx, SPEAKER.casandra, TALLER_TEXT.casandraAfterGift);
  ctx.setFlag(F.resonatorOff);
  ctx.setFlag(F.caretakers);
  await zygardeSays(ctx, TALLER_TEXT.zygardeEnd);
}

function pieceEvents() {
  const DIRS = [2, 4, 6, 8];
  return PIECES.map((p) => ({
    id: p.id, x: p.x, y: p.y, name: 'Taller del Rey',
    pages: [{
      sprite: OBJ.taller, dir: DIRS[Math.floor(p.piece / 4)], pattern: p.piece % 4, directionFix: true, walkAnime: false,
      solid: true, shadow: false, trigger: 'action', script: async (ctx) => { await ctx.say(TALLER_TEXT.look[p.look]); },
    }],
  }));
}

export function tallerEvents() {
  const base = { sprite: OBJ.plate, directionFix: true, walkAnime: false, solid: true, shadow: false, trigger: 'action' };
  return [
    { id: 'taller_llegada', x: 0, y: 0, pages: [{ when: when({ none: [F.tallerSeen] }), trigger: 'auto', script: onEnter }] },
    ...pieceEvents(),
    {
      id: 'tabla_draco', x: NICHE.x, y: NICHE.y, name: 'Tabla Draco',
      pages: [
        { ...base, when: when({ none: [F.tablet] }), dir: 2, stepAnime: true, speed: 2, light: { radius: 44, intensity: 0.7 }, script: takeTablet },
        { ...base, when: when({ all: [F.tablet] }), dir: 4, script: async (ctx) => { await ctx.say(TALLER_TEXT.emptyNiche); } },
      ],
    },
    {
      id: 'casandra_dentro', x: CASANDRA.x, y: CASANDRA.y, name: 'Casandra',
      pages: [{
        when: when({ all: [F.casandraBeaten], none: [F.tablet] }), sprite: SPRITE.casandra, dir: CASANDRA.dir, move: 'still', trigger: 'action',
        script: async (ctx) => { await ctx.say(TALLER_TEXT.casandraInside, { speaker: SPEAKER.casandra }); },
      }],
    },
  ];
}
