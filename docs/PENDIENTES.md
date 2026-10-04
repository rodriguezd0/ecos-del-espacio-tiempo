# Pendientes (lista viva)

> **Reanudado el 03-10-2026 desde master (274c47d).**
>
> Hecho antes de la pausa (hasta el commit 030e80d; notas de pausa en 274c47d):
> - el multijugador completo, incluido el juego en equipo contra los entrenadores de la historia;
> - el título renovado;
> - las partidas guardadas en disco (`saves/`);
> - las tandas 1–4 de correcciones del creador:
>   - modo desarrollador F9;
>   - tono de Zygarde y células;
>   - combate y animaciones de Añil;
>   - curva inicial y cierres de progresión;
>   - cámara siempre centrada;
>   - reglas de mapas;
>   - mapas B01–B21 limpios.
>
> **Tanda 5 terminada (03-10): Pilares verticales P1–P5.**
> - Suite: 1631/1632; solo falla el `prota_kit` previo.
> - Recorridos en navegador: puzzles, derrotas/reintentos, restauraciones y regresos de los cinco Pilares.
> - Validador sin errores; 47/47 costuras limpias, sin avisos nuevos de mapas.
> - Despedidas de Abril y Fermín adaptadas a sus escaleras; montaje del final actualizado.
> - Prueba cooperativa reproducible: rival generado con semilla, igual que equipos y decisiones.
>
> Después:
> 1. P6 terminado: solo puzzles, sin Pokémon ni Guardianes.
> 2. P7–P10 terminados con el reparto confirmado por el creador el 03-10: puzzles, combates reales, pisos, regresos y migración de guardados probados en Chrome.
> 3. Arte humano integrado y revisado: trece poses de NPC, dos lanzamientos y 15 capturas en Chrome. Pendiente la aprobación artística del autor (D30).
> 4. Postgame B22 completo: a–e recorridos en Chrome, incluidos los siete encuentros de B22c.
> 5. Almenara terminada: 13 hitos y 9 combates reales en Chrome. Expediciones terminadas: 30/30 Hallazgos, 47 combates y ambas islas marcadas en el atlas real.
> 6. Partida continua desde «Nueva partida»: B01–B12 recorridos y guardados por UI; B13 en marcha, con el mismo equipo, dinero y objetos obtenidos en juego. Último guardado: Villa Alba, 57 células, diez Tablillas, tres Núcleos y seis Fragmentos. P6, sus caídas sin daño y sus regresos están comprobados; la forma 50 % habilitó Nadar y Togepi eclosionó caminando.
> 7. QA final de P8–P10: escalera visible del Puente, columnas y fachadas sin solapes accidentales. Las 45 conexiones siguen limpias; subida y regreso de P9 recorridos en Chrome.
>
> Pendientes menores:
> - Solape en dobles corregido (3c0bafe): posiciones, sombras y efectos revisados en combate cooperativo real.
> - El creador tiene que confirmar la regla de tamaño de los Pokémon en el mapa (afecta a unas 140 especies).
> - Rocas de cueva: implican rehacer 3 puzles.

Actualizado: 04-10-2026. En marcha: **partida continua hasta los créditos y revisión final de integración**.

## Objetivo activo: terminar el juego completo

El trabajo continúa hasta cerrar la campaña, el postgame y los dos DLC. Una tanda terminada no cierra este objetivo.
La rama de pausa se revisa por módulos; sus versiones antiguas de mapas no sustituyen las correcciones guardadas.

| Frente | Estado al reanudar | Verificación necesaria |
|---|---|---|
| Campaña B01–B21 | Implementada; los diez Pilares verticales terminados y probados | Recorrido continuo sin saltos de progresión, final y carga del epílogo |
| Arte humano | Acciones M/F, trece poses de NPC y dos lanzamientos integrados; 15 capturas de Chrome sin errores | Aprobación artística D30; comprobación en la partida continua |
| B22, postgame base | a–e implementados y recorridos en Chrome; B22c incluye siete capturas y sus retornos | Auditoría final de requisitos e integración |
| B23, Almenara | D1-01…05 terminadas; derrota/reintento de Gael, Mega Zygarde, sellado, captura opcional y regreso real probados | Revisión visual y suite de integración |
| B24, Expediciones | 30/30 Hallazgos recorridos en Chrome; siete Ultrazonas, Naganadel, Necrozma y ambas hipótesis insulares probados | Auditoría final de obtención e integración |
| Sistemas y balance | Base jugable y multijugador terminado | Guardados y migraciones, crianza/evoluciones, captura, viajes, economía y combates dobles |
| Cierre | Pendiente | Suite completa sin fallos, validador, costuras/QA, pruebas reales y auditoría de requisitos |

