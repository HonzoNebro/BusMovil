import { it, expect } from '@jest/globals';
import { balanceFare } from '../src/services/balanceFare';
it('keeps urban and Consortium reference fares separate', () => {
  const now = new Date(2026, 10, 4);
  expect(balanceFare('bonobus-cadiz', now)?.cents).toBe(42);
  expect(balanceFare('ctan', now)?.cents).toBe(77);
  expect(balanceFare(undefined, now)).toBeUndefined();
});
it('does not present expired or not-yet-valid fares as current', () => {
  expect(balanceFare('bonobus-cadiz', new Date(2027, 0, 1))).toBeUndefined();
  expect(balanceFare('ctan', new Date(2025, 11, 31))).toBeUndefined();
});
