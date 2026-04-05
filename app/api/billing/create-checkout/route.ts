import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getStripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const stripe = getStripe();

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email! });
    customerId = customer.id;
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const body = await req.json().catch(() => ({}));
  const selectedPlan = body?.plan === 'annual' ? 'annual' : 'monthly';
  const selectedPriceId = selectedPlan === 'annual'
    ? process.env.STRIPE_PAID_PLAN_ANNUAL_PRICE_ID
    : process.env.STRIPE_PAID_PLAN_MONTHLY_PRICE_ID || process.env.STRIPE_PRICE_ID;

  if (!selectedPriceId) {
    return NextResponse.json({ error: 'Missing Stripe price configuration' }, { status: 500 });
  }

  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL!.replace(/\/$/, '');

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: selectedPriceId, quantity: 1 }],
    success_url: `${origin}/dashboard`,
    cancel_url: `${origin}/dashboard`,
    metadata: { userId: user.id, plan: selectedPlan, source: 'dashboard-add-line' },
  });

  return NextResponse.json({ url: session.url });
}
