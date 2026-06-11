require('dotenv').config({ path: '.env.local' });
// Because we are running a raw node script, we can't easily import next.js aliases or use next/headers.
// But we can manually mock it just to test.
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY);

async function testNotification() {
  const userId = '669113d8-0de8-48fd-ad4e-be651e499cdb'; // Omor's ID
  const type = 'system';
  const title = 'Test Full Flow';
  const body = 'This tests the full createNotification logic.';
  const sendEmail = true;
  const data = {};
  
  console.log('1. Inserting DB notification...');
  const { error } = await adminSupabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      body,
      data
    });
    
  if (error) {
    console.error('DB Insert Error:', error);
    return;
  }
  console.log('DB Insert Success.');
  
  if (sendEmail) {
    console.log('2. Fetching User Email...');
    const { data: userData } = await adminSupabase
      .from('users_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
      
    if (userData && userData.email) {
      console.log(`Sending to ${userData.email}...`);
      const res = await resend.emails.send({
        from: 'Kaajer Bazar <onboarding@resend.dev>',
        to: userData.email,
        subject: title,
        html: `<p>Hello ${userData.full_name}, ${body}</p>`
      });
      console.log('Resend response:', res);
    }
  }
}

testNotification();
