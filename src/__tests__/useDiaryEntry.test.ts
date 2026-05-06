import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDiaryEntry } from '@/hooks/useDiaryEntry';

// Mock useAuth so we can control the user
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        uploadToSignedUrl: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
  })),
}));

import { useAuth } from '@/context/AuthContext';

const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockLocation = { lat: 51.505, lng: -0.09, name: 'London, United Kingdom' };

const mockEntry = {
  id: 'entry-1',
  date: '2025-04-25',
  content: 'A great day',
  locationName: 'London, United Kingdom',
  lat: 51.505,
  lng: -0.09,
  photos: [],
  updatedAt: '2025-04-25T12:00:00Z',
};

describe('useDiaryEntry', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser } as ReturnType<typeof useAuth>);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches the diary entry on mount when user and date are set', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entry: mockEntry }),
    } as Response);

    const { result } = renderHook(() => useDiaryEntry('2025-04-25', mockLocation));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(global.fetch).toHaveBeenCalledWith('/api/diary/2025-04-25');
    expect(result.current.entry).toEqual(mockEntry);
  });

  it('sets entry to null when no entry exists for the date', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entry: null }),
    } as Response);

    const { result } = renderHook(() => useDiaryEntry('2025-04-25', mockLocation));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entry).toBeNull();
  });

  it('does not fetch when user is null', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() => useDiaryEntry('2025-04-25', mockLocation));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.entry).toBeNull();
  });

  it('does not fetch when date is null', async () => {
    const { result } = renderHook(() => useDiaryEntry(null, mockLocation));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.entry).toBeNull();
  });

  it('refetches when date changes', async () => {
    const entryA = { ...mockEntry, date: '2025-04-25' };
    const entryB = { ...mockEntry, date: '2025-04-26' };

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ entry: entryA }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ entry: entryB }) } as Response);

    const { result, rerender } = renderHook(
      ({ date }) => useDiaryEntry(date, mockLocation),
      { initialProps: { date: '2025-04-25' } }
    );

    await waitFor(() => expect(result.current.entry?.date).toBe('2025-04-25'));

    rerender({ date: '2025-04-26' });

    await waitFor(() => expect(result.current.entry?.date).toBe('2025-04-26'));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('sets uploadError when file validation fails', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entry: null }),
    } as Response);

    const { result } = renderHook(() => useDiaryEntry('2025-04-25', mockLocation));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const invalidFile = new File(['data'], 'doc.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadPhoto(invalidFile);
    });

    expect(result.current.uploadError).toMatch(/PNG|JPEG|WebP|GIF/);
    // No upload fetch should have been made
    expect(global.fetch).toHaveBeenCalledTimes(1); // only the initial GET
  });

  it('clears uploadError when clearUploadError is called', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entry: null }),
    } as Response);

    const { result } = renderHook(() => useDiaryEntry('2025-04-25', mockLocation));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const invalidFile = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    await act(async () => { await result.current.uploadPhoto(invalidFile); });

    expect(result.current.uploadError).not.toBeNull();

    act(() => result.current.clearUploadError());
    expect(result.current.uploadError).toBeNull();
  });

  it('removes a photo from entry state after deletePhoto', async () => {
    const photo = { id: 'photo-1', filename: 'a.jpg', url: 'http://x', storagePath: 'p', createdAt: '' };
    const entryWithPhoto = { ...mockEntry, photos: [photo] };

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ entry: entryWithPhoto }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response);

    const { result } = renderHook(() => useDiaryEntry('2025-04-25', mockLocation));
    await waitFor(() => expect(result.current.entry?.photos).toHaveLength(1));

    await act(async () => { await result.current.deletePhoto('photo-1'); });

    expect(result.current.entry?.photos).toHaveLength(0);
  });

  it('refetches the full entry after a successful upload', async () => {
    const newPhoto = { id: 'p-new', filename: 'new.jpg', url: 'http://x/new.jpg', storagePath: 'u/d/new.jpg', createdAt: '' };
    const entryWithPhoto = { ...mockEntry, photos: [newPhoto] };

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ entry: mockEntry }) } as Response)   // initial GET
      .mockResolvedValueOnce({ ok: true, json: async () => ({ storagePath: 'u/d/new.jpg', token: 'tok', entryId: 'entry-1' }) } as Response) // POST upload-url
      .mockResolvedValueOnce({ ok: true, json: async () => ({ photo: newPhoto }) } as Response)    // POST record photo
      .mockResolvedValueOnce({ ok: true, json: async () => ({ entry: entryWithPhoto }) } as Response); // refetch GET

    const { result } = renderHook(() => useDiaryEntry('2025-04-25', mockLocation));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const validFile = new File(['data'], 'new.jpg', { type: 'image/jpeg' });
    await act(async () => { await result.current.uploadPhoto(validFile); });

    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadError).toBeNull();
    expect(result.current.entry?.photos).toHaveLength(1);
    expect(result.current.entry?.photos[0]).toEqual(newPhoto);
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it('sets uploadError when server rejects the upload', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ entry: mockEntry }) } as Response)
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Storage quota exceeded' }) } as Response);

    const { result } = renderHook(() => useDiaryEntry('2025-04-25', mockLocation));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const validFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => { await result.current.uploadPhoto(validFile); });

    expect(result.current.uploadError).toBe('Storage quota exceeded');
    expect(result.current.entry?.photos).toHaveLength(0);
  });
});

describe('useDiaryEntry — saveContent', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser } as ReturnType<typeof useAuth>);
    global.fetch = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function mountAndLoad(entryOverride = null) {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entry: entryOverride }),
    } as Response);
    const hook = renderHook(() => useDiaryEntry('2025-04-25', mockLocation));
    await act(async () => { await vi.runAllTimersAsync(); });
    return hook;
  }

  it('sets saveStatus to saving immediately, then saved after the API responds', async () => {
    const { result } = await mountAndLoad();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entry: mockEntry }),
    } as Response);

    act(() => { result.current.saveContent('Hello'); });
    expect(result.current.saveStatus).toBe('saving');
    expect(global.fetch).toHaveBeenCalledTimes(1); // only the initial GET so far

    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.current.saveStatus).toBe('saved');
  });

  it('does not fire before 1 second has elapsed', async () => {
    const { result } = await mountAndLoad();

    act(() => { result.current.saveContent('Hello'); });

    // Advance to 999ms — just under the 1s debounce threshold
    await act(async () => { await vi.advanceTimersByTimeAsync(999); });
    expect(global.fetch).toHaveBeenCalledTimes(1); // still only the initial GET
  });

  it('only fires once and sends the latest content when called rapidly', async () => {
    const { result } = await mountAndLoad();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entry: mockEntry }),
    } as Response);

    act(() => {
      result.current.saveContent('H');
      result.current.saveContent('He');
      result.current.saveContent('Hello');
    });

    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });

    // Initial GET + exactly one POST
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const postBody = JSON.parse((vi.mocked(global.fetch).mock.calls[1][1] as RequestInit).body as string);
    expect(postBody.content).toBe('Hello');
  });

  it('sets saveStatus to error when the API call fails', async () => {
    const { result } = await mountAndLoad();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    } as Response);

    act(() => { result.current.saveContent('Hello'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });

    expect(result.current.saveStatus).toBe('error');
  });
});
