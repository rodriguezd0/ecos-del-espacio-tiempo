// Banco de pruebas del motor de combate (ruta de desarrollo ?scene=battle).
// NO es la escena de combate final: dibuja sprites, barras y menús sencillos sobre el canvas de UI
// e implementa la interfaz BattleUI (battle/core/battleUI.js) para poder jugar combates reales.
//
// Parámetros de URL (todos opcionales):
//   seed=123          semilla del combate y de los equipos aleatorios
//   party=PIKACHU,EEVEE   equipo del jugador (por defecto 3 especies aleatorias del inventario Axis)
//   foe=RATTATA,ZUBAT     rivales (por defecto aleatorios)   lv=30 (nivel rival)   plv=32 (nivel jugador)
//   double=1   trainer=1   weather=Rain   terrain=Grassy   mega=1 (da Megapiedra si existe)
// Controles: flechas para elegir, A (Z/Intro) aceptar, B (X/Esc) volver, R (E) activar megaevolución,
// mantener RUN (Mayús) para acelerar los mensajes.
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { Scene } from '../../core/scenes.js';
import { Battle, createRng, STAT_NAMES } from '../core/index.js';
import { createPokemon, speciesData } from '../core/pokemon.js';
import { drawPokemonSprite, preloadPokemon } from '../../ui/core/pokemonGfx.js';

const FONT = '"Power Green", monospace';
const LOG_LINES = 3;
const BRIEF_FRAMES = 24;
const STATUS_TAG = { SLEEP: 'DOR', POISON: 'ENV', BURN: 'QUE', PARALYSIS: 'PAR', FROZEN: 'CON', FROSTBITE: 'HEL' };
const OUTCOME_TEXT = { win: 'Victoria', lose: 'Derrota', run: 'Huida', caught: 'Captura', draw: 'Empate', forfeit: 'Abandono' };
// Posiciones de los combatientes (índice → centro del sprite) en individual y doble.
const POS_SINGLE = { 0: [130, 238], 1: [380, 118] };
const POS_DOUBLE = { 0: [90, 244], 2: [200, 256], 1: [330, 110], 3: [440, 122] };

export default class DevBattleScene extends Scene {
  async enter(params = {}) {
    this.params = params;
    this.t = 0;
    this.seed = Number(params.seed) || Math.floor(Math.random() * 1e9);
    this.startBattle();
  }

  // ---------------------------------------------------------------- preparación
  buildConfig() {
    const db = engine.data;
    const rng = createRng(this.seed);
    const axis = (db.dex?.entries || []).map((e) => e.id).filter((id) => db.species[id]);
    const pick = () => axis[Math.floor(rng() * axis.length)] || 'RATTATA';
    const list = (param, n) => (param ? String(param).split(',').map((s) => s.trim().toUpperCase()).filter((s) => db.species[s]) : [])
      .concat(Array.from({ length: n }, pick)).slice(0, Math.max(n, 1));
    const mk = (sp, lv) => {
      const opts = { rng };
      if (this.params.mega) {
        const forms = db.species[sp]?.forms || {};
        const mega = Object.values(forms).find((f) => f.megaStone);
        if (mega) opts.heldItem = mega.megaStone;
      }
      return createPokemon(db, sp, lv, opts);
    };
    const double = this.params.double === '1';
    const trainer = this.params.trainer === '1';
    const foeLv = Number(this.params.lv) || 30;
    const plv = Number(this.params.plv) || foeLv + 2;
    const playerParty = list(this.params.party, 3).slice(0, 6).map((sp) => mk(sp, plv));
    const foeCount = trainer ? 3 : double ? 2 : 1;
    const foeParty = list(this.params.foe, foeCount).slice(0, Math.max(foeCount, 1)).map((sp) => mk(sp, foeLv));
    return {
      db: {
        species: db.species, moves: db.moves, abilities: db.abilities, items: db.items, types: db.types, trainerTypes: db.trainerTypes,
      },
      seed: this.seed,
      type: trainer ? 'trainer' : 'wild',
      format: double ? 'double' : 'single',
      weather: this.params.weather || 'None',
      terrain: this.params.terrain || 'None',
      player: { name: 'Axis', party: playerParty, money: 3000, bag: { POTION: 5, SUPERPOTION: 2, FULLHEAL: 2, POKEBALL: 10, GREATBALL: 5, XATTACK: 2 } },
      opponent: trainer ? { name: 'Dev', party: foeParty, skill: 48 } : { party: foeParty },
    };
  }

