export function convertTemp(celsius: number, unit: 'C' | 'F'): number {
  return unit === 'C' ? Math.round(celsius) : Math.round((celsius * 9 / 5) + 32);
}

export function convertWind(kmh: number, unit: 'km' | 'mi'): number {
  return unit === 'km' ? Math.round(kmh) : Math.round(kmh * 0.621371);
}

export function windUnitLabel(unit: 'km' | 'mi'): string {
  return unit === 'km' ? 'km/h' : 'mph';
}
