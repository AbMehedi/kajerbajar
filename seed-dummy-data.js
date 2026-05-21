// seed-dummy-data.js
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
  // Find the user Omor
  const { data: users, error: userErr } = await supabase.from('users_profiles').select('id, full_name, email').eq('email', 'omor.farukh16@gmail.com')
  if (userErr || !users || users.length === 0) {
    console.error('User not found:', userErr)
    return
  }
  const studentId = users[0].id
  console.log(`Found student: ${users[0].full_name} (${studentId})`)

  // Update wallet
  const { error: walletErr } = await supabase.from('student_profiles').update({ wallet_balance: 5500, kaajerscore: 98.5 }).eq('id', studentId)
  if (walletErr) console.error('Wallet error:', walletErr)
  else console.log('Updated wallet and score')

  // Find a completed project or create a dummy one
  const { data: apps } = await supabase.from('applications').select('project_id, projects(title, status)').eq('student_id', studentId).limit(1)
  
  let projectId = null
  if (apps && apps.length > 0) {
    projectId = apps[0].project_id
    console.log('Using existing project:', apps[0].projects.title)
  } else {
    console.log('User has no applications. We can just insert a dummy certificate with a random UUID, but it might break relations.')
    return
  }

  // Insert certificate
  const { error: certErr } = await supabase.from('certificates').insert([
    { project_id: projectId, student_id: studentId }
  ])
  if (certErr) console.error('Cert error:', certErr)
  else console.log('Created dummy certificate')
}

main().catch(console.error)
