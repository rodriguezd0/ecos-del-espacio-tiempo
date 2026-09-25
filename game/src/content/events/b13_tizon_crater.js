// Cráter del Tizón (docs/TABLILLAS.md T12: «un equipo de perforación de Genesis (jefa de perforación y técnicos,
// nivel 46–47) quiere una muestra de magma»; CAMPANA §5.4 B13 «perforación del volcán»; §8: cráter frío y cráter activo
// son del postgame). La jefa Maite y su sonda junto al lago de lava (combate de guion sin pérdida); cuando la sonda se
// retira y los tres respiraderos respiran, la vieja fragua de piedra del cráter vuelve a calentarse y deja ver la
// Tabla Llama (Crónica XII: «Las fraguas del rey se apagaron. Con su hierro hicimos cerrojos, no espadas.»).
import { F, SPEAKER, SPRITE, OBJ, MUSIC, when, lines, zygardeSays, byGender, bossBattle, findEvent, objectPage } from './b13_common.js';

export const CRATER = Object.freeze({
  width: 40, height: 50,
  floor: { x: 5, y: 6, w: 30, h: 40 },
  lava: { x: 14, y: 8, w: 12, h: 9 }, // cráter activo
  exit: { x: 20, y: 46 }, // salida de luz en la pared sur (casilla del warp)
  arrive: { x: 20, y: 44, dir: 8 },
  drill: { x: 20, y: 19 },
  chief: { x: 20, y: 21, dir: 2 },
  retry: { x: 20, y: 25, dir: 8 },
  crates: [[17, 20], [23, 20], [24, 22]],
  hearth: { x: 9, y: 25 }, // la vieja fragua (3×2), frente en (9, 26); se usa desde (9, 27)
  plate: { x: 9, y: 26 }, // la Tabla Llama brilla en la boca de la fragua, entre la ceniza
  columns: [[6, 23], [12, 23], [6, 28], [12, 28]],
  platform: { x: 5, y: 21, w: 9, h: 9 }, // enlosado de la vieja fragua
  cold: { x: 6, y: 35, w: 6, h: 5 }, // cráter frío (costra de basalto: postgame)
  coldSign: { x: 8, y: 34 },
  streams: [[26, 11, 2, 6], [28, 15, 2, 16], [30, 29, 4, 3]], // lava que baja del lago por el este (autotile)
  ridges: [[14, 31], [14, 35], [14, 39], [24, 33], [24, 37]], // rocas grandes que encauzan el paso desde la entrada
  fumaroles: [[17, 30], [22, 41], [10, 42], [30, 22], [8, 12], [28, 36]],
});

export const CRATER_TEXT = Object.freeze({
  lava: 'El cráter activo: un lago de magma que burbujea despacio. El calor muerde la cara.',
  cold: 'Una costra de basalto enorme sella una grieta del cráter. Aquí hace frío, aunque el suelo humea.',
  drillRun: 'La sonda de Genesis. Una barrena larguísima baja hacia el magma, zumbando.',
  drillStop: 'Solo quedan las marcas de las patas de la sonda en la ceniza.',
  hearthCold: 'Una fragua de piedra antiquísima, más grande que la del caserío. Está fría: por sus chimeneas no sube nada.',
  hearthBlocked: 'Por las chimeneas sube algo de calor… pero la sonda de Genesis se lo lleva todo por su tubería.',
  hearthLit: 'Por las chimeneas de la vieja fragua sube el calor de los respiraderos. Entre la ceniza, algo rojo brilla.',
  hearthAfter: 'La vieja fragua del cráter. El calor sube tranquilo por sus chimeneas.',
  column: 'Una columna de piedra rota. En la base, un grabado: un martillo cruzado con una llave.',
  fumarole: 'Una fumarola. El vapor sube recto: el volcán respira.',
});

// ───────────────────────────── La jefa de perforación ─────────────────────────────

