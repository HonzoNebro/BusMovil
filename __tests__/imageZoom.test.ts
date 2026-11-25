import { it, expect } from '@jest/globals';
import { initialZoom, moveZoom, boundZoom } from '../src/services/imageZoom';
const frame = { width: 400, height: 600, imageWidth: 400, imageHeight: 600 };
it('pinches around the finger midpoint instead of jumping to the image centre', () => {
  const result = moveZoom(
    initialZoom,
    [
      { x: 250, y: 250 },
      { x: 350, y: 250 }
    ],
    [
      { x: 200, y: 250 },
      { x: 400, y: 250 }
    ],
    frame
  );
  expect(result.scale).toBe(2);
  expect(result.x).toBe(-100);
  expect(result.y).toBe(50);
});
it('pans with one finger and clamps the image within the viewport', () => {
  const zoomed = { scale: 2, x: 0, y: 0 };
  expect(
    moveZoom(zoomed, [{ x: 200, y: 300 }], [{ x: 250, y: 350 }], frame)
  ).toEqual({ scale: 2, x: 50, y: 50 });
  expect(boundZoom({ scale: 2, x: 999, y: -999 }, frame)).toEqual({
    scale: 2,
    x: 200,
    y: -300
  });
});
it('does not zoom below fit or exceed six times, and handles finger transitions without a jump', () => {
  expect(boundZoom({ scale: 0.2, x: 50, y: 50 }, frame)).toEqual(initialZoom);
  expect(boundZoom({ scale: 100, x: 0, y: 0 }, frame).scale).toBe(6);
  const current = { scale: 2, x: 25, y: 10 };
  expect(
    moveZoom(
      current,
      [
        { x: 100, y: 100 },
        { x: 200, y: 100 }
      ],
      [{ x: 100, y: 100 }],
      frame
    )
  ).toEqual(current);
});
