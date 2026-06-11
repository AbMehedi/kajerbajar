// src/app/api/projects/[id]/deliverables/upload-url/route.js
// GET /api/projects/[id]/deliverables/upload-url
//
// Returns a signed upload URL so the browser can PUT a file directly to
// Supabase Storage (project-deliverables bucket). The file never passes
// through the Next.js server, keeping uploads fast and serverless-friendly.
//
// Query params:
//   filename   (required) — original file name
//   fileSize   (optional) — bytes, validated against 100 MB limit

import { requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

const BUCKET   = 'project-deliverables'
const MAX_BYTES = 100 * 1024 * 1024 // 100 MB

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(0, 200)
}

export async function GET(request, { params }) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student'],
      forbiddenMessage: 'Only students can upload deliverables',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase, user } = auth
    const { id: projectId } = await params

    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    const fileSize = parseInt(searchParams.get('fileSize') || '0', 10)

    if (!filename) {
      return NextResponse.json({ error: 'filename is required' }, { status: 400 })
    }

    if (fileSize > MAX_BYTES) {
      return NextResponse.json({ error: 'File exceeds the 100 MB limit' }, { status: 413 })
    }

    // Verify student is selected for this project
    const { data: app } = await supabase
      .from('applications')
      .select('id')
      .eq('project_id', projectId)
      .eq('student_id', user.id)
      .eq('status', 'selected')
      .single()

    if (!app) {
      return NextResponse.json({ error: 'You are not assigned to this project' }, { status: 403 })
    }

    // Build storage path: {projectId}/{studentId}/{timestamp}-{filename}
    const safeName    = sanitizeFilename(filename)
    const timestamp   = Date.now()
    const storagePath = `${projectId}/${user.id}/${timestamp}-${safeName}`

    // Create a signed upload URL (valid 10 minutes)
    const { data, error: storageError } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (storageError) {
      console.error('[deliverables/upload-url] Storage error:', storageError)
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
    }

    return NextResponse.json({
      signedUrl:   data.signedUrl,
      storagePath,
      token:       data.token,
    })
  } catch (err) {
    console.error('[deliverables/upload-url] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
