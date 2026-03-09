import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ deviceId: string }> }) {
	const { deviceId } = await params;
	const user = await getUser();
	if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const device = await prisma.device.findFirst({ where: { id: deviceId, userId: user.id } });
	if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 });
	if (!device.sipUsername || !device.sipPassword || !device.sipDomain) {
		return NextResponse.json({ error: 'No SIP credentials provisioned yet' }, { status: 400 });
	}

	const cfgLines = [
		`# Generated Linksys config for device ${device.id}`,
		`Proxy=${device.sipDomain}`,
		`DisplayName=${device.name}`,
		`UserID=${device.sipUsername}`,
		`Password=${device.sipPassword}`,
		`STUNServer=stun.twilio.com:3478`,
	];

	const body = cfgLines.join('\n');
	return new NextResponse(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
