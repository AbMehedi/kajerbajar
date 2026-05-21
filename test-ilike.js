const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const envContent = fs.readFileSync('.env.local', 'utf8')
let env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = match[2] ? match[2].trim() : ''
    if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1)
    else if (value.startsWith("'") && value.endsWith("'")) value = value.substring(1, value.length - 1)
    env[match[1]] = value
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

supabase.from('certificates').select('id, project_id').filter('project_id::text', 'ilike', '7863e819%').then(console.log)
