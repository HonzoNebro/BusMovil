import type { BusDataSnapshot, BusStopArrival } from '@/types/bus';

// React Native CLI does not inject Expo environment variables.
const BASE_URL = 'http://77.224.241.76/urbanos';

export interface StopConfig {
  stopId: string;
  label: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface LineConfig {
  line: string;
  directions: { id: string; name: string; stops: StopConfig[] }[];
}

export interface FavouriteStop extends StopConfig {
  line: string;
  directionId: string;
  directionName: string;
}

interface PresenterArrivalRaw {
  iMinHastaPaso: string;
  iIdLinea: string;
  sParadaDestino: string;
}

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
  '1112': 'Telegrafía (Vuelta)',
  '1113': 'Cortadura',
  '1114': 'Cortadura (Vuelta)',
  '1115': 'Telegrafía (Vuelta)',
  '1116': 'Estadio (Vuelta)',
  '1117': 'Balneario - Glorieta Ana Orantes (Vuelta)',
  '1118': 'Residencia - Hospital Puerta del Mar',
  '1119': 'San José (Vuelta)',
  '1120': 'San Felipe (Vuelta)',
  '1121': 'Plaza Asdrúbal - Mercado Virgen del Rosario (Vuelta)',
  '1122': 'Comisaría - Avenida de Andalucía 45 (Vuelta)',
  '1123': 'Avenida de Andalucía (Vuelta)',
  '1124': 'Puertas de Tierra (Vuelta)',
  '1125': 'Renfe - Cuesta de Las Calesas',
  '1126': 'Avenida del Puerto (Vuelta)',
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

const STOP_COORDINATES: Partial<Record<string, { latitude: number | null; longitude: number | null }>> = {
  '1101': { latitude: 36.534149, longitude: -6.292969 },
  '1102': { latitude: 36.530329, longitude: -6.291148 },
  '1103': { latitude: 36.526890, longitude: -6.289099 },
  '1104': { latitude: 36.524088, longitude: -6.287125 },
  '1105': { latitude: 36.520876, longitude: -6.285322 },
  '1106': { latitude: 36.517423, longitude: -6.283439 },
  '1107': { latitude: 36.515435, longitude: -6.282232 },
  '1108': { latitude: 36.511947, longitude: -6.280231 },
  '1109': { latitude: 36.509067, longitude: -6.278601 },
  '1110': { latitude: 36.506355, longitude: -6.277075 },
  '1111': { latitude: 36.501845, longitude: -6.274419 },
  '1112': { latitude: 36.499833, longitude: -6.273317 },
  '1113': { latitude: 36.497011, longitude: -6.271750 },
  '1114': { latitude: 36.498002, longitude: -6.272011 },
  '1115': { latitude: 36.500292, longitude: -6.273338 },
  '1116': { latitude: 36.502220, longitude: -6.274459 },
  '1117': { latitude: 36.506402, longitude: -6.276906 },
  '1118': { latitude: 36.509192, longitude: -6.278472 },
  '1119': { latitude: 36.512331, longitude: -6.280229 },
  '1120': { latitude: 36.515534, longitude: -6.282093 },
  '1121': { latitude: 36.517804, longitude: -6.283331 },
  '1122': { latitude: 36.521007, longitude: -6.285210 },
  '1123': { latitude: 36.524525, longitude: -6.287197 },
  '1124': { latitude: 36.527237, longitude: -6.288753 },
  '1125': { latitude: 36.529269, longitude: -6.289697 },
  '1126': { latitude: 36.531806, longitude: -6.292288 },
  '1201': { latitude: 36.534851, longitude: -6.292135 },
  '1202': { latitude: 36.536243, longitude: -6.291588 },
  '1203': { latitude: 36.536578, longitude: -6.295023 },
  '1204': { latitude: 36.537133, longitude: -6.298956 },
  '1205': { latitude: 36.536446, longitude: -6.302735 },
  '1206': { latitude: 36.534217, longitude: -6.305385 },
  '1207': { latitude: 36.531560, longitude: -6.305565 },
  '1208': { latitude: 36.527961, longitude: -6.303502 },
  '1209': { latitude: 36.528310, longitude: -6.300898 },
  '1210': { latitude: 36.528808, longitude: -6.298049 },
  '1211': { latitude: 36.527618, longitude: -6.292672 },
  '1212': { latitude: 36.526122, longitude: -6.289228 },
  '1213': { latitude: 36.524958, longitude: -6.286411 },
  '1214': { latitude: 36.522010, longitude: -6.284169 },
  '1215': { latitude: 36.521018, longitude: -6.281905 },
  '1216': { latitude: 36.519659, longitude: -6.280190 },
  '1217': { latitude: 36.517358, longitude: -6.279057 },
  '1218': { latitude: 36.514663, longitude: -6.277602 },
  '1219': { latitude: 36.511344, longitude: -6.276063 },
  '1220': { latitude: 36.508748, longitude: -6.276053 },
  '1221': { latitude: 36.507403, longitude: -6.271691 },
  '1222': { latitude: 36.506236, longitude: -6.268105 },
  '1223': { latitude: 36.504203, longitude: -6.269878 },
  '1224': { latitude: 36.506271, longitude: -6.268005 },
  '1225': { latitude: 36.509324, longitude: -6.272330 },
  '1226': { latitude: 36.509356, longitude: -6.274717 },
  '1227': { latitude: 36.511809, longitude: -6.276117 },
  '1228': { latitude: 36.514854, longitude: -6.277502 },
  '1229': { latitude: 36.518281, longitude: -6.278831 },
  '1230': { latitude: 36.520264, longitude: -6.279802 },
  '1231': { latitude: 36.521156, longitude: -6.281135 },
  '1232': { latitude: 36.522202, longitude: -6.283018 },
  '1233': { latitude: 36.522803, longitude: -6.285553 },
  '1234': { latitude: 36.526359, longitude: -6.289968 },
  '1235': { latitude: 36.527939, longitude: -6.293440 },
  '1236': { latitude: 36.528784, longitude: -6.296183 },
  '1237': { latitude: 36.528748, longitude: -6.298903 },
  '1238': { latitude: 36.528327, longitude: -6.301209 },
  '1239': { latitude: 36.528041, longitude: -6.303325 },
  '1240': { latitude: 36.531497, longitude: -6.305383 },
  '1241': { latitude: 36.534450, longitude: -6.304889 },
  '1242': { latitude: 36.536768, longitude: -6.302102 },
  '1243': { latitude: 36.537422, longitude: -6.299629 },
  '1244': { latitude: 36.536504, longitude: -6.294718 },
  '1245': { latitude: 36.536058, longitude: -6.291781 },
  '1301': { latitude: 36.533914, longitude: -6.292995 },
  '1302': { latitude: 36.520415, longitude: -6.278740 },
  '1303': { latitude: 36.519089, longitude: -6.277109 },
  '1304': { latitude: 36.517662, longitude: -6.275369 },
  '1305': { latitude: 36.514478, longitude: -6.273553 },
  '1306': { latitude: 36.512318, longitude: -6.272582 },
  '1307': { latitude: 36.510917, longitude: -6.272475 },
  '1308': { latitude: 36.509382, longitude: -6.272475 },
  '1309': { latitude: 36.507071, longitude: -6.270018 },
  '1310': { latitude: null, longitude: null },
  '1311': { latitude: 36.507185, longitude: -6.270361 },
  '1312': { latitude: 36.510802, longitude: -6.272410 },
  '1313': { latitude: 36.512650, longitude: -6.272603 },
  '1314': { latitude: 36.515005, longitude: -6.273667 },
  '1315': { latitude: 36.518136, longitude: -6.275779 },
  '1316': { latitude: 36.519456, longitude: -6.277384 },
  '1317': { latitude: 36.520771, longitude: -6.279033 },
  '1318': { latitude: 36.507832, longitude: -6.268054 },
  '1319': { latitude: 36.507435, longitude: -6.268392 },
  '1501': { latitude: 36.534345, longitude: -6.293104 },
  '1502': { latitude: 36.530327, longitude: -6.291145 },
  '1503': { latitude: 36.529949, longitude: -6.289143 },
  '1504': { latitude: 36.527452, longitude: -6.285097 },
  '1505': { latitude: 36.522721, longitude: -6.278842 },
  '1506': { latitude: 36.521971, longitude: -6.277260 },
  '1507': { latitude: 36.520518, longitude: -6.276517 },
  '1508': { latitude: 36.507066, longitude: -6.274073 },
  '1509': { latitude: 36.505277, longitude: -6.273236 },
  '1510': { latitude: 36.501819, longitude: -6.271638 },
  '1511': { latitude: 36.499831, longitude: -6.269229 },
  '1512': { latitude: 36.500046, longitude: -6.266005 },
  '1513': { latitude: 36.497194, longitude: -6.264688 },
  '1514': { latitude: 36.498735, longitude: -6.259375 },
  '1515': { latitude: 36.495264, longitude: -6.265501 },
  '1516': { latitude: 36.494561, longitude: -6.265903 },
  '1517': { latitude: 36.495061, longitude: -6.266456 },
  '1518': { latitude: 36.498149, longitude: -6.267271 },
  '1519': { latitude: 36.501482, longitude: -6.269647 },
  '1520': { latitude: 36.504932, longitude: -6.272888 },
  '1521': { latitude: 36.508515, longitude: -6.274524 },
  '1522': { latitude: 36.520130, longitude: -6.276879 },
  '1523': { latitude: 36.522058, longitude: -6.277093 },
  '1524': { latitude: 36.523325, longitude: -6.279700 },
  '1525': { latitude: 36.527456, longitude: -6.284941 },
  '1526': { latitude: 36.530104, longitude: -6.289014 },
  '1707': { latitude: 36.533280, longitude: -6.306083 },
  '1708': { latitude: 36.524243, longitude: -6.288847 },
  '1709': { latitude: 36.520742, longitude: -6.286497 },
  '1710': { latitude: 36.517632, longitude: -6.285878 },
  '1711': { latitude: 36.513898, longitude: -6.283670 },
  '1712': { latitude: 36.509610, longitude: -6.280832 },
  '1713': { latitude: 36.507515, longitude: -6.279577 },
  '1901': { latitude: 36.498270, longitude: -6.271868 },
  '9905': { latitude: 36.493496, longitude: -6.269304 },
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
          '1318',
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
          '1318'
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${BASE_URL}/Presenter.aspx?${queryString}`, {
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Error al consultar Presenter.aspx (${response.status})`);
    }
    return JSON.parse(sanitisePresenterPayload(await response.text())) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function toArrival(stop: FavouriteStop, raw: PresenterArrivalRaw, observedAt: string): BusStopArrival | null {
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
    arrivalInMinutes: minutes,
    observedAt
  };
}

