# Mapas generados desde la fuente de Layout Editor

## Probar

Desde la raíz de Vision40K:

```sh
python3 -m http.server 4174 --bind 127.0.0.1
```

- Modo predeterminado, en vivo: <http://127.0.0.1:4174/>
- Copia local, sin consultar GitHub: <http://127.0.0.1:4174/?offline=1>
- Los enlaces anteriores con `?source=40kdc` siguen funcionando. Ya no existe el modo de imágenes PDF.

Los selectores, las peanas, el giro del tablero y la visión existentes se reutilizan. Las imágenes derivadas del PDF, las calibraciones y el editor antiguo se han retirado. `terrain-editor.html` redirige a la aplicación.

## Hallazgo sobre la fuente

Se inspeccionaron el HTML y los módulos públicos de <https://layout-editor.alpacasoft.dev/> el 24 de octubre de 2026. La versión observada incorpora `Dataset.embedded()` de `@alpaca-software/40kdc-data`, no una petición REST de mapas al cargar. El repositorio público contiene los mismos tipos de catálogo:

- [Layouts](https://github.com/wn-mitch/40kdc-data/blob/main/data/core/terrain-layouts.json).
- [Plantillas](https://github.com/wn-mitch/40kdc-data/blob/main/data/core/terrain-templates.json).
- Emparejamientos, disposiciones y patrones de despliegue en `data/core`.
- [Resolutor geométrico](https://github.com/wn-mitch/40kdc-data/blob/main/tools/src/terrain/resolve.ts).

La aplicación usa los JSON de ese repositorio como fuente HTTP. No extrae posiciones de imágenes ni descarga PDFs. Tampoco ejecuta JavaScript remoto: el resolutor está incluido localmente y fijado a la revisión de `snapshot/metadata.json`.

El catálogo probado contiene 45 layouts `battlemaster-11e` (15 emparejamientos × 3 variantes) y un mapa KOTC con otro tamaño, excluido por el adaptador. Las descripciones atribuyen los layouts a importaciones de Battlemaster. No es una API oficial de Games Workshop. Los layouts están etiquetados `11th / pre-launch-provisional`: deben revisarse antes de usarlos como referencia oficial de torneo.

## Sustitución de los PDFs

`adapter.js` resuelve plantillas, áreas, edificios, muros, rotaciones, simetrías y piezas ancladas a un área. Genera un SVG por mapa con cuadrícula, despliegues, áreas, elementos de terreno y objetivos. El SVG sustituye a la imagen PDF en el canvas existente; sigue siendo vectorial hasta su dibujo en pantalla.

La fuente utiliza un tablero 60×44 pulgadas. Se aplica una rotación rígida de 90° (`x'=44-y`, `y'=x`) para el formato 44×60 de Vision40K. No hay escalado desigual ni calibración a ojo. Los polígonos usados en el fondo SVG y por el motor de intersección proceden de los mismos vértices resueltos.

Los muros se dibujan por separado de sus áreas. El motor conserva la política 2D actual de bloquear una línea al cruzar un área de terreno. Esta prueba no implementa reglas completas de 11ª, alturas, ventanas o visibilidad entre pisos. Los objetivos sin posición explícita no se inventan.

## Actualización y respaldo

En cada carga predeterminada se consulta una revisión del repositorio y se descargan los cinco catálogos de esa misma revisión, para evitar mezclar versiones. Se validan IDs, geometría y cobertura de combinaciones. Si la conexión falla o un cambio de esquema impide adaptar los mapas, se usa la copia local y se indica en pantalla.

GitHub permite actualmente 60 consultas API sin autenticar por hora/IP; una recarga de la prueba usa una consulta API más cinco lecturas de JSON estático. Para producción es preferible una sincronización periódica en el despliegue/CDN, con validación y última versión válida, para no depender del límite por visitante ni esperar a la red en cada visita. No se ha programado ni publicado ninguna sincronización.

Actualizar manualmente el respaldo sin tocar PDFs:

```sh
python3 scripts/sync-40kdc.py
```

Eso actualiza los datos, no el resolutor fijado. Si cambia su contrato, hay que actualizar el adaptador/resolutor y repetir las pruebas. Que GW publique un cambio no garantiza que esta fuente comunitaria lo incorpore inmediatamente.

## Verificaciones realizadas

- Los 13 casos de conformidad geométrica del proyecto original.
- Generación de los 45 mapas y de sus 720 polígonos de área; IDs únicos, límites del tablero, distancias y correspondencia exacta dibujo/colisión.
- Carga real en vivo, carga local, caída de red y esquema remoto incompatible.
- Integración DOM del modo predeterminado y de las URL compatibles: inicio de la app, fuente del canvas, cambio de layout, creación de peanas y cambio de idioma. El canvas está simulado en esa prueba: no sustituye una revisión visual en navegador.
- Respuestas HTTP con CORS público en la fuente.

Pruebas de geometría (Node moderno, sin dependencias):

```sh
node --experimental-default-type=module integrations/40kdc/tests/adapter.test.mjs
```

Con Deno instalado:

```sh
deno run --allow-read integrations/40kdc/tests/adapter.test.mjs
deno run --allow-read --allow-net integrations/40kdc/tests/loading.test.mjs --live
deno run --allow-read --allow-env --allow-net integrations/40kdc/tests/app.test.mjs
deno run --allow-read --allow-env --allow-net integrations/40kdc/tests/app.test.mjs --compat-url
```

Solo las pruebas DOM usan `happy-dom@21.0.4` desde npm. La app no incorpora esa dependencia ni necesita Deno/Node para ejecutarse en un servidor estático.

## Atribución

Powered by [40kdc-data](https://40kdc.alpacasoft.dev).

Datos de Alpaca Software y colaboradores de 40kdc, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), adaptados en orientación y representación para Vision40K. Véase `snapshot/LICENSE`.

Resolutor de Alpaca Software: véase `vendor/LICENSE`. `vendor/resolve.ts` es el código fuente de la revisión fijada; `vendor/resolve.js` es su transpilación para el navegador. Los casos de conformidad provienen del mismo proyecto. Las atribuciones se muestran también en la interfaz de prueba.

## Piezas enlazadas: contraste con el PDF oficial

Se ha contrastado el [Warhammer Event Companion v1.3](https://assets.warhammer-community.com/eng_14-10_wh40k_event_companion-rdwnqprl4c-nj8oqogadv.pdf). La leyenda de la página 8 distingue ojo abierto (**Single Terrain Area**) y ojo tachado (**Separate Terrain Areas**). No es una distinción entre edificios densos y ligeros.

Se extrajeron y comprobaron contra las páginas rasterizadas **215 símbolos visibles** de los 45 mapas: **103 parejas unidas y 112 separadas**. Se descartó un ojo presente en el contenido vectorial pero oculto en la página 35; no se usó como regla. Las asociaciones a las áreas se comprobaron además por simetría rotacional. La leyenda y las páginas 16, 35 y 48 se revisaron visualmente.

La fuente declara 21 de las 103 parejas unidas: **faltan 82 enlaces**. Los 21 existentes coinciden con el PDF y ninguno contradice los ojos tachados. Una heurística de borde compartido contrastada con esos símbolos dio 18 discrepancias: por eso no se aplica ninguna agrupación genérica por cercanía, contacto o esquina.

`pdf-links.generated.js` añade las relaciones del PDF que faltan. La tabla incluye versión, URL, SHA-256 del PDF, revisión upstream, página y firma de geometría por mapa. Los datos originales no se modifican. Si cambia la geometría de un mapa, se desactivan sus complementos hasta revisarlos y la interfaz avisa; se conservan los enlaces propios de la fuente.

La regla efectiva es explícita: respetar `link_group`, completar solo las parejas indicadas como una única área por el PDF auditado y mantener independientes las marcadas como separadas. `groupOrigin` distingue `explicit`, `pdf` y `single`. No se descarga ni analiza el PDF en las visitas: la geometría se sigue actualizando desde los JSON; la tabla es un complemento pequeño y versionado.

Los 720 contornos físicos forman **617 elementos lógicos** en esta revisión. Cada elemento compuesto tiene un único ID, todos sus `memberIds` y varios `polygons`. La visión considera la unión completa desde cualquiera de sus partes. Se mantienen huecos reales, se eliminan juntas internas de los rayos y las partes comparten número en la superposición. La tolerancia de pertenencia de 0,0051 pulgadas solo absorbe juntas numéricas de los grupos ya declarados; nunca crea enlaces nuevos.

### Caso reportado: Reconnaissance / Priority Assets, A (página 48)

Las cinco parejas indicadas como una sola área son **02/03, 04/05, 08/16, 10/11 y 12/13**. La fuente únicamente enlazaba 08/16. Las parejas **06/07 y 14/15**, que se rozan por una esquina, muestran ojo tachado y permanecen separadas. Son **11 elementos lógicos** en total, conservando los 16 contornos.

Pruebas adicionales:

```sh
deno run --allow-read integrations/40kdc/tests/terrain-links.test.mjs
deno run --allow-read integrations/40kdc/tests/pdf-links.test.mjs
```

La segunda comprueba las 215 relaciones, sus parejas simétricas, los 82 enlaces añadidos y la desactivación de complementos al cambiar la geometría. La prueba DOM cubre las cinco parejas y las dos separaciones del caso reportado, además de la visión desde ambas partes del centro.

### Reproducir la auditoría

Herramientas locales en `tools/` (solo para Event Companion v1.3; no son un parser genérico de futuros PDFs):

1. `inspect-pdf.swift` extrae texto sin argumento de página o rasteriza una página a 2× con PDFKit. Compilar con `swiftc -sdk "$(xcrun --show-sdk-path)" integrations/40kdc/tools/inspect-pdf.swift -o /tmp/inspect-gw-pdf`.
2. Rasterizar las páginas 9–53 como `page-N.png` y guardar el texto extraído como `pages.txt`.
3. `python3 integrations/40kdc/tools/extract-gw-eyes.py companion.pdf directorio-paginas eyes.json` requiere `pypdf` y `Pillow`; contrasta forma vectorial y píxeles para excluir símbolos ocultos y detectar discrepancias.
4. `deno run --allow-read --allow-write integrations/40kdc/tools/build-gw-eye-audit.mjs eyes.json pages.txt audit.json` asocia las marcas a los contornos. Revisar las asociaciones antes de sustituir `tests/fixtures/gw-eye-audit.json`.
5. `deno run --allow-read --allow-write integrations/40kdc/tools/generate-pdf-links.mjs companion.pdf` regenera la tabla desde la auditoría revisada. Ejecutar las pruebas y revisar visualmente los casos cambiados antes de publicarla.

Una actualización del PDF o del esquema puede exigir nueva revisión de estas herramientas. No se promete sincronización automática de símbolos que la API no publica.

## Rendimiento del arrastre

El motor anterior reconstruía todos los botones de peanas y repetía los cálculos de visión por cada evento del puntero. Los contornos importados tienen muchos más vértices que los rectángulos anteriores.

El arrastre ahora combina los eventos en un `requestAnimationFrame`, mueve únicamente el nodo de la peana y actualiza el panel y los resultados derivados como máximo cada 80 ms durante el movimiento. Al soltar se aplica inmediatamente la última posición, incluso si quedaba un frame pendiente. La máscara de visión se calcula en tareas con un presupuesto aproximado de 4 ms, se publica al completarse y cancela los resultados obsoletos.

Se cachean los contornos y sus límites, se descartan puntos/segmentos que no pueden alcanzar un polígono y se reutilizan búsquedas de visión repetidas entre el panel y la línea. Los mapas son inmutables tras la carga; las cachés geométricas se asocian a la identidad del objeto.

En una ejecución local con Deno, 5.000 rayos de visión pasaron de unos 600 ms a unos 20 ms, con idéntico resultado (4.181 bloqueados). No es una medición de FPS del navegador. Se contrastaron 24.680 casos de pertenencia/intersección de los 45 mapas con el algoritmo anterior y se probaron los arrastres por ráfagas, la posición final y la cancelación de máscaras antiguas.

```sh
deno run --allow-read --allow-env --allow-net integrations/40kdc/tests/app.test.mjs --benchmark
```
