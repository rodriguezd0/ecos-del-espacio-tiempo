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

## Combates de guion (Guardianes, jefes, Gael, Genesis)

- Perder **no** provoca derrota general: sin pérdida de dinero, equipo curado, regreso a la casilla de reintento y sin
  cambiar el punto de cura del jugador (CAMPANA §2.6). Usar el helper común de combates de guion
  (`content/common/bossBattle.js` si existe; si no, el patrón `scriptedBattle` de `content/events/b06_common.js`).
- Los combates de Gael B2–B5 continúan la historia aunque el jugador pierda (cambia su frase); B6 hay que ganarlo.

## Otros

- Alfa: multiplicador ×1.2 de estadísticas, ~3 % en encuentros aleatorios (provisional D29).
- Shiny: 1/4096 (provisional D29).
