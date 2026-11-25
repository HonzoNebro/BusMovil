import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Pressable, Text } from 'react-native';
import { it, expect, jest } from '@jest/globals';
import { RailScreen } from '../src/components/RailScreen';
import { RailPlan } from '../src/components/RailPlan';
import { stopsForLines } from '../src/services/rail';
jest.mock('../src/hooks/useRailData', () => ({
  useRailData: () => ({
    snapshot: { failed: [] },
    loading: false,
    refresh: jest.fn(),
    now: Date.parse('2026-11-04T12:00:00+01:00')
  })
}));
it('shows scheduled trains and switches to the campus branch without leaving an incompatible station', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<RailScreen onClose={() => undefined} />);
  });
  expect(
    tree.root.findAllByProps({ testID: 'rail-arrival' }).length
  ).toBeGreaterThan(0);
  expect(
    tree.root
      .findAllByType(Text)
      .some((n) => String(n.props.children).includes('Horario programado'))
  ).toBe(true);
  act(() =>
    tree.root
      .findAllByType(Pressable)
      .find((n) =>
        n.findAllByType(Text).some((t) => t.props.children === 'C1a')
      )!
      .props.onPress()
  );
  expect(tree.root.findByType(RailPlan).props.mode).toBe('commuter');
  expect(
    stopsForLines(['C1a']).some((s) =>
      tree.root
        .findByProps({ testID: 'rail-station-selector' })
        .findAllByType(Text)
        .some((n) => String(n.props.children).includes(s.name))
    )
  ).toBe(true);
  act(() => tree.unmount());
});
it('opens Trambahía with only T1 and returns to the home screen', () => {
  const close = jest.fn();
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<RailScreen onClose={close} />);
  });
  expect(
    tree.root
      .findAllByType(Pressable)
      .filter((n) =>
        n.findAllByType(Text).some((t) => t.props.children === 'Todas')
      )
  ).toHaveLength(0);
  act(() =>
    tree.root
      .findAllByType(Pressable)
      .find((n) =>
        n.findAllByType(Text).some((t) => t.props.children === 'T1')
      )!
      .props.onPress()
  );
  expect(tree.root.findByType(RailPlan).props.mode).toBe('tram');
  expect(tree.root.findAllByType('WebView' as never)).toHaveLength(0);
  act(() =>
    tree.root
      .findAllByType(Pressable)
      .find((n) => n.props.accessibilityLabel === 'Volver a Transportes Cádiz')!
      .props.onPress()
  );
  expect(close).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});
