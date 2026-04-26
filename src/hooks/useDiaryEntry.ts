import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { validatePhotoFile } from '@/lib/diary';
import { DiaryEntry, DiaryPhoto, SaveStatus } from '@/types/diary';
import { Location } from '@/types/weather';

const AUTOSAVE_DELAY_MS = 1000;

export function useDiaryEntry(date: string | null, location: (Location & { name: string }) | null) {
  const { user } = useAuth();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep location in a ref so saveContent doesn't recreate on every location change,
  // which would orphan the pending debounce timer and silently drop in-progress saves.
  const locationRef = useRef(location);
  useEffect(() => { locationRef.current = location; }, [location]);

  useEffect(() => {
    if (!user || !date) {
      setEntry(null);
      setSaveStatus('idle');
      return;
    }

    setIsLoading(true);
    fetch(`/api/diary/${date}`)
      .then((r) => r.json())
      .then((data) => setEntry(data.entry ?? null))
      .catch(console.error)
      .finally(() => setIsLoading(false));

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [user, date]);

  const saveContent = useCallback(
    (content: string) => {
      if (!date) return;

      setSaveStatus('saving');

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(async () => {
        const loc = locationRef.current;
        try {
          const res = await fetch(`/api/diary/${date}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content,
              locationName: loc?.name ?? null,
              lat: loc?.lat ?? null,
              lng: loc?.lng ?? null,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            setEntry(data.entry);
            setSaveStatus('saved');
          } else {
            setSaveStatus('error');
          }
        } catch {
          setSaveStatus('error');
        }
      }, AUTOSAVE_DELAY_MS);
    },
    [date]
  );

  const uploadPhoto = useCallback(
    async (file: File) => {
      if (!date) return;

      const validation = validatePhotoFile(file);
      if (!validation.valid) {
        setUploadError(validation.error ?? 'Invalid file');
        return;
      }

      setUploadError(null);
      setIsUploading(true);

      try {
        const loc = locationRef.current;
        const formData = new FormData();
        formData.append('file', file);
        if (loc?.name) formData.append('locationName', loc.name);
        if (loc?.lat != null) formData.append('lat', String(loc.lat));
        if (loc?.lng != null) formData.append('lng', String(loc.lng));

        const res = await fetch(`/api/diary/${date}/photos`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok) {
          setEntry((prev) => {
            if (!prev) return prev;
            return { ...prev, photos: [...prev.photos, data.photo as DiaryPhoto] };
          });
        } else {
          setUploadError(data.error ?? 'Upload failed');
        }
      } catch {
        setUploadError('Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    },
    [date]
  );

  const deletePhoto = useCallback(
    async (photoId: string) => {
      if (!date) return;

      const res = await fetch(`/api/diary/${date}/photos/${photoId}`, { method: 'DELETE' });
      if (res.ok) {
        setEntry((prev) => {
          if (!prev) return prev;
          return { ...prev, photos: prev.photos.filter((p) => p.id !== photoId) };
        });
      }
    },
    [date]
  );

  const clearUploadError = useCallback(() => setUploadError(null), []);

  return {
    entry,
    isLoading,
    isUploading,
    saveStatus,
    uploadError,
    saveContent,
    uploadPhoto,
    deletePhoto,
    clearUploadError,
  };
}
