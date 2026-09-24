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
| D09 | Accesos de Corriente y Memoria | PENDIENTE | |
| D10 | Cifras y ubicación de células/núcleos | PENDIENTE | Umbrales provisionales de la biblia §8 |
| D11 | Episodios de Tablillas T01–T15 (museo incluido) | PENDIENTE | |
| D12 | Objetos/IDs de las tres Tablillas finales | PENDIENTE | |
| D13 | Actos y apariciones de Genesis por capítulo | PENDIENTE | |
| D14 | Nombre, diseño, equipo y fuga del líder original | PENDIENTE | |
| D15 | Responsabilidad previa y ruptura del profesor | PENDIENTE | |
| D16 | Logros, derrotas y escenas intermedias de Gael | PENDIENTE | |
| D17 | Mecánicas exactas del Alma | PENDIENTE | |
| D18 | Elección/captura Dialga–Palkia | PENDIENTE | |
| D19 | Causa y ritmo del deterioro global | PENDIENTE | |
| D20 | Motivación del Trío de las Nubes | PENDIENTE | |
| D21 | Captura voluntaria de Zygarde y equipo completo | PENDIENTE | |
| D22 | Motivo del combate de Arceus | PENDIENTE | |
| D23 | Reglas de fases, captura y reintento final | PENDIENTE | Orden fijo Tierra → Fantasma → Normal (VIGENTE) |
| D24 | Epílogo y Complete después de la crisis | PENDIENTE | |
| D25 | Región nueva, episodios y final del DLC de Gael | PENDIENTE | |
| D26 | Origen/obtención de Zygardita | PENDIENTE | |
| D27 | NPC del DLC 2 y sistema de misiones activas | PENDIENTE | |
| D28 | Distribución de 412 especies y nuevas necesidades | PENDIENTE | |
| D29 | Tasas Alpha/shiny y condiciones de captura | PENDIENTE | |
| D30 | Arte final de protagonistas y resto del elenco | PENDIENTE | Arte provisional etiquetado mientras tanto |

## Otras decisiones abiertas detectadas al implementar

| ID | Decisión | Estado | Nota |
|----|----------|--------|------|
| X01 | Nombre del pueblo inicial | DECIDIDO 24-09-2026 | **Villa Alba** |
| X02 | Atlas de Axis: nombres de rutas y ciudades | PENDIENTE | Biblia §17: nombres antiguos no aceptados. Se propondrá un atlas al autor. |
| X03 | Nombre del área restringida | DECIDIDO 24-09-2026 | **Laberinto de la Profundidad** ("porque Zygarde es Z de profundidad"). Laberinto privado (D04). |
| X05 | Carrera humana | TÉCNICO | El jugador puede correr (RUN) desde el inicio; la carrera de Zygarde 10% es más rápida y funciona como montura (biblia §8 distingue ambas). |
| X04 | Música del pueblo (dirección: nostálgica) | TÉCNICO provisional | Elegida de la biblioteca de Añil, reemplazable |
