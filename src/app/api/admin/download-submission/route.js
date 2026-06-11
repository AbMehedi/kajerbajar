// src/app/api/admin/download-submission/route.js
// GET /api/admin/download-submission?path=<storagePath>
// Admin-only: generates a 60-second signed download URL for a submission file.

import { requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PRIMARY_BUCKET = 'module-submissions'
const LEGACY_BUCKET = 'skill-submissions'
const EXPIRY_SECONDS = 60

export async function GET(request) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['admin'],
      forbiddenMessage: 'Admins only',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase } = auth

    // 3. Get the storage path from query string
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 })
    }

    // 4. Generate a short-lived signed download URL
    let { data, error } = await supabase.storage
      .from(PRIMARY_BUCKET)
      .createSignedUrl(path, EXPIRY_SECONDS)

    // Backward compatibility for pre-learning-module submissions.
    if (error) {
      const fallback = await supabase.storage
        .from(LEGACY_BUCKET)
        .createSignedUrl(path, EXPIRY_SECONDS)
      data = fallback.data
      error = fallback.error
    }

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
