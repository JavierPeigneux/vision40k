# Vision40K: notas de mantenimiento

Aplicación web estática. Componentes principales: `index.html`, `styles.css`, `i18n.js`, `app.js` e `integrations/40kdc/`.

## Mapas

- Los mapas generados son el único modo y se cargan sin parámetros especiales.
- Geometría upstream: JSON públicos de 40kdc-data; hay respaldo local versionado.
- Los polígonos dibujados son los usados en las colisiones, sin simplificar sus contornos.
- `link_group` se respeta y se complementa con los ojos auditados del PDF oficial; jamás unir por proximidad.
- No reintroducir `map-configs.js`, imágenes PDF o calibraciones manuales.
- La firma geométrica protege los enlaces complementarios cuando cambia el mapa.
- Mantener la atribución visible a 40kdc-data y las licencias de datos/resolutor.

## Comportamiento

- `Limpiar` vacía la selección; `Borrar peanas` elimina las seleccionadas del mapa activo.
- Conservar las banderas ES/EN, Ko-fi y la estética imperial existente.
- No reemplazar el nodo de una peana entre `pointerdown` y `click`: se perdería la selección.
- Arrastre con `requestAnimationFrame`, umbral de 3 px y aplicación de la última posición al soltar.
- Visión en tareas cortas cancelables. No dejar que resultados antiguos repinten una máscara nueva.
- La geometría de cada mapa es inmutable tras cargarlo, condición de las cachés del motor.
- No presentar el muestreo 2D como un motor completo de reglas/visibilidad 3D.

## Verificación

`deno task test`. Para servir localmente: `python3 -m http.server 4174 --bind 127.0.0.1`.

La documentación actual está en `README.md` e `integrations/40kdc/README.md`. Los archivos antiguos se conservan en el historial Git, no en el despliegue activo.
