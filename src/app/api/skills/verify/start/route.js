// src/app/api/skills/verify/start/route.js
// POST /api/skills/verify/start
// Student starts a skill verification — AI generates a project brief

import { parseJsonBody, requireAuthAndRole } from '@/lib/api'
import { generateSkillBrief } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student'],
      forbiddenMessage: 'Only students can verify skills',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase, user } = auth

    // 3. Validate input
    const parsed = await parseJsonBody(request)
    if (parsed.errorResponse) return parsed.errorResponse
    const { skill } = parsed.body
    if (!skill || skill.trim().length < 2) {
      return NextResponse.json({ error: 'A valid skill name is required' }, { status: 400 })
    }

    // 4. Generate AI brief using Llama 3 via Groq
    let brief
    try {
      brief = await generateSkillBrief(skill.trim())
    } catch (aiError) {
      console.error('[verify/start] AI generation failed:', aiError?.message || aiError)
      // Fallback brief so the flow still works if AI is unavailable
      brief = `📌 TASK TITLE: ${skill.trim()} Practical Assessment
🎯 OBJECTIVE: Demonstrate your ${skill.trim()} skills by building a small, functional project.
📋 REQUIREMENTS:
  - Build a working demo or write a detailed explanation of a project you completed
  - Explain the key concepts of ${skill.trim()} that you used
  - Describe any challenges you faced and how you solved them
⏱️ ESTIMATED TIME: 2 hours
📦 DELIVERABLE: A text description of your project, what you built, and what you learned.`
    }

    // 5. Save verification record to DB
    const { data: verification, error: dbError } = await supabase
      .from('skill_verifications')
      .insert({
        student_id: user.id,
        skill_category: skill.trim(),
        ai_brief: brief,
        status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      console.error('[verify/start] DB error:', dbError)
      return NextResponse.json({ error: 'Failed to save verification' }, { status: 500 })
    }

    return NextResponse.json({ verification }, { status: 201 })
  } catch (err) {
    console.error('[verify/start] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
