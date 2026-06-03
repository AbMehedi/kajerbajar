// src/lib/ai.js
// AI client for KaajerBazar — Learning Module Brief Generation
//
// Uses the Grok API (xAI) via the OpenAI-compatible SDK.
// Default model: grok-2-1212
//
// Environment variables:
//   GROQ_API_KEY        — Your Groq API key (required)
//   AI_BRIEF_MODEL      — Model name (default: "llama-3.1-8b-instant")
//   AI_BRIEF_BASE_URL   — API base URL (default: "https://api.groq.com/openai/v1")
//
// NOTE: If you want to switch to a different provider (OpenAI, Anthropic, xAI, etc.),
//       simply update AI_BRIEF_BASE_URL and AI_BRIEF_MODEL in your .env.local
//       and provide the matching API key as GROQ_API_KEY.
//       The OpenAI SDK is used universally here for maximum compatibility.

import OpenAI from 'openai'

// Read from environment — easy to swap without code changes
let aiClient = null

function getAI() {
  if (!aiClient) {
    const AI_BASE_URL = process.env.AI_BRIEF_BASE_URL || 'https://api.groq.com/openai/v1'
    const AI_API_KEY  = process.env.GROQ_API_KEY || 'dummy-key-for-build'
    
    aiClient = new OpenAI({
      apiKey:  AI_API_KEY,
      baseURL: AI_BASE_URL,
    })
  }
  return aiClient
}

/**
 * generateLearningBrief
 *
 * Generates a UNIQUE mini project brief for a student module attempt.
 * Called every time a student clicks "Start Module" — must be different each time.
 *
 * @param {string} skillName       — e.g. "React", "Figma", "Blog Writing"
 * @param {string} skillCategory   — e.g. "tech", "design", "content"
 * @param {string} difficultyLevel — "rookie" | "skilled" | "expert"
 * @param {number} deadlineHours   — 24 | 48 | 72
 *
 * @returns {Promise<{
 *   project_title: string,
 *   client_context: string,
 *   task_description: string,
 *   deliverables: string[],
 *   evaluation_hints: string
 * }>}
 */
export async function generateLearningBrief(skillName, skillCategory, difficultyLevel, deadlineHours) {
  const systemPrompt = `You are a project brief generator for KaajerBazar, a student freelance platform in Bangladesh. Your job is to generate creative, unique, practical mini project briefs for students to prove their skills.

Rules you must follow:
1. Every brief must be completely unique. Do not repeat the same project idea.
2. The project must be realistic for a Bangladeshi university student to complete.
3. The project must be specific — give a real fictional client name, a real context, and clear deliverables.
4. Do NOT generate generic templates. No "build a to-do app" or "create a sample website". Give it a real story.
5. The brief must be completable within the time limit given.
6. Always write in clear, simple English that a student can understand.

Output format — respond with a JSON object only, no extra text:
{
  "project_title": "Short title of the project",
  "client_context": "1-2 sentences about the fictional client and their situation",
  "task_description": "3-5 sentences of exactly what the student must build or create",
  "deliverables": ["item 1", "item 2", "item 3"],
  "evaluation_hints": "1-2 sentences on what makes a good submission for admin reference"
}`

  const userPrompt = `Generate a unique project brief for the following:
Skill: ${skillName}
Category: ${skillCategory}
Level: ${difficultyLevel}
Time limit: ${deadlineHours} hours

Make sure this project is different from any typical ${skillName} beginner project. Surprise the student with a specific, real-world scenario.`

  const AI_MODEL = process.env.AI_BRIEF_MODEL || 'llama-3.1-8b-instant'
  const ai = getAI()

  const completion = await ai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
    // High temperature = maximum variety; every call should produce a genuinely different brief
    temperature: 0.95,
    max_tokens:  800,
  })

  const raw = completion.choices[0].message.content?.trim() ?? ''

  try {
    // Strip markdown code fences if the model wraps the JSON
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    // Validate required fields are present
    if (!parsed.project_title || !parsed.task_description || !Array.isArray(parsed.deliverables)) {
      throw new Error('Missing required fields in AI response')
    }

    return {
      project_title:    parsed.project_title,
      client_context:   parsed.client_context   || '',
      task_description: parsed.task_description,
      deliverables:     parsed.deliverables,
      evaluation_hints: parsed.evaluation_hints || '',
    }
  } catch (err) {
    console.error('[generateLearningBrief] Failed to parse AI response:', err)
    console.error('[generateLearningBrief] Raw AI output:', raw)

    // Fallback: return a structured placeholder so the module can still start
    // The admin will see this and can flag for retry
    return {
      project_title:    `${skillName} — ${difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)} Challenge`,
      client_context:   'A local Bangladeshi startup needs your help with a time-sensitive project.',
      task_description: `Demonstrate your ${skillName} skills by building a small but functional project that solves a real problem. Focus on clean code, good UX, and clear documentation.`,
      deliverables:     ['Working project files', 'Brief description of what you built', 'Any relevant screenshots or demo links'],
      evaluation_hints: 'Check for code quality, completeness of deliverables, and whether the student demonstrated core skill competency.',
    }
  }
}
