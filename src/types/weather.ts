export interface WeatherData {
  time: string;
  temperature: number;
  feelsLike: number;
  relativeHumidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  hourly: {
    time: string[];
    temperature: number[];
    feelsLike: number[];
    weatherCode: number[];
    humidity: number[];
    windSpeed: number[];
    precipitation: number[];
  };
  daily: {
    maxTemp: number;
    minTemp: number;
    maxHumidity: number;
    minHumidity: number;
    maxWind: number;
    minWind: number;
  };
}

export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface SavedLocation {
  id?: string; // Supabase UUID when persisted to DB
  name: string;
  lat: number;
  lng: number;
}
