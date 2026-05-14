// src/app/api/projects/[id]/deliverables/download-url/route.js
// GET /api/projects/[id]/deliverables/download-url
//
// Returns a short-lived signed download URL for a deliverable file stored
// in the project-deliverables bucket. Accessible by the assigned student
// OR the owning company.
//
// Query params:
//   storagePath (required) — the path stored in project_deliverables.submission_file_url
//                            that starts with "project-deliverables/"

import { requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

const BUCKET     = 'project-deliverables'
const EXPIRY_SEC = 120 // 2-minute signed URL

export async function GET(request, { params }) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student', 'company'],
      forbiddenMessage: 'Authentication required',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase, user } = auth
    const { id: projectId } = await params

    const { searchParams } = new URL(request.url)
    const storagePath = searchParams.get('storagePath')

    if (!storagePath) {
      return NextResponse.json({ error: 'storagePath is required' }, { status: 400 })
    }

    // Verify the requesting user has access to this project
    if (auth.profile?.role === 'student') {
      const { data: app } = await supabase
        .from('applications')
        .select('id')
        .eq('project_id', projectId)
        .eq('student_id', user.id)
        .eq('status', 'selected')
        .single()

      if (!app) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else {
      // company — verify they own the project
      const { data: project } = await supabase
        .from('projects')
        .select('company_id')
        .eq('id', projectId)
        .single()

      if (!project || project.company_id !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Strip bucket prefix if present
    const cleanPath = storagePath.startsWith(`${BUCKET}/`)
      ? storagePath.slice(`${BUCKET}/`.length)
      : storagePath

    const { data, error: storageError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(cleanPath, EXPIRY_SEC)

    if (storageError) {
      console.error('[deliverables/download-url] Storage error:', storageError)
      return NextResponse.json({ error: 'Failed to create download URL' }, { status: 500 })
    }

    return NextResponse.json({ signedUrl: data.signedUrl })
  } catch (err) {
    console.error('[deliverables/download-url] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
