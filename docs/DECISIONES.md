# Registro de decisiones — Ecos del Espacio-Tiempo (Axis)

Fuente de canon: `docs/biblia_axis_v2.txt` (Biblia narrativa v2.0, 24-09-2026). Este registro añade las
decisiones posteriores del autor con fecha. **Nada marcado PENDIENTE se fija en el juego sin respuesta del autor**;
mientras tanto se usa un marcador provisional etiquetado (`[PROVISIONAL Dxx]`) o se omite.

Estados: VIGENTE (biblia) · DECIDIDO (autor, fecha) · DECIDIDO-DEV (tomada por el desarrollo con autonomía
concedida por el autor; revisable) · PENDIENTE · TÉCNICO (decisión de implementación sin impacto narrativo).

> **24-09-2026 — Autonomía.** Tras responder D01–D08, el autor pidió: "continúa autónomamente, no me preguntes más".
> Desde entonces, cada decisión abierta se toma en el desarrollo respetando la biblia y las respuestas anteriores, se
> registra aquí como **DECIDIDO-DEV** con su justificación y queda disponible para que el autor la revise o la cambie.

## Decisiones técnicas tomadas por el desarrollo (sin impacto de canon)

| ID | Decisión | Motivo |
|----|----------|--------|
| TEC-01 | Motor: Three.js 0.186 (sustituye RPG Maker XP del PDF por encargo del autor, 24-09-2026) | Encargo explícito |
| TEC-02 | Resolución 512×384, tiles 32 px, escala DS×2 (como Añil) | Compatibilidad con recursos de Añil |
| TEC-03 | Recursos de Añil servidos desde `/anil/`; datos PBS convertidos a JSON | Evitar duplicar ~500 MB |
| TEC-04 | Grafías del inventario: Drifloom→DRIFLOON, Clawitzee→CLAWITZER (conservando el nombre original en `dex_axis.json`) | Biblia §16: "verificarse como IDs" |
| TEC-05 | Mecánicas de combate de generación 9 (como Añil/Essentials 21.1) | Base portada |
| TEC-06 | Ciclo día/noche con reloj de juego propio (no reloj real) | Biblia §12: descansar para cambiar día/noche sin exigir hora real |

## Registro D01–D30 (biblia cap. 20)

