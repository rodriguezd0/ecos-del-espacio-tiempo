# Registro de decisiones — Ecos del Espacio-Tiempo (Axis)

Fuente de canon: `docs/biblia_axis_v2.txt` (Biblia narrativa v2.0, 24-09-2026). Este registro añade las
decisiones posteriores del autor con fecha. **Nada marcado PENDIENTE se fija en el juego sin respuesta del autor**;
mientras tanto se usa un marcador provisional etiquetado (`[PROVISIONAL Dxx]`) o se omite.

Estados: VIGENTE (biblia) · DECIDIDO (autor, fecha) · PREGUNTADO (esperando respuesta) · PENDIENTE · TÉCNICO (decisión de implementación sin impacto narrativo).

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
| D01 | Nombre y vida cotidiana de ambos protagonistas | PENDIENTE | |
| D02 | Razón concreta de la elección del Core | PENDIENTE | |
| D03 | Nombre, especialidad, edad y diseño del profesor | PENDIENTE | |
| D04 | Motivo inicial de la restricción policial | PENDIENTE | |
| D05 | Secuencia exacta de iniciales, señal, regreso y primer duelo | PENDIENTE | Dirección vigente: duelo con Gael tras regresar con el Core |
| D06 | Transporte del Core frente al sprite sin mochila | PENDIENTE | |
| D07 | Identidad, prueba y equipo del Guardián del Umbral | PENDIENTE | |
| D08 | Versión del puzzle/Geodude del Umbral | PENDIENTE | |
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
| X01 | Nombre del pueblo inicial | PENDIENTE | Biblia §5: sin topónimo definitivo |
| X02 | Atlas de Axis: nombres de rutas y ciudades | PENDIENTE | Biblia §17: nombres antiguos no aceptados |
| X03 | Nombre del área restringida (¿"Laberinto del Orden"?) | PENDIENTE | Biblia §5 |
| X04 | Música del pueblo (dirección: nostálgica) | TÉCNICO provisional | Elegida de la biblioteca de Añil, reemplazable |
