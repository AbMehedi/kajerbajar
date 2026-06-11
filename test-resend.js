const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('Using API Key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Kaajer Bazar <onboarding@resend.dev>',
      to: 'delivered@resend.dev', // Resend's default test email, or change to your own
      subject: 'Test Notification - Kaajer Bazar',
      html: '<strong>Resend integration is working!</strong>'
    });

    if (error) {
      console.error('Error sending email:', error);
      return;
    }

    console.log('Email sent successfully!', data);
  } catch (err) {
    console.error('Exception occurred:', err);
  }
}

testEmail();
