import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Modal, Pressable, Text } from 'react-native';
import { expect, it, jest } from '@jest/globals';
import { OfficialTimetable } from '../src/components/StopMap/OfficialTimetable';
it('keeps official tables in the app, switches tables, zooms and returns to its caller', () => {
  const close = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <OfficialTimetable
        visible
        onClose={close}
        returnLabel="Volver a la parada"
      />
    );
  });
  expect(
    tree.root.findByProps({ testID: 'native-frequency-table' })
  ).toBeDefined();
  const width = tree.root.findByProps({ testID: 'native-frequency-table' })
    .props.style.width;
  act(() =>
    tree.root
      .findByProps({ accessibilityLabel: 'Ampliar tabla' })
      .props.onPress()
  );
  expect(
    tree.root.findByProps({ testID: 'native-frequency-table' }).props.style
      .width
  ).toBeGreaterThan(width);
  const tab = tree.root
    .findAllByType(Pressable)
    .find((node) =>
      node
        .findAllByType(Text)
        .some((text) => text.props.children === 'Primeras y últimas salidas')
    )!;
  act(() => tab.props.onPress());
  expect(
    tree.root.findByProps({ testID: 'native-departure-table' })
  ).toBeDefined();
  act(() => tree.root.findByType(Modal).props.onRequestClose());
  expect(close).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});
it('opens a single chosen section without duplicate section tabs', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <OfficialTimetable
        visible
        singleSection
        returnLabel="Volver a Información"
        initialSection="departures"
        onClose={() => undefined}
      />
    );
  });
  expect(
    tree.root.findByProps({ testID: 'native-departure-table' })
  ).toBeDefined();
  expect(
    tree.root
      .findAllByType(Pressable)
      .filter((n) => n.props.accessibilityRole === 'tab')
  ).toHaveLength(0);
  act(() => tree.unmount());
});
