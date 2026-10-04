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
> 3. Arte humano integrado; pendiente el pase visual final y la aprobación del autor (D30).
> 4. Postgame B22 completo: a–e recorridos en Chrome, incluidos los siete encuentros de B22c.
> 5. Almenara terminada: 13 hitos y 9 combates reales en Chrome. Expediciones terminadas: 30/30 Hallazgos, 47 combates y ambas islas marcadas en el atlas real.
> 6. Partida continua desde «Nueva partida»: B01–B03 recorridos con el mismo guardado, equipo, dinero y objetos obtenidos en juego.
>
> Pendientes menores:
> - Solape en dobles corregido (3c0bafe): posiciones, sombras y efectos revisados en combate cooperativo real.
> - El creador tiene que confirmar la regla de tamaño de los Pokémon en el mapa (afecta a unas 140 especies).
> - Rocas de cueva: implican rehacer 3 puzles.

Actualizado: 04-10-2026. En marcha: **auditoría de obtención, revisión visual y partida continua hasta los créditos**.

## Objetivo activo: terminar el juego completo

El trabajo continúa hasta cerrar la campaña, el postgame y los dos DLC. Una tanda terminada no cierra este objetivo.
La rama de pausa se revisa por módulos; sus versiones antiguas de mapas no sustituyen las correcciones guardadas.

| Frente | Estado al reanudar | Verificación necesaria |
|---|---|---|
| Campaña B01–B21 | Implementada; los diez Pilares verticales terminados y probados | Recorrido continuo sin saltos de progresión, final y carga del epílogo |
| Arte humano | Acciones de protagonistas M/F integradas y probadas | Pase visual de poses y NPC de combate; sin recortes ni solapes |
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
  Falta el pase visual final de poses de combate. Zygarde no se toca.
- **Diseño de la protagonista:** registrarlo como X32 en DECISIONES (X31 ya lo ocupa B19).
- **Sprites de combate de NPC/entrenadores** en estilo BW (pase de arte).
- **Core y célula de Zygarde:** ya son los sprites originales del creador (hecho, f5c89f2).

## 5. Cierre del contenido
- B22a–e y B23 «Almenara» implementados y recorridos; documentación junto a sus mapas y herramientas `e2e_b22*.mjs` / `e2e_b23.mjs`.
- B24 «Registro de Expediciones» implementado y recorrido con 30/30 Hallazgos (`e2e_b24.mjs`).
- Catálogo de la Pokédex corregido a 425 entradas; generador y numeración anterior verificados (e717e01). Auditoría de obtención en marcha.
- Partida continua completa y pasada de balance (`e2e_campaign.mjs`), sin preajustes ni saltos de progresión.

## 6. Menores
- El seguidor Zygarde a veces aparece encima del jugador en las capas de eco (B14).
- Gael B6 (B20): comprobar `megaRingName: 'el aro negro'`.

## Forma de trabajar (pedido del usuario)
Menos agentes a la vez, informes frecuentes. El usuario quiere supervisar el desarrollo.
