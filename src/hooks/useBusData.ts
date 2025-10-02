import { useCallback, useEffect, useRef, useState } from 'react';

import type { BusDataSnapshot } from '@/types/bus';
import { fetchBusData } from '@/services/cadizApi';

const DEFAULT_REFRESH_INTERVAL = 15000;

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

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchBusData();
      setSnapshot(data);
      setError(undefined);
    } catch (err) {
      console.error('Error fetching bus data', err);
      setError('No se pudieron actualizar los datos en tiempo real.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void loadData();
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
