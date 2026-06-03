'use client'

// src/app/student/learn/[category]/[skill]/ModuleClient.jsx
// Client-side component for the Module Page.
// Handles: difficulty selection, start API call, brief display, countdown timer,
//          file upload, submission, cooldown display.

import { useState, useEffect, useRef, useCallback } from 'react'
import { Clock, Upload, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react'

const LEVEL_CONFIG = {
  rookie:  { label: 'Rookie',  hours: 24, color: 'green',  ring: 'border-green-500/40 hover:border-green-500',  badge: 'bg-green-500/15 text-green-300 border-green-500/30',  glow: 'shadow-green-500/20'  },
  skilled: { label: 'Skilled', hours: 48, color: 'blue',   ring: 'border-blue-500/40 hover:border-blue-500',    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',    glow: 'shadow-blue-500/20'   },
  expert:  { label: 'Expert',  hours: 72, color: 'purple', ring: 'border-purple-500/40 hover:border-purple-500', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30', glow: 'shadow-purple-500/20' },
}

const STATUS_STYLES = {
  pending:  'bg-amber-500/15 text-amber-300 border-amber-500/30',
  pass:     'bg-green-500/15 text-green-300 border-green-500/30',
  fail:     'bg-red-500/15 text-red-300 border-red-500/30',
  revision: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
}

const MAX_FILE_BYTES = 50 * 1024 * 1024 // 50 MB

// ── Countdown Timer ───────────────────────────────────────────────────────────

function useCountdown(deadlineAt) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!deadlineAt) return

    function tick() {
      const diff = new Date(deadlineAt).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Expired')
        setIsExpired(true)
        return
      }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadlineAt])

  return { timeLeft, isExpired }
}

// ── Cooldown Timer ────────────────────────────────────────────────────────────

function CooldownBadge({ until }) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    function tick() {
      const diff = new Date(until).getTime() - Date.now()
      if (diff <= 0) { setLabel(''); return }
      const d = Math.floor(diff / 86_400_000)
      const h = Math.floor((diff % 86_400_000) / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      if (d > 0) setLabel(`${d}d ${h}h remaining`)
      else if (h > 0) setLabel(`${h}h ${m}m remaining`)
      else setLabel(`${m}m remaining`)
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [until])

  if (!label) return null
  return (
    <span className="text-xs bg-red-500/15 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">
      🔒 Cooldown: {label}
    </span>
  )
}

// ── File Drop Zone ────────────────────────────────────────────────────────────

