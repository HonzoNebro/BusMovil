# BusMovil — correcciones y verificación

Verificación actualizada el 29/10/2026 a las 00:19 (Europe/Madrid). Trabajo iniciado el 28 de octubre y completado el 29.

## Resultado

Batería de referencia: **25 escenarios**, resultados consolidados: **25 PASS, 0 FAIL, 0 ERROR y 0 REVIEW**. La [referencia anterior](../2026-10-28/README.md), con 19 casos satisfactorios y 6 fallidos correspondientes a cinco bugs, se conserva sin modificar.

Pasan **24 pruebas automatizadas en siete suites**, TypeScript, ESLint y `git diff --check`. La compilación Android release termina correctamente. No se han añadido dependencias ni se ha mantenido el puente nativo experimental usado durante la investigación de GPS: la solución utiliza la integración de ubicación existente.

Entorno: Android 16, AVD `Medium_Phone_API_36.1`, `emulator-5554`, x86_64, KVM, SwiftShader. APK con JavaScript/Hermes incorporado, sin Metro, paquete `com.honzonebro.busmovil`. SHA-256: `63fc8261a32b20b202fd54d48d596074c3a97a40922cc4356f5d053c978c1239`.

## Cambios y evidencias

| Bug | Corrección | Verificación |
| --- | --- | --- |
| B1 · Navegación atrapada por GPS | Solicitudes de enfoque con ID, consumidas una vez. La navegación manual cancela el enfoque pendiente, incluso si el GPS o la medición de layout aún no han terminado. | Casos 11 y 12; pruebas de componente y de respuesta GPS pendiente. |
| B2 · Fallo de red presentado como actualización válida | Consultas únicas por parada, cancelación a los 15 s, error si todas fallan y metadatos de fallos parciales. Se conservan las llegadas de paradas fallidas con su fecha, marcadas «Dato anterior», sin presentarlas como cuenta atrás vigente. | Caso 15, prueba complementaria de pérdida de red con datos cargados y pruebas unitarias de fallo total/parcial, respuesta vacía y timeout. |
| B3 · Ubicación aproximada rechazada | Se comprueban permisos preciso y aproximado por separado. Se admite aproximada con aviso, límite de antigüedad de 15 minutos y fecha visible. | Caso 21 y permisos reales de Android; pruebas de concesión aproximada, límite de antigüedad y denegación. |
| B4 · Parada enfocada fuera de pantalla | Un único ScrollView y medición de la fila respecto a su contenido, después del layout. La parada se muestra expandida; los refrescos no fuerzan otro desplazamiento. | Caso 25 y capturas en horizontal/fuente 150 %. |
| B5 · GPS simulado conserva la posición anterior | Observación temporal que descarta posiciones precisas anteriores a la petición, con cancelación al finalizar, desmontar o cumplir 15 s. Un único proceso mantiene la coordenada simulada cada segundo. | Caso 09, cinco recorridos Plaza España → hospital → Plaza España y comprobación aislada del ciclo de vida del proceso GPS. |

Capturas principales: [navegación](evidence/11-navigation-after-gps.png), [sin conexión](evidence/15-offline-arrivals.png), [aproximada con fecha](evidence/21-permission-approximate.png), [parada enfocada](evidence/25-gps-scroll-target.png), [horizontal](evidence/27-focus-landscape.png) y [fuente grande](evidence/28-focus-large-font.png).

## Criterio acordado para ubicación aproximada

