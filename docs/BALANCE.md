# Balance común (TÉCNICO)

Valores de referencia que todos los bloques deben usar. La curva de niveles por zona está en
`docs/POKEDEX_DISTRIBUCION.md`; los equipos concretos de cada combate, en `docs/CAMPANA.md`.

## Dinero de entrenadores

Fórmula de Essentials: **premio = `money` (base del entrenador) × nivel del último Pokémon del rival**.
Campo `money` en `content/trainers/<bloque>.js`:

| Tipo de entrenador | `money` base |
|---|---|
| Niños, jóvenes, chicas, bicheros, colegiales | 16 |
| Pescadores, nadadores, buceadores, campistas | 24 |
| Excursionistas, montañeros, mineros, ciclistas | 32 |
| Arqueólogos, científicos neutrales, veteranos, damas/caballeros | 48 |
| Técnicos e investigadores de Genesis | 40 |
| Comandantes de Genesis (Casia, Garrido) | 80 |
| Dr. Aurelio Vértice | 120 |
| Gael (rival) | 60 |
| Guardianes de los Pilares (P1–P5) | 100 |
| Entrenadores de élite del postgame (Bastión Axis) | 120 |

(El motor multiplica por el nivel más alto del equipo rival: `battle/core/battleStart.js#pbGainMoney`; en combates con
varios rivales suma el premio de cada uno.)

**Clasificación por clase** (`content/trainerMoney.js`: `MONEY_BY_KIND`, `CLASS_KIND`, `moneyKindOf`,
`checkTrainerMoney`; test `tests/trainer_money.test.mjs`). La fila sale del campo `class` del entrenador (sin tildes ni
mayúsculas). Clases asimiladas a una fila aunque no aparezcan literalmente: **Marinero/a** → pescadores (24);
**Ornitólogo/a, Fotógrafo/a** (aficionados de campo) y **Mecánico/a** (oficio, como los mineros) → excursionistas
(32); **Aspirante** (el Entrenador Guay de Añil) → veteranos (48); **Estudiante** → colegiales (16).
`money` es siempre explícito en cada entrenador. Si la clase no está en la tabla:
- `moneyKind: '<fila>'` asigna la fila por el papel del personaje (`jovenes agua campo expertos genesis comandante
  vertice rival guardian elite`): Leandro («Maestre de Esclusas») → `guardian`, Casia («Directora de Genesis») →
  `comandante`.
- `moneyException: 'motivo'` permite un valor fuera de la tabla (motivo obligatorio). Ninguno en B01–B06.

El test exige la regla en B01–B06 (`STRICT_MAX_BLOCK`; subirlo al cerrar cada bloque); en archivos de bloques
posteriores las incidencias salen como diagnóstico y no rompen `npm test`.

## Combates de guion (Guardianes, jefes, Gael, Genesis)

- Perder **no** provoca derrota general: sin pérdida de dinero, equipo curado, regreso a la casilla de reintento y sin
  cambiar el punto de cura del jugador (CAMPANA §2.6). Usar el helper común de combates de guion
  `bossBattle(ctx, request, retry, { loseText, speaker, onLose })` de `content/common/bossBattle.js` (ARCHITECTURE §6,
  «Combates de guion»; `scriptedBattle` de `content/events/b06_common.js` es el mismo helper).
- Los técnicos de Genesis que patrullan con visión (tipo de evento `trainer`) son entrenadores normales; los que
  forman parte de una escena (p. ej. T02 en el molino, el Parque en B06) son combates de guion.
- Los combates de Gael B2–B5 continúan la historia aunque el jugador pierda (cambia su frase); B6 hay que ganarlo.

## Curva y fugas de progresión

- La curva por zona está en `docs/POKEDEX_DISTRIBUCION.md` §7.1; el principio (B02–B04) se rebajó por petición del
  autor (DECISIONES X35): Casilda 9–10, Gael B2 8–10, Leandro 17–19. El dinero no cambia de fórmula: con el nivel más
  bajo del último Pokémon baja el premio (Casilda 1000, Gael B2 600, Leandro 1900).
- **Ningún mapa alcanzable puede superar en más de 8 niveles el nivel esperado de la etapa.** Lo comprueba
  `tools/audit_progression.mjs` (test `tests/progression_audit.test.mjs`) para cada etapa B01–B21: estado de entrada
  del modo desarrollador (`game/src/dev/devBlocks.js`, el nivel esperado es el más alto de su equipo de referencia),
  pasabilidad real y capacidades de Zygarde de ese momento. Entrenadores con visión y salvajes (hierba, cueva, agua con
  Nadar, pesca con la caña que se lleva) cuentan; los combates de guion no. Si aparece una fuga, se cierra con una
  barrera diegética o se ajustan los niveles. Los eventos `touch` que devuelven al jugador llevan `gate: true` (los
  `blockedLink` de los bloques ya lo ponen) para que la auditoría los trate como muros.

## Otros

- Alfa: multiplicador ×1.2 de estadísticas, ~3 % en encuentros aleatorios (provisional D29).
- Shiny: 1/4096 (provisional D29).