  startBattle() {
    this.log = [];
    this.prompt = null;
    this.waiting = null;
    this.banner = null;
    this.result = null;
    this.error = null;
    this.megaToggle = false;
    let config;
    try {
      config = this.buildConfig();
    } catch (err) {
      this.error = err.message;
      return;
    }
    preloadPokemon([...config.player.party, ...config.opponent.party], { sprites: true });
    for (const p of config.player.party) preloadPokemon([p], { sprites: true });
    this.battle = new Battle(config, this);
    this.battle.run()
      .then((result) => { this.result = result; })
      .catch((err) => {
        this.error = err.message;
        engine.reportError(err);
      });
  }

  // ---------------------------------------------------------------- BattleUI
  message(text, opts = {}) {
    this.log.push(text);
    if (this.log.length > 40) this.log.shift();
    return new Promise((resolve) => {
      this.waiting = { resolve, frames: opts.brief ? BRIEF_FRAMES : Infinity, age: 0 };
    });
  }

  abilitySplash(view, visible) {
    if (visible) this.banner = { text: `${view.name}: ${view.abilityName || view.ability || ''}`, side: view.side, age: 0 };
  }

  animateStat(view, stat, stages) {
    this.banner = { text: `${view.name} ${stages > 0 ? '▲' : '▼'} ${STAT_NAMES[stat] || stat}`, side: view.side, age: 0 };
  }

  end(result) {
    this.result = result;
  }

  /** Muestra un menú y resuelve con el `value` de la opción elegida (o `cancel`). */
  menu(title, options, { cancel, allowCancel = cancel !== undefined, extra = null } = {}) {
    return new Promise((resolve) => {
      const first = Math.max(0, options.findIndex((o) => !o.disabled));
      this.prompt = { title, options, index: first, resolve, cancel, allowCancel, extra };
    });
  }

  chooseAction(battler, ctx) {
    const opts = [
      { label: 'Luchar', value: 'fight' },
      { label: 'Mochila', value: 'bag', disabled: !ctx.canUseItems },
      { label: 'Pokémon', value: 'pokemon', disabled: !ctx.canSwitch },
      { label: ctx.firstAction ? 'Huir' : 'Volver', value: ctx.firstAction ? 'run' : 'cancel', disabled: ctx.firstAction && !ctx.canRun },
    ];
    return this.menu(`¿Qué hará ${battler.name}?`, opts);
  }

  chooseMove(battler, moves, ctx) {
    this.megaToggle = false;
    const typeName = (t) => engine.data.types[t]?.name || t || '???';
    const opts = moves.map((m) => ({
      label: `${m.name}  ${typeName(m.type)}  PP ${m.pp}/${m.totalPP}`,
      value: m.index,
      disabled: !m.selectable,
    }));
    const extra = ctx.canMega ? () => `[R] Megaevolución: ${this.megaToggle ? 'SÍ' : 'no'}` : null;
    return this.menu('Movimientos', opts, { cancel: null, extra, megaAllowed: ctx.canMega })
      .then((v) => (v === null ? null : { index: v, mega: ctx.canMega && this.megaToggle }));
  }

  chooseTarget(battler, move, candidates) {
    const opts = candidates.map((c) => ({ label: `${c.battler.name}${c.battler.side === 1 ? ' (rival)' : ''}`, value: c.index }));
    return this.menu(`¿A quién? (${move.name})`, opts, { cancel: -1 });
  }

  chooseSwitch(ctx) {
    const revive = ctx.reason === 'revive';
    const opts = ctx.party.filter((p) => p.owned !== false).map((p) => ({
      label: `${p.name} Nv.${p.pokemon.level}  PS ${p.pokemon.hp}${p.active ? '  (en combate)' : ''}`,
      value: p.partyIndex,
      disabled: revive ? !p.fainted : (!p.able || p.active || p.chosen),
    }));
    return this.menu(revive ? '¿A quién revivir?' : '¿Qué Pokémon sacar?', opts, ctx.canCancel ? { cancel: -1 } : {});
  }

  async chooseItem(battler, ctx) {
    const opts = ctx.bag.map((it) => ({ label: `${it.name} ×${it.qty}`, value: it }));
    const it = await this.menu('Mochila', opts, { cancel: null });
    if (!it) return null;
    let target = battler.partyIndex;
    if (['OnPokemon', 'OnMove'].includes(it.battleUse)) {
      const t = await this.menu(`¿En quién usar ${it.name}?`, ctx.party.filter((p) => p.owned !== false)
        .map((p) => ({ label: `${p.name}  PS ${p.pokemon.hp}`, value: p.partyIndex })), { cancel: -1 });
      if (t < 0) return null;
      target = t;
    }
    let move = -1;
    if (it.battleUse === 'OnMove') {
      const pk = ctx.party.find((p) => p.partyIndex === target).pokemon;
      move = await this.menu('¿Qué movimiento?', pk.moves.map((m, i) => ({ label: engine.data.moves[m.id]?.name || m.id, value: i })), { cancel: -1 });
      if (move < 0) return null;
    }
    return { item: it.id, target, move };
  }

