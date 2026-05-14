// src/app/api/projects/[id]/chat/route.js
// POST /api/projects/[id]/chat
// Sends a message to the project-specific chat.

import { requireAuthAndRole, parseJsonBody } from '@/lib/api'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student', 'company'],
    })
    if (auth.errorResponse) return auth.errorResponse

    const { user, role } = auth
    const { id: projectId } = await params
    const adminClient = await createAdminSupabaseClient()

    // 1. Verify project access
    const { data: project } = await adminClient
      .from('projects')
      .select('id, company_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify ownership or assignment
    if (role === 'company' && project.company_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (role === 'student') {
      const { data: app } = await adminClient
        .from('applications')
        .select('id')
        .eq('project_id', projectId)
        .eq('student_id', user.id)
        .eq('status', 'selected')
        .single()

      if (!app) {
        return NextResponse.json({ error: 'Access denied — not assigned' }, { status: 403 })
      }
    }

    // 2. Parse message
    const parsed = await parseJsonBody(request)
    if (parsed.errorResponse) return parsed.errorResponse
    const { content } = parsed.body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
    }

    // 3. Insert message
    const { data: message, error: insertError } = await adminClient
      .from('chat_messages')
      .insert({
        project_id: projectId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select(`
        id, content, created_at, sender_id,
        sender:users_profiles!sender_id ( full_name, role )
      `)
      .single()

    if (insertError) {
      console.error('[chat POST] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message }, { status: 201 })
  } catch (err) {
    console.error('[chat POST] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request, { params }) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student', 'company'],
    })
    if (auth.errorResponse) return auth.errorResponse

    const { id: projectId } = await params
    const adminClient = await createAdminSupabaseClient()

    // History limit
    const { data: messages, error } = await adminClient
      .from('chat_messages')
      .select(`
        id, content, created_at, sender_id,
        sender:users_profiles!sender_id ( full_name, role )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      console.error('[chat GET] Error:', error)
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    return NextResponse.json({ messages: messages ?? [] })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
