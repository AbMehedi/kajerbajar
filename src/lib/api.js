import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export function jsonError(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

export async function parseJsonBody(request, invalidMessage = 'Invalid JSON body.') {
  try {
    return { body: await request.json() }
  } catch {
    return { errorResponse: jsonError(invalidMessage, 400) }
  }
}

export async function requireAuth({ unauthorizedMessage = 'Unauthorized' } = {}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { errorResponse: jsonError(unauthorizedMessage, 401) }
  }

  return { supabase, user }
}

export async function requireAuthAndRole({
  allowedRoles = [],
  unauthorizedMessage = 'Unauthorized',
  forbiddenMessage = 'Forbidden',
} = {}) {
  const auth = await requireAuth({ unauthorizedMessage })
  if (auth.errorResponse) return auth

  const { supabase, user } = auth
  const { data: profile, error: profileError } = await supabase
    .from('users_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.role) {
    return { ...auth, errorResponse: jsonError(forbiddenMessage, 403) }
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return { ...auth, role: profile.role, profile, errorResponse: jsonError(forbiddenMessage, 403) }
  }

  return { ...auth, role: profile.role, profile }
}
