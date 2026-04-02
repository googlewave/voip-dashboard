// Quick test script to verify email sending works
// Run with: node test-email.js

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('Testing Resend email...\n');
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env.local');
    return;
  }
  
  console.log('✓ RESEND_API_KEY found');
  console.log('✓ Sending test email...\n');
  
  try {
    const result = await resend.emails.send({
      from: 'Ring Ring <onboarding@resend.dev>',
      to: 'bliuser@gmail.com', // Change to your email
      subject: '🧪 Test Email from Ring Ring',
      html: '<h1>Test Email</h1><p>If you received this, email sending is working!</p>',
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Email ID:', result.data.id);
    console.log('\nCheck your inbox at bliuser@gmail.com');
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    if (error.statusCode) {
      console.error('Status code:', error.statusCode);
    }
  }
}

testEmail();