| ID | Decisión | Estado | Respuesta / nota |
|----|----------|--------|------------------|
| D01 | Nombre y vida cotidiana de ambos protagonistas | DECIDIDO 24-09-2026 | Nombre libre elegido por el jugador (sin nombre canónico). Vive con su **madre** (cura al equipo en casa). |
| D02 | Razón concreta de la elección del Core | DECIDIDO 24-09-2026 | El protagonista es **el elegido de una profecía** ligada a los Pokémon del tiempo y del espacio: alguien que salvará el espacio-tiempo. **Cambia** la ambigüedad de la biblia §2/§6.1 ("no certificar el elegido"). Se mantiene descartado el sueño/voz explicativa de la beta; la profecía se presenta según la respuesta a D02b. |
| D02b | Revelación de la profecía | DECIDIDO 24-09-2026 | Se conoce **poco a poco** durante el juego: el Core la insinúa, las inscripciones de los Pilares del equilibrio (también en escritura **Unown**) la van revelando y se confirma en el tramo final. Sin sueño/voz explicativa al inicio. |
| D03 | Nombre, especialidad, edad y diseño del profesor | DECIDIDO 24-09-2026 | **Profesor Alerce**, unos 45 años, geología y ecología de anomalías; sobrio y cauto. Diseño visual provisional (D30). Pasado ex-Genesis solo por subtexto tardío (VIGENTE). |
| D04 | Motivo inicial de la restricción policial | DECIDIDO 24-09-2026 | El área norte es **propiedad privada: un laberinto privado**. Adaptación del desarrollo (el autor pidió "la mejor manera"): laberinto de piedra y seto levantado hace generaciones por una familia local sobre vestigios antiguos; los dueños no viven en el pueblo y, tras los temblores recientes, piden a la policía que nadie entre. [Nombre del laberinto/familia: X03] |
| D05 | Secuencia exacta de iniciales, señal, regreso y primer duelo | DECIDIDO (parcial) 24-09-2026 | Gael elige **después del jugador** el inicial con **ventaja de tipo** (Turtwig→Litten, Litten→Sobble, Sobble→Turtwig). Duelo con Gael tras regresar con el Core (VIGENTE). Entrega de Pokédex/Poké Balls: ver D05b. |
| D05b | Entrega de Pokédex y Poké Balls | DECIDIDO 24-09-2026 | El Prof. Alerce las entrega a ambos **tras el duelo con Gael**, para registrar Pokémon y anomalías camino del Umbral. |
| D06 | Transporte del Core frente al sprite sin mochila | DECIDIDO 24-09-2026 | Los protagonistas **llevan mochila** (el autor la prefiere a la bandolera) **y** el Core **los sigue en el mapa** como acompañante de campo (fuera del equipo). Sustituye la exploración de sprites sin mochila (biblia §5/§13.1). |
| D07 | Identidad, prueba y equipo del Guardián del Umbral | DECIDIDO 24-09-2026 | **Guardiana veterana escéptica**: custodia por tradición familiar, duda de las leyendas hasta que el Pilar reacciona. Equipo Roca/Tierra, nivel ~12. Nombre: pendiente (se propondrá). |
| D08 | Versión del puzzle/Geodude del Umbral | DECIDIDO 24-09-2026 | Tres **mecanismos con pistas grabadas**; al activarlos se abre una cámara donde un **Geodude estaba atrapado**; agradecido, **rompe la roca** que bloquea el paso. |
| D09 | Accesos de Corriente y Memoria | DECIDIDO-DEV (ver sección de diseño) | |
| D10 | Cifras y ubicación de células/núcleos | DECIDIDO-DEV (ver sección de diseño) | Umbrales provisionales de la biblia §8 |
| D11 | Episodios de Tablillas T01–T15 (museo incluido) | DECIDIDO-DEV (ver sección de diseño) | |
| D12 | Objetos/IDs de las tres Tablillas finales | DECIDIDO-DEV (ver sección de diseño) | |
| D13 | Actos y apariciones de Genesis por capítulo | DECIDIDO-DEV (ver sección de diseño) | |
| D14 | Nombre, diseño, equipo y fuga del líder original | DECIDIDO-DEV (ver sección de diseño) | |
| D15 | Responsabilidad previa y ruptura del profesor | DECIDIDO-DEV (ver sección de diseño) | |
| D16 | Logros, derrotas y escenas intermedias de Gael | DECIDIDO-DEV (ver sección de diseño) | |
| D17 | Mecánicas exactas del Alma | DECIDIDO-DEV (ver sección de diseño) | |
| D18 | Elección/captura Dialga–Palkia | DECIDIDO-DEV (ver sección de diseño) | |
| D19 | Causa y ritmo del deterioro global | DECIDIDO-DEV (ver sección de diseño) | |
| D20 | Motivación del Trío de las Nubes | DECIDIDO-DEV (ver sección de diseño) | |
| D21 | Captura voluntaria de Zygarde y equipo completo | DECIDIDO-DEV (ver sección de diseño) | |
| D22 | Motivo del combate de Arceus | DECIDIDO-DEV (ver sección de diseño) | |
| D23 | Reglas de fases, captura y reintento final | DECIDIDO-DEV (ver sección de diseño) | Orden fijo Tierra → Fantasma → Normal (VIGENTE) |
| D24 | Epílogo y Complete después de la crisis | DECIDIDO-DEV (ver sección de diseño) | |
| D25 | Región nueva, episodios y final del DLC de Gael | DECIDIDO-DEV (ver sección de diseño) | |
| D26 | Origen/obtención de Zygardita | DECIDIDO-DEV (ver sección de diseño) | |
| D27 | NPC del DLC 2 y sistema de misiones activas | DECIDIDO-DEV (ver sección de diseño) | |
| D28 | Distribución de 412 especies y nuevas necesidades | DECIDIDO-DEV (ver sección de diseño) | |
| D29 | Tasas Alpha/shiny y condiciones de captura | DECIDIDO-DEV (ver sección de diseño) | |
| D30 | Arte final de protagonistas y resto del elenco | DECIDIDO-DEV (ver sección de diseño) | Arte provisional etiquetado mientras tanto |

