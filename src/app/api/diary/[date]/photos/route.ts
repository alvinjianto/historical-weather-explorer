import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/server';
import { validatePhotoFile, buildStoragePath } from '@/lib/diary';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const { supabase, user, unauthorized } = await getAuthenticatedClient();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const locationName = formData.get('locationName') as string | null;
  const lat = formData.get('lat') ? Number(formData.get('lat')) : null;
  const lng = formData.get('lng') ? Number(formData.get('lng')) : null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const validation = validatePhotoFile(file);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }

  // Fetch existing entry, creating one only if needed
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
        location_name: locationName ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
      })
      .select('id')
      .single();
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    existingEntry = newEntry;
  }

  const entryId = existingEntry!.id as string;

  const storagePath = buildStoragePath(user!.id, date, file.name);
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('diary-photos')
    .upload(storagePath, arrayBuffer, { contentType: file.type });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: photoRow, error: photoError } = await supabase
    .from('diary_photos')
    .insert({
      user_id: user!.id,
      diary_entry_id: entryId,
      storage_path: storagePath,
      filename: file.name,
    })
    .select('id, storage_path, filename, created_at')
    .single();

  if (photoError) {
    await supabase.storage.from('diary-photos').remove([storagePath]);
    return NextResponse.json({ error: photoError.message }, { status: 500 });
  }

  const { data: signed } = await supabase.storage
    .from('diary-photos')
    .createSignedUrl(storagePath, 3600);

  return NextResponse.json({
    photo: {
      id: photoRow.id,
      filename: photoRow.filename,
      url: signed?.signedUrl ?? '',
      storagePath: photoRow.storage_path,
      createdAt: photoRow.created_at,
    },
  });
}
