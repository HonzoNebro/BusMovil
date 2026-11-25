import { extraTranslations } from './extra';
import type { Language } from './Language';
export const englishTranslations: Record<string, string> = {
  'Amplía con dos dedos y desplaza con uno.':
    'Pinch with two fingers to zoom and drag with one.',
  'Otros transportes': 'Other transport',
  'Autobuses urbanos': 'City buses',
  'Cercanías y tranvía': 'Commuter rail and tram',

  'Plano oficial de Trambahía': 'Official Trambahía map',
  'Plano oficial de Cercanías': 'Official commuter rail map',
  'Ampliar plano oficial': 'Enlarge official map',
  'Toca el plano para ampliarlo. Documento original en español.':
    'Tap the map to enlarge it. Original document in Spanish.',
  'Volver al servicio ferroviario': 'Back to rail service',
  '‹ Volver': '‹ Back',
  'Reducir plano': 'Reduce map size',
  'Ampliar plano': 'Enlarge map',
  'Ajustar plano': 'Fit map',
  Ajustar: 'Fit',
  'Documento original en español.': 'Original document in Spanish.',
  'Consultar plano original ↗': 'View original map ↗',

  'Próximos trenes': 'Next trains',
  Cercanías: 'Commuter rail',
  Trambahía: 'Trambahía',
  'Trambahía · T1': 'Trambahía · T1',
  'Cercanías · C1 / C1a': 'Commuter rail · C1 / C1a',
  'Volver a Transportes Cádiz': 'Back to Transportes Cádiz',
  'Elegir estación': 'Choose station',
  Estación: 'Station',
  'Actualizar información ferroviaria': 'Refresh rail information',
  'En directo': 'Live',
  'Horario programado': 'Scheduled time',
  'Destino por confirmar': 'Destination unconfirmed',
  'Sin próximas llegadas en las próximas 3 horas.':
    'No arrivals in the next 3 hours.',
  'El catálogo de horarios ha caducado. Solo se muestran llegadas directas en tiempo real.':
    'The timetable catalogue has expired. Only direct live arrivals are shown.',
  'Sin datos recientes de llegadas. Se muestran horarios programados cuando están disponibles.':
    'No recent arrival data. Scheduled times are shown when available.',
  'Mapa ferroviario': 'Rail map',
  'Posición publicada por Renfe · actualización cada 20 segundos. Las posiciones anteriores aparecen atenuadas.':
    'Position published by Renfe · updated every 20 seconds. Older positions appear dimmed.',
  'Origen de los datos: Renfe Operadora · CC BY 4.0':
    'Data source: Renfe Operadora · CC BY 4.0',
  'Vigencia del catálogo:': 'Timetable validity:',
  'Buscar estación': 'Search stations',
  'Posición anterior': 'Previous position',
  'Ver llegadas': 'View arrivals',

  'Lunes–viernes': 'Monday–Friday',
  'Volver a Información y opciones': 'Back to Information and settings',
  'Información y opciones': 'Information and settings',
  'Consultar documento original en la web (en español) ↗':
    'View original document online (in Spanish) ↗',
  'Consultar documento original en la web (en español)':
    'View original document online (in Spanish)',
  'Línea 7: en periodo estival, sábados y domingos, las últimas salidas son a las 22:40 de Paseo Marítimo y a las 23:05 de Simón Bolívar, según la nota del documento.':
    'Line 7: on summer Saturdays and Sundays, the last departures are at 22:40 from Paseo Marítimo and 23:05 from Simón Bolívar, according to the document note.',
  'Lunes–sábado': 'Monday–Saturday',
  Domingo: 'Sunday',
  Sábado: 'Saturday',
  Laborable: 'Weekday',
  Desde: 'From',
  'Lector nfc-diag-3.': 'Reader nfc-diag-3.',
  'Si falla, mantén la tarjeta quieta y fuera de la cartera. Algunos teléfonos no admiten este tipo de tarjeta.':
    'If reading fails, hold your card still outside your wallet. Some phones do not support this card type.',
  'Consulta local: no se guarda ni se envía información de la tarjeta.':
    'Local check: card data is neither saved nor sent.',
  'También puedes acercar la tarjeta desde el inicio. Mantén Transportes Cádiz visible y el teléfono desbloqueado.':
    'You can also hold your card against the phone from the home screen. Keep Transportes Cádiz visible and your phone unlocked.',
  'Consulta las tarifas vigentes en Información.':
    'Check current fares in Information.',
  'Consultar tarifa oficial ↗': 'View official fare ↗',
  'Tarifas de referencia de 2026, válidas hasta el 31 de diciembre. Consultadas el 4 de noviembre de 2026. El perfil NFC no identifica bonificaciones personales.':
    '2026 reference fares, valid until 31 December. Checked on 4 November 2026. The NFC profile does not identify personal discounts.',
  '⌄ Sobre esta consulta': '⌄ About this check',
  '⌃ Sobre esta consulta': '⌃ About this check',
  'Sobre esta consulta': 'About this check',
  'Con transbordo interurbano: 0,27 €. Otros trayectos y títulos pueden tener tarifas distintas.':
    'With an interurban transfer: €0.27. Other journeys and card types may have different fares.',
  'Un transbordo a otra línea en 45 minutos.':
    'One transfer to another line within 45 minutes.',
  'Viaje urbano en Cádiz · sin transbordo':
    'Cádiz city journey · without a transfer',
  'Bonobús ordinario · tarifa de referencia':
    'Standard urban travel card · reference fare',
  'Precio por viaje': 'Fare per journey',
  'Acerca la tarjeta a la parte trasera del teléfono.':
    'Hold the card against the back of your phone.',
  'Consultar saldo': 'Check balance',
  'No se pudo cargar el mapa completo. Comprueba la conexión.':
    'The map could not load completely. Check your connection.',
  'Sin puntos localizados para esta búsqueda.':
    'No mapped points match this search.',
  'puntos sin ubicación disponible.': 'points without an available location.',

  'Mapa centrado en tu ubicación disponible.':
    'Map centred on your available location.',
  'Toca un punto del mapa para ver su información.':
    'Tap a point on the map to see its details.',
  'No se pudo cargar el mapa completo. Puedes elegir un punto por su nombre.':
    'The map could not load completely. You can choose a point by name.',
  'puntos sin coordenadas verificadas: puedes buscarlos por nombre y abrir su dirección en mapas.':
    'points without verified coordinates: search by name and open their address in maps.',
  'En línea recta': 'Straight-line distance',
  'Ruta a pie no calculada para esta distancia.':
    'Walking route not calculated for this distance.',
  'Ruta a pie no disponible.': 'Walking route unavailable.',
  'Cómo llegar': 'Directions',
  'Cerrar detalle': 'Close details',
  'Elegir punto por nombre': 'Choose a point by name',
  'Distancia en línea recta': 'Straight-line distance',
  'No se pudo abrir la aplicación de mapas o el enlace.':
    'Unable to open a maps app or the link.',

  'Autobuses urbanos de Cádiz · consultado el 29 de octubre de 2026. Bonificaciones publicadas para 2026; los importes pueden cambiar al finalizar su vigencia.':
    'Cádiz city buses · checked on 29 October 2026. Published discounts apply to 2026; fares may change after this period.',
  '0,42 € / viaje': '€0.42 / journey',
  '0,77 € / viaje urbano': '€0.77 / city journey',
  'Precio bonificado en 2026. Tarifa base publicada: 0,70 €. Un transbordo a otra línea en 45 minutos. Fianza de la tarjeta: 1,50 €.':
    'Discounted fare for 2026. Published base fare: €0.70. One transfer to another line within 45 minutes. Card deposit: €1.50.',
  'En Cádiz, sin transbordo a o desde un modo interurbano. Con ese transbordo: 0,27 €. No es el bonobús urbano ordinario. Los viajes metropolitanos tienen tarifas distintas según los saltos.':
    'In Cádiz, without a transfer to or from interurban transport. With that transfer: €0.27. This is a separate card from the city bus pass. Metropolitan fares vary by travel zones.',
  'Menores de 15 años: gratuito. Bonobús especial: 0,17 € por viaje. Tarjeta joven: 10 € al mes. Universitarios/FP: 15 € al mes. Sujetos a requisitos y bonificaciones de 2026. Mayores de 65: recarga anual de 5 €, según condiciones del operador.':
    'Under 15: free. Special bus pass: €0.17 per journey. Youth card: €10 per month. University/vocational students: €15 per month. Subject to eligibility and 2026 discounts. Over 65: €5 annual top-up, subject to operator conditions.',
  'Distancia en línea recta ·': 'Straight-line distance ·',
  'Cómo llegar ↗': 'Directions ↗',
  'No se pudo abrir el menú de compartir. Puedes seleccionar y copiar el texto del diagnóstico.':
    'Unable to open sharing. You can select and copy the diagnostic text.',

  Información: 'Information',
  '⌕ Buscar parada, número o lugar': '⌕ Search stop, number or place',
  'Seleccionar línea': 'Select line',
  '◎ Cerca de mí': '◎ Near me',
  'Usa tu ubicación para ver la distancia':
    'Use your location to see the distance',
  punto: 'point',
  puntos: 'points',
  'puntos sin ubicación precisa se muestran al final.':
    'points without verified coordinates appear last.',
  '09:00–14:00 · días no publicados': '09:00–14:00 · days not published',

  Líneas: 'Lines',
  Parada: 'Stop',
  Línea: 'Line',
  Saldo: 'Balance',
  Mapa: 'Map',
  'Mapa de paradas': 'Stop map',
  'Líneas y llegadas': 'Lines and arrivals',
  'PARADA SELECCIONADA ·': 'SELECTED STOP ·',
  'Usar mi ubicación': 'Use my location',
  'Actualizar ubicación': 'Update location',
  'Buscando…': 'Locating…',
  'Buscando ubicación…': 'Finding your location…',
  'Sugerida automáticamente por proximidad': 'Automatically suggested nearby',
  'Sugerida por proximidad para este sentido':
    'Suggested nearby for this direction',
  'Elegida en el mapa': 'Selected on the map',
  'Elegida en el recorrido': 'Selected on the route',
  'Selección inicial · usa tu ubicación para buscar la más cercana':
    'Initial selection · use your location to find the nearest stop',
  'Parada cercana': 'Nearby stop',
  'Ubicación aproximada': 'Approximate location',
  'Ubicación aproximada: la parada sugerida puede variar':
    'Approximate location: the suggested stop may vary',
  'Fecha de la ubicación aproximada:': 'Approximate location recorded:',
  '. Puede no coincidir con tu posición actual.':
    '. It may differ from your current position.',
  'Última actualización:': 'Last updated:',
  'Consultar saldo de la tarjeta': 'Check card balance',
  'Ver mapa de paradas': 'View stop map',
  'Información del autobús': 'Bus information',
  'Tus paradas': 'Your stops',
  'Tus paradas favoritas': 'Your favourite stops',
  'Selecciona alguna línea.': 'Select a line.',
  'Buscar parada, número o lugar': 'Search stop, number or place',
  'Buscar paradas': 'Search stops',
  'Cerrar búsqueda': 'Close search',
  'Sin coincidencias': 'No matches',
  'Busca por nombre, número, línea o referencia de la parada.':
    'Search by stop name, number, line or a known nearby landmark.',
  'Guarda una parada con la estrella para tenerla aquí.':
    'Save a stop with the star to find it here.',
  'Ver todas': 'View all',
  'Mostrar menos': 'Show less',
  'Guardar en favoritos': 'Save to favourites',
  'Quitar de favoritos': 'Remove from favourites',
  'Paradas favoritas': 'Favourite stops',
  'Cargando favoritos…': 'Loading favourites…',
  '☆ Guardar': '☆ Save',
  '★ Guardada': '★ Saved',
  'Próximas llegadas': 'Next arrivals',
  'Actualizar llegadas': 'Refresh arrivals',
  'Actualizando…': 'Updating…',
  '↻ Actualizar': '↻ Refresh',
  Llegando: 'Due',
  'En directo ↻': 'Live ↻',
  'Sin llegadas ↻': 'No arrivals ↻',
  'Sin actualizar ↻': 'Outdated ↻',
  'Actualizando ↻': 'Updating ↻',
  'LLEGADAS A ESTA PARADA': 'ARRIVALS AT THIS STOP',
  'Sentido:': 'Towards:',
  'Datos anteriores': 'Previous data',
  Después: 'Later',
  Recorrido: 'Route',
  'Ver recorrido →': 'View route →',
  'Ver todas las paradas': 'View all stops',
  'Mostrar menos paradas': 'Show fewer stops',
  'También pasan por esta parada': 'Other lines at this stop',
  'También pasa': 'Also serves this stop',
  'Primer servicio a las': 'First service at',
  'Selecciona una línea': 'Select a line',
  'Elige el sentido de tu viaje': 'Choose your direction',
  'Fin de este sentido. Puedes cambiar el sentido del recorrido.':
    'End of this direction. You can choose the other direction.',
  'Reintento automático cada minuto.': 'Automatically retries every minute.',
  'Información sin actualizar.': 'Information is out of date.',
  'Reintentar ubicación': 'Retry location',
  'Buscando tu ubicación…': 'Finding your location…',
  'Buscando la parada más cercana para este sentido…':
    'Finding the nearest stop in this direction…',
  'No se pudo obtener una ubicación para buscar una parada de este sentido. Activa la ubicación y vuelve a intentarlo.':
    'Could not locate you to find a stop in this direction. Enable location and try again.',
  'Desde tu ubicación de las': 'From your location recorded at',
  'Ruta estimada · Valhalla / © OpenStreetMap · Corregir mapa ↗':
    'Estimated route · Valhalla / © OpenStreetMap · Fix the map ↗',
  Tarifas: 'Fares',
  'Puntos de recarga': 'Top-up points',
  Frecuencias: 'Frequencies',
  'Primeras y últimas salidas': 'First and last departures',
  'Horarios y frecuencias': 'Timetables and frequencies',
  'Billete, bonobús y tarjeta del Consorcio':
    'Tickets, urban travel card and Consortium card',
  'Intervalos de paso por línea': 'Service intervals by line',
  'Horarios desde las cabeceras': 'Departure times at terminals',
  'Bonobús urbano · Cádiz': 'Urban travel card · Cádiz',
  'Bonobús urbano': 'Urban travel card',
  'Tarjeta del Consorcio': 'Consortium card',
  'Billete ordinario': 'Single ticket',
  'Bonobús urbano ordinario': 'Standard urban travel card',
  'Otros títulos urbanos': 'Other urban tickets',
  'Un viaje. Se compra en el autobús.': 'One journey. Buy on the bus.',
  'Tarifas urbanas oficiales ↗': 'Official urban fares ↗',
  'Tarifas oficiales de la tarjeta del Consorcio ↗':
    'Official Consortium card fares ↗',
  'Consultar listado oficial actualizado ↗': 'Check the latest official list ↗',
  'No se pudo abrir la página oficial.': 'Could not open the official page.',
  'No se pudo abrir la página oficial. Comprueba la conexión.':
    'Could not open the official page. Check your connection.',
  'Desliza para consultar la tabla.': 'Swipe to explore the table.',
  'Ampliar tabla': 'Enlarge table',
  'Reducir tabla': 'Reduce table size',
  'Línea · Día': 'Line · Day',
  'Consultar documento original en la web ↗':
    'View the original document online ↗',
  'Información de consulta. Las próximas llegadas de la app son estimaciones en tiempo real y se muestran por separado.':
    'Reference information. Live arrival estimates are shown separately.',
  'Ayuntamiento de Cádiz · documento vigente desde mayo de 2023. Incorporado el 29 de octubre de 2026.':
    'Cádiz City Council · document effective from May 2023. Added on 29 October 2026.',
  'Intervalos orientativos en minutos. La escala horaria conserva las franjas del gráfico oficial. * Solo julio y agosto.':
    'Approximate intervals in minutes. Time bands follow the official chart. * July and August only.',
  'Salidas desde cada cabecera. Las últimas salidas después de medianoche corresponden al final de la jornada de servicio.':
    'Departures from each terminal. Last departures after midnight belong to the end of the service day.',
  Laborables: 'Weekdays',
  Sábados: 'Saturdays',
  'Domingos y festivos': 'Sundays and public holidays',
  Salida: 'Departure',
  Primera: 'First',
  Última: 'Last',
  'Buscar punto de recarga': 'Search top-up points',
  'Buscar por calle o establecimiento…': 'Search by street or business…',
  'Cerca de mí': 'Near me',
  'Buscando puntos cercanos…': 'Finding nearby points…',
  'Ver en Maps': 'View in Maps',
  'Horario no disponible': 'Opening hours unavailable',
  'Horario publicado por el operador': 'Hours published by the operator',
  'Horario orientativo de OpenStreetMap': 'Indicative OpenStreetMap hours',
  'Sin ubicación precisa': 'Precise location unavailable',
  'Sin resultados': 'No results',
  'Puntos del bonobús urbano y del Consorcio diferenciados.':
    'Urban and Consortium card top-up points are listed separately.',
  'Ordenados por cercanía con tu ubicación disponible.':
    'Sorted by distance from your available location.',
  'Activa la ubicación para ordenar por cercanía. También puedes buscar por calle.':
    'Enable location to sort by distance, or search by street.',
  'No se pudo obtener tu ubicación. Puedes seguir buscando por calle.':
    'Could not obtain your location. You can still search by street.',
  'Listado oficial consultado el 29 de octubre de 2026.':
    'Official list checked on 29 October 2026.',
  'Los horarios pueden cambiar, especialmente en festivos.':
    'Opening hours may change, especially on public holidays.',
  Idioma: 'Language',
  'Seguir el teléfono': 'Use phone language',
  Español: 'Español',
  English: 'English',
  'No se pudo recuperar el idioma.': 'Could not restore your language setting.',
  'No se pudo guardar el idioma.': 'Could not save your language setting.',
  'Saldo de tu tarjeta': 'Your card balance',
  'Abrir ajustes NFC': 'Open NFC settings',
  'Activa NFC en los ajustes del teléfono y vuelve a la aplicación.':
    'Enable NFC in your phone settings, then return to the app.',
  'Leyendo tarjeta…': 'Reading card…',
  'Saldo leído en la tarjeta': 'Balance read from the card',
  'Lectura:': 'Read at:',
  'Ver diagnóstico NFC': 'View NFC diagnostic',
  'Ocultar diagnóstico NFC': 'Hide NFC diagnostic',
  'Compartir diagnóstico': 'Share diagnostic',
  'Compartir diagnóstico NFC': 'Share NFC diagnostic',
  'Compatibilidad en pruebas · lector nfc-diag-3.':
    'Compatibility under testing · reader nfc-diag-3.',
  'Este dispositivo no dispone de un lector NFC compatible. La lectura necesita un teléfono Android físico con NFC.':
    'This device has no compatible NFC reader. A physical NFC-enabled Android phone is required.',
  'Acerca tu tarjeta a la parte trasera del teléfono y mantenla quieta hasta terminar la lectura.':
    'Hold your card against the back of your phone until the reading is complete.',
  'También puedes acercar la tarjeta desde la pantalla principal, sin pulsar Saldo. El lector solo funciona con Transportes Cádiz visible y el teléfono desbloqueado.':
    'You can also tap your card from the main screen without opening Balance. The reader works only while Transportes Cádiz is visible and the phone is unlocked.',
  'Consulta local, sin conexión a Internet. No se guarda ni se envía información de la tarjeta. Algunos teléfonos con NFC no admiten este tipo de tarjeta.':
    'Read locally without an internet connection. Card information is neither saved nor sent. Some NFC phones cannot read this card type.',
  'No se pudo actualizar esta parada.': 'Could not refresh this stop.',
  'Los datos anteriores conservan su hora de consulta.':
    'Previous data retain their original retrieval time.',
  'Comprueba la conexión y vuelve a actualizar.':
    'Check your connection and refresh again.',
  'Consultando llegadas…': 'Checking arrivals…',
  'Sin información actualizada': 'No up-to-date information',
  'Sin próximas llegadas para esta parada.':
    'No upcoming arrivals for this stop.',
  'Consulta:': 'Retrieved:',
  '. Tiempos estimados.': '. Estimated times.',
  '☰ Opciones': '☰ Options',
  'Opciones del mapa': 'Map options',
  'Líneas visibles': 'Visible lines',
  'líneas visibles': 'visible lines',
  Ninguna: 'None',
  Todas: 'All',
  'Guarda una parada desde su ficha para encontrarla aquí.':
    'Save a stop from its details to find it here.',
  'No hay coordenadas disponibles': 'Coordinates unavailable',
  'Aún no tenemos la localización GPS de estas paradas. Añádela para verlas en el mapa.':
    'GPS locations are unavailable for these stops.',
  'Volver a Información': 'Back to Information',
  'Volver al mapa': 'Back to map',
  'Volver a Líneas y llegadas': 'Back to Lines and arrivals',
  'Volver a la parada': 'Back to stop',
  Seleccionada: 'Selected'
};
export function translate(source: string, language: Language): string {
  if (language === 'es') return source;
  const normalized = source.replace(/\s+/g, ' ').trim();
  const dictionary =
    language === 'fr' || language === 'pt'
      ? extraTranslations[language]
      : englishTranslations;
  const exact = dictionary[normalized];
  if (exact)
    return (
      (source.match(/^\s*/)?.[0] ?? '') +
      exact +
      (source.match(/\s*$/)?.[0] ?? '')
    );
  const dynamic = source
    .replace(/^‹ Líneas y llegadas$/, '‹ Lines and arrivals')
    .replace(/^A /, 'To ')
    .replace(/^Sentido: /, 'Towards: ')
    .replace(/^Parada /, 'Stop ')
    .replace(/^Línea /, 'Line ')
    .replace(/^Mostrar línea /, 'Show line ')
    .replace(/^Ver línea (\d+) en esta parada$/, 'View line $1 at this stop')
    .replace(/^Favorita /, 'Favourite ')
    .replace(/^Ubicación de la parada /, 'Stop location ')
    .replace(/^Dato anterior: /, 'Previous data: ')
    .replace(/consulta /g, 'retrieved ')
    .replace(/Menos de 1 min a pie/, 'Less than 1 min walk')
    .replace(/ min a pie/, ' min walk')
    .replace(
      /en línea recta · ruta a pie no disponible/,
      'straight-line · walking route unavailable'
    )
    .replace(/ · Seleccionada/, ' · Selected')
    .replace(/ · Llegadas/, ' · Arrivals')
    .replace(
      /^Tarjeta del Consorcio de Transportes de la Bahía de Cádiz$/,
      'Bay of Cádiz Transport Consortium card'
    );
  if (language === 'en') return dynamic;
  const words =
    language === 'fr'
      ? {
          to: 'Vers ',
          towards: 'Direction : ',
          stop: 'Arrêt ',
          line: 'Ligne ',
          show: 'Afficher la ligne ',
          fav: 'Favori ',
          location: "Position de l'arrêt ",
          previous: 'Donnée précédente : ',
          retrieved: 'consulté ',
          less: 'Moins de 1 min à pied',
          walk: ' min à pied',
          selected: ' · Sélectionné',
          arrivals: ' · Arrivées',
          view: 'Voir la ligne ',
          at: ' à cet arrêt',
          straight: 'à vol d’oiseau · itinéraire à pied indisponible'
        }
      : {
          to: 'Para ',
          towards: 'Sentido: ',
          stop: 'Paragem ',
          line: 'Linha ',
          show: 'Mostrar linha ',
          fav: 'Favorita ',
          location: 'Localização da paragem ',
          previous: 'Dado anterior: ',
          retrieved: 'consulta ',
          less: 'Menos de 1 min a pé',
          walk: ' min a pé',
          selected: ' · Selecionada',
          arrivals: ' · Chegadas',
          view: 'Ver linha ',
          at: ' nesta paragem',
          straight: 'em linha reta · percurso a pé indisponível'
        };
  return dynamic
    .replace(
      /^‹ Lines and arrivals$/,
      language === 'fr' ? '‹ Lignes et arrivées' : '‹ Linhas e chegadas'
    )
    .replace(/^To /, words.to)
    .replace(/^Towards: /, words.towards)
    .replace(/^Stop /, words.stop)
    .replace(/^Line /, words.line)
    .replace(/^Show line /, words.show)
    .replace(/^Favourite /, words.fav)
    .replace(/^Stop location /, words.location)
    .replace(/^Previous data: /, words.previous)
    .replace(/retrieved /g, words.retrieved)
    .replace(/Less than 1 min walk/, words.less)
    .replace(/ min walk/, words.walk)
    .replace(/ · Selected/, words.selected)
    .replace(/ · Arrivals/, words.arrivals)
    .replace(
      /^View line (\d+) at this stop$/,
      (_, id) => words.view + id + words.at
    )
    .replace(/straight-line · walking route unavailable/, words.straight);
}
