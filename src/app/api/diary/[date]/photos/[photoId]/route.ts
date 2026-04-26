import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string; photoId: string }> }
) {
  const { photoId } = await params;
  const { supabase, user, unauthorized } = await getAuthenticatedClient();
  if (unauthorized) return unauthorized;

  const { data: photo, error: fetchError } = await supabase
    .from('diary_photos')
    .select('id, user_id, deleted_at')
    .eq('id', photoId)
    .single();

  if (fetchError || !photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  if (photo.user_id !== user!.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (photo.deleted_at) {
    return NextResponse.json({ error: 'Photo already deleted' }, { status: 410 });
  }

  const { error } = await supabase
    .from('diary_photos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', photoId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
