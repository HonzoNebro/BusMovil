# Información y NFC — 29 de octubre de 2026

Nueva distribución: «Actualizar ubicación» junto a la parada; barra fija Saldo / Mapa / Información. Información ofrece tarifas, puntos de recarga, frecuencias y primeras/últimas salidas. Se reutilizan las tablas nativas y sus controles de zoom. Primeras/últimas salidas abre directamente su tabla.

Tarifas urbanas y de la tarjeta del Consorcio diferenciadas, con fecha de consulta, vigencia de las bonificaciones de 2026 y enlaces oficiales. Puntos de recarga: 69 direcciones distintas por tipo/dirección del municipio de Cádiz, extraídas del listado oficial del Consorcio, con búsqueda que admite omitir tildes. Datos incluidos en APK para consulta sin red; no hay sincronización automática ni se afirman horarios comerciales. Fuentes:
- https://tranviadecadizasanfernandoycarraca.es/tarifas
- https://tranviadecadizasanfernandoycarraca.es/tarifas-3
- https://siu.cmtbc.es/es/puntos_de_venta.php

NFC: módulo nativo propio Android, NFC opcional, modo lector limitado a actividad reanudada y desbloqueada. Se desactiva en segundo plano y en Mapa/Información. La tarjeta abre Saldo desde la pantalla principal; el botón Saldo también explica cómo consultar. Lee únicamente sector 9/bloque 37 del formato CTAN descrito públicamente y valida redundancia del value block antes de mostrar euros. No escribe, no registra ni envía UID/saldo. Sin servicios de fondo ni intent filters NFC. Cierre de conexiones, timeout y descarte de sesiones canceladas. Detalle y protocolo de prueba física: ../../nfc.md.

Verificación de código: typecheck, ESLint PASS; 68 pruebas / 17 suites PASS. Nuevas pruebas de integridad de bloques, escala de medio céntimo, pausa/reanudación y limpieza del lector, búsqueda de recarga y apertura directa de tabla de salidas. APK release compilado.

Evidencias de emulador en ./2026-10-29-informacion-y-nfc/. No se han instalado compilaciones en dispositivos físicos ni se ha intentado leer una tarjeta del usuario. **Compatibilidad NFC y exactitud del saldo pendientes de contraste con tarjeta y teléfono reales.** No se ha añadido backend ni proveedor de pago recurrente; los servicios públicos de mapas/rutas mantienen sus condiciones y límites anteriores.

Aceptación de interfaz en emulator-5554: PASS (6 comprobaciones): nueva barra y ubicación en tarjeta; cuatro apartados; precios separados por título; búsqueda «gerion» → Gerión; apertura directa de primeras/últimas salidas; aviso al abrir Saldo sin hardware NFC. Capturas de inicio e Información inspeccionadas visualmente. El arranque frío necesitó esperar a que finalizase la localización inicial. GPS periódico detenido al terminar, para permitir Location → Set Location.

SHA-256 APK: `57b55caa18dc5a88f9e4611447e758107e9a56973a0c18498fd475fa0fac987b`.
