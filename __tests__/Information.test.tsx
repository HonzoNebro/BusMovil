import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Pressable, TextInput } from 'react-native';
import { expect, it } from '@jest/globals';
import { Information } from '../src/components/Information';
it('offers four sections, searches recharge addresses and opens departures directly', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<Information visible onClose={() => undefined} />);
  });
  const press = (label: string) =>
    act(() =>
      tree.root
        .findAllByType(Pressable)
        .find((n) => n.props.accessibilityLabel === label)!
        .props.onPress()
    );
  for (const label of [
    'Tarifas',
    'Puntos de recarga',
    'Frecuencias',
    'Primeras y últimas salidas'
  ])
    expect(
      tree.root
        .findAllByType(Pressable)
        .some((n) => n.props.accessibilityLabel === label)
    ).toBe(true);
  press('Puntos de recarga');
  act(() => tree.root.findByType(TextInput).props.onChangeText('gerion'));
  expect(JSON.stringify(tree.toJSON())).toContain('GERION');
  expect(JSON.stringify(tree.toJSON())).not.toContain('Astilleros');
  press('Volver a Información y opciones');
  press('Primeras y últimas salidas');
  expect(
    tree.root.findByProps({ testID: 'native-departure-table' })
  ).toBeDefined();
  act(() => tree.unmount());
});
