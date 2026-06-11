require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkNotifs() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', '669113d8-0de8-48fd-ad4e-be651e499cdb')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Recent notifications for Omor:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkNotifs();
