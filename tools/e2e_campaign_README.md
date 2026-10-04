# Partida continua de QA

`e2e_campaign.mjs` crea una partida desde el título y encadena B01–B21 en un solo navegador y con el mismo `GameState`. El nombre único empieza por `QA`; el almacenamiento del contexto de Chrome queda aislado del de los jugadores.

```powershell
& .\.tools\node-v24.21.0-win-x64\node.exe tools/e2e_campaign.mjs
# Reanudar la misma partida guardada por UI:
& .\.tools\node-v24.21.0-win-x64\node.exe tools/e2e_campaign.mjs --resume
```

Requiere el servidor en `http://localhost:8080`. No abre URLs de desarrollo, no teletransporta y no prepara banderas, equipos, dinero, niveles, objetos ni soluciones de puzzles. Las rutas consultan mapas y colisión; las teclas ejecutan los pasos, escenas, puzzles, descanso, compras, montura, Vuelo y PC. El piloto decide movimientos, objetos existentes, cambios y aprendizaje dentro del combate real; conserva el azar y todos los resultados del motor.

El conductor aplica texto instantáneo y desactiva las animaciones desde Opciones. Mantiene Shift, el control normal de carrera. Cada bloque termina con un guardado mediante el menú de pausa.

La evidencia vive en `tools/cache/campaign/`:

- `campaign_identity.json`: identidad QA que debe seguir usándose.
- `campaign_checkpoint.json` y `campaign_browser_storage.json`: último guardado real y almacenamiento para `--resume`.
- `campaign_checkpoint_Bxx.json`, `campaign_dialogos_Bxx.json`: estados y diálogos por bloque desde B04/B05.
- `campaign_live.json`: consulta periódica del estado real; incluye los resultados de combate registrados desde la carga actual.
- `campaign_failure.json`: fallo del conductor y estado en que se detuvo; puede permanecer tras corregirlo, por lo que debe compararse con el estado vivo.
- `campaign_connections.jsonl`: casillas observadas antes y después de cada conexión recorrida desde B08.
- `campaign_final_before_reload.json`, `campaign_final_dialogos.json`: evidencia anterior a la recarga final de B21 completado.
- `campaign_final_before_reload_live.json`, `campaign_final_after_reload.json`, `campaign_b21_worker_audit.json` y `campaign_b21_final_slot_audit.json`: datos completos vivos, datos cargados, contraste de la recarga y comprobación de la última ranura guardada.
- `campaign_b13_before_reload_save.json`, `campaign_b13_before_reload_slot.json`, `campaign_b13_after_reload_save.json`: datos vivos, payload exacto de la ranura y datos cargados en la recarga intermedia. El payload fija la hora de referencia; al cerrar Guardar el reloj vivo puede haber avanzado.
- `campaign_b15_before_reload_slot.json`, `campaign_b15_after_reload_save.json`: la misma comprobación tras guardar B15; la recarga incorpora los seguidores integrados antes de entrar en P8.
- `campaign_b16_pc_exchange.json`: registros completos antes y después del depósito de Rampardos y retirada de Bramaluna mediante el PC.
- Capturas PNG de hitos y combates.

Ante un error del conductor, el navegador permanece abierto. Se corrige el módulo del bloque y se actualiza `campaign_retry.json`; el conductor vuelve a importarlo, conserva la misma partida y omite sus etapas ya verificadas. Una derrota del juego vuelve al punto de cura por las reglas reales y se reintenta viajando por los accesos normales.

`e2e_campaign_double.mjs` es un banco independiente de presentación con fixtures; **no forma parte de la campaña continua**. Su prueba de dobles/coop tiene un alcance distinto.

Estado actual: **B01–B21 ejecutados y guardados con la misma partida QAut8uoab; créditos, despertar, recarga normal y acceso al postgame verificados**. El proceso original terminó con código 0 y cerró únicamente su navegador de QA. El último guardado está en el cuarto de casa (8,6), con 100 células únicas, 18 Tablillas, cinco Núcleos y diez Fragmentos. Equipo final: Inteleon 62 / Rotom 56 / PorygonZ 56 / Bramaluna 65 / Zygarde 70 / huevo de Litten 1. Los otros seis Pokémon permanecen en el PC; los doce registros tienen UID distintos. El huevo corresponde al inicial real de Gael y una segunda visita tras cargar no volvió a entregarlo. Zygarde conserva Completo, Salto y Anclaje.

B20 recorrió los nueve tramos con controles normales, manantiales, caída segura, Anclas, Buceo/eco, espejo/puerta equivocada, cascada/pliegue y verso X; el Trío perdió sus tres combates reales y Gael B6 fue vencido en 18 turnos. Se obtuvieron F10/Flauta Azur, se bajó por las tres plantas restauradas y se regresó físicamente al núcleo antes de guardar. Consultar `campaign_checkpoint_Bxx.json` para los guardados de cada bloque; `campaign_checkpoint.json` contiene el cierre B21.

