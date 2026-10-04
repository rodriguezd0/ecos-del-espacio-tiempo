# Revisión del contenido — 04-10-2026

Objetivo activo: terminar el juego completo. Este documento registra el cierre del postgame, DLC y auditorías de
obtención; sigue en marcha la partida continua desde Nueva partida y la revisión final de integración. El pase de
arte humano y el atlas están integrados y aprobados por el autor.

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
- La separación global solicitada después en X38 está integrada en `5a3bdbb`: cada eslabón deja espacio según
  su huella opaca y conserva escala, recorrido, saltos y presentación. 182 pruebas enfocadas y 46 + 16
  comprobaciones Chrome cubren giros, reversas, paradas, monturas, guiones e interacción A sin solapes ni errores.
  Una recta lateral adicional confirma los tres actores completos tras salir de un pasillo.
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
- C065: el acercamiento de Ezequiel terminaba sobre la célula e impedía recogerla por contacto. Su posición
  inicial pasa a (135,15), conservando combate, mirada, alcance y premio. Dos regresiones fallaron con la
  disposición anterior; las 24 pruebas de B13 pasan con la corrección, incluida victoria real, premio de 1104,
  recogida única, entrada al agua y regreso. La QA local no da avisos y la coordenada cambiada tiene cobertura
  del 100 % (`c065_trainer_cell_report.md`). La partida continua recogió la célula mediante un viaje normal
  de Buceo que reconstruyó el mapa; no se modificó su progreso para resolver el bloqueo.
- C059: el regreso occidental desde el despacho permitía que Nerea terminara sobre la célula de Talasa.
  Su origen se mueve una casilla al este, conservando dirección, alcance, entrenador, premio de 1920 y páginas.
  Tres regresiones RED pasan con el cambio: cuatro pruebas nuevas y 28 pruebas B13 GREEN. Se comprueban ambas
  células, todas las posiciones visibles de reto, el regreso y la reconstrucción, además del trayecto anterior
  a recibir la tarjeta. La QA no encuentra avisos y el módulo de disposición tiene cobertura del 100 %
  (`c059_local_qa.json`, `c059_trainer_cell_focus.log`); imagen de la puerta y las dos células revisada.
- El conductor solo reintenta Talasa y Tizón después de una nueva derrota registrada con regreso al Centro.
  La victoria doble exige a Casia y Garrido en el mismo combate, también en el recorrido normal. Las recargas
  comparan el GameState completo, incluidos UID, posición de cada Pokémon en el PC, pistas, viajes, selfswitches
  y punto de cura. Solo excluyen el tiempo jugado y el reloj de la comparación literal; el reloj se valida
  aparte, admitiendo hasta quince minutos de avance normal, incluido el cambio de día. El baseline es el payload
  exacto escrito en la ranura, validado contra la partida viva antes de cargar: cerrar los menús puede avanzar
  el reloj después de la escritura. La revisión independiente confirmó estas correcciones; las regresiones
  del recorrido pasan: 80/80, incluidas las dos regresiones posteriores del tramo Caleta→Buceo de B14
  (`campaign_b14_stage_green.log`; la cobertura de recarga está en `campaign_slot_clock_green.log`).
- B14 reintenta tras una derrota nueva: regreso normal desde el Centro por Buceo o reintento local cuando
  el guion permite perder y cura al equipo. Exige victorias reales de Rufino, Eulalia y Adela. Las ocho pruebas
  enfocadas pasan; el navegador ya ejecutó ambos tipos de regreso y venció a los tres. En B15, el conductor
  evita las escaleras falsas durante los trayectos y conserva el intento voluntario del puzzle: diez pruebas
  nuevas, revisión independiente y 21/23 líneas del cambio cubiertas (91,30 %). El fixture llega al mirador;
  el recorrido continuo posterior sigue pendiente (`campaign_future_driver_review.md`). El eco dispone de
  reentrada por la escalera real y controles de derrota nueva, protección y dinero observado: 15/15 pruebas.
  La captura física exige resultado caught, flag y posesión real en equipo/PC; cinco pruebas nuevas y módulo
  con cobertura 100/100/100. El foco B14 pasa 20/20 (`campaign_b14_capture_root_review.log`). Cuatro pruebas
  posteriores contrastan el evento de superficie del Arrecife y modelan el retorno/reanudación; el navegador
  ya ejecutó la salida física (22,31) y llegó a tierra sin repetir las cinco recogidas del Fondo. Cobertura del
  helper de retorno: 100 % líneas / 93,75 % ramas / 100 % funciones (`campaign_b14_return_root_review.log`).

