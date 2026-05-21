import { NextResponse } from 'next/server'
import { requireAuthAndRole, parseJsonBody, jsonError } from '@/lib/api'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student', 'company', 'admin'],
      forbiddenMessage: 'Unauthorized',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase: userClient, user } = auth
    const { searchParams } = new URL(request.url)

    // DEBUG: Use admin client to bypass RLS and see if records exist
    const adminClient = await createAdminSupabaseClient()
    const { data: adminAll } = await adminClient.from('notifications').select('*').eq('user_id', user.id)
    console.log('[notifications GET] Admin check (rows for this user):', adminAll?.length || 0)

    const unreadCountOnly = searchParams.get('unreadCount') === '1'
    const limit = Number(searchParams.get('limit') ?? 20)
    const offset = Number(searchParams.get('offset') ?? 0)

    if (unreadCountOnly) {
      const { count, error } = await userClient
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('[notifications GET] count error:', error)
        return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
      }

      return NextResponse.json({ unreadCount: count ?? 0 })
    }

    const { data, error } = await userClient
      .from('notifications')
      .select('id, type, title, body, data, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[notifications GET] list error:', error)
      return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
    }

    return NextResponse.json({ notifications: data ?? [] })
  } catch (err) {
    console.error('[notifications GET] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student', 'company', 'admin'],
      forbiddenMessage: 'Unauthorized',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase, user } = auth
    const { body, errorResponse } = await parseJsonBody(request, 'Invalid JSON body.')
    if (errorResponse) return errorResponse

    const { ids, markAll } = body ?? {}

    if (!markAll && (!Array.isArray(ids) || ids.length === 0)) {
      return jsonError('Notification ids are required', 400)
    }

    let query = supabase.from('notifications').update({ is_read: true })

    if (markAll) {
      query = query.eq('user_id', user.id)
    } else {
      query = query.in('id', ids).eq('user_id', user.id)
    }

    const { error } = await query

    if (error) {
      console.error('[notifications PATCH] update error:', error)
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[notifications PATCH] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
