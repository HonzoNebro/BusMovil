import { cadizLines, stopMetadata } from './cadizApi';
import { lineColors } from '../theme';
export const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
export function buildStopIndex() {
  const stops = new Map<
    string,
    {
      stopId: string;
      label: string;
      latitude?: number;
      longitude?: number;
      lines: string[];
      color: string;
      services: {
        lineId: string;
        directionId: string;
        destination: string;
        nextStop: string | null;
      }[];
    }
  >();
  for (const line of cadizLines)
    for (const direction of line.directions)
      direction.stops.forEach((entry, i) => {
        const meta = stopMetadata[entry.stopId] ?? entry;
        let stop = stops.get(entry.stopId);
        if (!stop) {
          stop = {
            stopId: entry.stopId,
            label: meta.label,
            latitude: meta.latitude ?? undefined,
            longitude: meta.longitude ?? undefined,
            lines: [],
            services: [],
            color: lineColors[line.line]
          };
          stops.set(entry.stopId, stop);
        }
        if (!stop.lines.includes(line.line)) stop.lines.push(line.line);
        if (
          !stop.services.some(
            (s) => s.lineId === line.line && s.directionId === direction.id
          )
        )
          stop.services.push({
            lineId: line.line,
            directionId: direction.id,
            destination: direction.name,
            nextStop: direction.stops[i + 1]?.stopId ?? null
          });
      });
  return [...stops.values()];
}
export type SearchStop = ReturnType<typeof buildStopIndex>[number];
export const stopIndex = buildStopIndex();
export function searchStops(query: string): SearchStop[] {
  const q = normalizeSearch(query);
  if (!q) return [];
  const line =
    q.match(/^(?:linea|line)\s*(\d+)$/)?.[1] ??
    (/^\d$/.test(q) ? q : undefined);
  return stopIndex
    .filter((stop) =>
      line
        ? stop.lines.includes(line)
        : q
            .split(' ')
            .every((word) =>
              normalizeSearch(stop.label + ' ' + stop.stopId).includes(word)
            )
    )
    .sort(
      (a, b) =>
        Number(b.stopId === q) - Number(a.stopId === q) ||
        a.label.localeCompare(b.label, 'es') ||
        a.stopId.localeCompare(b.stopId)
    );
}
