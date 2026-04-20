import { useState, useCallback } from 'react';
import { Location, WeatherData } from '@/types/weather';
import { parseWeatherResponse } from '@/lib/weatherParser';

export function useWeatherData() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = useCallback(async (loc: Location, date: string, hour: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/weather?latitude=${loc.lat}&longitude=${loc.lng}&start_date=${date}&end_date=${date}`
      );
      if (!response.ok) throw new Error('Failed to fetch weather data');

      const data = await response.json();
      if (!data.hourly?.time) throw new Error('No data available for this date');

      setWeatherData(parseWeatherResponse(data, hour));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { weatherData, loading, error, fetchWeatherData };
}
