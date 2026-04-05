import { Resend } from 'resend';
import { getPlanPriceLabel } from '@/lib/pricing';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Use Resend test domain until ringring.club is verified
const FROM_EMAIL = 'Ring Ring <onboarding@resend.dev>';

interface WelcomeEmailProps {
  to: string;
  name: string;
  plan: 'monthly' | 'annual';
  phoneNumber?: string;
}

export async function sendWelcomeEmail({ to, name, plan, phoneNumber }: WelcomeEmailProps) {
  if (!resend) {
    console.warn('Resend not configured - skipping welcome email');
    return;
  }
  
  const planPrice = getPlanPriceLabel(plan);
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '🔔 Welcome to Ring Ring!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #292524; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #C4531A; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
              .content { background: #fff; padding: 30px; border: 2px solid #e7e5e4; border-top: none; border-radius: 0 0 12px 12px; }
              .phone-box { background: #dbeafe; border: 2px solid #3b82f6; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; }
              .phone-number { font-size: 28px; font-weight: bold; color: #1e40af; font-family: monospace; }
              .button { display: inline-block; background: #C4531A; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #78716c; font-size: 14px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 32px;">🔔 Welcome to Ring Ring!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Make the house ring again.</p>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                
                <p>Welcome to Ring Ring! Your ${plan === 'annual' ? 'annual' : 'monthly'} plan (${planPrice}) is now active.</p>
                
                ${phoneNumber ? `
                  <div class="phone-box">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e40af; font-weight: bold;">📞 YOUR RING RING NUMBER</p>
                    <div class="phone-number">${phoneNumber}</div>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #1e3a8a;">This is your dedicated phone number for making and receiving calls.</p>
                  </div>
                ` : ''}
                
                <h3>What's Next?</h3>
                <ol>
                  <li><strong>Set up your device</strong> - Add your Ring Ring Bridge or phone to your dashboard</li>
                  <li><strong>Add contacts</strong> - Choose who can call your kids (and who they can call)</li>
                  <li><strong>Configure settings</strong> - Set up Quiet Hours and usage caps</li>
                </ol>
                
                <div style="text-align: center;">
                  <a href="https://voip-dashboard-sigma.vercel.app/dashboard" class="button">Go to Dashboard</a>
                </div>
                
                <h3>Need Help?</h3>
                <p>Check out our <a href="https://voip-dashboard-sigma.vercel.app/docs/SOP-Grandstream-Setup.md">setup guide</a> or reply to this email with any questions.</p>
                
                <p style="margin-top: 30px;">Thanks for joining Ring Ring!<br>
                <em>— The Ring Ring Team</em></p>
              </div>
              <div class="footer">
                <p>Ring Ring · The safe, screen-free home phone for kids</p>
                <p style="font-size: 12px; color: #a8a29e;">Warning: May cause actual conversation.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log(`📧 Welcome email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

interface PhoneProvisionedEmailProps {
  to: string;
  name: string;
  phoneNumber: string;
}

export async function sendPhoneProvisionedEmail({ to, name, phoneNumber }: PhoneProvisionedEmailProps) {
  if (!resend) {
    console.warn('Resend not configured - skipping phone provisioned email');
    return;
  }
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '📞 Your Ring Ring Number is Ready!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #292524; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
              .content { background: #fff; padding: 30px; border: 2px solid #e7e5e4; border-top: none; border-radius: 0 0 12px 12px; }
              .phone-box { background: #dbeafe; border: 2px solid #3b82f6; padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center; }
              .phone-number { font-size: 36px; font-weight: bold; color: #1e40af; font-family: monospace; margin: 10px 0; }
              .button { display: inline-block; background: #C4531A; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #78716c; font-size: 14px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 32px;">📞 Your Number is Ready!</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                
                <p>Great news! Your Ring Ring phone number has been provisioned and is ready to use.</p>
                
                <div class="phone-box">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e40af; font-weight: bold;">YOUR RING RING NUMBER</p>
                  <div class="phone-number">${phoneNumber}</div>
                </div>
                
                <p><strong>What this means:</strong></p>
                <ul>
                  <li>You can now make and receive calls to any US number</li>
                  <li>This number is registered with E911 for emergency services</li>
                  <li>Your contacts can call this number to reach your Ring Ring device</li>
                </ul>
                
                <div style="text-align: center;">
                  <a href="https://voip-dashboard-sigma.vercel.app/dashboard" class="button">View in Dashboard</a>
                </div>
                
                <p style="margin-top: 30px;">Ready to make the house ring!<br>
                <em>— The Ring Ring Team</em></p>
              </div>
              <div class="footer">
                <p>Ring Ring · The safe, screen-free home phone for kids</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log(`📧 Phone provisioned email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send phone provisioned email:', error);
  }
}

interface OtpEmailProps {
  to: string;
  otp: string;
}

export async function sendOtpEmail({ to, otp }: OtpEmailProps) {
  if (!resend) {
    console.warn('Resend not configured - skipping OTP email');
    return;
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${otp} — Your Ring Ring verification code`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #292524; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; }
              .header { background: #C4531A; color: white; padding: 24px 30px; text-align: center; border-radius: 12px 12px 0 0; }
              .content { background: #fff; padding: 30px; border: 2px solid #e7e5e4; border-top: none; border-radius: 0 0 12px 12px; }
              .otp-box { background: #fafaf9; border: 2px solid #e7e5e4; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
              .otp-code { font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #C4531A; font-family: monospace; }
              .footer { text-align: center; color: #78716c; font-size: 12px; margin-top: 24px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin:0;font-size:22px;">🔐 Verification Code</h1>
              </div>
              <div class="content">
                <p>Enter this code to complete your sign-in:</p>
                <div class="otp-box">
                  <div class="otp-code">${otp}</div>
                  <p style="margin:8px 0 0;font-size:13px;color:#78716c;">Expires in 10 minutes</p>
                </div>
                <p style="font-size:13px;color:#78716c;">If you didn't request this, you can safely ignore this email. Someone may have typed your email by mistake.</p>
              </div>
              <div class="footer">
                <p>Ring Ring · The safe, screen-free home phone for kids</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    console.log(`📧 OTP email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
  }
}

interface OrderConfirmationEmailProps {
  to: string;
  name: string;
  hardware: string;
  plan: string;
  delivery: string;
  shippingAddress?: {
    line1: string;
    city: string;
    state: string;
    zip: string;
  };
}

export async function sendOrderConfirmationEmail({ 
  to, 
  name, 
  hardware, 
  plan, 
  delivery,
  shippingAddress 
}: OrderConfirmationEmailProps) {
  if (!resend) {
    console.warn('Resend not configured - skipping order confirmation email');
    return;
  }
  
  const hardwareName = hardware === 'kit' ? 'Ring Ring Starter Kit' : 'Ring Ring Bridge';
  const planName = plan === 'annual' ? 'Annual Plan' : plan === 'monthly' ? 'Monthly Plan' : 'Free Plan';
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '✅ Order Confirmed - Ring Ring',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #292524; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #15803d; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
              .content { background: #fff; padding: 30px; border: 2px solid #e7e5e4; border-top: none; border-radius: 0 0 12px 12px; }
              .order-box { background: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; color: #78716c; font-size: 14px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 32px;">✅ Order Confirmed!</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                
                <p>Thanks for your order! We're excited to help you make the house ring again.</p>
                
                <div class="order-box">
                  <h3 style="margin-top: 0;">Order Details</h3>
                  <p><strong>Hardware:</strong> ${hardwareName}</p>
                  <p><strong>Plan:</strong> ${planName}</p>
                  <p><strong>Delivery:</strong> ${delivery === 'shipping' ? 'Shipping' : 'Local Pickup'}</p>
                  ${shippingAddress ? `
                    <p><strong>Shipping to:</strong><br>
                    ${shippingAddress.line1}<br>
                    ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}</p>
                  ` : ''}
                </div>
                
                ${delivery === 'shipping' ? `
                  <p><strong>What's Next?</strong></p>
                  <p>We'll send you a shipping confirmation with tracking information once your order ships. Most orders ship within 1-2 business days.</p>
                ` : `
                  <p><strong>What's Next?</strong></p>
                  <p>We'll be in touch shortly to coordinate pickup details.</p>
                `}
                
                <p>In the meantime, you can set up your account and get familiar with the dashboard.</p>
                
                <p style="margin-top: 30px;">Thanks for choosing Ring Ring!<br>
                <em>— The Ring Ring Team</em></p>
              </div>
              <div class="footer">
                <p>Ring Ring · The safe, screen-free home phone for kids</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log(`📧 Order confirmation email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
  }
}
