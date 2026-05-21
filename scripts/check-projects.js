// scripts/check-projects.js
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const envPath = path.join(__dirname, '..', '.env.local')
const env = {}
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/)
  if (match) {
    let value = (match[2] || '').trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[match[1]] = value
  }
})

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function check() {
  // Check projects columns
  const { data: projects, error: pErr } = await sb.from('projects').select('*').limit(1)
  if (pErr) { console.log('projects error:', pErr.message); return }
  console.log('projects columns:', Object.keys(projects[0] || {}))

  // Test the exact query used in certificate route
  const projectId = (projects[0] || {}).id
  if (projectId) {
    const { data, error } = await sb
      .from('projects')
      .select('id, title, description, budget_bdt, status, updated_at, company_profiles(legal_name)')
      .eq('id', projectId)
      .single()
    console.log('\nCertificate query test:')
    console.log('data:', JSON.stringify(data))
    console.log('error:', JSON.stringify(error))

    // Try without updated_at
    const { data: data2, error: err2 } = await sb
      .from('projects')
      .select('id, title, description, budget_bdt, status, company_profiles(legal_name)')
      .eq('id', projectId)
      .single()
    console.log('\nWithout updated_at:')
    console.log('data:', JSON.stringify(data2))
    console.log('error:', JSON.stringify(err2))
  }
}

check().catch(console.error)
