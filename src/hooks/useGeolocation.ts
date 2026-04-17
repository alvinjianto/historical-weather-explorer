import { useState, useCallback } from 'react';

export function useGeolocation() {
  const [isLocating, setIsLocating] = useState(false);

  const getCurrentPosition = useCallback(
    (onSuccess: (lat: number, lng: number) => void, onError?: () => void) => {
      if (!navigator.geolocation) {
        onError?.();
        return;
      }
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          onSuccess(position.coords.latitude, position.coords.longitude);
        },
        () => {
          setIsLocating(false);
          onError?.();
        }
      );
    },
    []
  );

  return { isLocating, getCurrentPosition };
}
