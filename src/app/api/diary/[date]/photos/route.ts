import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const { supabase, user, unauthorized } = await getAuthenticatedClient();
  if (unauthorized) return unauthorized;

  const body = await request.json() as {
    storagePath: string;
    filename: string;
    entryId: string;
  };

  if (!body.storagePath || !body.filename || !body.entryId) {
    return NextResponse.json({ error: 'storagePath, filename, and entryId are required' }, { status: 400 });
  }

  // Verify the entry belongs to this user before linking the photo
  const { data: entry } = await supabase
    .from('diary_entries')
    .select('id')
    .eq('id', body.entryId)
    .eq('user_id', user!.id)
    .eq('date', date)
    .is('deleted_at', null)
    .maybeSingle();

  if (!entry) return NextResponse.json({ error: 'Diary entry not found' }, { status: 404 });

  const { data: photoRow, error: photoError } = await supabase
    .from('diary_photos')
    .insert({
      user_id: user!.id,
      diary_entry_id: body.entryId,
      storage_path: body.storagePath,
      filename: body.filename,
    })
    .select('id, storage_path, filename, created_at')
    .single();

  if (photoError) return NextResponse.json({ error: photoError.message }, { status: 500 });

  const { data: signed } = await supabase.storage
    .from('diary-photos')
    .createSignedUrl(body.storagePath, 3600);

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
