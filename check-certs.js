require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkCerts() {
  const { data, error } = await supabase
    .from('certificates')
    .select('id, project_id, student_id')
    .order('issued_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Recent certificates:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkCerts();