  confirm(text) {
    this.log.push(text);
    return this.menu(text, [{ label: 'Sí', value: true }, { label: 'No', value: false }], { cancel: false });
  }

  learnMove(pokemon, moveId) {
    const name = engine.data.moves[moveId]?.name || moveId;
    const opts = pokemon.moves.map((m, i) => ({ label: `Olvidar ${engine.data.moves[m.id]?.name || m.id}`, value: i }));
    opts.push({ label: `No aprender ${name}`, value: null });
    return this.menu(`¿Qué movimiento olvidar para aprender ${name}?`, opts, { cancel: null });
  }

  // ---------------------------------------------------------------- bucle
  update() {
    this.t += 1;
    const input = engine.input;
    if (this.banner && ++this.banner.age > 70) this.banner = null;
    if (this.prompt) {
      this.updatePrompt(input);
      return;
    }
    if (this.waiting) {
      const w = this.waiting;
      w.age += 1;
      const fast = input.held('RUN') && w.age > 4;
      if (input.pressed('A') || input.pressed('B') || fast || w.age >= w.frames) {
        this.waiting = null;
        w.resolve();
      }
      return;
    }
    if ((this.result || this.error) && input.pressed('A')) {
      this.seed += 1;
      this.startBattle();
    }
  }

  updatePrompt(input) {
    const p = this.prompt;
    const n = p.options.length;
    const step = (d) => {
      for (let k = 1; k <= n; k++) {
        const i = (p.index + d * k + n * 4) % n;
        if (!p.options[i].disabled) { p.index = i; return; }
      }
    };
    if (input.repeat('UP')) step(-1);
    if (input.repeat('DOWN')) step(1);
    if (p.extra && input.pressed('R')) this.megaToggle = !this.megaToggle;
    if (input.pressed('A') && n > 0 && !p.options[p.index].disabled) {
      this.prompt = null;
      p.resolve(p.options[p.index].value);
    } else if (input.pressed('B') && p.allowCancel) {
      this.prompt = null;
      p.resolve(p.cancel);
    }
  }

  // ---------------------------------------------------------------- dibujo
  drawUI(g) {
    const grad = g.createLinearGradient(0, 0, 0, SCREEN_H);
    grad.addColorStop(0, '#2c4a6e');
    grad.addColorStop(0.55, '#6f9a5a');
    grad.addColorStop(1, '#3d5a33');
    g.fillStyle = grad;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath();
    g.ellipse(380, 150, 90, 18, 0, 0, Math.PI * 2);
    g.ellipse(140, 282, 110, 22, 0, 0, Math.PI * 2);
    g.fill();
    if (this.error && !this.battle) {
      this.text(g, `Error: ${this.error}`, 16, 40, '#ffb0b0', 16);
      return;
    }
    const b = this.battle;
    if (!b) return;
    const pos = b.pbSideSize(0) > 1 || b.pbSideSize(1) > 1 ? POS_DOUBLE : POS_SINGLE;
    for (const battler of b.battlers) {
      if (!battler || !battler.pokemon || battler.isFainted()) continue;
      const v = battler.view();
      const [x, y] = pos[battler.index] || [0, 0];
      drawPokemonSprite(g, v, x, y, { t: this.t, back: v.side === 0, scale: v.side === 0 ? 2 : 1.6 });
    }
    b.battlers.forEach((battler) => {
      if (battler && battler.pokemon) this.drawDataBox(g, battler.view());
    });
    this.drawField(g, b);
    if (this.banner) this.drawBanner(g);
    this.drawLog(g);
    if (this.prompt) this.drawPrompt(g);
    if (this.result && !this.waiting && !this.prompt) this.drawResult(g);
  }

  text(g, s, x, y, color = '#fff', size = 16, align = 'left') {
    g.font = `${size}px ${FONT}`;
    g.textAlign = align;
    g.fillStyle = 'rgba(0,0,0,0.6)';
    g.fillText(s, x + 1, y + 1);
    g.fillStyle = color;
    g.fillText(s, x, y);
  }

