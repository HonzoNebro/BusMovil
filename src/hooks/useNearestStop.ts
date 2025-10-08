import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

import type { FavouriteStop } from '@/services/cadizApi';
import { favouriteStops } from '@/services/cadizApi';

type StopWithCoordinates = FavouriteStop & { latitude: number; longitude: number };

interface NearestStopResult extends StopWithCoordinates {
  distanceMeters: number;
}

type PermissionState = 'idle' | 'granted' | 'denied' | 'unavailable';

interface UseNearestStopResult {
  nearestStop?: NearestStopResult;
  status: PermissionState;
  isRequesting: boolean;
  error?: string;
  requestLocation: () => Promise<void>;
}

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineDistance(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
): number {
  const dLat = toRadians(latitude2 - latitude1);
  const dLon = toRadians(longitude2 - longitude1);

  const lat1 = toRadians(latitude1);
  const lat2 = toRadians(latitude2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export function useNearestStop(): UseNearestStopResult {
  const [nearestStop, setNearestStop] = useState<NearestStopResult | undefined>();
  const [status, setStatus] = useState<PermissionState>('idle');
  const [error, setError] = useState<string | undefined>();
  const [isRequesting, setIsRequesting] = useState(false);

  const requestLocation = useCallback(async () => {
    if (!favouriteStops.length) {
      setError('No hay paradas configuradas.');
      return;
    }

    const stopsWithCoordinates = favouriteStops.filter(
      (stop): stop is StopWithCoordinates =>
        typeof stop.latitude === 'number' && typeof stop.longitude === 'number'
    );

    if (!stopsWithCoordinates.length) {
      setError('No hay paradas con coordenadas para calcular la distancia.');
      return;
    }

    setIsRequesting(true);
    setError(undefined);

    try {
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();

      if (permissionStatus !== 'granted') {
        setStatus('denied');
        setError('No se concedió permiso para acceder a la ubicación.');
        return;
      }

      setStatus('granted');

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const { latitude, longitude } = position.coords;

      const closest = stopsWithCoordinates.reduce<NearestStopResult | undefined>(
        (current, stop) => {
          const distance = haversineDistance(latitude, longitude, stop.latitude, stop.longitude);
          if (!current || distance < current.distanceMeters) {
            return { ...stop, distanceMeters: distance };
          }
          return current;
        },
        undefined
      );

      setNearestStop(closest);
    } catch (err) {
      console.error('Error obteniendo la ubicación del usuario', err);
      setStatus('unavailable');
      setError('No se pudo obtener la ubicación actual.');
    } finally {
      setIsRequesting(false);
    }
  }, []);

  return {
    nearestStop,
    status,
    isRequesting,
    error,
    requestLocation
  };
}