function FileDropZone({ onFileSelect, selectedFile, onClear }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback((file) => {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) { alert('File too large. Maximum 50 MB.'); return }
    onFileSelect(file)
  }, [onFileSelect])

  if (selectedFile) {
    return (
      <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
        <span className="text-2xl">📄</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{selectedFile.name}</p>
          <p className="text-slate-400 text-xs">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
        </div>
        <button type="button" onClick={onClear}
          className="text-slate-400 hover:text-red-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]) }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
        isDragging ? 'border-purple-400 bg-purple-500/15' : 'border-white/20 hover:border-purple-500/50 hover:bg-white/5'
      }`}
    >
      <input ref={inputRef} type="file" className="hidden"
        onChange={(e) => handleFile(e.target.files[0])} />
      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
      <p className="text-slate-300 text-sm font-medium">
        {isDragging ? 'Drop it!' : 'Drag & drop or click to browse'}
      </p>
      <p className="text-slate-500 text-xs mt-1">ZIP, PDF, images, code files — up to 50 MB</p>
    </div>
  )
}

// ── Brief Card (student-facing — no evaluation_hints) ────────────────────────

function BriefCard({ brief, deadlineAt, moduleInfo }) {
  const { timeLeft, isExpired } = useCountdown(deadlineAt)

  return (
    <div className="glass rounded-xl border border-purple-500/30 p-6 space-y-4 bg-purple-500/5">
      {/* Title + Timer */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            🧠 Your Project Brief
          </p>
          <h2 className="text-white text-xl font-bold">{brief.project_title}</h2>
        </div>
        <div className={`shrink-0 flex items-center gap-2 text-sm font-mono px-3 py-1.5 rounded-lg border ${
          isExpired
            ? 'text-red-300 border-red-500/30 bg-red-500/10'
            : 'text-amber-300 border-amber-500/30 bg-amber-500/10'
        }`}>
          <Clock className="w-4 h-4" />
          {timeLeft || '—'}
        </div>
      </div>

      {/* Client Context */}
      {brief.client_context && (
        <div className="border-l-2 border-purple-500/40 pl-4">
          <p className="text-slate-300 text-sm leading-relaxed italic">{brief.client_context}</p>
        </div>
      )}

      {/* Task Description */}
      <div>
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">📋 What You Need to Build</p>
        <p className="text-slate-200 text-sm leading-relaxed">{brief.task_description}</p>
      </div>

      {/* Deliverables */}
      {Array.isArray(brief.deliverables) && brief.deliverables.length > 0 && (
        <div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">✅ Deliverables</p>
          <ul className="space-y-1.5">
            {brief.deliverables.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Module Info */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/10 flex-wrap">
        <span className="text-xs text-slate-500">
          {moduleInfo?.skill_name} — <span className="capitalize">{moduleInfo?.difficulty_level}</span>
        </span>
        <span className="text-slate-600">·</span>
        <span className="text-xs text-slate-500">{moduleInfo?.deadline_hours}hr deadline</span>
        {isExpired && (
          <span className="text-xs text-red-400 font-medium">⚠️ Deadline passed — submit anyway to auto-fail</span>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ModuleClient({ skillName, category, modules, initialData }) {
  const {
    active_submission: initialActive,
    verified_skills:  initialVerified,
    cooldown_map:     cooldownMap,
  } = initialData

  const [activeSubmission, setActiveSubmission] = useState(initialActive)
  const [verifiedSkills,   setVerifiedSkills]   = useState(initialVerified ?? [])
  const [selectedLevel,    setSelectedLevel]    = useState(null)

  // Start module state
  const [isStarting, setIsStarting]   = useState(false)
  const [startError, setStartError]   = useState('')

  // Submit state
  const [description,   setDescription]   = useState('')
  const [selectedFile,  setSelectedFile]  = useState(null)
  const [isUploading,   setIsUploading]   = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting,  setIsSubmitting]  = useState(false)
  const [submitError,   setSubmitError]   = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const moduleForLevel = (level) => modules.find((m) => m.difficulty_level === level)
  const verifiedLevels = new Set(verifiedSkills.map((v) => v.level))
  const now = new Date()

  async function handleStart(level) {
    const moduleData = moduleForLevel(level)
    if (!moduleData) return
    setSelectedLevel(level)
    setIsStarting(true)
    setStartError('')
    try {
      const res = await fetch(`/api/learning/modules/${moduleData.id}/start`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setStartError(data.error || 'Failed to start module.')
        setIsStarting(false)
        return
      }
      // Build active submission object from response
      setActiveSubmission({
        id:            data.submission_id,
        status:        'pending',
        deadline_at:   data.deadline_at,
        submitted_at:  null,
        ai_brief:      JSON.stringify(data.brief),
        attempt_number: data.attempt_number,
        module_id:     moduleData.id,
        learning_modules: moduleData,
        _brief_parsed: data.brief,
      })
    } catch {
      setStartError('Network error. Please try again.')
    } finally {
      setIsStarting(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!activeSubmission) return
    setSubmitError('')

    const formData = new FormData()
    formData.append('submission_id', activeSubmission.id)
    formData.append('submission_description', description)
    if (selectedFile) formData.append('file', selectedFile)

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/learning/modules/${activeSubmission.module_id}/submit`, {
        method: 'POST',
        body:   formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || 'Submission failed.')
        if (data.auto_failed) {
          setActiveSubmission(prev => ({ ...prev, status: 'fail' }))
        }
        return
      }
      setSubmitSuccess(true)
      setActiveSubmission(prev => ({ ...prev, submitted_at: data.submitted_at }))
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Determine brief for active submission
  const activeBrief = activeSubmission?._brief_parsed ?? (() => {
    try { return JSON.parse(activeSubmission?.ai_brief ?? '{}') } catch { return null }
  })()
  const activeModule = moduleForLevel(activeSubmission?.learning_modules?.difficulty_level)

  const hasActiveUnsubmitted = activeSubmission && !activeSubmission.submitted_at

  return (
    <div className="space-y-6">

      {/* ── Active Brief (if module started and not yet submitted) ── */}
      {hasActiveUnsubmitted && activeBrief && (
        <>
          <BriefCard brief={activeBrief} deadlineAt={activeSubmission.deadline_at} moduleInfo={activeModule ?? activeSubmission.learning_modules} />

          {/* ── Submit Form ── */}
          {!submitSuccess ? (
            <div className="glass rounded-xl border border-white/10 p-6 space-y-4">
              <h2 className="text-white font-semibold">Submit Your Work</h2>

              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  📦 Attach your project file
                  <span className="text-slate-500 font-normal"> (optional if description provided)</span>
                </label>
                <FileDropZone
                  selectedFile={selectedFile}
                  onFileSelect={setSelectedFile}
                  onClear={() => setSelectedFile(null)}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-slate-500 text-xs">and / or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  📝 Describe your completed work
                </label>
                <textarea
                  id="submission-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you built, the approach you took, challenges you solved, and links to your work (GitHub, Figma, live URL, etc.)"
                  rows={5}
                  className="w-full bg-white/5 border border-white/15 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>

              {submitError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {submitError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!description.trim() && !selectedFile)}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                ) : '📤 Submit for Review'}
              </button>
            </div>
          ) : (
            <div className="glass rounded-xl border border-green-500/30 p-6 text-center bg-green-500/5">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <h2 className="text-white font-bold text-lg mb-1">Submitted Successfully!</h2>
              <p className="text-slate-400 text-sm">Your work is now in the admin review queue. We aim to review within 48 hours. You&apos;ll get a notification when it&apos;s reviewed.</p>
            </div>
          )}
        </>
      )}

      {/* ── Already submitted banner ── */}
      {activeSubmission?.submitted_at && !submitSuccess && (
        <div className="glass rounded-xl border border-amber-500/30 p-5 flex items-center gap-3 bg-amber-500/5">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="text-white font-semibold">Submitted — Awaiting Review</p>
            <p className="text-amber-300/70 text-xs mt-0.5">
              Submitted {new Date(activeSubmission.submitted_at).toLocaleString('en-GB')} · Admin review SLA: 48 hours
            </p>
          </div>
        </div>
      )}

      {/* ── Difficulty Level Cards (shown when no active unsubmitted module) ── */}
      {!hasActiveUnsubmitted && (
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-lg">Choose a Difficulty Level</h2>
          {(['rookie', 'skilled', 'expert']).map((level) => {
            const cfg        = LEVEL_CONFIG[level]
            const moduleData = moduleForLevel(level)
            const isPassed   = verifiedLevels.has(level)
            const cooldown   = cooldownMap?.[level]
            const inCooldown = cooldown && new Date(cooldown) > now
            const isDisabled = isPassed || inCooldown || !moduleData || (activeSubmission && activeSubmission.status === 'pending')
            const isActive   = selectedLevel === level && isStarting

            return (
              <div key={level}
                className={`glass rounded-xl border p-5 transition-all ${
                  isPassed     ? 'border-green-500/30 bg-green-500/5 opacity-80'  :
                  inCooldown   ? 'border-red-500/20 bg-red-500/5 opacity-60'      :
                  isDisabled   ? 'border-white/10 opacity-50 cursor-not-allowed'  :
                  `${cfg.ring} cursor-pointer hover:shadow-lg hover:${cfg.glow}`
                }`}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-bold capitalize px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        {isPassed && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Passed</span>}
                        {inCooldown && <CooldownBadge until={cooldown} />}
                      </div>
                      <p className="text-slate-400 text-xs">{cfg.hours}-hour deadline to complete and submit</p>
                    </div>
                  </div>

                  {!isPassed && !inCooldown && (
                    <button
                      onClick={() => !isDisabled && handleStart(level)}
                      disabled={isDisabled || isStarting}
                      className={`shrink-0 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                        isDisabled || isStarting
                          ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                          : `bg-${cfg.color}-600 hover:bg-${cfg.color}-500 text-white shadow-sm`
                      }`}
                    >
                      {isActive ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating brief…</>
                      ) : activeSubmission?.status === 'pending' ? (
                        'Module in progress'
                      ) : 'Start Module →'}
                    </button>
                  )}
                </div>

                {startError && selectedLevel === level && (
                  <p className="text-red-400 text-xs mt-3 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {startError}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
