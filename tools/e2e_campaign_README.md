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
- `campaign_final_before_reload.json`, `campaign_final_dialogos.json`: evidencia anterior a la recarga final, cuando B21 se complete.
- `campaign_b13_before_reload_save.json`, `campaign_b13_before_reload_slot.json`, `campaign_b13_after_reload_save.json`: datos vivos, payload exacto de la ranura y datos cargados en la recarga intermedia. El payload fija la hora de referencia; al cerrar Guardar el reloj vivo puede haber avanzado.
- `campaign_b15_before_reload_slot.json`, `campaign_b15_after_reload_save.json`: la misma comprobación tras guardar B15; la recarga incorpora los seguidores integrados antes de entrar en P8.
- `campaign_b16_pc_exchange.json`: registros completos antes y después del depósito de Rampardos y retirada de Bramaluna mediante el PC.
- Capturas PNG de hitos y combates.

Ante un error del conductor, el navegador permanece abierto. Se corrige el módulo del bloque y se actualiza `campaign_retry.json`; el conductor vuelve a importarlo, conserva la misma partida y omite sus etapas ya verificadas. Una derrota del juego vuelve al punto de cura por las reglas reales y se reintenta viajando por los accesos normales.

`e2e_campaign_double.mjs` es un banco independiente de presentación con fixtures; **no forma parte de la campaña continua**. Su prueba de dobles/coop tiene un alcance distinto.

Estado actual: **B01–B18 ejecutados y guardados con la misma partida QAut8uoab; B19 activo y B20–B21 pendientes de recorrido real**. El último guardado está en Senda del Mirador (20,49), con 100 células únicas, 14 Tablillas, cinco Núcleos y nueve Fragmentos. B18 reconstruyó los tres tramos del Puente, ganó los combates reales de Casia/Garrido/Vértice y completó la irrupción, rechazo de Gael y detención; resolvió Vestíbulo/Caída/Río/Cruce, comprobó el regreso entre plantas antes de restaurar y rechazó una elección antes de confirmar Dialga. La victoria real sobre Dialga 65 restauró P9/F09 en seis turnos, conservando el dinero; se recogió la Lustresfera y se recorrió la salida sur y vuelta al norte. El equipo guardado es Torterra 57 / Golem 54 / Inteleon 60 / Rotom 52 / PorygonZ 52 / Bramaluna 62. Rampardos, Sinistea, Eevee y Togepi permanecen en el PC; el intercambio previo mantuvo los diez UID y registros completos. Consultar `campaign_checkpoint.json` para bloques cerrados y `campaign_live.json` para la etapa exacta. Los módulos preparados no implican que esos bloques hayan sido recorridos.

Al empezar B14 se comprobó la recarga normal del guardado de B13 y antes de P8 se repitió sobre B15: Guardar → recargar página → Continuar → Cargar. Identidad, posición, Pokémon completos y huecos del PC, colección, pistas, viajes, autointerruptores, bolsa y demás campos persistentes coincidieron con el payload escrito por Guardar. Hora guardada/cargada: B13 minuto 1219 y B15 minuto 149, sin retroceso. Las diez pruebas del checkpoint y las diez de la recarga final preparada siguen verdes. B14 añadió comprobaciones de retiradas/victorias y captura real (20/20), más cuatro del retorno por el evento de superficie registrado (4/4). El retorno Boreal y el puente elevado quedaron cubiertos en 27 pruebas focalizadas; el PC, en ocho. La última suite integrada del coordinador pasó 2435/2435, incluida la salida B17.

Los regresos de células opcionales de B09/B11 (tierra, grava y Trepar), B13 (Nadar), B14 (Fondo Marino) y B15 (Buceo y costa norte) ya se recorrieron. Cada recogida camina hasta el evento físico y verifica la colección observada. El cierre B21 guarda, recarga la página y usa Continuar/Cargar para contrastar los datos persistentes completos contra el payload de la ranura, incluido el reloj, además de la habilitación del postgame.

La salida B17 usa el warp vigente de la columna: Senda (20,48) → Puente (20,1). Sus siete regresiones verifican la entrada con World/mapa real y la reanudación desde el Puente; rechazan progreso incompleto, otro mapa o una posición ajena al enlace. Cobertura del helper específico: 100% líneas, 96,77% ramas y 100% funciones. La llegada física se conservó tras corregir la expectativa antigua del conductor, sin repetir la reconstrucción ni mover al jugador antes del guardado.

La reanudación de B18 continúa desde la sala, casilla y eje observados, exige las puertas previas y comprueba cada acción con las reglas del puzzle. Ocho regresiones pasan, incluida la ejecución de los cinco pasos pendientes del Río sobre World/mapa real; cobertura del helper: 100% líneas, 96,83% ramas y 81,82% funciones. La traza de solo lectura `campaign_b18_controls_before.json` registró paso libre, controles habilitados y ausencia de ocupantes. El fallo anterior de una pulsación no se reprodujo; se conservó la verificación estricta y no se cambiaron esperas ni colisión.
