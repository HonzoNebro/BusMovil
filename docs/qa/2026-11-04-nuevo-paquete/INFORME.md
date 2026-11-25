# Identificador Android nuevo — 04/11/2026
- applicationId y namespace: app.transportescadiz.
- Clases de aplicación, actividad y lector NFC trasladadas a java/app/transportescadiz y declaraciones Kotlin actualizadas.
- Pruebas nativas trasladadas al mismo namespace. Actualizados comandos de los scripts de emulador y QA y referencia principal de README.
- Nombre visible: Transportes Cádiz. Se conserva el icono de transporte y las esquinas redondeadas.
- Android lo instala como una aplicación independiente. La instalación anterior conserva sus datos; no se migran ni borran automáticamente favoritos o preferencias. Esta decisión fue confirmada por el usuario.
- TypeScript y ESLint PASS. 91 pruebas Jest PASS. Seis pruebas JVM NFC PASS bajo app.transportescadiz.
- assembleRelease PASS. Metadatos del APK verificados: paquete app.transportescadiz y actividad app.transportescadiz.MainActivity.
- Revisión visual en Android pendiente: entorno sin /dev/kvm. No se ha instalado en el teléfono físico.
- La integración de Cercanías/Trambahía sigue pendiente: esta entrega cambia el identificador, no incorpora nuevos modos.
