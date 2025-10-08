const BASE_URL = process.env.EXPO_PUBLIC_PROXY_URL ?? 'http://77.224.241.76/urbanos';

const STOP_LABELS: Record<string, string> = {
  '1101': 'Plaza España',
  '1102': 'Avenida del Puerto',
  '1103': 'Puertas de Tierra',
  '1104': 'Avenida de Andalucía',
  '1105': 'Comisaría - Avenida de Andalucía 45',
  '1106': 'Plaza Asdrúbal - Mercado Virgen del Rosario',
  '1107': 'San Felipe',
  '1108': 'San José',
  '1109': 'Residencia - Hospital Puerta del Mar',
  '1110': 'Balneario - Glorieta Ana Orantes',
  '1111': 'Estadio',
  '1112': 'Telegrafía',
  '1113': 'Cortadura (Ida)',
  '1114': 'Cortadura (Vuelta)',
  '1115': 'Telegrafía',
  '1116': 'Estadio',
  '1117': 'Balneario - Glorieta Ana Orantes',
  '1118': 'Residencia - Hospital Puerta del Mar',
  '1119': 'San José',
  '1120': 'San Felipe',
  '1121': 'Plaza Asdrúbal - Mercado Virgen del Rosario',
  '1122': 'Comisaría - Avenida de Andalucía 45',
  '1123': 'Avenida de Andalucía',
  '1124': 'Puertas de Tierra',
  '1125': 'Renfe - Cuesta de Las Calesas',
  '1126': 'Avenida del Puerto',
  '1201': 'Plaza España',
  '1202': 'República Argentina',
  '1203': 'Alameda Clara Campoamor',
  '1204': 'Alameda Hermanas Carvia Bernal',
  '1205': 'Parque Genovés',
  '1206': 'Hotel Atlántico',
  '1207': 'Hospital Mora - Playa La Caleta',
  '1208': 'San Félix',
  '1209': 'Sagasta',
  '1210': 'Mercado Central',
  '1211': 'Mirandilla - Teatro Romano',
  '1212': 'Puertas de Tierra',
  '1213': 'Acacias',
  '1214': 'Brunete',
  '1215': 'Ciudad de Santander',
  '1216': 'Vicente Aleixandre',
  '1217': 'Guillén Moreno',
  '1218': 'Avenida Portugal',
  '1219': 'Trille',
  '1220': 'Santo Tomás',
  '1221': 'Avenida Marconi',
  '1222': 'Asociación de Vecinos Puntales',
  '1223': 'Barriada Loreto',
  '1224': 'Asociación de Vecinos Puntales',
  '1225': 'Avenida Lacave',
  '1226': 'Alcalde Blazquez',
  '1227': 'Trille',
  '1228': 'Avenida Portugal',
  '1229': 'Guillén Moreno',
  '1230': 'Cibeles',
  '1231': 'Tolosa Latour 1',
  '1232': 'Tolosa Latour 2',
  '1233': 'Juan Ramón Jimenez',
  '1234': 'Puertas de Tierra',
  '1235': 'Mirandilla - Teatro Romano',
  '1236': 'Catedral',
  '1237': 'Mercado Central',
  '1238': 'Sagasta',
  '1239': 'San Félix',
  '1240': 'Hospital Mora - Playa La Caleta',
  '1241': 'Hotel Atlántico',
  '1242': 'Parque Genovés',
  '1243': 'Alameda Hermanas Carvia Bernal',
  '1244': 'Alameda Clara Campoamor',
  '1245': 'República Argentina',
  '1301': 'Plaza España',
  '1302': 'San Severiano',
  '1303': 'Santo Domingo',
  '1304': 'Brigadier Tofino',
  '1305': 'Federico Godoy',
  '1306': 'Sotillo',
  '1307': 'Avenida Guadalete',
  '1308': 'Avenida Lacave',
  '1309': 'Avenida Marconi',
  '1310': 'Puntales (Avenida de La Ilustración)',
  '1311': 'Avenida Marconi',
  '1312': 'Avenida Guadalete',
  '1313': 'Sotillo',
  '1314': 'Federico Godoy',
  '1315': 'Brigadier Tofino',
  '1316': 'Santo Domingo',
  '1317': 'San Severiano',
  '1318': 'Avenida de La Ilustración',
  '1319': 'Avenida de La Ilustración',
  '1501': 'Plaza España',
  '1502': 'Avenida del Puerto',
  '1503': 'Plaza Sevilla',
  '1504': 'Dique - Estación de Autobuses',
  '1505': 'Avenida de Las Cortes',
  '1506': 'Centro Comercial',
  '1507': 'Avenida de Huelva',
  '1508': 'La Laguna 1',
  '1509': 'La Laguna 2',
  '1510': 'Estadio',
  '1511': 'Jimena de La Frontera',
  '1512': 'Ronda de Vigilancia 1',
  '1513': 'Ronda de Vigilancia 2',
  '1514': 'Club Deportivo Elcano',
  '1515': 'Avenida Profesora Isabel Azcarate Ristori',
  '1516': 'Zona Franca',
  '1517': 'Avenida Profesora Isabel Azcarate Ristori',
  '1518': 'Algeciras',
  '1519': 'Glorieta Zona Franca',
  '1520': 'Barriada Loreto',
  '1521': 'Cerro del Moro',
  '1522': 'Avenida de Huelva',
  '1523': 'Centro Comercial',
  '1524': 'Avenida de Las Cortes',
  '1525': 'Dique - Estación de Autobuses',
  '1526': 'Plaza Sevilla',
  '1707': 'Simón Bolívar',
  '1708': 'Mirador - Playa de Las Mujeres',
  '1709': 'Comisaría',
  '1710': 'Plaza Asdrubal',
  '1711': 'Instituto Drago',
  '1712': 'Avenida Amilcar Barca 31',
  '1713': 'Glorieta Ana Orantes',
  '1901': 'Cortadura (Prolongación)',
  '9905': 'Centro Educativo Cortadura',
};

