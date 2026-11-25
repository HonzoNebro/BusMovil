# BusMovil — pruebas en emulador, 28 de octubre de 2026

## Resultado

Se ejecutaron **25 escenarios diferentes: 19 satisfactorios y 6 fallidos**, con repeticiones para eliminar falsos positivos del automatismo. Dos casos fallidos pueden corresponder a un mismo bug. Los cuatro tests de Jest, TypeScript y ESLint también pasan.

Entorno: AVD `Medium_Phone_API_36.1`, `emulator-5554`, imagen Google Play x86_64, pantalla 1080×2400, KVM y SwiftShader. APK release con JavaScript/Hermes incorporado, sin Metro. Paquete `com.honzonebro.busmovil`, versión 1.0 (1). Se mantuvieron los cambios locales existentes y no se corrigieron los bugs durante esta revisión.

SHA-256 del APK: `e89dbff13dfeef31439d51c9d3b66022c385df40a07ef6b6d2b72849093f8bef`.

## Hallazgos confirmados

### B1 · P1 · El foco GPS impide cambiar de línea o volver a sentidos

**Reproducción:** localizar Plaza España y pulsar «Cambiar línea» o «‹ Sentidos».

**Actual:** reaparece inmediatamente Línea 1 → A Plaza España; no se puede continuar navegando normalmente. **Esperado:** el foco automático inicial debe dejar de imponerse cuando el usuario cambia manualmente su selección.

Casos 11 y 12. Evidencia: [captura](evidence/11-navigation-after-gps.png), [jerarquía de interfaz](evidence/11-navigation-after-gps.xml). La repetición del caso 11 estabilizó primero el GPS para descartar el bug B5.

Causa identificada en `src/components/ArrivalList.tsx:324`: al volver a líneas o sentidos, `selectionContainsFocus` pasa a falso, se borra la intención manual y el efecto vuelve a seleccionar automáticamente la línea y el sentido.

### B2 · P1 · Un fallo de red se presenta como actualización correcta sin autobuses

**Reproducción:** desactivar Wi-Fi y datos solo en el emulador y abrir la app.

**Actual:** «Sin datos de llegada» y una hora nueva de «Última actualización», sin aviso de conexión. **Esperado:** mostrar el error de consulta; no presentar una consulta fallida como una actualización correcta ni confundirla con una respuesta válida sin llegadas.

Caso 15. Evidencia: [captura](evidence/15-offline-arrivals.png), [estado de conectividad](evidence/offline-connectivity.txt): `Active default network: none` y `mDefaultNetwork=null`.

Causa identificada en `src/services/cadizApi.ts:656`: cada consulta fallida se convierte en `[]`; `fetchBusData` devuelve éxito y un `generatedAt` nuevo aunque todas fallen. `useBusData` por tanto elimina el error. Se comprobó por separado que la API sí respondía desde el anfitrión; no se ha confundido una respuesta municipal vacía con la falta de red del emulador.

### B3 · P2 · La ubicación aproximada concedida se considera bloqueada

**Reproducción:** revocar los permisos de la app, pulsar «Usar mi ubicación», elegir «Approximate» y «While using the app» en Android.

**Actual:** «La ubicación está bloqueada. Activa los permisos manualmente en los ajustes» y no se calcula una parada. Android sí ha concedido `ACCESS_COARSE_LOCATION`; solo `ACCESS_FINE_LOCATION` está denegado. **Esperado:** aprovechar la ubicación aproximada con su limitación de precisión o explicar claramente que la función necesita ubicación precisa, sin afirmar que toda la ubicación está bloqueada.

Caso 21. Evidencia: [captura](evidence/21-permission-approximate.png), [permisos reales de Android](evidence/approximate-package-permissions.txt).

Causa identificada en `src/hooks/useNearestStop.ts:88`: solo se solicita/evalúa el permiso preciso y se trata su resultado como el estado de todos los permisos de ubicación.

### B4 · P2 · La parada localizada no queda visible en la lista

**Reproducción:** localizar Plaza España con coordenadas `36.534149, -6.292969`.

**Actual:** la cabecera identifica Plaza España a 0 m, pero la lista sigue mostrando desde 9905/Cortadura y 1114; la fila 1101 queda fuera de pantalla. **Esperado:** el desplazamiento automático implementado debe dejar visible la parada seleccionada, con sus llegadas.

Caso 25, reproducido también en la repetición. Evidencia: [captura](evidence/25-gps-scroll-target.png), [interfaz visible](evidence/25-gps-scroll-target.xml).

Revisar `src/components/ArrivalList.tsx:364` y la interacción de su `ScrollView` con el `ScrollView` externo de `HomeScreen`. La falta de desplazamiento está confirmada; la causa exacta del cálculo/layout requiere depuración adicional.

### B5 · P2 · La simulación GPS puede devolver la posición anterior

