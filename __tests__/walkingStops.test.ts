import { beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import {
  clearWalkingCache,
  closestCandidates,
  findNearbyStop,
  isFreshPosition
} from '../src/services/walkingStops';
const position = () => ({
  latitude: 36.53,
  longitude: -6.29,
  observedAt: Date.now(),
  accuracy: 'precise' as const
});
const stops = [1, 2, 3, 4].map((n) => ({
  stopId: String(n),
  label: String(n),
  latitude: 36.53 + n * 0.0001,
  longitude: -6.29
}));
const originalFetch = global.fetch;
beforeEach(() => clearWalkingCache());
afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});
it('limits comparison to three unique stops supplied by the chosen direction', () => {
  expect(
    closestCandidates([stops[0], stops[0], ...stops.slice(1)], position()).map(
      (x) => x.stop.stopId
    )
  ).toEqual(['1', '2', '3']);
});
it('chooses the quickest walking route rather than the closest straight distance and caches the matrix', async () => {
  const request = jest
    .fn<typeof fetch>()
    .mockResolvedValue({
      ok: true,
      json: async () => ({
        units: 'kilometers',
        sources_to_targets: [
          [0, 1, 2].map((i) => ({
            to_index: i,
            time: [180, 60, 120][i],
            distance: [0.2, 0.1, 0.15][i]
          }))
        ]
      })
    } as Response);
  global.fetch = request;
  const result = await findNearbyStop(
    stops,
    position(),
    new AbortController().signal
  );
  expect(result?.stop.stopId).toBe('2');
  expect(result?.walkingSeconds).toBe(60);
  expect(result?.walkingMeters).toBe(100);
  const query = JSON.parse(
    decodeURIComponent(String(request.mock.calls[0][0]).split('?json=')[1])
  );
  expect(query.costing).toBe('pedestrian');
  expect(query.targets).toHaveLength(3);
  await findNearbyStop(stops, position(), new AbortController().signal);
  expect(request).toHaveBeenCalledTimes(1);
});
it.each(['network', 'incomplete'])(
  'falls back without inventing a walking time on %s failure',
  async (kind) => {
    global.fetch = jest.fn<typeof fetch>().mockImplementation(async () => {
      if (kind === 'network') throw new Error('offline');
      return {
        ok: true,
        json: async () => ({ units: 'kilometers', sources_to_targets: [[]] })
      } as Response;
    });
    const result = await findNearbyStop(
      stops,
      position(),
      new AbortController().signal
    );
    expect(result?.stop.stopId).toBe('1');
    expect(result?.method).toBe('straight');
    expect(result?.walkingSeconds).toBeUndefined();
  }
);
it('cancels a pending request instead of returning a fallback selection', async () => {
  global.fetch = jest
    .fn<typeof fetch>()
    .mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) =>
          options?.signal?.addEventListener('abort', () =>
            reject(new Error('aborted'))
          )
        )
    );
  const controller = new AbortController();
  const pending = findNearbyStop(stops, position(), controller.signal);
  await Promise.resolve();
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
});
it('accepts dated approximate fixes but requires recent precise fixes', () => {
  expect(
    isFreshPosition({
      ...position(),
      observedAt: Date.now() - 600000,
      accuracy: 'approximate'
    })
  ).toBe(true);
  expect(
    isFreshPosition({ ...position(), observedAt: Date.now() - 600000 })
  ).toBe(false);
});
