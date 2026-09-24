// Dinero base de los entrenadores (docs/BALANCE.md «Dinero de entrenadores»). Módulo puro: lo usan el test
// tests/trainer_money.test.mjs y, si se quiere, el validador de contenido.
// Premio = `money` (base) × nivel del Pokémon de más nivel del rival (battle/core/battleStart.js#pbGainMoney).
// Vive fuera de content/trainers/ porque tools/gen_registries.mjs registra como entrenadores todo *.js de esa carpeta.

/** Filas de la tabla de BALANCE.md → `money` base. */
export const MONEY_BY_KIND = Object.freeze({
  jovenes: 16, // niños, jóvenes, chicas, bicheros, colegiales
  agua: 24, // pescadores, nadadores, buceadores, campistas (+ marineros)
  campo: 32, // excursionistas, montañeros, mineros, ciclistas (+ ornitólogos, fotógrafos, mecánicos)
  expertos: 48, // arqueólogos, científicos neutrales, veteranos, damas/caballeros (+ aspirantes)
  genesis: 40, // técnicos e investigadores de Genesis (uniforme del Consorcio Meridiano)
  comandante: 80, // comandantes de Genesis (Casia, Garrido)
  vertice: 120, // Dr. Aurelio Vértice
  rival: 60, // Gael
  guardian: 100, // Guardianes de los Pilares (P1–P5)
  elite: 120, // entrenadores de élite del postgame (Bastión Axis)
});

/** Valores permitidos (cualquier fila de la tabla). */
export const MONEY_VALUES = Object.freeze([...new Set(Object.values(MONEY_BY_KIND))].sort((a, b) => a - b));

/** Minúsculas y sin tildes, para comparar clases. */
export function normalizeClass(name) {
  return String(name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// Clase (`class` de la definición) → fila. Las marcadas «asimilada» no aparecen literalmente en la tabla: se
// documentan en BALANCE.md. Cualquier otra clase necesita `moneyKind` o `moneyException` en el entrenador.
const CLASS_ROWS = {
  jovenes: ['Joven', 'Chico', 'Chica', 'Niño', 'Niña', 'Bichero', 'Bichera', 'Colegial', 'Colegiala', 'Estudiante'],
  agua: ['Pescador', 'Pescadora', 'Nadador', 'Nadadora', 'Buceador', 'Buceadora', 'Campista',
    'Marinero', 'Marinera'], // asimilada: gente de mar
  campo: ['Excursionista', 'Montañero', 'Montañera', 'Minero', 'Minera', 'Ciclista',
    'Ornitólogo', 'Ornitóloga', 'Fotógrafo', 'Fotógrafa', // asimiladas: aficionados de campo
    'Mecánico', 'Mecánica'], // asimilada: oficios, como los mineros
  expertos: ['Arqueólogo', 'Arqueóloga', 'Científico', 'Científica', 'Veterano', 'Veterana', 'Dama', 'Caballero',
    'Aspirante'], // asimilada: Entrenador Guay de Añil (GUAY/GUAYA), entrenador curtido
  genesis: ['Técnico del Consorcio', 'Técnica del Consorcio', 'Técnico de Genesis', 'Técnica de Genesis',
    'Investigador de Genesis', 'Investigadora de Genesis'],
  comandante: ['Comandante de Genesis'],
  rival: ['Rival'],
  guardian: ['Guardián', 'Guardiana'],
};

/** Clase normalizada → fila de MONEY_BY_KIND. */
export const CLASS_KIND = Object.freeze(Object.fromEntries(
  Object.entries(CLASS_ROWS).flatMap(([kind, list]) => list.map((c) => [normalizeClass(c), kind])),
));

/**
 * Fila de la tabla de un entrenador: `moneyKind` explícito (p. ej. Casia 'comandante', Leandro 'guardian') o la de
 * su clase. null si la clase no está en la tabla.
 */
export function moneyKindOf(def) {
  if (def?.moneyKind) return def.moneyKind;
  return CLASS_KIND[normalizeClass(def?.class)] ?? null;
}

/**
 * Comprueba el `money` de una definición de content/trainers.
 * @returns {{ ok: boolean, kind: string|null, expected: number|null, exception: string|null, problem: string|null }}
 */
export function checkTrainerMoney(id, def) {
  const result = (ok, kind, expected, exception, problem) => ({ ok, kind, expected, exception, problem });
  const money = def?.money;
  if (!Number.isInteger(money) || money < 0) {
    return result(false, null, null, null, `${id}: falta \`money\` explícito (entero ≥ 0)`);
  }
  if (def.moneyException !== undefined) {
    const reason = typeof def.moneyException === 'string' ? def.moneyException.trim() : '';
    if (!reason) return result(false, null, null, null, `${id}: \`moneyException\` debe explicar el motivo`);
    return result(true, null, null, reason, null);
  }
  if (def.moneyKind !== undefined && !(def.moneyKind in MONEY_BY_KIND)) {
    return result(false, null, null, null, `${id}: moneyKind «${def.moneyKind}» no es una fila de la tabla (${Object.keys(MONEY_BY_KIND).join(', ')})`);
  }
  const kind = moneyKindOf(def);
  if (!kind) {
    return result(false, null, null, null,
      `${id}: la clase «${def.class || '(sin clase)'}» no está en la tabla de BALANCE.md; añade \`moneyKind\` o \`moneyException: 'motivo'\``);
  }
  const expected = MONEY_BY_KIND[kind];
  if (money !== expected) {
    return result(false, kind, expected, null, `${id}: money ${money} ≠ ${expected} (fila «${kind}», clase «${def.class || ''}»)`);
  }
  return result(true, kind, expected, null, null);
}
