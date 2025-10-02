import type { BusDataSnapshot } from '@/types/bus';

type Coordinates = [number, number];

const ROUTES: Record<string, Coordinates[]> = {
  L1: [
    [40.416775, -3.70379],
    [40.420345, -3.70505],
    [40.425525, -3.70689],
    [40.43061, -3.70843],
    [40.43529, -3.70967]
  ],
  L2: [
    [40.4154, -3.7074],
    [40.4179, -3.7113],
    [40.4206, -3.7152],
    [40.4231, -3.719],
    [40.4258, -3.7229]
  ]
};

const STOPS = [
  {
    stopId: '1001',
    stopName: 'Plaza Mayor',
    line: 'L1',
    destination: 'Estación Central'
  },
  {
    stopId: '2001',
    stopName: 'Gran Vía',
    line: 'L2',
    destination: 'Parque Tecnológico'
  }
];

function randomDelay(min = 1, max = 8): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function interpolateRoute(route: Coordinates[], fractionalIndex: number): Coordinates {
  const maxIndex = route.length - 1;
  const index = Math.floor(fractionalIndex) % maxIndex;
  const nextIndex = (index + 1) % route.length;
  const progress = fractionalIndex - Math.floor(fractionalIndex);

  const [startLat, startLng] = route[index];
  const [endLat, endLng] = route[nextIndex];

  const latitude = startLat + (endLat - startLat) * progress;
  const longitude = startLng + (endLng - startLng) * progress;

  return [latitude, longitude];
}

let seed = Date.now();

function pseudoRandom(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

export async function fetchBusData(): Promise<BusDataSnapshot> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const timestamp = new Date();

  const buses = Object.entries(ROUTES).map(([line, route], index) => {
    const totalSegments = route.length - 1;
    const secondsOfDay = timestamp.getHours() * 3600 + timestamp.getMinutes() * 60 + timestamp.getSeconds();
    const fractionalIndex = ((secondsOfDay / 60 + index * 2) % totalSegments) + pseudoRandom() * 0.05;
    const [latitude, longitude] = interpolateRoute(route, fractionalIndex);
    const heading = pseudoRandom() * 360;

    return {
      id: `${line}-${index}`,
      line,
      latitude,
      longitude,
      heading,
      lastUpdated: timestamp.toISOString()
    };
  });

  const arrivals = STOPS.map((stop) => ({
    ...stop,
    arrivalInMinutes: randomDelay()
  }));

  return {
    buses,
    arrivals,
    generatedAt: timestamp.toISOString()
  };
}
