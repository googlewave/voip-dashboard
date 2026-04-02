/**
 * Auto-Provisioning Endpoint
 * 
 * Single URL that automatically provisions any device.
 * No manual configuration needed - just works.
 * 
 * Usage:
 * - Grandstream: Set provisioning URL to this endpoint
 * - Linksys: Set config server to this endpoint
 * - QR Code: Scan to auto-configure
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureTwilioSetup, createSipCredentials } from '@/lib/twilio-setup';

const CONFIG_VERSION = '1.0.0';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const startTime = Date.now();
  let deviceId: string | undefined;
  
  try {
    const resolvedParams = await params;
    deviceId = resolvedParams.deviceId;
    
    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const typeParam = req.nextUrl.searchParams.get('type');
    const deviceType: 'grandstream' | 'linksys' = 
      (typeParam === 'grandstream' || typeParam === 'linksys') 
        ? typeParam 
        : detectDeviceType(userAgent);

    console.log(`📞 Auto-provisioning request for ${deviceId} (${deviceType}) from ${ipAddress}`);

    // 1. Ensure Twilio is configured (runs once, cached after)
    await ensureTwilioSetup();

    // 2. Get or create device
    let device = await prisma.device.findUnique({
      where: { id: deviceId },
      select: {
        id: true,
        userId: true,
        name: true,
        sipUsername: true,
        sipPassword: true,
        sipDomain: true,
      },
    });

    if (!device) {
      return new NextResponse('Device not found', { status: 404 });
    }

    // 3. Create SIP credentials if not exist
    if (!device.sipUsername || !device.sipPassword) {
      console.log('Creating SIP credentials for device:', deviceId);
      
      const username = `sip_${deviceId.slice(-6)}_${Date.now()}`;
      const password = Math.random().toString(36).slice(-12) + 'A1!';

      // Create in Twilio
      await createSipCredentials(username, password);

      // Save to database
      await prisma.device.update({
        where: { id: deviceId },
        data: {
          sipUsername: username,
          sipPassword: password,
          sipDomain: process.env.TWILIO_SIP_DOMAIN,
        },
      });

      device.sipUsername = username;
      device.sipPassword = password;
      device.sipDomain = process.env.TWILIO_SIP_DOMAIN || null;
    }

    // 4. Get approved contacts
    const contacts = await prisma.contact.findMany({
      where: { deviceId },
      orderBy: { quickDialSlot: 'asc' },
      select: { 
        name: true, 
        phoneNumber: true, 
        quickDialSlot: true,
        contactType: true,
        sipUsername: true,
      },
    });

    // 5. Generate device-specific config
    const config = generateConfig(deviceType, device, contacts);

    // 6. Log successful provisioning
    const duration = Date.now() - startTime;
    await prisma.provisioningLog.create({
      data: {
        deviceId: deviceId,
        status: 'success',
        configVersion: CONFIG_VERSION,
        ipAddress: ipAddress,
        userAgent: userAgent,
      },
    });

    // 7. Update device provisioning status
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        lastProvisionedAt: new Date(),
        provisioningStatus: 'success',
        configVersion: CONFIG_VERSION,
        lastSeenIp: ipAddress,
        adapterType: deviceType,
      },
    });

    console.log(`✅ Auto-provisioned ${deviceType} for device ${deviceId} in ${duration}ms`);

    // 8. Return config with appropriate content type
    const contentType = deviceType === 'grandstream' ? 'text/xml' : 'text/xml';
    const filename = deviceType === 'grandstream' ? 'cfg.xml' : 'linksys.cfg';

    return new NextResponse(config, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error('Auto-provision error:', error);
    
    // Log failed provisioning attempt
    if (deviceId) {
      try {
        const userAgent = req.headers.get('user-agent') || '';
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        
        await prisma.provisioningLog.create({
          data: {
            deviceId: deviceId,
            status: 'failed',
            configVersion: CONFIG_VERSION,
            ipAddress: ipAddress,
            userAgent: userAgent,
            errorMessage: error.message,
          },
        });

        await prisma.device.update({
          where: { id: deviceId },
          data: {
            provisioningStatus: 'failed',
            lastSeenIp: ipAddress,
          },
        });
      } catch (logError) {
        console.error('Failed to log provisioning error:', logError);
      }
    }
    
    return new NextResponse(
      `Provisioning failed: ${error.message}`,
      { status: 500 }
    );
  }
}

/**
 * Detect device type from User-Agent
 */
