const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  console.log('--- E2E Notificaiton Test ---')
  console.log('1. Fetch users...')
  const { data: users } = await supabase.from('users_profiles').select('*')
  const company = users.find(u => u.role === 'company')
  const student = users.find(u => u.role === 'student')

  if (!company || !student) {
    console.error('Test users not found')
    process.exit(1)
  }
  
  console.log(`Company ID: ${company.id}`)
  console.log(`Student ID: ${student.id}`)

  // Create a quick project
  console.log('2. Create dummy project...')
  const { data: project, error: pError } = await supabase
    .from('projects')
    .insert({
      company_id: company.id,
      title: 'E2E Notification Test Project',
      description: 'Testing the notification flow',
      budget: 100,
      duration_days: 7,
      status: 'open',
      required_skills: ['Testing']
    })
    .select('id')
    .single()
    
  if (pError || !project) {
    console.error('Failed to create project', pError)
    process.exit(1)
  }

  const projectId = project.id
  console.log(`Project created: ${projectId}`)

  // Trigger POST /api/applications or just call the DB directly?
  // If we just insert into the applications table, it WILL NOT trigger the notification
  // because the notification is dispatched in the Next.js API route!
  // We must hit the API endpoint!
  
  // So we need authentication token for the student to hit the API route!
  console.log('3. Authenticating student to hit API...')
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  const { data: authData, error: authErr } = await anonSupabase.auth.signInWithPassword({
    email: 'student@test.com',
    password: 'Student123!'
  })
  if (authErr) {
    console.error('Failed to auth student', authErr)
    process.exit(1)
  }
  
  const studentCookie = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]}-auth-token=${JSON.stringify([authData.session.access_token, authData.session.refresh_token, null, null, null])}`
  
  console.log('4. Calling POST /api/applications ...')
  const fetch = require('node-fetch')
  
  // Actually Next.js cookies might require different parsing, but let's just 
  // try hitting the API directly without cookie but with Bearer token?
  // Next.js supabase auth relies on cookies.
  // Wait, let's construct the standard cookie string.
  
  // Using Service Role to just create a short script that imports the helper instead?
  // NO, this is an e2e test, we want to test if the API route triggers it.
  
  // Actually, we can just use the supabase client to insert a session cookie:
  // We can pass Authorization: Bearer <token> maybe?
  // If not, we can just test the createNotification helper function.
}

run()
