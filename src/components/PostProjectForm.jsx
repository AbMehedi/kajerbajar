'use client'

// src/components/PostProjectForm.jsx
// Story 3.1: Client component — Post a new micro-project
//
// Fields: title, description, required_skills (tag input), budget_bdt,
//         duration_weeks, deadline, deliverable_format (optional)
// Submits to POST /api/projects/create
// States: idle → submitting → success | error

import { useState, useRef } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────
// Skill Tag Input
// ─────────────────────────────────────────────────────────────
function SkillTagInput({ tags, onChange }) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)

  const addTag = (value) => {
    const trimmed = value.trim().replace(/,+$/, '').trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInputValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  const handleBlur = () => {
    if (inputValue.trim()) addTag(inputValue)
  }

  const removeTag = (index) => {
    onChange(tags.filter((_, i) => i !== index))
  }

  return (
    <div
      className="min-h-[44px] flex flex-wrap gap-2 items-center px-3 py-2 rounded-lg border border-white/10 bg-white/5 cursor-text focus-within:border-purple-500/60 focus-within:ring-1 focus-within:ring-purple-500/30 transition-colors"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md text-sm font-medium"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(i) }}
            className="text-purple-400 hover:text-red-400 transition-colors leading-none"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={tags.length === 0 ? 'Type a skill and press Enter or comma…' : ''}
        className="flex-1 min-w-[160px] bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Form field wrapper for consistent styling
// ─────────────────────────────────────────────────────────────
function Field({ label, hint, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {hint && <span className="text-slate-500 font-normal ml-2 text-xs">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function PostProjectForm() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    required_skills: [],
    budget_bdt: '',
    duration_weeks: '',
    deadline: '',
    deliverable_format: '',
  })

  const [status, setStatus] = useState('idle') // 'idle' | 'submitting' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const [createdProjectId, setCreatedProjectId] = useState(null)

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    // Client-side required field validation
    if (!form.title.trim()) return setErrorMsg('Project title is required.')
    if (!form.description.trim()) return setErrorMsg('Description is required.')
    if (form.required_skills.length === 0) return setErrorMsg('Add at least one required skill.')
    if (!form.budget_bdt || Number(form.budget_bdt) <= 0) return setErrorMsg('Enter a valid budget.')
    if (!form.duration_weeks || Number(form.duration_weeks) <= 0) return setErrorMsg('Enter a valid duration.')
    if (!form.deadline) return setErrorMsg('Project deadline is required.')

    setStatus('submitting')

    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          required_skills: form.required_skills,
          budget_bdt: Number(form.budget_bdt),
          duration_weeks: Number(form.duration_weeks),
          deadline: form.deadline,
          deliverable_format: form.deliverable_format.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to post project. Please try again.')
        setStatus('error')
        return
      }

      setCreatedProjectId(data.project_id)
      setStatus('success')
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
      setStatus('error')
    }
  }

  const handlePostAnother = () => {
    setForm({
      title: '',
      description: '',
      required_skills: [],
      budget_bdt: '',
      duration_weeks: '',
      deadline: '',
      deliverable_format: '',
    })
    setStatus('idle')
    setErrorMsg('')
    setCreatedProjectId(null)
  }

  // ── Success State ──────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="glass rounded-2xl p-10 text-center space-y-6 animate-in fade-in duration-500">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 text-3xl mx-auto">
          ✅
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Project Posted!</h2>
          <p className="text-slate-400 text-sm">
            Your micro-project is live and visible to students.
          </p>
          {createdProjectId && (
            <p className="text-slate-600 text-xs mt-1 font-mono">ID: {createdProjectId}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={handlePostAnother}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            + Post Another Project
          </button>
          <Link
            href="/company/dashboard"
            className="px-5 py-2.5 border border-white/15 text-slate-300 hover:text-white hover:border-white/30 rounded-lg text-sm font-semibold transition-colors text-center"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────
  const isSubmitting = status === 'submitting'

  // Minimum deadline = tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDeadline = tomorrow.toISOString().split('T')[0]

  return (
    <form
      onSubmit={handleSubmit}
      className="glass rounded-2xl p-6 md:p-8 space-y-6"
      noValidate
    >
      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <span className="text-red-400 mt-0.5">⚠️</span>
          <p className="text-red-300 text-sm">{errorMsg}</p>
        </div>
      )}

      {/* ── Section: Project Basics ── */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Project Basics
        </h3>

        <Field label="Project Title" required>
          <input
            id="project-title"
            type="text"
            value={form.title}
            onChange={set('title')}
            placeholder="e.g. Build a REST API for inventory management"
            maxLength={120}
            disabled={isSubmitting}
            className={inputClass}
          />
        </Field>

        <Field label="Description" required hint="Describe the scope, goals, and expectations">
          <textarea
            id="project-description"
            value={form.description}
            onChange={set('description')}
            placeholder="What does this project involve? What will the student deliver?"
            rows={5}
            maxLength={2000}
            disabled={isSubmitting}
            className={`${inputClass} resize-none leading-relaxed`}
          />
          <span className="text-slate-600 text-xs self-end">
            {form.description.length}/2000
          </span>
        </Field>

        <Field label="Required Skills" required hint="Press Enter or comma to add">
          <SkillTagInput
            tags={form.required_skills}
            onChange={(tags) => setForm((prev) => ({ ...prev, required_skills: tags }))}
          />
        </Field>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-white/10" />

      {/* ── Section: Budget & Timeline ── */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Budget &amp; Timeline
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Budget" required hint="in BDT">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none">
                ৳
              </span>
              <input
                id="project-budget"
                type="number"
                min="1"
                step="1"
                value={form.budget_bdt}
                onChange={set('budget_bdt')}
                placeholder="5000"
                disabled={isSubmitting}
                className={`${inputClass} pl-7`}
              />
            </div>
          </Field>

          <Field label="Duration" required hint="in weeks">
            <div className="relative">
              <input
                id="project-duration"
                type="number"
                min="1"
                max="52"
                step="1"
                value={form.duration_weeks}
                onChange={set('duration_weeks')}
                placeholder="4"
                disabled={isSubmitting}
                className={`${inputClass} pr-16`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                weeks
              </span>
            </div>
          </Field>
        </div>

        <Field label="Application Deadline" required>
          <input
            id="project-deadline"
            type="date"
            value={form.deadline}
            onChange={set('deadline')}
            min={minDeadline}
            disabled={isSubmitting}
            className={inputClass}
          />
        </Field>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-white/10" />

      {/* ── Section: Optional ── */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Optional Details
        </h3>

        <Field label="Deliverable Format" hint="optional">
          <input
            id="project-deliverable"
            type="text"
            value={form.deliverable_format}
            onChange={set('deliverable_format')}
            placeholder="e.g. GitHub repo + short video demo"
            maxLength={200}
            disabled={isSubmitting}
            className={inputClass}
          />
        </Field>
      </div>

      {/* ── Submit ── */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <button
          id="submit-post-project"
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Posting…
            </>
          ) : (
            '🚀 Post Project'
          )}
        </button>
        <Link
          href="/company/dashboard"
          className="px-5 py-3 border border-white/15 text-slate-400 hover:text-slate-200 hover:border-white/30 rounded-lg text-sm font-medium transition-colors text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
