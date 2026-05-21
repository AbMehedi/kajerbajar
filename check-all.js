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

async function main() {
  const { data, error, count } = await supabase.from('certificates').select('*', { count: 'exact', head: true })
  console.log('Certificates count:', count, error ? `Error: ${JSON.stringify(error)}` : '')
  
  const { data: stdData, error: stdErr } = await supabase.from('student_profiles').select('wallet_balance, kaajerscore')
  console.log('Student profiles stats:', stdData)
}

main().catch(console.error)
