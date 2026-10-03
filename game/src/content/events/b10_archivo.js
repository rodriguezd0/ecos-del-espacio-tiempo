// Eventos del Archivo de papel (mnemos_archivo; docs/CAMPANA.md B10 y §5.4 «P5: Extracción de información: copian el
// Archivo; se llevan copias (ambigüedad moral)»; §5.5 escalón 5: el informe con el nombre tachado):
//   · Antes del P5: dos técnicos del Consorcio escanean las páginas (entrenadores) y, la primera vez que se entra con
//     Olvido, Casia hace su cameo sin combate: «Nosotros también salvamos lo que se pierde.» Olvido sube «por su camino».
//   · Tras el P5: Genesis se ha ido con sus copias; la tinta ha vuelto a todas las páginas menos a un nombre. Olvido
//     enseña el Informe del incidente de la Laguna Clara: «Los tachones también son memoria.» Nadie dice un nombre.
//     Entrega la Piedra Espíritu (ODDKEYSTONE) para la Losa del Olvido.
import { F, SPEAKER, SPRITE, lines, eventById, when, byGender } from './b10_common.js';
import { trainerUntil } from './b06_common.js';
import { ARCHIVO_ROOM as A, ARCHIVO_TRAINERS } from '../maps/b10/archivo_layout.js';
import { hondoTrainerEvents } from './b10_hondo.js';

export const ARCHIVO_TEXT = Object.freeze({
  shelfFaded: 'Legajos y cuadernos. Las páginas están casi en blanco: la tinta se ha ido quedando en sombras.',
  shelfBack: 'Legajos y cuadernos. La tinta ha vuelto a todas las páginas, como si nunca se hubiera ido.',
  scanner: 'Un aparato que barre las páginas con una luz magenta. En el lateral, un emblema: dos tubos de ensayo cruzados sobre un círculo.',
  scannerOff: 'El aparato está apagado y lleva una etiqueta: «Recogida pendiente — C. M.»',
  computers: 'Pantallas llenas de páginas escaneadas, numeradas de mil en mil.',
  informeTitle: 'Olvido abre una carpeta de tapas grises. En la portada: «Informe del incidente de la Laguna Clara». Tiene dieciséis años.',
  informeBody: '«…inducción de resonancia, fase dos… la laguna desciende once palmos en siete días… el caserío abandona la pesca…» Al pie, un sello de la Fundación Meridiano.',
  informeName: '«Responsable de calibración:» y, detrás, una línea de tinta negra, apretada, que tapa el nombre.',
});

// ------------------------------------------------------------ Casia y Olvido (antes del P5)

async function casiaScene(ctx) {
  if (ctx.flag(F.casia)) return;
  const casia = eventById(ctx, 'casia_archivo');
  const olvido = eventById(ctx, 'olvido_archivo');
  ctx.bgm('GuaridaRocket');
  await ctx.wait(20);
  if (casia) { ctx.face(casia, 'down'); await ctx.emote(casia, '…'); }
  const n = ctx.state.data.zygarde?.cells?.length ?? 0;
  const cores = ctx.state.data.zygarde?.cores?.length ?? 1;
  const coreWords = ['un núcleo', 'dos núcleos', 'tres núcleos', 'cuatro núcleos', 'cinco núcleos'][cores - 1] || `${cores} núcleos`;
  await lines(ctx, SPEAKER.casia, [
    `Señora Arrieta. Y ${byGender(ctx.state, 'el portador', 'la portadora')}. ${n} células y ${coreWords}, si no me equivoco. No me equivoco.`,
  ]);
  await lines(ctx, SPEAKER.olvido, ['Esta señora lleva una semana fotografiando mis estanterías con una lámpara.']);
  await lines(ctx, SPEAKER.casia, [
    'Digitalizando. La tinta se borra y nadie más lo impide. Dentro de un mes no quedaría ni una fecha.',
    'Nosotros también salvamos lo que se pierde.',
  ]);
  await lines(ctx, SPEAKER.olvido, ['Lo que se pierde, sí. Pero no se lo lleva usted a su casa.']);
  await lines(ctx, SPEAKER.casia, [
    'A la de todos, señora Arrieta. Esa es la diferencia que usted no quiere ver.',
    'Terminaremos antes de que la niebla lo borre todo. Con permiso.',
  ]);
  if (casia) {
    await ctx.move(casia, ['left', 'down', 'down', 'down', 'down', 'down'], { through: true, speed: 3.5 });
    ctx.erase(casia);
  }
  ctx.setFlag(F.casia);
  ctx.bgm('Transicion');
  if (olvido) ctx.face(olvido, ctx.directionTo(olvido, ctx.player));
  await lines(ctx, SPEAKER.olvido, [
    '…Fascinante. Hasta cuando mienten, apuntan bien las fechas.',
    'La escalera del fondo sube a los recuerdos del Archivo Hondo. Yo subo por mi camino, que no se enseña.',
    'Te espero en lo alto, donde duerme la piedra. Si llegas.',
  ]);
  if (olvido) {
    await ctx.move(olvido, ['up', 'up', 'up', 'left', 'left', 'left', 'left'], { through: true, speed: 3.5 });
    ctx.erase(olvido);
  }
  ctx.setFlag(F.olvidoDown);
}

// ------------------------------------------------------------ informe tachado (tras el P5)

