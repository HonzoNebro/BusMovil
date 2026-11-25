import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { it, expect, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProvider, useLanguage } from '../src/i18n/Language';
import { Text } from '../src/i18n/Primitives';
it('persists a manual language and translates UI while retaining stop names', async () => {
  let context!: ReturnType<typeof useLanguage>;
  function Probe() {
    context = useLanguage();
    return (
      <>
        <Text>Información</Text>
        <Text>República Argentina</Text>
      </>
    );
  }
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );
  });
  await act(async () => {
    await context.setChoice('en');
  });
  expect(context.locale).toBe('en-GB');
  expect(JSON.stringify(tree.toJSON())).toContain('Information');
  expect(JSON.stringify(tree.toJSON())).toContain('República Argentina');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    'busmovil.language.v1',
    'en'
  );
  act(() => tree.unmount());
  await act(async () => {
    tree = renderer.create(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );
  });
  expect(context.language).toBe('en');
  await act(async () => {
    await context.setChoice('system');
  });
  act(() => tree.unmount());
  jest.clearAllMocks();
});