export async function fetchBusData(): Promise<BusDataSnapshot> {
  // Query each physical stop once, then attach the configured line/direction metadata.
  const stopIds = [...new Set(FAVOURITE_STOPS.map((stop) => stop.stopId))];
  const outcomes = await Promise.all(stopIds.map(async (stopId) => {
    try {
      const raw = await fetchPresenterList<PresenterArrivalRaw[]>('lcdentries', { busstop: stopId });
      if (!Array.isArray(raw)) throw new Error('Respuesta de llegadas no válida');
      const observedAt = new Date().toISOString();
      const arrivals = FAVOURITE_STOPS.filter((stop) => stop.stopId === stopId).flatMap((stop) =>
        raw.map((arrival) => toArrival(stop, arrival, observedAt))
          .filter((arrival): arrival is BusStopArrival => arrival !== null)
      );
      return { stopId, arrivals, failed: false };
    } catch (error) {
      console.warn(`No se pudieron obtener llegadas para la parada ${stopId}`, error);
      return { stopId, arrivals: [] as BusStopArrival[], failed: true };
    }
  }));
  const failedStopIds = outcomes.filter((result) => result.failed).map((result) => result.stopId);
  if (stopIds.length && failedStopIds.length === stopIds.length) {
    throw new Error('No se pudieron consultar las llegadas. Comprueba la conexión y reintenta.');
  }
  return {
    arrivals: outcomes.flatMap((result) => result.arrivals)
      .sort((a, b) => a.arrivalInMinutes - b.arrivalInMinutes),
    generatedAt: new Date().toISOString(),
    failedStopIds
  };
}
