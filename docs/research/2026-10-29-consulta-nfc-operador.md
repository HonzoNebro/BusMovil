# Consulta técnica preparada — no enviada

Asunto: Documentación para consulta NFC de saldo, solo lectura, en tarjetas del Consorcio de Transportes de la Bahía de Cádiz

Buenos días:

Estamos desarrollando una aplicación Android independiente de información de autobuses de Cádiz y queremos ofrecer consulta local del saldo de tarjetas de transporte del Consorcio, únicamente con la aplicación en primer plano. La función sería de solo lectura, sin recargas, modificación de tarjetas ni envío de su contenido a servidores.

En dos tarjetas descritas por su usuario como tarjetas del Consorcio, dos teléfonos Android detectan NfcA/MifareClassic, capacidad de 1024 bytes, 16 sectores, SAK 0x08 y ATQA 0x0400. La conexión se establece pero la autenticación del perfil público de lectura CTAN del sector 9 devuelve rechazo. No adjuntamos número de tarjeta, UID, saldo ni volcado de memoria.

¿Existe documentación pública, SDK o procedimiento de integración para consultar el saldo? En concreto:

1. ¿Qué perfiles/versiones de tarjeta tienen actualmente en circulación y cómo puede un tercero identificar el título sin leer datos personales?
2. ¿Qué acceso de solo lectura está previsto para una aplicación de terceros? ¿El perfil público CTAN sigue siendo aplicable o hay variantes y condiciones de integración?
3. ¿La renovación/migración de tarjetas afecta a la lectura NFC? ¿Hay una forma oficial de comprobar la generación o necesidad de sustitución sin desplazamiento presencial?
4. Si no se admite la lectura local por terceros, ¿existe una consulta oficial alternativa para el titular que pueda integrarse o enlazarse?

Agradecemos que nos indiquen el contacto técnico o proveedor al que dirigir esta consulta si no corresponde a este departamento.

Un saludo.

---

Canales oficiales para localizar el destinatario:
- Consorcio: https://cmtbc.es/ (Contacto / Oficina Virtual / Consultas).
- Solo si se confirma que es bonobús urbano en lugar de tarjeta CTAN: operador urbano https://tranviadecadizasanfernandoycarraca.es/puntos-de-informacion-y-atencion-al-usuario.

No se ha elegido un destinatario concreto, aportado identidad personal ni enviado este texto.
