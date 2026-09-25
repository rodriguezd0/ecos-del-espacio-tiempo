// Fachada de la UI usada por el resto del juego (guiones, mundo, combate).
// CONTRATO ESTABLE: mismas firmas que el stub original. Las pantallas se cargan bajo demanda.
// Sin DOM (tests con node --test) se comporta como el stub: registra y resuelve al instante.
//
// Códigos de texto (en JS escribe la barra doble '\\PN' o usa String.raw):
//   \n salto de línea · \f salto de página · \PN nombre del jugador · \PM dinero · \v[clave] variable
//   \c[n] color (1 azul, 2 rojo, 3 verde, 4 cian, 5 magenta, 6 amarillo, 7 gris, 8 blanco, 9 morado,
//   10 naranja; 0 por defecto; o \c[#rrggbb]) · \b azul · \r rojo · \. pausa corta (¼ s) · \| pausa (1 s)
//   \wt[n] pausa de n frames · \wtnp[n] espera n frames y cierra · \^ cierra sin esperar · \se[nombre] sonido

const HEADLESS = typeof document === 'undefined';

const load = {
  dialogs: () => import('./message/dialogs.js'),
  overlay: () => import('./core/overlay.js'),
  pause: () => import('./screens/pauseMenu.js'),
  party: () => import('./screens/party.js'),
  bag: () => import('./screens/bag.js'),
  summary: () => import('./screens/summary.js'),
  pokedex: () => import('./screens/pokedex.js'),
  shop: () => import('./screens/shop.js'),
  storage: () => import('./screens/storage.js'),
  save: () => import('./screens/saveLoad.js'),
  naming: () => import('./screens/naming.js'),
  learnMove: () => import('./screens/learnMove.js'),
  evolution: () => import('./screens/evolution.js'),
  options: () => import('./screens/options.js'),
  trainerCard: () => import('./screens/trainerCard.js'),
  zygarde: () => import('./screens/zygarde.js'),
  regionMap: () => import('./screens/regionMap.js'),
  clues: () => import('./screens/clues.js'),
};

/** Abre una pantalla (módulo con `open(...)`); sin DOM devuelve `fallback`. */
async function open(key, fallback, ...args) {
  if (HEADLESS) return fallback;
  const mod = await load[key]();
  return mod.open(...args);
}

async function dialog(name, fallback, ...args) {
  if (HEADLESS) {
    console.info(`[ui.${name}]`, ...args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))));
    return fallback;
  }
  const d = await load.dialogs();
  return d[name](...args);
}

