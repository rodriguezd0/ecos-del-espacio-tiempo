// Los cinco Guardianes humanos vuelven a sus núcleos para revanchas tras el epílogo.
import { getTrainer } from '../trainers/index.js';
import { bossBattle, SPRITE, MUSIC, V, postgame, restCount } from './b22e_common.js';
import { casildaHint } from './b22d_marshadow.js';

export const GUARDIANS = Object.freeze([
  { key: 'casilda', pillar: 1, trainer: 'b02_casilda', map: 'ruinas_dintel_nucleo', x: 13, y: 18,
    old: ['casilda'], species: ['SUDOWOODO', 'GARGANACL', 'HIPPOWDON'],
    intro: 'Las piedras siguen en su sitio. Nosotros no somos los mismos. ¿Probamos?', after: 'Otra vez. Con cabeza. Mañana, si quieres.' },
  { key: 'leandro', pillar: 2, trainer: 'leandro', map: 'pilar_corriente_nucleo', x: 13, y: 18,
    old: ['leandro_isla'], species: ['WHISCASH', 'FLOATZEL', 'AZUMARILL', 'QUAGSIRE'],
    intro: 'El río corre solo, pero yo no pienso quedarme quieto. ¿Una revancha?', after: 'Bien llevado. El río y el combate. Vuelve después de descansar.' },
  { key: 'abril', pillar: 3, trainer: 'b06_abril', map: 'anillo_vientos_nucleo', x: 13, y: 11,
    old: ['abril_sala'], species: ['EMOLGA', 'DRIFBLIM', 'STARAPTOR', 'CYCLIZAR'],
    intro: 'He subido antes que tú. Y esta vez no he dejado comida en el fuego. ¿Combatimos?', after: 'Vale. Esto sigue sin ser aburrido. Déjame preparar la siguiente.' },
  { key: 'fermin', pillar: 4, trainer: 'b08_fermin', map: 'camara_contrapesos_nucleo', x: 13, y: 11,
    old: ['fermin_camara'], species: ['GOLEM', 'GARGANACL', 'MUDSDALE', 'STEELIX', 'RHYPERIOR'],
    intro: 'La cámara ya no se hunde. Mis Pokémon todavía tienen fuerza. ¿Los ponemos a prueba?', after: 'Buen trabajo. La piedra aguanta. Nosotros necesitamos descansar.' },
  { key: 'olvido', pillar: 5, trainer: 'b10_olvido', map: 'archivo_hondo_nucleo', x: 27, y: 15,
    old: ['olvido_hondo', 'olvido_nucleo'], species: ['CHIMECHO', 'BEHEEYEM', 'BRONZONG', 'SPIRITOMB'],
    intro: 'He encontrado la página de nuestro combate. Queda sitio para otra. ¿La escribimos?', after: 'Apuntado: sigo aprendiendo. Mañana abrimos una página nueva.' },
].map(Object.freeze));
const SETS = Object.freeze({
  SUDOWOODO: ['STONEEDGE', 'WOODHAMMER', 'SUCKERPUNCH', 'HAMMERARM'],
  GARGANACL: ['SALTCURE', 'RECOVER', 'EARTHQUAKE', 'BODYPRESS'],
  HIPPOWDON: ['EARTHQUAKE', 'STONEEDGE', 'SLACKOFF', 'CRUNCH'],
  WHISCASH: ['EARTHQUAKE', 'WATERFALL', 'ICEBEAM', 'DRAGONDANCE'],
  FLOATZEL: ['WATERFALL', 'ICEPUNCH', 'CRUNCH', 'AQUAJET'],
  AZUMARILL: ['PLAYROUGH', 'WATERFALL', 'AQUAJET', 'SUPERPOWER'],
  QUAGSIRE: ['EARTHQUAKE', 'SCALD', 'RECOVER', 'TOXIC'],
  EMOLGA: ['THUNDERBOLT', 'AIRSLASH', 'VOLTSWITCH', 'ENCORE'],
  DRIFBLIM: ['SHADOWBALL', 'AIRSLASH', 'THUNDERBOLT', 'WILLOWISP'],
  STARAPTOR: ['BRAVEBIRD', 'CLOSECOMBAT', 'UTURN', 'QUICKATTACK'],
  CYCLIZAR: ['DRAGONCLAW', 'UTURN', 'KNOCKOFF', 'SHIFTGEAR'],
  GOLEM: ['EARTHQUAKE', 'STONEEDGE', 'SUCKERPUNCH', 'HEAVYSLAM'],
  MUDSDALE: ['EARTHQUAKE', 'HEAVYSLAM', 'CLOSECOMBAT', 'ROCKSLIDE'],
  STEELIX: ['EARTHQUAKE', 'GYROBALL', 'CRUNCH', 'STONEEDGE'],
  RHYPERIOR: ['EARTHQUAKE', 'STONEEDGE', 'MEGAHORN', 'ICEPUNCH'],
  CHIMECHO: ['PSYCHIC', 'DAZZLINGGLEAM', 'RECOVER', 'YAWN'],
  BEHEEYEM: ['PSYCHIC', 'THUNDERBOLT', 'ENERGYBALL', 'RECOVER'],
  BRONZONG: ['GYROBALL', 'PSYCHIC', 'EARTHQUAKE', 'TRICKROOM'],
  SPIRITOMB: ['SHADOWBALL', 'DARKPULSE', 'WILLOWISP', 'PAINSPLIT'],
});
const guardian = (key) => {
  const g = GUARDIANS.find((o) => o.key === key);
  if (!g) throw new Error(`Guardián de revancha desconocido: ${key}`);
  return g;
};

