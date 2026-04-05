import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendWelcomeEmail, sendOrderConfirmationEmail } from '@/lib/email';
import { getStripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const supabase = getSupabaseAdmin();

  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    const areaCode = session.metadata?.areaCode;
    const e911AddressStr = session.metadata?.e911Address;

    if (!userId) {
      console.error('No userId in session metadata');
      return NextResponse.json({ error: 'No userId' }, { status: 400 });
    }

    // Update user plan
    await supabase
      .from('users')
      .update({
        plan: plan || 'monthly',
        stripe_customer_id: session.customer as string,
        stripe_sub_id: session.subscription as string,
        area_code: areaCode || null,
      })
      .eq('id', userId);

    console.log(`✅ User ${userId} upgraded to ${plan}`);

    // Send order confirmation email
    try {
      const shippingAddressStr = session.metadata?.shippingAddress;
      await sendOrderConfirmationEmail({
        to: session.customer_email || session.metadata?.email || '',
        name: session.metadata?.name || 'Customer',
        hardware: session.metadata?.hardware || 'adapter',
        plan: plan || 'monthly',
        delivery: session.metadata?.delivery || 'pickup',
        shippingAddress: shippingAddressStr ? JSON.parse(shippingAddressStr) : undefined,
      });
    } catch (err: any) {
      console.error('Failed to send order confirmation email:', err.message);
    }

    // Provision phone number for paid plans
    if ((plan === 'monthly' || plan === 'annual') && areaCode && e911AddressStr) {
      try {
        const e911Address = JSON.parse(e911AddressStr);
        
        // Call the provision-number API
        const provisionRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://voip-dashboard-sigma.vercel.app'}/api/admin/provision-number`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            areaCode,
            e911: {
              customerName: session.metadata?.name || session.customer_email,
              street: e911Address.line1,
              city: e911Address.city,
              region: e911Address.state,
              postalCode: e911Address.zip,
            },
          }),
        });

        if (provisionRes.ok) {
          const data = await provisionRes.json();
          console.log(`📞 Phone number provisioned for user ${userId}: ${data.phoneNumber}`);
          
          // Send welcome email with phone number
          try {
            await sendWelcomeEmail({
              to: session.customer_email || session.metadata?.email || '',
              name: session.metadata?.name || 'Customer',
              plan: plan as 'monthly' | 'annual',
              phoneNumber: data.phoneNumber,
            });
          } catch (emailErr: any) {
            console.error('Failed to send welcome email:', emailErr.message);
          }
        } else {
          const error = await provisionRes.json();
          console.error(`❌ Failed to provision phone number for user ${userId}:`, error);
          
          // Send welcome email without phone number
          try {
            await sendWelcomeEmail({
              to: session.customer_email || session.metadata?.email || '',
              name: session.metadata?.name || 'Customer',
              plan: plan as 'monthly' | 'annual',
            });
          } catch (emailErr: any) {
            console.error('Failed to send welcome email:', emailErr.message);
          }
        }
      } catch (err: any) {
        console.error(`❌ Error provisioning phone number for user ${userId}:`, err.message);
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;

    await supabase
      .from('users')
      .update({ plan: 'free', twilio_number: null, twilio_number_sid: null })
      .eq('stripe_sub_id', subscription.id);

    console.log(`⬇️ Subscription cancelled: ${subscription.id}`);
  }

  return NextResponse.json({ received: true });
}