  drawDataBox(g, v) {
    const doubles = this.battle.pbSideSize(v.side) > 1;
    const slot = v.index >> 1;
    const w = 170;
    const x = v.side === 1 ? 12 + slot * 176 * (doubles ? 1 : 0) : SCREEN_W - w - 12 - (doubles ? (1 - slot) * 176 : 0);
    const y = v.side === 1 ? 10 + (doubles ? 0 : 0) : 196;
    g.fillStyle = v.fainted ? 'rgba(60,60,60,0.8)' : 'rgba(248,248,232,0.92)';
    g.fillRect(x, y, w, 46);
    g.strokeStyle = '#303030';
    g.strokeRect(x + 0.5, y + 0.5, w - 1, 45);
    const tags = `${v.mega ? '[M] ' : ''}${v.alpha ? '[α] ' : ''}${v.shiny ? '★ ' : ''}`;
    this.text(g, `${tags}${v.name}`, x + 6, y + 16, '#202020', 15);
    this.text(g, `Nv.${v.level}`, x + w - 6, y + 16, '#202020', 15, 'right');
    const frac = v.totalhp > 0 ? Math.max(0, v.hp / v.totalhp) : 0;
    g.fillStyle = '#404040';
    g.fillRect(x + 6, y + 22, w - 12, 8);
    g.fillStyle = frac > 0.5 ? '#38c058' : frac > 0.2 ? '#e8c020' : '#e04030';
    g.fillRect(x + 7, y + 23, Math.round((w - 14) * frac), 6);
    const st = v.status !== 'NONE' ? `${STATUS_TAG[v.status] || v.status}${v.toxic ? '+' : ''} ` : '';
    const stages = Object.entries(v.stages).filter(([, s]) => s !== 0).map(([k, s]) => `${k.slice(0, 3)}${s > 0 ? '+' : ''}${s}`).join(' ');
    this.text(g, `${st}${v.hp}/${v.totalhp} ${stages}`, x + 6, y + 42, '#303030', 12);
  }

  drawField(g, b) {
    const w = b.field.weather !== 'None' ? `Clima: ${b.field.weather}` : '';
    const t = b.field.terrain !== 'None' ? `Campo: ${b.field.terrain}` : '';
    const tr = b.field.effects.TrickRoom > 0 ? 'Espacio Raro' : '';
    const info = [`Ronda ${b.turnCount + 1}`, w, t, tr, `semilla ${this.seed}`].filter(Boolean).join(' · ');
    this.text(g, info, SCREEN_W - 8, 72, '#e8f0ff', 12, 'right');
  }

  drawBanner(g) {
    const y = this.banner.side === 1 ? 64 : 176;
    const x = this.banner.side === 1 ? 12 : SCREEN_W - 232;
    g.fillStyle = 'rgba(30,30,60,0.85)';
    g.fillRect(x, y, 220, 22);
    this.text(g, this.banner.text, x + 8, y + 16, '#ffe890', 14);
  }

  drawLog(g) {
    const y0 = SCREEN_H - 78;
    g.fillStyle = 'rgba(24,24,40,0.9)';
    g.fillRect(0, y0, SCREEN_W, 78);
    g.strokeStyle = '#c8c8e0';
    g.strokeRect(2.5, y0 + 2.5, SCREEN_W - 5, 73);
    const lines = this.log.slice(-LOG_LINES);
    lines.forEach((l, i) => {
      const last = i === lines.length - 1;
      this.text(g, l, 12, y0 + 22 + i * 22, last ? '#ffffff' : '#a8a8c0', 16);
    });
    if (this.waiting && Math.floor(this.t / 20) % 2 === 0) this.text(g, '▼', SCREEN_W - 20, SCREEN_H - 10, '#fff', 14);
  }

  drawPrompt(g) {
    const p = this.prompt;
    const w = 300;
    const rowH = 20;
    const h = 30 + p.options.length * rowH + (p.extra ? 20 : 0);
    const x = SCREEN_W - w - 8;
    const y = SCREEN_H - 82 - h;
    g.fillStyle = 'rgba(248,248,248,0.96)';
    g.fillRect(x, y, w, h);
    g.strokeStyle = '#303030';
    g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    this.text(g, p.title.length > 40 ? `${p.title.slice(0, 39)}…` : p.title, x + 8, y + 18, '#303060', 14);
    p.options.forEach((o, i) => {
      const yy = y + 38 + i * rowH;
      const color = o.disabled ? '#a0a0a0' : '#202020';
      if (i === p.index) this.text(g, '▶', x + 8, yy, '#c03030', 14);
      this.text(g, o.label, x + 24, yy, color, 14);
    });
    if (p.extra) this.text(g, p.extra(), x + 8, y + h - 8, '#306030', 13);
  }

  drawResult(g) {
    const r = this.result;
    g.fillStyle = 'rgba(0,0,0,0.7)';
    g.fillRect(96, 110, 320, 96);
    this.text(g, `Fin del combate: ${OUTCOME_TEXT[r.outcome] || r.outcome}`, SCREEN_W / 2, 140, '#ffffff', 18, 'center');
    const extra = r.caught ? `Capturado: ${speciesData(engine.data, r.caught.species).name}` : `Dinero: ${r.moneyChange >= 0 ? '+' : ''}${r.moneyChange}$`;
    this.text(g, extra, SCREEN_W / 2, 164, '#d0d0ff', 14, 'center');
    this.text(g, 'A: nuevo combate', SCREEN_W / 2, 190, '#b9ff66', 14, 'center');
  }
}