La exigencia inicial de una posición tomada después de iniciar la petición no es compatible de forma fiable con la frecuencia que Android permite para ubicación aproximada. Se comprobó que el proveedor entregaba una posición ligeramente anterior y después limitaba nuevas lecturas; la petición nativa sin caché tampoco garantizó una posición nueva en 15 segundos. Google documenta que las ubicaciones aproximadas son ofuscadas y tienen una frecuencia limitada: [FusedLocationProviderClient](https://developers.google.com/android/reference/com/google/android/gms/location/FusedLocationProviderClient).

Tras la confirmación del usuario, el comportamiento final es:

- **Precisa:** solo acepta una posición con timestamp igual o posterior al inicio de la petición.
- **Aproximada:** acepta una estimación de hasta 15 minutos y muestra su fecha original, junto al aviso de que puede no corresponder a la posición actual. No se modifica el timestamp recibido ni se elude el permiso de Android.
- Ambas esperan como máximo 15 segundos y liberan su observación al finalizar, fallar o desmontarse la pantalla.

## Resultados de la batería

| Caso | Resultado | Detalle |
| --- | --- | --- |
| 01-cold-start | PASS | Pantalla principal visible sin Metro. |
| 02-five-lines-navigation | PASS | Se abren sentidos y paradas y se vuelve a líneas en las cinco líneas. |
| 03-stop-expand | PASS | Acordeón de 9905 · Centro Educativo Cortadura abre/cierra. |
| 04-map-controls | PASS | Modal, visibilidad de marcadores y cierre funcionan. |
| 05-map-android-back | PASS | Atrás cierra el mapa y mantiene la app. |
| 06-map-repeat | PASS | Cinco aperturas/cierres consecutivos sin crash. |
| 07-gps-plaza | PASS | Tu parada más cercana es Plaza España (0 m). |
| 08-gps-hospital | PASS | Tu parada más cercana es Residencia - Hospital Puerta del Mar (0 m). |
| 09-gps-move | PASS | Tu parada más cercana es Residencia - Hospital Puerta del Mar (0 m). |
| 10-gps-offset | PASS | Posición desplazada detectada a 17 m del hospital. |
| 11-navigation-after-gps | PASS | Se permite cambiar de línea tras localizarse. |
| 12-directions-after-gps | PASS |  |
| 13-far-from-cadiz | PASS | OBSERVACIÓN: Tu parada más cercana es República Argentina (486.7 km). |
| 14-gps-disabled | PASS | Rastreo en tiempo real Consulta cuántos minutos faltan para tus líneas de autobús favoritas y recibe sugerencias sobre la parada más cercana. Parada cercana No … |
| 15-offline-arrivals | PASS |  |
| 16-offline-map | PASS | Inspección visual: teselas, marcadores, trazados y atribución Leaflet/OSM visibles desde caché sin red. No hay fallo de mapa; UIAutomator no expone su contenido… |
| 17-network-recovery | PASS | La app vuelve a cargar las líneas con llegadas tras recuperar red. |
| 18-landscape | PASS | En horizontal se puede abrir/cerrar el mapa. |
| 19-large-font | PASS | Fuente 150%: controles principales accesibles por desplazamiento. |
| 20-permission-deny | PASS | Denegación explícita muestra error y libera el botón. |
| 21-permission-approximate | PASS | Rastreo en tiempo real Consulta cuántos minutos faltan para tus líneas de autobús favoritas y recibe sugerencias sobre la parada más cercana. Parada cercana Tu … |
| 22-permission-recovery | PASS | La ubicación funciona tras restaurar el permiso preciso. |
| 23-map-without-permissions | PASS | El mapa abre/cierra sin permiso de ubicación y no provoca cierre de la app. |
| 24-background-resume | PASS | Volver de segundo plano conserva el modal y permite cerrarlo. |
| 25-gps-scroll-target | PASS | La fila 1101 queda visible y expandida sin desplazar manualmente. |

El mapa sin red puede utilizar recursos cacheados. Cuando UIAutomator no expone el contenido del WebView, el runner marca `REVIEW` y se inspecciona la captura antes de declarar un resultado. La ausencia de nodos accesibles no se considera por sí sola un fallo del mapa.

## Comprobaciones complementarias

- Cinco recorridos completos, 15 solicitudes individuales: [registro de cada petición](evidence/gps-cycles-checkpoints.json). No se reinyecta GPS dentro de una consulta ni se repite el botón para obtener el resultado.
- Enfoque visible y expandido en horizontal y con texto al 150 %, con inspección visual de las capturas.
- Pérdida de conexión con datos ya cargados: se comprueba la etiqueta «Dato anterior» y que la fecha de la última actualización no avance.
- Un único proceso de GPS por emulador, cambio de coordenada sin duplicarlo, salida al desconectarse y al ejecutar `emulator:gps:stop`: [resultado](evidence/gps-worker-lifecycle.json). Esta comprobación utiliza un ADB simulado y no modifica dispositivos físicos.

Las comprobaciones de ciclos/layout se ejecutaron durante la corrección sobre el mismo comportamiento de ubicación precisa; el cambio posterior acordado se limita a la aceptación de ubicaciones aproximadas. La batería de 25 casos se repite sobre el APK final indicado arriba. Las evidencias completas e intentos de diagnóstico se conservan en `work/`, ignorado por Git.

## Repetir las pruebas

```bash
npm run emulator
npm run test:emulator
python3 scripts/emulator-qa.py acceptance
npm test -- --runInBand
npm run typecheck
npm run lint
```

Para GPS manual: `npm run emulator:gps -- 1101` o `npm run emulator:gps -- 1109`. Antes de utilizar ⋮ → Location del emulador, detener el emisor con `npm run emulator:gps:stop`.

La validación realizada corresponde a Android emulado. No se afirma validación en iOS ni en GPS físico. No se han añadido favoritos, notificaciones ni almacenamiento offline persistente. La prueba complementaria 29 confirma que se conserva la fecha original tras un fallo de red; se corrigió su preparación para desconectar antes de cualquier gesto que pudiera refrescar mientras aún había conexión. Los cambios están locales, sin commit.