const STOP_COORDINATES: Partial<Record<string, { latitude: number; longitude: number }>> = {
  '1101': { latitude: 36.533504, longitude: -6.295246 },
  '1102': { latitude: 36.52925, longitude: -6.28974 },
  '1103': { latitude: 36.52716, longitude: -6.28875 },
  '1104': { latitude: 36.52439, longitude: -6.28711 },
  '1105': { latitude: 36.52097, longitude: -6.28517 },
  '1106': { latitude: 36.51781, longitude: -6.28335 },
  '1107': { latitude: 36.51556, longitude: -6.28210 },
  '1108': { latitude: 36.51231, longitude: -6.28024 },
  '1109': { latitude: 36.50920, longitude: -6.27847 },
  '1110': { latitude: 36.50644, longitude: -6.27694 },
  '1111': { latitude: null, longitude: null },
  '1112': { latitude: 36.50222, longitude: -6.27444 },
  '1113': { latitude: null, longitude: null },
  '1114': { latitude: 36.497950, longitude: -6.271970 },
  '1115': { latitude: null, longitude: null },
  '1116': { latitude: null, longitude: null },
  '1117': { latitude: 36.528847, longitude: -6.299043 },
  '1118': { latitude: null, longitude: null },
  '1119': { latitude: null, longitude: null },
  '1120': { latitude: null, longitude: null },
  '1121': { latitude: null, longitude: null },
  '1122': { latitude: null, longitude: null },
  '1123': { latitude: null, longitude: null },
  '1124': { latitude: null, longitude: null },
  '1125': { latitude: null, longitude: null },
  '1126': { latitude: null, longitude: null },
  '1201': { latitude: 36.531921, longitude: -6.291874 },
  '1202': { latitude: null, longitude: null },
  '1203': { latitude: null, longitude: null },
  '1204': { latitude: null, longitude: null },
  '1205': { latitude: null, longitude: null },
  '1206': { latitude: null, longitude: null },
  '1207': { latitude: null, longitude: null },
  '1208': { latitude: null, longitude: null },
  '1209': { latitude: null, longitude: null },
  '1210': { latitude: null, longitude: null },
  '1211': { latitude: null, longitude: null },
  '1212': { latitude: null, longitude: null },
  '1213': { latitude: null, longitude: null },
  '1214': { latitude: null, longitude: null },
  '1215': { latitude: null, longitude: null },
  '1216': { latitude: null, longitude: null },
  '1217': { latitude: null, longitude: null },
  '1218': { latitude: null, longitude: null },
  '1219': { latitude: null, longitude: null },
  '1220': { latitude: null, longitude: null },
  '1221': { latitude: null, longitude: null },
  '1222': { latitude: null, longitude: null },
  '1223': { latitude: null, longitude: null },
  '1224': { latitude: null, longitude: null },
  '1225': { latitude: null, longitude: null },
  '1226': { latitude: null, longitude: null },
  '1227': { latitude: null, longitude: null },
  '1228': { latitude: null, longitude: null },
  '1229': { latitude: null, longitude: null },
  '1230': { latitude: null, longitude: null },
  '1231': { latitude: null, longitude: null },
  '1232': { latitude: null, longitude: null },
  '1233': { latitude: null, longitude: null },
  '1234': { latitude: null, longitude: null },
  '1235': { latitude: null, longitude: null },
  '1236': { latitude: null, longitude: null },
  '1237': { latitude: null, longitude: null },
  '1238': { latitude: null, longitude: null },
  '1239': { latitude: null, longitude: null },
  '1240': { latitude: null, longitude: null },
  '1241': { latitude: null, longitude: null },
  '1242': { latitude: null, longitude: null },
  '1243': { latitude: null, longitude: null },
  '1244': { latitude: null, longitude: null },
  '1245': { latitude: null, longitude: null },
  '1301': { latitude: 36.527548, longitude: -6.284749 },
  '1302': { latitude: null, longitude: null },
  '1303': { latitude: null, longitude: null },
  '1304': { latitude: null, longitude: null },
  '1305': { latitude: null, longitude: null },
  '1306': { latitude: null, longitude: null },
  '1307': { latitude: null, longitude: null },
  '1308': { latitude: null, longitude: null },
  '1309': { latitude: null, longitude: null },
  '1310': { latitude: null, longitude: null },
  '1311': { latitude: null, longitude: null },
  '1312': { latitude: null, longitude: null },
  '1313': { latitude: null, longitude: null },
  '1314': { latitude: null, longitude: null },
  '1315': { latitude: null, longitude: null },
  '1316': { latitude: null, longitude: null },
  '1317': { latitude: null, longitude: null },
  '1318': { latitude: null, longitude: null },
  '1319': { latitude: null, longitude: null },
  '1501': { latitude: 36.532775, longitude: -6.299891 },
  '1502': { latitude: null, longitude: null },
  '1503': { latitude: null, longitude: null },
  '1504': { latitude: null, longitude: null },
  '1505': { latitude: null, longitude: null },
  '1506': { latitude: null, longitude: null },
  '1507': { latitude: null, longitude: null },
  '1508': { latitude: null, longitude: null },
  '1509': { latitude: null, longitude: null },
  '1510': { latitude: null, longitude: null },
  '1511': { latitude: null, longitude: null },
  '1512': { latitude: null, longitude: null },
  '1513': { latitude: null, longitude: null },
  '1514': { latitude: null, longitude: null },
  '1515': { latitude: null, longitude: null },
  '1516': { latitude: null, longitude: null },
  '1517': { latitude: null, longitude: null },
  '1518': { latitude: null, longitude: null },
  '1519': { latitude: null, longitude: null },
  '1520': { latitude: null, longitude: null },
  '1521': { latitude: null, longitude: null },
  '1522': { latitude: null, longitude: null },
  '1523': { latitude: null, longitude: null },
  '1524': { latitude: null, longitude: null },
  '1525': { latitude: null, longitude: null },
  '1526': { latitude: null, longitude: null },
  '1707': { latitude: null, longitude: null },
  '1708': { latitude: null, longitude: null },
  '1709': { latitude: null, longitude: null },
  '1710': { latitude: null, longitude: null },
  '1711': { latitude: null, longitude: null },
  '1712': { latitude: null, longitude: null },
  '1713': { latitude: null, longitude: null },
  '1901': { latitude: null, longitude: null },
  '9905': { latitude: null, longitude: null },
  // Reemplaza null con latitud/longitud reales cuando las tengas
};


