# Revisión del contenido — 04-10-2026

Objetivo activo: terminar el juego completo. Este documento registra el cierre del postgame, DLC y auditorías de
obtención; sigue en marcha la partida continua desde Nueva partida y la revisión final de integración. El pase de
arte humano está integrado.

## Requisitos y evidencia

El contraste detallado de campaña, D21–D24, cada búsqueda de postgame, los DLC y los sistemas se registra en
`REVISION_REQUISITOS.md`, con el estado separado de la partida continua.

| Contenido | Requisitos contrastados con CAMPANA §8 | Evidencia |
|---|---|---|
| B22a/b/d/e | Capacidades de postgame, Red, legendarios, sueños, Paradojas, Bastión, revanchas y archivos de Alerce | README de cada bloque y recorridos `e2e_b22*.mjs`; implementados y guardados en de7afc5/0a3026e |
| B22c | Lugia, Ho-Oh, Kyogre, Groudon, Rayquaza, Latias/Latios, rituales, megapiedras y regresos | 24 pruebas Node; Chrome: 41 hitos, siete capturas normales, derrota, KO/descanso, huida y retornos |
| B23 | D1-01…05, EXP-03 natural, Zygardita voluntaria, Gael 80–82, Hoopa 80, sellado/captura opcional y fuga de Gael | 42 pruebas Node; Chrome: 13 hitos, nueve combates reales y regreso por ferri |
| B24 | Seis categorías, máximo tres activos, Rumor → Indicio → Hallazgo, cuatro oleadas y todas las búsquedas canónicas | 155 pruebas Node; Chrome: 30/30 Hallazgos, 79 hitos distintos, 47 combates reales, crianza/evoluciones y ambos lugares insulares marcados en MAPA |
| Pokédex D28 | 346 generales, ocho Paradojas, 11 Ultraentes, 60 legendarios/singulares, obtenibles en solitario | Catálogo corregido en e717e01; auditor efectivo 425/425 en 261 mapas, 21 pruebas y elecciones compatibles |
| Inventario de progresión | 100 células, cinco núcleos, diez Fragmentos y dieciocho Tablillas | Fuentes registradas, contrato en un GameState, 95 entradas/retornos locales y 146 pruebas existentes; sin dependencias circulares |
| Dobles | Dos Pokémon propios separados, sombras y efectos sobre sus posiciones | 3c0bafe; pruebas de disposición y combate cooperativo real con ambos motores |
| Arte humano | Proporciones y poses de los trece NPC, torso/mochila de las dos espaldas, escala entera y exportación reproducible | 36 pruebas y 15 capturas del visor real; comparativas con Añil en `tools/cache/arte-final/` |

Los recorridos de bloque preparan bancos aislados de equipo, historia y recursos. Sus pasos, menús, combates,
capturas, evoluciones y crianza se ejecutan en el motor real. La comprobación de progresión sin preajustes usa
`tools/e2e_campaign.mjs` y el mismo guardado obtenido jugando.

El auditor del inventario ejecuta las 95 recogidas físicas y las cinco entregas de guion, los núcleos, P8 parcial y
la resolución de Arceus en una instancia aislada. Las Tablillas intermedias y restauraciones restantes usan la API
de historia tras comprobar sus fuentes. Combates, presentación, desplazamientos y puzzles pendientes usan fixtures
declarados: el contrato y las rutas locales no sustituyen la campaña continua de navegador.

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
- Los rellanos de P8 conservan las columnas completas; las fachadas de P9/P10 y el núcleo del Cruce evitan piezas
  ocultas superpuestas. La escalera del Puente usa piezas disponibles en su tileset y sus diálogos indican subir.
  Chrome recorre subida, regreso, reentrada, cuatro puzzles y regreso del núcleo: nueve hitos; 62 pruebas enfocadas.
- Las entregas con el equipo y PC llenos conservan el regalo pendiente y no registran una captura inexistente.
  P2/T06 dejan una Poké Ball recogible; los fósiles se consumen al entregar. Once pruebas y dos recorridos Chrome
  cubren recarga, liberación de espacio y entrega única. No se restauran automáticamente regalos perdidos en
  versiones anteriores: sus flags también pueden corresponder a Pokémon liberados o intercambiados.
- Wurmple y Happiny disponen de sus métodos de evolución; seis pruebas nuevas comprueban personalidad, horario,
  objeto, cancelación y guardados anteriores. El auditor usa evolución y crianza reales con recursos distribuídos.
- Las evoluciones por horario del cooperativo reciben el horario compartido del combate. Cinco regresiones
  cubren a ambos dueños, Eevee, Happiny y el horario local de respaldo. Dos recorridos Chrome con relojes opuestos
  terminan con ambos Eevee en Espeon de día y Umbreon de noche; los dos ganan experiencia y no hay errores de página.
- La profundidad existente del seguidor evita que Zygarde tape al jugador en B14: doce posiciones reales en tres
  capas con formas 10 % y 50 %, sin errores de página.
- F9 espera mientras el guion, la cinemática o el paso del jugador están ocupados. Las copias antiguas de casa
  guardadas tras la televisión recuperan carguero/créditos/despertar, según lo que falte. Once regresiones nuevas,
  35 pruebas enfocadas y once comprobaciones Chrome cubren el bloqueo y la carga desde el título. El guardado
  normal del final recuperado vuelve a cargar sin repetir créditos, llave ni huevo y conserva las capacidades.
