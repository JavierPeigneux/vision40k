# Map Calibration Script

## Objetivo

`calibrate-map-config.mjs` sirve para preparar y construir archivos de configuracion de mapas para este simulador.

El flujo pensado para estos mapas es:

1. Definir el rectangulo util del tablero dentro de la imagen original.
2. Medir cada pieza de escenografia en pixeles sobre ese tablero.
3. Convertir esas medidas a coordenadas del simulador en `um`.
4. Generar un archivo de configuracion reusable.
5. Generar una preview HTML para revisar si la calibracion encaja.

Si el set de escenografia usa tamaños fijos, el script puede forzar esos tamaños con `preset` y usar solo la medicion para:

- centro
- orientacion

No depende de librerias externas.

## Archivo del script

```text
scripts/calibrate-map-config.mjs
```

Tambien hay un refinador automatico:

```text
scripts/auto_refine_rectangles.py
```

## Comandos

### `init`

Crea un archivo base con los metadatos del mapa.

Ejemplo:

```bash
node scripts/calibrate-map-config.mjs init \
  --id map-3 \
  --name "Mapa 3" \
  --image ./my-map.jpg \
  --original-width 1000 \
  --original-height 1134 \
  --board-rect 149,131,705,957 \
  --out ./configs/map-3.base.json
```

Campos:

- `--id`: identificador interno del mapa.
- `--name`: nombre visible.
- `--image`: ruta de la imagen usada por la app.
- `--original-width`: ancho original en pixeles.
- `--original-height`: alto original en pixeles.
- `--board-rect`: rectangulo util del tablero en formato `x,y,width,height`.
- `--out`: archivo JSON de salida.

### `build`

Construye el config final convirtiendo piezas medidas en pixeles a coordenadas del simulador.

Ejemplo:

```bash
node scripts/calibrate-map-config.mjs build \
  --meta ./configs/map-3.base.json \
  --pieces ./configs/map-3.pieces.json \
  --out ./configs/map-3.config.json
```

### `preview`

Genera una preview HTML con la imagen del tablero y los rectangulos superpuestos.

Ejemplo:

```bash
node scripts/calibrate-map-config.mjs preview \
  --config ./configs/map-3.config.json \
  --out ./configs/map-3.preview.html
```

Abre luego el HTML en navegador.

### `export-current`

Exporta la configuracion actual desde `map-configs.js` a un directorio de JSONs, uno por mapa.

Ejemplo:

```bash
node scripts/calibrate-map-config.mjs export-current \
  --source ./map-configs.js \
  --out-dir ./configs/current
```

### `generate-module`

Reconstruye un modulo JS compatible con la app a partir de un directorio de JSONs.

Ejemplo:

```bash
node scripts/calibrate-map-config.mjs generate-module \
  --presets-source ./map-configs.js \
  --input-dir ./configs/current \
  --out ./map-configs.generated.js
```

### `refine-current`

Ejecuta el flujo completo sobre la configuracion real:

1. exporta desde `map-configs.js`
2. refina con Python
3. regenera un modulo JS listo para la app

Ejemplo:

```bash
node scripts/calibrate-map-config.mjs refine-current \
  --source ./map-configs.js \
  --work-dir ./configs/current \
  --out ./map-configs.generated.js
```

Opciones:

- `--map map-1`: refina solo un mapa concreto.
- `--keep-intermediate`: conserva los `.refined.json`.

## Formato del archivo `pieces`

El comando `build` espera un JSON array.

Ejemplo:

```json
[
  {
    "id": "m3-t1",
    "name": "Ruina norte",
    "kind": "ruin",
    "preset": "large",
    "rotation": 0,
    "rectPx": { "x": 210, "y": 155, "width": 188, "height": 114 }
  },
  {
    "id": "m3-t2",
    "name": "Barricada este",
    "kind": "barricade",
    "preset": "longLine",
    "rotation": -34,
    "rectPx": { "x": 530, "y": 320, "width": 170, "height": 42 }
  }
]
```

## Interpretacion de `rectPx`

`rectPx` se mide dentro del rectangulo del tablero, no sobre toda la imagen original.

Eso significa:

- si el tablero cropped empieza en `x=149, y=131`
- y una pieza dentro del tablero ocupa `x=210, y=155`

entonces `rectPx` debe usar esas coordenadas relativas al tablero ya recortado, no las absolutas de la imagen completa.

## Presets de tamano

