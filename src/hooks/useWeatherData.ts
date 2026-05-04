import { useState, useCallback, useRef } from 'react';
import { Location, WeatherData } from '@/types/weather';
import { parseWeatherResponse } from '@/lib/weatherParser';

export function useWeatherData() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchWeatherData = useCallback(async (loc: Location, date: string, hour: number) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/weather?latitude=${loc.lat}&longitude=${loc.lng}&start_date=${date}&end_date=${date}`
      );
      if (!response.ok) throw new Error('Failed to fetch weather data');

      const data = await response.json();
      if (!data.hourly?.time) throw new Error('No data available for this date');

      if (requestId !== requestIdRef.current) return;
      setWeatherData(parseWeatherResponse(data, hour));
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'An error occurred');
      setWeatherData(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  return { weatherData, loading, error, fetchWeatherData };
}
