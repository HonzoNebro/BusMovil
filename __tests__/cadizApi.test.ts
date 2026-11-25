import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { fetchBusData } from '../src/services/cadizApi';
let original: typeof fetch;
beforeEach(() => { original = global.fetch; jest.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => { global.fetch = original; jest.restoreAllMocks(); jest.useRealTimers(); });
const ok = (rows: unknown[] = []) => ({ ok: true, text: async () => JSON.stringify(rows) } as Response);
it('reports valid empty responses as success and queries each stop only once', async () => {
  const mock = jest.fn<typeof fetch>().mockResolvedValue(ok()); global.fetch = mock;
  const data = await fetchBusData();
  expect(data.failedStopIds).toEqual([]); expect(data.arrivals).toEqual([]);
  const urls = mock.mock.calls.map(([url]) => String(url));
  expect(new Set(urls).size).toBe(urls.length);
});
it('throws when all requests fail instead of advancing the update timestamp', async () => {
  global.fetch = jest.fn<typeof fetch>().mockRejectedValue(new Error('offline'));
  await expect(fetchBusData()).rejects.toThrow('conexión');
});
it('reports partial failures and timestamps valid arrivals', async () => {
  global.fetch = jest.fn<typeof fetch>().mockImplementation(async (url) => {
    if (String(url).includes('busstop=1109&')) throw new Error('failed stop');
    return ok([{ iMinHastaPaso: '2', iIdLinea: '1', sParadaDestino: 'Cortadura' }]);
  });
  const data = await fetchBusData();
  expect(data.failedStopIds).toEqual(['1109']);
  expect(data.arrivals.length).toBeGreaterThan(0);
  expect(data.arrivals.every((row) => Number.isFinite(Date.parse(row.observedAt)))).toBe(true);
  expect(data.arrivals.some((row) => row.stopId === '1109')).toBe(false);
});
it('aborts requests taking longer than 15 seconds', async () => {
  jest.useFakeTimers();
  global.fetch = jest.fn<typeof fetch>().mockImplementation((_url, options) => new Promise((_resolve, reject) => {
    options?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  const pending = fetchBusData();
  const assertion = expect(pending).rejects.toThrow('conexión');
  await jest.advanceTimersByTimeAsync(15000); await assertion;
  expect(jest.getTimerCount()).toBe(0);
});
