# Consulta enviada — bonobús urbano de Cádiz

Envío confirmado por Gmail el 29 de octubre de 2026.
Mensaje/hilo: 1a188bab0903885d.
Seguimiento: diario a las 09:00 en este chat.
Automatización: seguimiento-diario-del-saldo-nfc-de-busmovil (activa).

Destinatario: administracion@tranviacadiz.com
Fuente oficial del contacto: https://tranviadecadizasanfernandoycarraca.es/puntos-de-informacion-y-atencion-al-usuario
Asunto: Integración de consulta NFC de saldo del bonobús urbano de Cádiz — acceso de lectura

Buenos días:

Estoy desarrollando BusMovil, una aplicación independiente de información de los autobuses urbanos de Cádiz, y quisiera integrar una consulta local del saldo del bonobús físico mediante NFC. Sería una función exclusivamente de lectura, con la aplicación en primer plano, sin recargas ni modificaciones de la tarjeta y sin transmitir su contenido a servidores.

Las tarjetas probadas llevan las identificaciones de Tranvía de Cádiz a San Fernando y Carraca, S.A. y del Ayuntamiento de Cádiz, y la dirección http://77.224.241.76/urbanos/.

La documentación pública de Metrodroid/FareBot describe el saldo del bonobús de Cádiz en el sector 4, bloque 0 (bloque absoluto 16). Proxmark3 publica una clave identificada para este abono cuya huella coincide con el identificador del sector 0 de Metrodroid. Al probar ese perfil, tanto un POCO F3 con Android 13 como un Mi MIX 2 con Android 15 detectan MIFARE Classic de 1024 bytes y 16 sectores, conectan y autentican correctamente el sector 0. Sin embargo, la autenticación del sector 4 con esa misma candidata se rechaza, de modo que aún no podemos leer el saldo.

¿Podrían indicarnos el procedimiento de integración adecuado para una aplicación de terceros?

- ¿Existe un SDK o documentación oficial para acceder al saldo de solo lectura?
- ¿Qué requisitos de acceso y condiciones debe cumplir una aplicación para leer el sector del saldo de las versiones de bonobús actualmente en circulación?
- ¿Hay un mecanismo documentado para identificar sus versiones, o una secuencia de autenticación específica que deba utilizarse?
- ¿La reactivación por caducidad publicada en su web el 29/01/2024 afecta únicamente a la recarga o también a la consulta del saldo por NFC?

No adjunto números de serie, UID, saldo, claves ni volcados de memoria. Si esta consulta corresponde a su proveedor de billetaje, agradecería que me indicaran el contacto técnico adecuado.

Muchas gracias.
