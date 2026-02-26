import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminInstance: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  // Debug: log what we have (without exposing the full keys)
  if (typeof window === 'undefined') {
    console.log('Supabase URL:', supabaseUrl ? `${supabaseUrl.slice(0, 30)}...` : 'NOT SET');
    console.log('Service Role Key:', serviceRoleKey ? 'SET' : 'NOT SET');
  }

  const isPlaceholder = !supabaseUrl || !serviceRoleKey ||
    supabaseUrl.includes('placeholder') || serviceRoleKey.includes('placeholder') ||
    supabaseUrl.includes('your_') || serviceRoleKey.includes('your_');
  
  if (isPlaceholder) {
    console.warn('⚠️ Supabase admin env vars are not set or are placeholders.');
    supabaseAdminInstance = createClient('https://placeholder.supabase.co', 'placeholder_key', {
      auth: { persistSession: false },
    });
    return supabaseAdminInstance;
  }

  // Custom fetch with no-store avoids Vercel serverless "fetch failed" in some environments
  const customFetch: typeof fetch = (input, init) =>
    fetch(input, { ...init, cache: 'no-store' });

  supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    global: { fetch: customFetch },
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


