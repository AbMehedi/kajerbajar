'use client'

// src/app/company/dashboard/TradeLicenseUpload.jsx
// Story 1.2: Client component for uploading trade license PDF
//
// Flow:
//   1. User selects PDF file
//   2. Upload to Supabase Storage (trade-licenses bucket)
//   3. Call API to save URL and set status to 'pending'
//   4. Refresh page to show new status

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function TradeLicenseUpload({ userId }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Create browser Supabase client for file upload
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    setError(null)
    
    if (!selectedFile) {
      setFile(null)
      return
    }

    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      setFile(null)
      return
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File must be smaller than 5MB')
      setFile(null)
      return
    }

    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // ═══════════════════════════════════════════════════════════════════
      // Step 1: Upload file to Supabase Storage
      // File path: trade-licenses/{userId}/license.pdf
      // ═══════════════════════════════════════════════════════════════════
      const filePath = `${userId}/trade-license-${Date.now()}.pdf`
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('trade-licenses')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Overwrite if exists
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // ═══════════════════════════════════════════════════════════════════
      // Step 2: Get public URL for the uploaded file
      // ═══════════════════════════════════════════════════════════════════
      const { data: urlData } = supabase
        .storage
        .from('trade-licenses')
        .getPublicUrl(filePath)

      const fileUrl = urlData.publicUrl

      // ═══════════════════════════════════════════════════════════════════
      // Step 3: Call API to save URL and update verification status
      // ═══════════════════════════════════════════════════════════════════
      const response = await fetch('/api/company/upload-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_url: fileUrl }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save license')
      }

      // ═══════════════════════════════════════════════════════════════════
      // Step 4: Success! Refresh page to show new status
      // ═══════════════════════════════════════════════════════════════════
      setSuccess(true)
      
      // Refresh after short delay so user sees success message
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className="text-green-400 font-medium">
        ✅ Trade license uploaded! Refreshing...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* File input */}
      <div className="flex flex-col gap-2">
        <label className="text-slate-300 text-sm">
          Select your trade license (PDF, max 5MB)
        </label>
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-slate-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-purple-500/20 file:text-purple-300
            hover:file:bg-purple-500/30
            file:cursor-pointer
            disabled:opacity-50"
        />
        {file && (
          <p className="text-slate-400 text-xs">
            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 
          disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium
          transition-colors"
      >
        {uploading ? 'Uploading...' : '📤 Upload Trade License'}
      </button>
    </div>
  )
}