Al empezar B14 se comprobó la recarga normal del guardado de B13 y antes de P8 se repitió sobre B15: Guardar → recargar página → Continuar → Cargar. Identidad, posición, Pokémon completos y huecos del PC, colección, pistas, viajes, autointerruptores, bolsa y demás campos persistentes coincidieron con el payload escrito por Guardar. Hora guardada/cargada: B13 minuto 1219, B15 minuto 149 y B21 minuto 484, sin retroceso. Las diez pruebas del checkpoint y las diez de la recarga final siguen verdes. B14 añadió comprobaciones de retiradas/victorias y captura real (20/20), más cuatro del retorno por el evento de superficie registrado (4/4). El retorno Boreal y el puente elevado quedaron cubiertos en 27 pruebas focalizadas; el PC, en ocho. La última suite integrada del coordinador pasó 2484/2484, incluidos el reintento acotado de B21 y la salida segura de Arceus al límite de intentos.

Los regresos de células opcionales de B09/B11 (tierra, grava y Trepar), B13 (Nadar), B14 (Fondo Marino) y B15 (Buceo y costa norte) ya se recorrieron. Cada recogida camina hasta el evento físico y verifica la colección observada. El cierre B21 guarda, recarga la página y usa Continuar/Cargar para contrastar los datos persistentes completos contra el payload de la ranura, incluido el reloj, además de la habilitación del postgame.

La salida B17 usa el warp vigente de la columna: Senda (20,48) → Puente (20,1). Sus siete regresiones verifican la entrada con World/mapa real y la reanudación desde el Puente; rechazan progreso incompleto, otro mapa o una posición ajena al enlace. Cobertura del helper específico: 100% líneas, 96,77% ramas y 100% funciones. La llegada física se conservó tras corregir la expectativa antigua del conductor, sin repetir la reconstrucción ni mover al jugador antes del guardado.

La reanudación de B18 continúa desde la sala, casilla y eje observados, exige las puertas previas y comprueba cada acción con las reglas del puzzle. Ocho regresiones pasan, incluida la ejecución de los cinco pasos pendientes del Río sobre World/mapa real; cobertura del helper: 100% líneas, 96,83% ramas y 81,82% funciones. La traza de solo lectura `campaign_b18_controls_before.json` registró paso libre, controles habilitados y ausencia de ocupantes. El fallo anterior de una pulsación no se reprodujo; se conservó la verificación estricta y no se cambiaron esperas ni colisión.

B19 añade doce regresiones del conductor: derrota nueva protegida y cura real de Casandra, límite de tres pérdidas nuevas, victoria con registro y flag, entrada al disparador con World/mapa real y reanudación desde Taller/Sima/Puerta. El helper de reintento tiene 100% de líneas, ramas y funciones; esto no mide todos los puzzles heredados del módulo B19. Las expectativas de llegada al Taller y Umbral se contrastan con el diálogo vigente. La grava de B20 usa el control normal de montura cuando se llega a pie; dos regresiones y la captura `campaign_b20_819_t1_grava.png` prueban la subida en esta misma QA.

El regreso final de B20 usa los accesos físicos Senda 9 → Cielo → Terraza → Núcleo. El grafo general no incluye el arco del Cielo, que es un evento; se conserva ese grafo y se reutilizan los controles de estas plantas. Se exigen restauración, Flauta, Trío y victoria/despedida de Gael, sin volver a interactuar con el núcleo. Seis regresiones pasan con 100% de líneas, ramas y funciones del helper específico; la captura `campaign_b20_860_retorno_nucleo_para_salto.png` y el checkpoint B20 verifican el regreso real. Las seis regresiones están incluidas en la suite final de 2484.

B21 superó el Salto y la incorporación real de Zygarde mediante la Honor Ball y el Arca. La primera ejecución repitió «Reintentar fase» hasta 99 intentos: Fantasma había empezado con cinco Pokémon debilitados y el reintento conservaba ese estado. El conductor ahora comprueba un reintento y elige «Retirarse» ante otra derrota, con máximo de tres retiradas por fase; once regresiones pasan y el helper específico tiene 100% de líneas, ramas y funciones. En esta QA se reanudó desde la fase guardada, se curó por interacción normal al manantial y se ganó Fantasma/Normal en 17 turnos, con 92040$ intactos. La partida no necesitó una nueva retirada tras esa cura. La corrección de producto de la salida al límite de 99 intentos tiene una regresión propia y forma parte de la versión integrada al recargar.

Capturas de cierre: manantial (874), Tablillas/confirmación/cielo (876–878), pueblo libre (879), depósito PC (880), huevo único (884–885), tele/carguero (886–887), créditos (888–889), despertar/postgame (890–891), postgame recargado (892) y huevo único tras cargar/regreso al cuarto (893–897). La comparación final de datos persistentes completos dio igualdad exacta; se conservaron 12 UID, dinero, PC, colecciones, T13, elección DIALGA del P9 y huevo de Litten. El último guardado UI volvió a dejar al jugador en el cuarto tras esa segunda visita.
