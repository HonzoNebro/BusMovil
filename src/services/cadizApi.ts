import type { BusDataSnapshot, BusLocation, BusStopArrival } from '@/types/bus';

interface PresenterArrivalRaw {
  iIdLinea: string;
  iMinHastaPaso: string;
  sParadaDestino: string;
  sSalida: string;
}

interface PresenterVehicleRaw {
  __type?: string;
  vehiculo?: string;
  linea?: string;
  trayecto?: string;
  sentido?: string;
  codigo?: string;
  velocidad?: string;
  origen?: string;
  destino?: string;
  distanciaParada?: string;
  estado?: string;
  dLat?: string;
  dLon?: string;
  denominacion?: string;
  conductor?: string;
  retraso?: string;
  ultimodato?: string;
}

interface PresenterServiceResponse<T> {
  d?: T;
}

const BASE_URL = 'http://77.224.241.76/urbanos';

const LINE_ID_BY_PUBLIC_NUMBER: Record<string, number> = {
  '1': 11,
  '2': 12,
  '3': 13,
  '5': 15,
  '7': 17
};

const FAVOURITE_STOPS: Array<{ stopId: string; label: string }> = [
  { stopId: '1101', label: 'Plaza España → Cortadura' },
  { stopId: '1201', label: 'Plaza España → Bda. Loreto' },
  { stopId: '1301', label: 'Plaza España → Puntales' },
  { stopId: '1501', label: 'Plaza España → Zona Franca' },
  { stopId: '1117', label: 'Balneario → Glorieta Ana Orantes' }
];

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

async function fetchPresenterService<T>(
  method: string,
  payload: Record<string, number | boolean>
): Promise<T> {
  const response = await fetch(`${BASE_URL}/PresenterService.asmx/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Error al consultar PresenterService (${response.status})`);
  }

  const raw = (await response.json()) as PresenterServiceResponse<T>;
  return raw.d ?? ([] as unknown as T);
}

function parseTimeToIso(time?: string): string {
  if (!time) {
    return new Date().toISOString();
  }

  const parts = time.trim().split(':').map((part) => Number.parseInt(part, 10));
  if (Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    return new Date().toISOString();
  }

  const now = new Date();
  now.setHours(parts[0], parts[1], Number.isNaN(parts[2]) ? 0 : parts[2], 0);
  return now.toISOString();
}

function toBusLocation(raw: PresenterVehicleRaw, fallbackLine: string): BusLocation | null {
  const latitude = Number.parseFloat(raw.dLat ?? '');
  const longitude = Number.parseFloat(raw.dLon ?? '');

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const sentido = Number.parseInt((raw.sentido ?? '').trim(), 10);
  const heading = Number.isFinite(sentido) ? (sentido === 2 ? 180 : 0) : 0;

  const vehicleCode = (raw.vehiculo ?? '').trim();
  const identifier = vehicleCode || `${latitude.toFixed(5)}-${longitude.toFixed(5)}`;

  return {
    id: `${fallbackLine.trim()}-${identifier}`,
    line: (raw.linea ?? fallbackLine).trim(),
    latitude,
    longitude,
    heading,
    lastUpdated: parseTimeToIso(raw.ultimodato)
  };
}

async function fetchVehicleLocations(): Promise<BusLocation[]> {
  const results = await Promise.all(
    Object.entries(LINE_ID_BY_PUBLIC_NUMBER).map(async ([publicLine, serviceId]) => {
      try {
        const vehicles = await fetchPresenterService<PresenterVehicleRaw[]>(
          'GetVehiculos',
          { iIdLinea: serviceId, iIdController: 0 }
        );

        return vehicles
          .map((vehicle) => toBusLocation(vehicle, publicLine))
          .filter((busLocation): busLocation is BusLocation => busLocation !== null);
      } catch (error) {
        console.warn(`No se pudieron obtener vehículos de la línea ${publicLine}`, error);
        return [] as BusLocation[];
      }
    })
  );

  return results.flat();
}

function toArrival(stop: { stopId: string; label: string }, raw: PresenterArrivalRaw): BusStopArrival | null {
  const minutes = Number.parseInt(raw.iMinHastaPaso.trim(), 10);
  if (!Number.isFinite(minutes)) {
    return null;
  }

  return {
    stopId: stop.stopId,
    stopName: stop.label,
    line: raw.iIdLinea.trim(),
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
  const [buses, arrivals] = await Promise.all([fetchVehicleLocations(), fetchArrivalEstimates()]);

  return {
    buses,
    arrivals,
    generatedAt: new Date().toISOString()
  };
}
