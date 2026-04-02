/**
 * Automatic Twilio SIP Trunk Setup
 * 
 * This module ensures Twilio is properly configured for SIP trunking
 * without requiring manual configuration in the Twilio console.
 * 
 * Runs automatically on first device provision.
 */

import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const SIP_DOMAIN = process.env.TWILIO_SIP_DOMAIN || 'ringringclub.sip.us1.twilio.com';
const CRED_LIST_SID = process.env.TWILIO_SIP_CRED_LIST_SID;

/**
 * Ensure Twilio SIP trunk is fully configured
 * Creates trunk, credential list, and configures domain if needed
 */
export async function ensureTwilioSetup() {
  console.log('🔧 Checking Twilio SIP trunk configuration...');
  
  try {
    // 1. Ensure credential list exists
    const credListSid = await ensureCredentialListExists();
    
    // 2. Ensure SIP domain exists and is configured
    await ensureDomainConfigured(credListSid);
    
    // 3. Ensure IP ACL exists
    await ensureIpAclExists();

    // 4. Ensure Twilio phone numbers point to inbound voice route
    await ensureIncomingNumbersConfigured();
    
    console.log('✅ Twilio SIP trunk fully configured');
    
    return {
      success: true,
      credentialListSid: credListSid,
    };
  } catch (error: any) {
    console.error('❌ Twilio setup failed:', error.message);
    throw error;
  }
}

/**
 * Ensure all Twilio incoming numbers route to inbound voice webhook
 */
async function ensureIncomingNumbersConfigured() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.warn('⚠️ NEXT_PUBLIC_BASE_URL not set, skipping incoming number webhook sync');
    return;
  }

  const inboundVoiceUrl = `${baseUrl}/api/twilio/voice`;

  const numbers = await twilioClient.incomingPhoneNumbers.list();
  for (const num of numbers) {
    const needsUpdate =
      num.voiceUrl !== inboundVoiceUrl ||
      num.voiceFallbackUrl !== inboundVoiceUrl ||
      (num.voiceMethod || '').toUpperCase() !== 'POST';

    if (!needsUpdate) continue;

    await twilioClient.incomingPhoneNumbers(num.sid).update({
      voiceUrl: inboundVoiceUrl,
      voiceFallbackUrl: inboundVoiceUrl,
      voiceMethod: 'POST',
    });

    console.log(`✓ Updated incoming number ${num.phoneNumber} webhook -> ${inboundVoiceUrl}`);
  }
}

/**
 * Ensure credential list exists
 * Creates if not found
 */
async function ensureCredentialListExists(): Promise<string> {
  // If we have a credential list SID in env, verify it exists
  if (CRED_LIST_SID) {
    try {
      await twilioClient.sip.credentialLists(CRED_LIST_SID).fetch();
      console.log('✓ Credential list exists:', CRED_LIST_SID);
      return CRED_LIST_SID;
    } catch (error: any) {
      if (error.code === 20404) {
        console.warn('⚠️  Configured credential list not found, creating new one');
      } else {
        throw error;
      }
    }
  }
  
  // Create new credential list
  console.log('Creating new credential list...');
  const credList = await twilioClient.sip.credentialLists.create({
    friendlyName: 'Ring Ring SIP Credentials',
  });
  
  console.log('✓ Created credential list:', credList.sid);
  console.warn('⚠️  Add this to Vercel env vars: TWILIO_SIP_CRED_LIST_SID=' + credList.sid);
  
  return credList.sid;
}

/**
 * Ensure SIP domain exists and is properly configured
 */
async function ensureDomainConfigured(credListSid: string) {
  const domainName = SIP_DOMAIN.replace(/^sip:/, '').replace(/:.*$/, '');
  const voiceWebhookUrl = process.env.NEXT_PUBLIC_BASE_URL + '/api/twiml/route';
  
  try {
    // List all domains to find ours (fetching by name doesn't work with Twilio API)
    const domains = await twilioClient.sip.domains.list();
    const domain = domains.find(d => d.domainName === domainName);
    
    if (domain) {
      console.log('✓ SIP domain exists:', domainName, '(SID:', domain.sid, ')');
      
      // Always verify voice webhook URL is correct
      if (domain.voiceUrl !== voiceWebhookUrl) {
        console.log('⚠️  Updating voice webhook URL to:', voiceWebhookUrl);
        await twilioClient.sip.domains(domain.sid).update({
          voiceUrl: voiceWebhookUrl,
          voiceFallbackUrl: voiceWebhookUrl,
          voiceMethod: 'POST',
          sipRegistration: true,
        });
        console.log('✓ Voice webhook URL updated');
      } else {
        console.log('✓ Voice webhook URL correct:', voiceWebhookUrl);
      }
      
      // Ensure credential list is mapped to domain
      await ensureCredentialListMapped(domain.sid, credListSid);
    } else {
      // Domain doesn't exist, create it
      console.log('Creating SIP domain:', domainName);
      const newDomain = await twilioClient.sip.domains.create({
        domainName: domainName,
        friendlyName: 'Ring Ring SIP Domain',
        voiceUrl: voiceWebhookUrl,
        voiceFallbackUrl: voiceWebhookUrl,
        voiceMethod: 'POST',
        sipRegistration: true,
      });
      
      console.log('✓ Created SIP domain:', newDomain.sid);
      
      // Map credential list to new domain
      await ensureCredentialListMapped(newDomain.sid, credListSid);
    }
  } catch (error: any) {
    console.error('❌ Domain configuration failed:', error.message);
    throw error;
  }
}

