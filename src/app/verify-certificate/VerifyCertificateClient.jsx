'use client'

import { useState } from 'react'
import { Search, ShieldCheck, Download, AlertCircle, Building2, User, Wallet } from 'lucide-react'

export default function VerifyCertificateClient() {
  const [certId, setCertId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function handleVerify(e) {
    e.preventDefault()
    if (!certId.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`/api/verify-certificate?id=${encodeURIComponent(certId.trim())}`)
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Verification failed')
        return
      }

      setResult(data)
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!result) return
    window.open(`/api/projects/${result.projectId}/certificate`, '_blank')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="w-16 h-16 bg-purple-500/20 border-2 border-purple-500/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)]">
          <ShieldCheck className="w-8 h-8 text-purple-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Certificate Verification</h1>
        <p className="text-slate-400 max-w-lg mx-auto">
          Verify the authenticity of a KaajerBazar completion certificate by entering the Certificate ID below.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleVerify} className="max-w-xl mx-auto relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="e.g. KB-A1B2C3D4 or full UUID..."
          value={certId}
          onChange={(e) => setCertId(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-32 py-5 text-white text-lg focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-500 shadow-inner"
        />
        <button
          type="submit"
          disabled={loading || !certId.trim()}
          className="absolute right-2 top-2 bottom-2 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      {/* Error State */}
      {error && (
        <div className="max-w-xl mx-auto mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-400 font-bold mb-1">Verification Failed</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success State */}
      {result && (
        <div className="max-w-2xl mx-auto mt-8 glass border border-green-500/30 rounded-2xl p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/20 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Valid Certificate</h2>
              <p className="text-green-400 text-sm font-medium">Authenticity verified by KaajerBazar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Student</p>
              <p className="text-white font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" /> {result.studentName}
              </p>
            </div>
            
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Company</p>
              <p className="text-white font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" /> {result.companyName}
              </p>
            </div>
            
            <div className="sm:col-span-2">
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Project Title</p>
              <p className="text-white font-medium text-lg">{result.projectTitle}</p>
            </div>

            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Completed Date</p>
              <p className="text-slate-300">
                {new Date(result.issuedAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>

            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Certificate ID</p>
              <p className="text-slate-300 font-mono text-sm">{result.displayId}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-white font-semibold transition-colors group"
            >
              <Download className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
              Download PDF Copy
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
