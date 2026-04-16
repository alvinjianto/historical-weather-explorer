import React from 'react';
import { WeatherData } from '../types';
import { getWeatherDescription } from '../constants';
import * as LucideIcons from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface WeatherDisplayProps {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  unit: 'C' | 'F';
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ data, loading, error, unit }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-6 bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm animate-pulse">
        <div className="w-24 h-24 bg-zinc-100 rounded-3xl"></div>
        <div className="space-y-3 flex flex-col items-center">
          <div className="h-4 w-48 bg-zinc-100 rounded-full"></div>
          <div className="h-12 w-32 bg-zinc-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center bg-red-50/50 rounded-[2.5rem] border border-red-100">
        <div className="p-4 bg-red-100 rounded-2xl mb-4">
          <LucideIcons.AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-red-900 mb-2">Data Unavailable</h3>
        <p className="text-red-700/70 max-w-xs mx-auto text-sm leading-relaxed">
          {error}. Try selecting a different date or location.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center bg-white rounded-[2.5rem] border border-zinc-200 border-dashed">
        <div className="p-4 bg-zinc-50 rounded-2xl mb-4">
          <LucideIcons.CloudSun className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="text-zinc-400 font-medium max-w-xs">
          Select a location and date to reveal historical weather insights.
        </p>
      </div>
    );
  }

  const { description, icon } = getWeatherDescription(data.weatherCode);
  const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Cloud;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-zinc-100 space-y-8 sm:space-y-10 relative overflow-hidden"
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-zinc-50 rounded-full blur-3xl opacity-50" />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative">
        <div className="space-y-2">
          <div className="inline-flex items-center px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
            Historical Snapshot
          </div>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
            {format(parseISO(data.time), 'MMMM do, yyyy')}
          </h2>
          <p className="text-zinc-400 font-medium flex items-center">
            <LucideIcons.Clock className="w-4 h-4 mr-2" />
            Recorded at {format(parseISO(data.time), 'h:mm a')}
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end">
          <span className="text-7xl font-light tracking-tighter text-zinc-900">
            {unit === 'C' 
              ? Math.round(data.temperature) 
              : Math.round((data.temperature * 9/5) + 32)}
            <span className="text-zinc-300">°</span>
          </span>
          <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-1">
            {unit === 'C' ? 'Celsius' : 'Fahrenheit'}
          </span>
        </div>
      </div>

      {/* Hour Specific Condition */}
      <div className="flex items-center space-x-6 p-6 bg-zinc-50 rounded-3xl border border-zinc-100 relative">
        <div className="p-4 bg-white rounded-2xl shadow-sm">
          <IconComponent className="w-10 h-10 text-zinc-900" />
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-800 tracking-tight">{description}</p>
          <p className="text-zinc-400 font-medium">Atmospheric Condition</p>
        </div>
      </div>

      {/* Hour Specific Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-zinc-100 rounded-3xl space-y-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <LucideIcons.Droplets className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-800">{data.relativeHumidity}%</p>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Humidity</p>
          </div>
        </div>
        
        <div className="p-6 bg-white border border-zinc-100 rounded-3xl space-y-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <LucideIcons.Wind className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-800">{data.windSpeed} <span className="text-sm font-normal text-zinc-400">km/h</span></p>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Wind Speed</p>
          </div>
        </div>

        <div className="p-6 bg-white border border-zinc-100 rounded-3xl space-y-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <LucideIcons.CloudRain className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-800">{data.precipitation} <span className="text-sm font-normal text-zinc-400">mm</span></p>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Precipitation</p>
          </div>
        </div>
      </div>

      {/* Daily Extremes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Daily Extremes</h3>
          <div className="h-px flex-1 bg-zinc-100 mx-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Temperature High/Low */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 min-w-0">
              <LucideIcons.Thermometer className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 truncate">Temp</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-sm font-bold text-red-500">
                {unit === 'C' ? Math.round(data.daily.maxTemp) : Math.round((data.daily.maxTemp * 9/5) + 32)}°
              </span>
              <span className="text-sm font-bold text-blue-500">
                {unit === 'C' ? Math.round(data.daily.minTemp) : Math.round((data.daily.minTemp * 9/5) + 32)}°
              </span>
            </div>
          </div>

          {/* Humidity High/Low */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 min-w-0">
              <LucideIcons.Droplets className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 truncate">Humidity</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-sm font-bold text-blue-600">{Math.round(data.daily.maxHumidity)}%</span>
              <span className="text-sm font-bold text-blue-300">{Math.round(data.daily.minHumidity)}%</span>
            </div>
          </div>

          {/* Wind High/Low */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 min-w-0">
              <LucideIcons.Wind className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 truncate">Wind</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-sm font-bold text-orange-600">{Math.round(data.daily.maxWind)}</span>
              <span className="text-sm font-bold text-orange-300">{Math.round(data.daily.minWind)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Hourly Timeline</h3>
          <div className="h-px flex-1 bg-zinc-100 mx-4" />
        </div>
        <div className="flex overflow-x-auto pb-4 -mx-2 scrollbar-hide space-x-4">
          {data.hourly.time.map((time, index) => {
            const { icon: hourlyIcon } = getWeatherDescription(data.hourly.weatherCode[index]);
            const HourlyIcon = (LucideIcons as any)[hourlyIcon] || LucideIcons.Cloud;
            const isCurrentHour = index === parseISO(data.time).getHours();
            
            return (
              <div 
                key={time}
                className={cn(
                  "flex-shrink-0 w-28 p-5 rounded-3xl border transition-all flex flex-col items-center space-y-4",
                  isCurrentHour 
                    ? "bg-zinc-900 border-zinc-900 text-white shadow-lg scale-105 z-10" 
                    : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-200"
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">
                  {format(parseISO(time), 'h a')}
                </span>
                
                <HourlyIcon className={cn("w-7 h-7", isCurrentHour ? "text-white" : "text-zinc-400")} />
                
                <div className="text-center">
                  <p className="text-base font-bold">
                    {unit === 'C' 
                      ? Math.round(data.hourly.temperature[index]) 
                      : Math.round((data.hourly.temperature[index] * 9/5) + 32)}°
                  </p>
                </div>

                <div className={cn(
                  "w-full pt-3 border-t grid grid-cols-1 gap-1 text-[9px] font-bold uppercase tracking-tighter",
                  isCurrentHour ? "border-zinc-800" : "border-zinc-50"
                )}>
                  <div className="flex items-center justify-between">
                    <span className="opacity-50">Hum</span>
                    <span>{Math.round(data.hourly.humidity[index])}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="opacity-50">Wind</span>
                    <span>{Math.round(data.hourly.windSpeed[index])}</span>
                  </div>
                  {data.hourly.precipitation[index] > 0 && (
                    <div className="flex items-center justify-between text-blue-400">
                      <span className="opacity-50">Rain</span>
                      <span>{data.hourly.precipitation[index]}mm</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherDisplay;