export function rematchRequest(key) {
  const g = guardian(key), original = getTrainer(g.trainer);
  return { type: 'trainer', noCoop: true, bgm: MUSIC.guardian,
    trainer: { ...original, id: `b22e_guardian_${key}`, ai: 96, items: ['HYPERPOTION', 'HYPERPOTION'],
      party: g.species.map((species, i) => ({ species, level: Math.min(75, 72 + i),
        moves: [...SETS[species]], item: i === g.species.length - 1 ? 'SITRUSBERRY' : null,
        ivs: { hp: 24, atk: 24, def: 24, spa: 24, spd: 24, spe: 24 } })) },
  };
}
export function rematchReady(state, key) {
  const g = guardian(key);
  return postgame(state) && state.flag(`p${g.pillar}_restored`) && restCount(state) > Number(state.var(V.revancha(key), -1));
}
export async function guardianRematch(ctx, key) {
  const g = guardian(key), speaker = rematchRequest(key).trainer.name;
  if (!postgame(ctx.state) || !ctx.flag(`p${g.pillar}_restored`)) return false;
  if (key === 'casilda') await casildaHint(ctx);
  if (!rematchReady(ctx.state, key)) { await ctx.say(g.after, { speaker }); return false; }
  if (!(await ctx.confirm(g.intro, { speaker }))) return false;
  const outcome = await bossBattle(ctx, rematchRequest(key), null, {
    speaker, loseText: 'Descansa un momento. Podemos volver a intentarlo cuando quieras.',
  });
  if (outcome !== 'win') return false;
  ctx.setVar(V.revancha(key), restCount(ctx.state));
  ctx.setFlag(`b22e_revancha_${key}_ganada`);
  await ctx.say(g.after, { speaker });
  return true;
}
export function withGuardianRematch(events, key) {
  const g = guardian(key), active = (s) => postgame(s) && s.flag(`p${g.pillar}_restored`);
  const originals = events.map((e) => !g.old.includes(e.id) ? e : {
    ...e, when: (s) => !active(s) && (!e.when || e.when(s)),
    pages: e.pages?.map((p) => ({ ...p, when: (s) => !active(s) && (!p.when || p.when(s)) })),
  });
  return [...originals, { id: `b22e_guardian_${key}`, x: g.x, y: g.y, name: rematchRequest(key).trainer.name,
    when: active, sprite: SPRITE[key], dir: 2, move: 'still', solid: true, trigger: 'action', script: (ctx) => guardianRematch(ctx, key) }];
}
