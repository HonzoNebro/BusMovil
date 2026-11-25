import { expect, it } from '@jest/globals';
import { distanceLabel } from '../src/services/distanceLabel';
it('uses meters nearby and localized kilometers for distant stops', () => {
  expect(distanceLabel(235.2, 'es-ES')).toBe('235 m');
  expect(distanceLabel(487210, 'es-ES')).toBe('487,2 km');
  expect(distanceLabel(487210, 'en-GB')).toBe('487.2 km');
});
