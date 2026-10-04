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

Estado actual: **B01–B15 ejecutados y guardados con la misma partida QAut8uoab; B16 activo y B17–B21 pendientes de recorrido real**. El último guardado está en Villa Boreal (6,18), con 95 células, 13 Tablillas, cinco Núcleos y siete Fragmentos. B15 completó Ruta 11, Paso, Senda del Lazo, Ruta 13 y Boreal; la prueba del Lago Viejo entregó la Tabla Helada/Froslassita, Gael B5 entregó N5 tras una victoria real y se recogieron C093–C094/C096, con regreso por Gruta Escarcha y Mar Boreal. El equipo guardado es Torterra53/Golem51/Inteleon54/Rotom44/Rampardos47/Porygon2 46. Al preparar B16, el PC depositó Rampardos y retiró Bramaluna58 capturada en B14; la comparación de los diez Pokémon conservó todos sus UID y datos completos, y el Centro curó el equipo. Sinistea, Eevee y Togepi también permanecen en el PC. Consultar `campaign_checkpoint.json` para bloques cerrados y `campaign_live.json` para la etapa exacta. Los módulos preparados no implican que esos bloques hayan sido recorridos.

Al empezar B14 se comprobó la recarga normal del guardado de B13 y antes de P8 se repitió sobre B15: Guardar → recargar página → Continuar → Cargar. Identidad, posición, Pokémon completos y huecos del PC, colección, pistas, viajes, autointerruptores, bolsa y demás campos persistentes coincidieron con el payload escrito por Guardar. Hora guardada/cargada: B13 minuto 1219 y B15 minuto 149, sin retroceso. Las diez pruebas del checkpoint y las diez de la recarga final preparada siguen verdes. B14 añadió comprobaciones de retiradas/victorias y captura real (20/20), más cuatro del retorno por el evento de superficie registrado (4/4). El retorno Boreal y el puente elevado quedaron cubiertos en 27 pruebas focalizadas; el PC, en ocho. La última suite integrada del coordinador pasó 2428/2428.

Los regresos de células opcionales de B09/B11 (tierra, grava y Trepar), B13 (Nadar), B14 (Fondo Marino) y B15 (Buceo y costa norte) ya se recorrieron. Cada recogida camina hasta el evento físico y verifica la colección observada. El cierre B21 guarda, recarga la página y usa Continuar/Cargar para contrastar los datos persistentes completos contra el payload de la ranura, incluido el reloj, además de la habilitación del postgame.
