import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string; photoId: string }> }
) {
  const { photoId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: photo, error: fetchError } = await supabase
    .from('diary_photos')
    .select('id, storage_path, user_id')
    .eq('id', photoId)
    .single();

  if (fetchError || !photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  if (photo.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await supabase.storage.from('diary-photos').remove([photo.storage_path as string]);

  const { error: deleteError } = await supabase
    .from('diary_photos')
    .delete()
    .eq('id', photoId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