No quedan hallazgos críticos o altos de esta revisión. El autor aprobó las trece poses frontales nuevas, el kit
M/F completo, los 29 personajes de campo y el atlas, y confirmó la regla de tamaños el 04-10-2026. D30 queda
cerrado para el arte presentado. Registro y alias identifican las 60 hojas humanas aprobadas; el atlas registra
fecha y autor en su JSON reproducible. Los 47 PNG de las dos últimas láminas conservan sus hashes de origen;
los dos PNG regionales también permanecen idénticos. Las dos regresiones de aprobación fallaron antes del cambio
y las 21 pruebas enfocadas de registro/atlas pasan después; todas las líneas de metadatos modificadas se ejecutan.
El foco integrado de arte, atlas, tamaños y UI pasa 48/48: el visor reconoce Axis aprobado y la ficha M/F deja
de mostrar el aviso provisional, manteniendo foto y escala. Las cuatro líneas ejecutables de UI añadidas quedan
cubiertas al 100 %. La revisión independiente confirma el alcance exacto, los 19 alias y la geometría intacta
(`art_approval_ui_report.md`, `art_approval_ui_changed_coverage.json`, `arte-final/aprobacion_d30_final.json`).
La aprobación anterior de frontales y tamaños tuvo revisión independiente sin hallazgos y 34 pruebas enfocadas
(`art_approval_red.log`, `art_approval_green.log`).

## Comprobaciones de integración

La última suite completa de integración pasó **2463/2463**, sin fallos, saltos ni cancelaciones, incluidos el arte
aprobado, su UI, C059/C065, recargas, retornos B14/B15, PC y separación global de seguidores
y reanudaciones B17–B20 (`suite_b20_return_integrated.log`, 32,17 s). El último
validador posterior a ambos arreglos construyó 272 mapas sin errores: 31 avisos enumerados, ninguno de Mar/Talasa.
Las 45 conexiones actuales pasan la revisión de costuras, incluidas las seis de esos dos mapas. La auditoría de progresión
no encuentra fugas ni errores en B01–B21. La QA actual solo conserva avisos revisados en 13 mapas: copas sobre
suelo y los 13 obstáculos altos de los espejos. No hay árboles cortados, objetos sobre árboles ni costuras defectuosas.
No quedan mapas con incidencias de arte sin revisar. Informes: `trainer_contact_final_checks_report.md`,
`trainer_contact_final_validator.json` y `trainer_contact_final_map_qa.json`.

Cobertura de módulos nuevos: B22c 99,46 % líneas / 93,88 % ramas / 91,89 % funciones; B23 95,73 / 91,30 / 81,82;
B24 97,12 / 82,47 / 85,03; auditor de obtención 97,29 / 90,80 / 93,02. Las 53 instrucciones modificadas de regalos
y evoluciones están cubiertas (100 % de esas líneas, sin atribuirlo a los módulos completos).
Las 21 líneas de código añadidas/modificadas para F9 y la recuperación del epílogo también están cubiertas
(100 % del cambio; el informe enfocado no representa la cobertura total de los dos módulos anteriores).
Las hojas propias tienen generador reproducible y comprobación de dimensiones.
La separación global cubre entre 94,83 % y 100 % de las líneas ejecutables cambiadas, con hashes SHA256
contrastados contra los módulos integrados. No se atribuye ese porcentaje a `charsets.js` completo:
su código antiguo no modificado queda fuera del alcance. Detalle y límites: `follower_spacing_review.md`
y `follower_spacing_changed_coverage.json`.
El alcance de la escuela alcanza 99,15 % líneas / 100 % ramas / 88,89 % funciones; las coordenadas modificadas y el
camino quedan cubiertos. Evidencia: `estrato_school_red.log`, `estrato_school_coverage.log`,
`estrato_school_chrome_report.json`, `estrato_school_qa.md` y `estrato_school_validation.json`.
Puertas: panel 95,92 % líneas / 92,86 % ramas / 100 % funciones; animación 100 % / 89,66 % / 100 %.
Evidencia: `door_animation_report.md`, `door_final_coverage.log`, `door_inventory.json`,
`door_chrome_report.json` y `door_chrome_phases_report.json`; las capturas válidas de fase llevan el prefijo
`door_chrome_phases_`. Los seis perfiles temporales anteriores permanecen en caché porque su borrado fue
rechazado por la revisión automática («blocked by policy»); sus navegadores están cerrados.

