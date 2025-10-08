export interface BusStopArrival {
  stopId: string;
  stopName: string;
  line: string;
  directionId: string;
  directionName: string;
  configuredLine: string;
  destination: string;
  arrivalInMinutes: number;
}

export interface BusDataSnapshot {
  arrivals: BusStopArrival[];
  generatedAt: string;
}
