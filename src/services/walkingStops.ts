import type { StopConfig } from './cadizApi';

export interface UserPosition {
  latitude: number;
  longitude: number;
  observedAt: number;
  accuracy: 'precise' | 'approximate';
}
export type LocatedStop = StopConfig & { latitude: number; longitude: number };
export interface NearbyStopResult {
  stop: LocatedStop;
  straightDistanceMeters: number;
  walkingMeters?: number;
  walkingSeconds?: number;
  method: 'walking' | 'straight';
  candidateCount: number;
  position: UserPosition;
}
const ENDPOINT = 'https://valhalla1.openstreetmap.de/sources_to_targets';
const cache = new Map<string, { at: number; result: NearbyStopResult }>();
let lastRequestAt = 0;
export function clearWalkingCache() {
  cache.clear();
  lastRequestAt = 0;
}
export function isFreshPosition(
  position: UserPosition | undefined
): position is UserPosition {
  return Boolean(
    position &&
      Number.isFinite(position.latitude) &&
      Math.abs(position.latitude) <= 90 &&
      Number.isFinite(position.longitude) &&
      Math.abs(position.longitude) <= 180 &&
      Date.now() - position.observedAt >= -5000 &&
      Date.now() - position.observedAt <=
        (position.accuracy === 'approximate' ? 15 * 60000 : 30000)
  );
}
export function straightDistance(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const rad = Math.PI / 180;
  const dlat = (b.latitude - a.latitude) * rad,
    dlon = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.latitude * rad) *
      Math.sin(dlon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function closestCandidates(stops: StopConfig[], position: UserPosition) {
  const seen = new Set<string>();
  return stops
    .filter((stop): stop is LocatedStop => {
      if (
        seen.has(stop.stopId) ||
        !Number.isFinite(stop.latitude) ||
        !Number.isFinite(stop.longitude)
      )
        return false;
      seen.add(stop.stopId);
      return true;
    })
    .map((stop) => ({ stop, distance: straightDistance(position, stop) }))
    .sort(
      (a, b) =>
        a.distance - b.distance || a.stop.stopId.localeCompare(b.stop.stopId)
    )
    .slice(0, 3);
}
function aborted() {
  const error = new Error('Cancelled');
  error.name = 'AbortError';
  return error;
}
async function pause(ms: number, signal: AbortSignal) {
  if (signal.aborted) throw aborted();
  if (ms <= 0) return;
  await new Promise<void>((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      reject(aborted());
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      resolve();
    }, ms);
    signal.addEventListener('abort', cancel, { once: true });
  });
}
export async function findNearbyStop(
  stops: StopConfig[],
  position: UserPosition,
  signal: AbortSignal
): Promise<NearbyStopResult | undefined> {
  if (signal.aborted) throw aborted();
  const candidates = closestCandidates(stops, position);
  if (!candidates.length) return undefined;
  const fallback: NearbyStopResult = {
    stop: candidates[0].stop,
    straightDistanceMeters: candidates[0].distance,
    method: 'straight',
    candidateCount: candidates.length,
    position
  };
  // Avoid expensive inter-city walking requests when the user is outside Cádiz.
  if (candidates[0].distance > 5000) return fallback;
  const key =
    position.latitude.toFixed(5) +
    ',' +
    position.longitude.toFixed(5) +
    '|' +
    candidates
      .map(
        ({ stop }) => stop.stopId + ':' + stop.latitude + ',' + stop.longitude
      )
      .join('|');
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < 120000)
    return { ...cached.result, position };
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    // One matrix request compares all three targets, globally paced at <=1 request/second.
    const slot = Math.max(Date.now(), lastRequestAt + 1100);
    lastRequestAt = slot;
    await pause(slot - Date.now(), controller.signal);
    const query = {
      sources: [{ lat: position.latitude, lon: position.longitude }],
      targets: candidates.map(({ stop }) => ({
        lat: stop.latitude,
        lon: stop.longitude
      })),
      costing: 'pedestrian',
      units: 'kilometers'
    };
    const response = await fetch(
      ENDPOINT + '?json=' + encodeURIComponent(JSON.stringify(query)),
      {
        signal: controller.signal,
        headers: {
          'X-Client-Id': 'busmovil-local-prototype',
          'User-Agent': 'TransportesCadiz/0.1'
        }
      }
    );
    if (!response.ok) throw new Error('Routing unavailable');
    const payload = await response.json();
    if (signal.aborted) throw aborted();
    const values = payload?.sources_to_targets?.[0];
    if (
      payload.units !== 'kilometers' ||
      !Array.isArray(values) ||
      values.length !== candidates.length
    )
      throw new Error('Invalid walking matrix');
    const routes = candidates
      .map((candidate, index) => {
        const entry = values.find(
          (value: { to_index?: number }) => value.to_index === index
        );
        if (
          !entry ||
          !Number.isFinite(entry.time) ||
          entry.time < 0 ||
          !Number.isFinite(entry.distance) ||
          entry.distance < 0
        )
          throw new Error('Incomplete walking matrix');
        return {
          candidate,
          seconds: Number(entry.time),
          meters: Number(entry.distance) * 1000
        };
      })
      .sort(
        (a, b) =>
          a.seconds - b.seconds ||
          a.meters - b.meters ||
          a.candidate.distance - b.candidate.distance
      );
    const best = routes[0];
    const result: NearbyStopResult = {
      stop: best.candidate.stop,
      straightDistanceMeters: best.candidate.distance,
      walkingMeters: best.meters,
      walkingSeconds: best.seconds,
      method: 'walking',
      candidateCount: candidates.length,
      position
    };
    if (cache.size >= 32) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), result });
    return result;
  } catch {
    if (signal.aborted) throw aborted();
    return fallback;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', cancel);
  }
}