## Otras decisiones abiertas detectadas al implementar

| ID | Decisión | Estado | Nota |
|----|----------|--------|------|
| X01 | Nombre del pueblo inicial | DECIDIDO 24-09-2026 | **Villa Alba** |
| X02 | Atlas de Axis: nombres de rutas y ciudades | DECIDIDO-DEV (ver sección de diseño) | Biblia §17: nombres antiguos no aceptados. Se propondrá un atlas al autor. |
| X03 | Nombre del área restringida | DECIDIDO 24-09-2026 | **Laberinto de la Profundidad** ("porque Zygarde es Z de profundidad"). Laberinto privado (D04). |
| X05 | Carrera humana | TÉCNICO | El jugador puede correr (RUN) desde el inicio; la carrera de Zygarde 10% es más rápida y funciona como montura (biblia §8 distingue ambas). |
| X04 | Música del pueblo (dirección: nostálgica) | TÉCNICO provisional | Elegida de la biblioteca de Añil, reemplazable |

## Decisiones DECIDIDO-DEV (diseño de campaña, 24-09-2026)

Tomadas por el desarrollo con la autonomía concedida por el autor, sobre la biblia y las decisiones D01–D08, D02b, D05b,
X01, X03–X05. Todas son revisables. Detalle completo en `docs/CAMPANA.md` (atlas, Zygarde, bloques B02–B24, Genesis,
Gael, postgame y DLC), `docs/TABLILLAS.md` (T01–T15, museo, Crónica, Libreta) y `docs/POKEDEX_DISTRIBUCION.md`
(curva, tablas por zona, megapiedras, reconciliación). No reintroducen nada DESCARTADO en la biblia.

