import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { stopMetadata } from '../services/cadizApi';

const KEY = 'busmovil.favoriteStops.v1';
export function useFavoriteStops() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const mounted = useRef(true);
  const busy = useRef(false);
  useEffect(() => {
    mounted.current = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) throw new Error('Invalid favorites');
        if (mounted.current)
          setFavoriteIds([
            ...new Set(
              parsed.filter(
                (id): id is string =>
                  typeof id === 'string' && Boolean(stopMetadata[id])
              )
            )
          ]);
      })
      .catch(() => {
        if (mounted.current)
          setError(
            'No se pudieron leer tus favoritos. Reinicia la app para reintentar.'
          );
      })
      .finally(() => {
        if (mounted.current) setReady(true);
      });
    return () => {
      mounted.current = false;
    };
  }, []);
  const toggleFavorite = useCallback(
    async (stopId: string) => {
      if (
        !ready ||
        busy.current ||
        !stopMetadata[stopId] ||
        error?.startsWith('No se pudieron leer')
      )
        return;
      busy.current = true;
      setSaving(true);
      const next = favoriteIds.includes(stopId)
        ? favoriteIds.filter((id) => id !== stopId)
        : [...favoriteIds, stopId];
      try {
        await AsyncStorage.setItem(KEY, JSON.stringify(next));
        if (mounted.current) {
          setFavoriteIds(next);
          setError(undefined);
        }
      } catch {
        if (mounted.current)
          setError('No se pudo guardar el favorito. Vuelve a intentarlo.');
      } finally {
        busy.current = false;
        if (mounted.current) setSaving(false);
      }
    },
    [favoriteIds, ready, error]
  );
  return { favoriteIds, ready, saving, error, toggleFavorite };
}