function detectDeviceType(userAgent: string): 'grandstream' | 'linksys' {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('grandstream') || ua.includes('ht801') || ua.includes('ht802')) {
    return 'grandstream';
  }
  
  if (ua.includes('linksys') || ua.includes('spa') || ua.includes('spa2102')) {
    return 'linksys';
  }
  
  // Default to Grandstream (more common)
  return 'grandstream';
}

/**
 * Generate device-specific configuration
 */
function generateConfig(
  deviceType: 'grandstream' | 'linksys',
  device: any,
  contacts: any[]
): string {
  const sipDomain = (device.sipDomain || process.env.TWILIO_SIP_DOMAIN!).replace(/:(\d+)$/, '');
  const sipDomainWithPort = `${sipDomain}:5060`;
  const displayName = device.name || device.sipUsername;

  // Build dial plan supporting both SIP usernames and phone numbers
  const phoneNumbers = contacts
    .filter((c) => c.contactType === 'phone_number' && c.phoneNumber)
    .map((c) => c.phoneNumber.replace(/\D/g, ''));
  
  const hasSipContacts = contacts.some((c) => c.contactType === 'ring_ring_friend' && c.sipUsername);
  
  let dialPlan = '(911|933';
  if (phoneNumbers.length > 0) {
    dialPlan += `|${phoneNumbers.join('|')}`;
  }
  if (hasSipContacts) {
    dialPlan += `|sip_*@${sipDomain}`;
  }
  dialPlan += ')';

  if (deviceType === 'grandstream') {
    return generateGrandstreamConfig(device, contacts, sipDomainWithPort, displayName, dialPlan, sipDomain);
  } else {
    return generateLinksysConfig(device, contacts, sipDomainWithPort, displayName, dialPlan, sipDomain);
  }
}

/**
 * Generate Grandstream HT801 configuration
 */