| ID | Decisión | Resolución | Justificación canónica |
|----|----------|------------|------------------------|
| D09 | Accesos de Corriente y Memoria | P2 por las cuestas de grava de la Ruta 3 y la Garganta del Albo (Correr, sin Nadar). P5 por la Marisma Turbia (Terreno complicado) tras P4. Trepar se recupera en el propio P5 | Biblia §6.2 (no exigir Nadar en P2), §6.5 (ni habilidades imposibles ni mover P6), §8 (Trepar tardío del 10%) |
| D10 | Cifras y ubicación de células y núcleos | Umbrales 10/18/25/35/50/60/70/100 con hitos. Células C001–C100 en 8 etapas (clave `cell_<mapa>_<n>`); 10 obligatorias antes del núcleo del P1. N1 Laberinto, N2 Colector del Parque Eólico, N3 Pilar Invertido, N4 Estación Talasa, N5 Villa Boreal (lo entrega Gael). Grafo S0–S10 con márgenes de +4 a +11; ninguna célula en zonas de Completa; cadena de resonancia (Fragmento N−1) | Biblia §8: cifras heredadas y grafo de disponibilidad sin bloqueos |
| D11 | Episodios T01–T15 y museo | Quince arcos regionales que son a la vez la Crónica de Axis. Museo de las Eras (Ciudad Lúmina), curadora Rosalía Quintana, T06 Tabla Acero (Sala de Réplicas). Sin umbrales de Tablillas por Pilar: solo P10 exige las 15 | Biblia §7: historia principal, 2–3 pistas, museo con función jugable, sin rutina Pilar–Tabla |
| D12 | Objetos de las tres Tablillas finales | 18 = 17 tablas de tipo + `LEGENDPLATE`. Arceus conserva `EARTHPLATE` (fase Tierra), `SPOOKYPLATE` (fase Fantasma) y `LEGENDPLATE` (fase Normal, sin equipar). `BLANKPLATE` retirada del reparto | Biblia §7, §10.8, §18: no inventar una «Tabla Normal»; orden de fases fijo |
| D13 | Actos de Genesis por capítulo | Investigación → ocupación → extracción → captación → culminación, con fachadas Consorcio y Fundación Meridiano (tabla en CAMPANA.md §5.4) | Biblia §9: presente desde el juego base; no destruye lo que necesita |
| D14 | Líder original | Dr. Aurelio Vértice (63, geofísico): mecenas en la gala del museo, revelado por pantalla en Talasa, combate en P9 (Mega Alakazam), huye de Axis en el epílogo | Biblia §9, §13.5; no se usan Helix ni Aster Vhal |
| D15 | Responsabilidad y ruptura del profesor | Alerce codiseñó la inducción de resonancia de la Laguna Clara (Proyecto Laguna, hace 16 años), avisó pero no lo impidió y calló. Revelación en 10 escenas de subtexto, lo más directo después del P5; sin confesión. Combate aliado en Talasa | Biblia §9, §13.4: tardía, sutil, con contenido moral real |
| D16 | Escenas y combates de Gael | Herida: «pidió permiso y esperó» (escena oculta de B01 revelada en P8). Combates B1–B6, doble aliado en P3, entrega de N5. B1–B5 no bloquean | Biblia §9, §13.3: alternancia de respeto, ayuda, orgullo y distancia |
| D17 | Mecánicas del Alma | Uxie: glifos de lo visto y lógica de caballeros y bribones. Mesprit: espejo invertido y controlar a Gael en su recuerdo. Azelf: combate sin mochila, nv 58. Tres Hebras trenzadas en el Telar → Cadena Roja. El trío no se captura en la historia | Biblia §6.8: sin trivia pura, sin equipo a 1 PS, sin transformación, sin herrero |
| D18 | Elección y captura Dialga–Palkia | Elección en P9 con la Cadena Roja; captura opcional por debajo del 50%; el Fragmento 9 se obtiene igual; el no elegido deja su orbe; reencuentro en Columna Lanza con el elegido y ese orbe | Biblia §6.9 y §12 (idea del autor); completado individual sin segundo jugador |
| D19 | Causa y ritmo del deterioro | Brecha del prólogo + dispersión de Zygarde dejan la red sin agente; la sincronía solo vuelve con Arceus. Fases 0–4 con síntomas locales que cada Pilar arregla; capa de cielo independiente del reloj | Biblia §3, §8, §14; TEC-06 |
| D20 | Motivación del Trío de las Nubes | Último sello del Pacto (Crónica XI) y alarma por el drenaje del Anillo de Captación de Genesis; ceden cuando Zygarde responde por el protagonista | Biblia §10.2: ni secuaces ni hipnosis; el motivo queda escrito en la Crónica |
| D21 | Captura voluntaria de Zygarde | En Columna Lanza, antes de tocar la Flauta. Honor Ball (`PREMIERBALL`) tocada, Forma Completa nv 70. Con el equipo lleno, envío obligatorio al PC desde el Arca. Las capacidades de campo siguen activas | Biblia §10.7: consentimiento, no apropiación |
| D22 | Motivo del combate de Arceus | Despierta «para medir»: una pregunta por fase. Confirma la profecía | Biblia §10.8 y D02b: no es malvado ni controlado y reconoce al jugador |
| D23 | Fases, captura y reintento | Tierra (Terrax) → Fantasma (Terror) → Normal (sin tabla); +25% PS al jugador en cada transición; captura solo en fase 3 bajo el 50%; Master Ball solo entonces; «Reintentar fase» o «Retirarse» con fase guardada; Arceus debilitado en fase 3 cuenta como victoria y se reencuentra en el postgame | Biblia §10.8–10.9, §15: clímax exigente sin pérdida permanente |
| D24 | Epílogo y Completa tras la crisis | Regreso por el nodo del Laberinto; Alerce entrega la llave del cuarto del fondo; Gael se va; Vértice sale de Axis. La Forma Completa se conserva por elección y vínculo; el Arca solo gestiona formas | Biblia §8, §10.9: sin Estabilizador |
| D25 | DLC de Gael | Península de Almenara, bloques D1-01…05; Gael usa los anillos de Hoopa para extraer residuos de resonancia (no captura legendarios); final abierto | Biblia §11: región nueva pequeña; sin suero, muerte ni secuestro de Zygarde |
| D26 | Origen de la Zygardita | Cristal natural EXP-03 formado donde Zygarde combatió tres noches; Genesis lo perfora en B11; en el DLC 1 responde al vínculo, no a la fuerza de Gael | Biblia §11: sin laboratorio que la sintetice, sin herencia ni regalo de Arceus |
| D27 | NPC y sistema del DLC 2 | Sabela Ferreiro, cronista y cartógrafa (Aduana Vieja de Nexo). Registro de Expediciones: 3 activas, Rumor → Indicio → Hallazgo, marcado en el mapa sin penalización | Biblia §12, §13.9: no es Galletano ni la curadora del museo |
| D28 | Distribución y reconciliación | Pokédex de 425 (+Bramaluna, Ditto, Sableye, Latias, Latios, 8 especies de Buceo). Tablas por zona verificadas por script (0 especies sin método). Megapiedras solo de la lista del autor | Biblia §16: reconciliaciones pendientes; 100% en solitario |
| D29 | Tasas y condiciones de captura | Alfa 1/64; variocolor 1/4096 (1/1365 con Amuleto Iris). Captura legendaria explicada en pantalla, intentos bloqueados gratuitos, reaparición al descansar | Biblia §15: rareza sin frustración |
| D30 | Arte final del elenco | Parcial: briefs de Genesis (paleta, uniformes) y descripciones del elenco nuevo; todo el arte sigue provisional y etiquetado hasta la aprobación del autor | Biblia §13, §14, §20: una imagen guardada no es un arte aprobado |
| X02 | Atlas de Axis | Atlas completo (CAMPANA.md §1): 12 poblaciones, Rutas 1–15, mar del sur en un solo mapa por capas | Biblia §17–18: topónimos propios; nombres antiguos solo si encajan |
| X06 | Guardianes de P1–P5 | Casilda Roquer (64, escepticismo, Roca/Tierra), Leandro Alcántara (38, orgullo), Abril Céspedes (19, tedio), Fermín Galena (51, carga familiar), Olvido Arrieta (78, fascinación) | Biblia §6, §13.7; D07 |
| X07 | Elenco secundario | Agente Olmedo, familia Arenzana, ayudante Lía, Rosalía Quintana, Nilo, Remedios, Ramón, Maestra Brasa, Rosendo, Don Evaristo, Peregrinos del Rey | D04, X03, biblia §13.8 |
| X08 | Genesis: fachadas, mandos y aspecto | Consorcio y Fundación Meridiano; Dra. Casia Varela y Ulises Garrido; uniforme petróleo, blanco clínico, carbón y magenta | Biblia §9, §13.6: sin el verde de Zygarde |
| X09 | Geografía | Río Albo nacido en la cascada del prólogo; Sima del Eje; Cumbre Azur con Columna Lanza; Antea hundida | Biblia §4 (el prólogo se revisita), §10.6 |
| X10 | Texto de la profecía | Diez versos Unown, uno por Pilar; confirmación de Arceus en Columna Lanza | D02, D02b |
| X11 | Crónica de Axis | Los Custodios, la Tañedora y el Rey del Eje; la Crónica IX deja ambiguo quién abrió la Sima | Biblia §3: historia antigua incompleta e interpretable; §10.8 |
| X12 | Transporte | Tren tras P4, ferris tras P7, Vuelo con Completa, Red de Convergencia en el postgame | Biblia §8: transporte previo a Completa; el Salto no une ciudades |
| X13 | Iniciales restantes | El no elegido lo da Alerce tras P2; el de Gael, en huevo en el epílogo | Biblia §15: completado en solitario |
| X14 | Mega Aro | Piedra activadora de la Cantería Solano montada por Bea Solano en T04 (jugador ~nv 28) | Biblia §11, §15: suficientemente pronto |
| X15 | Arca de Zygarde | `ZYGARDECUBE`: objeto de los antiguos Custodios hallado en el núcleo del P1 | Biblia §8, §17: gestión de formas sin coerción ni laboratorio |
| X16 | Anclaje espacial | Solo postgame (Senda del Lazo y Mundo Distorsión profundo) | Biblia §6.6, §8: nunca llave del P6 |
| X17 | Cañas y Cordón Unión | Caña Vieja (Caudal), Caña Buena (Nexo), Supercaña (Caleta Sonda); Cordón Unión en Lúmina | Biblia §15 |
| X18 | Bastión Axis | Instalación de combate del postgame | Biblia §17 (nombre del historial que encaja) |
| X19 | Clave Glífica | `GLYPHKEY` (ID nuevo): lectura directa de Unown desde P5 | D02b |
| X20 | Música y fondos por situación | Tablas de BGM y battlebacks de CAMPANA.md §1.8 (TÉCNICO provisional) | Biblia §14; X04 |
| X21 | Topónimos del historial | Se reutilizan Caudal, Brontia, Estrato, Mnemos, Nexo, Boreal, Lúmina y Bastión Axis; no se usan Aldea Glífica, Laberinto del Orden ni Pueblo Pétreo | Biblia §17 |
| X22 | Nombre de la montaña del portal | **Monte del Portal** (mapa `montana_portal` de B01) | Biblia §4: lugar reconocible al revisitarlo en P6 |
| X23 | Kit común de Pilar | ~12 stamps de InteriorTorre y Cueva1 tintados por Pilar; ningún mapa repite bioma y tileset; nieve con Exterior1 (TÉCNICO) | Biblia §6 (gramática compartida), §14 |
| X24 | Libreta de pistas | `CLUENOTEBOOK`: 5 pestañas, máximo 3 pistas activas, cola, mínimo 2 garantizadas, descubrimiento directo | Biblia §7 |
| X25 | Descanso y sueños | «Descansar» cambia la franja; «dormir profundamente» activa sueños; «descansar hasta tormenta» en posadas; el cielo de crisis va aparte | Biblia §8, §12; TEC-06 |
| X26 | Círculo del Jardín | Evento opcional nocturno en Villa Alba tras P8 (Reconstrucción y Clefairy) | B01 (cartel del pueblo y el anciano de las piedras) |
| X27 | Objetos nuevos | `REDCHAIN`, `KNOWLEDGETHREAD`, `EMOTIONTHREAD`, `WILLTHREAD`, `GLYPHKEY`, `ALERCEKEY`, `DREAMCATCHER`, `MAGMASTONE`, `CRUCIBLESTONE`, `ANCIENTGEAR` → añadir a `items_axis.json` | Biblia §6.8 (nombres de la Cadena Roja abiertos) |
| X28 | Megapiedras fuera de la lista del autor | `GENGARITEY`, `GARCHOMPITEZ`, `INTELEONITE` y el resto de megapiedras de Añil no listadas no se distribuyen | Biblia §16.5; queda a elección del autor ampliarlas |
| X29 | Guardería y crianza (DECIDIDO-DEV) | Guardería de Lúmina: abre tras T06 (antes «el patio está lleno»); reglas de crianza de Essentials con la configuración de Añil (gen 9). Una sola encargada entrega también el Huevo | CAMPANA §B24 (Phione con Manaphy y Ditto en la guardería); biblia §12 |
| X30 | Tamaño del Monte del Portal (DECIDIDO-DEV, B12) | `montana_portal` queda en **50×50** (el atlas de CAMPANA §1.4 decía 50×70): el mapa del prólogo se amplía 6 columnas al este (macizo con la repisa de la cascada y su gruta, poza mayor) sin mover coordenadas; crecer 20 filas obligaría a desplazar el prólogo o la llegada (17,48) desde el campamento del B11. La subida se completa con la Ruta 10 alta y el campamento (B11) | Biblia §4 (el lugar del prólogo, reconocible); CAMPANA §1.8 (producción) |
| X31 | Calzada del Rey y Sima del Eje (DECIDIDO-DEV, B19) | Los Peregrinos cruzan «por su Calzada, a pie, o no se llega» (por eso nunca volaron a la Peña); Casandra rompe la regla y cruza con su Noivern al ver alzarse el último tramo, y su Noivern trajo años atrás la Salamencita del nido de la cima. Tramos de T15: piedras forzadas que aguantan un paso (hay que pisarlas todas y acabar junto a la aguja; reiniciables). `sima_eje`: sendero del oeste entre las bajadas de B17 (Metagrossita) y, al este, la Calzada que baja de la Peña hasta el Umbral; su último tramo solo se alza con la Tabla Draco. El Mirador de la Calzada se visita desde el P4 (Peregrinos esperando, sin piedras) | TABLILLAS T15 («estabilizar los tramos… en tres puntos», «la Libreta tiene el camino completo al fondo»); CAMPANA B19 y §1.4 |

