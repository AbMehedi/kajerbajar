require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      id,
      student_id,
      student_profiles (
        username,
        users_profiles!student_profiles_id_fkey ( full_name, avatar_url )
      )
    `)
    .limit(5);
  console.log(JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

test();
