import { cadizLines, stopMetadata } from './cadizApi';
import { lineColors } from '../theme';

export function buildMapRoutes(lineId?: string, directionId?: string) {
  const markers = new Map<
    string,
    {
      stopId: string;
      label: string;
      latitude: number;
      longitude: number;
      lines: string[];
      color: string;
      services: Array<{
        lineId: string;
        directionId: string;
        destination: string;
        nextStop: string | null;
      }>;
    }
  >();
  const shapes: Array<{
    lineId: string;
    directionId: string;
    destination: string;
    color: string;
    alternate: boolean;
    coordinates: Array<[number, number]>;
  }> = [];
  cadizLines
    .filter((line) => !lineId || line.line === lineId)
    .forEach((line) => {
      line.directions.forEach((direction) => {
        if (directionId && direction.id !== directionId) return;
        const coordinates: Array<[number, number]> = [];
        direction.stops.forEach((stop, stopIndex) => {
          const metadata = stopMetadata[stop.stopId];
          if (
            typeof metadata?.latitude !== 'number' ||
            typeof metadata.longitude !== 'number'
          )
            return;
          coordinates.push([metadata.latitude, metadata.longitude]);
          let marker = markers.get(stop.stopId);
          if (!marker) {
            marker = {
              stopId: stop.stopId,
              label: metadata.label,
              latitude: metadata.latitude,
              longitude: metadata.longitude,
              lines: [],
              color: lineColors[line.line] ?? '#143B59',
              services: []
            };
            markers.set(stop.stopId, marker);
          }
          if (!marker.lines.includes(line.line)) marker.lines.push(line.line);
          marker.services.push({
            lineId: line.line,
            directionId: direction.id,
            destination: direction.name.replace(/^A\s+/, ''),
            nextStop: direction.stops[stopIndex + 1]?.label ?? null
          });
        });
        if (coordinates.length > 1)
          shapes.push({
            lineId: line.line,
            directionId: direction.id,
            destination: direction.name.replace(/^A\s+/, ''),
            color: lineColors[line.line] ?? '#143B59',
            alternate:
              !direction.id.endsWith('plaza-espana') &&
              direction.id !== '7-glorieta-ana-orantes',
            coordinates
          });
      });
    });
  return { markers: Array.from(markers.values()), shapes };
}
