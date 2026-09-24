// Museo de las Eras, planta baja y galería (docs/TABLILLAS.md §4.6; CAMPANA B09 y «Regalos»): recepción, vitrinas,
// el paleontólogo que revive fósiles tras T06 (Fósil Cráneo y Fósil Coraza de Fermín, nv 25), la escalera del
// personal al sótano (cerrada hasta la noche de T06), Rosalía de día y de noche, la galería con la foto de la
// excavación (pista 2), la sala «Antea, la ciudad de antes» (clausurada hasta la noche de T06: calco del borde y
// vitrina helada, pistas 3 y 4; reabierta tras T06 con la historia del Rey) y la Sala de las Crónicas (tras T06: un
// panel por Tablilla conseguida, que Rosalía lee en voz alta).
import { F, V, SPEAKER, SPRITE, when, say, examine, npc, isNight, byGender } from './b09a_common.js';
import { foundClue, hallNightEvents } from './b09a_t06.js';
import { CAMPAIGN_TABLETS, tabletById } from '../story/tablets.js';
import { chronicleFor } from '../story/chronicle.js';
import { HALL, GALLERY, BASEMENT } from '../maps/b09a/museo_layout.js';

const R = SPEAKER.rosalia;
const tNight = (s) => Boolean(s) && s.flag(F.t06Night) && !s.flag(F.t06Solved);

// ------------------------------------------------------------ fósiles
const FOSSILS = Object.freeze([
  { item: 'SKULLFOSSIL', species: 'CRANIDOS', flag: F.skull },
  { item: 'ARMORFOSSIL', species: 'SHIELDON', flag: F.armor },
]);

async function reviveFossil(ctx) {
  const S = SPEAKER.scientist;
  if (!ctx.flag(F.t06Done)) {
    await say(ctx, S, 'Esta máquina puede devolver la vida a los fósiles… en teoría. La curadora no me deja encenderla hasta que la sala de Antea esté en orden.');
    return;
  }
  const have = FOSSILS.filter((f) => ctx.state.hasItem(f.item));
  if (!have.length) {
    await say(ctx, S, 'La máquina de revivir fósiles ya funciona. Si encuentras alguno, tráemelo. En la mina de Estrato salen de vez en cuando.');
    return;
  }
  const db = ctx.db?.items || {};
  const names = have.map((f) => db[f.item]?.name || f.item);
  const i = await ctx.choice([...names, 'Nada'], { message: '¿Quieres que reviva un fósil?', cancel: have.length });
  const f = have[i];
  if (!f) return;
  ctx.state.removeItem(f.item, 1);
  await say(ctx, S, '¡Allá vamos! La máquina necesita un momento…');
  await ctx.fade('out', 20);
  ctx.se?.('Anim/Saint7');
  await ctx.wait(40);
  await ctx.fade('in', 20);
  await say(ctx, S, '¡Lo ha conseguido! Cuídalo bien: lleva mucho tiempo esperando.');
  await ctx.givePokemon({ species: f.species, level: 25 });
  ctx.setFlag(f.flag);
}

