import { F, V, completeZygarde, isPostgame, lines, OBJ } from './b23_common.js';
import { gaelFinalStarter } from './b15_common.js';
import { bossBattleRequest, recoverAfterLoss } from '../common/bossBattle.js';

export function gaelRequest(state) {
  const moveSets = {
    STARAPTOR: ['BRAVEBIRD', 'CLOSECOMBAT', 'UTURN', 'QUICKATTACK'],
    LUCARIO: ['AURASPHERE', 'FLASHCANNON', 'DARKPULSE', 'EXTREMESPEED'],
    GARCHOMP: ['EARTHQUAKE', 'DRAGONCLAW', 'STONEEDGE', 'SWORDSDANCE'],
    WEAVILE: ['ICICLECRASH', 'KNOCKOFF', 'ICESHARD', 'LOWKICK'],
    ABSOL: ['NIGHTSLASH', 'SUCKERPUNCH', 'PLAYROUGH', 'SWORDSDANCE'],
    INCINEROAR: ['DARKESTLARIAT', 'FLAREBLITZ', 'EARTHQUAKE', 'FAKEOUT'],
    INTELEON: ['SNIPESHOT', 'ICEBEAM', 'DARKPULSE', 'UTURN'],
    TORTERRA: ['WOODHAMMER', 'EARTHQUAKE', 'STONEEDGE', 'SYNTHESIS'],
  };
  const species = ['STARAPTOR', 'LUCARIO', 'GARCHOMP', 'WEAVILE', 'ABSOL', gaelFinalStarter(state)];
  return bossBattleRequest({ type: 'trainer', noCoop: true, bgm: 'CombateRival',
    trainer: { id: 'b23_gael', name: 'Gael', class: 'Rival', sprite: 'gael_front', ai: 110, money: 60,
      megaRing: true, megaRingName: 'el aro negro', items: ['FULLRESTORE', 'FULLRESTORE'], lastPokemonBgm: 'Ultimo Pokemon',
      party: species.map((id, i) => ({ species: id, level: i === 5 ? 82 : i > 1 ? 81 : 80,
        moves: moveSets[id], item: id === 'ABSOL' ? 'ABSOLITE' : i === 5 ? 'SITRUSBERRY' : null,
        ivs: { hp: 26, atk: 26, def: 26, spa: 26, spd: 26, spe: 26 } })) },
  });
}

export async function equipZygardite(ctx) {
  const p = completeZygarde(ctx.state);
  if (!p || p.heldItem === 'ZYGARDITE' || !ctx.state.itemCount('ZYGARDITE')) return;
  if (!await ctx.confirm('¿Dar la Zygardita a Zygarde? Podrás megaevolucionarlo desde el menú de movimientos.')) return;
  if (p.heldItem) ctx.state.addItem(p.heldItem);
  ctx.state.removeItem('ZYGARDITE'); p.heldItem = 'ZYGARDITE';
  ctx.state.setParty([...ctx.state.party]);
  ctx.requestRefresh?.();
}
export async function claimZygardite(ctx) {
  if (!isPostgame(ctx.state) || !ctx.flag(F.recording) || !ctx.flag(F.experiment)) return false;
  if (!ctx.flag(F.stone)) {
    await lines(ctx, [
      'El cristal cae de la abrazadera. La etiqueta dice «EXP-03: explanada del Monte del Portal».',
      'La roca se formó allí donde Zygarde Completo combatió tres noches. Genesis solo la extrajo; no pudieron fabricarla.',
      'Zygarde se acerca por voluntad propia. Las grietas se iluminan al responder a vuestro vínculo.',
    ]);
    await ctx.giveItem('ZYGARDITE'); ctx.setFlag(F.stone);
    await ctx.say('Yo elijo responder.', { telepathy: true });
  }
  await equipZygardite(ctx);
  return true;
}
export async function confrontGael(ctx) {
  if (!isPostgame(ctx.state) || !ctx.flag(F.crisol) || ctx.flag(F.gaelWon)) return;
  if (!completeZygarde(ctx.state)) {
    await ctx.say('El cristal espera una respuesta de Zygarde. Trae al Zygarde Completo que eligió acompañarte; puedes recuperarlo del PC del Centro de Almenara.');
    return;
  }
  if (!ctx.flag(F.experiment)) {
    await lines(ctx, ['No necesito que Zygarde venga. Esta vez seré yo quien llame.', 'Toda la resonancia que falta en el oasis y en el faro está aquí.'], 'Gael');
    await ctx.flash?.([241, 130, 151], 22, 160);
    await lines(ctx, ['Gael fuerza la energía del anillo hacia el cristal. La piedra no responde. Una grieta cruza su centro.',
      'Hoopa tira del anillo; las tuberías se doblan hacia una abertura que no deja de crecer.']);
    ctx.setFlag(F.experiment);
  }
  await claimZygardite(ctx);
  await lines(ctx, ['Conmigo no respondió.', 'Entonces me mediré contigo.'], 'Gael');
  const result = await ctx.battleResult(gaelRequest(ctx.state));
  if (result.outcome !== 'win') {
    ctx.setVar(V.gaelLosses, Number(ctx.var(V.gaelLosses, 0)) + 1);
    await recoverAfterLoss(ctx, null, { loseText: 'El anillo se contrae un instante. Tu equipo está curado; Gael sigue esperando.' });
    return;
  }
  ctx.setFlag(F.gaelWon); ctx.requestRefresh?.();
  await lines(ctx, ['No lo has obligado.', '…Eso sigue siendo peor.'], 'Gael');
  await ctx.say('El último anillo se abre detrás de Hoopa. Su energía ya no obedece a nadie.');
}
export function towerEvents() {
  return [
    { id: 'b23_gael', x: 17, y: 19, sprite: 'gael', dir: 2, solid: true, trigger: 'action',
      when: (s) => !s.flag(F.departure), script: async (ctx) => ctx.flag(F.gaelWon) ? ctx.say('El anillo ya no me escucha.', { speaker: 'Gael' }) : confrontGael(ctx) },
    { id: 'b23_fiel_o', x: 13, y: 19, sprite: 'anil:cientifico', dir: 2, solid: true, when: (s) => !s.flag(F.departure),
      script: (ctx) => ctx.say('Seguiré a Gael. Vértice se marchó hace mucho.') },
    { id: 'b23_fiel_e', x: 21, y: 23, sprite: 'anil:cientifico', dir: 4, solid: true, when: (s) => !s.flag(F.departure),
      script: (ctx) => ctx.say('Mantengo el último anillo abierto.') },
    { id: 'b23_anillo_final', x: 22, y: 19, sprite: OBJ.ring, dir: 2, shadow: false, through: true,
      stepAnime: true, when: (s) => !s.flag(F.departure) },
    { id: 'b23_abrazadera', x: 17, y: 9, sprite: OBJ.machine, dir: 6, solid: true,
      script: (ctx) => ctx.say('Una abrazadera agrietada. La placa EXP-03 tiene tierra del Monte del Portal.') },
    { id: 'b23_cristal', x: 17, y: 8, sprite: OBJ.crystal, dir: 2, shadow: false, through: true,
      when: (s) => !s.flag(F.stone) },
  ];
}
