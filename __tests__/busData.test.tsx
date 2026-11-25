import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { fetchBusData } from '../src/services/cadizApi';
import { useBusData } from '../src/hooks/useBusData';
import type { BusDataSnapshot, BusStopArrival } from '../src/types/bus';
jest.mock('../src/services/cadizApi', () => ({
  fetchBusData: jest.fn(), favouriteStops: [{ stopId: '1101' }, { stopId: '1109' }]
}));
const oldTime = '2026-10-28T10:00:00.000Z';
const arrival = (stopId: string): BusStopArrival => ({ stopId, stopName: stopId, line: '1', configuredLine: '1', directionId: 'a', directionName: 'A', destination: 'A', arrivalInMinutes: 5, observedAt: oldTime });
const original: BusDataSnapshot = { arrivals: [arrival('1101'), arrival('1109')], generatedAt: oldTime, failedStopIds: [] };
let current: ReturnType<typeof useBusData>;
let tree: renderer.ReactTestRenderer;
function Harness() { current = useBusData(); return null; }
beforeEach(async () => {
  jest.useFakeTimers(); jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.mocked(fetchBusData).mockResolvedValue(original);
  await act(async () => { tree = renderer.create(<Harness />); });
});
afterEach(() => { act(() => tree.unmount()); jest.useRealTimers(); jest.restoreAllMocks(); jest.resetAllMocks(); });
it('keeps data and its timestamp after total failure and marks it stale', async () => {
  jest.mocked(fetchBusData).mockRejectedValue(new Error('offline'));
  await act(async () => { current.refresh(); });
  expect(current.snapshot?.generatedAt).toBe(oldTime);
  expect(current.snapshot?.arrivals).toEqual(original.arrivals);
  expect(current.snapshot?.failedStopIds).toEqual(['1101', '1109']);
  expect(current.error).toContain('conexión');
});
it('updates successful stops and retains only failed stops with original observation dates', async () => {
  jest.mocked(fetchBusData).mockResolvedValue({ arrivals: [], generatedAt: '2026-10-28T10:01:00.000Z', failedStopIds: ['1109'] });
  await act(async () => { current.refresh(); });
  expect(current.snapshot?.arrivals).toEqual([arrival('1109')]);
  expect(current.error).toContain('parcial');
});
it('accepts a successful empty response and clears old estimates and warnings', async () => {
  jest.mocked(fetchBusData).mockResolvedValue({ arrivals: [], generatedAt: '2026-10-28T10:01:00.000Z', failedStopIds: [] });
  await act(async () => { current.refresh(); });
  expect(current.snapshot?.arrivals).toEqual([]);
  expect(current.error).toBeUndefined();
});
it('does not overlap manual refreshes', async () => {
  let resolve!: (data: BusDataSnapshot) => void;
  jest.mocked(fetchBusData).mockReturnValue(new Promise((done) => { resolve = done; }));
  act(() => { current.refresh(); current.refresh(); });
  expect(fetchBusData).toHaveBeenCalledTimes(2);
  await act(async () => { resolve(original); });
});

it('retries automatically every minute after failure and restores fresh status only after success', async()=>{
  jest.mocked(fetchBusData).mockRejectedValueOnce(new Error('offline'));
  await act(async()=>{jest.advanceTimersByTime(60000);});
  expect(current.error).toBeDefined();expect(current.snapshot?.generatedAt).toBe(oldTime);
  const newTime='2026-10-28T10:02:00.000Z';
  jest.mocked(fetchBusData).mockResolvedValueOnce({...original,generatedAt:newTime,arrivals:original.arrivals.map((item)=>({...item,observedAt:newTime}))});
  await act(async()=>{jest.advanceTimersByTime(60000);});
  expect(current.error).toBeUndefined();expect(current.snapshot?.failedStopIds).toEqual([]);expect(current.snapshot?.generatedAt).toBe(newTime);
});
