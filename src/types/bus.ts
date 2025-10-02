export interface BusLocation {
  id: string;
  line: string;
  latitude: number;
  longitude: number;
  heading: number;
  lastUpdated: string;
}

export interface BusStopArrival {
  stopId: string;
  stopName: string;
  line: string;
  destination: string;
  arrivalInMinutes: number;
}

export interface BusDataSnapshot {
  buses: BusLocation[];
  arrivals: BusStopArrival[];
  generatedAt: string;
}
