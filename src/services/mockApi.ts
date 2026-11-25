import type { BusDataSnapshot } from '@/types/bus';
import { favouriteStops } from './cadizApi';

export async function fetchBusData(): Promise<BusDataSnapshot> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    arrivals: favouriteStops.map((stop) => ({
      stopId: stop.stopId,
      stopName: stop.label,
      line: stop.line,
      configuredLine: stop.line,
      directionId: stop.directionId,
      directionName: stop.directionName,
      destination: stop.directionName,
      observedAt: new Date().toISOString(),
      arrivalInMinutes: Math.floor(Math.random() * 8) + 1
    })),
    generatedAt: new Date().toISOString(),
    failedStopIds: []
  };
}