- La Escuela del Pico entra por el arco visible (39,8), con regreso a (39,9), en vez de activar la ventana con
  hiedra. Cuatro regresiones nuevas contrastan el atlas real, el marcador y los tres felpudos; 51 pruebas enfocadas
  pasan. Chrome comprueba la ventana y tres entradas/regresos: siete hitos y ningún error. Las tres costuras de
  Estrato siguen limpias y el validador completo construye los 272 mapas sin errores.
- Puertas: el panel se recorta del atlas original, abre antes del fundido y cierra al regresar. El inventario
  contrasta 56 accesos cerrados de 36 variantes, incluidos Íker por evento, Aurora y la cúpula local de Boreal;
  todos resuelven su máscara. La revisión de código y píxeles conserva marcos, ventanas, destinos y pasabilidad.
  Chrome verifica ocho transiciones, curación y guardar/cargar por UI, sin errores. El monitor inicial produjo
  capturas de fase negras; se corrigió el monitor y un ensayo adicional obtuvo 24 fases visibles de seis
  transiciones. Se revisaron las imágenes de Alba, Caudal y Mnemos; el jugador queda sobre el panel y no
  persisten recursos temporales.

No quedan hallazgos críticos o altos de esta revisión. El autor aprobó las trece poses frontales nuevas y confirmó
la regla de tamaños del mapa el 04-10-2026. Las demás hojas de arte D30 conservan su revisión provisional.
La aprobación cambia solo los metadatos de esas trece entradas y sus alias: imágenes, dimensiones, variantes y
escala conservan su contenido. Revisión independiente sin hallazgos; 34 pruebas enfocadas pasan y el registro
de personajes alcanza 100 % líneas / 95,52 % ramas / 100 % funciones (`art_approval_red.log` y
`art_approval_green.log`).

## Comprobaciones de integración

La última suite completa de integración pasó **2287/2287**, sin fallos, saltos ni cancelaciones. El validador construyó
272 mapas y no dio errores. Las 45 conexiones actuales pasan la revisión de costuras. La auditoría de progresión
no encuentra fugas ni errores en B01–B21. La QA actual solo conserva avisos revisados en 13 mapas: copas sobre
suelo y los 13 obstáculos altos de los espejos. No hay árboles cortados, objetos sobre árboles ni costuras defectuosas.

Cobertura de módulos nuevos: B22c 99,46 % líneas / 93,88 % ramas / 91,89 % funciones; B23 95,73 / 91,30 / 81,82;
B24 97,12 / 82,47 / 85,03; auditor de obtención 97,29 / 90,80 / 93,02. Las 53 instrucciones modificadas de regalos
y evoluciones están cubiertas (100 % de esas líneas, sin atribuirlo a los módulos completos).
Las 21 líneas de código añadidas/modificadas para F9 y la recuperación del epílogo también están cubiertas
(100 % del cambio; el informe enfocado no representa la cobertura total de los dos módulos anteriores).
Las hojas propias tienen generador reproducible y comprobación de dimensiones.
El alcance de la escuela alcanza 99,15 % líneas / 100 % ramas / 88,89 % funciones; las coordenadas modificadas y el
camino quedan cubiertos. Evidencia: `estrato_school_red.log`, `estrato_school_coverage.log`,
`estrato_school_chrome_report.json`, `estrato_school_qa.md` y `estrato_school_validation.json`.
Puertas: panel 95,92 % líneas / 92,86 % ramas / 100 % funciones; animación 100 % / 89,66 % / 100 %.
Evidencia: `door_animation_report.md`, `door_final_coverage.log`, `door_inventory.json`,
`door_chrome_report.json` y `door_chrome_phases_report.json`; las capturas válidas de fase llevan el prefijo
`door_chrome_phases_`. Los seis perfiles temporales anteriores permanecen en caché porque su borrado fue
rechazado por la revisión automática («blocked by policy»); sus navegadores están cerrados.

Evidencia local en `tools/cache/`: `suite_closure_integrated.log`, `suite_closure_green.log`, `validate_closure.json`,
`audit_progression_final.json`, `b22c_resultado.md`, `b23_final_coverage.log`, `b24_entrega.md` y las capturas y
checkpoints de `screens/`, `pokedex_audit_entrega.md`, `audit_changed_coverage.json`, `b14_follower_review.json`
y `netcoop_evolution_day.json` / `netcoop_evolution_night.json`, `progression_inventory_report.md` y sus trazas.
La recuperación del epílogo añade `epilogue_recovery_report.md`, `epilogue_recovery_chrome_report.json`,
`epilogue_recovery_coverage.log` y `epilogue_recovery_changed_coverage.json`.
El conductor de la partida continua comprueba también el huevo del inicial real de Gael, su entrega única,
el PC y la elección de P9 después de recargar; exige 100 células, cinco núcleos, diez Fragmentos y dieciocho
Tablillas. Sus seis regresiones pasan con los guiones de regalo reales. Este tramo está preparado para B21;
la ejecución continua ha guardado B12 en Villa Alba y sigue en B13: 57 células, diez Tablillas, tres Núcleos,
seis Fragmentos y Nadar. P6 conserva solo puzzles; se comprobaron sus caídas sin daño, anclas, puentes,
cascadas y regresos antes y después de restaurarlo. Togepi eclosionó durante los desplazamientos reales.
El estado de trabajo restante se mantiene en `docs/PENDIENTES.md`.
