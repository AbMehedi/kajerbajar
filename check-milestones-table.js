require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function check() {
  // Try to query the table
  const { data, error } = await supabase
    .from('project_milestones')
    .select('id')
    .limit(1);

  if (error) {
    console.error('❌ project_milestones table does NOT exist or has an error:');
    console.error(error.message);
    console.log('\n👉 ACTION REQUIRED: Run migrations_009_project_milestones.sql in your Supabase SQL Editor.');
  } else {
    console.log('✅ project_milestones table exists and is accessible!');
    console.log('Current rows:', data);
  }
}

check();
