'use client'
// src/components/workspace/CertificateDownloadButton.jsx
// A small client component that triggers the certificate PDF download.
// Uses a plain <a> tag so the browser handles the file download natively.

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

export default function CertificateDownloadButton({ projectId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleDownload() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/certificate`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to generate certificate')
      }
      // Stream the PDF blob and trigger a browser download
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `KaajerBazar_Certificate.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <button
        id={`cert-download-${projectId}`}
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-slate-900 font-semibold text-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {loading ? 'Generating…' : 'Download PDF'}
      </button>
      {error && (
        <p className="text-red-400 text-xs max-w-[200px] text-right">{error}</p>
      )}
    </div>
  )
}
