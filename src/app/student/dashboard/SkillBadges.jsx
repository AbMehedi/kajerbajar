'use client'

// src/app/student/dashboard/SkillBadges.jsx
// Displays a student's earned skill badges (approved verifications)

import { useState, useEffect } from 'react'

const SKILL_ICONS = {
  default:        '⚡',
  react:          '⚛️',
  python:         '🐍',
  javascript:     '📜',
  node:           '🟢',
  design:         '🎨',
  figma:          '🖼️',
  nextjs:         '▲',
  django:         '🌿',
  flutter:        '💙',
  sql:            '🗄️',
  css:            '🎨',
  typescript:     '🔷',
}

function getIcon(skillName) {
  const lower = skillName.toLowerCase()
  for (const [key, icon] of Object.entries(SKILL_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return SKILL_ICONS.default
}

export default function SkillBadges() {
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBadges() {
      try {
        const res = await fetch('/api/student/skills/verifications')
        const data = await res.json()
        const approved = (data.verifications || []).filter((v) => v.status === 'approved')
        setBadges(approved)
      } finally {
        setLoading(false)
      }
    }
    fetchBadges()
  }, [])

  if (loading) return null

  if (badges.length === 0) {
    return (
      <div className="glass rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3">🏅 Skill Badges</h3>
        <p className="text-slate-500 text-sm">No badges yet. Submit a skill verification to earn your first badge!</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-white font-semibold mb-3">🏅 Skill Badges ({badges.length})</h3>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span
            key={badge.id}
            title={`Verified on ${new Date(badge.submitted_at || badge.created_at).toLocaleDateString()}`}
            className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 text-green-300 text-sm px-3 py-1.5 rounded-full"
          >
            {getIcon(badge.skill_category)}
            <span className="font-medium">{badge.skill_category}</span>
            <span className="text-green-500 text-xs">✓</span>
          </span>
        ))}
      </div>
    </div>
  )
}
