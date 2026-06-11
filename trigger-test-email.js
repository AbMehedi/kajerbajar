// This script triggers a real notification + email for a specific user ID
// Usage: node trigger-test-email.js <USER_ID>
require('dotenv').config({ path: '.env.local' });
const { createAdminSupabaseClient } = require('./src/lib/supabase-server');
const { Resend } = require('resend');

// Mocking the server-notifications.js logic since it's an ES module and we are in a CommonJS test environment
const resend = new Resend(process.env.RESEND_API_KEY);

async function triggerTest(userId) {
  try {
    const adminSupabase = await createAdminSupabaseClient();
    
    // 1. Fetch user to verify email
    const { data: userData, error: userError } = await adminSupabase
      .from('users_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('User not found or error:', userError);
      return;
    }

    console.log(`Triggering notification for: ${userData.email}`);

    // 2. Insert DB Notification
    const { error: notifError } = await adminSupabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'system',
        title: 'System Test Notification',
        body: 'This is a test to verify that the Resend email integration is working correctly with your user profile.',
        data: { link: '/' }
      });

    if (notifError) {
        console.error('DB Insert Error:', notifError);
    }

    // 3. Send actual email
    const { data, error } = await resend.emails.send({
        from: 'Kaajer Bazar <onboarding@resend.dev>',
        to: userData.email, // If using Resend Trial, this must be YOUR email or delivered@resend.dev
        subject: 'System Test Notification - Kaajer Bazar',
        html: `<h2>Hello ${userData.full_name || 'User'}</h2><p>This is a test notification from your project.</p>`
    });

    if (error) {
        console.error('Resend Error:', error);
    } else {
        console.log('Notification & Email triggered!', data);
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

const targetId = process.argv[2] || '641ca5d8-30ac-4b4f-9ed8-5ae93db560d3';
triggerTest(targetId);
