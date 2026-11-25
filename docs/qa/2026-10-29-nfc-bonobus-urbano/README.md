# NFC: perfil bonobús urbano de Cádiz (nfc-diag-2)

La búsqueda ampliada encontró una candidata de lectura publicada explícitamente para Bonobus, Cadiz en Proxmark3. La comprobación de su huella coincide con la identificación del abono en Metrodroid. Se implementa un perfil específico de solo lectura; no se incorpora el diccionario ni se prueban claves por tanteo.

- Identidad: autenticación de sector 0. Saldo: autenticar sector 4 y leer bloque 16.
- Saldo urbano interpretado en céntimos; CTAN mantiene escala independiente de medio céntimo y sector/bloque originales.
- Si se reconoce el perfil urbano pero falla el acceso al saldo, error específico URBAN_BALANCE_AUTH_REJECTED. No se utiliza otro perfil para inventar un importe.
- Dos lecturas idénticas, tamaño y metadatos de autenticación obligatorios para aceptar saldo urbano. Sin número de serie ni historial.
- Conserva modo de primer plano, cierre/cancelación al pausar, timeout y diagnóstico sin contenido de tarjeta. Pantalla Saldo distingue el título reconocido y muestra que la compatibilidad está en pruebas.

## Verificación

- TypeScript y ESLint PASS.
- Jest: **74 pruebas, 19 suites PASS**.
- JVM `testReleaseUnitTest`: **6 pruebas PASS**, sin fallos ni errores: huella pública y ruta urbana; CTAN con reconexión; rechazo de saldo tras identidad urbana; tarjeta desconocida; dos lecturas distintas; cancelación tras primera lectura.
- `assembleRelease`: PASS.
- Pruebas usan datos sintéticos/lector simulado. No se ha leído una tarjeta real ni se ha confirmado el saldo físico. La misma clave de identidad podría no dar acceso al saldo en una variante: el código distingue ese caso.
- No se ha instalado nada en el dispositivo físico conectado por ADB. El emulador estaba apagado; no se presenta ninguna prueba emulada como lectura NFC física.

## Prueba física siguiente

Instalar APK sobre la versión anterior, abrir Saldo y acercar el bonobús. Si muestra importe, contrastarlo con un saldo conocido. Si falla, copiar el diagnóstico que debe indicar `readerRevision: nfc-diag-2`. `urbanIdentityAuthenticated` y `urbanBalanceAuthenticated` distinguen si la tarjeta reconoce el perfil publicado y si permite acceder al sector del saldo. Probar bloqueo/segundo plano después de confirmar la lectura.

Fuentes y búsqueda completa: ../../research/2026-10-29-nfc-compatibilidad.md. La consulta al operador permanece sin enviar al haberse encontrado una vía concreta de implementación.
