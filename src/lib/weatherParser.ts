import { WeatherData } from '@/types/weather';

interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  relative_humidity_2m: number[];
  wind_speed_10m: number[];
  precipitation: number[];
  weather_code: number[];
}

interface OpenMeteoResponse {
  hourly: OpenMeteoHourly;
}

export function parseWeatherResponse(data: OpenMeteoResponse, hour: number): WeatherData {
  const { hourly } = data;
  const temps = hourly.temperature_2m;
  const feelsLikes = hourly.apparent_temperature;
  const humidities = hourly.relative_humidity_2m;
  const winds = hourly.wind_speed_10m;
  const precips = hourly.precipitation;
  const codes = hourly.weather_code;

  return {
    time: hourly.time[hour],
    temperature: temps[hour],
    feelsLike: feelsLikes[hour],
    relativeHumidity: humidities[hour],
    windSpeed: winds[hour],
    precipitation: precips[hour],
    weatherCode: codes[hour],
    hourly: {
      time: hourly.time,
      temperature: temps,
      feelsLike: feelsLikes,
      weatherCode: codes,
      humidity: humidities,
      windSpeed: winds,
      precipitation: precips,
    },
    daily: {
      maxTemp: Math.max(...temps),
      minTemp: Math.min(...temps),
      maxHumidity: Math.max(...humidities),
      minHumidity: Math.min(...humidities),
      maxWind: Math.max(...winds),
      minWind: Math.min(...winds),
    },
  };
}
