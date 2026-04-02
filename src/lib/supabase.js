// src/lib/supabase.js
// Browser-side Supabase client (uses anon key, safe for frontend)
// Member A owns this file.

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
