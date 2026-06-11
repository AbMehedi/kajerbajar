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

async function testQuery() {
  const { data: certs } = await supabase.from('certificates').select('*').limit(1)
  if (!certs || certs.length === 0) return
  const certId = certs[0].id
  console.log('Cert ID:', certId)

  // Try the exact query from verify API
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      id,
      issued_at,
      projects (
        id,
        title,
        budget_bdt,
        company_profiles (
          legal_name
        )
      ),
      student_id,
      student_profiles (
        users_profiles!student_profiles_id_fkey (
          full_name
        )
      )
    `).eq('id', certId)
    
  console.log('Query result:', JSON.stringify({ data, error }, null, 2))
}
testQuery()
