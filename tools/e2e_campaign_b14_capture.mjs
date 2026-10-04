// Captura opcional de la Bramaluna física, separada del eco y de la restauración ya realizada.
export function realCaptureError(s) {
  const real = s.battles.filter(b => b.tag === 'bramaluna_real' && b.outcome === 'caught').at(-1);
  const owned = s.partyList.includes('ROARINGMOON') || s.boxedPokemon.some(p => p.species === 'ROARINGMOON');
  if (!s.flags.b14_bramaluna_capturada || !owned) return 'la Bramaluna física aún no está capturada';
  if (!real || real.level !== 58 || !real.alpha || real.canRun !== true || real.canCatch === false || real.catchRule)
    return `reglas o resultado de la Bramaluna física: ${JSON.stringify(real)}`;
  return null;
}

export async function completeRealMoon(d) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = await d.snap();
    if (before.map !== 'fosa_eco') throw Error(`Captura de la Bramaluna fuera del nido: ${before.map}`);
    try {
      if (!before.flags.b14_bramaluna_capturada) {
        await d.faceEvent('bramaluna_real');
        await d.interact({ watch: [{ scene: 'BattleScene', name: 'bramaluna_real', delay: 4000 }] });
      }
      await d.milestone('bramaluna_real', realCaptureError);
      return;
    } catch (error) {
      const after = await d.snap(), battle = after.battles.at(-1);
      if (after.battles.length <= before.battles.length || battle?.tag !== 'bramaluna_real'
        || battle.outcome !== 'lose' || battle.canLose !== true || battle.noMoneyLoss !== true
        || !Number.isSafeInteger(battle.moneyBefore) || battle.moneyBefore < 0
        || !Number.isSafeInteger(battle.moneyAfter) || battle.moneyAfter < 0
        || battle.moneyBefore !== battle.moneyAfter || after.map !== 'fosa_eco') throw error;
      console.log('RETIRADA REAL del nido: equipo curado aquí; la captura opcional se reintenta por interacción.');
    }
  }
  throw Error('Tres retiradas reales del nido; hace falta preparar el equipo antes de capturar.');
}