Las decisiones del autor pendientes se mantienen identificadas como provisionales hasta recibir su respuesta.
Los criterios de cierre se contrastan con CAMPANA, DECISIONES, TABLILLAS, POKEDEX_DISTRIBUCION y COBERTURA.

## 0. Terminado — Multijugador online (salas)
- Fase 1 HECHA (d94e15d): salas con código, ver a los demás jugadores moverse en el mapa (baja latencia), entrada Online.
- Fase 2 HECHA: combate 1 contra 1 (niveles reales) y juego en equipo contra los entrenadores reales de la historia.
- Fase 3 HECHA: intercambios, chat de texto y emotes. También: Online desde la pantalla de título, pantalla de
  título renovada y partidas guardadas en el disco del servidor (carpeta `saves/`).
- Solape en dobles corregido: el espacio de ambos sprites se calcula con todos sus fotogramas, y sombras y efectos siguen sus posiciones.
- Evoluciones por horario en equipo corregidas: ambos jugadores usan el horario del combate. Cinco regresiones y dos recorridos Chrome con relojes opuestos verifican Espeon y Umbreon.

## 1. Trabajo apartado (rama)
El trabajo a medias de arte y postgame está en `wip-pausa-25-09`; no hay ningún stash.
Se debe retomar y revisar en esa rama antes de integrarlo. Master conserva la versión jugable.
El módulo que faltaba en `tests/prota_kit.test.mjs` ya está integrado; esa prueba vuelve a pasar.

## 2. Correcciones del creador (jugó B01–B03): tandas 1–4 terminadas
Las correcciones enumeradas abajo se completaron y guardaron hasta 030e80d, salvo el pase de arte humano y la
regla de tamaño de los Pokémon en el mapa. Se conserva la lista original como referencia.

**Modo desarrollador (F9), permanente:**
- dar cualquier Pokémon al nivel que se quiera, y cualquier objeto;
- teletransportarse a cualquier mapa;
- saltarse puzzles.

**Cámara (hecho):** sigue siempre al jugador, incluidos bordes y esquinas.

**Costuras entre mapas** (árboles cortados, carteles y plantas atravesando árboles, caminos que acaban de golpe):
- Villa Alba↔Ruta 1
- Ruta 1↔Zaguán
- Zaguán↔Ruta 2
- Ruta 2↔Caudal: además, paso brusco de tierra a piedra
- Caudal↔Ruta 3
- Rehacer la Ruta 3.
- La transición del puente de Caudal es brusca.

**Detalles de mapa:**
- Pokéballs de los iniciales cortadas por la mitad; una roca a la mitad.
- Flores y la casilla superior de un árbol (sin árbol encima) deben poder pisarse.
- Se atraviesa la parte de arriba de las rocas; hay rocas de agua puestas en tierra.
- Escalera junto a una valla que no lleva a ningún sitio.
- Dos flores cruzan el camino junto a la farola de Zaguán.
- Un guijarro de la zona de grava bloquea el paso.
- Un árbol atraviesa la montaña junto a la cascada.
- La entrada de las Ruinas del Dintel está mal hecha.
- La Senda del Mirador (Óscar, nv 60) es accesible desde Caudal al principio y tiene fondo de combate «espacio».

**Combate:**
- Litten flota; los fondos se ven pixelados.
- Los sprites humanos son «cuadrados».
- La animación de Paliza muestra balls en vez de un puño.
- Gael B2 a nivel 12 es demasiado alto frente a un inicial de nivel 6.

**Zygarde:**
- Serio y habla muy poco. No anuncia mecánicas («Cuando recupere más de mí…») ni agradece las células.
- Sin pitido de células.

**Escenas:** Gael y Casilda se teletransportan.

**Overworld:** Onix y Yanma se ven enormes.

