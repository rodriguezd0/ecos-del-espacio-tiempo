// Modo desarrollador: páginas de equipo — dar Pokémon (cualquier especie y forma), nivel y variocolor de los
// miembros, curar, dar objetos (también los de items_axis.json) y dinero.
import { speciesData, MAX_LEVEL } from '../battle/core/pokemon.js';
import { ui } from '../ui/api.js';
import { formatMoney } from '../ui/logic/format.js';
import { speciesEntries, searchSpecies, itemEntries, searchItems, POCKET_NAMES } from './devSearch.js';
import { MIN_LEVEL, giveDevPokemon, givenText, giveDevItem, setMemberLevel, setMemberShiny, healParty, giveMoney } from './devPokemon.js';

let speciesCache = null;
let itemCache = null;
const LAST = { level: 50, count: 1 };

/** Pide un entero en [min, max]. Devuelve el número o null. */
export async function askInt(menu, { title, hint, min, max, initial }) {
  const text = await menu.prompt({
    title, hint, initial: String(initial ?? ''),
    validate: (t) => {
      const n = Number(String(t).trim());
      return Number.isInteger(n) && n >= min && n <= max ? null : `Escribe un número entero entre ${min} y ${max}.`;
    },
  });
  return text === null ? null : Number(String(text).trim());
}

async function giveSpecies(dev, entry) {
  const level = await askInt(dev.menu, {
    title: `${entry.label}: nivel`, hint: `Nivel de ${entry.label} (${MIN_LEVEL}–${MAX_LEVEL}).`, min: MIN_LEVEL, max: MAX_LEVEL, initial: LAST.level,
  });
  if (level === null) return;
  LAST.level = level;
  const shiny = await dev.menu.pick(`${entry.label} nv ${level}`, ['Normal', 'Variocolor ★']);
  if (shiny === null) return;
  const r = giveDevPokemon(dev.state, dev.db, { species: entry.species, form: entry.form, level, shiny: shiny === 1 });
  dev.menu.status(givenText(dev.db, r), r.where === 'none' ? 'error' : 'ok');
}

export const speciesPage = {
  title: 'Dar Pokémon',
  search: true,
  hint: 'Busca por nombre, id, número o forma («pikachu», «25», «zygarde completa», «mega»).',
  items(dev, query) {
    speciesCache = speciesCache || speciesEntries(dev.db);
    const list = query ? searchSpecies(dev.db, query, speciesCache) : speciesCache;
    return list.map((e) => ({ label: `#${String(e.num).padStart(4, '0')} ${e.label}`, value: e.species, run: (d) => giveSpecies(d, e) }));
  },
};

function memberLabel(db, p) {
  if (p.egg) return 'Huevo';
  const sp = speciesData(db, p.species, p.form);
  return `${p.nickname || sp.name}${p.shiny ? ' ★' : ''}`;
}

async function editMember(dev, index) {
  const p = dev.state.party[index];
  if (!p || p.egg) { dev.menu.status('Un huevo no tiene nivel.', 'error'); return; }
  const name = memberLabel(dev.db, p);
  const i = await dev.menu.pick(`${name} nv ${p.level}`, ['Cambiar nivel…', p.shiny ? 'Quitar variocolor' : 'Hacer variocolor ★', 'Ver datos']);
  if (i === 0) {
    const level = await askInt(dev.menu, { title: `${name}: nivel`, hint: `Nivel nuevo (${MIN_LEVEL}–${MAX_LEVEL}); no aprende movimientos nuevos.`, min: MIN_LEVEL, max: MAX_LEVEL, initial: p.level });
    if (level === null) return;
    const next = setMemberLevel(dev.state, dev.db, index, level);
    dev.menu.status(`${name} ahora es nivel ${next.level}.`);
  } else if (i === 1) {
    setMemberShiny(dev.state, index, !p.shiny);
    dev.menu.status(`${name}: ${p.shiny ? 'normal' : 'variocolor ★'}.`);
  } else if (i === 2) {
    await ui.openSummary(dev.state.party[index], { party: dev.state.party, index });
  }
}

export const partyPage = {
  title: 'Equipo',
  empty: 'El equipo está vacío.',
  items(dev) {
    return dev.state.party.map((p, i) => ({
      label: `${i + 1}. ${memberLabel(dev.db, p)}`,
      value: p.egg ? 'huevo' : `nv ${p.level} · PS ${p.hp}`,
      run: (d) => editMember(d, i),
    }));
  },
};

async function giveItem(dev, entry) {
  let count = 1;
  if (!entry.key) {
    count = await askInt(dev.menu, { title: `${entry.name}: cantidad`, hint: 'Cantidad (1–999).', min: 1, max: 999, initial: LAST.count });
    if (count === null) return;
    LAST.count = count;
  }
  const total = giveDevItem(dev.state, dev.db, entry.id, count);
  dev.menu.status(`${entry.name} ×${count} → Mochila (tienes ${total}).`);
}

export const itemsPage = {
  title: 'Dar objetos',
  search: true,
  hint: 'Busca por nombre o id («poción», «POTION», «fragmento», «tablilla»). Los objetos clave se dan de 1 en 1.',
  items(dev, query) {
    itemCache = itemCache || itemEntries(dev.db);
    const list = query ? searchItems(dev.db, query, itemCache) : itemCache;
    return list.map((e) => ({
      label: e.name,
      value: `${POCKET_NAMES[e.pocket] || e.pocket} · ${dev.state.itemCount(e.id)}`,
      hint: `${e.name} — id ${e.id}${e.key ? ' (objeto clave)' : ''}`,
      run: (d) => giveItem(d, e),
    }));
  },
};

async function changeMoney(dev) {
  const n = await askInt(dev.menu, { title: 'Dinero', hint: 'Suma (o resta con «-») dinero: p. ej. 50000 o -1000.', min: -9999999, max: 9999999, initial: 50000 });
  if (n === null) return;
  const total = giveMoney(dev.state, n);
  dev.menu.status(`Dinero: ${formatMoney(total)}`);
}

export const teamPage = {
  title: 'Pokémon y objetos',
  items(dev) {
    return [
      { label: 'Dar Pokémon…', hint: 'Cualquier especie y forma, nivel 1–100, variocolor opcional (equipo o caja).', run: (d) => d.menu.push(speciesPage) },
      { label: 'Equipo: nivel, variocolor…', value: `${dev.state.party.length}/6`, run: (d) => d.menu.push(partyPage) },
      {
        label: 'Curar el equipo', hint: 'PS, PP y estados.',
        run: (d) => { healParty(d.state, d.db); d.menu.status('Equipo curado.'); },
      },
      { label: 'Dar objetos…', run: (d) => d.menu.push(itemsPage) },
      { label: 'Dinero…', value: formatMoney(dev.state.player.money), run: changeMoney },
      { label: 'Abrir PC (cajas)', hint: 'El PC de almacenamiento normal.', run: () => ui.openStorage() },
    ];
  },
};
