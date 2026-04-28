import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/server';
import { validatePhotoMeta, buildStoragePath } from '@/lib/diary';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const { supabase, user, unauthorized } = await getAuthenticatedClient();
  if (unauthorized) return unauthorized;

  const body = await request.json() as {
    filename: string;
    contentType: string;
    size: number;
    locationName?: string | null;
    lat?: number | null;
    lng?: number | null;
  };

  const validation = validatePhotoMeta(body.contentType, body.size);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }

  // Create diary entry if it doesn't exist yet
  let { data: existingEntry } = await supabase
    .from('diary_entries')
    .select('id')
    .eq('user_id', user!.id)
    .eq('date', date)
    .is('deleted_at', null)
    .maybeSingle();

  if (!existingEntry) {
    const { data: newEntry, error: insertError } = await supabase
      .from('diary_entries')
      .insert({
        user_id: user!.id,
        date,
        content: '',
        location_name: body.locationName ?? null,
        lat: body.lat ?? null,
        lng: body.lng ?? null,
      })
      .select('id')
      .single();
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    existingEntry = newEntry;
  }

  const storagePath = buildStoragePath(user!.id, date, body.filename);

  const { data: signedData, error: signedError } = await supabase.storage
    .from('diary-photos')
    .createSignedUploadUrl(storagePath);

  if (signedError) return NextResponse.json({ error: signedError.message }, { status: 500 });

  return NextResponse.json({
    signedUrl: signedData.signedUrl,
    token: signedData.token,
    storagePath,
    entryId: existingEntry!.id,
  });
}