const STOP_METADATA: Record<string, StopConfig> = Object.fromEntries(
  Object.entries(STOP_LABELS).map(([stopId, label]) => {
    const coordinates = STOP_COORDINATES[stopId];
    return [
      stopId,
      coordinates
        ? { stopId, label, ...coordinates }
        : { stopId, label }
    ];
  })
);
function createStops(stopIds: string[]): StopConfig[] {
  return stopIds.map((stopId) => {
    const metadata = STOP_METADATA[stopId];
    if (metadata) {
      return { ...metadata };
    }
    return { stopId, label: `Parada ${stopId}` };
  });
}

const CADIZ_LINE_CONFIG: LineConfig[] = [
  {
    line: '1',
    directions: [
      {
        id: '1-plaza-espana',
        name: 'A Plaza España',
        stops: createStops([
          '9905',
          '1114',
          '1115',
          '1116',
          '1117',
          '1118',
          '1119',
          '1120',
          '1121',
          '1122',
          '1123',
          '1124',
          '1125',
          '1126',
          '1101'
        ])
      },
      {
        id: '1-cortadura',
        name: 'A Cortadura',
        stops: createStops([
          '1101',
          '1102',
          '1103',
          '1104',
          '1105',
          '1106',
          '1107',
          '1108',
          '1109',
          '1110',
          '1111',
          '1112',
          '1113',
          '1114',
          '1901',
          '9905'
        ])
      }
    ]
  },
  {
    line: '2',
    directions: [
      {
        id: '2-plaza-espana',
        name: 'A Plaza España',
        stops: createStops([
          '1223',
          '1224',
          '1311',
          '1225',
          '1226',
          '1227',
          '1228',
          '1229',
          '1230',
          '1231',
          '1232',
          '1233',
          '1123',
          '1234',
          '1235',
          '1236',
          '1237',
          '1238',
          '1239',
          '1240',
          '1241',
          '1242',
          '1243',
          '1244',
          '1245',
          '1201'
        ])
      },
      {
        id: '2-barriada-loreto',
        name: 'A Barriada Loreto',
        stops: createStops([
          '1201',
          '1202',
          '1203',
          '1204',
          '1205',
          '1206',
          '1207',
          '1208',
          '1209',
          '1210',
          '1211',
          '1212',
          '1213',
          '1214',
          '1215',
          '1216',
          '1217',
          '1218',
          '1219',
          '1220',
          '1221',
          '1222',
          '1223'
        ])
      }
    ]
  },
  {
    line: '3',
    directions: [
      {
        id: '3-plaza-espana',
        name: 'A Plaza España',
        stops: createStops([
          '1310',
          '1319',
          '1311',
          '1225',
          '1312',
          '1313',
          '1314',
          '1315',
          '1316',
          '1317',
          '1231',
          '1232',
          '1233',
          '1123',
          '1124',
          '1125',
          '1126',
          '1301'
        ])
      },
      {
        id: '3-puntales',
        name: 'A Puntales',
        stops: createStops([
          '1301',
          '1102',
          '1103',
          '1213',
          '1214',
          '1215',
          '1302',
          '1303',
          '1304',
          '1305',
          '1306',
          '1307',
          '1308',
          '1309',
          '1318',
          '1310'
        ])
      }
    ]
  },
  {
    line: '5',
    directions: [
      {
        id: '5-plaza-espana',
        name: 'A Plaza España (Club Deportivo Elcano)',
        stops: createStops([
          '1516',
          '1514',
          '1515',
          '1517',
          '1518',
          '1519',
          '1520',
          '1521',
          '1227',
          '1228',
          '1229',
          '1522',
          '1523',
          '1524',
          '1525',
          '1526',
          '1126',
          '1501'
        ])
      },
      {
        id: '5-zona-franca',
        name: 'A Zona Franca (Club Deportivo Elcano)',
        stops: createStops([
          '1501',
          '1502',
          '1503',
          '1504',
          '1505',
          '1506',
          '1507',
          '1217',
          '1218',
          '1219',
          '1508',
          '1509',
          '1510',
          '1511',
          '1512',
          '1513',
          '1515',
          '1516'
        ])
      }
    ]
  },
  {
    line: '7',
    directions: [
      {
        id: '7-glorieta-ana-orantes',
        name: 'A Glorieta Ana Orantes',
        stops: createStops([
          '1707',
          '1207',
          '1208',
          '1209',
          '1210',
          '1211',
          '1708',
          '1709',
          '1710',
          '1711',
          '1712',
          '1713'
        ])
      },
      {
        id: '7-simon-bolivar',
        name: 'A Simón Bolivar',
        stops: createStops([
          '1713',
          '1117',
          '1118',
          '1119',
          '1120',
          '1121',
          '1122',
          '1123',
          '1234',
          '1235',
          '1236',
          '1237',
          '1238',
          '1239',
          '1240',
          '1707'
        ])
      }
    ]
  }
];

