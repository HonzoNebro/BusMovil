import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import { getFreshPosition, MAX_APPROXIMATE_AGE_MS } from '../src/services/currentLocation';

jest.mock('react-native-geolocation-service', () => ({ watchPosition: jest.fn(), clearWatch: jest.fn() }));
let success: (position: GeoPosition) => void;
beforeEach(() => {
  jest.useFakeTimers();
  jest.mocked(Geolocation.watchPosition).mockImplementation((callback) => { success = callback; return 7; });
});
afterEach(() => { jest.useRealTimers(); jest.resetAllMocks(); });
const position = (timestamp: number) => ({ timestamp, coords: { latitude: 36.5, longitude: -6.3 } } as GeoPosition);

it('ignores a stale first Fused callback and resolves only with a new fix', async () => {
  const started = Date.now();
  const pending = getFreshPosition(true, new AbortController().signal);
  success(position(started - 1000));
  expect(Geolocation.clearWatch).not.toHaveBeenCalled();
  const fresh = position(started);
  success(fresh);
  expect(await pending).toBe(fresh);
  expect(Geolocation.clearWatch).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});

it('times out after 15 seconds without accepting the old position', async () => {
  const pending = getFreshPosition(true, new AbortController().signal);
  const assertion = expect(pending).rejects.toThrow('15 segundos');
  success(position(Date.now() - 1000));
  jest.advanceTimersByTime(15000);
  await assertion;
  expect(Geolocation.clearWatch).toHaveBeenCalledWith(7);
  expect(jest.getTimerCount()).toBe(0);
});

it('cleans up on cancellation', async () => {
  const controller = new AbortController();
  const pending = getFreshPosition(true, controller.signal);
  const assertion = expect(pending).rejects.toThrow('cancelada');
  controller.abort(); await assertion;
  expect(Geolocation.clearWatch).toHaveBeenCalledWith(7);
  expect(jest.getTimerCount()).toBe(0);
});

it('accepts a dated approximate position within the approved 15-minute limit', async () => {
  const fix = position(Date.now() - 5 * 60 * 1000);
  const pending = getFreshPosition(false, new AbortController().signal);
  success(fix);
  expect(await pending).toBe(fix);
  expect(Geolocation.clearWatch).toHaveBeenCalledWith(7);
});
it('rejects approximate positions older than 15 minutes and cleans up after timeout', async () => {
  const pending = getFreshPosition(false, new AbortController().signal);
  const assertion = expect(pending).rejects.toThrow('15 segundos');
  success(position(Date.now() - MAX_APPROXIMATE_AGE_MS - 1));
  jest.advanceTimersByTime(15000); await assertion;
  expect(Geolocation.clearWatch).toHaveBeenCalledWith(7);
});
