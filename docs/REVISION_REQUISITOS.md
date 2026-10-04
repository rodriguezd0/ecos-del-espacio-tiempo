# Revisión de requisitos de cierre — 04-10-2026

Fuentes: `CAMPANA.md`, `DECISIONES.md`, `TABLILLAS.md`, `POKEDEX_DISTRIBUCION.md` y `COBERTURA.md`.
El objetivo sigue activo. La campaña, el postgame y los dos DLC están implementados; la partida continua está
en B13. Los bancos de bloque declaran sus preajustes de historia, equipo y recursos. La partida continua conserva
el guardado creado desde el título, con sus recompensas, derrotas, dinero y objetos reales.

## Campaña y progresión

| Requisito | Implementación y comprobación de bloque | Partida continua |
|---|---|---|
| B01: inicial, laberinto, Core, Gael y salida de Alba | Implementado; escenas, sigilo y primera entrega | Recorrido desde Nueva partida |
| B02–B03: Umbral, Casilda, Geodude, T01 y llegada a Caudal | P1 vertical; mecanismos, liberación, Guardiana y regresos | Recorrido y recompensas reales |
| B04: Corriente y Leandro | P2 vertical; fases hidráulicas, derrota/reintento y descenso | Guardado B04; Sobble recibido |
| B05: Molino, Brontia, T02 y T03 | Engranajes, técnicos, circuito, noche y Elekid | Guardado B05 |
| B06: Colector, N2 e Impulso | Doble con Gael, Casia, tres plantas, puzzle y Abril | Guardado B06 |
| B07: Cantería Solano | Tres salas, derrumbe, reinicio, rescate, T04 y Mega Aro | Guardado B07 |
| B08: Masa y Pulso de Estrato | Balanza, Fermín, cooperativa, torneo y defensa nocturna | Guardado B08 |
| B09a: Lúmina, Reserva y museo | Gala, Gael3, Vespiquen, T06/T07, regalos y Crónicas | Guardado B09a |
| B09b: Marisma, Nexo y Caleta | Bombas, lecturas, origen, T08 y accesos costeros | Guardado B09b |
| B10: Memoria | Recuerdos, Suelo Olvidado, Dos Manos, glifos, Olvido y F05/Trepar | Guardado B10; Sinistea en PC |
| B11: Neblino, Nilo, Íker y regreso a casa | Alarma/retorno, sigilo, T09/T10, huevo de Mamá y regresos por Trepar | Guardado B11: 52 células, diez Tablillas |
| B12: Pilar Invertido | P6 de puzzles: Cara Vuelta → Mirada → Sumidero; caídas, anclas y regresos | Guardado B12: 57 células, diez Tablillas, F06, N3 y Nadar |
| B13–B14: Talasa, Tizón y Antea | Bloques recorridos en bancos; capacidades acuáticas y P7 vertical | B13 en curso en el mismo guardado; B14 pendiente |
| B15–B16: Boreal y Alma | Buceo, Gael, P8: Uxie → Mesprit → Azelf/Telar | Pendiente en el mismo guardado |
| B17–B18: Mesa y Cruce | T14, P9: puente → Cámara → Dialga/Palkia; elección y regresos | Pendiente en el mismo guardado |
| B19–B20: Sima y Origen | P10: Senda → Cielo Interior → Gael/núcleo | Pendiente en el mismo guardado |
| B21: Columna y epílogo | Motor de fases, resolución y epílogo contrastados; recuperación de copias antiguas corregida | Pendiente en el mismo guardado |
| 100 células, cinco núcleos y diez Fragmentos | Fuentes y contrato auditados, 95 entradas/retornos locales; P8 parcial/C100 sin ciclo | Recogidas opcionales en curso; el cierre exige todos los totales |
| Dieciocho Tablillas | T01–T15 de episodios; Terrax/Terror/Legendaria tras Arceus, con captura o KO | Diez recibidas hasta B11 |

Evidencia continua: `tools/cache/campaign/campaign_checkpoint_B04.json`…`campaign_checkpoint_B11.json`,
`campaign_checkpoint.json`, `campaign_live.json`, capturas y transcripciones. El inventario independiente tiene
sus fuentes, geometría, trazas y límites de fixtures en `tools/cache/progression_inventory_report.md`.

## Final B21: D21–D24

