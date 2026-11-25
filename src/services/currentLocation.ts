import Geolocation, { GeoPosition } from 'react-native-geolocation-service';

export const MAX_APPROXIMATE_AGE_MS = 15 * 60 * 1000;

/** Precise fixes must be new; Android coarse fixes may be throttled and are explicitly dated. */
export function getFreshPosition(precise: boolean, signal: AbortSignal): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    let watchId: number | undefined;
    let finished = false;
    const finish = (position?: GeoPosition, error?: unknown) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      if (watchId !== undefined) Geolocation.clearWatch(watchId);
      if (position) resolve(position);
      else reject(error);
    };
    const cancel = () => finish(undefined, new Error('Solicitud de ubicación cancelada'));
    const timer = setTimeout(() => finish(undefined, new Error('No llegó una posición GPS válida en 15 segundos')), 15000);
    if (signal.aborted) { cancel(); return; }
    signal.addEventListener('abort', cancel);
    try {
      watchId = Geolocation.watchPosition((position) => {
        if (!Number.isFinite(position.timestamp)) return;
        if (precise && position.timestamp < startedAt) return;
        if (!precise && Date.now() - position.timestamp > MAX_APPROXIMATE_AGE_MS) return;
        if (!Number.isFinite(position.coords.latitude) || !Number.isFinite(position.coords.longitude)) return;
        finish(position);
      }, (error) => finish(undefined, error), {
        enableHighAccuracy: precise,
        distanceFilter: 0,
        interval: 1000,
        fastestInterval: 1000
      });
      // A provider can invoke its callback synchronously before returning the observation ID.
      if (finished) Geolocation.clearWatch(watchId);
    } catch (error) { finish(undefined, error); }
  });
}
