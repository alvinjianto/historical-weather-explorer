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
    80: { description: 'Rain showers: Slight', icon: 'CloudRain' },
    81: { description: 'Rain showers: Moderate', icon: 'CloudRain' },
    82: { description: 'Rain showers: Violent', icon: 'CloudRain' },
    85: { description: 'Snow showers: Slight', icon: 'CloudSnow' },
    86: { description: 'Snow showers: Heavy', icon: 'CloudSnow' },
    95: { description: 'Thunderstorm: Slight or moderate', icon: 'CloudLightning' },
    96: { description: 'Thunderstorm with slight hail', icon: 'CloudLightning' },
    99: { description: 'Thunderstorm with heavy hail', icon: 'CloudLightning' },
  };

  return codes[code] || { description: 'Unknown', icon: 'Cloud' };
};
