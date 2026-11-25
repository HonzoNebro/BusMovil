import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Platform } from 'react-native';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import { checkMultiple, requestMultiple, RESULTS, PermissionStatus } from 'react-native-permissions';
import { useNearestStop } from '../src/hooks/useNearestStop';
import { stopMetadata } from '../src/services/cadizApi';

jest.mock('react-native-geolocation-service', () => ({ watchPosition: jest.fn(), clearWatch: jest.fn() }));
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: { IOS: { LOCATION_WHEN_IN_USE: 'ios' }, ANDROID: { ACCESS_FINE_LOCATION: 'fine', ACCESS_COARSE_LOCATION: 'coarse' } },
  RESULTS: { GRANTED: 'granted', DENIED: 'denied', BLOCKED: 'blocked', UNAVAILABLE: 'unavailable', LIMITED: 'limited' },
  checkMultiple: jest.fn(), requestMultiple: jest.fn(), request: jest.fn()
}));

const permissionState = (fine: PermissionStatus, coarse: PermissionStatus) => (
  { fine, coarse } as unknown as Awaited<ReturnType<typeof checkMultiple>>
);

let current: ReturnType<typeof useNearestStop>;
let tree: renderer.ReactTestRenderer;
function Harness() { current = useNearestStop(); return null; }
beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  jest.mocked(checkMultiple).mockResolvedValue(permissionState(RESULTS.GRANTED, RESULTS.GRANTED));
  act(() => { tree = renderer.create(<Harness />); });
});
afterEach(() => { act(() => tree.unmount()); jest.restoreAllMocks(); jest.resetAllMocks(); });

function fix(stopId: string) {
  const stop = stopMetadata[stopId];
  jest.mocked(Geolocation.watchPosition).mockImplementation((success) => {
    success({ timestamp: Date.now(), coords: { latitude: stop.latitude, longitude: stop.longitude } } as GeoPosition);
    return 42;
  });
}

it('recalculates on each explicit request, including the same stop twice, and clears observations', async () => {
  for (const stopId of ['1101', '1109', '1109']) {
    fix(stopId);
    await act(async () => { await current.requestLocation(); });
    expect(current.nearestStop?.stopId).toBe(stopId);
    expect(current.nearestStop?.distanceMeters).toBeLessThan(1);
  }
  expect(Geolocation.clearWatch).toHaveBeenCalledTimes(3);
});

it('uses an already granted approximate permission even if fine location is blocked', async () => {
  jest.mocked(checkMultiple).mockResolvedValue(permissionState(RESULTS.BLOCKED, RESULTS.GRANTED));
  fix('1101');
  await act(async () => { await current.requestLocation(); });
  expect(current.nearestStop?.accuracy).toBe('approximate');
  expect(requestMultiple).not.toHaveBeenCalled();
  expect(Geolocation.watchPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), expect.objectContaining({ enableHighAccuracy: false }));
});

it('accepts approximate location selected in the permission dialog', async () => {
  jest.mocked(checkMultiple).mockResolvedValue(permissionState(RESULTS.DENIED, RESULTS.DENIED));
  jest.mocked(requestMultiple).mockResolvedValue(permissionState(RESULTS.BLOCKED, RESULTS.GRANTED));
  fix('1101');
  await act(async () => { await current.requestLocation(); });
  expect(current.status).toBe('granted');
  expect(current.nearestStop?.accuracy).toBe('approximate');
});

it('reports denied permission without querying the provider', async () => {
  jest.mocked(checkMultiple).mockResolvedValue(permissionState(RESULTS.DENIED, RESULTS.DENIED));
  jest.mocked(requestMultiple).mockResolvedValue(permissionState(RESULTS.DENIED, RESULTS.DENIED));
  await act(async () => { await current.requestLocation(); });
  expect(current.status).toBe('denied');
  expect(Geolocation.watchPosition).not.toHaveBeenCalled();
});

it('cancels its observation when unmounted and ignores the late completion', async () => {
  jest.mocked(Geolocation.watchPosition).mockReturnValue(5);
  let pending: Promise<unknown>;
  await act(async () => { pending = current.requestLocation(); await Promise.resolve(); });
  act(() => tree.unmount());
  await pending!;
  expect(Geolocation.clearWatch).toHaveBeenCalledWith(5);
});
