'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays, addDays, parseISO, isBefore, startOfDay } from 'date-fns';
import { MapPin, Calendar, Clock, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';
import WeatherDisplay from '@/components/WeatherDisplay';
import SearchComponent from '@/components/SearchComponent';
import { useGeolocation } from '@/hooks/useGeolocation';
import { parseWeatherResponse } from '@/lib/weatherParser';
import { Location, WeatherData } from '@/types/weather';
import { cn } from '@/lib/utils';

const DEFAULT_LOCATION: Location = { lat: 51.505, lng: -0.09 };
const DEFAULT_LOCATION_NAME = 'London, United Kingdom';

export default function Page() {
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
  const [locationName, setLocationName] = useState<string>(DEFAULT_LOCATION_NAME);
  const [selectedDate, setSelectedDate] = useState<string>(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [unit, setUnit] = useState<'C' | 'F'>('F');
  const [windUnit, setWindUnit] = useState<'km' | 'mi'>('mi');

  const { isLocating, getCurrentPosition } = useGeolocation();

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      const data = await response.json();
      const address = data.address;
      const name = [
        address.city || address.town || address.village || address.suburb || address.hamlet,
        address.state || address.region,
        address.country,
      ].filter(Boolean).join(', ');
      setLocationName(name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch {
      setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

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

  // On mount: try geolocation, fall back to default London
  useEffect(() => {
    getCurrentPosition(
      (lat, lng) => {
        const newLoc = { lat, lng };
        setLocation(newLoc);
        reverseGeocode(lat, lng);
        fetchWeatherData(newLoc, selectedDate, selectedHour);
      },
      () => fetchWeatherData(DEFAULT_LOCATION, selectedDate, selectedHour)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchWeatherData(location, selectedDate, selectedHour);
  }, [location, selectedDate, selectedHour, fetchWeatherData]);

  const handleLocationChange = (loc: Location) => {
    setLocation(loc);
    if (loc.name) {
      setLocationName(loc.name);
    } else {
      reverseGeocode(loc.lat, loc.lng);
    }
  };

  const handleCurrentLocation = () => {
    getCurrentPosition((lat, lng) => {
      const newLoc = { lat, lng };
      setLocation(newLoc);
      reverseGeocode(lat, lng);
    });
  };

  const handlePrevDay = () => {
    setSelectedDate(format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const nextDate = addDays(parseISO(selectedDate), 1);
    const maxDate = subDays(new Date(), 1);
    if (isBefore(startOfDay(nextDate), addDays(startOfDay(maxDate), 1))) {
      setSelectedDate(format(nextDate, 'yyyy-MM-dd'));
    }
  };

  const isNextDayDisabled = !isBefore(
    startOfDay(addDays(parseISO(selectedDate), 1)),
    addDays(startOfDay(subDays(new Date(), 1)), 1)
  );

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-4xl space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-zinc-900 rounded-2xl shadow-lg mb-2">
            <Clock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">WeatherHistory</h1>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            Discover precise atmospheric conditions from any point in time, anywhere in the world.
          </p>

          <div className="flex justify-center gap-3 pt-2">
            <div className="bg-zinc-100 p-1 rounded-xl inline-flex">
              <button
                onClick={() => setUnit('C')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  unit === 'C' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                Celsius
              </button>
              <button
                onClick={() => setUnit('F')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  unit === 'F' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                Fahrenheit
              </button>
            </div>
            <div className="bg-zinc-100 p-1 rounded-xl inline-flex">
              <button
                onClick={() => setWindUnit('km')}
                className={cn(
                  "px-6 py-1.5 text-xs font-bold rounded-lg transition-all",
                  windUnit === 'km' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                km/h
              </button>
              <button
                onClick={() => setWindUnit('mi')}
                className={cn(
                  "px-6 py-1.5 text-xs font-bold rounded-lg transition-all",
                  windUnit === 'mi' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                mph
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-zinc-200">
            <div className="space-y-6">
              {/* Location */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-2" /> Current Location
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <SearchComponent
                      onLocationSelect={handleLocationChange}
                      currentValue={locationName}
                      isGeocoding={isGeocoding}
                    />
                  </div>
                  <button
                    onClick={handleCurrentLocation}
                    disabled={isLocating}
                    title="Use my location"
                    className="p-4 bg-zinc-900 text-white rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 shadow-md shrink-0"
                  >
                    <Navigation className={cn("w-5 h-5", isLocating && "animate-pulse")} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Date */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-2" /> Date
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevDay}
                      className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-all text-zinc-500"
                      title="Previous Day"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="relative flex-1">
                      <input
                        type="date"
                        value={selectedDate}
                        max={format(subDays(new Date(), 1), 'yyyy-MM-dd')}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-inner cursor-pointer appearance-none"
                      />
                    </div>
                    <button
                      onClick={handleNextDay}
                      disabled={isNextDayDisabled}
                      className={cn(
                        "p-3 bg-zinc-50 border border-zinc-200 rounded-xl transition-all text-zinc-500",
                        isNextDayDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-zinc-100"
                      )}
                      title="Next Day"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Hour */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-2" /> Hour
                  </label>
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-inner cursor-pointer appearance-none"
                  >
                    {[...Array(24)].map((_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-7">
            <WeatherDisplay data={weatherData} loading={loading} error={error} unit={unit} windUnit={windUnit} />
          </div>
        </div>

        <footer className="pt-12 border-t border-zinc-200 text-center">
          <p className="text-zinc-400 text-sm">
            Data provided by Open-Meteo Historical Weather API.
          </p>
        </footer>
      </div>
    </div>
  );
}
