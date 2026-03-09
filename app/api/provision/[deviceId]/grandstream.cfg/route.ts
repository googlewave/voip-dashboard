import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { deviceId: string } }
) {
  const device = await prisma.device.findUnique({
    where: { id: params.deviceId },
  });

  if (!device || !device.sipUsername) {
    return new NextResponse('Device not found or not provisioned', { status: 404 });
  }

  const config = `
P47 = ${device.sipDomain}
P48 = ${device.sipDomain}
P35 = ${device.sipUsername}
P36 = ${device.sipUsername}
P34 = ${device.sipPassword}
P3 = ${device.sipDomain}
P52 = 5060
P53 = 5060
P50 = 1
P51 = stun.twilio.com
P54 = 3478
P84 = 0
P85 = 0
P706 = 1
P27 = ${device.name}
`.trim();

  return new NextResponse(config, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="grandstream.cfg"`,
    },
  });
}
