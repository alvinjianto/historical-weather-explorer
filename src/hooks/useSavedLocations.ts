import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Location, SavedLocation } from '@/types/weather';

function readFromLocalStorage(): SavedLocation[] {
  try {
    const raw = localStorage.getItem('savedLocations');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(locs: SavedLocation[]) {
  localStorage.setItem('savedLocations', JSON.stringify(locs));
}

export function useSavedLocations(user: User | null) {
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Bootstrap from localStorage on mount
  useEffect(() => {
    setSavedLocations(readFromLocalStorage());
  }, []);

  // Sync from DB on login; fall back to localStorage on logout
  useEffect(() => {
    if (user) {
      createClient()
        .from('saved_locations')
        .select('id, name, lat, lng')
        .eq('user_id', user.id)
        .order('created_at')
        .then(({ data, error }) => {
          if (error) {
            console.error('Failed to load saved locations from DB:', error.message);
            return;
          }
          if (data) {
            const locs: SavedLocation[] = data.map(r => ({
              id: r.id as string,
              name: r.name as string,
              lat: r.lat as number,
              lng: r.lng as number,
            }));
            setSavedLocations(locs);
            persist(locs);
          }
        });
    } else {
      setSavedLocations(readFromLocalStorage());
    }
  }, [user]);

  const saveLocation = async (location: Location, name: string) => {
    setLocationError(null);
    const alreadySaved = savedLocations.some(
      l => l.lat === location.lat && l.lng === location.lng
    );
    if (alreadySaved) return;

    if (user) {
      const { data, error } = await createClient()
        .from('saved_locations')
        .insert({ user_id: user.id, name, lat: location.lat, lng: location.lng })
        .select('id')
        .single();

      if (error) {
        setLocationError('Failed to save location. Please try again.');
        return;
      }

      const newLoc: SavedLocation = { id: data.id, name, lat: location.lat, lng: location.lng };
      setSavedLocations(prev => {
        const updated = [...prev, newLoc];
        persist(updated);
        return updated;
      });
    } else {
      const newLoc: SavedLocation = { name, lat: location.lat, lng: location.lng };
      setSavedLocations(prev => {
        const updated = [...prev, newLoc];
        persist(updated);
        return updated;
      });
    }
  };

  const removeLocation = async (index: number) => {
    setLocationError(null);
    const loc = savedLocations[index];

    if (user && loc.id) {
      const { error } = await createClient()
        .from('saved_locations')
        .delete()
        .eq('id', loc.id);

      if (error) {
        setLocationError('Failed to remove location. Please try again.');
        return;
      }
    }

    setSavedLocations(prev => {
      const updated = prev.filter((_, i) => i !== index);
      persist(updated);
      return updated;
    });
  };

  const isLocationSaved = (lat: number, lng: number) =>
    savedLocations.some(l => l.lat === lat && l.lng === lng);

  const clearLocationError = () => setLocationError(null);

  return { savedLocations, locationError, clearLocationError, saveLocation, removeLocation, isLocationSaved };
}
