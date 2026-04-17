'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { WeatherData } from '@/types/weather';
import { getWeatherDescription } from '@/constants/weatherCodes';
import { getWeatherIcon } from '@/lib/weatherIcon';
import { convertTemp, convertWind, windUnitLabel } from '@/lib/temperature';
import { cn } from '@/lib/utils';

interface HourlyTimelineProps {
  hourly: WeatherData['hourly'];
  currentTime: string;
  unit: 'C' | 'F';
  windUnit: 'km' | 'mi';
}

const HourlyTimeline: React.FC<HourlyTimelineProps> = ({ hourly, currentTime, unit, windUnit }) => {
  const currentHour = parseISO(currentTime).getHours();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Hourly Timeline</h3>
        <div className="h-px flex-1 bg-zinc-100 mx-4" />
      </div>
      <div className="flex overflow-x-auto pb-4 -mx-2 scrollbar-hide space-x-4">
        {hourly.time.map((time, index) => {
          const { icon } = getWeatherDescription(hourly.weatherCode[index]);
          const Icon = getWeatherIcon(icon);
          const isCurrentHour = index === currentHour;

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

              <Icon className={cn("w-7 h-7", isCurrentHour ? "text-white" : "text-zinc-400")} />

              <p className="text-base font-bold">{convertTemp(hourly.temperature[index], unit)}°</p>

              <div className={cn(
                "w-full pt-3 border-t grid grid-cols-1 gap-1 text-[9px] font-bold uppercase tracking-tighter",
                isCurrentHour ? "border-zinc-800" : "border-zinc-50"
              )}>
                <div className="flex items-center justify-between">
                  <span className="opacity-50">Hum</span>
                  <span>{Math.round(hourly.humidity[index])}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-50">Wind</span>
                  <span>{convertWind(hourly.windSpeed[index], windUnit)} <span className="opacity-50">{windUnitLabel(windUnit)}</span></span>
                </div>
                {hourly.precipitation[index] > 0 && (
                  <div className="flex items-center justify-between text-blue-400">
                    <span className="opacity-50">Rain</span>
                    <span>{hourly.precipitation[index]}mm</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HourlyTimeline;
