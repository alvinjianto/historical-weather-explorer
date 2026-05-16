import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/server';
import { DiaryPhoto } from '@/types/diary';

const SIGNED_URL_EXPIRY = 3600;
const DEFAULT_LIMIT = 20;

interface EntryRow {
  id: string;
  date: string;
  content: string;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  updated_at: string;
}

interface PhotoRow {
  id: string;
  diary_entry_id: string;
  storage_path: string;
  filename: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  const { supabase, user, unauthorized } = await getAuthenticatedClient();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)));
  const offset = page * limit;

  const { data: entryRows, error } = await supabase
    .from('diary_entries')
    .select('id, date, content, location_name, lat, lng, updated_at')
    .eq('user_id', user!.id)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .range(offset, offset + limit) as { data: EntryRow[] | null; error: unknown };

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 });

  const rows = entryRows ?? [];
  const hasMore = rows.length > limit;
  const entries = rows.slice(0, limit);

  if (entries.length === 0) {
    return NextResponse.json({ entries: [], hasMore: false });
  }

  const entryIds = entries.map((e) => e.id);

  const { data: photoRows } = await supabase
    .from('diary_photos')
    .select('id, diary_entry_id, storage_path, filename, created_at')
    .in('diary_entry_id', entryIds)
    .is('deleted_at', null)
    .order('created_at') as { data: PhotoRow[] | null };

  const allPaths = (photoRows ?? []).map((p) => p.storage_path);
  const { data: signedUrls } = allPaths.length > 0
    ? await supabase.storage.from('diary-photos').createSignedUrls(allPaths, SIGNED_URL_EXPIRY)
    : { data: [] };

  const urlMap = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));

  const photosByEntry = new Map<string, PhotoRow[]>();
  for (const photo of (photoRows ?? [])) {
    if (!photosByEntry.has(photo.diary_entry_id)) {
      photosByEntry.set(photo.diary_entry_id, []);
    }
    photosByEntry.get(photo.diary_entry_id)!.push(photo);
  }

  const result = entries.map((entry) => ({
    id: entry.id,
    date: entry.date,
    content: entry.content,
    locationName: entry.location_name,
    lat: entry.lat,
    lng: entry.lng,
    updatedAt: entry.updated_at,
    photos: (photosByEntry.get(entry.id) ?? []).map((p): DiaryPhoto => ({
      id: p.id,
      filename: p.filename,
      url: urlMap.get(p.storage_path) ?? '',
      storagePath: p.storage_path,
      createdAt: p.created_at,
    })),
  }));

  return NextResponse.json({ entries: result, hasMore });
}