**X33 — Multijugador online** (DECIDIDO-DEV y pedido del usuario, 25-09; función del juego, no de la historia):

- **Salas:** con código de 4 caracteres, hasta 8 jugadores, desde «Online» en el menú de pausa.
- **Combate 1 contra 1:** con niveles reales (decisión del usuario).
- **Jugar en equipo** (corregido por el usuario el 26-09: «la idea es contra los entrenadores de la historia»): dos jugadores forman equipo. Cuando un entrenador de la historia reta a uno de ellos con el compañero en el mismo mapa, combaten los dos juntos contra él en un doble, con su equipo real. Cuenta para las dos partidas: experiencia, dinero, movimientos, evoluciones y entrenador derrotado. Los jefes con fases y los combates que ya son dobles siguen siendo individuales. El modo anterior contra dos entrenadores inventados se ha quitado.
- **En ambos modos:** los equipos se curan en copia; no hay objetos, experiencia ni dinero, y la partida no cambia (perder no te devuelve al Centro Pokémon).
- **Rendirse y desconexiones:** se puede rendir. Si el otro jugador se desconecta, en el 1 contra 1 ganas tú; en el doble en equipo pierden los dos.
- **Pendientes pedidos por el usuario:** intercambios, chat y emotes.

**X34 — Tono de Zygarde y células** (DECIDIDO (autor, 25-09-2026); prevalece sobre CAMPANA §2.2, §3.2 «voces» y
B01 §4.8). Palabras del autor: «quiero que las mecánicas sean más ocultas, no que Zygarde te diga que vas a tener tal
mecánica en tal momento. Zygarde es un legendario serio… No le importas de nada. Si habla tanto pierde lo imponente».

