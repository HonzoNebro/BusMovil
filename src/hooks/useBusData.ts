import { useCallback, useEffect, useRef, useState } from 'react';

import type { BusDataSnapshot } from '@/types/bus';
import { favouriteStops, fetchBusData } from '@/services/cadizApi';

const DEFAULT_REFRESH_INTERVAL = 60000;

type RefreshTimer = ReturnType<typeof setInterval> | null;

interface UseBusDataResult {
  snapshot: BusDataSnapshot | null;
  isLoading: boolean;
  error?: string;
  refresh: () => void;
}

export function useBusData(refreshInterval = DEFAULT_REFRESH_INTERVAL): UseBusDataResult {
  const [snapshot, setSnapshot] = useState<BusDataSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const refreshTimer = useRef<RefreshTimer>(null);
  const loading = useRef(false);
  const mounted = useRef(true);

  const loadData = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      setIsLoading(true);
      const data = await fetchBusData();
      if (!mounted.current) return;
      setSnapshot((previous) => ({
        ...data,
        arrivals: [...data.arrivals, ...(previous?.arrivals ?? []).filter(
          (arrival) => data.failedStopIds.includes(arrival.stopId)
        )]
      }));
      setError(data.failedStopIds.length
        ? 'Actualización parcial. Algunas paradas no se pudieron consultar; sus datos anteriores pueden estar desactualizados.'
        : undefined);
    } catch (err) {
      console.error('Error fetching bus data', err);
      if (!mounted.current) return;
      setSnapshot((previous) => previous ? {
        ...previous,
        failedStopIds: [...new Set(favouriteStops.map((stop) => stop.stopId))]
      } : null);
      setError('No se pudieron actualizar los datos en tiempo real. Comprueba la conexión. Los datos anteriores pueden estar desactualizados.');
    } finally {
      loading.current = false;
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    mounted.current = true;
    void loadData();
    return () => { mounted.current = false; };
  }, [loadData]);

  useEffect(() => {
    refreshTimer.current = setInterval(() => {
      void loadData();
    }, refreshInterval);

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [loadData, refreshInterval]);

  return {
    snapshot,
    isLoading,
    error,
    refresh
  };
}
