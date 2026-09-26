// Modo desarrollador: páginas de progreso — saltar al inicio de un bloque, flags, variables y Zygarde
// (células, núcleos, capacidades, forma), Fragmentos, Tablillas, destinos de Vuelo y Pokédex.
import { CAPABILITIES, CORE_IDS, TOTAL_CELLS } from '../content/zygarde/thresholds.js';
import { CAMPAIGN_TABLETS } from '../content/story/tablets.js';
import { BLOCK_STARTS } from './devBlocks.js';
import { applyBlockStart, activeFlags, searchFlags, toggleFlag, varEntries, parseVarValue, cleanKey, knownFlags } from './devProgress.js';
import {
  setCellCount, setCoreCount, setCapability, setZygardeFormDev, cycleForm, unlockAllZygarde, setFragmentCount,
  setTabletCount, unlockAllFlyPoints, registerWholeDex, MAX_FRAGMENTS,
} from './devZygarde.js';
import { askInt } from './devPagesTeam.js';
import { refreshAfterMenu } from './devRuntime.js';

const onOff = (v) => (v ? 'SÍ' : 'no');
const FORM_LABELS = { null: 'sin Zygarde', core: 'Core', 10: '10 %', 50: '50 %', complete: 'Completa' };
const formLabel = (f) => FORM_LABELS[f ?? 'null'] || String(f);

// ------------------------------------------------------------------ bloques

/** Acción: aplicar el estado de entrada del bloque y viajar a su casilla de inicio. */
export function blockAction(preset, { party = true } = {}) {
  return {
    type: 'dev',
    label: `bloque ${preset.id}`,
    async run(ctx) {
      const to = applyBlockStart(ctx.state, ctx.db, preset, { party });
      await ctx.warp(to.mapId, to.x, to.y, to.dir, { fade: true, frames: 12 });
      ctx.ui.toast(`Inicio de ${preset.id}: ${preset.title}`);
    },
  };
}

async function chooseBlock(dev, preset) {
  const i = await dev.menu.pick(`${preset.id} · ${preset.title}`, [
    'Aplicar estado y viajar al inicio',
    'Aplicar estado sin cambiar el equipo',
  ], preset.notes || '');
  if (i === 0 || i === 1) dev.menu.close(blockAction(preset, { party: i === 0 }));
}

export const blocksPage = {
  title: 'Saltar al inicio de un bloque',
  hint: 'Deja flags, variables, Zygarde, Fragmentos y Tablillas como al empezar el bloque (el equipo anterior va al PC).',
  items() {
    return BLOCK_STARTS.map((b) => ({
      label: `${b.id} · ${b.title}`,
      value: b.map,
      hint: b.notes || `${b.map} (${b.x},${b.y})`,
      run: (d) => chooseBlock(d, b),
    }));
  },
};

// ------------------------------------------------------------------ flags y variables

export const flagsPage = {
  title: 'Flags',
  search: true,
  hint: 'Intro activa/desactiva. Escribe para buscar; si no existe, se ofrece crearlo.',
  items(dev, query) {
    const list = searchFlags(dev.state, query, knownFlags(BLOCK_STARTS));
    const rows = list.map((f) => ({
      label: f.key, value: onOff(f.on),
      run: (d) => d.menu.status(`${f.key}: ${onOff(toggleFlag(d.state, f.key))}`),
    }));
    const q = String(query || '').trim();
    if (q && !list.some((f) => f.key === q)) {
      rows.unshift({
        label: `Activar flag nuevo «${q}»`,
        run: (d) => { d.state.setFlag(cleanKey(q), true); d.menu.status(`${q}: SÍ`); },
      });
    }
    return rows;
  },
};

async function editVar(dev, key) {
  const k = key ?? await dev.menu.prompt({ title: 'Variable nueva', hint: 'Nombre de la variable (sin espacios).', validate: (t) => { try { cleanKey(t); return null; } catch (e) { return e.message; } } });
  if (k === null) return;
  const name = cleanKey(k);
  const current = name in dev.state.data.vars ? String(dev.state.data.vars[name]) : '';
  const text = await dev.menu.prompt({ title: name, initial: current, hint: 'Valor: número, true/false o texto. Vacío = borrar la variable.' });
  if (text === null) return;
  if (!String(text).trim()) {
    dev.state.clearVar(name);
    dev.menu.status(`${name} borrada.`);
    return;
  }
  dev.state.setVar(name, parseVarValue(text));
  dev.menu.status(`${name} = ${JSON.stringify(dev.state.var(name))}`);
}

