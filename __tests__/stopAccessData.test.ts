import { it, expect } from '@jest/globals';
import { searchStops, stopIndex } from '../src/services/stopSearch';
import { nearbyRecharge, rechargePoints } from '../src/services/rechargePoints';
import { translate } from '../src/i18n/strings';

it('searches globally by ID, accents and line without merging distinct stops', () => {
  expect(searchStops('1311')[0].stopId).toBe('1311');
  expect(searchStops('plaza espana').length).toBeGreaterThan(1);
  expect(new Set(stopIndex.map((s) => s.stopId)).size).toBe(stopIndex.length);
  expect(searchStops('line 7').every((s) => s.lines.includes('7'))).toBe(true);
  expect(searchStops('1123')[0].lines.length).toBeGreaterThan(1);
});
it('separates recharge networks and orders known coordinates before unknown ones', () => {
  const origin = {
    latitude: 36.53,
    longitude: -6.29,
    observedAt: Date.now(),
    accuracy: 'precise' as const
  };
  const points = nearbyRecharge('urban', '', origin);
  expect(points.length).toBe(43);
  expect(points.every((p) => p.network === 'urban')).toBe(true);
  const known = points.filter((p) => p.distance !== undefined);
  expect(known.map((p) => p.distance)).toEqual(
    known.map((p) => p.distance).sort((a, b) => a! - b!)
  );
  if (known.length)
    expect(
      points.slice(0, known.length).every((p) => p.distance !== undefined)
    ).toBe(true);
  expect(nearbyRecharge('consortium', 'gerion').length).toBeGreaterThan(0);
  expect(
    rechargePoints.filter((p) => p.hours).every((p) => Boolean(p.hoursSource))
  ).toBe(true);
});
it('translates navigation without translating official stop names', () => {
  expect(translate('Información', 'en')).toBe('Information');
  expect(translate('A Plaza España', 'en')).toBe('To Plaza España');
  expect(translate('República Argentina', 'en')).toBe('República Argentina');
  expect(translate('Información', 'es')).toBe('Información');
});
