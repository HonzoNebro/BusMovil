import { Platform } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PERMISSIONS,
  RESULTS,
  checkMultiple,
  request,
  requestMultiple
} from 'react-native-permissions';

import type { FavouriteStop } from '@/services/cadizApi';
import { favouriteStops } from '@/services/cadizApi';
import type { UserPosition } from '@/services/walkingStops';
import { getFreshPosition } from '@/services/currentLocation';

type StopWithCoordinates = FavouriteStop & {
  latitude: number;
  longitude: number;
};

export interface NearestStopResult extends StopWithCoordinates {
  userPosition?: UserPosition;
  distanceMeters: number;
  accuracy: 'precise' | 'approximate';
  observedAt: number;
}

type PermissionState = 'idle' | 'granted' | 'denied' | 'unavailable';

interface UseNearestStopResult {
  nearestStop?: NearestStopResult;
  status: PermissionState;
  isRequesting: boolean;
  error?: string;
  requestLocation: () => Promise<NearestStopResult | undefined>;
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
  const [nearestStop, setNearestStop] = useState<
    NearestStopResult | undefined
  >();
  const [status, setStatus] = useState<PermissionState>('idle');
  const [error, setError] = useState<string | undefined>();
  const [isRequesting, setIsRequesting] = useState(false);

  const activeRequest = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      activeRequest.current?.abort();
    },
    []
  );

  const requestLocation = useCallback(async (): Promise<
    NearestStopResult | undefined
  > => {
    if (activeRequest.current) return;
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

    const controller = new AbortController();
    activeRequest.current = controller;
    setNearestStop(undefined);
    setIsRequesting(true);
    setError(undefined);

    try {
      let accuracy: 'precise' | 'approximate' = 'precise';
      let permissionResult;
      if (Platform.OS === 'android') {
        const fine = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
        const coarse = PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION;
        let permissions = await checkMultiple([fine, coarse]);
        if (controller.signal.aborted) return;
        if (
          permissions[fine] !== RESULTS.GRANTED &&
          permissions[coarse] !== RESULTS.GRANTED
        ) {
          permissions = await requestMultiple([fine, coarse]);
        }
        if (permissions[fine] === RESULTS.GRANTED)
          permissionResult = RESULTS.GRANTED;
        else if (permissions[coarse] === RESULTS.GRANTED) {
          permissionResult = RESULTS.GRANTED;
          accuracy = 'approximate';
        } else permissionResult = permissions[coarse];
      } else if (Platform.OS === 'ios') {
        permissionResult = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      } else {
        permissionResult = RESULTS.UNAVAILABLE;
      }
      if (controller.signal.aborted) return;
      if (permissionResult === RESULTS.BLOCKED) {
        setStatus('denied');
        setError(
          'La ubicación está bloqueada. Activa los permisos manualmente en los ajustes.'
        );
        return;
      }
      if (permissionResult === RESULTS.UNAVAILABLE) {
        setStatus('unavailable');
        setError('La ubicación no está disponible en este dispositivo.');
        return;
      }
      if (
        permissionResult !== RESULTS.GRANTED &&
        permissionResult !== RESULTS.LIMITED
      ) {
        setStatus('denied');
        setError('No se concedió permiso para acceder a la ubicación.');
        return;
      }
      setStatus('granted');
      const position = await getFreshPosition(
        accuracy === 'precise',
        controller.signal
      );
      if (controller.signal.aborted) return;
      const { latitude, longitude } = position.coords;

      const closest = stopsWithCoordinates.reduce<
        NearestStopResult | undefined
      >((current, stop) => {
        const distance = haversineDistance(
          latitude,
          longitude,
          stop.latitude,
          stop.longitude
        );
        if (!current || distance < current.distanceMeters) {
          return {
            ...stop,
            distanceMeters: distance,
            accuracy,
            observedAt: position.timestamp,
            userPosition: {
              latitude,
              longitude,
              observedAt: position.timestamp,
              accuracy
            }
          };
        }
        return current;
      }, undefined);

      setNearestStop(closest);
      return closest;
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error('Error obteniendo la ubicación del usuario', err);
      setStatus('unavailable');
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? err.code
          : undefined;
      setError(
        code === 2 || code === 5
          ? 'La ubicación del dispositivo está desactivada o no está disponible. Activa el GPS y reintenta.'
          : 'No se pudo obtener una ubicación actualizada. Comprueba el GPS y reintenta.'
      );
    } finally {
      activeRequest.current = null;
      if (!controller.signal.aborted) setIsRequesting(false);
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