- **Zygarde habla muy poco.** Solo conserva sus líneas canónicas (literales de CAMPANA y del guion B01 §4.6) y, como
  mucho, una o dos imprescindibles de trama por bloque. Fuera: comentarios de ambiente, direcciones, agradecimientos,
  cariño, complicidad, conteos, pistas de puzle y **cualquier anuncio de capacidades futuras** (p. ej. «Cuando recupere
  más de mí…» en la grava de la Ruta 1). Los bloqueos por capacidad se explican solo describiendo el terreno. Las
  reglas de puzle necesarias pasan a narración neutra o a un NPC; los tutoriales de Reconstrucción y de los cristales de
  eje (`tutorial` de `rebuildGap`/`axisCrystal`) son narración, no telepatía. La Libreta ya no muestra «Zygarde: «Allí
  no llego todavía.»».
- **Al hablarle** fuera de un hito: se gira y calla («El Core te mira un instante. No dice nada.»). Si un hito espera
  células, solo dice la canónica «Me faltan N partes.». Escenas genéricas de «recuerdo»: solo las líneas canónicas
  (Embestida, Terreno, Trepar, Forma Completa, Salto); el resto se activa con el aviso del sistema.
- **Al recoger una célula:** sonido de obtención, texto con el contador y destello breve. Sin reacción ni gratitud (se
  quita «Una parte de mí. Gracias.»). Se mantiene «Aquí. Una parte de mí.» en la escena de C001 (CAMPANA, literal).
