import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/server';
import { DiaryEntry, DiaryPhoto } from '@/types/diary';

const SIGNED_URL_EXPIRY = 3600;

interface DiaryEntryRow {
  id: string;
  date: string;
  content: string;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  updated_at: string;
}

interface DiaryPhotoRow {
  id: string;
  storage_path: string;
  filename: string;
  created_at: string;
}

async function buildEntry(
  supabase: Awaited<ReturnType<typeof getAuthenticatedClient>>['supabase'],
  row: DiaryEntryRow
): Promise<DiaryEntry> {
  const { data: photoRows } = await supabase
    .from('diary_photos')
    .select('id, storage_path, filename, created_at')
    .eq('diary_entry_id', row.id)
    .is('deleted_at', null)
    .order('created_at') as { data: DiaryPhotoRow[] | null };

  const paths = (photoRows ?? []).map((p) => p.storage_path);
  const { data: signedUrls } = paths.length > 0
    ? await supabase.storage.from('diary-photos').createSignedUrls(paths, SIGNED_URL_EXPIRY)
    : { data: [] };

  const urlMap = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));

  const photos: DiaryPhoto[] = (photoRows ?? []).map((p) => ({
    id: p.id,
    filename: p.filename,
    url: urlMap.get(p.storage_path) ?? '',
    storagePath: p.storage_path,
    createdAt: p.created_at,
  }));

  return {
    id: row.id,
    date: row.date,
    content: row.content,
    locationName: row.location_name,
    lat: row.lat,
    lng: row.lng,
    photos,
    updatedAt: row.updated_at,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const { supabase, user, unauthorized } = await getAuthenticatedClient();
  if (unauthorized) return unauthorized;

  const { data: row, error } = await supabase
    .from('diary_entries')
    .select('id, date, content, location_name, lat, lng, updated_at')
    .eq('user_id', user!.id)
    .eq('date', date)
    .is('deleted_at', null)
    .maybeSingle() as { data: DiaryEntryRow | null; error: unknown };

  // PGRST116 means zero rows — maybeSingle() shouldn't produce it, but handle
  // it defensively so no-entry is never treated as a server error.
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === 'PGRST116') return NextResponse.json({ entry: null });
    return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 });
  }
  if (!row) return NextResponse.json({ entry: null });

  try {
    const entry = await buildEntry(supabase, row);
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: 'Failed to load entry' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const { supabase, user, unauthorized } = await getAuthenticatedClient();
  if (unauthorized) return unauthorized;

  const body = await request.json() as {
    content: string;
    locationName?: string | null;
    lat?: number | null;
    lng?: number | null;
  };

  const { data: row, error } = await supabase
    .from('diary_entries')
    .upsert(
      {
        user_id: user!.id,
        date,
        content: body.content,
        location_name: body.locationName ?? null,
        lat: body.lat ?? null,
        lng: body.lng ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' }
    )
    .select('id, date, content, location_name, lat, lng, updated_at')
    .single() as { data: DiaryEntryRow | null; error: unknown };

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 });

  const entry = await buildEntry(supabase, row!);
  return NextResponse.json({ entry });
}