async function informeScene(ctx) {
  if (ctx.flag(F.informe)) return;
  const olvido = eventById(ctx, 'olvido_informe');
  if (olvido) ctx.face(olvido, ctx.directionTo(olvido, ctx.player));
  await lines(ctx, SPEAKER.olvido, [
    'Mira. La tinta ha vuelto. A todas las páginas.',
    'Los del Consorcio se marcharon anoche con sus copias. Se llevaron hasta el polvo, en fotografías. Que les aproveche.',
    'Pero hay una cosa que ni la niebla se llevó ni la tinta ha devuelto. Ven.',
  ]);
  ctx.se('GUI summary change page');
  await ctx.say(ARCHIVO_TEXT.informeTitle);
  await ctx.say(ARCHIVO_TEXT.informeBody);
  await ctx.say(ARCHIVO_TEXT.informeName);
  await ctx.wait(30);
  await lines(ctx, SPEAKER.olvido, [
    'Alguien no quería que se supiera quién calibró.',
    'Los tachones también son memoria.',
  ]);
  ctx.setFlag(F.informe);
  await lines(ctx, SPEAKER.olvido, [
    'Y toma esto. La encontré al pie del risco del Santuario cuando tenía tu edad. Rodó desde arriba, de la Losa del Olvido.',
  ]);
  await ctx.giveItem('ODDKEYSTONE', 1);
  ctx.setFlag(F.keystone);
  await lines(ctx, SPEAKER.olvido, [
    'Una Piedra Espíritu. Dicen que de noche, si la pones en la losa, alguien contesta desde dentro.',
    'Yo nunca me atreví a subir. Ahora que tu acompañante sabe trepar, apúntalo tú.',
    'Vuelvo a la plaza. Tengo cien nombres que pasar a limpio.',
  ]);
  if (olvido) {
    await ctx.move(olvido, ['right', 'down', 'down'], { through: true, speed: 3.5 });
    ctx.erase(olvido);
  }
}

// ------------------------------------------------------------ eventos

/** Técnicos del Consorcio (entrenadores con visión); tras el P5 ya no están (se fueron con sus copias). */
function genesisTrainers() {
  const gone = (s) => Boolean(s) && s.flag(F.restored);
  const mk = (id, trainer, pos, name, sprite, after) => trainerUntil({
    id, x: pos.x, y: pos.y, name, trainer, sprite, dir: pos.dir, sight: 3, eyeBgm: 'EncuentroRocket',
    intro: 'Zona de digitalización. Por favor, no toque los legajos.', after,
  }, gone);
  return [
    mk('tecnico_archivo', 'b10_tecnico_baltasar', A.tecnico, 'Baltasar', SPRITE.tecnico,
      'Solo copiamos. Nadie se lleva un solo papel de aquí. Las copias no ocupan sitio en ninguna estantería.'),
    mk('tecnica_archivo', 'b10_tecnica_noemi', A.tecnica, 'Noemí', SPRITE.tecnica,
      'Cuando la niebla se lo haya llevado todo, esta aldea nos lo agradecerá.'),
  ];
}

function furnitureEvents() {
  const shelf = (id, x, y) => ({
    id, x, y, trigger: 'action', noOver: true, solid: true,
    script: async (ctx) => { await ctx.say(ctx.flag(F.restored) ? ARCHIVO_TEXT.shelfBack : ARCHIVO_TEXT.shelfFaded); },
  });
  const out = [];
  A.stacks.forEach(([x, y], i) => { out.push(shelf(`estante_${i}_a`, x, y + 2), shelf(`estante_${i}_b`, x + 1, y + 2)); });
  A.scanners.forEach((s, i) => {
    for (const dx of [0, 1]) {
      out.push({
        id: `escaner_${i}_${dx}`, x: s.x + dx, y: s.y + 1, trigger: 'action', noOver: true, solid: true,
        script: async (ctx) => { await ctx.say(ctx.flag(F.restored) ? ARCHIVO_TEXT.scannerOff : ARCHIVO_TEXT.scanner); },
      });
    }
  });
  out.push({ id: 'pantallas', x: 11, y: 5, trigger: 'action', noOver: true, solid: true, script: async (ctx) => { await ctx.say(ARCHIVO_TEXT.computers); } });
  return out;
}

export function archivoEvents() {
  return [
    {
      id: 'casia_archivo', x: A.casia.x, y: A.casia.y, name: SPEAKER.casia,
      pages: [{ when: when({ all: [F.archivoOpen], none: [F.casia] }), sprite: SPRITE.casia, dir: A.casia.dir, move: 'still' }],
    },
    {
      id: 'olvido_archivo', x: A.olvido.x, y: A.olvido.y, name: SPEAKER.olvido,
      pages: [{ when: when({ all: [F.archivoOpen], none: [F.olvidoDown] }), sprite: SPRITE.olvido, dir: A.olvido.dir, move: 'still' }],
    },
    { id: 'escena_casia', x: 0, y: 0, trigger: 'auto', when: when({ all: [F.archivoOpen], none: [F.casia] }), script: casiaScene },
    {
      id: 'olvido_informe', x: A.olvidoTable.x, y: A.olvidoTable.y, name: SPEAKER.olvido,
      pages: [{ when: when({ all: [F.restored], none: [F.informe] }), sprite: SPRITE.olvido, dir: A.olvidoTable.dir, move: 'still', trigger: 'action', script: informeScene }],
    },
    { id: 'escena_informe', x: 0, y: 1, trigger: 'auto', when: when({ all: [F.restored], none: [F.informe] }), script: informeScene },
    ...genesisTrainers(),
    ...hondoTrainerEvents(ARCHIVO_TRAINERS),
    ...furnitureEvents(),
  ];
}

export function archivoOnEnter(ctx) {
  for (const ev of hondoTrainerEvents(ARCHIVO_TRAINERS)) {
    if (ctx.state.selfSwitch('archivo_hondo', ev.id)) ctx.state.setSelfSwitch('mnemos_archivo', ev.id);
  }
  ctx.requestRefresh?.();
}
