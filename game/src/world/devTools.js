// Herramientas de desarrollo del mapa (solo con ?debug o parámetros de URL):
//   ?time=HH[:MM]  ?weather=rain[:7]  ?mode=visible|classic  ?zygarde=all|ram,climb…  ?dark=1
//   ?through=1  ?fx=aurora,moon,cracks  ?follower=0  ?flags=a,b  ?vars=k:v  ?core=1
//   ?party=none | ?party=TURTWIG:5,BIDOOF:3   ?fragments=N (Fragmentos Azur F01…F0N)
// Teclas (con ?debug): T +1 h · Y clima siguiente · U oscuridad · G atravesar muros · N modo encuentros
//   B efectos de crisis · J probar transición de combate · K encuentro salvaje ahora · L luz de linterna
import { WEATHER_TYPES } from '../render/weather.js';
import { TRANSITION_NAMES } from '../render/transitionShaders.js';
import { engine } from '../core/engine.js';
import { createPokemon } from '../battle/core/pokemon.js';

const ZYGARDE_KEYS = ['run', 'ram', 'terrain', 'climb', 'swim', 'detect', 'dive', 'fly', 'rebuild'];

export function applyDevParams(scene, params) {
  const state = scene.state;
  if (params.time) {
    const [h, m = 0] = String(params.time).split(':').map(Number);
    if (Number.isFinite(h)) state.data.clock.minutes = ((h * 60 + m) % 1440 + 1440) % 1440;
  }
  if (params.mode === 'visible' || params.mode === 'classic') state.setOption('encounterMode', params.mode);
  if (params.zygarde) {
    const keys = params.zygarde === 'all' ? ZYGARDE_KEYS : String(params.zygarde).split(',');
    for (const k of keys) state.setZygardeAbility(k.trim(), true);
  }
  if (params.follower === '0') state.setOption('followerEnabled', false);
  if (params.through === '1') scene.world.debugThrough = true;
  if (params.noenc === '1') scene.noEncounters = true;
  // ?flags=a,b  ?vars=clave:valor,…  ?core=1 (el Core de Zygarde acompaña al jugador)
  if (params.flags) for (const k of String(params.flags).split(',')) if (k.trim()) state.setFlag(k.trim());
  if (params.vars) {
    for (const kv of String(params.vars).split(',')) {
      const [k, v = '1'] = kv.split(':');
      if (k.trim()) state.setVar(k.trim(), Number.isFinite(Number(v)) ? Number(v) : v);
    }
  }
  if (params.core === '1' && !state.data.zygarde.form) state.data.zygarde.form = 'core';
  // ?fragments=N: Fragmentos Azur F01…F0N (cadena de resonancia de los Pilares; aditivo B06)
  if (params.fragments) {
    const n = Math.max(0, Math.min(10, Number(params.fragments) || 0));
    for (let i = 1; i <= n; i++) {
      const id = `F${String(i).padStart(2, '0')}`;
      if (!(state.data.fragments || []).includes(id)) state.addFragment(id);
    }
  }
  if (params.party) applyDevParty(state, String(params.party));
  scene.devWeather = params.weather ? String(params.weather).split(':') : null;
  scene.devDark = params.dark === '1';
  scene.devFx = params.fx ? String(params.fx).split(',') : [];
}

/** ?party=none (equipo vacío) o ?party=TURTWIG:5,BIDOOF:3 (sustituye el equipo de prueba). */
function applyDevParty(state, spec) {
  if (spec === 'none' || spec === '0') { state.setParty([]); return; }
  const list = [];
  for (const item of spec.split(',')) {
    const [species, lv = '5'] = item.trim().toUpperCase().split(':');
    try {
      list.push(createPokemon(engine.data, species, Number(lv) || 5, { ot: { name: state.player.name, id: state.player.id } }));
    } catch (err) {
      console.warn(`?party: no se pudo crear ${species}`, err);
    }
  }
  if (list.length) state.setParty(list);
}

/** Efectos de demostración (?fx=aurora,moon,cracks o tecla B). */
export function spawnDemoFx(scene, names = ['aurora', 'moon', 'cracks']) {
  const p = scene.world.player;
  const handles = [];
  for (const n of names) {
    if (n === 'aurora') handles.push(scene.effects.add('aurora'));
    if (n === 'moon') handles.push(scene.effects.add('moon', { x: 400, y: 70, radius: 52 }));
    if (n === 'cracks') handles.push(scene.effects.add('cracks', { x: p.x + 3, y: p.y - 2, length: 110, seed: 3 }));
    if (n === 'cell') handles.push(scene.effects.add('zygardeCell', { x: p.x + 1, y: p.y }));
  }
  return handles;
}

export function installDevKeys(scene) {
  let weatherIdx = 0;
  let transIdx = 0;
  let demo = null;
  const onKey = (e) => {
    if (!scene.ready || scene.engine?.scenes?.top !== scene) return;
    const st = scene.state;
    switch (e.code) {
      case 'KeyT': st.advanceMinutes(60); break;
      case 'KeyY': weatherIdx = (weatherIdx + 1) % WEATHER_TYPES.length; scene.weather.set(WEATHER_TYPES[weatherIdx], 6); break;
      case 'KeyU': scene.devDark = !scene.devDark; break;
      case 'KeyG': scene.world.debugThrough = !scene.world.debugThrough; break;
      case 'KeyN': st.setOption('encounterMode', st.options.encounterMode === 'visible' ? 'classic' : 'visible'); break;
      case 'KeyB':
        if (demo) { demo.forEach((h) => h.remove(30)); demo = null; } else demo = spawnDemoFx(scene);
        break;
      case 'KeyJ':
        if (!scene.runner.busy) {
          const name = TRANSITION_NAMES[transIdx % TRANSITION_NAMES.length];
          transIdx += 1;
          scene.runScript(async () => {
            await scene.fx.playTransition(name, 50);
            await scene.runner.wait(20);
            scene.fx.clearTransition();
          }, null, `transición ${name}`);
        }
        break;
      case 'KeyK': scene.forceEncounter(); break;
      case 'KeyL': scene.devFlashlight = !scene.devFlashlight; break;
      default: return;
    }
    e.preventDefault();
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}

export function drawDebug(scene, g) {
  const w = scene.world;
  const p = w.player;
  const st = scene.state;
  const m = st.data.clock.minutes;
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  const t = p.terrainTag();
  const lines = [
    `${w.map.id} (${p.x},${p.y}) dir ${p.direction} ${p.surfing ? 'surf' : ''}${w.debugThrough ? ' atravesar' : ''}`,
    `${hh}:${mm} · clima ${scene.weather.type} · ${st.options.encounterMode} · terreno ${t.id}`,
  ];
  g.save();
  g.font = '12px monospace';
  g.textBaseline = 'top';
  lines.forEach((line, i) => {
    const y = 2 + i * 13;
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(2, y, g.measureText(line).width + 6, 13);
    g.fillStyle = '#b9ff66';
    g.fillText(line, 5, y + 1);
  });
  g.restore();
}
