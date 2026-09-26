// Combate enlazado (online). Cada jugador simula el MISMO combate en su navegador (misma semilla, mismos equipos) y
// por la red solo viajan las decisiones de los humanos: la latencia se nota solo al esperar la elección del otro.
//
//   · Contra otro jugador (mode 'pvp'): cada simulación se ve a sí misma en el bando 0 (textos y pantalla correctos
//     para cada uno). Todo lo que depende del índice y del azar usa el índice canónico (battle.canonicalIndex) para
//     que ambas simulaciones tiren los mismos dados en el mismo orden.
//   · En equipo contra entrenadores de IA (mode 'coop', dobles): las dos simulaciones son idénticas (anfitrión en la
//     posición 0 y compañero en la 2); solo cambia quién es «el jugador» (battle.localOwner). La IA es determinista.
//
// En cada fase de comandos: 1) el jugador local elige con su interfaz, 2) se envía la elección con una suma de
// control del estado, 3) se espera la del otro humano, 4) eligen los entrenadores de IA. Los relevos por
// debilitamiento, Ida y Vuelta, etc. se intercambian igual (mensajes 'sw'). Si las sumas no coinciden, el combate
// termina en empate con un aviso (nunca se sigue con estados distintos).
import { healed } from '../core/pokemon.js';

