'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Camera, Loader2 } from 'lucide-react'

export default function AvatarUpload({ avatarUrl, onUploadComplete }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const supabase = createClient()

  const handleUpload = async (e) => {
    try {
      setUploading(true)
      setError(null)
      
      const file = e.target.files?.[0]
      if (!file) return
      
      if (!file.type.startsWith('image/')) {
        throw new Error('You must upload an image file.')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      onUploadComplete(data.publicUrl)
    } catch (err) {
      setError(err.message)
      console.error('Error uploading avatar:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative group">
        <div className="w-20 h-20 rounded-full border border-invert/10 bg-invert/5 flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-500/20 to-indigo-600/20">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-6 h-6 text-slate-400" />
          )}
        </div>
        
        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-full">
          {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
      <div>
        <h3 className="text-sm font-medium text-white mb-1">Profile Photo</h3>
        <p className="text-xs text-slate-400 max-w-xs">Upload a profile photo. Recommended size is 256x256px.</p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    </div>
  )
}