const FAVOURITE_STOPS: FavouriteStop[] = CADIZ_LINE_CONFIG.flatMap((line) =>
  line.directions.flatMap((direction) =>
    direction.stops.map((stop) => ({
      ...stop,
      line: line.line,
      directionId: direction.id,
      directionName: direction.name
    }))
  )
);

export const favouriteStops = FAVOURITE_STOPS;
export const cadizLines = CADIZ_LINE_CONFIG;
export const stopMetadata = STOP_METADATA;

function buildQuery(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

function sanitisePresenterPayload(payload: string): string {
  const trimmed = payload.trim();

  if (!trimmed) {
    return '[]';
  }

  if (trimmed.startsWith('No request')) {
    throw new Error(trimmed);
  }

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return trimmed.replace(/,\s*(?=[\]}])/g, '');
  }

  throw new Error('Formato inesperado devuelto por Presenter.aspx');
}

async function fetchPresenterList<T>(query: string, params: Record<string, string>): Promise<T> {
  const queryString = buildQuery({ query, ...params, lang: 'es-ES' });
  const response = await fetch(`${BASE_URL}/Presenter.aspx?${queryString}`);

  if (!response.ok) {
    throw new Error(`Error al consultar Presenter.aspx (${response.status})`);
  }

  const raw = await response.text();
  const sanitised = sanitisePresenterPayload(raw);
  return JSON.parse(sanitised) as T;
}