// ------------------------------------------------------------ planta baja
function hallEvents() {
  const h = HALL;
  return [
    ...hallNightEvents(),
    npc('recepcionista_museo', h.desk.x, h.desk.y, SPRITE.museumDesk, 'Recepcionista', (s) => (s.flag(F.t06Done)
      ? ['¡Hola de nuevo! La sala «Antea, la ciudad de antes» vuelve a estar abierta, en la primera planta. Y la nueva Sala de las Crónicas, al fondo de la galería.']
      : [`¡${byGender(s, 'Bienvenido', 'Bienvenida')} al Museo de las Eras! Planta baja: fósiles y hallazgos de Axis. Primera planta: la galería.`, 'La sala de Antea está cerrada. La curadora dice que es por obras.']),
      { dir: 2, move: 'still', when: (s) => Boolean(s) && !isNight(s) }),
    { id: 'paleontologo', x: h.scientist.x, y: h.scientist.y, name: SPEAKER.scientist, sprite: SPRITE.scientist, dir: 2, move: 'still', trigger: 'action',
      when: (s) => Boolean(s) && !isNight(s), script: reviveFossil },
    examine('maquina_fosiles', h.exhibits.machine[0], h.exhibits.machine[1], 'La máquina de revivir fósiles: una cápsula turquesa con un zumbido suave.', { solid: true }),
    {
      id: 'rosalia_dia', x: h.rosaliaDay.x, y: h.rosaliaDay.y, name: R,
      pages: [
        { when: (s) => Boolean(s) && s.flag(F.gala) && !s.flag(F.t06Night) && !isNight(s), sprite: SPRITE.rosalia, dir: 2, move: 'still', trigger: 'action',
          script: async (ctx) => { await say(ctx, R, 'Aquí no. Hay demasiados oídos. Vuelve cuando cierre el museo, de noche.'); } },
      ],
    },
    {
      id: 'vigilante_escalera', x: h.guard.x, y: h.guard.y, name: 'Vigilante',
      pages: [{ when: (s) => Boolean(s) && !s.flag(F.t06Night), sprite: 'anil:asistente', dir: h.guard.dir, move: 'still', trigger: 'action',
        script: async (ctx) => { await say(ctx, 'Vigilante', 'Esa escalera baja al sótano: taller, archivo y almacén. Solo personal del museo.'); } }],
    },
    examine('vitrinas_hall', ...h.exhibits.vitrinas, 'Hallazgos de Axis: puntas de flecha, cuencos de barro y una piedra con un hexágono grabado.'),
    examine('vitrinas_hall_2', ...h.exhibits.vitrinas2, 'Vitrina de las Eras: herramientas de piedra, de bronce y de hierro, en fila. Debajo, un rótulo: «Todo lo que se hace se deshace, y se vuelve a hacer».'),
    examine('fosiles_hall', ...h.exhibits.fossils, 'Esqueletos fósiles hallados en la galería honda de la mina de Estrato. Un cartel pide no tocar.'),
    examine('vasijas_hall', ...h.exhibits.pots, 'Vasijas de Antea. Una tiene pintada una mujer con una flauta.'),
  ];
}

