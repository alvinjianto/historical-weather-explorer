'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, subDays, addDays, parseISO, isBefore, startOfDay } from 'date-fns';
import Link from 'next/link';
import { MapPin, Calendar, Clock, Navigation, ChevronLeft, ChevronRight, Bookmark, BookmarkPlus, X, CloudSun, BookOpen } from 'lucide-react';
import WeatherDisplay from '@/components/WeatherDisplay';
import DiaryPanel from '@/components/DiaryPanel';
import SearchComponent from '@/components/SearchComponent';
import SavedLocations from '@/components/SavedLocations';
import AuthButton from '@/components/AuthButton';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/hooks/usePreferences';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { useWeatherData } from '@/hooks/useWeatherData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Location } from '@/types/weather';
import { cn } from '@/lib/utils';

const DEFAULT_LOCATION: Location = { lat: 51.505, lng: -0.09 };
const DEFAULT_LOCATION_NAME = 'London, United Kingdom';

type MobileTab = 'weather' | 'diary';

export default function Page() {
  const { user } = useAuth();

  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
  const [locationName, setLocationName] = useState<string>(DEFAULT_LOCATION_NAME);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MobileTab>('weather');
  const restoredLocationFromUrlRef = useRef(false);

  const { unit, windUnit, setUnit, setWindUnit } = usePreferences(user);
  const { savedLocations, locationError, clearLocationError, saveLocation, removeLocation, isLocationSaved } = useSavedLocations(user);
  const { weatherData, loading, error: weatherError, fetchWeatherData } = useWeatherData();
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

  // Surface OAuth errors passed back via ?error=auth, and restore diary browser links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'auth') {
      setAuthError('Sign-in failed. Please try again.');
      window.history.replaceState({}, '', '/');
      return;
    }
    const dateParam = params.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      setSelectedDate(dateParam);
    }
    const latParam = params.get('lat');
    const lngParam = params.get('lng');
    const lat = latParam ? Number(latParam) : NaN;
    const lng = lngParam ? Number(lngParam) : NaN;
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      restoredLocationFromUrlRef.current = true;
      setLocation({ lat, lng });
      reverseGeocode(lat, lng);
    }
    if (dateParam || latParam || lngParam) {
      window.history.replaceState({}, '', '/');
    }
  }, [reverseGeocode]);

  // On mount: try geolocation, fall back to London
  useEffect(() => {
    if (restoredLocationFromUrlRef.current) return;
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
    if (!isBefore(startOfDay(new Date()), startOfDay(nextDate))) {
      setSelectedDate(format(nextDate, 'yyyy-MM-dd'));
    }
  };

  const isNextDayDisabled = !isBefore(
    startOfDay(addDays(parseISO(selectedDate), 1)),
    addDays(startOfDay(new Date()), 1)
  );

  const locationSaved = isLocationSaved(location.lat, location.lng);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-7xl space-y-8">

        {/* Auth error banner */}
        {authError && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
            <span>{authError}</span>
            <button onClick={() => setAuthError(null)} className="text-red-400 hover:text-red-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Location error banner */}
        {locationError && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
            <span>{locationError}</span>
            <button onClick={clearLocationError} className="text-red-400 hover:text-red-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <header className="space-y-8">
          <div className="flex items-start justify-between">
            <div className="flex flex-col items-start space-y-1 flex-1 min-w-0 pr-6">
              <div className="inline-flex items-center justify-center p-3 bg-zinc-900 rounded-2xl shadow-lg">
                <Clock className="text-white w-8 h-8" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">WeatherHistory</h1>
              <p className="text-zinc-500 text-base">
                Discover precise atmospheric conditions from any point in time, anywhere in the world.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              {user && (
                <Link
                  href="/diary"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  <BookOpen className="w-4 h-4" /> My Diary
                </Link>
              )}
              <AuthButton />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
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

        {/* Controls Panel */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_7rem] gap-6">
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
                  onClick={() => saveLocation(location, locationName).catch(console.error)}
                  disabled={locationSaved}
                  title={locationSaved ? 'Location saved' : 'Save location'}
                  className={cn(
                    "p-4 rounded-2xl transition-all active:scale-95 shadow-md shrink-0",
                    locationSaved
                      ? "bg-zinc-100 text-zinc-400 cursor-default"
                      : "bg-zinc-900 text-white hover:bg-zinc-800"
                  )}
                >
                  {locationSaved
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

            {/* Date */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-2" /> Date
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevDay}
                  className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl hover:bg-zinc-100 transition-all text-zinc-500"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="date"
                    value={selectedDate}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-inner cursor-pointer appearance-none"
                  />
                </div>
                <button
                  onClick={handleNextDay}
                  disabled={isNextDayDisabled}
                  className={cn(
                    "p-4 bg-zinc-50 border border-zinc-200 rounded-2xl transition-all text-zinc-500",
                    isNextDayDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-zinc-100"
                  )}
                  title="Next Day"
                >
                  <ChevronRight className="w-5 h-5" />
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

          {savedLocations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <SavedLocations
                saved={savedLocations}
                onSelect={handleLocationChange}
                onRemove={(i) => removeLocation(i).catch(console.error)}
              />
            </div>
          )}
        </div>

        {/* Mobile tab bar — only shown when logged in, hidden on lg+ */}
        {user && (
          <div className="flex lg:hidden bg-zinc-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('weather')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === 'weather' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <CloudSun className="w-4 h-4" /> Weather
            </button>
            <button
              onClick={() => setActiveTab('diary')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === 'diary' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <BookOpen className="w-4 h-4" /> Diary
            </button>
          </div>
        )}

        {/* Main content — two columns on lg+, tabs on mobile */}
        <div className={cn(user && "lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start")}>

          {/* Weather column — hidden on mobile when diary tab is active */}
          <div className={cn("min-w-0", user && activeTab === 'diary' && "hidden lg:block")}>
            <WeatherDisplay
              data={weatherData}
              loading={loading}
              error={weatherError}
              unit={unit}
              windUnit={windUnit}
              locationName={locationName}
              onRetry={() => fetchWeatherData(location, selectedDate, selectedHour)}
            />
          </div>

          {/* Diary column — hidden on mobile when weather tab is active, sticky on desktop */}
          {user && (
            <div className={cn(
              "min-w-0 lg:sticky lg:top-8",
              activeTab === 'weather' && "hidden lg:block"
            )}>
              <DiaryPanel
                date={selectedDate}
                location={{ ...location, name: locationName }}
              />
            </div>
          )}
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
