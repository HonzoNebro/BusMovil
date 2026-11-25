# Tablas oficiales incorporadas

Fuente: https://institucional.cadiz.es/area/documento/plano-de-lineas
PDF enlazado: https://institucional.cadiz.es/sites/default/files/areamunicipal/documentos/TransporteUrbanoC%C3%A1diz.pdf

Documento rotulado como vigente desde 1 de mayo de 2023. Consultado e incorporado el 29 de octubre de 2026. No se afirma que exista una comprobación automática de versiones.

Los PNG contienen únicamente las tablas oficiales y la nota de verano de la línea 7; no se transcribieron ni reinterpretaron los intervalos del gráfico. Se revisaron visualmente todos los recortes y su presentación en el emulador. La consulta interna permite desplazamiento horizontal/vertical y ampliación.

Reproducción con Poppler, página única escalada a 5000 píxeles:

```sh
pdftoppm -scale-to 5000 -x 610 -y 924 -W 1830 -H 816 -singlefile -png TransporteUrbanoCadiz.pdf frequencies
pdftoppm -scale-to 5000 -x 2435 -y 900 -W 480 -H 835 -singlefile -png TransporteUrbanoCadiz.pdf departures
```

## Sustitución por tablas nativas

Los PNG se conservan como referencia histórica; la consulta de la app utiliza
Views/Text y los datos estructurados de `src/services/officialTimetable.ts`. La
escala de las bandas de frecuencias conserva las posiciones del gráfico original
(origen 293.531, final 716.824 puntos del PDF). No se convierten esos bordes
gráficos en horas exactas de salida. Las cabeceras y primeras/últimas salidas se
transcriben separadamente, incluyendo la nota estival de la línea 7.