export const varsPage = {
  title: 'Variables',
  search: true,
  items(dev, query) {
    const q = String(query || '').toLowerCase();
    const rows = varEntries(dev.state)
      .filter((v) => !q || v.key.toLowerCase().includes(q))
      .map((v) => ({ label: v.key, value: JSON.stringify(v.value), run: (d) => editVar(d, v.key) }));
    return [{ label: 'Nueva variable…', run: (d) => editVar(d, null) }, ...rows];
  },
};

// ------------------------------------------------------------------ Zygarde

const capabilitiesPage = {
  title: 'Capacidades de Zygarde',
  hint: 'Intro activa/desactiva (activar también pone la forma y los flags como en el juego).',
  items(dev) {
    return CAPABILITIES.map((c) => ({
      label: c.name, value: onOff(dev.state.zygardeAbility(c.key)), hint: c.desc || c.key,
      run: (d) => { const on = !d.state.zygardeAbility(c.key); setCapability(d.state, c.key, on); d.menu.status(`${c.name}: ${onOff(on)}`); },
    }));
  },
};

async function askCount(dev, title, max, initial, apply) {
  const n = await askInt(dev.menu, { title, hint: `Número (0–${max}).`, min: 0, max, initial });
  if (n === null) return;
  const got = apply(dev.state, n);
  dev.menu.status(`${title}: ${got}`);
}

export const zygardePage = {
  title: 'Zygarde y progreso',
  items(dev) {
    const st = dev.state;
    const z = st.data.zygarde;
    return [
      { label: 'Células…', value: `${st.cellCount()}/${TOTAL_CELLS}`, run: (d) => askCount(d, 'Células', TOTAL_CELLS, st.cellCount(), setCellCount) },
      { label: 'Núcleos…', value: `${z.cores.length}/${CORE_IDS.length}`, run: (d) => askCount(d, 'Núcleos', CORE_IDS.length, z.cores.length, setCoreCount) },
      {
        label: 'Forma de campo (cambiar)', value: formLabel(st.zygardeForm),
        hint: 'Cicla: sin Zygarde → Core → 10 % → 50 % → Completa.',
        run: (d) => { const f = setZygardeFormDev(d.state, cycleForm(d.state.zygardeForm)); d.menu.status(`Forma: ${formLabel(f)}`); },
      },
      { label: 'Capacidades…', value: `${CAPABILITIES.filter((c) => st.zygardeAbility(c.key)).length}/${CAPABILITIES.length}`, run: (d) => d.menu.push(capabilitiesPage) },
      { label: 'Todo Zygarde (100 células, 5 núcleos, todo)', run: (d) => { unlockAllZygarde(d.state); d.menu.status('Zygarde completo.'); } },
      { label: 'Fragmentos Azur…', value: `${st.data.fragments.length}/${MAX_FRAGMENTS}`, run: (d) => askCount(d, 'Fragmentos Azur', MAX_FRAGMENTS, st.data.fragments.length, setFragmentCount) },
      { label: 'Tablillas…', value: `${st.data.tablets.length}/${CAMPAIGN_TABLETS.length}`, run: (d) => askCount(d, 'Tablillas', CAMPAIGN_TABLETS.length, st.data.tablets.length, setTabletCount) },
      { label: 'Desbloquear todos los destinos de Vuelo', value: st.data.flyPoints.length, run: (d) => d.menu.status(`${unlockAllFlyPoints(d.state)} destinos de Vuelo desbloqueados.`) },
      { label: 'Pokédex: registrar todos como vistos', run: (d) => d.menu.status(`${registerWholeDex(d.state, d.db)} especies vistas.`) },
      { label: 'Pokédex: registrar todos como capturados', run: (d) => d.menu.status(`${registerWholeDex(d.state, d.db, { caught: true })} especies capturadas.`) },
    ];
  },
};

export const progressPage = {
  title: 'Progreso',
  items(dev) {
    return [
      { label: 'Saltar al inicio de un bloque…', value: `${BLOCK_STARTS.length} bloques`, run: (d) => d.menu.push(blocksPage) },
      { label: 'Flags…', value: `${activeFlags(dev.state).length} activos`, run: (d) => d.menu.push(flagsPage) },
      { label: 'Variables…', value: varEntries(dev.state).length, run: (d) => d.menu.push(varsPage) },
      { label: 'Zygarde, Fragmentos, Vuelo, Pokédex…', run: (d) => d.menu.push(zygardePage) },
      { label: 'Refrescar eventos del mapa', hint: 'Vuelve a evaluar las páginas de los eventos con los flags actuales.', run: (d) => { refreshAfterMenu(d.scene); d.menu.status('Eventos refrescados.'); } },
    ];
  },
};
