# Postgame V: Porvenir, Bastión y regreso a Axis

Requiere `game_cleared` y `b21_fin`. Todos los contenidos se completan en solitario.

La Grieta del Porvenir se abre desde la boca del Mirador Sur (28,18), examinándola desde (28,19).
Su salida sur devuelve al Mirador. Las siete Paradojas se capturan con las reglas normales:
Ferrodada aparece tras recorrer el cauce a pie; Ferrosaco se acerca al quedarse quieto cinco segundos
por la noche; Ferropolilla sigue la luz nocturna; Ferrocuello aparece al amanecer; Ferropalmas tras
encajar los tres bloques con Embestida; Ferropúas durante una tormenta; Ferropaladín a mediodía después
de ver a los otros seis. Rosalía permite esperar al amanecer, mediodía o noche. La tormenta se obtiene
descansando en las posadas existentes.

El taller conserva sus bloques en la partida. La palanca reinicia **todos** los bloques si el puzzle
no está terminado; así también recupera un bloque encajado en el zócalo equivocado. Una plataforma ya
resuelta se conserva. Si se debilita una Paradoja, vuelve después de un descanso; perder cura al equipo
sin modificar dinero ni punto de cura.

El marinero del Mar del Sur (135,17) lleva al Bastión Axis. Desde la isla se vuelve por el barquero.
La recepción inscribe tres Pokémon distintos, vivos y sin huevos. Cada combate usa copias curadas a
nivel 50; conserva movimientos y objetos equipados. IA 120, siete combates por ronda, dos PB por
victoria y cinco extra al terminar la ronda. La racha de 21 se registra como dominio del Bastión.
La derrota reinicia la racha; récord y PB permanecen. El canje vende objetos por PB y hay Centro/PC.
La Mochila está sellada: el inventario, equipo, dinero y punto de cura reales se conservan. Las
exhibiciones aíslan el estado en `battleFlow`, el runner y `SceneBattleUI`.

Casilda, Leandro, Abril, Fermín y Olvido esperan en el piso 3 de sus Pilares para revanchas de nivel
72–75. Tras ganar hay que descansar para repetir. Una derrota permite reintentar sin pérdida. Casilda
conserva la pista nocturna de Marshadow.

La llave del epílogo abre la puerta del fondo del laboratorio de Alerce sin gastarse. Cuatro archivos
del Proyecto Laguna registran foto, calibración, fechas y cuaderno. Alerce responde con subtexto,
sin confesión. La salida devuelve a (13,4) del laboratorio. En Talasa, la trampilla de mantenimiento
(9,34) lleva al laboratorio abandonado: Ditto visible capturable, encuentros repetibles de Ditto
65–70 y una Alakazamita única. Se vuelve a la cubierta (9,33).

Arte de objetos: `node tools/b22e_assets.mjs` (provisional D30). Mapas/eventos mantienen IDs persistentes.
Verificación Node: los archivos `tests/b22e_*.test.mjs` y `tests/world_clock.test.mjs`.
Recorridos Chrome: `node tools/e2e_b22e.mjs --only=` con `grieta`, `taller`, `bastion`, `rooms` o `guardians`.
En Bastión la prueba escoge Mochila con teclas reales y continúa con siete victorias, canje, derrota y barco.
Los combates y capturas se resuelven en el motor; los fixtures fijan equipo, progreso y semilla.
