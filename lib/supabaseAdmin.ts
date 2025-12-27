import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminInstance: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Debug: log what we have (without exposing the full keys)
  if (typeof window === 'undefined') {
    // Server-side only
    console.log('Supabase URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.log('Service Role Key:', serviceRoleKey ? `SET (${serviceRoleKey.substring(0, 20)}...)` : 'NOT SET');
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      `Supabase admin env vars are not set. URL: ${supabaseUrl ? 'SET' : 'NOT SET'}, Key: ${serviceRoleKey ? 'SET' : 'NOT SET'}`,
    );
  }

  supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  return supabaseAdminInstance;
}

// Export as a getter that initializes on first access
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const instance = getSupabaseAdmin();
    const value = instance[prop as keyof SupabaseClient];
    // If it's a function, bind it to the instance
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});