/** Suma de control (FNV-1a) del estado relevante, en orden canónico: igual en las dos simulaciones si van a la par. */
export function battleChecksum(battle) {
  const parts = [battle.turnCount];
  for (let c = 0; c < battle.battlers.length; c++) {
    const b = battle.battlers[battle.canonicalIndex(c)];
    parts.push(b ? `${b.species}:${b.hp}:${b.status}:${b.pokemonIndex}:${Object.values(b.stages || {}).join('')}` : '-');
  }
  for (let s = 0; s < 2; s++) {
    const party = battle.pbParty(battle.canonicalIndex(s));
    parts.push(party.map((p) => (p ? `${p.hp}${p.status || ''}` : '_')).join(','));
  }
  let h = 0x811c9dc5;
  for (const ch of parts.join('|')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Elección registrada de un combatiente → mensaje (índices de objetivo canónicos). */
export function encodeChoice(battle, idx) {
  const ch = battle.choices[idx];
  if (!ch) return null;
  if (ch.action === 'UseMove') {
    return { a: 'move', m: ch.moveIndex, t: ch.target >= 0 ? battle.canonicalIndex(ch.target) : -1, mega: battle.pbRegisteredMegaEvolution(idx) };
  }
  if (ch.action === 'SwitchOut') return { a: 'switch', p: ch.partyIndex };
  return null;
}

/** Aplica la elección de un humano remoto. Devuelve false si no es válida en esta simulación (desincronía). */
export function applyChoice(battle, idx, c) {
  if (!c) return true;
  if (c.a === 'switch') return battle.pbRegisterSwitch(idx, c.p);
  if (c.a !== 'move') return false;
  if (c.m < 0) {
    battle.choices[idx] = { action: 'UseMove', moveIndex: -1, move: battle.struggle, target: -1, priority: 0 };
  } else if (!battle.pbRegisterMove(idx, c.m, false)) {
    return false;
  }
  if (c.t >= 0) battle.pbRegisterTarget(idx, battle.canonicalIndex(c.t));
  if (c.mega && battle.pbCanMegaEvolve(idx)) battle.pbRegisterMegaEvolution(idx);
  return true;
}

/**
 * Prepara un Battle para jugar enlazado.
 * link: { mode: 'pvp'|'coop', mirror, localOwner, localIdx, remoteIdx, remoteName,
 *         send(msg), next(): Promise<msg> (siguiente mensaje del otro humano; { gone: true } si se desconecta) }
 */
export function installLink(battle, link) {
  battle.link = link;
  battle.localOwner = link.localOwner ?? 0;
  battle.internalBattle = false; // sin objetos, obediencia, experiencia ni dinero (como los combates por cable)
  battle.switchStyle = false;
  battle.expGain = false;
  battle.moneyGain = false;
  battle.linkForfeit = false;
  battle.linkEnd = null; // 'forfeit' | 'remoteForfeit' | 'gone' | 'desync'

  const endWith = (decision, reason, text) => {
    battle.linkEnd = reason;
    if (text) battle.pbDisplayPaused(text);
    battle.decision = decision;
  };
  // Se rinde el otro humano: contra él, ganas; en equipo, perdéis los dos.
  const remoteQuit = (reason, text) => endWith(link.mode === 'pvp' ? 1 : 2, reason, text);

  battle.pbRunMenu = async function pbRunMenuLink(idx) {
    if (!(await this.pbDisplayConfirm('¿Quieres rendirte?'))) return false;
    this.linkForfeit = true;
    this.choices[idx] = { action: 'Run', move: null, target: -1, priority: 0 };
    return true;
  };

  battle.pbCommandPhase = async function pbCommandPhaseLink() {
    this.commandPhase = true;
    this.battlers.forEach((b, i) => { if (b && this.pbCanShowCommands(i)) this.pbClearChoice(i); });
    for (const side of [0, 1]) this.megaEvolution[side] = this.megaEvolution[side].map((v) => (v >= 0 ? -1 : v));
    const h = battleChecksum(this);
    try {
      await this.pbCommandPhaseLoop(true);
      if (this.linkForfeit) {
        link.send({ k: 'cmd', h, f: true });
        endWith(2, 'forfeit', 'Te has rendido.');
        return;
      }
      link.send({ k: 'cmd', h, c: encodeChoice(this, link.localIdx) });
      const msg = await link.next();
      if (msg.gone) { remoteQuit('gone', `${link.remoteName} se ha desconectado.`); return; }
      if (msg.f) { remoteQuit('remoteForfeit', `${link.remoteName} se ha rendido.`); return; }
      if (msg.k !== 'cmd' || msg.h !== h || (this.choices[link.remoteIdx]?.action === 'None' && !applyChoice(this, link.remoteIdx, msg.c))) {
        console.error('[online] desincronía', { local: h, remote: msg.h, msg });
        endWith(5, 'desync', 'La conexión se ha desincronizado. El combate termina en empate.');
        return;
      }
      await this.pbCommandPhaseLoop(false); // entrenadores de IA (el humano remoto ya tiene su elección)
    } finally {
      this.commandPhase = false;
    }
  };

  // Rendición, desconexión o desincronía: ya se avisó; sin «¡No te quedan Pokémon!» ni textos de derrota.
  const baseEndOfBattle = battle.pbEndOfBattle;
  battle.pbEndOfBattle = async function pbEndOfBattleLink() {
    if (!this.linkEnd) return baseEndOfBattle.call(this);
    const decision = this.decision;
    this.decision = 3; // como una huida: sin mensajes de victoria o derrota
    try {
      await baseEndOfBattle.call(this);
    } finally {
      this.decision = decision;
    }
    return undefined;
  };

  const baseSwitchInBetween = battle.pbSwitchInBetween;
  battle.pbSwitchInBetween = async function pbSwitchInBetweenLink(idx, checkLaxOnly = false, canCancel = false, reason = 'replace') {
    if (idx === link.localIdx) {
      const choice = await this.pbPartyScreen(idx, checkLaxOnly, canCancel, false, reason);
      link.send({ k: 'sw', p: choice });
      return choice;
    }
    if (idx !== link.remoteIdx) return baseSwitchInBetween.call(this, idx, checkLaxOnly, canCancel, reason);
    const msg = await link.next();
    if (msg.gone) { remoteQuit('gone', `${link.remoteName} se ha desconectado.`); return -1; }
    if (msg.k !== 'sw') {
      endWith(5, 'desync', 'La conexión se ha desincronizado. El combate termina en empate.');
      return -1;
    }
    return msg.p;
  };
  return battle;
}

/** Equipo para un combate online: sin huevos, curado por completo (los combates online no tocan tu partida). */
export function linkParty(db, party) {
  return (party || []).filter((p) => p && !p.egg).map((p) => healed(db, JSON.parse(JSON.stringify(p))));
}