function toArrival(stop: FavouriteStop, raw: PresenterArrivalRaw): BusStopArrival | null {
  const rawMinutes = raw.iMinHastaPaso.trim();
  const minutes = rawMinutes === '>>' ? 0 : Number.parseInt(rawMinutes, 10);
  if (!Number.isFinite(minutes)) {
    return null;
  }

  return {
    stopId: stop.stopId,
    stopName: stop.label,
    line: raw.iIdLinea.trim(),
    directionId: stop.directionId,
    directionName: stop.directionName,
    configuredLine: stop.line,
    destination: raw.sParadaDestino.trim(),
    arrivalInMinutes: minutes
  };
}

async function fetchArrivalEstimates(): Promise<BusStopArrival[]> {
  const arrivalsByStop = await Promise.all(
    FAVOURITE_STOPS.map(async (stop) => {
      try {
        const arrivals = await fetchPresenterList<PresenterArrivalRaw[]>('lcdentries', {
          busstop: stop.stopId
        });

        return arrivals
          .map((arrival) => toArrival(stop, arrival))
          .filter((item): item is BusStopArrival => item !== null);
      } catch (error) {
        console.warn(`No se pudieron obtener llegadas para la parada ${stop.stopId}`, error);
        return [] as BusStopArrival[];
      }
    })
  );

  return arrivalsByStop.flat().sort((a, b) => a.arrivalInMinutes - b.arrivalInMinutes);
}

export async function fetchBusData(): Promise<BusDataSnapshot> {
  const arrivals = await fetchArrivalEstimates();

  return {
    arrivals,
    generatedAt: new Date().toISOString()
  };
}
