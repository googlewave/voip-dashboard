import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
  });

  if (!device || !device.sipUsername) {
    return new NextResponse('Device not found or not provisioned', { status: 404 });
  }

  const config = `<?xml version="1.0" encoding="UTF-8"?>
<flat-profile>
  <Proxy_1_>${device.sipDomain}</Proxy_1_>
  <Display_Name_1_>${device.name}</Display_Name_1_>
  <User_ID_1_>${device.sipUsername}</User_ID_1_>
  <Password_1_>${device.sipPassword}</Password_1_>
  <Auth_ID_1_>${device.sipUsername}</Auth_ID_1_>
  <Proxy_Port_1_>5060</Proxy_Port_1_>
  <Register_1_>Yes</Register_1_>
  <NAT_Mapping_Enable_1_>yes</NAT_Mapping_Enable_1_>
  <NAT_Keep_Alive_Enable_1_>yes</NAT_Keep_Alive_Enable_1_>
  <STUN_Enable_1_>yes</STUN_Enable_1_>
  <STUN_Server_1_>stun.twilio.com</STUN_Server_1_>
</flat-profile>`.trim();

  return new NextResponse(config, {
    headers: {
      'Content-Type': 'text/xml',
      'Content-Disposition': `attachment; filename="linksys.cfg"`,
    },
  });
}
