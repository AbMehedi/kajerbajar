import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/projects/[id]/milestones
// Fetch all milestones for a project
export async function GET(request, { params }) {
  try {
    const { id: projectId } = await params
    const supabase = await createServerSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: milestones, error } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ milestones })
  } catch (error) {
    console.error('[GET milestones] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/projects/[id]/milestones
// Add a new milestone (Company only)
export async function POST(request, { params }) {
  try {
    const { id: projectId } = await params
    const { title } = await request.json()
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Insert milestone. RLS ensures only the company owning the project can do this.
    const { data: milestone, error } = await supabase
      .from('project_milestones')
      .insert({ project_id: projectId, title })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ milestone })
  } catch (error) {
    console.error('[POST milestones] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/projects/[id]/milestones
// Update a milestone's status (Company only)
export async function PATCH(request, { params }) {
  try {
    const { id: projectId } = await params
    const { milestoneId, status } = await request.json()
    
    if (!milestoneId || !status) {
      return NextResponse.json({ error: 'Milestone ID and status are required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const updateData = { status }
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else {
      updateData.completed_at = null
    }

    const { data: milestone, error } = await supabase
      .from('project_milestones')
      .update(updateData)
      .eq('id', milestoneId)
      .eq('project_id', projectId) // Extra safety
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ milestone })
  } catch (error) {
    console.error('[PATCH milestones] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/milestones
// Delete a milestone (Company only)
export async function DELETE(request, { params }) {
  try {
    const { id: projectId } = await params
    const url = new URL(request.url)
    const milestoneId = url.searchParams.get('milestoneId')
    
    if (!milestoneId) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('project_milestones')
      .delete()
      .eq('id', milestoneId)
      .eq('project_id', projectId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE milestones] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
