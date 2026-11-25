import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AppState } from 'react-native';
import { it, expect, jest, afterEach } from '@jest/globals';
import { useRailData } from '../src/hooks/useRailData';
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  currentState: 'active',
  addEventListener: jest.fn(() => ({ remove: jest.fn() }))
}));
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});
it('retains the successful half and original timestamps after partial and total failures', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-11-04T12:00:00Z'));
  jest.replaceProperty(AppState, 'currentState', 'active');
  const feed = { header: { timestamp: Date.now() / 1000 }, entity: [] };
  const fetcher = jest
    .spyOn(global, 'fetch')
    .mockResolvedValue({ ok: true, json: async () => feed } as Response);
  let current!: ReturnType<typeof useRailData>;
  function Harness() {
    current = useRailData();
    return null;
  }
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<Harness />);
  });
  const original = current.snapshot.vehicles!.observedAt;
  expect(current.snapshot.failed).toEqual([]);
  fetcher.mockImplementation(async (input) => {
    if (String(input).includes('vehicle_positions')) throw new Error('offline');
    return {
      ok: true,
      json: async () => ({
        header: { timestamp: (Date.now() + 1000) / 1000 },
        entity: []
      })
    } as Response;
  });
  await act(async () => {
    current.refresh();
  });
  expect(current.snapshot.failed).toEqual(['vehicles']);
  expect(current.snapshot.vehicles!.observedAt).toBe(original);
  expect(current.snapshot.updates!.observedAt).toBe(original + 1000);
  fetcher.mockRejectedValue(new Error('offline'));
  await act(async () => {
    current.refresh();
  });
  expect(current.snapshot.failed).toEqual(['vehicles', 'updates']);
  expect(current.snapshot.updates!.observedAt).toBe(original + 1000);
  act(() => tree.unmount());
});
it('aborts outstanding requests and removes polling when unmounted', async () => {
  jest.useFakeTimers();
  jest.replaceProperty(AppState, 'currentState', 'active');
  const signals: AbortSignal[] = [];
  const fetcher = jest
    .spyOn(global, 'fetch')
    .mockImplementation((_input, init) => {
      signals.push(init!.signal!);
      return new Promise<Response>(() => undefined);
    });
  function Harness() {
    useRailData();
    return null;
  }
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<Harness />);
  });
  expect(signals).toHaveLength(2);
  act(() => tree.unmount());
  expect(signals.every((s) => s.aborted)).toBe(true);
  const calls = fetcher.mock.calls.length;
  await act(async () => {
    jest.advanceTimersByTime(60000);
  });
  expect(fetcher).toHaveBeenCalledTimes(calls);
});
it('stops network work in the background and refreshes on returning to the foreground', async () => {
  jest.useFakeTimers();
  jest.replaceProperty(AppState, 'currentState', 'active');
  const fetcher = jest
    .spyOn(global, 'fetch')
    .mockImplementation(() => new Promise<Response>(() => undefined));
  function Harness() {
    useRailData();
    return null;
  }
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<Harness />);
  });
  const listener = jest.mocked(AppState.addEventListener).mock.calls.at(-1)![1];
  expect(fetcher).toHaveBeenCalledTimes(2);
  act(() => {
    AppState.currentState = 'background';
    listener('background');
    jest.advanceTimersByTime(60000);
  });
  expect(fetcher).toHaveBeenCalledTimes(2);
  await act(async () => {
    AppState.currentState = 'active';
    listener('active');
  });
  expect(fetcher).toHaveBeenCalledTimes(4);
  act(() => tree.unmount());
});
it('does not request vehicle positions when the screen uses a static plan', async () => {
  jest.useFakeTimers();
  jest.replaceProperty(AppState, 'currentState', 'active');
  const fetcher = jest
    .spyOn(global, 'fetch')
    .mockResolvedValue({
      ok: true,
      json: async () => ({
        header: { timestamp: Date.now() / 1000 },
        entity: []
      })
    } as Response);
  function Harness() {
    useRailData(false);
    return null;
  }
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<Harness />);
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(String(fetcher.mock.calls[0][0])).toContain('trip_updates');
  act(() => tree.unmount());
});
