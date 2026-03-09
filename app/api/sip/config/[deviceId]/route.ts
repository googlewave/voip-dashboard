import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: { deviceId: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const device = await prisma.device.findFirst({
    where: { id: params.deviceId, userId: user.id },
  });

  if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  if (!device.sipUsername) return NextResponse.json({ error: 'No SIP credentials provisioned yet' }, { status: 400 });

  const config = {
    adapterType: device.adapterType,
    sipServer: device.sipDomain,
    sipUsername: device.sipUsername,
    sipPassword: device.sipPassword,
    instructions: device.adapterType === 'grandstream'
      ? [
          `Open browser → http://${device.adapterIp || '192.168.x.x'}`,
          'Login with admin / admin',
          'Click the FXS Port tab',
          `SIP Server: ${device.sipDomain}`,
          `SIP User ID: ${device.sipUsername}`,
          `Authenticate ID: ${device.sipUsername}`,
          `Authenticate Password: ${device.sipPassword}`,
          'NAT Traversal: Keep-Alive',
          'STUN Server: stun.twilio.com / Port: 3478',
          'Click Update then Reboot',
          'Check Status tab — should show Registered ✓',
        ]
      : [
          `Open browser → http://${device.adapterIp || '192.168.x.x'}`,
          'Login with admin / admin',
          'Click the Line 1 tab',
          `Proxy: ${device.sipDomain}`,
          `Display Name: ${device.name}`,
          `User ID: ${device.sipUsername}`,
          `Password: ${device.sipPassword}`,
          'NAT Mapping Enable: yes',
          'STUN Enable: yes / STUN Server: stun.twilio.com',
          'Click Save Settings then reboot',
        ],
  };

  return NextResponse.json(config);
}
