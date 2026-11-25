# Transportes Cádiz — identidad y viabilidad ferroviaria

## Entrega
- Todas/Ninguna recupera radio de 12, como los selectores de línea, manteniendo la corrección del contenedor exterior que recortaba una esquina.
- Nombre instalado y cabecera: Transportes Cádiz.
- Icono Android adaptativo, legado y monocromo basado en el símbolo frontal del transporte que ya utilizaba la aplicación. Fuente SVG en src/assets/transportes-cadiz-icon.svg.
- Actualizados los textos de ayuda y diagnóstico en los cuatro idiomas. El identificador interno React Native conserva BusMovil.
- El applicationId sigue siendo com.honzonebro.busmovil para conservar actualización y datos. Pendiente elegir el momento de pasar al propuesto app.transportescadiz; Android tratará ese identificador como aplicación independiente. No se migran ni borran favoritos automáticamente.
- TypeScript, ESLint y 91 pruebas Jest PASS. Se conservan seis pruebas nativas NFC. assembleRelease PASS.
- Revisión visual Android pendiente por ausencia de /dev/kvm. Se ha renderizado y revisado el icono vectorial.

## Ferrocarril
Hay datos oficiales en directo de Renfe para C1, C1a y Trambahía T1. Se han descargado posiciones y actualizaciones de viajes y contrastado los IDs con el GTFS estático del núcleo de Cádiz.
Ver ../../research/2026-11-04-renfe-trambahia.md para fuentes, ejemplos y límites. Todavía no se integran modos ferroviarios en esta entrega.

Transportes Cádiz es la propuesta de nombre descriptivo. Alternativa de marca: Cádiz Conecta. No se afirma disponibilidad de marca o posicionamiento en tiendas.
