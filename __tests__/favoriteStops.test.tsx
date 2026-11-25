import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFavoriteStops } from '../src/hooks/useFavoriteStops';
let value: ReturnType<typeof useFavoriteStops>;
let tree: renderer.ReactTestRenderer;
function Probe() {
  value = useFavoriteStops();
  return null;
}
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
afterEach(() => {
  act(() => tree?.unmount());
  jest.restoreAllMocks();
});
it('saves favorites durably, restores after remount and removes them', async () => {
  await act(async () => {
    tree = renderer.create(<Probe />);
  });
  await act(async () => {
    await value.toggleFavorite('1101');
  });
  expect(value.favoriteIds).toEqual(['1101']);
  act(() => tree.unmount());
  await act(async () => {
    tree = renderer.create(<Probe />);
  });
  expect(value.favoriteIds).toEqual(['1101']);
  await act(async () => {
    await value.toggleFavorite('1101');
  });
  expect(value.favoriteIds).toEqual([]);
  expect(await AsyncStorage.getItem('busmovil.favoriteStops.v1')).toBe('[]');
});
it('does not claim a favorite was saved if persistence fails', async () => {
  await act(async () => {
    tree = renderer.create(<Probe />);
  });
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk'));
  await act(async () => {
    await value.toggleFavorite('1101');
  });
  expect(value.favoriteIds).toEqual([]);
  expect(value.error).toContain('No se pudo guardar');
});
it('does not overwrite unreadable saved favorites', async () => {
  await AsyncStorage.setItem('busmovil.favoriteStops.v1', 'broken');
  await act(async () => {
    tree = renderer.create(<Probe />);
  });
  expect(value.error).toContain('No se pudieron leer');
  await act(async () => {
    await value.toggleFavorite('1101');
  });
  expect(await AsyncStorage.getItem('busmovil.favoriteStops.v1')).toBe(
    'broken'
  );
});
