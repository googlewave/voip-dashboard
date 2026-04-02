/**
 * Sync Script: Fix users who completed Stripe checkout but don't have database records
 * 
 * This script:
 * 1. Finds auth users without corresponding database records
 * 2. Fetches their Stripe subscription data
 * 3. Creates/updates their database records
 * 4. Optionally provisions phone numbers
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

async function syncStripeUsers() {
  console.log('🔄 Starting Stripe user sync...\n');

  // 1. Get all auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Failed to fetch auth users:', authError);
    return;
  }

  console.log(`📋 Found ${authUsers.users.length} auth users\n`);

  // 2. Get all database users
  const { data: dbUsers, error: dbError } = await supabase
    .from('users')
    .select('id, email');

  if (dbError) {
    console.error('❌ Failed to fetch database users:', dbError);
    return;
  }

  const dbUserIds = new Set(dbUsers?.map(u => u.id) || []);

  // 3. Find users missing from database
  const missingUsers = authUsers.users.filter(u => !dbUserIds.has(u.id));

  console.log(`🔍 Found ${missingUsers.length} users missing from database\n`);

  if (missingUsers.length === 0) {
    console.log('✅ All users are synced!');
    return;
  }

  // 4. Process each missing user
  for (const authUser of missingUsers) {
    console.log(`\n👤 Processing: ${authUser.email}`);
    
    try {
      // Search for Stripe customer by email
      const customers = await stripe.customers.list({
        email: authUser.email,
        limit: 1,
      });

      if (customers.data.length === 0) {
        console.log(`  ⚠️  No Stripe customer found - creating free plan user`);
        
        // Create free plan user
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email!,
            plan: 'free',
          });

        if (insertError) {
          console.error(`  ❌ Failed to create user:`, insertError.message);
        } else {
          console.log(`  ✅ Created free plan user`);
        }
        continue;
      }

      const customer = customers.data[0];
      console.log(`  💳 Found Stripe customer: ${customer.id}`);

      // Get active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1,
      });

      let plan = 'free';
      let stripeSubId = null;

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        stripeSubId = subscription.id;
        
        // Determine plan type from subscription interval
        const interval = subscription.items.data[0]?.price?.recurring?.interval;
        plan = interval === 'year' ? 'annual' : 'monthly';
        
        console.log(`  📅 Active subscription: ${plan} (${subscription.id})`);
      }

      // Create/update user record
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email!,
          plan: plan,
          stripe_customer_id: customer.id,
          stripe_sub_id: stripeSubId,
        }, {
          onConflict: 'id',
        });

      if (upsertError) {
        console.error(`  ❌ Failed to upsert user:`, upsertError.message);
      } else {
        console.log(`  ✅ Synced user with plan: ${plan}`);
      }

    } catch (error: any) {
      console.error(`  ❌ Error processing user:`, error.message);
    }
  }

  console.log('\n✅ Sync complete!\n');
}

// Run the sync
syncStripeUsers()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
