import { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type TempUnit = 'C' | 'F';
type WindUnit = 'km' | 'mi';

function readFromLocalStorage(): { unit: TempUnit; windUnit: WindUnit } {
  const unit = localStorage.getItem('weatherUnit');
  const windUnit = localStorage.getItem('weatherWindUnit');
  return {
    unit: unit === 'C' || unit === 'F' ? unit : 'F',
    windUnit: windUnit === 'km' || windUnit === 'mi' ? windUnit : 'mi',
  };
}

export function usePreferences(user: User | null) {
  const [unit, setUnitState] = useState<TempUnit>('F');
  const [windUnit, setWindUnitState] = useState<WindUnit>('mi');

  // Refs so setUnit/setWindUnit closures always read the latest sibling value
  const unitRef = useRef(unit);
  unitRef.current = unit;
  const windUnitRef = useRef(windUnit);
  windUnitRef.current = windUnit;

  // Bootstrap from localStorage on mount
  useEffect(() => {
    const { unit, windUnit } = readFromLocalStorage();
    setUnitState(unit);
    setWindUnitState(windUnit);
  }, []);

  // Sync from DB on login; fall back to localStorage on logout
  useEffect(() => {
    if (user) {
      createClient()
        .from('user_preferences')
        .select('unit, wind_unit')
        .eq('user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Failed to load preferences from DB:', error.message);
            return;
          }
          if (data) {
            const u = data.unit as TempUnit;
            const w = data.wind_unit as WindUnit;
            setUnitState(u);
            setWindUnitState(w);
            localStorage.setItem('weatherUnit', u);
            localStorage.setItem('weatherWindUnit', w);
          }
        });
    } else {
      const { unit, windUnit } = readFromLocalStorage();
      setUnitState(unit);
      setWindUnitState(windUnit);
    }
  }, [user]);

  const syncToDb = useCallback((u: TempUnit, w: WindUnit) => {
    if (!user) return;
    createClient().from('user_preferences').upsert({
      user_id: user.id,
      unit: u,
      wind_unit: w,
      updated_at: new Date().toISOString(),
    }).then(() => {});
  }, [user]);

  const setUnit = useCallback((u: TempUnit) => {
    setUnitState(u);
    localStorage.setItem('weatherUnit', u);
    syncToDb(u, windUnitRef.current);
  }, [syncToDb]);

  const setWindUnit = useCallback((w: WindUnit) => {
    setWindUnitState(w);
    localStorage.setItem('weatherWindUnit', w);
    syncToDb(unitRef.current, w);
  }, [syncToDb]);

  return { unit, windUnit, setUnit, setWindUnit };
}
