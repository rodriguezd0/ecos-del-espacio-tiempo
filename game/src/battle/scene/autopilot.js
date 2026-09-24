// Piloto automático de la escena de combate (solo desarrollo: ?scene=battle&auto=…). Módulo PURO.
// Toma las decisiones del jugador sin menús para probar flujos completos con capturas deterministas:
//   auto=1 / fight  → siempre el primer movimiento de daño      auto=ball → lanza Poké Balls
//   auto=run        → intenta huir                             auto=mega → lucha y megaevoluciona
//   auto=cycle      → usa los movimientos por turnos (para ver estados y cambios de características)

export class Autopilot {
  constructor(mode = 'fight') {
    const raw = mode === true || mode === '1' ? 'fight' : String(mode || 'fight');
    // '+learn': aprender movimientos con la interfaz real (para probar esa pantalla)
    this.manualLearn = raw.includes('+learn');
    this.mode = raw.replace('+learn', '') || 'fight';
  }

  action(battler, ctx, bag = []) {
    if (this.mode === 'run' && ctx.firstAction) return 'run';
    if (this.mode === 'ball' && ctx.wild && ctx.firstAction && bag.some((it) => it.battleUse === 'OnFoe')) return 'bag';
    return 'fight';
  }

  move(battler, moves, ctx = {}) {
    if (this.mode === 'cycle') {
      this.turn = (this.turn ?? -1) + 1;
      const usable = moves.filter((m) => m.selectable !== false);
      const m = usable[this.turn % Math.max(1, usable.length)] || moves[0];
      return m ? { index: m.index, mega: false } : null;
    }
    const pick = moves.find((m) => m.selectable !== false && m.category !== 'Status') || moves.find((m) => m.selectable !== false) || moves[0];
    return pick ? { index: pick.index, mega: this.mode === 'mega' && Boolean(ctx.canMega) } : null;
  }

  target(battler, candidates) {
    const foe = candidates.find((c) => c.battler.side !== battler.side);
    return (foe || candidates[0] || { index: -1 }).index;
  }

  switchTo(ctx) {
    if (ctx.canCancel && ctx.reason === 'command') return -1;
    const wantFainted = ctx.reason === 'revive';
    const p = ctx.party.find((o) => o.owned !== false && (wantFainted ? o.fainted : o.able && !o.active && !o.chosen));
    return p ? p.partyIndex : -1;
  }

  item(battler, ctx) {
    const ball = ctx.bag.find((it) => it.battleUse === 'OnFoe');
    return ball ? { item: ball.id, target: battler.partyIndex, move: -1 } : null;
  }

  confirm() {
    return false;
  }

  learnMove() {
    return 0;
  }
}
