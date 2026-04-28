export interface DiaryPhoto {
  id: string;
  filename: string;
  url: string;
  storagePath: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  locationName: string | null;
  lat: number | null;
  lng: number | null;
  photos: DiaryPhoto[];
  updatedAt: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface PhotoValidationResult {
  valid: boolean;
  error?: string;
}