**Reproducción:** estabilizar Plaza España, inyectar una sola posición del hospital (`36.509067, -6.278601`) con el comando de GPS y pulsar inmediatamente «Usar mi ubicación».

**Actual:** sigue mostrando Plaza España a 0 m después de 20 segundos. Se reprodujo en dos ejecuciones. Reenviar la coordenada y repetir la consulta permite obtener el hospital. **Esperado:** las pruebas con una nueva coordenada deben utilizarla, o indicar que aún se está esperando una posición actualizada.

Caso 09. Evidencia: [captura](evidence/09-gps-move.png), [interfaz](evidence/09-gps-move.xml).

Ámbito confirmado: emulador y proveedor de ubicación; no se ha demostrado que ocurra con GPS físico. La causa exacta entre inyección y proveedor Fused no está aislada. `maximumAge: 0` por sí solo no impide el comportamiento observado. Revisar `scripts/android-emulator.cjs:57` y la antigüedad de la posición recibida por `useNearestStop`. Los casos de navegación se repitieron con GPS estabilizado para no atribuir a B1 un fallo de preparación.

## Cobertura y resultados

| Caso | Resultado | Comprobación |
| --- | --- | --- |
| 01 | PASS | Arranque sin Metro |
| 02 | PASS | Cinco líneas: sentidos, paradas y vuelta |
| 03 | PASS | Expandir/cerrar una parada |
| 04 | PASS | Abrir/cerrar mapa y mostrar/ocultar paradas |
| 05 | PASS | Atrás de Android cierra el mapa |
| 06 | PASS | Cinco aperturas/cierres del mapa |
| 07 | PASS | GPS exacto en Plaza España |
| 08 | PASS | GPS exacto en el hospital |
| 09 | FAIL | Cambio rápido de GPS entre paradas |
| 10 | PASS | Posición a 17 m del hospital |
| 11 | FAIL | Cambiar de línea después del GPS |
| 12 | FAIL | Volver a sentidos después del GPS |
| 13 | PASS | Ubicación fuera de Cádiz |
| 14 | PASS | GPS del sistema desactivado y cancelación del aviso |
| 15 | FAIL | Arranque sin conectividad |
| 16 | PASS | Mapa sin conectividad |
| 17 | PASS | Recuperación de conexión y carga de líneas |
| 18 | PASS | Orientación horizontal |
| 19 | PASS | Fuente al 150 % |
| 20 | PASS | Denegar ubicación |
| 21 | FAIL | Conceder solo ubicación aproximada |
| 22 | PASS | Recuperación tras conceder permiso preciso |
| 23 | PASS | Mapa sin permisos de ubicación |
| 24 | PASS | Volver del segundo plano con mapa abierto |
| 25 | FAIL | Visibilidad de la parada localizada |

La observación del caso 13 —sugerir una parada de Cádiz a 486,7 km desde Madrid— se registra como mejora de experiencia, no como bug demostrado: matemáticamente sigue siendo la parada más cercana del catálogo.

Los primeros intentos del acordeón de paradas y de algunos diálogos del sistema necesitaron corregir la espera de carga o reconocer «Don’t allow»/«No thanks». Se repitieron; esos fallos de preparación no se incluyen como bugs de producto. El cuadro refleja el último resultado válido de cada caso. El caso 16 se verificó visualmente: el mapa sí muestra teselas y marcadores desde caché; UIAutomator no exponía los nodos de su WebView. Se descartó como bug. La captura está en `evidence/16-offline-map.png`. En futuras ejecuciones, si el automatismo no puede verificar el WebView, marca `REVIEW` para inspección visual en lugar de darlo por fallido.

No se detectaron cierres inesperados en los recorridos ejecutados. Las pruebas de mapa cubren el modal, sus controles y el retorno; no cubren exhaustivamente todos los popups, teselas, trazados ni todas las paradas. No se han validado iOS, dispositivos físicos, rendimiento sostenido, todas las variantes de permisos ni la exactitud oficial de horarios/rutas.

## Repetir la batería

```bash
npm run emulator
npm run test:emulator
# Un bloque o un caso:
python3 scripts/emulator-qa.py location
python3 scripts/emulator-qa.py location --only 11-navigation-after-gps
```

El runner usa exclusivamente `emulator-5554`. Requiere Python 3 y acceso a ADB. Cambia GPS, permisos, red, orientación y fuente del emulador; en el `finally` de cada bloque habilita red/ubicación, concede permisos precisos, restaura orientación/fuente, coloca el GPS en Plaza España y vuelve a abrir la app. No borra sus datos. El proceso devuelve código 1 si hay pruebas fallidas o errores del automatismo.

Resultados consolidados en [results.json](results.json). Las capturas/jerarquías de los fallos confirmados están en `evidence/`. Las trazas completas de cada ejecución permanecen en `work/qa/`, ignorado por Git. La batería y este informe se añaden al proyecto; no se ha corregido todavía el comportamiento de producción.