async function chiefBattle(ctx) {
  const outcome = await bossBattle(ctx, { type: 'trainer', trainer: 'b13_jefa_perforacion', bgm: MUSIC.grunt }, CRATER.retry, {
    speaker: SPEAKER.chief, loseText: ['Vuelve cuando tengas ganas de perder otra vez. La sonda no se para.'],
  });
  if (outcome !== 'win') return;
  const vents = ctx.flag(F.tizVents);
  await lines(ctx, SPEAKER.chief, vents
    ? ['Con los respiraderos abiertos, la presión se va por donde siempre. Así la muestra no sirve.', 'Recogemos. Esto no ha pasado.']
    : ['La sonda sin nadie que la vigile no sirve de nada. Recogemos.', 'Nada personal: a mí me pagan por medir, no por pelear.']);
  await ctx.fade('out', 24);
  ctx.setFlag(F.tizChief);
  ctx.requestRefresh();
  await ctx.wait(10);
  await ctx.fade('in', 24);
  await ctx.say('El equipo de perforación desmonta la sonda y baja por la ladera con las cajas.');
  if (vents) await zygardeSays(ctx, 'Ya nadie le tapa la boca a la montaña. Mira la vieja fragua.');
}

async function chiefIntro(ctx) {
  ctx.setFlag('b13_t12_jefa_vista');
  ctx.bgm(MUSIC.tension);
  const chief = findEvent(ctx, 'jefa_perforacion');
  if (chief) await ctx.emote(chief, '!');
  await ctx.say(`Alto. Esto es una perforación del Consorcio. O de Genesis: ya da igual cómo nos llaméis.`, { speaker: SPEAKER.chief });
  if (ctx.flag(F.tizVents)) {
    await lines(ctx, SPEAKER.chief, [
      '¿Notas eso? La presión cae. Alguien ha reabierto los respiraderos de abajo.',
      `Un mes de trabajo, y ${byGender(ctx.state, 'un chico', 'una chica')} con un Pokémon verde lo deshace en una tarde.`,
    ]);
  } else {
    await lines(ctx, SPEAKER.chief, [
      'La sonda está a punto de llegar a la cámara. Cuando la presión termine de subir, tendremos la muestra de magma.',
      'Que el caserío se quede sin fuego unas semanas no es asunto mío.',
    ]);
  }
  await chiefBattle(ctx);
}

async function chiefTalk(ctx) {
  if (ctx.flag(F.tizChief)) return;
  await ctx.say('¿Otra vez tú? Muy bien.', { speaker: SPEAKER.chief });
  await chiefBattle(ctx);
}

// ───────────────────────────── La vieja fragua y la Tabla Llama ─────────────────────────────

async function hearthScript(ctx) {
  if (ctx.flag(F.tizPlate)) { await ctx.say(CRATER_TEXT.hearthAfter); return; }
  if (!ctx.flag(F.tizVents)) { await ctx.say(CRATER_TEXT.hearthCold); return; }
  if (!ctx.flag(F.tizChief)) { await ctx.say(CRATER_TEXT.hearthBlocked); return; }
  await ctx.say(CRATER_TEXT.hearthLit);
  ctx.se('Anim/Fire1', { volume: 70 });
  await ctx.flash([255, 150, 60], 14, 110);
  await zygardeSays(ctx, 'Una tabla de los que guardaban. La escondieron donde se apagó un fuego.');
  ctx.setFlag(F.tizPlate);
  await ctx.story.giveTablet('FLAMEPLATE');
  await zygardeSays(ctx, 'Vuelve al caserío. Allí ya arde otra vez.');
}

