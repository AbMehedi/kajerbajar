// src/app/api/skills/verify/upload-url/route.js
// GET /api/skills/verify/upload-url
// Returns a signed upload URL so the browser can PUT a file directly to Supabase Storage.
// The file never passes through the Next.js server.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const BUCKET = 'skill-submissions'
const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

function sanitizeFilename(name) {
  // Replace anything that isn't alphanumeric, dash, underscore, or dot
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(0, 200)
}

export async function GET(request) {
  try {
    // 1. Auth check
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Role check
    const { data: profile } = await supabase
      .from('users_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'student') {
      return NextResponse.json({ error: 'Only students can upload submissions' }, { status: 403 })
    }

    // 3. Read query params
    const { searchParams } = new URL(request.url)
    const verificationId = searchParams.get('verificationId')
    const filename      = searchParams.get('filename')
    const fileSize      = parseInt(searchParams.get('fileSize') || '0', 10)

    if (!verificationId || !filename) {
      return NextResponse.json({ error: 'verificationId and filename are required' }, { status: 400 })
    }

    if (fileSize > MAX_BYTES) {
      return NextResponse.json({ error: 'File exceeds the 50 MB limit' }, { status: 413 })
    }

    // 4. Confirm this verification belongs to the student and is open for submission
    const { data: verification, error: fetchError } = await supabase
      .from('skill_verifications')
      .select('id, status')
      .eq('id', verificationId)
      .eq('student_id', user.id)
      .single()

    if (fetchError || !verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }

    const allowed = ['pending', 'revision_requested']
    if (!allowed.includes(verification.status)) {
      return NextResponse.json({ error: 'Verification is not open for submission' }, { status: 409 })
    }

    // 5. Build a safe storage path: {userId}/{verificationId}/{sanitized-filename}
    const safeName  = sanitizeFilename(filename)
    const storagePath = `${user.id}/${verificationId}/${safeName}`

    // 6. Create signed upload URL (valid for 5 minutes)
    const { data, error: storageError } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (storageError) {
      console.error('[upload-url] Storage error:', storageError)
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path:      storagePath,
      token:     data.token,
    })
  } catch (err) {
    console.error('[upload-url] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
