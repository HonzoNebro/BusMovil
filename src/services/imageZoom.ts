export interface ZoomPoint {
  x: number;
  y: number;
}
export interface ZoomTransform {
  scale: number;
  x: number;
  y: number;
}
export interface ZoomFrame {
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
}
export const initialZoom: ZoomTransform = { scale: 1, x: 0, y: 0 };
export function boundZoom(
  value: ZoomTransform,
  frame: ZoomFrame
): ZoomTransform {
  const scale = Math.max(1, Math.min(6, value.scale));
  const maxX = Math.max(0, (frame.imageWidth * scale - frame.width) / 2),
    maxY = Math.max(0, (frame.imageHeight * scale - frame.height) / 2);
  return {
    scale,
    x: Math.max(-maxX, Math.min(maxX, value.x)),
    y: Math.max(-maxY, Math.min(maxY, value.y))
  };
}
const center = (points: ZoomPoint[]) => ({
  x: points.reduce((n, p) => n + p.x, 0) / points.length,
  y: points.reduce((n, p) => n + p.y, 0) / points.length
});
export function moveZoom(
  start: ZoomTransform,
  from: ZoomPoint[],
  to: ZoomPoint[],
  frame: ZoomFrame
): ZoomTransform {
  if (!from.length || from.length !== to.length) return start;
  const a = center(from),
    b = center(to);
  const distance = (p: ZoomPoint[]) =>
    Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  const ratio =
    from.length > 1 ? distance(to) / Math.max(1, distance(from)) : 1;
  const scale = Math.max(1, Math.min(6, start.scale * ratio)),
    factor = scale / start.scale;
  return boundZoom(
    {
      scale,
      x: b.x - frame.width / 2 - (a.x - frame.width / 2 - start.x) * factor,
      y: b.y - frame.height / 2 - (a.y - frame.height / 2 - start.y) * factor
    },
    frame
  );
}
