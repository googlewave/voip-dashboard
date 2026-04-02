import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      select: {
        sipUsername: true,
        sipPassword: true,
        sipDomain: true,
        name: true,
      },
    });

    if (!device?.sipUsername) {
      return new NextResponse('Device not found or SIP not provisioned', { status: 404 });
    }

    const contacts = await prisma.contact.findMany({
      where: { deviceId },
      orderBy: { quickDialSlot: 'asc' },
      select: { name: true, phoneNumber: true, quickDialSlot: true },
    });

    const rawDomain = device.sipDomain ?? process.env.TWILIO_SIP_DOMAIN!;
    const sipDomain = rawDomain.replace(/:(\d+)$/, '');
    const sipDomainWithPort = `${sipDomain}:5060`;
    const displayName = device.name ?? device.sipUsername;

    // Dial plan: permissive — call validation happens at Twilio webhook level
    const dialPlan = `([2-9]xxxxxxxxx|1[2-9]xxxxxxxxx|011x+|911|933)`;

    const speedDialEntries = Array.from({ length: 9 }, (_, i) => {
      const slot = i + 1;
      const contact = contacts.find((c) => c.quickDialSlot === slot);
      return contact && contact.phoneNumber
        ? `  <Speed_Dial_${slot}_>${contact.name}, ${contact.phoneNumber}</Speed_Dial_${slot}_>`
        : `  <Speed_Dial_${slot}_></Speed_Dial_${slot}_>`;
    }).join('\n');

    const config = `<?xml version="1.0" encoding="UTF-8"?>
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

    return new NextResponse(config, {
      headers: {
        'Content-Type': 'text/xml',
        'Content-Disposition': 'attachment; filename="linksys.cfg"',
      },
    });
  } catch (error: any) {
    console.error('Provision error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
