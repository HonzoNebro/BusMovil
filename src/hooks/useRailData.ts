import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { parseRailFeed, RAIL_URLS, type RailSnapshot } from '../services/rail';
export function useRailData(includeVehicles = true) {
  const [snapshot, setSnapshot] = useState<RailSnapshot>({ failed: [] });
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [attempt, setAttempt] = useState(0);
  const refresh = useCallback(() => setAttempt((n) => n + 1), []);
  useEffect(() => {
    let live = true,
      generation = 0,
      busy = false;
    let controllers: AbortController[] = [];
    const cancel = () => {
      generation++;
      controllers.forEach((c) => c.abort());
      controllers = [];
      busy = false;
    };
    const load = async () => {
      if (!live || busy || AppState.currentState !== 'active') return;
      busy = true;
      const current = ++generation;
      setLoading(true);
      const kinds = includeVehicles
        ? (['vehicles', 'updates'] as const)
        : (['updates'] as const);
      const results = await Promise.allSettled(
        kinds.map(async (kind) => {
          const controller = new AbortController();
          controllers.push(controller);
          const timeout = setTimeout(() => controller.abort(), 15000);
          try {
            const response = await fetch(RAIL_URLS[kind], {
              signal: controller.signal
            });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const json: unknown = await response.json();
            return kind === 'vehicles'
              ? { kind, feed: parseRailFeed(json, 'vehicles') }
              : { kind, feed: parseRailFeed(json, 'updates') };
          } finally {
            clearTimeout(timeout);
          }
        })
      );
      if (!live || generation !== current) return;
      busy = false;
      controllers = [];
      setLoading(false);
      setNow(Date.now());
      setSnapshot((previous) => {
        const next = { ...previous, failed: [] as string[] };
        results.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            const value = result.value;
            if (value.kind === 'vehicles') {
              if (
                !next.vehicles ||
                value.feed.observedAt >= next.vehicles.observedAt
              )
                next.vehicles = value.feed;
            } else if (
              !next.updates ||
              value.feed.observedAt >= next.updates.observedAt
            )
              next.updates = value.feed;
          } else next.failed.push(kinds[i]);
        });
        return next;
      });
    };
    void load();
    const interval = setInterval(() => {
      setNow(Date.now());
      void load();
    }, 20000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNow(Date.now());
        void load();
      } else {
        cancel();
        setLoading(false);
      }
    });
    return () => {
      live = false;
      cancel();
      clearInterval(interval);
      sub.remove();
    };
  }, [attempt, includeVehicles]);
  return { snapshot, loading, refresh, now };
}
