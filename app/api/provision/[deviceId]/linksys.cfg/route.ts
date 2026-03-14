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

    if (!device || !device.sipUsername) {
      return new NextResponse('Device not found or SIP not provisioned', {
        status: 404,
      });
    }

    const sipDomain = device.sipDomain ?? process.env.TWILIO_SIP_DOMAIN!;
    const displayName = device.name ?? device.sipUsername;

    const config = `<?xml version="1.0" encoding="UTF-8"?>
<flat-profile>
  <!-- Line 1 SIP Settings -->
  <Proxy_1_>${sipDomain}</Proxy_1_>
  <Outbound_Proxy_1_>${sipDomain}</Outbound_Proxy_1_>
  <Registrar_1_>${sipDomain}</Registrar_1_>
  <Display_Name_1_>${displayName}</Display_Name_1_>
  <User_ID_1_>${device.sipUsername}</User_ID_1_>
  <Password_1_>${device.sipPassword}</Password_1_>
  <Auth_ID_1_>${device.sipUsername}</Auth_ID_1_>

  <!-- Registration -->
  <Register_1_>Yes</Register_1_>
  <Register_Expires_1_>3600</Register_Expires_1_>

  <!-- Audio Codecs -->
  <Preferred_Codec_1_>G711u</Preferred_Codec_1_>
  <Use_Pref_Codec_Only_1_>No</Use_Pref_Codec_Only_1_>

  <!-- NAT Settings -->
  <NAT_Mapping_Enable_1_>Yes</NAT_Mapping_Enable_1_>
  <NAT_Keep_Alive_Enable_1_>Yes</NAT_Keep_Alive_Enable_1_>
  <NAT_Keep_Alive_Intvl_1_>20</NAT_Keep_Alive_Intvl_1_>

  <!-- SIP Transport -->
  <SIP_Transport_1_>TLS</SIP_Transport_1_>
  <SIP_Port_1_>5061</SIP_Port_1_>

  <!-- SRTP -->
  <SRTP_Method_1_>Secured</SRTP_Method_1_>
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
