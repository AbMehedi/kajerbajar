// src/app/api/learning/categories/route.js
// GET /api/learning/categories
//
// Returns the hardcoded 5-category skill list.
// Skills are hardcoded at launch (not pulled from DB).
// Admins configure individual learning_modules rows in the DB separately.

import { NextResponse } from 'next/server'

// ── Hardcoded skill catalog ────────────────────────────────────────────────────
// Each category has a list of skills.
// Each difficulty level maps to a fixed deadline_hours.

const DIFFICULTY_LEVELS = [
  { level: 'rookie',  label: 'Rookie',  deadline_hours: 24, description: 'Beginner friendly — 24 hour deadline' },
  { level: 'skilled', label: 'Skilled', deadline_hours: 48, description: 'Intermediate — 48 hour deadline' },
  { level: 'expert',  label: 'Expert',  deadline_hours: 72, description: 'Advanced — 72 hour deadline' },
]

export const SKILL_CATEGORIES = [
  {
    id:          'tech',
    label:       'Tech & Development',
    icon:        '💻',
    description: 'Web, mobile, backend, and infrastructure skills',
    color:       'blue',
    skills: [
      'React', 'Next.js', 'Vue.js', 'Node.js', 'Python', 'Django', 'FastAPI',
      'PHP', 'Java', 'Flutter', 'React Native', 'PostgreSQL', 'TypeScript', 'DevOps',
    ],
  },
  {
    id:          'design',
    label:       'Design & Creative',
    icon:        '🎨',
    description: 'UI/UX, visual design, and creative tools',
    color:       'purple',
    skills: [
      'Figma', 'UI/UX Design', 'Adobe XD', 'Photoshop', 'Illustrator',
      'Motion Graphics', 'Brand Identity',
    ],
  },
  {
    id:          'content',
    label:       'Content & Writing',
    icon:        '✍️',
    description: 'Writing, editing, and content creation',
    color:       'green',
    skills: [
      'Blog Writing', 'Copywriting', 'Technical Writing', 'Script Writing',
      'Social Media Content', 'SEO Writing',
    ],
  },
  {
    id:          'marketing',
    label:       'Digital Marketing',
    icon:        '📈',
    description: 'SEO, ads, social media, and growth',
    color:       'orange',
    skills: [
      'SEO', 'Social Media Marketing', 'Google Ads', 'Facebook Ads',
      'Email Marketing', 'Content Strategy',
    ],
  },
  {
    id:          'data',
    label:       'Data & Research',
    icon:        '📊',
    description: 'Data analysis, ML, and research methods',
    color:       'cyan',
    skills: [
      'Data Analysis', 'Machine Learning', 'Excel/Sheets', 'Python (Data)',
      'Power BI', 'Market Research',
    ],
  },
]

export async function GET() {
  const categories = SKILL_CATEGORIES.map((cat) => ({
    ...cat,
    difficulty_levels: DIFFICULTY_LEVELS,
  }))

  return NextResponse.json({ categories })
}
