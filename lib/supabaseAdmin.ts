import { createClient } from '@supabase/supabase-js';

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

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});


