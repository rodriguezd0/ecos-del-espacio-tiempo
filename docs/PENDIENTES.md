# Pendientes (lista viva)

Actualizado: 25-09-2026. Prioridad actual: **multijugador** (pedido del usuario, va antes que todo lo demás).

## 0. En curso — Multijugador online (salas)
- Fase 1: servidor WebSocket en `server.mjs`, salas con código, ver a los demás jugadores moverse en el mapa (baja latencia).
- Fase 2: combates entre jugadores (link battle).
- Fase 3: intercambios.

## 1. Trabajo apartado (git stash)
`git stash@{0}` («pausa 25-09 …») guarda trabajo a medias. Hay que hacer `git stash pop` antes de reanudarlo.
HEAD es jugable. Solo falla `tests/prota_kit.test.mjs`, porque su módulo está en el stash.

## 2. Correcciones del creador (jugó B01–B03)
Workflow `correcciones-creador-1` (run wf_fd38598a-a68). Ningún agente llegó a terminar.

**Modo desarrollador (F9), permanente:**
- dar cualquier Pokémon al nivel que se quiera, y cualquier objeto;
- teletransportarse a cualquier mapa;
- saltarse puzzles.

**Cámara:** debe seguir siempre al jugador; ahora se para en los bordes.

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
- **P1–P5:** piso 1 con entrenadores, piso 2 con puzzle, piso 3 con el Guardián. Workflow `pilares-verticales` (run wf_f8a908cb-c5a).
- **P6 (Mundo Distorsión):** solo puzzles con habilidades de Zygarde; sin Pokémon ni guardianes.
- **P7–P10:** con Pokémon. Propuesta de pisos pendiente de que el creador la confirme:
  - P7: ruinas de Antea → capas del tiempo → Bramaluna Alfa
  - P8: Uxie → Mesprit → Azelf + Telar
  - P9: puente (Casia, Garrido, Vértice) → Cámara del Cruce → Dialga/Palkia
  - P10: Senda → Cielo Interior (Trío) → Gael + núcleo
- Registrar en DECISIONES.

## 4. Arte
- **Protagonistas M/F** en estilo BW chibi: dibujados; falta la revisión. Workflow `arte-protas-zygarde` (run wf_fb80f3df-d58). Zygarde no se toca.
- **Diseño de la protagonista:** registrarlo como X32 en DECISIONES (X31 ya lo ocupa B19).
- **Sprites de combate de NPC/entrenadores** en estilo BW (pase de arte).
- **Core y célula de Zygarde:** ya son los sprites originales del creador (hecho, f5c89f2).

## 5. Contenido restante
- Postgame B22a–e: `scratchpad/ecos_bloques.js` + `wave_f_args.json` (run wf_f4c72cc4-f59).
- DLC B23 «Almenara» + B24 «Registro de Expediciones»: `wave_g_args.json`.
- Partida continua completa y pasada de balance.

## 6. Menores
- El seguidor Zygarde a veces aparece encima del jugador en las capas de eco (B14).
- Gael B6 (B20): comprobar `megaRingName: 'el aro negro'`.

## Forma de trabajar (pedido del usuario)
Menos agentes a la vez, informes frecuentes. El usuario quiere supervisar el desarrollo.
