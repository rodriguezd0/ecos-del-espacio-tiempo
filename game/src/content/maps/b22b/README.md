# B22b — Nubes, aves y bestias

Encuentros individuales del postgame de `docs/CAMPANA.md` §8. Se habilitan tras
el epílogo, con `game_cleared` y `b21_fin`. Los añadidos no sustituyen geometría,
eventos ni recompensas de la campaña.

| Pokémon | Nv. | Lugar y condición |
| --- | --- | --- |
| Tornadus | 70 | Meseta del Impulso: pista de Abril y alcanzar el vendaval móvil montando en Zygarde. |
| Thundurus | 70 | Dunas de Ceniza: pista de Fermín y examinar tres marcas de descarga en orden, de oeste a este. |
| Landorus | 72 | Cerro Plomo: haber capturado a Tornadus y Thundurus; las marcas de temblor señalan el centro. |
| Articuno | 70 | Lago interior de la Gruta Escarcha: pista de Rosendo y fundir el capullo con un movimiento de Fuego del propio equipo. |
| Zapdos | 70 | Sala de turbinas del Parque Eólico: pista de Abril y romper la fulgurita con un movimiento de Roca o Hielo. |
| Moltres | 70 | Cráter frío de Tizón: pista de Brasa y abrir el basalto por choque térmico con un movimiento de Agua. |
| Raikou | 70 | Tres avistamientos distintos entre Meseta y Rutas 4, 5 y 11; después, encuentro fijo en el Anillo de los Vientos. |
| Entei | 70 | Tres avistamientos distintos entre Ruta 6, Dunas, Ruta 7 y Tizón; después, encuentro fijo en la Cantería Solano. |
| Suicune | 70 | Tres avistamientos en el cauce del Albo, su gruta y el pozo; después, encuentro fijo en el Lago del Sentir. |

Las pistas proceden de las conversaciones de los Guardianes. Los avisos de
Fermín y Rosendo en B22d las entregan antes de que los personajes se trasladen
a sus respectivas excavaciones; las conversaciones posteriores siguen dando
recordatorios. Un aviso que ya da la pista no la repite al terminar.

Los avistamientos no inician combates. Las bestias huyen caminando por suelo
transitable y dejan un rastro persistente. Cada sitio cuenta una sola vez.
Las marcas en el suelo se examinan pisándolas y pulsando A. Los movimientos
para abrir los sellos se eligen en pantalla entre los conocidos por Pokémon
despiertos del propio equipo, con PP disponibles; cancelar conserva el sello.

Las capturas pasan por el motor normal y consumen Balls; el Pokémon queda en
el equipo o en el PC. Un KO guarda el contador `rest_count`: el encuentro vuelve
al descansar. Perder cura al equipo, mantiene el dinero y el punto de cura, y
permite reintentar desde la misma casilla. No hay combate cooperativo aquí.

`escarcha_lago_interior` es el único mapa nuevo. Usa la sala glaciar del tileset
12; el acceso está en `gruta_escarcha_2` y la salida devuelve al suelo situado
junto al acceso, sin volver a activarlo. `layout.js` centraliza las coordenadas.

Los tres gráficos de objetos proceden de `tools/b22b_assets.mjs`, dibujados a
16 px y ampliados ×2 con píxeles enteros. El arte, las músicas y los fondos de
Añil son provisionales y quedan pendientes del criterio artístico del autor.

## Verificación

```powershell
node --test tests/b22b_content.test.mjs tests/b22b_reach.test.mjs
node tools/b22b_assets.mjs --check
node tools/e2e_b22b.mjs
```

El E2E usa un Chrome, el servidor existente en 8080 y teclas reales. Parte de
una partida de campaña completada y lleva el estado entre los mapas; prueba
pistas, condiciones, nueve capturas, derrota real, KO, descanso y retornos.
Las decisiones de combate se automatizan, pero los resultados los resuelve
el motor. Se pueden recorrer grupos aislados con `--only=nubes`, `--only=aves`
o `--only=bestias`. Capturas, diálogos y resultado JSON quedan en
`tools/cache/screens/e2e_b22b_*`. Si el navegador se interrumpe, el archivo
`e2e_b22b_all_checkpoint.json` conserva el estado real de la prueba y permite
retomarla con `--resume=tools/cache/screens/e2e_b22b_all_checkpoint.json`.