export function craterEvents() {
  const C = CRATER;
  const chiefPresent = when({ none: [F.tizChief] });
  const out = [
    { id: 'jefa_escena', x: 0, y: 0, trigger: 'auto', when: when({ none: [F.tizChief, 'b13_t12_jefa_vista'] }), script: chiefIntro },
    {
      id: 'sonda_genesis', x: C.drill.x, y: C.drill.y, name: 'Sonda',
      pages: [
        { ...objectPage(OBJ.drill, 2, { stepAnime: true }), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(CRATER_TEXT.drillRun); } },
        { when: when({ all: [F.tizChief] }), through: true, trigger: 'action', script: async (ctx) => { await ctx.say(CRATER_TEXT.drillStop); } },
      ],
    },
    {
      id: 'jefa_perforacion', x: C.chief.x, y: C.chief.y, name: SPEAKER.chief,
      pages: [
        { when: chiefPresent, sprite: SPRITE.techF, dir: C.chief.dir, solid: true, trigger: 'action', script: chiefTalk },
        { when: when({ all: [F.tizChief] }), through: true },
      ],
    },
    ...C.crates.map(([x, y], i) => ({
      id: `cajas_sonda_${i}`, x, y,
      pages: [
        { when: chiefPresent, ...objectPage(OBJ.kit, 2), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say('Cajas de muestras vacías con el emblema de los tubos cruzados.'); } },
        { when: when({ all: [F.tizChief] }), through: true },
      ],
    })),
    {
      id: 'fragua_rey', x: C.hearth.x, y: C.hearth.y + 1, name: 'Vieja fragua',
      pages: [
        { ...objectPage(OBJ.forge, 2), solid: true, trigger: 'action', script: hearthScript },
        { when: (s) => Boolean(s?.flag(F.tizVents) && s?.flag(F.tizChief)), ...objectPage(OBJ.forge, 4, { stepAnime: true }), solid: true, light: { radius: 72, intensity: 0.9 }, trigger: 'action', script: hearthScript },
      ],
    },
    ...[C.hearth.x - 1, C.hearth.x + 1].map((x) => ({ id: `fragua_rey_${x}`, x, y: C.hearth.y + 1, solid: true, noOver: true, trigger: 'action', script: hearthScript })),
    {
      id: 'tabla_llama', x: C.plate.x, y: C.plate.y,
      pages: [
        { through: true },
        { when: when({ all: [F.tizVents, F.tizChief], none: [F.tizPlate] }), ...objectPage(OBJ.plate, 4, { stepAnime: true }), through: true, trigger: 'action', script: hearthScript },
      ],
    },
    ...C.columns.map(([x, y], i) => ({ id: `columna_rey_${i}`, x, y, solid: true, noOver: true, trigger: 'action', script: async (ctx) => { await ctx.say(CRATER_TEXT.column); } })),
    { id: 'costra_basalto', x: C.coldSign.x, y: C.coldSign.y, solid: true, noOver: true, trigger: 'action', script: async (ctx) => { await ctx.say(CRATER_TEXT.cold); } },
    // La costra negra que tapa la charca del cráter frío (postgame: Moltres, CAMPANA §8).
    ...Array.from({ length: (C.cold.w - 2) * (C.cold.h - 2) }, (_, i) => {
      const x = C.cold.x + 1 + (i % (C.cold.w - 2));
      const y = C.cold.y + 1 + Math.floor(i / (C.cold.w - 2));
      return { id: `costra_fria_${i}`, x, y, ...objectPage(OBJ.lava, 4), shadow: false, solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(CRATER_TEXT.cold); } };
    }),
    ...C.fumaroles.map(([x, y], i) => ({
      id: `fumarola_${i}`, x, y,
      pages: [
        { ...objectPage(OBJ.vent, 2), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say('Una grieta en la roca, taponada por costra fría.'); } },
        { when: (s) => Boolean(s?.flag(F.tizVents)), ...objectPage(OBJ.vent, 4, { stepAnime: true }), solid: true, trigger: 'action', script: async (ctx) => { await ctx.say(CRATER_TEXT.fumarole); } },
      ],
    })),
  ];
  // Orillas del lago de lava (se examinan).
  for (let x = C.lava.x; x < C.lava.x + C.lava.w; x += 3) {
    out.push({ id: `orilla_lava_${x}`, x, y: C.lava.y + C.lava.h, trigger: 'action', noOver: true, script: async (ctx) => { await ctx.say(CRATER_TEXT.lava); } });
  }
  return out;
}
