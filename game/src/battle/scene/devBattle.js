// Banco de pruebas de la escena de combate real (ruta de desarrollo ?scene=battle).
// Crea una partida provisional (si no hay) y lanza combates con battle/scene/runner.js.
//
// Parámetros de URL (todos opcionales):
//   seed=123              semilla del combate y de los equipos aleatorios
//   party=PIKACHU,EEVEE   equipo del jugador (por defecto 3 especies aleatorias del inventario Axis)
//   foe=RATTATA,ZUBAT     rivales (por defecto aleatorios)   lv=30 (nivel rival)   plv=32 (nivel jugador)
//   double=1   trainer=1 (entrenador genérico) | trainer=gael_1 (id de content/trainers)
//   weather=Rain|rain   terrain=Grassy   mega=1 (Megapiedra si existe)   shiny=1 (rival variocolor)
//   bg=Cueva|cave|indoor…   time=night   env=Grass|MovingWater…   minimal=1 (animaciones mínimas)
//   full=1 (equipo lleno: las capturas van a la caja)   pmoves=EMBER,TOXIC / fmoves=… (movimientos)
//   auto=1|ball|run|mega|cycle (piloto automático para pruebas; ver autopilot.js)
// Controles en combate: flechas, A (Z/Intro), B (X/Esc), E megaevolución, C información del movimiento,
// Mayús acelera. Al terminar: A repite con otra semilla.
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { Scene } from '../../core/scenes.js';
import { GameState } from '../../core/state.js';
import { createRng } from '../core/index.js';
import { createPokemon } from '../core/pokemon.js';
import { drawText } from '../../ui/core/text.js';
import { runSceneBattle } from './runner.js';

const OUTCOME_TEXT = { win: 'Victoria', lose: 'Derrota', run: 'Huida', caught: 'Captura', draw: 'Empate', forfeit: 'Abandono' };
const DEV_BAG = { POKEBALL: 10, GREATBALL: 5, ULTRABALL: 3, POTION: 5, SUPERPOTION: 3, FULLHEAL: 2, ETHER: 2, XATTACK: 2, REVIVE: 1 };

export default class DevBattleScene extends Scene {
  async enter(params = {}) {
    this.params = params;
    this.seed = Number(params.seed) || Math.floor(Math.random() * 1e9);
    this.result = null;
    this.error = null;
    this.running = false;
    this.t = 0;
    this.launch();
  }

  /** Lista de especies de un parámetro, completada con aleatorias del inventario Axis. */
  speciesList(param, n, rng) {
    const db = engine.data;
    const axis = (db.dex?.entries || []).map((e) => e.id).filter((id) => db.species[id]);
    const pick = () => axis[Math.floor(rng() * axis.length)] || 'RATTATA';
    const given = param ? String(param).split(',').map((s) => s.trim().toUpperCase()).filter((s) => db.species[s]) : [];
    return given.length ? given : Array.from({ length: n }, pick);
  }

  /** Movimientos de un parámetro (?pmoves=EMBER,TOXIC) o undefined (los aprendidos por nivel). */
  moveList(param) {
    const list = param ? String(param).split(',').map((s) => s.trim().toUpperCase()).filter((m) => engine.data.moves[m]) : [];
    return list.length ? list.slice(0, 4) : undefined;
  }

  mk(species, level, rng, extra = {}) {
    const db = engine.data;
    const opts = { rng, ...extra };
    if (this.params.mega) {
      const mega = Object.values(db.species[species]?.forms || {}).find((f) => f.megaStone);
      if (mega) opts.heldItem = mega.megaStone;
    }
    return createPokemon(db, species, level, opts);
  }

