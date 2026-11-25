# Accesos, información y recargas — 29/10/2026

## Cambios
- Búsqueda global por número, nombre sin tildes, línea y referencias incluidas en los nombres oficiales. Una parada física por identificador; nombres iguales conservan sus identificadores distintos.
- Favoritos accesibles desde el inicio, con resumen de llegadas y ficha de todas sus líneas. Estrella en la parada seleccionada; almacenamiento compartido con el mapa.
- El GPS automático inicial conserva visibles los accesos. Abrir una búsqueda o un favorito cancela un enfoque pendiente.
- Frecuencias y primeras/últimas salidas abren directamente su tabla desde Información, sin repetir pestañas.
- Español/inglés según el teléfono, con elección persistente en Información. Los nombres oficiales de calles, paradas y destinos se conservan.
- Recargas: redes urbana y Consorcio separadas, búsqueda por calle/establecimiento, actualización de ubicación, orden por distancia en línea recta y enlace de indicaciones a pie.

## Datos y límites
43 puntos urbanos: 14 con coordenadas contrastadas por coincidencia de dirección con la lista del Consorcio. Los 29 restantes conservan dirección, enlace de indicaciones y aviso de ubicación desconocida; se sitúan al final cuando se ordena por distancia.
69 puntos del Consorcio con sus coordenadas oficiales.
Solo se ha incorporado un horario publicado: oficina de calle El Bosque, 09:00–14:00; el operador no especifica los días. No se infieren aperturas en festivos ni estados abierto/cerrado.
Fuentes:
- https://tranviadecadizasanfernandoycarraca.es/puntos-de-venta-y-recarga-2
- https://tranviadecadizasanfernandoycarraca.es/puntos-de-informacion-y-atencion-al-usuario
- https://siu.cmtbc.es/es/puntos_de_venta.php

No se añade una API de pago. La búsqueda de lugares está limitada al catálogo de paradas y sus referencias; no es un buscador general de direcciones de la ciudad.

## Verificación
- TypeScript y ESLint: PASS.
- Jest: 79 pruebas, 21 suites, PASS.
- Gradle: testReleaseUnitTest y assembleRelease PASS; se conservan las seis pruebas del lector NFC.
- Emulador Android: búsqueda 1311, ficha Avenida Marconi con líneas 2/3; favorito previo 1118 conservado; acceso a su ficha; cambio inglés/español; tablas sin pestañas duplicadas; ambas redes de recarga y distancias.
- Capturas adjuntas. El contenido cartográfico WebView sigue sujeto a revisión visual, sin clasificar automáticamente REVIEW como fallo.

No se ha validado en un teléfono físico. La lectura NFC del saldo urbano sigue pendiente de la documentación del operador: esta entrega no resuelve el rechazo de autenticación del sector de saldo. El correo y seguimiento diario existentes no se duplican.
