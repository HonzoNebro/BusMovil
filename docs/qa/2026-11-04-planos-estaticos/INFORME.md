# Planos estáticos y botones Volver — 04/11/2026

- Reemplazados los mapas ferroviarios interactivos por imágenes locales de los planos oficiales de Renfe y Trambahía.
- Miniatura pulsable, visor a pantalla completa con ampliar/reducir/ajustar y desplazamiento horizontal/vertical. Sin teselas ni JavaScript cartográfico para estos planos.
- Conservados los documentos completos, sus créditos y un enlace al original. Se indica que el documento está en español.
- Los próximos trenes y sus estimaciones continúan actualizándose. Estas pantallas dejan de solicitar posiciones de vehículos.
- Botones de volver de Información y opciones y tablas: borde, fondo, espacio interior y esquinas redondeadas.
- Textos del visor en español, inglés, francés y portugués.
- TypeScript y ESLint PASS; 104 pruebas Jest PASS en 28 suites. Incluyen ampliación/ajuste/cierre del visor y ausencia de consultas de posiciones al utilizar plano estático.
- Se conservan seis pruebas JVM del lector NFC; assembleRelease y testReleaseUnitTest.
- Los PNG oficiales se han renderizado y revisado visualmente completos. Revisión visual nativa Android pendiente por falta de /dev/kvm; no se instala automáticamente en el teléfono.
- La vigencia del catálogo de horarios y su renovación automática mantienen los límites indicados en el informe ferroviario anterior.

Fuentes:
https://www.renfe.com/es/es/cercanias/cercanias-cadiz/mapas
https://www.renfe.com/content/dam/renfe-viajeros/cercanias/mapas/pdf/mapa_cadiz_cercanias_abril2025-b.pdf
https://trambahia.es/sites/default/files/Trambahia_mapa.pdf