  /** Partida de pruebas con el equipo pedido (o la actual si ya hay una). */
  prepareState(rng) {
    const p = this.params;
    const foeLv = Number(p.lv) || 30;
    const plv = Number(p.plv) || foeLv + 2;
    if (!this.state) {
      const st = GameState.create({ name: 'Axis', gender: p.gender === 'F' ? 'F' : 'M' });
      st.obtainPokedex?.();
      for (const [id, n] of Object.entries(DEV_BAG)) st.addItem(id, n);
      if (p.mega) st.addKeyItem?.('MEGARING');
      engine.state = st;
      this.state = st;
    }
    const moves = this.moveList(p.pmoves);
    const party = this.speciesList(p.party, 3, rng).slice(0, 6).map((sp) => this.mk(sp, plv, rng, { ot: { name: 'Axis', id: this.state.player.id }, moves }));
    if (p.full === '1') while (party.length < 6) party.push(this.mk('RATTATA', plv, rng));
    this.state.setParty(party);
    return { foeLv };
  }

  buildRequest() {
    const rng = createRng(this.seed);
    const p = this.params;
    const { foeLv } = this.prepareState(rng);
    const double = p.double === '1';
    const trainer = p.trainer;
    const foeCount = trainer ? 3 : double ? 2 : 1;
    const fmoves = this.moveList(p.fmoves);
    const foes = this.speciesList(p.foe, foeCount, rng).slice(0, 6).map((sp) => ({ species: sp, level: foeLv, shiny: p.shiny === '1', moves: fmoves }));
    const req = {
      seed: this.seed,
      type: trainer ? 'trainer' : 'wild',
      format: double ? 'double' : 'single',
      weather: p.weather || null,
      terrain: p.terrain || null,
      battleback: p.bg || 'field',
      environment: p.env || 'Grass',
      time: p.time === 'night' ? 'night' : 'day',
      auto: p.auto || null,
      player: { name: this.state.player.name, gender: this.state.player.gender, id: this.state.player.id, party: this.state.party, bag: this.state.data.bag },
    };
    if (trainer && trainer !== '1') {
      req.trainer = trainer;
    } else if (trainer) {
      req.trainer = {
        id: 'dev', name: 'Pablo', class: 'Joven', sprite: 'anil:CHICO', party: foes, ai: 48, money: 20,
        loseText: '¡Vaya! ¡Me has ganado!', items: ['POTION'],
      };
    } else {
      req.opponent = { party: foes.map((f) => this.mk(f.species, f.level, rng, { shiny: f.shiny, moves: f.moves })) };
      for (const f of req.opponent.party) this.state.registerSeen(f.species);
    }
    return req;
  }

  async launch() {
    this.running = true;
    this.result = null;
    this.error = null;
    if (this.params.minimal === '1') engine.state?.setOption?.('battleScene', false);
    try {
      const req = this.buildRequest();
      engine.audio?.pushBGM?.();
      this.result = await runSceneBattle(req);
    } catch (err) {
      this.error = err.message;
      engine.reportError(err);
    } finally {
      engine.audio?.resumeBGM?.(20);
      this.running = false;
    }
  }

  update() {
    this.t += 1;
    if (!this.running && engine.input.pressed('A')) {
      this.seed += 1;
      this.launch();
    }
  }

  drawUI(g) {
    g.fillStyle = '#10141c';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    if (this.running) return;
    const lines = [];
    if (this.error) lines.push(`Error: ${this.error}`);
    if (this.result) {
      const r = this.result;
      lines.push(`Fin del combate: ${OUTCOME_TEXT[r.outcome] || r.outcome} (${r.turns ?? 0} rondas)`);
      if (r.caught) lines.push(`Capturado: ${engine.data.species[r.caught.species]?.name || r.caught.species}`);
      lines.push(`Dinero: ${r.moneyChange >= 0 ? '+' : ''}${r.moneyChange ?? 0} $ · Equipo: ${r.party?.length ?? 0}`);
      if (r.pendingEvolutions?.length) lines.push(`Evoluciones: ${r.pendingEvolutions.map((e) => e.species).join(', ')}`);
    }
    lines.push('A: nuevo combate');
    lines.forEach((l, i) => drawText(g, l, SCREEN_W / 2, 120 + i * 34, { align: 'center', color: i === lines.length - 1 ? '#b9ff66' : '#f8f8f8', shadow: '#303030' }));
  }
}
