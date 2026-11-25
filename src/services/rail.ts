import data from '../assets/rail/catalog.json';
export type RailLine = 'C1' | 'C1a' | 'T1';
export interface RailStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
}
export interface RailTrip {
  id: string;
  route: string;
  service: string;
  shape: string;
  stops: [string, number, number][];
}
export interface RailCatalog {
  source: string;
  importedAt: string;
  validFrom: string;
  validUntil: string;
  routes: { id: string; line: RailLine; name: string; color: string }[];
  stops: RailStop[];
  trips: RailTrip[];
  calendar: ({
    service_id: string;
    start_date: string;
    end_date: string;
  } & Record<string, string>)[];
  exceptions: { service: string; date: string; type: number }[];
  shapes: Record<string, [number, number][]>;
}
export const railCatalog = data as unknown as RailCatalog;
const tripIndex = new Map(railCatalog.trips.map((t) => [t.id, t]));
const routeIndex = new Map(railCatalog.routes.map((r) => [r.id, r]));
const stationIndex = new Map(railCatalog.stops.map((s) => [s.id, s]));
export function railTrip(id: string) {
  return tripIndex.get(id);
}
export function lineForTrip(id: string): RailLine | undefined {
  const trip = tripIndex.get(id);
  const line = trip && routeIndex.get(trip.route)?.line;
  if (line) return line;
  if (!id.startsWith('31')) return undefined;
  return id.endsWith('C1a')
    ? 'C1a'
    : id.endsWith('C1')
    ? 'C1'
    : id.endsWith('T1')
    ? 'T1'
    : undefined;
}
export function destinationForTrip(id: string) {
  const stops = tripIndex.get(id)?.stops;
  return stops?.length
    ? stationIndex.get(stops[stops.length - 1][0])?.name
    : undefined;
}
export function stopsForLines(lines: RailLine[]) {
  const ids = new Set(
    railCatalog.trips
      .filter((t) => lines.includes(routeIndex.get(t.route)!.line))
      .flatMap((t) => t.stops.map((s) => s[0]))
  );
  return railCatalog.stops.filter((s) => ids.has(s.id));
}
export interface RailVehicle {
  id: string;
  tripId: string;
  line: RailLine;
  lat: number;
  lon: number;
  observedAt: number;
  label: string;
  stopId?: string;
}
export interface RailUpdate {
  tripId: string;
  cancelled: boolean;
  stops: { id: string; skipped: boolean; time?: number; delay?: number }[];
}
export interface RailFeed<T> {
  observedAt: number;
  items: T[];
}
export interface RailSnapshot {
  vehicles?: RailFeed<RailVehicle>;
  updates?: RailFeed<RailUpdate>;
  failed: string[];
}
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
const num = (v: unknown) =>
  typeof v === 'number' || typeof v === 'string' ? Number(v) : NaN;
export function parseRailFeed(
  input: unknown,
  kind: 'vehicles',
  now?: number
): RailFeed<RailVehicle>;
export function parseRailFeed(
  input: unknown,
  kind: 'updates',
  now?: number
): RailFeed<RailUpdate>;
export function parseRailFeed(
  input: unknown,
  kind: 'vehicles' | 'updates',
  now = Date.now()
): RailFeed<RailVehicle> | RailFeed<RailUpdate> {
  const root = object(input),
    header = object(root.header),
    observedAt = num(header.timestamp) * 1000;
  if (
    !Number.isFinite(observedAt) ||
    observedAt <= 0 ||
    observedAt > now + 120000 ||
    !Array.isArray(root.entity)
  )
    throw new Error('Invalid Renfe feed');
  if (kind === 'vehicles') {
    const items: RailVehicle[] = [];
    for (const raw of root.entity) {
      const entity = object(raw),
        v = object(entity.vehicle),
        trip = object(v.trip),
        position = object(v.position),
        label = object(v.vehicle);
      const tripId = String(trip.tripId ?? ''),
        line = lineForTrip(tripId),
        lat = num(position.latitude),
        lon = num(position.longitude),
        timestamp = num(v.timestamp) * 1000;
      if (
        !line ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        Math.abs(lat) > 90 ||
        Math.abs(lon) > 180 ||
        !Number.isFinite(timestamp) ||
        timestamp <= 0 ||
        timestamp > now + 120000
      )
        continue;
      items.push({
        id: String(entity.id ?? tripId),
        tripId,
        line,
        lat,
        lon,
        observedAt: timestamp,
        label: String(label.label ?? line),
        stopId: typeof v.stopId === 'string' ? v.stopId : undefined
      });
    }
    return { observedAt, items };
  }
  const items: RailUpdate[] = [];
  for (const raw of root.entity) {
    const update = object(object(raw).tripUpdate),
      trip = object(update.trip),
      tripId = String(trip.tripId ?? '');
    if (!lineForTrip(tripId)) continue;
    const stops = Array.isArray(update.stopTimeUpdate)
      ? update.stopTimeUpdate
      : [];
    items.push({
      tripId,
      cancelled: trip.scheduleRelationship === 'CANCELED',
      stops: stops.map((rawStop) => {
        const s = object(rawStop),
          arrival = object(s.arrival),
          departure = object(s.departure);
        const time = num(arrival.time ?? departure.time) * 1000,
          delay = num(arrival.delay ?? departure.delay);
        return {
          id: String(s.stopId ?? ''),
          skipped: s.scheduleRelationship === 'SKIPPED',
          time: Number.isFinite(time) && time > 0 ? time : undefined,
          delay: Number.isFinite(delay) ? delay : undefined
        };
      })
    });
  }
  return { observedAt, items };
}
export const railFresh = (timestamp: number | undefined, now = Date.now()) =>
  timestamp !== undefined &&
  now - timestamp <= 90000 &&
  timestamp <= now + 120000;
