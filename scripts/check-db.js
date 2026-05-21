// scripts/check-db.js
// Checks what columns are present in the live Supabase 'applications' table
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local')
let env = {}
try {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (match) {
      let value = match[2] ? match[2].trim() : ''
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1)
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1)
      }
      env[match[1]] = value
    }
  })
} catch (err) {
  console.error('Failed to read .env.local:', err)
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Keys found in env:', Object.keys(env))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function check() {
  console.log('Checking applications table in live Supabase...')
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching applications:', error)
    process.exit(1)
  }

  if (data && data.length > 0) {
    console.log('Columns found in live database applications table:')
    console.log(Object.keys(data[0]))
  } else {
    console.log('No applications records found. Trying system inspect...')
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${serviceRoleKey}`)
      const doc = await response.json()
      if (doc && doc.definitions && doc.definitions.applications) {
        console.log('Applications schema properties from PostgREST:')
        console.log(Object.keys(doc.definitions.applications.properties))
      } else {
        console.log('Could not find applications definition in OpenAPI doc.')
      }
    } catch (fetchErr) {
      console.error('Failed to fetch PostgREST OpenAPI schema:', fetchErr)
    }
  }
}

check().catch(console.error)