| Requisito | Evidencia | Estado |
|---|---|---|
| Salto: aviso, nodo que espera, Forma 10 % y regreso al laberinto | `b21_content.test.mjs`, recorrido B21/B22a | Verificado en banco; continuo pendiente |
| Zygarde voluntario: Sí/Todavía no; toca Honor Ball; Completo70/Agrupamiento/cuatro movimientos | Pruebas B21 y guion real de adhesión | Verificado en banco; continuo pendiente |
| Equipo lleno: envío obligatorio al PC; capacidades independientes del equipo | Pruebas de adhesión y capacidades | Verificado en banco; continuo pendiente |
| Arceus75/Multitipo: Tierra → Fantasma → Normal, con objetos/movimientos canónicos | Combates del motor real en `b21_content.test.mjs` | Verificado |
| Transiciones: PS completos, limpieza de mejoras/trampas y 25 % al equipo vivo | Pruebas del combate real y de curación | Verificado |
| Captura bloqueada sin Ball/turno en fases 1–2; bajo 50 % y sin Recuperación tras Legendaria en fase3 | Combates reales, Master Ball y KO final | Verificado |
| Derrota: instantánea de equipo/objetos, reintento y retirada con fase persistida | Pruebas de sesión, Mega y retirada | Verificado |
| Resolución: 18 Tablillas, eje no elegido reparado y ciclo celeste normal | Pruebas para ambas elecciones; conductor usa `p9_choice` real | Verificado en banco; continuo pendiente |
| Olmedo, Mamá, llave de Alerce, montaje y Clefairy condicionales | Guiones/recorridos B21 y pruebas de alcance | Verificado en banco; continuo pendiente |
| Nota de Gael y huevo de su inicial, disponible con equipo lleno y entrega única | Guion real; pruebas B21/regalos y tres regresiones del conductor | Verificado en banco; prueba continua preparada |
| TV, carguero, cuaderno ausente, créditos y despertar con Completo por voluntad | Epílogo normal y recuperación: once comprobaciones Chrome | Verificado en banco; continuo pendiente |
| Guardar/Continuar/Cargar: equipo, PC, huevo, colección, bolsa, dinero, elección y capacidades | Seis regresiones del conductor de epílogo/recarga | Preparado para el guardado continuo final |

## Postgame B22 — CAMPANA §8.1

| Requisito | Evidencia de bloque | Estado |
|---|---|---|
| Anclaje, tres caras de Distorsión y Giratina75/Griseosfera/Origen | Pruebas B22a y recorrido `b22a_e2e_giratina.log` | Verificado |
| Segundo eje Dialga/Palkia, sus orbes y recuperación del elegido no capturado | B22a; recorrido Columna con captura real de Palkia | Verificado |
| Arceus no capturado: reencuentro Normal75 bajo 50 % | B22a; captura real en Columna | Verificado |
| Uxie/Crónicas, Mesprit/reflejos, Azelf/objetos | B22a; recorrido Alma | Verificado |
| Tornadus montado, tres rayos/Thundurus y Landorus con ambos capturados | Pruebas B22b; capturas y retornos del bloque | Verificado |
| Articuno/Fuego, Zapdos/hielo o roca, Moltres/Agua | Condiciones de movimientos/equipo reales y recorridos B22b | Verificado |
| Raikou, Entei y Suicune: tres rastros y cuarto encuentro fijo | Persistencia, alcance y capturas B22b | Verificado |
| Lugia/Buceo/pista de Ramón; guía de destellos largos y alternativa de sonido | Pruebas B22c y Chrome con ambas opciones | Verificado |
| Ho-Oh/Ceniza Sagrada/amanecer | Consumo, cancelación, reloj y captura B22c | Verificado |
| Kyogre/Prisma Azul/Danza Lluvia en superficie; Groudon/Prisma Rojo/Día Soleado | Ritual con Pokémon consciente del equipo; capturas y regreso | Verificado |
| Rayquaza: Kyogre/Groudon en equipo, tormenta y tutor de Ascenso Draco | B22c; retirada real del PC y captura78 | Verificado |
| Latias/Rocío Bondad y Latios itinerante tras verla | B22c; huida, persistencia, capturas y megapiedras únicas | Verificado |
| Regirock/relieve, Regice/talla reversible, Registeel/reloj y Regigigas/trío en equipo | B22d; cuatro capturas, KO/descanso y regresos | Verificado |
| Heatran72/Piedra Magma de la Forja | B22d; acceso, derrota segura, captura y regreso | Verificado |
| Darkrai/sueño profundo nocturno y Cresselia/Atrapasueños/noche | B22d; sueño inicial determinista, KO, despertar y capturas | Verificado |
| Mewtwo80: 300 vistos; tres prototipos distintos sin captura; proyecto extranjero | B22d; restricciones, derrota/reintento y captura del original | Verificado |
| Marshadow70: sombra nocturna fuera de tiempo | B22d; sombra incorrecta, recorrido, captura y regreso | Verificado |
| Siete Paradojas Ferrosas en futuro de P9, con sus condiciones independientes | B22e; cauce, quietud, embestidas, horas, luz, tormenta y seis vistos | Verificado |
| Taller de la Grieta recuperable y persistente | Pruebas de bloque/NPC ocupado/guardado dañado; recorrido y palanca | Verificado |
| Bastión: rondas, IA, copias50, sin bolsa/EXP/dinero y canjes | Pruebas B22e y recorrido de ronda/derrota | Verificado |
| Revanchas de cinco Guardianes72–75 | B22e; combates y regresos | Verificado |
| Cuarto de Alerce/Laguna con llave, subtexto sin confesión; Ditto en Talasa; Red/Senda | B22a/e; puertas, documentos, captura y retornos reales | Verificado |

