# Revisión del contenido — 04-10-2026

Objetivo activo: terminar el juego completo. Este documento registra el cierre del postgame y los DLC; sigue en
marcha la partida continua desde Nueva partida, la auditoría de obtención y el pase de arte humano.

## Requisitos y evidencia

| Contenido | Requisitos contrastados con CAMPANA §8 | Evidencia |
|---|---|---|
| B22a/b/d/e | Capacidades de postgame, Red, legendarios, sueños, Paradojas, Bastión, revanchas y archivos de Alerce | README de cada bloque y recorridos `e2e_b22*.mjs`; implementados y guardados en de7afc5/0a3026e |
| B22c | Lugia, Ho-Oh, Kyogre, Groudon, Rayquaza, Latias/Latios, rituales, megapiedras y regresos | 24 pruebas Node; Chrome: 41 hitos, siete capturas normales, derrota, KO/descanso, huida y retornos |
| B23 | D1-01…05, EXP-03 natural, Zygardita voluntaria, Gael 80–82, Hoopa 80, sellado/captura opcional y fuga de Gael | 42 pruebas Node; Chrome: 13 hitos, nueve combates reales y regreso por ferri |
| B24 | Seis categorías, máximo tres activos, Rumor → Indicio → Hallazgo, cuatro oleadas y todas las búsquedas canónicas | 155 pruebas Node; Chrome: 30/30 Hallazgos, 79 hitos distintos, 47 combates reales, crianza/evoluciones y ambos lugares insulares marcados en MAPA |
| Pokédex D28 | 346 generales, ocho Paradojas, 11 Ultraentes, 60 legendarios/singulares | Catálogo de 425 entradas y generador corregidos en e717e01; cuatro pruebas de catálogo/UI y regresión del motor |
| Dobles | Dos Pokémon propios separados, sombras y efectos sobre sus posiciones | 3c0bafe; pruebas de disposición y combate cooperativo real con ambos motores |

Los recorridos de bloque preparan bancos aislados de equipo, historia y recursos. Sus pasos, menús, combates,
capturas, evoluciones y crianza se ejecutan en el motor real. La comprobación de progresión sin preajustes usa
`tools/e2e_campaign.mjs` y el mismo guardado obtenido jugando.

## Revisión independiente

Se revisaron la aplicación de resultados, protección de reliquias, megaevolución, persistencia, filtros del
Registro, condiciones de los encuentros, observadores y regresos. Los decoradores conservan las páginas de los
mapas de campaña; los encuentros individuales declaran `noCoop`. Las exhibiciones quedan fuera de los avances.

Correcciones verificadas:

- Mega Zygarde se habilita desde Completo. El historial del combate conserva especie, forma, bando, dueño e índice
  antes de deshacer la Mega; Hoopa exige la del jugador en ese combate.
- Celebi rechaza las dos monturas de Zygarde. Los contrapesos comprueban también eventos sólidos vivos y conservan
  la palanca de recuperación.
- El Claro de Justicia devuelve a suelo transitable. Meloetta está en el bambú de Mnemos, fuera de la célula C045.
- Las hipótesis de Isla Pétalo e Isla Estandarte tienen lugares propios; el selector recorre todas las coordenadas
  del atlas aunque dos nombres compartan casilla.
- Las secuencias persistidas inválidas se normalizan sin conceder pasos de puzzle. Los NPC esperan cuando su
  destino está ocupado.
- La Grieta del Porvenir conserva árboles completos y decoración separada; la Cueva Sellada evita una roca sobre
  un cristal. Los dos mapas pasan QA sin avisos y sus recorridos de pasabilidad siguen pasando.

No quedan hallazgos críticos o altos de esta revisión. Arte D30 y decisiones del autor abiertas conservan su
etiqueta provisional.

## Comprobaciones de integración

La suite completa del checkpoint pasa **2142/2142**, sin fallos, saltos ni cancelaciones. El validador construyó
272 mapas y no dio errores. Las 45 conexiones actuales pasan la revisión de costuras. La auditoría de progresión
no encuentra fugas ni errores en B01–B21. Los avisos de decoración de pilares se revisan por separado; no se
presentan como errores de progresión.

Cobertura de módulos nuevos: B22c 99,46 % líneas / 93,88 % ramas / 91,89 % funciones; B23 95,73 / 91,30 / 81,82;
B24 97,12 / 82,47 / 85,03. Las hojas propias tienen generador reproducible y comprobación de dimensiones.

Evidencia local en `tools/cache/`: `suite_checkpoint_final.log`, `validate_dlc_final.json`,
`audit_progression_final.json`, `b22c_resultado.md`, `b23_final_coverage.log`, `b24_entrega.md` y las capturas y
checkpoints de `screens/`. El estado de trabajo restante se mantiene en `docs/PENDIENTES.md`.
