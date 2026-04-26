import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function getAuthenticatedClient() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  if (error || !user) {
    return { supabase, user: null, unauthorized: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { supabase, user, unauthorized: null };
}