Evidencia local en `tools/cache/`: `suite_b17_exit_integrated.log`, `suite_followers_final.log`, `follower_spacing_review.md`, `suite_b14_retry_integrated.log`, `suite_campaign_routes_integrated.log`, `suite_slot_reload_integrated.log`, `suite_campaign_reload_integrated.log`, `suite_final_approval.log`, `suite_closure_integrated.log`, `suite_closure_green.log`, `validate_closure.json`,
`audit_progression_final.json`, `b22c_resultado.md`, `b23_final_coverage.log`, `b24_entrega.md` y las capturas y
checkpoints de `screens/`, `pokedex_audit_entrega.md`, `audit_changed_coverage.json`, `b14_follower_review.json`
y `netcoop_evolution_day.json` / `netcoop_evolution_night.json`, `progression_inventory_report.md` y sus trazas.
La recuperación del epílogo añade `epilogue_recovery_report.md`, `epilogue_recovery_chrome_report.json`,
`epilogue_recovery_coverage.log` y `epilogue_recovery_changed_coverage.json`.
El conductor de la partida continua comprueba también el huevo del inicial real de Gael, su entrega única,
el PC y la elección de P9 después de recargar; exige 100 células, cinco núcleos, diez Fragmentos y dieciocho
Tablillas. Diez pruebas de recarga final y diez del checkpoint comprueban los datos completos, continuidad del
reloj y rechazo de cambios invisibles en un resumen de pantalla. Cobertura por módulo: checkpoint 100 % líneas /
98,18 % ramas / 94,74 % funciones; recarga final 94,64 / 98,21 / 90. Los modelos de UI son pruebas aisladas;
la recarga real intermedia ya se ejecutó, y la del final queda preparada para B21.
La ejecución continua ha guardado y recargado B13 en Caleta Sonda: 77 células, doce Tablillas, cuatro Núcleos,
seis Fragmentos, Nadar y Buceo. Comparación independiente del payload y el estado recargado: todos los campos
persistentes idénticos, reloj 1219→1219 y misma identidad QAut8uoab (`campaign/campaign_b13_reload_audit.json`).
Talasa, Lumbre/fiesta, las tres coladas, respiraderos, jefa/Tabla Llama y el retorno marítimo están completos.
Después se guardó B14 por UI en Caleta (9,28): 85 células únicas, cuatro Núcleos, siete Fragmentos y doce
Tablillas. P7 restaurado, Bramaluna Alfa 58 capturada en cinco turnos y enviada al PC, ferri reanudado y las
cinco células del Fondo recogidas con regreso. El contraste independiente de checkpoints conserva todas las
colecciones de B13 y la identidad QAut8uoab (`campaign/campaign_b14_checkpoint_audit.json`); su alcance es el
resumen y los combates registrados, sin sustituir la comparación completa del guardado final.
Después se guardó y recargó B15 por UI en Villa Boreal (6,18): 95 células únicas, cinco Núcleos, siete
Fragmentos y trece Tablillas. Lago Viejo/T13, Gael vencido en 22 turnos/N5 y los regresos de Gruta Escarcha
y Mar Boreal están completos. El payload exacto y la carga conservan todos los campos persistentes y el
reloj 149→149. El intercambio posterior del PC depositó Rampardos47 y retiró Bramaluna58 conservando los
diez registros completos, sus UID y los demás huecos (`campaign/campaign_b15_checkpoint_audit.json`).
Después se guardó B16 por UI en Correos de Nexo (7,8): 100 células únicas, cinco Núcleos, ocho Fragmentos
y trece Tablillas. Saber, Sentir, Querer y Telar resueltos; Azelf58 vencido con la Mochila sellada, sin
huida/captura y conservando 42576 de dinero. P8 restaurado y descendido por ambas plantas; Completo,
Volar, Reconstruir, Cadena Roja y los dos tramos del puente habilitados por su guion. El contraste independiente
conserva identidad y colecciones de B15 (`campaign/campaign_b16_checkpoint_audit.json`); el alcance es el
checkpoint y los combates observados, y no sustituye la comparación completa del payload del final.
Después se guardó B17 por UI en Puente de Convergencia (20,1): 100 células únicas, cinco Núcleos, ocho
Fragmentos y catorce Tablillas. Mesa/T14, ambas torres y sus dobles, Vigilia, Círculo/tres Piedras Lunares y
reconstrucción de la Senda completos. La revisión conserva todas las colecciones de B16
(`campaign/campaign_b17_checkpoint_audit.json`). La reanudación usa la llegada exacta del warp vertical de P9,
sin repetir controles ya completados; dos fallos RED, siete regresiones GREEN, 28 pruebas de revisión y
cobertura del helper 100 % líneas / 96,77 % ramas / 100 % funciones (`ea276ad`).
Se guardó B18 por UI en Senda del Mirador (20,49): 100 células únicas, cinco Núcleos, nueve Fragmentos y
catorce Tablillas. Se ganaron Casia/Garrido/Vértice, se resolvieron Vestíbulo/Caída/Río/Cruce y se comprobó
el regreso entre plantas antes de restaurar. La elección real fue Dialga: victoria en seis turnos al nivel 65,
P9/F09 restaurado, dinero conservado y Lustresfera del eje no elegido recogida. La salida sur y retorno al norte
se recorrieron. La auditoría conserva todas las colecciones de B17 (`campaign/campaign_b18_checkpoint_audit.json`);
no sustituye la comparación completa del payload final. La reanudación del Río usa la casilla y eje observados,
mantiene la comprobación estricta de cada acción y no modifica esperas ni colisión. Ocho regresiones pasan,
incluidos cinco movimientos sobre World/mapa real; cobertura del helper 100 % líneas / 96,83 % ramas /
81,82 % funciones (`e3f578c`). El fallo previo de una pulsación no se reprodujo y su causa queda sin determinar.
Se guardó B19 por UI en Puerta de las Quince (16,31), con 100 células únicas, cinco Núcleos, nueve Fragmentos
y quince Tablillas. Calzada reconstruida, Casandra vencida tras derrota protegida/cura real, Tabla Draco/T15,
Salamencita, Alerce, Salamence Alfa, último tramo y Umbral completos. La auditoría conserva las colecciones de
B18 (`campaign/campaign_b19_checkpoint_audit.json`). Doce regresiones pasan, con cobertura del helper de
reintentos de Casandra del 100 % en líneas/ramas/funciones (`37d92f4`); esa medida no cubre todo el módulo B19.
La bajada exige el warp registrado y la entrada real a la Puerta. La montura de B20 usa el control normal antes
de subir la grava y cuenta con dos regresiones (`66a3e5a`).
Se guardó B20 por UI en Núcleo del Origen (10,22), con 100 células únicas, cinco Núcleos, diez Fragmentos y
quince Tablillas. Nueve tramos resueltos, retornos antes del Trío/Gael y descenso de las tres plantas tras
restaurar recorridos. Tornadus68/Thundurus68/Landorus70 fueron vencidos en 1/5/5 turnos, dinero intacto y
captura sellada; respuesta real «zygarde». Gael B6 fue vencido en 18 turnos. F10/Flauta y regreso al núcleo
completos, conservando las colecciones de B19 (`campaign/campaign_b20_checkpoint_audit.json`). El regreso
usa las entradas por evento en vez del grafo incompleto; exige cinco hitos reales y evita repetir la entrega.
Seis regresiones pasan, con cobertura del helper del 100 % en líneas/ramas/funciones (`6a0d07b`).
El recorrido continúa en B21: Salto y llegada a la Columna, con resolución, créditos y recarga final pendientes.
P6 conserva solo puzzles y Togepi eclosionó durante los desplazamientos reales.
El estado de trabajo restante se mantiene en `docs/PENDIENTES.md`.
