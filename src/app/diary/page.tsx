'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, BookOpen, Images, MapPin, Camera } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DiaryPhoto } from '@/types/diary';
import { cn } from '@/lib/utils';

interface EntryListItem {
  id: string;
  date: string;
  content: string;
  locationName: string | null;
  lat: number | null;
  lng: number | null;
  updatedAt: string;
  photos: DiaryPhoto[];
}

interface PhotoWithDate extends DiaryPhoto {
  date: string;
  locationName: string | null;
  lat: number | null;
  lng: number | null;
}

type ViewMode = 'timeline' | 'photos';

function useDiaryList(enabled: boolean, userId: string | null) {
  const [entries, setEntries] = useState<EntryListItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const hasFetched = useRef(false);

  const loadMore = useCallback(async (currentPage: number) => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/diary?page=${currentPage}`);
      if (!res.ok) return;
      const data = await res.json() as { entries: EntryListItem[]; hasMore: boolean };
      setEntries((prev) => [...prev, ...data.entries]);
      setHasMore(data.hasMore);
      setPage(currentPage + 1);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [enabled]);

  useEffect(() => {
    hasFetched.current = false;
    setEntries([]);
    setPage(0);
    setHasMore(true);
    setInitialLoaded(false);
  }, [userId]);

  useEffect(() => {
    if (!enabled) return;
    // hasFetched guards against re-firing when loadMore is recreated (e.g. when enabled toggles)
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadMore(0);
  }, [enabled, loadMore]);

  const loadNext = useCallback(() => loadMore(page), [loadMore, page]);

  return { entries, hasMore, loading, initialLoaded, loadNext };
}

function groupByMonth<T>(items: T[], getDate: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = format(parseISO(getDate(item)), 'MMMM yyyy');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return [...groups.entries()];
}

function explorerUrl(date: string, lat: number | null, lng: number | null): string {
  const params = new URLSearchParams({ date });
  if (lat != null && lng != null) {
    params.set('lat', String(lat));
    params.set('lng', String(lng));
  }
  return `/?${params}`;
}

function EntryCard({ entry }: { entry: EntryListItem }) {
  const thumbnails = entry.photos.slice(0, 3);
  const extraCount = entry.photos.length - thumbnails.length;

  return (
    <Link href={explorerUrl(entry.date, entry.lat, entry.lng)} className="block group">
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-400 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-sm font-bold text-zinc-900">
              {format(parseISO(entry.date), 'EEE d MMM')}
            </p>
            {entry.locationName && (
              <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {entry.locationName}
              </p>
            )}
          </div>
          {entry.photos.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-zinc-400 shrink-0">
              <Camera className="w-3.5 h-3.5" /> {entry.photos.length}
            </span>
          )}
        </div>

        {entry.content.trim() ? (
          <p className="text-sm text-zinc-600 leading-relaxed line-clamp-3">
            {entry.content.trim()}
          </p>
        ) : (
          <p className="text-sm text-zinc-300 italic">No text written</p>
        )}

        {thumbnails.length > 0 && (
          <div className="flex gap-2 mt-3">
            {thumbnails.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.filename}
                className="w-16 h-16 rounded-xl object-cover bg-zinc-100 shrink-0"
              />
            ))}
            {extraCount > 0 && (
              <div className="w-16 h-16 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-zinc-500">+{extraCount}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function TimelineView({ entries }: { entries: EntryListItem[] }) {
  const groups = groupByMonth(entries, (e) => e.date);
  return (
    <div className="space-y-8">
      {groups.map(([month, monthEntries]) => (
        <div key={month}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">{month}</h2>
          <div className="space-y-3">
            {monthEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PhotoGridView({ entries }: { entries: EntryListItem[] }) {
  const allPhotos: PhotoWithDate[] = entries.flatMap((entry) =>
    entry.photos.map((p) => ({
      ...p,
      date: entry.date,
      locationName: entry.locationName,
      lat: entry.lat,
      lng: entry.lng,
    }))
  );

  if (allPhotos.length === 0) {
    return (
      <div className="text-center py-16">
        <Camera className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
        <p className="text-sm text-zinc-400">No photos in your diary yet</p>
      </div>
    );
  }

  const groups = groupByMonth(allPhotos, (p) => p.date);

  return (
    <div className="space-y-8">
      {groups.map(([month, photos]) => (
        <div key={month}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">{month}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((photo) => (
              <Link
                key={photo.id}
                href={explorerUrl(photo.date, photo.lat, photo.lng)}
                title={format(parseISO(photo.date), 'EEE d MMM yyyy')}
                className="group"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-zinc-100 group-hover:opacity-90 transition-opacity">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-zinc-400 mt-1 text-center">
                  {format(parseISO(photo.date), 'MMM d')}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 animate-pulse">
      <div className="h-4 bg-zinc-100 rounded w-28 mb-2" />
      <div className="h-3 bg-zinc-100 rounded w-full mb-1.5" />
      <div className="h-3 bg-zinc-100 rounded w-4/5" />
    </div>
  );
}

export default function DiaryBrowserPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<ViewMode>('timeline');
  const { entries, hasMore, loading, initialLoaded, loadNext } = useDiaryList(!authLoading && !!user, user?.id ?? null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEmpty = initialLoaded && entries.length === 0;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to explorer
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-zinc-900 rounded-2xl">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">My Diary</h1>
          </div>
          <div className="bg-zinc-100 p-1 rounded-xl inline-flex">
            <button
              onClick={() => setView('timeline')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                view === 'timeline' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              <BookOpen className="w-3.5 h-3.5" /> Timeline
            </button>
            <button
              onClick={() => setView('photos')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                view === 'photos' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              <Images className="w-3.5 h-3.5" /> Photos
            </button>
          </div>
        </div>

        {/* Content */}
        {!initialLoaded ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : isEmpty ? (
          <div className="text-center py-24">
            <div className="inline-flex p-4 bg-zinc-100 rounded-3xl mb-4">
              <BookOpen className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-zinc-500 font-medium">No diary entries yet</p>
            <p className="text-sm text-zinc-400 mt-1">Head back to the explorer to write your first one.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-2xl hover:bg-zinc-800 transition-colors"
            >
              Go to explorer
            </Link>
          </div>
        ) : (
          <>
            {view === 'timeline' ? (
              <TimelineView entries={entries} />
            ) : (
              <PhotoGridView entries={entries} />
            )}

            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={loadNext}
                  disabled={loading}
                  className="px-6 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-all disabled:opacity-50"
                >
                  {loading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