- **Sin pitido/latido de proximidad** (ni brillo en el Core ni flecha): no es una mecánica de Zygarde en el lore y
  molesta junto a células aún inalcanzables. La **Detección mejorada** (60 células) queda como marcas discretas y
  silenciosas en el mapa regional de los lugares visitados (y la crisis del P8, como antes); se mantiene el rótulo
  «Células: n/m».
- **Célula en el mapa:** solo el sprite original del autor (`zygarde_celula`), quieta y apoyada en el suelo: sin
  animación, sin flotar, sin brillo hexagonal ni luz propia, con opacidad 210/255 para que se vea sin llamar la atención.

**X35 — Curva del principio y fugas de progresión** (DECIDIDO (autor, 25-09-2026); prevalece sobre CAMPANA §2.5 S0,
B02–B04, §6.3 B2 y POKEDEX_DISTRIBUCION §7.1). Palabras del autor: «Apenas salgo de elegir el inicial, que es nivel 6,
en la primera ciudad tengo que pelear contra mi rival y ya es nivel 12: es mucha diferencia, tendría que ser menos
nivel. […] En la Senda del Mirador peleo contra Óscar, nivel 60, con un fondo de pelea como en el espacio, justo abajo
de Ciudad Caudal: seguimos en el inicio, como máximo nivel 30.»

