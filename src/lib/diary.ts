import { PhotoValidationResult } from '@/types/diary';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MiB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

export function validatePhotoMeta(contentType: string, size: number): PhotoValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return { valid: false, error: 'Only PNG, JPEG, WebP, GIF, and HEIC/HEIF images are allowed.' };
  }
  if (size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'File must be smaller than 10 MB.' };
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