Los recorridos B22 están en `tools/e2e_b22*.mjs`, sus README y `tools/cache/screens/`. B22c añadió 41 hitos,
siete capturas reales, derrota, KO/descanso y huida. Los bancos usan recursos declarados para aislar las búsquedas.

## DLC B23 y B24 — CAMPANA §8.2–8.3

| Requisito | Evidencia | Estado |
|---|---|---|
| Almenara: ocho mapas, ferri de Nexo y EXP-03 natural | B23, alcance y recorrido real de ida/regreso | Verificado |
| D1-01…05: robo de Hoopa, Gael, oasis/faro, mensaje de Vértice y negativa | Guiones y 13 hitos de navegador | Verificado |
| Zygardita: intento de forzar fracasa; Mega voluntaria, sin secuestro/serum | Pruebas de historia, Mega real e historial de combate | Verificado |
| Gael80–82/seis miembros/Mega Absol; Hoopa80/Mega Z propia/Botella | Nueve combates reales, derrota/reintento y Mega | Verificado |
| Sellado, captura opcional, KO/descanso; fuga de Gael vivo sin redención | B23; sellado tras fallo sin Mega, captura y regreso | Verificado |
| Sabela34/exPuerto; seis categorías y máximo tres expediciones activas | Pruebas del Registro/UI, mapas e integración | Verificado |
| Rumor → Indicio → Hallazgo; cuatro oleadas, datos JSON, marcas y ayudas | B24; 30/30 Hallazgos y las dos islas marcadas en MAPA | Verificado |
| Mew/Bidoof/rutas, Celebi/sigilo/bayas y Jirachi/noche despejada/Trozo Estrella | Condiciones, pasos y capturas B24 | Verificado |
| Manaphy/huevo/Buceo; Phione con Ditto; Shaymin/ferri/Gracídea; Victini | Eclosión y crianza reales, islas y encuentros | Verificado |
| Trío de Justicia/Keldeo; elección de ideales, ambos dragones y Kyurem/Punta ADN | Secuencias, requisitos del equipo y capturas B24 | Verificado |
| Meloetta/Canto/atardecer en Mnemos; Xerneas/300 pasos sin KO; Yveltal/diez victorias seguidas; Diancie/Carbink/tres Sableye | Observadores y combates/pasos reales | Verificado |
| Volcanion: Agua → Fuego en veinte pasos; Cosmog/Cosmoem/Piedras Día y Noche; Solgaleo/Lunala | Pasos, evolución/objetos/horario y capturas reales | Verificado |
| Once Ultraentes/siete zonas con retorno seguro y Beast Balls | Diez capturas y Poipole; once especies registradas | Verificado |
| Poipole → Naganadel; Necrozma/crisis local distinta de la principal | Evolución, combate, captura y restauración de luz | Verificado |
| Magearna/cinco engranajes; Zeraora/Danza Lluvia → Trueno | Reparación, consumo normal de recursos y encuentros | Verificado |