## 3. Pilares (decisión del creador: TODOS verticales, de 3 pisos)
- **P1–P5 implementados (X36):** piso 1 con entrenadores, piso 2 con los puzzles originales, piso 3 con el Guardián
  y núcleo. Columnas exteriores de piedra en los cuatro biomas. Conservan niveles, recompensas, células y progreso
  de partidas anteriores. P3 tiene dos mapas de puzzle en el mismo piso; el Archivo de Mnemos es el piso 1 de P5.
  Revisados y probados en navegador. Workflow `pilares-verticales` (run wf_f8a908cb-c5a).
- **P6 (Mundo Distorsión):** implementado y recorrido en navegador; Cara Vuelta → Mirada → Sumidero y sello.
  Solo puzzles con habilidades de Zygarde; sin Pokémon ni guardianes. Conserva la sombra de Giratina.
- **P7–P10:** con Pokémon. Reparto confirmado por el creador el 03-10:
  - P7: ruinas de Antea → capas del tiempo → Bramaluna Alfa
  - P8: Uxie → Mesprit → Azelf + Telar
  - P9: puente (Casia, Garrido, Vértice) → Cámara del Cruce → Dialga/Palkia
  - P10: Senda → Cielo Interior (Trío) → Gael + núcleo
- Decisión registrada en `docs/DECISIONES.md` (X36); reparto de P1–P5 en `docs/CAMPANA.md` §1.5.

## 4. Arte
- **Protagonistas M/F** en estilo BW chibi: acciones y sprites integrados (c362de9), 51 pruebas y 18 capturas de navegador.
  Las espaldas de combate también tienen el pase de torso, mochila y lanzamiento del 04-10.
- **Diseño de la protagonista:** registrado como X32 en DECISIONES.
- **Sprites de combate de NPC/entrenadores:** trece frontales rehechos a escala de Añil; 36 pruebas y 15 capturas en Chrome. Comparativas en `tools/cache/arte-final/`; falta aprobación artística D30.
- **Core y célula de Zygarde:** ya son los sprites originales del creador (hecho, f5c89f2).

## 5. Cierre del contenido
- B22a–e y B23 «Almenara» implementados y recorridos; documentación junto a sus mapas y herramientas `e2e_b22*.mjs` / `e2e_b23.mjs`.
- B24 «Registro de Expediciones» implementado y recorrido con 30/30 Hallazgos (`e2e_b24.mjs`).
- Catálogo de la Pokédex corregido a 425 entradas; generador y numeración anterior verificados (e717e01). Auditoría terminada: 425/425 métodos conectados en solitario y elecciones compatibles; 21 pruebas del auditor.
- Inventario de progresión auditado: 95 células físicas y cinco por guion, cinco núcleos, diez Fragmentos y dieciocho Tablillas. Fuentes registradas y entrada/retorno local de las 95 coordenadas; P8 parcial y C100 previas a Completo sin ciclos. El contrato usa fixtures declarados, separados de la partida continua; 146 pruebas existentes.
- Sinistea rechazado sigue disponible tras P5 y cargar la partida (a1eb5ea). Entregas con equipo y PC llenos corregidas: regalos pendientes, fósiles conservados y PC libre utilizado; 11 pruebas y dos recorridos Chrome.
- Wurmple y Happiny evolucionan con sus métodos reales; personalidad estable y consumo de Piedra Oval al aceptar, con seis regresiones nuevas.
- El guardado F9 espera a que termine la escena; las copias antiguas interrumpidas tras la televisión retoman
  créditos/despertar. Once regresiones nuevas, 35 pruebas enfocadas y once comprobaciones en Chrome sin errores;
  guardar/cargar el final recuperado conserva regalos únicos y capacidades.
- Suite actual: 2221/2221 sin fallos ni omisiones; validador: 272 mapas, sin errores.
- Pendiente: terminar la partida continua y la pasada de balance (`e2e_campaign.mjs`), sin preajustes ni saltos de progresión, y recargar el guardado tras los créditos.

## 6. Menores
- Seguidor Zygarde en B14 comprobado: la regla de profundidad existente lo deja detrás del jugador. Chrome: 12 posiciones en tres capas, formas 10 % y 50 %, seis capturas y ningún error.
- Gael B6 (B20): comprobado `megaRingName: 'el aro negro'` en su entrenador; también en B15.

## Forma de trabajar (pedido del usuario)
Menos agentes a la vez, informes frecuentes. El usuario quiere supervisar el desarrollo.
