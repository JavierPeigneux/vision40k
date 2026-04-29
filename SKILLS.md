# Vision40K Simulator Notes

## Proyecto

Aplicacion web estatica para simular lineas de vision en mapas de Warhammer 40K.

Archivos principales:

- `index.html`: estructura de la UI.
- `styles.css`: layout y estilos.
- `app.js`: logica de tablero, peanas, seleccion, arrastre y linea de vision.
- `map-configs.js`: configuracion por mapa.

## Estado operativo actual

La base del proyecto ya incluye:

- i18n en `es` / `en` con `i18n.js`.
- Selector de idioma en la cabecera con solo banderas.
- Titulo de marca como `WARHAMMER 40K`.
- Boton de apoyo Ko-fi visible y sin cierre.
- Boton nuevo para borrar peanas seleccionadas.
- Estilo visual tipo `imperial dossier` en `styles.css` y `terrain-editor.css`.

Archivos de editor:

- `map-1-editor.html`
- `map-2-editor.html`
- `terrain-editor.js`
- `terrain-editor.css`

## Interfaz y estilo

Reglas de diseño que ya aplican:

- El selector de idioma va en la misma linea que `WARHAMMER 40K`.
- El selector debe mantenerse visualmente minimo: solo banderas, sin pill ni boton blanco.
- El estado activo debe ser sutil, con brillo suave, no un bloque relleno.
- La estetica actual busca un tono `grimdark`/`imperial dossier`: pergamino, tinta, lacre y paneles opacos.
- Las peanas azules deben verse claramente azules, no gris acero.

## Peanas y seleccion

Comportamiento actual:

- `Limpiar` solo vacia la seleccion.
- `Borrar peanas` elimina las peanas seleccionadas del tablero.
- Doble clic sobre una peana tambien la borra.
- El boton de borrado debe deshabilitarse si no hay seleccion.
- La seleccion y el borrado operan solo sobre peanas del mapa activo.

## i18n

Notas importantes:

- No traducir la imagen del mapa; no tiene textos.
- Traducir solo chrome de UI, mensajes y botones.
- El idioma preferido se persiste en `localStorage`.
- `getLocalizedMapName()` ya cambia `Mapa X` a `Map X` cuando toca.

## Arranque local

Servidor local usado en esta carpeta:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

URL:

```text
http://127.0.0.1:8000/
```

## Publicacion

La rama `main` se ha estado subiendo a GitHub con commits regulares. Si se cambia algo importante en UI, comprobar:

- `node --check app.js`
- `node --check terrain-editor.js`
- `node --check i18n.js`

## Cosas a no tocar sin necesidad

- No reintroducir el contador de visitas.
- No devolver el estilo de selector anterior con fondo o pill visible.
- No volver a usar texto `ES / EN` en el selector.
- No tocar la imagen del mapa para temas de idioma.
- No asumir que la escenografia es precisa: `map-configs.js` sigue siendo aproximado y se usa como base de calibracion.

## Como arrancarlo

Servidor local simple:

```bash
cd /Users/javier.peigneux/Documents/vision40ksimulator
python3 -m http.server 4174
```

URL:

```text
http://127.0.0.1:4174
```

## Estado actual

La app ya hace esto:

- Carga dos mapas.
- Muestra solo la zona util del tablero usando `boardRectPx`.
- Mantiene el tablero en proporcion `44x60`.
- Permite crear peanas de `25 mm` a `160 mm`.
- Permite mover peanas con drag and drop.
- Permite seleccionar dos peanas.
- Dibuja una linea entre los puntos mas cercanos de ambas peanas.
- Muestra la distancia numerica `um` borde a borde.
- Cambia la linea a rojo si cruza una pieza de escenografia configurada.

## Geometria actual

Escala base:

- `44 um` ancho
- `60 um` alto
- `1 um = 1 pulgada`
- conversion de peanas: `mm / 25.4`

La distancia visible ya no se calcula centro a centro para la linea:

- la linea sale desde el borde de una peana
- termina en el borde de la otra
- la etiqueta muestra distancia borde a borde

## Configuracion de mapas

Cada mapa en `map-configs.js` tiene:

- `id`
- `name`
- `image.src`
- `image.originalSizePx`
- `image.boardRectPx`
- `terrain`

`boardRectPx` recorta visualmente la imagen original al rectangulo util del tablero.

Valores actuales:

- mapa 1: `x=149, y=131, width=705, height=957`
- mapa 2: `x=149, y=131, width=703, height=957`

## Escenografia

La escenografia ya no se dibuja superpuesta porque la calibracion visual no coincidia con las imagenes.

Pero sigue existiendo en `map-configs.js` y se usa para:

- contar piezas configuradas
- detectar si la linea cruza una pieza

## Precision de escenografia

Situacion real:

- la configuracion actual de `terrain` sigue siendo aproximada
- muchas piezas estan modeladas como rectangulos rotados
- eso no es suficiente para una deteccion realmente fiable

El motor ya soporta dos formatos:

1. Rectangulos:

- `x`
- `y`
- `width`
- `height`
- `rotation`

2. Poligonos:

- `polygon: [{ x, y }, ...]`
- los puntos son locales a la pieza y se rotan con `rotation`

La interseccion de linea ya soporta poligonos en `app.js`.

## Decision importante

No vender como "superprecisa" una configuracion hecha a ojo con rectangulos.

El siguiente paso correcto es:

- convertir la escenografia a poligonos reales
- calibrar pieza a pieza sobre el tablero

## Siguiente trabajo recomendado

Orden recomendado:

1. Crear modo editor de calibracion.
2. Permitir mostrar la pieza seleccionada sobre el mapa.
3. Permitir clicar vertices y guardar `polygon`.
4. Persistir el resultado en `map-configs.js` o en JSON externo.
5. Rehabilitar overlay solo como herramienta de edicion, no por defecto.

## Notas de implementacion

`app.js`:

- `ResizeObserver` ajusta el tablero al espacio real de `board-frame`.
- el drag de peanas usa estado global para no romperse en rerenders.
- `updateLosLine()` calcula:
  - punto de salida
  - punto de llegada
  - distancia borde a borde
  - bloqueo por escenografia

`styles.css`:

- las peanas ya no tienen borde blanco
- las peanas usan `aspect-ratio: 1 / 1`
- el tablero tiene borde rectangular

## Limitaciones actuales

- la deteccion roja de linea depende de una escenografia todavia aproximada
- no hay editor visual de escenografia
- no hay guardado de estado de peanas
- no hay bloqueo de movimiento sobre escenografia
- no hay chequeo entre varias piezas a distintos niveles o tipos especiales

## Si retomamos despues

Lo siguiente a hacer es:

- implementar editor de poligonos para escenografia
- recalibrar `map-configs.js` con precision
- solo entonces confiar en el color rojo de la linea
