export function parseCoordinate(value: string | null, min: number, max: number): number | null {
  if (!value) return null;
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) return null;
  return coordinate;
}
