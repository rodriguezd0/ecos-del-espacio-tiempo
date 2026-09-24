// Fachada de la UI usada por el resto del juego (guiones, mundo, combate).
// CONTRATO ESTABLE: el agente/módulo de UI implementa estas funciones; los demás solo importan `ui`.
// Implementación provisional (stub): registra en consola y resuelve al instante.

export const ui = {
  /**
   * Muestra un mensaje en la caja de diálogo y espera a que el jugador lo cierre.
   * opts: { speaker?: string, telepathy?: boolean (estilo del Core), auto?: frames, keepOpen?: boolean,
   *         skin?: string, position?: 'bottom'|'top'|'middle', se?: string }
   * El texto admite \n y códigos: \c[n] color, \PN nombre del jugador, \| pausa corta, \. pausa, \wtnp[n] esperar y cerrar.
   */
  async message(text, opts = {}) {
    console.info('[ui.message]', opts.speaker ? `${opts.speaker}: ` : '', text);
  },
  /** Cierra una caja de mensaje dejada abierta con keepOpen. */
  closeMessage() {},
  /** Muestra opciones (opcionalmente junto a un mensaje). Devuelve el índice elegido; `cancel` = índice al pulsar B (o -1). */
  async choice(items, opts = {}) {
    console.info('[ui.choice]', opts.message || '', items);
    return 0;
  },
  /** Pide un número. opts: { min, max, initial, message } */
  async number(opts = {}) {
    return opts.initial ?? opts.min ?? 0;
  },
  /** Pantalla de introducir nombre. opts: { title, initial, maxLength, iconSpecies? } */
  async textEntry(opts = {}) {
    return opts.initial || '';
  },
  /** Menú de pausa (Pokédex, Pokémon, Mochila, Zygarde, Tarjeta, Guardar, Opciones). */
  async openPauseMenu() {},
  /** Pantalla de equipo. opts: { mode: 'view'|'select'|'switch', message } → índice o null */
  async openParty(opts = {}) {
    return null;
  },
  /** Mochila. opts: { mode: 'field'|'battle'|'select', filter?: (item)=>bool } → itemId o null */
  async openBag(opts = {}) {
    return null;
  },
  /** Datos de un Pokémon. */
  async openSummary(pokemon, opts = {}) {},
  /** Pokédex. */
  async openPokedex(opts = {}) {},
  /** Tienda. items: [itemId] */
  async openShop(items, opts = {}) {},
  /** PC de almacenamiento. */
  async openStorage(opts = {}) {},
  /** Guardar partida (menú de ranuras). Devuelve true si se guardó. */
  async openSave(opts = {}) {
    return false;
  },
  /** Cartel de nombre de zona al entrar en un mapa. */
  showLocation(name) {
    console.info('[ui.location]', name);
  },
  /** Aviso breve no bloqueante (p. ej. "Has obtenido una Célula"). */
  toast(text) {
    console.info('[ui.toast]', text);
  },
  /** Pantalla de aprender movimiento (fuera de combate). Devuelve índice a olvidar o null. */
  async learnMove(pokemon, moveId) {
    return null;
  },
  /** Secuencia de evolución. Devuelve true si evolucionó (false si se canceló). */
  async evolve(pokemon, targetSpecies) {
    return true;
  },
};

/** Permite al módulo UI instalar su implementación real sin romper importaciones existentes. */
export function installUI(impl) {
  Object.assign(ui, impl);
}
