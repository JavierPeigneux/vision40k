# Vision40K

Simulador web estático de líneas de visión para Warhammer 40K.

Los 45 mapas se generan por defecto como SVG desde los datos públicos de [40kdc-data](https://github.com/wn-mitch/40kdc-data). El dibujo y los obstáculos comparten geometría. Ya no se incluyen imágenes de mapas derivadas de PDFs ni calibraciones manuales.

## Desarrollo local

```sh
python3 -m http.server 4174 --bind 127.0.0.1
```

Abre <http://127.0.0.1:4174/>. También puede usarse `node scripts/editor-server.mjs 4174` como servidor estático de solo lectura.

- Los parámetros `a`, `b` y `layout` seleccionan el mapa y conservan los enlaces compartidos.
- `?offline=1` fuerza los datos locales para pruebas sin conexión con GitHub.
- `?source=40kdc` continúa siendo compatible, aunque ya no es necesario.
- La selección se hace con clic; el arrastre tolera pequeños movimientos del puntero. El movimiento se actualiza por frame y la visión en tareas cancelables.

## Datos y enlaces de terreno

La carga en vivo fija una revisión de upstream para descargar catálogos coherentes. Si no está disponible o es incompatible, se usa la copia local. El panel de información indica el estado de los datos. No se requiere un backend ni una clave API.

La fuente comunitaria no publica todos los enlaces entre áreas. Se completa con una tabla pequeña auditada contra los símbolos del Event Companion GW v1.3: 103 parejas únicas y 112 separadas, en 45 mapas. La tabla se desactiva por mapa si cambia su geometría y se avisa de la revisión pendiente. Los PDFs no se descargan en la aplicación.

```sh
python3 scripts/sync-40kdc.py
```

Eso actualiza la copia de datos. No actualiza automáticamente el resolutor ni la tabla de enlaces del PDF: deben revalidarse cuando cambie su contrato. No hay tareas programadas.

## Pruebas

Con Deno instalado:

```sh
deno task test
```

Las comprobaciones cubren la geometría upstream, los 45 mapas, las 215 marcas del PDF, el respaldo sin red, cambios incompatibles, carga sin parámetros, enlaces compartidos, selección, arrastre, cancelación de visión y comparación del motor optimizado con el anterior.

Las pruebas de DOM usan `happy-dom`; el canvas se simula, por lo que no sustituyen una revisión visual del navegador.

## Publicación y mantenimiento

La aplicación se sirve como archivos estáticos; `CNAME` conserva el dominio configurado. No necesita compilarse. Las dependencias de desarrollo y las herramientas de auditoría no se cargan en el navegador.

La geometría y las reglas de visión siguen siendo 2D, con muestreo de perímetros. Los datos upstream están etiquetados como provisionales y no constituyen una fuente oficial de GW.

Consulta [la documentación de la integración](integrations/40kdc/README.md) para conocer procedencia, licencias, auditoría de símbolos y límites de actualización.

Powered by [40kdc-data](https://40kdc.alpacasoft.dev). Datos de Alpaca Software y colaboradores de 40kdc, adaptados bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Licencias incluidas en `integrations/40kdc/snapshot/LICENSE` y `integrations/40kdc/vendor/LICENSE`.
