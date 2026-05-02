// scripts/seed-test-users.js
// Creates test users for all 3 roles: student, company, admin
// Run: node scripts/seed-test-users.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const testUsers = [
  {
    email: 'student@test.com',
    password: 'Student123!',
    role: 'student',
    fullName: 'Test Student',
  },
  {
    email: 'company@test.com',
    password: 'Company123!',
    role: 'company',
    fullName: 'Test Company',
  },
  {
    email: 'admin@test.com',
    password: 'Admin123!',
    role: 'admin',
    fullName: 'Test Admin',
  },
]

async function seedTestUsers() {
  console.log('\n🌱 Seeding test users for development...\n')

  for (const user of testUsers) {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm so they can login immediately
      })

      if (authError) {
        if (authError.message.includes('already exists')) {
          console.log(`⏭️  ${user.role.toUpperCase()}: ${user.email} already exists, skipping`)
          continue
        }
        throw authError
      }

      // 2. Create users_profiles entry
      const { error: profileError } = await supabase
        .from('users_profiles')
        .insert({
          id: authData.user.id,
          email: user.email,
          role: user.role,
          full_name: user.fullName,
        })

      if (profileError) throw profileError

      // 3. Create role-specific profile
      if (user.role === 'student') {
        await supabase.from('student_profiles').insert({
          id: authData.user.id,
          username: `test_${user.role}_${Date.now()}`,
        })
      } else if (user.role === 'company') {
        await supabase.from('company_profiles').insert({
          id: authData.user.id,
          legal_name: user.fullName,
          verification_status: 'not_submitted',
        })
      }

      console.log(`✓ ${user.role.toUpperCase()}: ${user.email} created successfully`)
    } catch (error) {
      console.error(`✗ Failed to create ${user.role}: ${error.message}`)
    }
  }

  console.log('\n✅ Test users created!\n')
  console.log('Now you can login at http://localhost:3000/login\n')
  console.log('Credentials:')
  testUsers.forEach((u) => {
    console.log(`  ${u.role.padEnd(8)} | ${u.email.padEnd(18)} | ${u.password}`)
  })
  console.log('\n')
}

seedTestUsers().catch(console.error)
