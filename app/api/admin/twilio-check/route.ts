import { NextResponse } from 'next/server';
import { ensureTwilioSetup } from '@/lib/twilio-setup';
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

function getErrorStack(error: unknown) {
  return error instanceof Error ? error.stack : undefined;
}

export async function POST() {
  try {
    const results: string[] = [];

    // 1. Run full Twilio setup check
    results.push('Running Twilio setup check...');
    await ensureTwilioSetup();
    results.push('✅ Twilio setup verified');

    // 2. List SIP domains and their config
    const domains = await twilioClient.sip.domains.list();
    for (const domain of domains) {
      results.push(`\n📡 Domain: ${domain.domainName}`);
      results.push(`   SID: ${domain.sid}`);
      results.push(`   Voice URL: ${domain.voiceUrl || '⚠️ NOT SET'}`);
      results.push(`   Voice Method: ${domain.voiceMethod}`);
      results.push(`   SIP Registration: ${domain.sipRegistration}`);

      // Check credential list mappings
      const credMappings = await twilioClient.sip.domains(domain.sid).credentialListMappings.list();
      results.push(`   Credential Lists: ${credMappings.length}`);
      for (const m of credMappings) {
        results.push(`     - ${m.sid}`);
      }
    }

    // 3. List credential lists
    const credLists = await twilioClient.sip.credentialLists.list();
    results.push('\n🔑 Credential Lists:');
    for (const cl of credLists) {
      const creds = await twilioClient.sip.credentialLists(cl.sid).credentials.list();
      results.push(`   ${cl.friendlyName} (${cl.sid}): ${creds.length} credentials`);
      for (const c of creds) {
        results.push(`     - ${c.username}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    return NextResponse.json({ 
      success: false, 
      error: getErrorMessage(error),
      stack: getErrorStack(error),
    }, { status: 500 });
  }
}
