import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
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

    if (!userId) {
      console.error('No userId in session metadata');
      return NextResponse.json({ error: 'No userId' }, { status: 400 });
    }

    // Flip plan to pro
    await supabase
      .from('users')
      .update({
        plan: 'pro',
        stripe_sub_id: session.subscription as string,
      })
      .eq('id', userId);

    console.log(`✅ User ${userId} upgraded to pro`);
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
