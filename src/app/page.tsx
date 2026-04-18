'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, subDays, addDays, parseISO, isBefore, startOfDay } from 'date-fns';
import { MapPin, Calendar, Clock, Navigation, ChevronLeft, ChevronRight, Bookmark, BookmarkPlus } from 'lucide-react';
import WeatherDisplay from '@/components/WeatherDisplay';
import SearchComponent from '@/components/SearchComponent';
import SavedLocations from '@/components/SavedLocations';
import AuthButton from '@/components/AuthButton';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { parseWeatherResponse } from '@/lib/weatherParser';
import { Location, WeatherData, SavedLocation } from '@/types/weather';
import { cn } from '@/lib/utils';

const DEFAULT_LOCATION: Location = { lat: 51.505, lng: -0.09 };
const DEFAULT_LOCATION_NAME = 'London, United Kingdom';

export default function Page() {
  const { user } = useAuth();

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
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);

  const { isLocating, getCurrentPosition } = useGeolocation();

  // Track previous user id to detect login/logout transitions
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  // ── Preferences ────────────────────────────────────────────────────────────

  const applyPreferences = (u: 'C' | 'F', w: 'km' | 'mi') => {
    setUnit(u);
    setWindUnit(w);
    localStorage.setItem('weatherUnit', u);
    localStorage.setItem('weatherWindUnit', w);
  };

  const handleSetUnit = (u: 'C' | 'F') => {
    setUnit(u);
    localStorage.setItem('weatherUnit', u);
    if (user) {
      createClient().from('user_preferences').upsert({
        user_id: user.id,
        unit: u,
        wind_unit: windUnit,
        updated_at: new Date().toISOString(),
      }).then(() => {});
    }
  };

  const handleSetWindUnit = (w: 'km' | 'mi') => {
    setWindUnit(w);
    localStorage.setItem('weatherWindUnit', w);
    if (user) {
      createClient().from('user_preferences').upsert({
        user_id: user.id,
        unit,
        wind_unit: w,
        updated_at: new Date().toISOString(),
      }).then(() => {});
    }
  };

  // ── Saved locations ────────────────────────────────────────────────────────

  const persistSavedLocations = (locs: SavedLocation[]) => {
    localStorage.setItem('savedLocations', JSON.stringify(locs));
  };

  const handleSaveLocation = async () => {
    const alreadySaved = savedLocations.some(
      l => l.lat === location.lat && l.lng === location.lng
    );
    if (alreadySaved) return;

    if (user) {
      const { data, error } = await createClient()
        .from('saved_locations')
        .insert({ user_id: user.id, name: locationName, lat: location.lat, lng: location.lng })
        .select('id')
        .single();

      if (!error && data) {
        const newLoc: SavedLocation = { id: data.id, name: locationName, lat: location.lat, lng: location.lng };
        setSavedLocations(prev => {
          const updated = [...prev, newLoc];
          persistSavedLocations(updated);
          return updated;
        });
      }
    } else {
      const newLoc: SavedLocation = { name: locationName, lat: location.lat, lng: location.lng };
      setSavedLocations(prev => {
        const updated = [...prev, newLoc];
        persistSavedLocations(updated);
        return updated;
      });
    }
  };

  const handleRemoveSavedLocation = async (index: number) => {
    const loc = savedLocations[index];

    if (user && loc.id) {
      await createClient().from('saved_locations').delete().eq('id', loc.id);
    }

    setSavedLocations(prev => {
      const updated = prev.filter((_, i) => i !== index);
      persistSavedLocations(updated);
      return updated;
    });
  };

  const isLocationSaved = savedLocations.some(
    l => l.lat === location.lat && l.lng === location.lng
  );

  // ── Load from DB on login / revert to localStorage on logout ───────────────

  useEffect(() => {
    const prevId = prevUserIdRef.current;
    const currId = user?.id ?? null;

    // Skip the very first render (undefined → whatever)
    if (prevId === undefined) {
      prevUserIdRef.current = currId;
      return;
    }

    prevUserIdRef.current = currId;

    if (currId && currId !== prevId) {
      // User just logged in — fetch their DB data
      (async () => {
        const db = createClient();
        const [prefsResult, locsResult] = await Promise.all([
          db.from('user_preferences').select('unit, wind_unit').eq('user_id', currId).single(),
          db.from('saved_locations').select('id, name, lat, lng').eq('user_id', currId).order('created_at'),
        ]);

        if (prefsResult.data) {
          applyPreferences(
            prefsResult.data.unit as 'C' | 'F',
            prefsResult.data.wind_unit as 'km' | 'mi'
          );
        }

        if (locsResult.data) {
          const locs: SavedLocation[] = locsResult.data.map(r => ({
            id: r.id,
            name: r.name,
            lat: r.lat,
            lng: r.lng,
          }));
          setSavedLocations(locs);
          persistSavedLocations(locs);
        }
      })();
    } else if (!currId && prevId) {
      // User just logged out — fall back to localStorage
      const savedUnit = localStorage.getItem('weatherUnit');
      if (savedUnit === 'C' || savedUnit === 'F') setUnit(savedUnit);

      const savedWindUnit = localStorage.getItem('weatherWindUnit');
      if (savedWindUnit === 'km' || savedWindUnit === 'mi') setWindUnit(savedWindUnit);

      const savedLocs = localStorage.getItem('savedLocations');
      if (savedLocs) {
        try { setSavedLocations(JSON.parse(savedLocs)); } catch { /* ignore */ }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Bootstrap on mount (localStorage only — DB load happens via user effect) ─

  useEffect(() => {
    const savedUnit = localStorage.getItem('weatherUnit');
    if (savedUnit === 'C' || savedUnit === 'F') setUnit(savedUnit);

    const savedWindUnit = localStorage.getItem('weatherWindUnit');
    if (savedWindUnit === 'km' || savedWindUnit === 'mi') setWindUnit(savedWindUnit);

    const savedLocs = localStorage.getItem('savedLocations');
    if (savedLocs) {
      try { setSavedLocations(JSON.parse(savedLocs)); } catch { /* ignore */ }
    }
  }, []);

  // ── Weather data ───────────────────────────────────────────────────────────

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

  const handleRetry = () => {
    fetchWeatherData(location, selectedDate, selectedHour);
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
        <header className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col items-start space-y-1">
              <div className="inline-flex items-center justify-center p-3 bg-zinc-900 rounded-2xl shadow-lg">
                <Clock className="text-white w-8 h-8" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">WeatherHistory</h1>
              <p className="text-zinc-500 text-base max-w-xl">
                Discover precise atmospheric conditions from any point in time, anywhere in the world.
              </p>
            </div>
            <div className="pt-1">
              <AuthButton />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <div className="bg-zinc-100 p-1 rounded-xl inline-flex">
              <button
                onClick={() => handleSetUnit('C')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  unit === 'C' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                Celsius
              </button>
              <button
                onClick={() => handleSetUnit('F')}
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
                onClick={() => handleSetWindUnit('km')}
                className={cn(
                  "px-6 py-1.5 text-xs font-bold rounded-lg transition-all",
                  windUnit === 'km' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                km/h
              </button>
              <button
                onClick={() => handleSetWindUnit('mi')}
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
                    onClick={handleSaveLocation}
                    disabled={isLocationSaved}
                    title={isLocationSaved ? 'Location saved' : 'Save location'}
                    className={cn(
                      "p-4 rounded-2xl transition-all active:scale-95 shadow-md shrink-0",
                      isLocationSaved
                        ? "bg-zinc-100 text-zinc-400 cursor-default"
                        : "bg-zinc-900 text-white hover:bg-zinc-800"
                    )}
                  >
                    {isLocationSaved
                      ? <Bookmark className="w-5 h-5" />
                      : <BookmarkPlus className="w-5 h-5" />
                    }
                  </button>
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

              {/* Saved Locations */}
              <SavedLocations
                saved={savedLocations}
                onSelect={handleLocationChange}
                onRemove={handleRemoveSavedLocation}
              />

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
            <WeatherDisplay
              data={weatherData}
              loading={loading}
              error={error}
              unit={unit}
              windUnit={windUnit}
              onRetry={handleRetry}
            />
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
