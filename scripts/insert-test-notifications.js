const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  const { data: users } = await supabase.from('users_profiles').select('id, email, role');
  if(!users) {
      console.log("No users found");
      return;
  }
  
  const targetEmails = ['student@test.com', 'company@test.com', 'admin@test.com'];
  const targetUsers = users.filter(u => targetEmails.includes(u.email));
  
  if (targetUsers.length === 0) {
      console.log('Test users not found in DB! Creating them or you need to use the users in DB.');
  }

  let inserted = 0;
  for (const user of targetUsers) {
    const { error } = await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'system',
      title: 'Testing Notifications!',
      body: `Hello ${user.role}! Your notifications are working.`,
      data: { link: '/' }
    });
    if(!error) inserted++;
    else console.error(error);
  }
  console.log(`Inserted ${inserted} notifications for primary test accounts.`);
}
run();