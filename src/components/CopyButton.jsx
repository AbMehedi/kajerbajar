'use client'

import { useState } from 'react'

export default function CopyButton({ value, className }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('[CopyButton] Failed to copy:', error)
    }
  }

  return (
    <button type="button" onClick={handleCopy} className={className}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
