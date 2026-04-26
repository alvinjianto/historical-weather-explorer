'use client';

import React from 'react';
import { AlertCircle, CloudSun, Clock, Droplets, Wind, CloudRain, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion } from 'motion/react';
import { WeatherData } from '@/types/weather';
import { getWeatherDescription } from '@/constants/weatherCodes';
import { getWeatherIcon } from '@/lib/weatherIcon';
import { convertTemp, convertWind, windUnitLabel } from '@/lib/temperature';
import DailyExtremes from './DailyExtremes';
import HourlyTimeline from './HourlyTimeline';

interface WeatherDisplayProps {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  unit: 'C' | 'F';
  windUnit: 'km' | 'mi';
  locationName?: string;
  onRetry?: () => void;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ data, loading, error, unit, windUnit, locationName, onRetry }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-6 bg-white rounded-3xl border border-zinc-200 shadow-sm animate-pulse">
        <div className="w-24 h-24 bg-zinc-100 rounded-3xl" />
        <div className="space-y-3 flex flex-col items-center">
          <div className="h-4 w-48 bg-zinc-100 rounded-full" />
          <div className="h-12 w-32 bg-zinc-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center bg-red-50/50 rounded-3xl border border-red-100">
        <div className="p-4 bg-red-100 rounded-2xl mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-red-900 mb-2">Data Unavailable</h3>
        <p className="text-red-700/70 max-w-xs mx-auto text-sm leading-relaxed">
          {error}. Try selecting a different date or location.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors active:scale-95"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center bg-white rounded-3xl border border-zinc-200 border-dashed">
        <div className="p-4 bg-zinc-50 rounded-2xl mb-4">
          <CloudSun className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="text-zinc-400 font-medium max-w-xs">
          Select a location and date to reveal historical weather insights.
        </p>
      </div>
    );
  }

  const { description, icon } = getWeatherDescription(data.weatherCode);
  const WeatherIcon = getWeatherIcon(icon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-zinc-200 space-y-8 sm:space-y-10 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-zinc-50 rounded-full blur-3xl opacity-50" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative">
        <div className="space-y-2">
          <div className="inline-flex items-center px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
            Historical Snapshot
          </div>
          {locationName && (
            <p className="text-lg font-semibold text-zinc-700 flex items-center gap-1.5 mb-1">
              <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
              {locationName}
            </p>
          )}
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
            {format(parseISO(data.time), 'MMMM do, yyyy')}
          </h2>
          <p className="text-zinc-400 font-medium flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Recorded at {format(parseISO(data.time), 'h:mm a')}
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end">
          <span className="text-7xl font-light tracking-tighter text-zinc-900">
            {convertTemp(data.temperature, unit)}
            <span className="text-zinc-300">°</span>
          </span>
          <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-1">
            {unit === 'C' ? 'Celsius' : 'Fahrenheit'}
          </span>
          <span className="text-zinc-400 text-xs mt-1">
            Feels like {convertTemp(data.feelsLike, unit)}°
          </span>
        </div>
      </div>

      {/* Condition */}
      <div className="flex items-center space-x-6 p-6 bg-zinc-50 rounded-3xl border border-zinc-100 relative">
        <div className="p-4 bg-white rounded-2xl shadow-sm">
          <WeatherIcon className="w-10 h-10 text-zinc-900" />
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-800 tracking-tight">{description}</p>
          <p className="text-zinc-400 font-medium">Atmospheric Condition</p>
        </div>
      </div>

      {/* Hour Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-zinc-100 rounded-3xl space-y-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Droplets className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-800">{Math.round(data.relativeHumidity)}%</p>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Humidity</p>
          </div>
        </div>

        <div className="p-6 bg-white border border-zinc-100 rounded-3xl space-y-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <Wind className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-800">{convertWind(data.windSpeed, windUnit)} <span className="text-sm font-normal text-zinc-400">{windUnitLabel(windUnit)}</span></p>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Wind Speed</p>
          </div>
        </div>

        <div className="p-6 bg-white border border-zinc-100 rounded-3xl space-y-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <CloudRain className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-800">{data.precipitation} <span className="text-sm font-normal text-zinc-400">mm</span></p>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Precipitation</p>
          </div>
        </div>
      </div>

      <DailyExtremes daily={data.daily} unit={unit} windUnit={windUnit} />
      <HourlyTimeline hourly={data.hourly} currentTime={data.time} unit={unit} windUnit={windUnit} />
    </motion.div>
  );
};

export default WeatherDisplay;
