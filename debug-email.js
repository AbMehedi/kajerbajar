require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

async function run() {
  const email = 'omor.farukh16@gmail.com';
  console.log(`Checking user: ${email}`);
  
  const { data: user, error } = await supabase
    .from('users_profiles')
    .select('*')
    .eq('email', email)
    .single();
    
  if (error) {
    console.error('Error fetching user:', error);
    return;
  }
  
  console.log('User found:', user);
  
  console.log('Sending test email via Resend...');
  const { data: resendData, error: resendError } = await resend.emails.send({
    from: 'Kaajer Bazar <onboarding@resend.dev>',
    to: user.email,
    subject: 'Test Email Debug',
    html: '<p>Testing delivery.</p>'
  });
  
  if (resendError) {
    console.error('Resend Error:', resendError);
  } else {
    console.log('Resend Success:', resendData);
  }
}

run();
