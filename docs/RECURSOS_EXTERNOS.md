# Recursos externos y entrega a otro equipo

Actualizado: 07-10-2026. El código, `game/data/`, `game/assets/` y los módulos vendorizados están en Git. Los originales de Añil están en una carpeta ignorada: el clon necesita ese conjunto para ser jugable.

## Estructura requerida

```text
ecos-del-espacio-tiempo/
  package.json
  server.mjs
  game/
  Pokemon Anil V4.13/
    Graphics/
    Audio/
    Fonts/
    PBS/                     # fuentes para regenerar datos
    Data/                    # tres fuentes binarias para regenerar
```

`server.mjs` sirve la carpeta `Pokemon Anil V4.13/` bajo `/anil/`. Mantener ese nombre, espacios y rutas de sus archivos. El título puede aparecer con fuentes de respaldo aunque falten recursos: comprobar una partida, sprites y audio; los 404 de `/anil/` indican una instalación incompleta.

Para jugar se necesitan `Graphics/`, `Audio/` y `Fonts/`. Para regenerar las salidas existentes hacen falta también:

- `PBS/pokemon.txt`, `pokemon_forms.txt`, `moves.txt`, `abilities.txt`, `items.txt`, `types.txt`, `trainer_types.txt`.
- `Data/species_metrics.dat`, `Tilesets.rxdata`, `PkmnAnimations.rxdata`.

No hace falta copiar ejecutables de RPG Maker para ejecutar este juego de navegador. `npm ci` instala las dependencias de Node, pero no obtiene los recursos de Añil.

## Paquete de continuidad

El [empaquetador](../tools/package_handoff_assets.mjs) toma únicamente el conjunto anterior y excluye ejecutables, enlaces y archivos ajenos. Genera en `tools/cache/publicacion/`:

- `ecos-anil-resources.zip`, con raíz `Pokemon Anil V4.13/`.
- `ecos-anil-resources.manifest.json`, con rutas, tamaños y SHA-256 por archivo y del ZIP.

```powershell
node tools/package_handoff_assets.mjs
```

La herramienta comprueba que las entradas del ZIP coincidan con el manifiesto. La carpeta de salida está ignorada por Git; adjuntar ambos archivos a la entrega o a una Release. La auditoría previa al empaquetado contó 21770 archivos y 648240995 bytes en Graphics/Audio/Fonts, incluido un `Audio/Game.exe` de 14732288 bytes que se excluye. Los totales definitivos son los del manifiesto generado, que añade las fuentes PBS/Data.

Selección comprobada de esta entrega: **21779 archivos / 651369249 bytes** antes de comprimir; se excluye únicamente `Audio/Game.exe`. `Graphics/UI/Save/panels.png` pertenece a la interfaz y se conserva. La construcción y verificación usan PowerShell/.NET en Windows y preservan nombres Unicode; no cambian la política de ejecución. El juego no depende de ese empaquetador para arrancar desde los recursos ya extraídos.

Paquete definitivo del 07-10-2026, construido y verificado por separado:

| Archivo | Bytes | SHA-256 |
|---|---:|---|
| `ecos-anil-resources.zip` | 577506019 | `436567d76c283f53aaa23e2faeef34af254bc59557ce57b361451ea611ce6f89` |
| `ecos-anil-resources.manifest.json` | 4177437 | `4aee6d9d1a2da30a30b84ee5992b2bd5d40a618f36f09f2c30fbb5d79ce5a9f6` |

Foco del empaquetador: 13/13 pruebas, cobertura 93,49 % de líneas / 81,72 % de ramas / 92 % de funciones. El publicador tiene 21 regresiones con Git/GitHub simulados, cobertura 99,39 % / 86,11 % / 100 %. La suite integrada de entrega pasó 2518/2518; esas simulaciones no acreditan que el repositorio remoto haya sido creado.

En la otra máquina, extraer el ZIP en la raíz del proyecto. Verificar el hash del ZIP contra el manifiesto antes de extraer; el manifiesto permite verificar después cada archivo. Conservar el paquete como recurso aparte del historial de código.

Para completar una Release parcial, conservar exactamente el ZIP y manifiesto originales. Regenerar el paquete cambia fechas y hashes; el publicador detecta esa diferencia y no reemplaza los archivos remotos.

## Partidas y evidencia

El paquete no contiene `saves/`, `localStorage`, perfiles de Chrome, credenciales ni `tools/cache/`. Para conservar una partida personal, usar el flujo Exportar/Importar o acordar una copia del guardado concreto. La campaña continua y sus capturas son evidencia local ignorada: la guía conserva sus resultados y límites, y los scripts permiten repetirla.

Las dependencias de `node_modules/` y los runtimes de `.tools/` se reinstalan en la máquina destino. `playwright-core` necesita un Chrome/Edge instalado; revisar rutas de los conductores E2E.

## Atribuciones

Los créditos del juego identifican Pokémon, Nintendo, Game Freak y Creatures, y el proyecto conserva recursos derivados de Pokémon Añil. Las atribuciones y condiciones originales de esos recursos siguen aplicando; publicar el código no convierte esos gráficos, audio o personajes en contenido de autoría propia.

Los módulos de Three.js se distribuyen con su [licencia MIT](../game/vendor/LICENSE.three.txt), copiada de la dependencia instalada. `npm run vendor` vuelve a copiar módulos y licencia juntos. Este documento no otorga una licencia nueva a los recursos de terceros ni declara un permiso de redistribución que no haya sido comprobado.
