// Modo desarrollador: páginas de mundo — teletransporte, interruptores, hora, clima y guardar.
import { MAPS } from '../content/maps/index.js';
import { WEATHER_TYPES } from '../render/weather.js';
import { ui } from '../ui/api.js';
import { mapCatalog, searchMaps } from './devMaps.js';
import { parseCoords } from './devArrival.js';
import { setClock, parseClock, CLOCK_PRESETS, WEATHER_LABELS } from './devEnv.js';
import { teleportAction, switchValue, toggleSwitch, setDevWeather, refreshAfterMenu } from './devRuntime.js';

let catalog = null;
const mapsCatalog = () => { catalog = catalog || mapCatalog(MAPS); return catalog; };
const onOff = (v) => (v ? 'SÍ' : 'no');
const coordsHint = 'Escribe «x,y» (o «x,y,dir» con dir 2/4/6/8). Si la casilla no vale, se usa la válida más cercana.';

/** Pide «x,y» y devuelve { x, y, dir? } o null. */
export async function askCoords(menu, title, initial = '') {
  const text = await menu.prompt({
    title, initial, hint: coordsHint,
    validate: (t) => (parseCoords(t) ? null : 'Formato: x,y (números enteros).'),
  });
  return text === null ? null : parseCoords(text);
}

/** Elegir un mapa → llegada automática o casilla escrita. */
async function chooseMap(dev, m) {
  const label = `${m.name} (${m.id})`;
  const i = await dev.menu.pick(label, ['Llegada automática (inicio, Vuelo, puerta, conexión o centro)', 'Escribir casilla x,y…']);
  if (i === 0) dev.menu.close(teleportAction(m.id, null, label));
  if (i === 1) {
    const c = await askCoords(dev.menu, `${label}: casilla`);
    if (c) dev.menu.close(teleportAction(m.id, c, label));
  }
}

export const teleportPage = {
  title: 'Teletransporte',
  search: true,
  hint: 'Busca por nombre, id o bloque («zaguan», «ruinas», «B02»).',
  items(dev, query) {
    const list = query ? searchMaps(mapsCatalog(), query) : mapsCatalog().maps;
    const here = dev.scene?.world?.map?.id;
    const top = [];
    if (!query && here) {
      top.push({
        label: `Mapa actual (${here}): escribir casilla x,y…`,
        hint: coordsHint,
        async run(d) {
          const p = d.scene.world.player;
          const c = await askCoords(d.menu, 'Mapa actual: casilla', `${p.x},${p.y}`);
          if (c) d.menu.close(teleportAction(here, c, here));
        },
      });
    }
    return [...top, ...list.map((m) => ({
      label: `${m.group} · ${m.name}`,
      value: m.id,
      hint: `${m.name} — id ${m.id} (${m.group})`,
      run: (d) => chooseMap(d, m),
    }))];
  },
};

const SWITCHES = [
  ['through', 'Atravesar paredes', 'Caminar a través de muros, agua y eventos (también tecla G con ?debug).'],
  ['noEncounters', 'Sin encuentros salvajes', 'No salen Pokémon salvajes al andar por hierba, cuevas o agua.'],
  ['fastRun', 'Carrera ×2', 'Mantén Mayús: corres (o galopas) el doble de rápido.'],
];

async function chooseClock(dev) {
  const options = [...CLOCK_PRESETS.map(([l]) => l), 'Escribir hora HH:MM…'];
  const i = await dev.menu.pick('Hora del día', options);
  if (i === null) return;
  let hour;
  let minute = 0;
  if (i < CLOCK_PRESETS.length) hour = CLOCK_PRESETS[i][1];
  else {
    const t = await dev.menu.prompt({ title: 'Hora', hint: 'Escribe la hora: «22» o «06:30».', validate: (s) => (parseClock(s) ? null : 'Formato: HH o HH:MM.') });
    if (t === null) return;
    ({ hour, minute } = parseClock(t));
  }
  setClock(dev.state, hour, minute);
  dev.menu.status(`Hora: ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
}

async function chooseWeather(dev) {
  const types = ['auto', ...WEATHER_TYPES];
  const labels = types.map((t) => (t === 'auto' ? 'Automático (el del mapa)' : WEATHER_LABELS[t] || t));
  const i = await dev.menu.pick('Clima', labels);
  if (i === null) return;
  await setDevWeather(dev.scene, types[i]);
  dev.menu.status(`Clima: ${labels[i]}`);
}

export const worldPage = {
  title: 'Interruptores y entorno',
  items(dev) {
    const clock = dev.state.data.clock?.minutes ?? 0;
    const hh = String(Math.floor(clock / 60)).padStart(2, '0');
    const mm = String(clock % 60).padStart(2, '0');
    const weather = dev.scene?.devWeather ? WEATHER_LABELS[dev.scene.devWeather[0]] || dev.scene.devWeather[0] : 'auto';
    return [
      ...SWITCHES.map(([key, label, hint]) => ({
        label, hint, value: onOff(switchValue(dev.scene, key)),
        run: (d) => d.menu.status(`${label}: ${onOff(toggleSwitch(d.scene, key))}`),
      })),
      { label: 'Hora del día…', value: `${hh}:${mm}`, hint: 'El reloj de juego sigue corriendo desde la hora elegida.', run: chooseClock },
      { label: 'Clima…', value: weather, hint: 'Clima forzado mientras no cierres el juego («Automático» vuelve al del mapa).', run: chooseWeather },
    ];
  },
};

/** Guardar en cualquier sitio (menú de ranuras normal). */
export async function saveAnywhere(dev) {
  const s = dev.scene;
  if (s?.world) {
    const p = s.world.player;
    dev.state.setPosition(s.world.map.id, p.x, p.y, p.direction);
    refreshAfterMenu(s);
  }
  const saved = await ui.openSave();
  dev.menu.status(saved ? 'Partida guardada aquí.' : 'No se ha guardado.');
}
