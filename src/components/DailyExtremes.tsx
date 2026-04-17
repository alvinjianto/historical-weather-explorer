'use client';

import React from 'react';
import { Thermometer, Droplets, Wind } from 'lucide-react';
import { WeatherData } from '@/types/weather';
import { convertTemp, convertWind, windUnitLabel } from '@/lib/temperature';

interface DailyExtremesProps {
  daily: WeatherData['daily'];
  unit: 'C' | 'F';
  windUnit: 'km' | 'mi';
}

interface ExtremeCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  high: string;
  low: string;
}

const ExtremeCard: React.FC<ExtremeCardProps> = ({ icon, iconBg, label, high, low }) => (
  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
    <div className="flex items-center space-x-2">
      <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{label}</span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">High</p>
        <p className="text-sm font-bold text-red-500">{high}</p>
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Low</p>
        <p className="text-sm font-bold text-blue-500">{low}</p>
      </div>
    </div>
  </div>
);

const DailyExtremes: React.FC<DailyExtremesProps> = ({ daily, unit, windUnit }) => (
  <div className="space-y-4">
    <div className="flex items-center">
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Daily Extremes</h3>
      <div className="h-px flex-1 bg-zinc-100 ml-4" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <ExtremeCard
        icon={<Thermometer className="w-3.5 h-3.5 text-red-500" />}
        iconBg="bg-red-100"
        label="Temp"
        high={`${convertTemp(daily.maxTemp, unit)}°`}
        low={`${convertTemp(daily.minTemp, unit)}°`}
      />
      <ExtremeCard
        icon={<Droplets className="w-3.5 h-3.5 text-blue-500" />}
        iconBg="bg-blue-100"
        label="Humidity"
        high={`${Math.round(daily.maxHumidity)}%`}
        low={`${Math.round(daily.minHumidity)}%`}
      />
      <ExtremeCard
        icon={<Wind className="w-3.5 h-3.5 text-orange-500" />}
        iconBg="bg-orange-100"
        label="Wind"
        high={`${convertWind(daily.maxWind, windUnit)} ${windUnitLabel(windUnit)}`}
        low={`${convertWind(daily.minWind, windUnit)} ${windUnitLabel(windUnit)}`}
      />
    </div>
  </div>
);

export default DailyExtremes;
