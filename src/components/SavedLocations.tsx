'use client';

import React from 'react';
import { Bookmark, X } from 'lucide-react';
import { Location } from '@/types/weather';
import { SavedLocation } from '@/app/page';

interface SavedLocationsProps {
  saved: SavedLocation[];
  onSelect: (loc: Location) => void;
  onRemove: (index: number) => void;
}

const SavedLocations: React.FC<SavedLocationsProps> = ({ saved, onSelect, onRemove }) => {
  if (saved.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center">
        <Bookmark className="w-3.5 h-3.5 mr-2" /> Saved Locations
      </label>
      <div className="flex flex-wrap gap-2">
        {saved.map((loc, i) => (
          <div
            key={i}
            className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 gap-2 hover:border-zinc-300 transition-colors"
          >
            <button
              onClick={() => onSelect({ lat: loc.lat, lng: loc.lng, name: loc.name })}
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 truncate max-w-[8rem] text-left"
            >
              {loc.name}
            </button>
            <button
              onClick={() => onRemove(i)}
              className="text-zinc-300 hover:text-zinc-500 transition-colors shrink-0"
              title="Remove saved location"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedLocations;
