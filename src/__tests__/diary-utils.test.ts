import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validatePhotoFile, buildStoragePath } from '@/lib/diary';

describe('validatePhotoFile', () => {
  const makeFile = (name: string, type: string, sizeBytes: number): File => {
    const blob = new Blob(['x'.repeat(sizeBytes)], { type });
    return new File([blob], name, { type });
  };

  it('accepts valid JPEG files', () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1024);
    expect(validatePhotoFile(file)).toEqual({ valid: true });
  });

  it('accepts valid PNG files', () => {
    const file = makeFile('photo.png', 'image/png', 1024);
    expect(validatePhotoFile(file)).toEqual({ valid: true });
  });

  it('accepts valid WebP files', () => {
    const file = makeFile('photo.webp', 'image/webp', 1024);
    expect(validatePhotoFile(file)).toEqual({ valid: true });
  });

  it('accepts valid GIF files', () => {
    const file = makeFile('photo.gif', 'image/gif', 1024);
    expect(validatePhotoFile(file)).toEqual({ valid: true });
  });

  it('rejects non-image files', () => {
    const file = makeFile('document.pdf', 'application/pdf', 1024);
    const result = validatePhotoFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/PNG|JPEG|WebP|GIF/);
  });

  it('rejects files over 10 MB', () => {
    const tenMbPlusOne = 10 * 1024 * 1024 + 1;
    const file = makeFile('large.jpg', 'image/jpeg', tenMbPlusOne);
    const result = validatePhotoFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/10 MB/);
  });

  it('accepts files exactly at 10 MB', () => {
    const tenMb = 10 * 1024 * 1024;
    const file = makeFile('exact.jpg', 'image/jpeg', tenMb);
    expect(validatePhotoFile(file)).toEqual({ valid: true });
  });
});

describe('buildStoragePath', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1234567890);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('builds a path with user_id and date as the first two segments', () => {
    const path = buildStoragePath('user-123', '2025-04-25', 'photo.jpg');
    const parts = path.split('/');
    expect(parts[0]).toBe('user-123');
    expect(parts[1]).toBe('2025-04-25');
  });

  it('preserves the file extension', () => {
    const path = buildStoragePath('user-123', '2025-04-25', 'photo.jpg');
    expect(path.endsWith('.jpg')).toBe(true);
  });

  it('preserves png extension', () => {
    const path = buildStoragePath('user-123', '2025-04-25', 'image.png');
    expect(path.endsWith('.png')).toBe(true);
  });

  it('handles filenames with no extension', () => {
    const path = buildStoragePath('user-123', '2025-04-25', 'photofile');
    const parts = path.split('/');
    expect(parts.length).toBe(3);
    expect(parts[2]).not.toContain('.');
  });

  it('generates unique paths on each call', () => {
    vi.spyOn(Math, 'random').mockRestore();
    const path1 = buildStoragePath('user-123', '2025-04-25', 'photo.jpg');
    const path2 = buildStoragePath('user-123', '2025-04-25', 'photo.jpg');
    expect(path1).not.toBe(path2);
  });
});
