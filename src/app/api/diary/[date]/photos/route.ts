import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validatePhotoFile, buildStoragePath } from '@/lib/diary';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  // Ensure a diary entry exists for this date (upsert with empty content if none)
  const { data: entryRow, error: entryError } = await supabase
    .from('diary_entries')
    .upsert(
      {
        user_id: user.id,
        date,
        content: '',
        location_name: locationName ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date', ignoreDuplicates: true }
    )
    .select('id')
    .single();

  if (entryError) return NextResponse.json({ error: entryError.message }, { status: 500 });

  // Get the entry id (either just created or already existed, and not soft-deleted)
  const { data: existingEntry } = await supabase
    .from('diary_entries')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', date)
    .is('deleted_at', null)
    .single();

  const entryId = (entryRow ?? existingEntry)?.id as string;
  if (!entryId) return NextResponse.json({ error: 'Failed to resolve diary entry' }, { status: 500 });

  const storagePath = buildStoragePath(user.id, date, file.name);
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('diary-photos')
    .upload(storagePath, arrayBuffer, { contentType: file.type });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: photoRow, error: photoError } = await supabase
    .from('diary_photos')
    .insert({
      user_id: user.id,
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
