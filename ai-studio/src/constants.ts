/**
 * Open-Meteo Weather Codes
 */
export const getWeatherDescription = (code: number): { description: string; icon: string } => {
  const codes: Record<number, { description: string; icon: string }> = {
    0: { description: 'Clear sky', icon: 'Sun' },
    1: { description: 'Mainly clear', icon: 'CloudSun' },
    2: { description: 'Partly cloudy', icon: 'CloudSun' },
    3: { description: 'Overcast', icon: 'Cloud' },
    45: { description: 'Fog', icon: 'CloudFog' },
    48: { description: 'Depositing rime fog', icon: 'CloudFog' },
    51: { description: 'Drizzle: Light', icon: 'CloudDrizzle' },
    53: { description: 'Drizzle: Moderate', icon: 'CloudDrizzle' },
    55: { description: 'Drizzle: Dense intensity', icon: 'CloudDrizzle' },
    61: { description: 'Rain: Slight', icon: 'CloudRain' },
    63: { description: 'Rain: Moderate', icon: 'CloudRain' },
    65: { description: 'Rain: Heavy intensity', icon: 'CloudRain' },
    71: { description: 'Snow fall: Slight', icon: 'CloudSnow' },
    73: { description: 'Snow fall: Moderate', icon: 'CloudSnow' },
    75: { description: 'Snow fall: Heavy intensity', icon: 'CloudSnow' },
    95: { description: 'Thunderstorm: Slight or moderate', icon: 'CloudLightning' },
  };

  return codes[code] || { description: 'Unknown', icon: 'Cloud' };
};