Si una pieza tiene tamano fijo, usa `preset`.

Presets disponibles:

- `large`: `7 x 11.5`
- `largeXL`: `8 x 11.5`
- `medium`: `6 x 4`
- `longLine`: `10 x 2.5`
- `shortLine`: `6 x 2`

Con `preset`, el script:

- toma `rectPx` para calcular el centro
- usa `rotation` para orientar la pieza
- fija `width` y `height` al tamano del preset

Eso evita errores por medir distinto tamano en capturas distintas.

## Resultado del `build`

El script genera algo como esto:

```json
{
  "id": "map-3",
  "name": "Mapa 3",
  "image": {
    "src": "./my-map.jpg",
    "originalSizePx": { "width": 1000, "height": 1134 },
    "boardRectPx": { "x": 149, "y": 131, "width": 705, "height": 957 }
  },
  "terrain": [
    {
      "id": "m3-t1",
      "name": "Ruina norte",
      "kind": "ruin",
      "x": 18.2,
      "y": 12.8,
      "width": 11.7,
      "height": 7.1,
      "rotation": 0
    }
  ]
}
```

## Flujo recomendado de calibracion fina

1. Crear `base.json` con `init`.
2. Sacar una imagen del tablero ya recortado o medir sobre una preview.
3. Medir cada rectangulo principal de escenografia en pixeles.
4. Guardarlos en `pieces.json`.
5. Ejecutar `build`.
6. Ejecutar `preview`.
7. Revisar la superposicion visual.
8. Ajustar `pieces.json` y repetir hasta que encaje.

## Refinado automatico desde imagen

Si ya tienes un config seed razonable, puedes dejar que Python intente ajustar `x`, `y` y `rotation` leyendo la propia imagen.

Ejemplo:

```bash
python3 scripts/auto_refine_rectangles.py \
  --config ./configs/map-1.seed.json \
  --out ./configs/map-1.refined.json
```

Este script:

- recorta el tablero usando `boardRectPx`
- lee la imagen con `ImageMagick`
- construye un mapa de puntuacion para grises, verdes, dorados y sombras
- busca alrededor del seed la mejor posicion y rotacion para cada rectangulo
- respeta `width` y `height` ya fijados en el config

Importante:

- no inventa el tamano de las piezas
- funciona mejor cuando el seed inicial ya esta cerca
- requiere `magick` instalado

Formato esperado:

- JSON puro
- misma estructura general que el config final
- `terrain` debe incluir `x`, `y`, `width`, `height` y `rotation`

## Flujo completo desde la configuracion real del proyecto

Si quieres trabajar directamente desde `map-configs.js`, el flujo recomendado ahora es:

```bash
node scripts/calibrate-map-config.mjs refine-current \
  --source ./map-configs.js \
  --work-dir ./configs/current \
  --out ./map-configs.generated.js
```

Si necesitas control manual, tambien puedes hacerlo paso a paso:

1. Exportar el modulo actual a JSON:

```bash
node scripts/calibrate-map-config.mjs export-current \
  --source ./map-configs.js \
  --out-dir ./configs/current
```

2. Refinar un mapa o todos con Python:

```bash
python3 scripts/auto_refine_rectangles.py \
  --config ./configs/current/map-1.json \
  --out ./configs/current/map-1.refined.json
```

3. Sustituir el archivo original por el refinado que quieras conservar.

4. Regenerar un modulo JS compatible con la app:

```bash
node scripts/calibrate-map-config.mjs generate-module \
  --presets-source ./map-configs.js \
  --input-dir ./configs/current \
  --out ./map-configs.generated.js
```

5. Revisar el resultado y, si todo encaja, copiarlo sobre `map-configs.js`.

## Criterio recomendado para este simulador

Para este proyecto no hace falta modelar todas las protuberancias.

Lo razonable es:

- usar rectangulos principales
- ajustar bien sus 4 esquinas
- ignorar salientes pequenos mientras no cambien de forma relevante la linea de vision

## Integracion con la app

Cuando el config final sea correcto:

1. copia el contenido util al formato usado en `map-configs.js`
2. o adapta la app para leer los JSON generados directamente

## Limitaciones actuales

- el script no es interactivo
- no dibuja handles ni permite arrastrar rectangulos
- la medicion en pixeles hay que hacerla aparte

Si en el futuro hace falta, el siguiente paso logico es construir un editor visual encima de este flujo.
