// src/lib/ai.js
// AI client using Groq (open-source Llama 3 model)
// Drop-in replacement for the old claude.js — same interface, open-source backend.
//
// Model: llama3-8b-8192 (fast, free tier on Groq)
// API: Groq — 100% OpenAI-compatible, no SDK change needed
// Docs: https://console.groq.com/docs/openai

import OpenAI from 'openai'

// Groq uses the OpenAI SDK with a custom baseURL
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

// The model to use. llama3-8b is fast; swap to llama3-70b for higher quality.
const MODEL = 'llama3-8b-8192'

/**
 * generateSkillBrief
 * Generates a 2-hour project brief for a given skill.
 * Used when a student starts a skill verification.
 *
 * @param {string} skill - e.g. "React.js", "Python", "Graphic Design"
 * @returns {Promise<string>} - The project brief text
 */
export async function generateSkillBrief(skill) {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a technical skills assessor for KaajerBazar, a Bangladeshi freelance marketplace.
Your job is to create short, practical project briefs that test real-world skill proficiency.
Keep briefs clear, achievable in 2 hours, and appropriate for a junior-to-mid level developer.`,
      },
      {
        role: 'user',
        content: `Create a 2-hour project brief to verify a candidate's skill in: "${skill}".

Format your response as:
📌 TASK TITLE: (short title)
🎯 OBJECTIVE: (1-2 sentences describing the goal)
📋 REQUIREMENTS:
  - Requirement 1
  - Requirement 2
  - Requirement 3
⏱️ ESTIMATED TIME: 2 hours
📦 DELIVERABLE: (what they should submit)`,
      },
    ],
    temperature: 0.7,
    max_tokens: 512,
  })

  return completion.choices[0].message.content
}

/**
 * evaluateSkillSubmission
 * Reviews a student's submission text and gives a score + feedback.
 * Used when an admin reviews a submitted skill verification.
 *
 * @param {string} skill - The skill being verified
 * @param {string} brief - The original project brief
 * @param {string} submission - The student's submitted work/description
 * @returns {Promise<{score: number, feedback: string, recommendation: 'approve'|'reject'}>}
 */
export async function evaluateSkillSubmission(skill, brief, submission) {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a technical reviewer for KaajerBazar. Evaluate skill verification submissions fairly and objectively.
Respond ONLY with valid JSON in this exact format:
{"score": <0-100>, "feedback": "<2-3 sentences>", "recommendation": "<approve or reject>"}`,
      },
      {
        role: 'user',
        content: `Skill being verified: ${skill}
        
Original brief:
${brief}

Student's submission:
${submission}

Evaluate this submission and respond with JSON only.`,
      },
    ],
    temperature: 0.3,
    max_tokens: 256,
  })

  try {
    return JSON.parse(completion.choices[0].message.content)
  } catch {
    // Fallback if model doesn't return valid JSON
    return {
      score: 50,
      feedback: 'Could not parse AI evaluation. Please review manually.',
      recommendation: 'reject',
    }
  }
}

/**
 * calculateMatchScore
 * Evaluates how well a student fits a specific project posting.
 * Called automatically when a student submits an application.
 *
 * @param {string[]} studentSkills  - Approved verified skill names (e.g. ["React.js", "Node.js"])
 * @param {string[]} projectSkills  - Skills the project requires (e.g. ["React.js", "PostgreSQL"])
 * @param {string}   coverNote      - The student's cover letter text
 * @returns {Promise<{score: number, reason: string}>} score 0.0–10.0
 */
export async function calculateMatchScore(studentSkills, projectSkills, coverNote) {
  // Heuristic fallback: simple skill-overlap ratio (used when AI is unavailable)
  function heuristicScore() {
    if (!projectSkills.length) return { score: 5.0, reason: 'No required skills specified; cover letter assessed only.' }
    const matched = studentSkills.filter((s) =>
      projectSkills.some((p) => p.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(p.toLowerCase()))
    ).length
    const overlap = matched / projectSkills.length
    const coverBonus = coverNote.length > 100 ? 1 : 0
    const raw = Math.min(10, parseFloat((overlap * 8 + coverBonus).toFixed(1)))
    return {
      score: raw,
      reason: `Student matches ${matched}/${projectSkills.length} required skill(s). Score calculated without AI.`,
    }
  }

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a recruitment AI for KaajerBazar, a Bangladeshi student freelance marketplace.\nYour job is to score how well a student matches a project posting.\nRespond ONLY with valid JSON in this exact format, no extra text:\n{"score": <0.0-10.0>, "reason": "<one concise sentence explaining the score>"}`,
        },
        {
          role: 'user',
          content: `Score this student's fit for the project.\n\nProject requires these skills: ${projectSkills.join(', ') || 'Not specified'}\n\nStudent's verified skills: ${studentSkills.length > 0 ? studentSkills.join(', ') : 'None verified yet'}\n\nStudent's cover note:\n"${coverNote}"\n\nGive a score from 0.0 (no match) to 10.0 (perfect match). Base 60% on skill overlap and 40% on cover note quality and enthusiasm. Respond with JSON only.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 128,
    })

    const parsed = JSON.parse(completion.choices[0].message.content)
    const score = Math.min(10, Math.max(0, Number(parsed.score)))
    const reason = typeof parsed.reason === 'string' ? parsed.reason.trim() : 'No reason provided.'
    return { score: parseFloat(score.toFixed(1)), reason }
  } catch (err) {
    // Log the error for debugging, then return a heuristic score so the column is never null
    console.warn('[calculateMatchScore] AI error — using heuristic fallback:', err?.message)
    return heuristicScore()
  }
}
