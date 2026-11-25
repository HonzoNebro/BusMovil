# Diseño Urbano — 29 de octubre de 2026

Implementado en React Native CLI y APK release instalado en emulator-5554, sin Metro.

## Cambios

- Identidad busmovil/Cádiz y colores por línea.
- Tarjeta de parada seleccionada con acceso a GPS.
- Próxima llegada real destacada y dos siguientes; selección manual actualiza la tarjeta.
- Recorrido con tres paradas próximas y opción de desplegar el recorrido completo.
- Tema claro/oscuro automático, controles de mapa y texto escalable.
- Datos anteriores conservan su fecha y se muestran como históricos, sin cifra grande de cuenta atrás.

## Verificación

`npm run typecheck`, `npm run lint`, `git diff --check`: correctos.
`npm test -- --runInBand`: 25 pruebas, 7 suites, todas correctas.
`python3 scripts/urban-qa.py`: siete escenarios nativos; repetición dirigida del mapa y escenario adicional sin red: ocho escenarios finales PASS. Resultados en `results.json`.

Navegación de las cinco líneas, selección de parada, mapa (abrir/cerrar, marcadores), GPS Plaza España → hospital → Plaza España y navegación posterior, modo oscuro, texto al 150 %, horizontal y datos antiguos sin conexión. Capturas PNG revisadas visualmente. El WebView muestra teselas y marcadores; se revisó `mapa.png` además de los controles nativos.

El primer verificador del mapa buscaba el logotipo al cerrar aunque había quedado fuera de pantalla por el desplazamiento. Se corrigió esa aserción para verificar el cierre del modal y se repitió con éxito; se conserva `results-initial.json`.

No se han repetido los 25 escenarios nativos del informe anterior en esta entrega visual. Las regresiones de red, permisos y observadores siguen cubiertas por las pruebas automatizadas. Se conserva el informe anterior en `../2026-10-29-correcciones/README.md`.

## Evidencias

- `claro.png`: pantalla principal con llegadas reales.
- `oscuro.png`: modo oscuro.
- `parada-seleccionada.png`: selección manual.
- `mapa.png`: WebView revisado visualmente.
- `gps-1101.png`, `gps-1110.png`: ubicaciones simuladas (1110 es el nombre del paso del test, no el identificador de la parada del hospital).
- `fuente150-inicio.png`, `horizontal-inicio.png`: tamaños y orientación.
- `datos-antiguos.png`: datos históricos con fecha y aviso.

## APK y estado final

SHA-256: `099344c9c1c42e59732dccaed59c0052292f25c4ec138069b5830dd879154d07`.
APK: `android/app/build/outputs/apk/release/app-release.apk` desde la raíz del proyecto.

Emulador operativo, red restablecida y escala/orientación restauradas. Tema claro al terminar. Envío periódico de GPS detenido: se puede utilizar Extended Controls → Location → Set Location y después «Usar mi ubicación». Validación limitada a Android emulado.