function generateGrandstreamConfig(
  device: any,
  contacts: any[],
  sipDomainWithPort: string,
  displayName: string,
  dialPlan: string,
  sipDomain: string
): string {
  // Speed dial slots 1-9 using correct HT801 P-codes (P301-P309)
  const speedDialEntries = Array.from({ length: 9 }, (_, i) => {
    const slot = i + 1;
    const pCode = 300 + slot;
    const contact = contacts.find((c) => c.quickDialSlot === slot);
    if (!contact) {
      return `    <P${pCode}></P${pCode}>`;
    }
    const dialString = contact.contactType === 'ring_ring_friend' && contact.sipUsername
      ? `${contact.sipUsername}@${sipDomain}`
      : (contact.phoneNumber || '').replace(/\D/g, '');
    return `    <P${pCode}>${dialString}</P${pCode}>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gs_provision version="1">
  <config version="1">

    <!-- SIP Server (domain only, port separate) -->
    <P47>${sipDomain}</P47>
    <P48>5060</P48>

    <!-- SIP Credentials -->
    <P35>${device.sipUsername}</P35>
    <P36>${device.sipUsername}</P36>
    <P34>${device.sipPassword}</P34>
    <P3>${displayName}</P3>

    <!-- Account Active + Registration -->
    <P271>1</P271>
    <P32>60</P32>

    <!-- NAT Traversal: Keep-Alive + STUN -->
    <P52>1</P52>
    <P76>20</P76>
    <P1411>stun.l.google.com</P1411>
    <P1412>19302</P1412>
    <P51>1</P51>

    <!-- SIP Transport: TCP (more reliable through NAT/firewalls) -->
    <P1361>1</P1361>

    <!-- Audio Codecs: G.711u, G.711a, G.729 -->
    <P57>0</P57>
    <P58>8</P58>
    <P59>18</P59>

    <!-- RTP Ports -->
    <P196>10000</P196>
    <P197>20000</P197>

    <!-- Dial Plan: permissive (validation done at Twilio webhook) -->
    <P278>{ x+ }</P278>

    <!-- Outgoing Prefix: + required by Twilio for E.164 -->
    <P331>+</P331>

    <!-- Accept SIP from proxy only -->
    <P258>1</P258>

    <!-- SRTP: Disabled (Twilio SIP domains use RTP) -->
    <P183>0</P183>

    <!-- Speed Dial Slots 1-9 -->
${speedDialEntries}

    <!-- Disable auto-provisioning after config -->
    <P194>0</P194>
    <P238>2</P238>

  </config>
</gs_provision>`;
}

/**
 * Generate Linksys SPA2102 configuration
 */
function generateLinksysConfig(
  device: any,
  contacts: any[],
  sipDomainWithPort: string,
  displayName: string,
  dialPlan: string,
  sipDomain: string
): string {
  const speedDialEntries = Array.from({ length: 9 }, (_, i) => {
    const slot = i + 1;
    const contact = contacts.find((c) => c.quickDialSlot === slot);
    if (!contact) {
      return `  <Speed_Dial_${slot}_></Speed_Dial_${slot}_>`;
    }
    const dialString = contact.contactType === 'ring_ring_friend' && contact.sipUsername
      ? `${contact.sipUsername}@${sipDomain}`
      : contact.phoneNumber || '';
    return `  <Speed_Dial_${slot}_>${contact.name}, ${dialString}</Speed_Dial_${slot}_>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<flat-profile>
  <!-- Line 1 SIP Settings -->
  <Proxy_1_>${sipDomainWithPort}</Proxy_1_>
  <Outbound_Proxy_1_>${sipDomainWithPort}</Outbound_Proxy_1_>
  <Registrar_1_>${sipDomainWithPort}</Registrar_1_>
  <Display_Name_1_>${displayName}</Display_Name_1_>
  <User_ID_1_>${device.sipUsername}</User_ID_1_>
  <Password_1_>${device.sipPassword}</Password_1_>
  <Auth_ID_1_>${device.sipUsername}</Auth_ID_1_>

  <!-- Line Enable -->
  <Line_Enable_1_>Yes</Line_Enable_1_>

  <!-- Registration -->
  <Register_1_>Yes</Register_1_>
  <Register_Expires_1_>3600</Register_Expires_1_>
  <Make_Call_Without_Reg_1_>No</Make_Call_Without_Reg_1_>
  <Ans_Call_Without_Reg_1_>No</Ans_Call_Without_Reg_1_>

  <!-- Audio Codecs -->
  <Preferred_Codec_1_>G711u</Preferred_Codec_1_>
  <Second_Preferred_Codec_1_>G711a</Second_Preferred_Codec_1_>
  <Third_Preferred_Codec_1_>G729a</Third_Preferred_Codec_1_>
  <Use_Pref_Codec_Only_1_>No</Use_Pref_Codec_Only_1_>

  <!-- RTP Audio Settings -->
  <RTP_Port_Min_1_>10000</RTP_Port_Min_1_>
  <RTP_Port_Max_1_>20000</RTP_Port_Max_1_>
  <RTP_Packet_Size_1_>0.020</RTP_Packet_Size_1_>
  <SIP_T1_Intvl_1_>1</SIP_T1_Intvl_1_>

  <!-- NAT Settings -->
  <NAT_Mapping_Enable_1_>Yes</NAT_Mapping_Enable_1_>
  <NAT_Keep_Alive_Enable_1_>Yes</NAT_Keep_Alive_Enable_1_>
  <NAT_Keep_Alive_Intvl_1_>20</NAT_Keep_Alive_Intvl_1_>

  <!-- STUN -->
  <STUN_Enable>yes</STUN_Enable>
  <STUN_Server>stun.l.google.com</STUN_Server>
  <STUN_Test_Enable>yes</STUN_Test_Enable>

  <!-- SIP Transport: TCP -->
  <SIP_Transport_1_>TCP</SIP_Transport_1_>
  <SIP_Port_1_>5060</SIP_Port_1_>

  <!-- SRTP Disabled -->
  <SRTP_Method_1_>Disabled</SRTP_Method_1_>

  <!-- Dial Plan: whitelisted numbers + emergency only -->
  <Dial_Plan_1_>${dialPlan}</Dial_Plan_1_>

  <!-- Dial Plan Prefix: required by Twilio -->
  <Dial_Plan_Prefix_1_>+</Dial_Plan_Prefix_1_>

  <!-- Regional Dial Tone (US) -->
  <Dial_Tone>350@-19,440@-19;10(*/0/1+2)</Dial_Tone>
  <Ring_Waveform>Sinusoid</Ring_Waveform>

  <!-- Speed Dial (Quick Dial Slots 1-9) -->
${speedDialEntries}

  <!-- Disable provisioning after first config -->
  <Provision_Enable>no</Provision_Enable>
</flat-profile>`;
}
