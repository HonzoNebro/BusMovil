import React, { createContext, useContext, useMemo } from 'react';

import { useBusData } from '@/hooks/useBusData';
import type { BusDataSnapshot } from '@/types/bus';

interface BusDataContextValue {
  snapshot: BusDataSnapshot | null;
  isLoading: boolean;
  error?: string;
  refresh: () => void;
}

const BusDataContext = createContext<BusDataContextValue | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
}

export function BusDataProvider({ children }: ProviderProps): JSX.Element {
  const { snapshot, isLoading, error, refresh } = useBusData();

  const value = useMemo(
    () => ({
      snapshot,
      isLoading,
      error,
      refresh
    }),
    [snapshot, isLoading, error, refresh]
  );

  return <BusDataContext.Provider value={value}>{children}</BusDataContext.Provider>;
}

export function useBusDataContext(): BusDataContextValue {
  const context = useContext(BusDataContext);

  if (!context) {
    throw new Error('useBusDataContext debe usarse dentro de BusDataProvider');
  }

  return context;
}
