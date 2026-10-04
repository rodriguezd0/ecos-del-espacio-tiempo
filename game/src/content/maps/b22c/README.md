# B22c — Mar, fuego y cielo después del final

Se abre al terminar el epílogo (`game_cleared` y `b21_fin`). Los siete encuentros son opcionales, individuales y permiten capturas normales. No hay sustitutos ni prototipos.

| Pokémon | Nivel | Pista, lugar y requisito |
| --- | --- | --- |
| Lugia | 75 | Ramón en el faro de Caleta describe la Sima Marina bajo Talasa. Hace falta Buceo y su pista. |
| Ho-Oh | 75 | Olvido entrega Ceniza Sagrada; ofrecerla en el brasero del Cerro del Alba entre las 6 y las 9. |
| Kyogre | 75 | Prisma Azul en el eco de Antea y Danza Lluvia del equipo en la superficie del sudeste del Mar del Sur. |
| Groudon | 75 | Prisma Rojo en la galería honda de Mina Galena y Día Soleado del equipo en la entrada de la Veta Magmática bajo Tizón. |
| Rayquaza | 78 | Balcón del Cielo en Cumbre Azur, con Kyogre y Groudon en el equipo durante una tormenta. Hotel Mirador permite descansar hasta tormenta. |
| Latias | 70 | Reflejo del Lago del Sentir, con Rocío Bondad del eco de Antea. |
| Latios | 70 | Mar del Sur tras ver a Latias; recorre los sectores oeste, central y este después de cada encuentro que no termina en captura. |

Los huevos y los Pokémon del PC no cumplen requisitos de equipo. Danza Lluvia y Día Soleado deben pertenecer a un Pokémon consciente. Los prismas y Rocío Bondad deben estar en la Mochila; si están equipados, el guion explica cómo retirarlos del equipo o del PC. La protección común de reliquias permite equiparlos y evita tirarlos o venderlos.

Capturar fija un flag permanente. Debilitar guarda el contador de descansos y exige descansar antes de la reaparición. Perder cura el equipo y permite reintentar sin dinero ni punto de cura perdido. Latiasita y Latiosita se entregan una vez tras vencer o capturar a cada uno. Rayquaza lleva Ascenso Draco; la placa del balcón permite enseñárselo gratuitamente si se olvidó.

## Recintos y regresos

`layout.js` concentra las coordenadas. Los accesos se incorporan mediante `withB22cEvents`; las pistas de Ramón/Olvido usan `withB22cHints`, conservando páginas, campaña y los otros módulos de postgame.

| Recinto | Entrada desde el mundo | Regreso |
| --- | --- | --- |
| `sima_marina` | Fondo del Mar del Sur `(104,42)` | Fondo `(104,43)` |
| `fosa_abisal` | Eventos existentes `fosa_abisal_0` a `_4`; acceso central `(170,27)` | Fondo `(169,27)` |
| `veta_magmatica` | Cueva del Tizón `(31,44)` | Cueva `(30,44)` |
| `balcon_cielo` | Cumbre Azur `(18,13)` | Cumbre `(17,13)` |

Las llegadas quedan fuera de los disparadores de vuelta. Sima/Fosa se conectan al fondo con su Buceo y respiraderos existentes; sus recintos interiores permiten permanecer y regresar sin límite de resonancia. El acceso del balcón conserva la subida de Cumbre a Columna Lanza y la Senda del Lazo B15. Ho-Oh conserva el brasero y el descenso con Trepar del Cerro.

La Sima usa oscuridad y siete corrientes de Aerochorro. La placa ofrece destellos normales, destellos largos con marcas, tonos direccionales con marcas o marcas permanentes sin destellos. La preferencia se guarda; cambiarla vuelve a habilitar las señales ya visitadas. La misma ruta sirve para volver.

## Arte y verificación

PNG propios de prismas, placa, corrientes, umbral y reflejos: `node tools/b22c_assets.mjs --preview` o `--check`. Los Pokémon usan las hojas originales de Añil. No se modifica el atlas compartido. Previews de recintos en `tools/cache/previews/` se generan con `node tools/preview_map.mjs <id> --grid --scale=0.75`.

Pruebas focalizadas: `tests/b22c_{logic,content,capture,world,guides}.test.mjs`. Incluyen siete capturas con motor real, derrota real, flags serializados, requisitos de equipo/PC/huevos, horario, rituales, guía accesible, Ascenso Draco y BFS con las colisiones del juego. La regresión también cubre los hooks existentes de campaña y otros postgames.

Recorrido real completo: `node tools/e2e_b22c.mjs`. Usa una sola instancia de Chrome, teclas reales y decisiones de combate automatizadas sobre el motor. Comprueba las siete capturas, KO y descanso, derrota segura, pista y ofrenda naturales, tormenta del hotel, PC frente a equipo, huida itinerante y Buceo ida/vuelta desde la superficie. Las Master Balls y equipos de prueba son fixtures; no se simulan resultados ni se cambia la salud rival. Checkpoints, capturas y diálogos se guardan en `tools/cache/screens/e2e_b22c_all_*`; `--resume=<checkpoint.json>` retoma las etapas terminadas.
