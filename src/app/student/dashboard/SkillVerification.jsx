'use client'

// src/app/student/dashboard/SkillVerification.jsx
// Phase E upgrade:
//   - Skill category: pill grid (click to select) instead of <input>
//   - AI brief: styled blockquote card with 🧠 header + typewriter entrance
//   - 3-step submission stepper: Select Skill → Write Proof → Submit
//   - File drop zone + upload progress (unchanged logic, upgraded UI)

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

// ── Config ─────────────────────────────────────────────────────────────────────

const SKILL_PILLS = [
  'React.js', 'Vue.js', 'Next.js',
  'Node.js', 'Python', 'Django',
  'Java', 'C++', 'Go',
  'UI Design', 'Figma', 'PostgreSQL',
  'Data Analysis', 'Machine Learning', 'DevOps',
  'Flutter', 'React Native', 'Other…',
]

const STATUS_CONFIG = {
  pending:            { label: 'Brief Ready',        color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  submitted:          { label: 'Under Review',       color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  approved:           { label: '✅ Approved',         color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  rejected:           { label: '❌ Rejected',         color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  revision_requested: { label: '🔄 Needs Revision',  color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
}

const MAX_FILE_BYTES = 50 * 1024 * 1024 // 50 MB

const STEPS = ['Select Skill', 'Write Proof', 'Submit']

// ── Helpers ────────────────────────────────────────────────────────────────────

function fileIcon(name = '') {
  const ext = name.split('.').pop().toLowerCase()
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '📦'
  if (['pdf'].includes(ext)) return '📄'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️'
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return '🎬'
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'go', 'rs'].includes(ext)) return '💻'
  if (['doc', 'docx'].includes(ext)) return '📝'
  return '📎'
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Step Progress Bar ──────────────────────────────────────────────────────────

function StepBar({ step }) {
  return (
    <div className="flex items-center gap-1 mb-5">
      {STEPS.map((label, idx) => {
        const done   = idx < step
        const active = idx === step
        const isLast = idx === STEPS.length - 1
        return (
          <div key={label} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                done   ? 'bg-green-500/20 border-green-500 text-green-400'
                : active ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                : 'bg-white/5 border-white/20 text-slate-600'
              }`}>
                {done ? <CheckCircle className="w-3 h-3" /> : idx + 1}
              </div>
              <p className={`text-[9px] mt-0.5 whitespace-nowrap ${
                done ? 'text-green-400' : active ? 'text-purple-300' : 'text-slate-600'
              }`}>{label}</p>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-1 mb-2.5 rounded-full ${
                done ? 'bg-green-500/40' : 'bg-white/10'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Typewriter text ────────────────────────────────────────────────────────────

function TypewriterText({ text }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    let i = 0
    const interval = setInterval(() => {
      if (i >= text.length) { clearInterval(interval); return }
      setDisplayed(text.slice(0, i + 1))
      i++
    }, 10)
    return () => clearInterval(interval)
  }, [text])
  return (
    <pre className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed font-sans">
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-0.5 h-3 bg-purple-400 animate-pulse ml-0.5" />
      )}
    </pre>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SkillVerification({ initialVerifications = [] }) {
  const [verifications, setVerifications] = useState(initialVerifications)
  const [loading, setLoading]             = useState(false)
  const [view, setView]                   = useState('list')   // 'list' | 'request' | 'submit'
  const [activeVerification, setActive]   = useState(null)

  async function fetchVerifications() {
    setLoading(true)
    try {
      const res  = await fetch('/api/student/skills/verifications')
      const data = await res.json()
      setVerifications(data.verifications || [])
    } catch (err) {
      console.error('Failed to fetch verifications:', err)
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    setView('list')
    setActive(null)
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold text-lg">✅ Skill Verification</h3>
        {view === 'list' && (
          <button
            onClick={() => setView('request')}
            className="kb-btn-primary text-xs px-3 py-1.5 rounded-lg"
          >
            + Verify a Skill
          </button>
        )}
        {view !== 'list' && (
          <button
            onClick={goBack}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <VerificationList
              verifications={verifications}
              loading={loading}
              onSubmit={(v) => { setActive(v); setView('submit') }}
            />
          </motion.div>
        )}
        {view === 'request' && (
          <motion.div key="request" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <RequestBriefForm onSuccess={(v) => { setActive(v); setView('submit') }} />
          </motion.div>
        )}
        {view === 'submit' && (
          <motion.div key="submit" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <SubmitWorkForm
              verification={activeVerification}
              onSuccess={() => { fetchVerifications(); setView('list') }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Verification list ──────────────────────────────────────────────────────────

function VerificationList({ verifications, loading, onSubmit }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="skeleton rounded-lg h-16" />
        ))}
      </div>
    )
  }

  if (verifications.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-4xl mb-3">🎯</p>
        <p className="text-slate-400 text-sm">No skill verifications yet.</p>
        <p className="text-slate-500 text-xs mt-1">Click &quot;Verify a Skill&quot; to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {verifications.map((v) => {
        const cfg = STATUS_CONFIG[v.status] || STATUS_CONFIG.pending
        return (
          <div key={v.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-white font-medium">{v.skill_category}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {new Date(v.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color} whitespace-nowrap`}>
                {cfg.label}
              </span>
            </div>
            {v.submission_file_url && (
              <p className="text-slate-500 text-xs mt-2 flex items-center gap-1">
                {fileIcon(v.submission_file_url)} File attached
              </p>
            )}
            {v.admin_feedback && (
              <p className="text-slate-400 text-xs mt-2 bg-white/5 rounded p-2">
                💬 {v.admin_feedback}
              </p>
            )}
            {v.status === 'pending' && (
              <button
                onClick={() => onSubmit(v)}
                className="mt-3 text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Submit My Work →
              </button>
            )}
            {v.status === 'revision_requested' && (
              <button
                onClick={() => onSubmit(v)}
                className="mt-3 text-xs bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Resubmit Revised Work →
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Request Brief Form (pill grid) ────────────────────────────────────────────

function RequestBriefForm({ onSuccess }) {
  const [selected, setSelected] = useState('')
  const [custom, setCustom]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const skill = selected === 'Other…' ? custom.trim() : selected

  async function handleRequest(e) {
    e.preventDefault()
    if (!skill) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/skills/verify/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to generate brief'); return }
      onSuccess(data.verification)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleRequest} className="space-y-5">
      <StepBar step={0} />

      <div>
        <p className="text-slate-300 text-sm mb-3">Which skill do you want to verify?</p>
        <div className="flex flex-wrap gap-2">
          {SKILL_PILLS.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => { setSelected(pill); if (pill !== 'Other…') setCustom('') }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selected === pill
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300 ring-2 ring-purple-500/30'
                  : 'bg-white/5 border-white/15 text-slate-400 hover:border-purple-500/40 hover:text-white'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>

        {selected === 'Other…' && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
            <input
              id="skill-name-custom"
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Type your skill…"
              className="kb-input w-full text-sm"
              autoFocus
            />
          </motion.div>
        )}
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={loading || !skill}
        className="w-full kb-btn-primary disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-2.5 rounded-lg text-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
            AI is generating your brief…
          </span>
        ) : '🤖 Generate My Brief'}
      </button>
      <p className="text-slate-500 text-xs text-center">
        Our AI will create a 2-hour project brief tailored to your skill.
      </p>
    </form>
  )
}

// ── File Drop Zone ─────────────────────────────────────────────────────────────

function FileDropZone({ onFileSelect, selectedFile, onClear }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback((file) => {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      alert(`File is too large (${formatBytes(file.size)}). Maximum size is 50 MB.`)
      return
    }
    onFileSelect(file)
  }, [onFileSelect])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  if (selectedFile) {
    return (
      <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
        <span className="text-2xl">{fileIcon(selectedFile.name)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{selectedFile.name}</p>
          <p className="text-slate-400 text-xs">{formatBytes(selectedFile.size)}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-slate-400 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0"
          aria-label="Remove file"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
        ${isDragging
          ? 'border-purple-400 bg-purple-500/15 scale-[1.01]'
          : 'border-white/20 hover:border-purple-500/50 hover:bg-white/5'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <p className="text-3xl mb-2">📦</p>
      <p className="text-slate-300 text-sm font-medium">
        {isDragging ? 'Drop your file here!' : 'Drag & drop your file, or click to browse'}
      </p>
      <p className="text-slate-500 text-xs mt-1">ZIP, PDF, images, videos, code — up to 50 MB</p>
    </div>
  )
}

// ── Upload Progress Bar ────────────────────────────────────────────────────────

function UploadProgress({ progress }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Uploading file…</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

// ── Submit Work Form ───────────────────────────────────────────────────────────

function SubmitWorkForm({ verification, onSuccess }) {
  const [submission, setSubmission]         = useState('')
  const [selectedFile, setSelectedFile]     = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading]           = useState(false)
  const [submitting, setSubmitting]         = useState(false)
  const [error, setError]                   = useState('')

  const hasText  = submission.trim().length >= 50
  const hasFile  = Boolean(selectedFile)
  const canSubmit = (hasText || hasFile) && !uploading && !submitting

  async function uploadFileToStorage(file) {
    const params = new URLSearchParams({
      verificationId: verification.id,
      filename:       file.name,
      fileSize:       String(file.size),
    })
    const urlRes = await fetch(`/api/skills/verify/upload-url?${params}`)
    if (!urlRes.ok) {
      const d = await urlRes.json()
      throw new Error(d.error || 'Failed to get upload URL')
    }
    const { signedUrl, path } = await urlRes.json()

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', signedUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload  = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`Upload failed: HTTP ${xhr.status}`))
      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.send(file)
    })

    return path
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    let filePath = null

    if (selectedFile) {
      setUploading(true)
      setUploadProgress(0)
      try {
        filePath = await uploadFileToStorage(selectedFile)
      } catch (err) {
        setError(`Upload failed: ${err.message}`)
        setUploading(false)
        return
      }
      setUploading(false)
      setUploadProgress(0)
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/skills/verify/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId:     verification.id,
          submissionText:     submission || null,
          submissionFilePath: filePath,
          submissionFileName: selectedFile?.name || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to submit'); return }
      onSuccess()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <StepBar step={1} />

      {/* AI Brief — styled blockquote with typewriter */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🧠</span>
          <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
            AI Brief — {verification.skill_category}
          </p>
        </div>
        <div className="border-l-2 border-purple-500/40 pl-3">
          <TypewriterText text={verification.ai_brief ?? ''} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* File upload */}
        <div>
          <label className="block text-slate-300 text-sm mb-2">
            📦 Attach your project file
            <span className="text-slate-500 font-normal"> (ZIP, PDF, images… up to 50 MB)</span>
          </label>
          <FileDropZone
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            onClear={() => setSelectedFile(null)}
          />
        </div>

        {uploading && <UploadProgress progress={uploadProgress} />}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-slate-500 text-xs">and / or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Text description */}
        <div>
          <label className="block text-slate-300 text-sm mb-1.5">
            📝 Describe your completed work
            <span className="text-slate-500 font-normal"> (optional if file attached, otherwise min 50 chars)</span>
          </label>
          <textarea
            id="submission-text"
            value={submission}
            onChange={(e) => setSubmission(e.target.value)}
            placeholder="Describe what you built, the approach you took, challenges you solved, and what you learned. The more detail, the better your chances of approval."
            rows={5}
            className="kb-input w-full text-sm resize-none"
          />
          <p className="text-slate-600 text-xs mt-1">
            {submission.length} characters{!hasFile && ' (minimum 50 if no file attached)'}
          </p>
        </div>

        {!hasText && !hasFile && (
          <p className="text-amber-500/80 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            ⚠️ Please attach a file or write a description (min 50 characters) — or both!
          </p>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          type="submit"
          id="submit-work-btn"
          disabled={!canSubmit}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
              Uploading file… {uploadProgress}%
            </span>
          ) : submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
              Submitting…
            </span>
          ) : '📤 Submit for Review'}
        </button>
      </form>
    </div>
  )
}