- **Curva del principio rebajada.** Zaguán y Explanada 5–8 (antes 7–12); Ruinas del Dintel 5–8 y sus entrenadores
  5–8 (antes 6–9); **Casilda 9/9/10** (antes 11/11/12); Geodude de la Cámara 7. Ruta 2: hierba 6–10, miel 7–11,
  entrenadores 7–10; Caudal: entrenadores 10–11, Caña Vieja 8–13. **Gael B2: Starly 8, Riolu 9, inicial 10** (antes
  12/12/14). B04 dos niveles menos: hierba 11–16, grutas 12–16, Pilar 13–18, entrenadores 13–17, técnicos 14–16,
  **Leandro 17/17/18/19**. Desde B05 la curva no cambia (B05 ya empieza en 18–22).
- **Orden B02 → B03 obligado.** El puente del arroyo de la Ruta 2 tiene los tablones sueltos por los temblores: un
  operario del concejo de Zaguán no deja pasar hasta el P1 (`progression_gates.js#ruta2BridgeGate`). Así Caudal y el
  B2 de Gael llegan después de Casilda (S0 de CAMPANA §2.5 queda en «Ruta 2 hasta el puente»; C013 pasa a S1). Una
  partida guardada que ya estuviera en Caudal (`b03_gael_b2`) no queda encerrada: el operario la deja pasar.
- **Senda del Mirador cerrada hasta el P8.** Verja de hierro con candado y cartel de la Casa de las Esclusas
  («desprendimientos hacia la Sima») en el camino sur de Caudal, y los rápidos del Albo en el borde sur del río (con
  Nadar no se baja nadando); la orilla este del río, vallada como la oeste. Se abre con `p8_restored` (B17). Los
  entrenadores de la Senda y del Mirador Sur solo existen tras el P8: el tipo de evento `trainer` ignoraba su `when`
  (corregido en `world/eventTypes.js`). Fondo de combate de la Senda: **Acantilado** (antes Espacio).
- **Auditoría de fugas** (`tools/audit_progression.mjs`, test `tests/progression_audit.test.mjs`): por cada etapa
  (estado de entrada de B01–B21 del modo desarrollador) recorre el mundo con la pasabilidad real y las capacidades de
  Zygarde de ese momento y falla si un mapa alcanzable tiene entrenadores o salvajes más de 8 niveles por encima del
  nivel esperado. Fugas que encontró y cierres: (1) Caudal y la Senda desde el principio (arriba); (2) el prado del
  cerro de los molinos de **Brontia** llegaba al borde norte y salía a la **Ruta 11** (nv 53–57) sin pasar por el
  hielo-eco: el pinar de la meseta sigue ahora por encima del cerro; (3) la **Supercaña** del B09 pescaba en el Mar del
  Sur a 45–50 con el jugador a ~38: su tabla pasa a 40–46. Los cierres de contacto que devuelven al jugador
  (`blockedLink` de los bloques, niebla del Neblino) llevan `gate: true` para que la auditoría los trate como muros.

**Nota técnica detectada (propuesta TEC-07):** `tools/extract_data.mjs` descarta los campos vacíos de `Evolutions`, por
lo que `species.json` pierde o desalinea las evoluciones con parámetro vacío (`Happiness`, `Trade`: Golbat, Buneary,
Chansey, Cleffa, Pichu, Munchlax, Riolu, Azurill, Togepi, Pawmo, Kadabra, Graveler, Machoke, Haunter, Gurdurr, Eevee).
Hay que conservar los vacíos al trocear en tripletas antes de implementar evoluciones.