/**
 * Ensure credential list is mapped to SIP domain
 */
async function ensureCredentialListMapped(domainName: string, credListSid: string) {
  try {
    // Check if mapping exists
    const mappings = await twilioClient.sip
      .domains(domainName)
      .credentialListMappings
      .list();
    
    const exists = mappings.some(m => m.sid === credListSid);
    
    if (exists) {
      console.log('✓ Credential list already mapped to domain');
      return;
    }
    
    // Create mapping
    await twilioClient.sip
      .domains(domainName)
      .credentialListMappings
      .create({ credentialListSid: credListSid });
    
    console.log('✓ Mapped credential list to domain');
  } catch (error: any) {
    console.error('Failed to map credential list:', error.message);
    throw error;
  }
}

/**
 * Ensure IP Access Control List exists
 * Used for inbound call routing
 */
async function ensureIpAclExists(): Promise<string> {
  try {
    // List existing ACLs
    const acls = await twilioClient.sip.ipAccessControlLists.list();
    
    // Look for Ring Ring ACL
    let acl = acls.find(a => a.friendlyName === 'Ring Ring Allowed IPs');
    
    if (!acl) {
      // Create new ACL
      console.log('Creating IP Access Control List...');
      acl = await twilioClient.sip.ipAccessControlLists.create({
        friendlyName: 'Ring Ring Allowed IPs',
      });
      console.log('✓ Created IP ACL:', acl.sid);
    } else {
      console.log('✓ IP ACL exists:', acl.sid);
    }
    
    return acl.sid;
  } catch (error: any) {
    console.error('Failed to ensure IP ACL:', error.message);
    throw error;
  }
}

/**
 * Add IP address to Access Control List
 * Called when device registers from new IP
 */
export async function addIpToAcl(ipAddress: string, friendlyName?: string) {
  try {
    const acls = await twilioClient.sip.ipAccessControlLists.list();
    const acl = acls.find(a => a.friendlyName === 'Ring Ring Allowed IPs');
    
    if (!acl) {
      console.error('IP ACL not found - run ensureTwilioSetup first');
      return;
    }
    
    // Check if IP already exists
    const existingIps = await twilioClient.sip
      .ipAccessControlLists(acl.sid)
      .ipAddresses
      .list();
    
    const exists = existingIps.some(ip => ip.ipAddress === ipAddress);
    
    if (exists) {
      console.log('✓ IP already in ACL:', ipAddress);
      return;
    }
    
    // Add IP to ACL
    await twilioClient.sip
      .ipAccessControlLists(acl.sid)
      .ipAddresses
      .create({
        friendlyName: friendlyName || `Device IP ${ipAddress}`,
        ipAddress: ipAddress,
      });
    
    console.log('✓ Added IP to ACL:', ipAddress);
  } catch (error: any) {
    console.error('Failed to add IP to ACL:', error.message);
    // Don't throw - IP ACL is optional for registration-based auth
  }
}

/**
 * Create SIP credentials for a device
 * Automatically adds to credential list
 */
export async function createSipCredentials(username: string, password: string) {
  const credListSid = CRED_LIST_SID || await ensureCredentialListExists();
  
  try {
    const credential = await twilioClient.sip
      .credentialLists(credListSid)
      .credentials
      .create({ username, password });
    
    console.log('✓ Created SIP credential:', username);
    
    return {
      sid: credential.sid,
      username: credential.username,
    };
  } catch (error: any) {
    console.error('Failed to create SIP credential:', error.message);
    throw error;
  }
}

/**
 * Delete SIP credentials
 * Used when device is removed
 */
export async function deleteSipCredentials(credentialSid: string) {
  const credListSid = CRED_LIST_SID;
  
  if (!credListSid) {
    console.error('No credential list SID configured');
    return;
  }
  
  try {
    await twilioClient.sip
      .credentialLists(credListSid)
      .credentials(credentialSid)
      .remove();
    
    console.log('✓ Deleted SIP credential:', credentialSid);
  } catch (error: any) {
    console.error('Failed to delete SIP credential:', error.message);
    // Don't throw - credential might already be deleted
  }
}