function parts(date: Date) {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
}
export function madridDay(date: Date) {
  const p = parts(date);
  return p.year + p.month + p.day;
}
function midnight(key: string) {
  const utc = Date.UTC(
      +key.slice(0, 4),
      +key.slice(4, 6) - 1,
      +key.slice(6, 8)
    ),
    p = parts(new Date(utc));
  const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return utc - (local - utc);
}
function adjacentDay(key: string, delta: number) {
  return new Date(
    Date.UTC(+key.slice(0, 4), +key.slice(4, 6) - 1, +key.slice(6, 8) + delta)
  )
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');
}
export function catalogValid(now = Date.now()) {
  const day = madridDay(new Date(now));
  return day >= railCatalog.validFrom && day <= railCatalog.validUntil;
}
function runs(service: string, day: string) {
  const exception = railCatalog.exceptions.find(
    (e) => e.service === service && e.date === day
  );
  if (exception) return exception.type === 1;
  const entry = railCatalog.calendar.find((c) => c.service_id === service);
  const weekday = new Date(
    Date.UTC(+day.slice(0, 4), +day.slice(4, 6) - 1, +day.slice(6, 8))
  ).getUTCDay();
  return (
    !!entry &&
    day >= entry.start_date &&
    day <= entry.end_date &&
    entry[
      [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday'
      ][weekday]
    ] === '1'
  );
}
export interface RailArrival {
  tripId: string;
  line: RailLine;
  destination?: string;
  time: number;
  live: boolean;
  observedAt?: number;
}
export function railArrivals(
  stopId: string,
  lines: RailLine[],
  snapshot: RailSnapshot,
  now = Date.now()
): RailArrival[] {
  const fresh =
    !snapshot.failed.includes('updates') &&
    railFresh(snapshot.updates?.observedAt, now);
  const updates = new Map(
    (fresh ? snapshot.updates!.items : []).map((u) => [u.tripId, u])
  );
  const result = new Map<string, RailArrival>();
  const day = madridDay(new Date(now)),
    valid = catalogValid(now);
  if (valid)
    for (const t of railCatalog.trips) {
      const line = lineForTrip(t.id)!;
      if (!lines.includes(line)) continue;
      const call = t.stops.find((s) => s[0] === stopId);
      if (!call || t.stops[t.stops.length - 1][0] === stopId) continue;
      const update = updates.get(t.id),
        direct = update?.stops.find((s) => s.id === stopId);
      if (update?.cancelled || direct?.skipped) continue;
      for (const delta of [-1, 0, 1]) {
        const serviceDay = adjacentDay(day, delta);
        if (!runs(t.service, serviceDay)) continue;
        const scheduled = midnight(serviceDay) + call[2] * 60000;
        const time =
          direct?.time ??
          (direct?.delay !== undefined
            ? scheduled + direct.delay * 1000
            : scheduled);
        if (time < now - 30000 || time > now + 3 * 3600000) continue;
        result.set(t.id, {
          tripId: t.id,
          line,
          destination: destinationForTrip(t.id),
          time,
          live:
            !!direct &&
            (direct.time !== undefined || direct.delay !== undefined),
          observedAt: direct ? snapshot.updates?.observedAt : undefined
        });
      }
    }
  // Real-time trips remain useful even when the bundled timetable has expired or changed.
  for (const u of updates.values()) {
    const line = lineForTrip(u.tripId)!;
    const call = u.stops.find((s) => s.id === stopId);
    const known = railTrip(u.tripId);
    if (known?.stops[known.stops.length - 1]?.[0] === stopId) continue;
    if (
      !lines.includes(line) ||
      u.cancelled ||
      !call?.time ||
      call.skipped ||
      call.time < now - 30000 ||
      call.time > now + 3 * 3600000
    )
      continue;
    result.set(u.tripId, {
      tripId: u.tripId,
      line,
      destination: destinationForTrip(u.tripId),
      time: call.time,
      live: true,
      observedAt: snapshot.updates?.observedAt
    });
  }
  return [...result.values()].sort((a, b) => a.time - b.time).slice(0, 8);
}
export const RAIL_URLS = {
  vehicles: 'https://gtfsrt.renfe.com/vehicle_positions.json',
  updates: 'https://gtfsrt.renfe.com/trip_updates.json'
};