// ------------------------------------------------------------ galería, sala de Antea y Sala de las Crónicas
function galleryEvents() {
  const g = GALLERY;
  const anteaOpen = (s) => Boolean(s) && (tNight(s) || s.flag(F.t06Done));
  const toAntea = async (ctx) => {
    if (!anteaOpen(ctx.state)) { await ctx.say('«ANTEA, LA CIUDAD DE ANTES». Sala cerrada temporalmente.'); return; }
    await ctx.warp(ctx.map.id, g.antea.arrival.x, g.antea.arrival.y, g.antea.arrival.dir, { door: true });
  };
  const toCronicas = async (ctx) => {
    if (!ctx.flag(F.t06Done)) { await ctx.say('Una sala vacía, recién pintada. Un cartel: «Próximamente: Sala de las Crónicas».'); return; }
    await ctx.warp(ctx.map.id, g.cronicas.arrival.x, g.cronicas.arrival.y, g.cronicas.arrival.dir, { door: true });
  };
  return [
    ...g.antea.alcoves.map(([x, y]) => ({ id: `puerta_antea_${x}`, x, y, trigger: 'touch', script: toAntea })),
    ...g.cronicas.alcoves.map(([x, y]) => ({ id: `puerta_cronicas_${x}`, x, y, trigger: 'touch', script: toCronicas })),
    // Foto de la excavación (pista 2)
    {
      id: 'foto_excavacion', x: g.photo.x, y: g.photo.y, trigger: 'action', noOver: true, solid: true,
      script: async (ctx) => {
        await ctx.say('Una foto de hace cuarenta años: «Sala de Antea». Una Rosalía muy joven, con bata de ayudante, posa junto a la losa votiva en su vitrina.');
        await ctx.say('Se ve bien la esquina inferior izquierda de la losa: una grieta en forma de «Y».');
        if (tNight(ctx.state)) await foundClue(ctx, 'photo');
      },
    },
    examine('maqueta_cohete', g.rocket.x, g.rocket.y, 'Maqueta de un cohete: «La era que viene». Alguien le ha pegado una pegatina de Staravia.'),
    examine('vitrinas_galeria', g.showcase.x, g.showcase.y, 'Vitrinas de la era de los Custodios: calcos de glifos Unown y dibujos de los diez Pilares.'),
    npc('visitante_galeria', g.visitor.x, g.visitor.y, SPRITE.neighborM, 'Visitante', (s) => (s.flag(F.t06Done)
      ? ['¿Has visto la sala de Antea? Cuenta la historia de un rey que quiso que el Eje le obedeciera. No acabó bien.']
      : ['Las salas del fondo llevan meses cerradas. Vengo cada semana por si abren.']), { dir: 2, when: (s) => Boolean(s) && !isNight(s) }),
    // Sala de Antea: calco del borde (pista 3), vitrina helada (pista 4) y, tras T06, el panel del Rey.
    {
      id: 'calco_borde', x: g.plaque.x, y: g.plaque.y, trigger: 'action', noOver: true, solid: true,
      script: async (ctx) => {
        await ctx.say('Un calco enmarcado del borde de la losa, hecho a carboncillo en 1985. Debajo, a mano: «Tres glifos: EJE».');
        await ctx.say('Junto al calco, la foto del catálogo de aquel año: una etiqueta de inventario pegada en el borde tapa justo el glifo del centro.');
        if (tNight(ctx.state)) await foundClue(ctx, 'glyphs');
      },
    },
    {
      id: 'vitrina_vacia', x: g.vitrine.x, y: g.vitrine.y, trigger: 'action', noOver: true, solid: true,
      script: async (ctx) => {
        if (ctx.flag(F.t06Done)) { await ctx.say('La vitrina de la losa, vacía. Un rótulo: «La pieza original viaja con quien la protege».'); return; }
        await ctx.say('La vitrina de la losa, vacía y con el cristal remendado con cinta. Por dentro, el cristal tiene una fina capa de escarcha.');
        await ctx.say('Un parte del vigilante, pegado al pie: «Otra vez el cristal agrietado. Tercera noche seguida. Hace frío aquí dentro».');
        if (tNight(ctx.state)) await foundClue(ctx, 'cold');
      },
    },
    examine('panel_rey', g.kingPanel.x, g.kingPanel.y, (s) => (s.flag(F.t06Done)
      ? ['«ANTEA, LA CIUDAD DE ANTES». Lo que decía la losa votiva, traducido por la curadora:', `«${chronicleFor('IRONPLATE')?.text || ''}»`]
      : ['Un panel tapado con una sábana. Debajo se adivina el dibujo de una corona.']), { solid: true }),
    // Sala de las Crónicas: tres paneles de pared (cinco Tablillas cada uno), uno por cada Tablilla conseguida.
    ...Array.from({ length: g.panelWall.x1 - g.panelWall.x0 + 1 }, (_, i) => examine(`panel_cronica_${i}`, g.panelWall.x0 + i, g.panelWall.y,
      (s) => chroniclePanel(s, Math.floor(i / 2)))),
    {
      id: 'rosalia_cronicas', x: g.rosaliaCronicas.x, y: g.rosaliaCronicas.y, name: R,
      // Mientras espera en el archivo del sótano (ficha de la Laguna Clara), no está aquí.
      pages: [{ when: when({ all: [F.t06Done, F.laguna] }), sprite: SPRITE.rosalia, dir: 2, move: 'still', trigger: 'action', script: readChronicles }],
    },
  ];
}

/** Texto del panel i de la Sala de las Crónicas: las Tablillas conseguidas, por orden de la Crónica. */
const CAMPAIGN_IDS = CAMPAIGN_TABLETS.map((t) => t.id);

function chroniclePanel(state, i) {
  const got = CAMPAIGN_IDS.filter((id) => (state.data.tablets || []).includes(id));
  const ids = got.slice(i * 5, i * 5 + 5);
  if (!ids.length) return 'Un panel vacío. Espera sus Tablillas.';
  return ids.map((id) => `${tabletById(id)?.name || id}: ${chronicleFor(id)?.text || ''}`);
}

async function readChronicles(ctx) {
  const got = CAMPAIGN_IDS.filter((id) => (ctx.state.data.tablets || []).includes(id));
  await say(ctx, R, `Tienes ${got.length} de las quince. Cada una que traigas tendrá aquí su panel. ¿Cuál quieres que te lea?`);
  if (!got.length) return;
  const names = got.map((id) => tabletById(id)?.name || id);
  const i = await ctx.choice([...names, 'Ninguna'], { message: '¿Qué Crónica lee Rosalía?', cancel: got.length });
  const id = got[i];
  if (!id) return;
  const entry = chronicleFor(id);
  await say(ctx, R, entry?.text || '…');
  await say(ctx, R, 'Los Custodios escribían para no olvidar. Nosotros leemos para lo mismo.');
}

export function museumHallEvents() {
  return hallEvents();
}

export function museumGalleryEvents() {
  return galleryEvents();
}

export { BASEMENT, V };
