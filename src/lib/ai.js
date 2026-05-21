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


