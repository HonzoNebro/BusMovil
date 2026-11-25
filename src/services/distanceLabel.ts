/** Presentation only: never influences stop selection or routing. */
export function distanceLabel(meters: number, locale: string): string {
  const kilometers = meters >= 1000;
  const value = kilometers ? meters / 1000 : meters;
  return (
    value.toLocaleString(locale, {
      maximumFractionDigits: kilometers ? 1 : 0
    }) + (kilometers ? ' km' : ' m')
  );
}
