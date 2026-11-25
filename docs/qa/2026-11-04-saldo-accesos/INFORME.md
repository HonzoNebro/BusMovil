# Saldo y accesos — 04/11/2026

- Antes de leer: «Consultar saldo», símbolo de lectura y una instrucción corta. Durante la lectura se muestra su estado.
- Tras leer: tipo de tarjeta, saldo destacado, fecha de lectura y tarjeta compacta con precio de referencia. Se ocultan las instrucciones de acercar tarjeta.
- Ayuda, privacidad, origen/vigencia de tarifas y revisión del lector quedan dentro de «Sobre esta consulta». El diagnóstico está disponible directamente ante un error; para lecturas correctas se accede desde la información ampliada.
- El perfil NFC no identifica descuentos o títulos personales. El precio urbano indica «Bonobús ordinario · tarifa de referencia». CTAN indica «Viaje urbano en Cádiz · sin transbordo» y detalla la tarifa con transbordo dentro del desplegable.
- Tarifas contrastadas el 04/11/2026: bonobús ordinario 0,42 € y CTAN urbano Cádiz sin transbordo 0,77 €, con transbordo interurbano 0,27 €. La referencia se oculta automáticamente fuera de 2026; no se extrapolan bonificaciones futuras.
- Fuentes: https://tranviadecadizasanfernandoycarraca.es/tarifas y https://siu.cmtbc.es/es/tarifa.php
- Favoritos: borde visible, estrella, indicador › y respuesta visual al pulsar. Accesos a Información, incluidas frecuencias y primeras/últimas salidas: icono, borde y flecha ›. No se añaden accesos nuevos en el inicio.
- TypeScript, ESLint y 86 pruebas Jest PASS. Cobertura adicional: precio correcto por perfil, ausencia de precio para perfiles desconocidos o fuera de vigencia y transición de instrucciones a saldo con ayuda plegada.
- Se conservan las seis pruebas nativas NFC. El código de lectura física no se modifica.
- Revisión visual Android pendiente: /dev/kvm no está disponible en este entorno; no se instala automáticamente en el teléfono.
