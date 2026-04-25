import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DiaryEntry, DiaryPhoto } from '@/types/diary';

const SIGNED_URL_EXPIRY = 3600;

async function buildEntry(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  row: Record<string, unknown>
): Promise<DiaryEntry> {
  const { data: photoRows } = await supabase
    .from('diary_photos')
    .select('id, storage_path, filename, created_at')
    .eq('diary_entry_id', row.id as string)
    .order('created_at');

  const photos: DiaryPhoto[] = await Promise.all(
    (photoRows ?? []).map(async (p) => {
      const { data } = await supabase.storage
        .from('diary-photos')
        .createSignedUrl(p.storage_path as string, SIGNED_URL_EXPIRY);
      return {
        id: p.id as string,
        filename: p.filename as string,
        url: data?.signedUrl ?? '',
        storagePath: p.storage_path as string,
        createdAt: p.created_at as string,
      };
    })
  );

  return {
    id: row.id as string,
    date: row.date as string,
    content: row.content as string,
    locationName: (row.location_name as string | null) ?? null,
    lat: (row.lat as number | null) ?? null,
    lng: (row.lng as number | null) ?? null,
    photos,
    updatedAt: row.updated_at as string,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: row, error } = await supabase
    .from('diary_entries')
    .select('id, date, content, location_name, lat, lng, updated_at')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ entry: null });

  const entry = await buildEntry(supabase, row as Record<string, unknown>);
  return NextResponse.json({ entry });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
        user_id: user.id,
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
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entry = await buildEntry(supabase, row as Record<string, unknown>);
  return NextResponse.json({ entry });
}
