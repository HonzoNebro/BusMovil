# Barra fija, parada física y actualización automática — 29 de octubre de 2026

## Cambios

- Barra inferior fija: Ubicación, Mapa y Horarios, fuera del ScrollView principal.
- Una solicitud GPS automática al montar la pantalla. La navegación manual cancela su enfoque pendiente y las actualizaciones de llegadas no vuelven a imponerlo.
- La selección GPS busca la parada física más cercana y prioriza las líneas 1, 2, 3, 5 y 7. Las otras líneas de esa misma parada aparecen con destino y próxima llegada, ordenadas por tiempo; se pueden elegir manteniendo el identificador de parada.
- La tarjeta elimina el número de línea repetido y explicita «Sentido: …».
- El selector de sentidos solo muestra tiempos de la parada seleccionada. Si un sentido no pasa por ella, lo explica y ofrece elegir otra parada explícitamente, sin cambiarla silenciosamente por la cabecera.
- El recorrido reducido muestra únicamente la parada seleccionada. Al expandir o reducir se solicita un desplazamiento mínimo para mantener visible la fila seleccionada. El recorrido tiene indicaciones verticales de dirección. Solo hay un acordeón abierto.
- El estado es un botón de actualización: verde en directo, naranja tras error total o parcial. Permanece naranja al reintentar; se conservan las estimaciones anteriores con su hora original y sin cuenta atrás en vivo. Se eliminó el gran aviso de error de la pantalla principal.
- Se conserva el refresco automático de 60 segundos, el refresco manual desde el estado y el gesto de tirar hacia abajo. No se superponen solicitudes.

## Tablas nativas

Se sustituyeron los recortes de imagen por Views/Text y datos estructurados: `src/services/officialTimetable.ts`. Conservan tema Urbano, desplazamiento horizontal/vertical, ampliación, fecha del documento e incorporación y un enlace opcional al original en la web. El acceso está en Horarios de la barra; se retiró de la ficha de parada.

Las frecuencias conservan las bandas y la escala del gráfico del PDF; no se dedujeron minutos exactos de salidas a partir de sus límites gráficos. Las primeras y últimas salidas se muestran por cabecera y tipo de día, incluida la nota de verano de la línea 7.

Fuente: [Plano oficial del Ayuntamiento](https://institucional.cadiz.es/area/documento/plano-de-lineas), documento rotulado vigente desde mayo de 2023. No se añadió comprobación automática de nuevas versiones.

## Verificación

- TypeScript, ESLint y `git diff --check`: correctos.
- Jest: 54 pruebas, 13 suites, PASS. Nuevas regresiones: GPS único al inicio, parada 1202 sin salto silencioso a otra cabecera, prioridad y servicios de 1123, estado naranja durante reintentos, recuperación al minuto, revelado de fila una sola vez y datos de las tablas.
- APK release instalado en emulator-5554, sin Metro.
- `python3 scripts/live-status-qa.py`: GPS al inicio en 1123, selección inicial de línea 1, cambio a línea 7 en la misma parada, recorrido ampliado con fila seleccionada visible y barra accesible, fallo de red con estimaciones históricas, recuperación automática sin pulsar refrescar y tablas nativas: PASS.
- Revisión visual de todas las capturas de `results.json`: PASS.

La parada 1123 mantiene el nombre «Avenida de Andalucía (Vuelta)» en los datos actuales y está compartida por 1, 2, 3 y 7. No se han cambiado nombres, coordenadas ni recorridos para esta entrega.

No se repitieron los 25 escenarios nativos históricos. Validación en Android emulado; no se ha realizado nueva aceptación en dispositivos físicos. Los informes anteriores se conservan.

APK SHA-256: `2b03aac9b69beee4a66c6130aab5ea2c5fb574d1c47d65015630a0e23b3dacd5`.
El script restaura la conectividad previa y detiene el GPS periódico para permitir Location → Set Location. Favoritos existentes preservados.
