'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';
import { Location } from '@/types/weather';
import { cn } from '@/lib/utils';

interface SearchComponentProps {
  onLocationSelect: (loc: Location) => void;
  currentValue: string;
  isGeocoding?: boolean;
}

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ onLocationSelect, currentValue, isGeocoding }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/geocoding?name=${encodeURIComponent(query)}&count=5`);
        const data = await response.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: GeocodingResult) => {
    onLocationSelect({
      lat: result.latitude,
      lng: result.longitude,
      name: `${result.name}${result.admin1 ? `, ${result.admin1}` : ''}${result.country ? `, ${result.country}` : ''}`,
    });
    setQuery('');
    setIsOpen(false);
    setIsFocused(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={isFocused ? query : (isGeocoding ? 'Identifying...' : currentValue)}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search city..."
          className={cn(
            "w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-10 pr-4 py-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-inner",
            !isFocused && "text-zinc-700 truncate cursor-pointer",
            isGeocoding && "text-zinc-400 italic"
          )}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {loading || isGeocoding ? (
            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden z-[2000]">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-zinc-50 flex items-start space-x-3 transition-colors border-b border-zinc-50 last:border-0"
            >
              <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-zinc-800">{result.name}</p>
                <p className="text-xs text-zinc-500">
                  {[result.admin1, result.country].filter(Boolean).join(', ')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