B24 acumula 47 combates reales, 79 hitos distintos, eclosión/crianza/evoluciones y 30/30 Hallazgos. Evidencia
en `tools/cache/b24_entrega.md`, trazas `e2e_b24_*.log` y checkpoints de `screens/`.

## Sistemas, presentación y comprobaciones finales

| Requisito | Evidencia | Estado |
|---|---|---|
| Pokédex obtenible en solitario: 346 generales, ocho Paradojas, once Ultraentes, 60 legendarios/singulares | Auditor de 425/425 métodos, recursos distribuidos y elecciones compatibles | Verificado |
| Entregas con equipo/PC llenos y regalos únicos | Once regresiones; P2/T06 en Chrome, recarga y liberación de espacio | Verificado |
| Wurmple/personalidad y Happiny/horario/Piedra Oval | Seis regresiones y auditor de evoluciones/crianza reales | Verificado |
| Online: salas, PvP, cooperativo de historia, intercambios, chat/emotes | Pruebas de enlace y navegadores reales | Verificado |
| Cooperativo: EXP, movimientos y evoluciones de ambos dueños; horario compartido | Simulaciones y dos recorridos con relojes opuestos/Espeon/Umbreon | Verificado |
| Dobles: sprites propios separados, sombras y efectos | Disposición y combate cooperativo real | Verificado |
| Cámara, árboles enteros, pasabilidad de flores/rocas y costuras | QA de mapas, validador y 45 conexiones | Verificado; rocas de tres puzzles conservan la excepción documentada |
| Escuela de Estrato: arco, marcador y entrada/retorno alineados | Cuatro regresiones, 51 pruebas, siete hitos Chrome y tres costuras limpias | Verificado en 8689c3f |
| Puertas normales cerradas: apertura/cierre sobre el panel original | 56 accesos/36 variantes resueltos, máscaras y raster; ocho transiciones Chrome, curación/recarga y 24 fases visibles | Verificado, incluidos guiones y stamps locales |
| Seguidor B14, aro negro de Gael y Diario | Profundidad en tres capas/ambas formas; datos de B15/B20; pestañas y pruebas | Verificado |
| F9 espera al jugador/guion; recuperación del final tras televisión | Once regresiones y once comprobaciones Chrome | Verificado en be63ae7 |
| Protagonistas M/F: acciones, mochila, monturas y espaldas/lanzamientos | 51 pruebas/18 capturas; lámina del kit completo y aprobación fechada en 18 hojas | Aprobado por el autor el 04-10-2026 |
| Trece poses de combate de NPC | 36 pruebas, 15 capturas y lámina; registro y alias con aprobación fechada | Aprobado por el autor el 04-10-2026 |
| Elenco propio de campo, incluido Vértice líder | Lámina de 29 charsets; hashes originales y aprobación registrada por archivo/alias | Aprobado por el autor el 04-10-2026 |
| Ilustración del atlas de Axis | Imagen mostrada y aprobada; JSON/generador con fecha, PNG idénticos y 56 lugares conservados | Aprobado por el autor el 04-10-2026 |
| Escala de Pokémon del mapa, incluidos Onix/Yanma | Módulo y cuatro pruebas; el autor elige mantener la regla actual | Confirmado por el autor el 04-10-2026 (X37) |
| Suite completa sobre el resultado integrado | 2287/2287, sin fallos, omisiones ni cancelaciones; `suite_closure_integrated.log` | Verificado sobre puertas, escuela y conductores actuales |
| Validador, costuras y QA sobre el resultado final | Último validador: 272 mapas/187 entrenadores/sin errores; Estrato 0/3 costuras defectuosas | Repetir al cierre si cambian mapas |
| Guardado final desde UI y carga desde el título | Controlador preparado con comparación completa y habilitación del postgame | Pendiente al llegar a B21 |

Los informes de alcance y cobertura se detallan en `CIERRE_CONTENIDO.md`. `PENDIENTES.md` mantiene el punto de
trabajo actual. Los bancos, el contrato de inventario y el auditor de obtención conservan sus límites declarados;
la columna de partida continua registra únicamente lo observado en el guardado nuevo.
