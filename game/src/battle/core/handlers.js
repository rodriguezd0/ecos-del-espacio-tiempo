// Tabla de manejadores por identificador (equivalente a HandlerHash de Essentials).
// Cada manejador recibe (id, ...args). `trigger` devuelve undefined si no hay manejador o si
// el manejador no devuelve nada (como `next` sin valor en Ruby).

export class HandlerHash {
  constructor(name) {
    this.name = name;
    this.map = new Map();
  }

  add(id, fn) {
    if (typeof fn !== 'function') throw new Error(`Manejador inválido para ${this.name}:${id}`);
    this.map.set(id, fn);
    return this;
  }

  /** Copia el manejador de `from` a los identificadores `ids`. */
  copy(from, ...ids) {
    const fn = this.map.get(from);
    if (!fn) throw new Error(`No existe manejador ${this.name}:${from} para copiar`);
    for (const id of ids.flat()) this.map.set(id, fn);
    return this;
  }

  has(id) {
    return this.map.has(id);
  }

  keys() {
    return [...this.map.keys()];
  }

  trigger(id, ...args) {
    if (!id) return undefined;
    const fn = this.map.get(id);
    return fn ? fn(id, ...args) : undefined;
  }
}

/** Crea un objeto { NombreHook: HandlerHash } a partir de una lista de nombres. */
export function makeHandlerSet(prefix, names) {
  return Object.fromEntries(names.map((n) => [n, new HandlerHash(`${prefix}.${n}`)]));
}

/** Devuelve `value` si no es undefined/null; en otro caso `fallback`. */
export function orDefault(value, fallback) {
  return value === undefined || value === null ? fallback : value;
}
