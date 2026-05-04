import { PhotoValidationResult } from '@/types/diary';

export const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export function validatePhotoMeta(contentType: string, size: number): PhotoValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return { valid: false, error: 'Only PNG, JPEG, WebP, and GIF images are allowed.' };
  }
  if (size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'File must be smaller than 25 MB.' };
  }
  return { valid: true };
}

export function validatePhotoFile(file: File): PhotoValidationResult {
  return validatePhotoMeta(file.type, file.size);
}

export function buildStoragePath(userId: string, date: string, filename: string): string {
  const ext = filename.includes('.') ? filename.split('.').pop() : '';
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${userId}/${date}/${unique}${ext ? `.${ext}` : ''}`;
}
