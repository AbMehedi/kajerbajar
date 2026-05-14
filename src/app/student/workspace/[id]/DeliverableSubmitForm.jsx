'use client'
// src/app/student/workspace/[id]/DeliverableSubmitForm.jsx
// Full file upload + description submission for deliverables.
//
// Flow:
//   1. Student picks file via drag-and-drop or file picker
//   2. GET /api/projects/[id]/deliverables/upload-url  →  signed Supabase Storage URL
//   3. PUT file directly to Supabase Storage (browser → Storage, no server bottleneck)
//   4. POST /api/projects/[id]/deliverables  →  stores storagePath + description in DB
//
// Supported: any file type, up to 100 MB

import { useState, useRef, useCallback } from 'react'
import { Upload, File, X, Send, CheckCircle } from 'lucide-react'

const MAX_BYTES  = 100 * 1024 * 1024 // 100 MB
const ALLOWED_LABEL = 'Any file type — PDF, ZIP, images, videos, code, etc. Up to 100 MB'

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k    = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i     = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ── Upload progress bar ───────────────────────────────────────────────────────
function ProgressBar({ progress }) {
  return (
    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

// ── Drag-and-drop file zone ───────────────────────────────────────────────────
function FileDropzone({ onFile, selectedFile, onClear }) {
  const inputRef    = useRef(null)
  const [dragging, setDragging]   = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }, [onFile])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  if (selectedFile) {
    return (
      <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/25 rounded-xl px-4 py-3">
        <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
          <File className="w-4 h-4 text-purple-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-medium truncate">{selectedFile.name}</p>
          <p className="text-slate-500 text-xs">{formatBytes(selectedFile.size)}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
        dragging
          ? 'border-purple-400 bg-purple-500/10 scale-[1.01]'
          : 'border-white/15 hover:border-purple-500/50 hover:bg-white/4'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
        }}
      />
      <div className="flex flex-col items-center gap-2">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
          dragging ? 'bg-purple-500/30' : 'bg-white/8'
        }`}>
          <Upload className={`w-6 h-6 transition-colors ${dragging ? 'text-purple-400' : 'text-slate-500'}`} />
        </div>
        <div>
          <p className="text-white text-sm font-medium">
            {dragging ? 'Drop it here!' : 'Drag & drop your file, or click to browse'}
          </p>
          <p className="text-slate-600 text-xs mt-1">{ALLOWED_LABEL}</p>
        </div>
      </div>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────
export default function DeliverableSubmitForm({ projectId }) {
  const [file,           setFile]           = useState(null)
  const [fileError,      setFileError]      = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submissionText, setSubmissionText] = useState('')
  const [stage,          setStage]          = useState('idle') // idle | uploading | submitting | done | error
  const [errorMsg,       setErrorMsg]       = useState('')

  function handleFile(f) {
    setFileError('')
    if (f.size > MAX_BYTES) {
      setFileError(`File is too large (${formatBytes(f.size)}). Maximum is 100 MB.`)
      return
    }
    setFile(f)
  }

  async function uploadToStorage(f) {
    // 1. Get signed upload URL
    const urlRes = await fetch(
      `/api/projects/${projectId}/deliverables/upload-url?filename=${encodeURIComponent(f.name)}&fileSize=${f.size}`
    )
    const urlData = await urlRes.json()
    if (!urlRes.ok) throw new Error(urlData.error || 'Failed to get upload URL')

    const { signedUrl, storagePath } = urlData

    // 2. PUT file directly to Supabase Storage using XHR for progress tracking
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', signedUrl)
      xhr.setRequestHeader('Content-Type', f.type || 'application/octet-stream')

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 90)) // cap at 90% until complete
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100)
          resolve()
        } else {
          reject(new Error(`Upload failed (${xhr.status})`))
        }
      }
      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.send(f)
    })

    return storagePath
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')

    if (!submissionText.trim() && !file) {
      setErrorMsg('Please add a description or attach a file.')
      return
    }

    try {
      let storagePath = null

      if (file) {
        setStage('uploading')
        setUploadProgress(0)
        storagePath = await uploadToStorage(file)
      }

      setStage('submitting')

      const res = await fetch(`/api/projects/${projectId}/deliverables`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          submission_text:     submissionText.trim() || undefined,
          submission_file_url: storagePath ?? undefined,
          file_name:           file?.name  ?? undefined,
          file_size_bytes:     file?.size  ?? undefined,
          file_mime_type:      file?.type  ?? undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save submission')

      setStage('done')
      setTimeout(() => window.location.reload(), 1600)
    } catch (err) {
      console.error('[DeliverableSubmitForm]', err)
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
      setStage('error')
    }
  }

  // ── Done state ──
  if (stage === 'done') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <p className="text-green-400 font-semibold text-lg">Submitted successfully!</p>
        <p className="text-slate-500 text-sm mt-1">Notifying the company… refreshing.</p>
      </div>
    )
  }

  const isUploading  = stage === 'uploading'
  const isSubmitting = stage === 'submitting'
  const isBusy       = isUploading || isSubmitting

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Work Description <span className="text-slate-600 normal-case font-normal">(optional if file attached)</span>
        </label>
        <textarea
          id="submission-text"
          value={submissionText}
          onChange={(e) => setSubmissionText(e.target.value)}
          rows={4}
          disabled={isBusy}
          placeholder="Describe what you've done — key decisions, methodology, results, and anything the company should know…"
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 resize-none transition-colors disabled:opacity-50"
        />
      </div>

      {/* File upload */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Attach File <span className="text-slate-600 normal-case font-normal">(optional if description provided)</span>
        </label>

        <FileDropzone
          onFile={handleFile}
          selectedFile={file}
          onClear={() => { setFile(null); setFileError('') }}
        />

        {fileError && (
          <p className="text-red-400 text-xs mt-2">⚠️ {fileError}</p>
        )}
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Uploading {file?.name}…</span>
            <span>{uploadProgress}%</span>
          </div>
          <ProgressBar progress={uploadProgress} />
        </div>
      )}

      {isSubmitting && (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <span className="w-4 h-4 border-2 border-slate-600 border-t-purple-400 rounded-full animate-spin" />
          Saving submission…
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          ⚠️ {errorMsg}
        </p>
      )}

      {/* Submit */}
      <button
        id="submit-deliverable"
        type="submit"
        disabled={isBusy || !!fileError}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-7 py-2.5 rounded-xl transition-all"
      >
        {isBusy ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {isUploading ? 'Uploading file…' : 'Submitting…'}
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Deliverable
          </>
        )}
      </button>
    </form>
  )
}
