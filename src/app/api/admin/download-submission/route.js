// src/app/api/admin/download-submission/route.js
// GET /api/admin/download-submission?path=<storagePath>
// Admin-only: generates a 60-second signed download URL for a submission file.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const BUCKET = 'skill-submissions'
const EXPIRY_SECONDS = 60

export async function GET(request) {
  try {
    // 1. Auth check
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Admin role check
    const { data: profile } = await supabase
      .from('users_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admins only' }, { status: 403 })
    }

    // 3. Get the storage path from query string
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 })
    }

    // 4. Generate a short-lived signed download URL
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, EXPIRY_SECONDS)

    if (error) {
      console.error('[download-submission] Storage error:', error)
      return NextResponse.json({ error: 'Failed to create download URL' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (err) {
    console.error('[download-submission] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
