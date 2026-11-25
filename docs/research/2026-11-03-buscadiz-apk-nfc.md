# Análisis local del lector NFC de BusCádiz — 03/11/2026

APK facilitado por el usuario desde su instalación de Google Play:
- Paquete com.kodomeka.buscadiz, versión 1.0.59 (181).
- SHA-256 base.apk: 57394ca6e9ed2d6209f59de1fa899dd3798cd20e4d6fa89a5a3b74260929bb51.
- Inspección estática local con JADX 1.5.6. El APK completo produce 765 errores de descompilación; los métodos concretos descritos abajo sí presentan cuerpos completos y coherentes. No se ejecutó ni modificó BusCádiz ni se accedió al teléfono o a tarjetas.

## Resultado
En la clase ofuscada mi2, método b(), el lector conecta a MifareClassic y llama directamente a authenticateSectorWithKeyB para el sector 4 con una constante distinta de la candidata pública de sector 0 que utiliza BusMovil. No requiere autenticar previamente el sector 0.
Después lee los cuatro bloques del sector a partir de sectorToBlock(4), es decir, desde el bloque absoluto 16.

En ng2.run(), caso 3, el receptor toma los cuatro primeros bytes del primer bloque, invierte su orden, los interpreta como entero de 32 bits y presenta dos cifras decimales de euro. Es equivalente a int32 little-endian en céntimos, consistente con el decodificador urbano independiente de BusMovil.

En ComposeMainActivity.j(Intent), el flujo TECH_DISCOVERED detecta MifareClassic e inicia ese lector. En el flujo examinado, la operación de lectura y decodificación es local, sin solicitud de saldo a un servidor.

## Comparación con BusMovil
TransitNfcPackage.kt implementa ReadOnlyTransitCard.authenticate mediante authenticateSectorWithKeyA. TransitProfileReader intenta el sector 4 con la misma candidata que el sector 0. Son dos diferencias concretas frente al APK analizado: tipo de autenticación y valor de candidata.

Esto explica un fallo en nuestro perfil urbano, pero no demuestra que su corrección baste para las tarjetas del usuario. BusCádiz tampoco pudo leerlas, según sus pruebas. Podría haber distintas versiones de tarjeta o condiciones físicas de lectura.

## Siguiente paso técnico
Implementar de forma independiente una distinción explícita Key A / Key B en el adaptador de lectura y un perfil urbano de saldo separado del de identidad. Mantener el perfil CTAN, la lectura exclusivamente en primer plano, las dos lecturas consistentes, la cancelación y el diagnóstico sin UID, claves ni memoria. No copiar el recorrido de lectura de cuatro bloques: el saldo solo necesita el 16.
Validar primero mediante simulaciones y regresiones y, después, con las tarjetas físicas. No interpretar una autenticación rechazada como tarjeta averiada o caducada.
Este análisis no modifica la aplicación ni da por resuelto el saldo NFC.