export const ui = {
  /**
   * Muestra un mensaje en la caja de diálogo y espera a que el jugador lo cierre.
   * opts: { speaker?: string, telepathy?: boolean (estilo del Core), auto?: frames, keepOpen?: boolean,
   *         skin?: string, position?: 'bottom'|'top'|'middle', se?: string }
   * keepOpen: resuelve al terminar de escribirse y deja la caja visible (hasta closeMessage() o el siguiente mensaje).
   */
  async message(text, opts = {}) {
    return dialog('message', undefined, text, opts);
  },
  /** Cierra una caja de mensaje dejada abierta con keepOpen. */
  closeMessage() {
    if (!HEADLESS) load.dialogs().then((d) => d.closeMessage());
  },
  /**
   * Muestra opciones (opcionalmente junto a un mensaje: opts.message, opts.speaker, opts.telepathy).
   * Devuelve el índice elegido; `cancel` = índice al pulsar B (o -1; null = B desactivado).
   */
  async choice(items, opts = {}) {
    return dialog('choice', 0, items, opts);
  },
  /** Pregunta Sí/No (atajo de choice). Devuelve true si elige Sí. */
  async confirm(text, opts = {}) {
    return dialog('confirm', true, text, opts);
  },
  /** Pide un número. opts: { min, max, initial, message, formatter?(n)→texto } → número, o null si cancela. */
  async number(opts = {}) {
    return dialog('number', opts.initial ?? opts.min ?? 0, opts);
  },
  /**
   * Pantalla de introducir nombre (teclado en pantalla + teclado físico).
   * opts: { title, initial, maxLength, iconSpecies?, gender? } → texto (initial si se deja vacío).
   */
  async textEntry(opts = {}) {
    return open('naming', opts.initial || '', opts);
  },
  /**
   * Menú de pausa (Pokédex, Pokémon, Mochila, Zygarde, Tarjeta, Guardar, Opciones, Salir).
   * Devuelve null, o una acción para el mundo: { type: 'fieldMove', move, partyIndex } |
   * { type: 'useItem', item } | { type: 'quit' }.
   */
  async openPauseMenu(opts = {}) {
    return open('pause', null, opts);
  },
  /**
   * Pantalla de equipo. opts: { mode: 'view'|'select'|'switch', message, party?, filter?(p)→bool,
   * annotations?: string[] } → índice o null. En 'view' puede devolver { type: 'fieldMove', move, partyIndex }.
   */
  async openParty(opts = {}) {
    return open('party', null, opts);
  },
  /**
   * Mochila. opts: { mode: 'field'|'battle'|'select', filter?: (item)=>bool, message?,
   * disabled?: (item, id) => motivo|null (aditivo B21: se ve en gris y al elegirlo se muestra el motivo) } → itemId o null.
   * En 'field' los objetos se usan/equipan/tiran dentro; devuelve el ID solo si debe usarse en el mundo.
   */
  async openBag(opts = {}) {
    return open('bag', null, opts);
  },
  /** Datos de un Pokémon. opts: { party?: [Pokémon], index?, page?: 1..4, showIVs? } */
  async openSummary(pokemon, opts = {}) {
    return open('summary', undefined, pokemon, opts);
  },
  /** Pokédex. opts: { species? } abre directamente la ficha. */
  async openPokedex(opts = {}) {
    return open('pokedex', undefined, opts);
  },
  /** Tienda. items: [itemId]. opts: { mode?: 'both'|'buy'|'sell', greeting? } */
  async openShop(items, opts = {}) {
    return open('shop', undefined, items, opts);
  },
  /** PC de almacenamiento. */
  async openStorage(opts = {}) {
    return open('storage', undefined, opts);
  },
  /** Guardar partida (menú de ranuras). Devuelve true si se guardó. */
  async openSave(opts = {}) {
    return open('save', false, { ...opts, mode: 'save' });
  },
  /** Cargar partida (ranuras + importar archivo). Devuelve un GameState o null. */
  async openLoad(opts = {}) {
    return open('save', null, { ...opts, mode: 'load' });
  },
  /** Opciones. */
  async openOptions(opts = {}) {
    return open('options', undefined, opts);
  },
  /** Tarjeta de entrenador. */
  async openTrainerCard(opts = {}) {
    return open('trainerCard', undefined, opts);
  },
  /** Estado de Zygarde (células, núcleos, formas) — marcador provisional. */
  async openZygarde(opts = {}) {
    return open('zygarde', undefined, opts);
  },
  /** Mapa de la región (atlas PENDIENTE X02). opts: { fly: true } → id del punto de vuelo o null. */
  async openRegionMap(opts = {}) {
    return open('regionMap', null, opts);
  },
  /** Libreta de pistas (content/story). opts: { tab: 'clues'|'prophecy'|'chronicle'|'tablets' } */
  async openClues(opts = {}) {
    return open('clues', undefined, opts);
  },
  /** Cartel de nombre de zona al entrar en un mapa. */
  showLocation(name) {
    if (HEADLESS) { console.info('[ui.location]', name); return; }
    load.overlay().then((o) => o.showLocation(name));
  },
  /** Aviso breve no bloqueante (p. ej. "Has obtenido una Célula"). */
  toast(text) {
    if (HEADLESS) { console.info('[ui.toast]', text); return; }
    load.overlay().then((o) => o.toast(text));
  },
  /**
   * Pantalla de aprender movimiento (fuera de combate). Devuelve el índice del movimiento a olvidar,
   * o null si no lo aprende. Con menos de 4 movimientos devuelve el índice libre sin preguntar.
   */
  async learnMove(pokemon, moveId) {
    if ((pokemon.moves || []).length < 4) return pokemon.moves.length;
    return open('learnMove', null, pokemon, moveId);
  },
  /** Secuencia de evolución. Devuelve true si evolucionó (false si se canceló con B). */
  async evolve(pokemon, targetSpecies, opts = {}) {
    return open('evolution', true, pokemon, targetSpecies, opts);
  },
};

/** Permite al módulo UI instalar su implementación real sin romper importaciones existentes. */
export function installUI(impl) {
  Object.assign(ui, impl);
}

if (!HEADLESS && typeof window !== 'undefined' && /[?&]debug\b/.test(window.location.search)) window.__ui = ui;
