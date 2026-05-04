import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWeatherData } from '@/hooks/useWeatherData';

const location = { lat: 51.505, lng: -0.09 };

function weatherResponse(temp: number) {
  return {
    hourly: {
      time: Array.from({ length: 24 }, (_, hour) => `2026-05-03T${String(hour).padStart(2, '0')}:00`),
      temperature_2m: Array.from({ length: 24 }, () => temp),
      apparent_temperature: Array.from({ length: 24 }, () => temp),
      relative_humidity_2m: Array.from({ length: 24 }, () => 50),
      wind_speed_10m: Array.from({ length: 24 }, () => 10),
      precipitation: Array.from({ length: 24 }, () => 0),
      weather_code: Array.from({ length: 24 }, () => 0),
    },
  };
}

function deferredResponse(temp: number) {
  let resolve!: (value: Response) => void;
  const promise = new Promise<Response>((res) => {
    resolve = res;
  });
  return {
    promise,
    resolve: () => resolve({
      ok: true,
      json: async () => weatherResponse(temp),
    } as Response),
  };
}

describe('useWeatherData', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ignores stale responses when a newer weather request finishes first', async () => {
    const older = deferredResponse(10);
    const newer = deferredResponse(20);
    vi.mocked(global.fetch)
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);

    const { result } = renderHook(() => useWeatherData());

    await act(async () => {
      void result.current.fetchWeatherData(location, '2026-05-02', 12);
      void result.current.fetchWeatherData(location, '2026-05-03', 12);
    });

    await act(async () => {
      newer.resolve();
      await newer.promise;
    });

    await waitFor(() => expect(result.current.weatherData?.temperature).toBe(20));

    await act(async () => {
      older.resolve();
      await older.promise;
    });

    expect(result.current.weatherData?.temperature).toBe(20);
    expect(result.current.loading).toBe(false);
  });
});
