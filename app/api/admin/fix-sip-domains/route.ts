import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Admin endpoint to check and fix device SIP domains
 * Ensures all devices point to the correct Twilio SIP domain
 */
export async function POST() {
  try {
    const correctDomain = process.env.TWILIO_SIP_DOMAIN || 'ringringclub.sip.twilio.com';
    
    // Get all devices with SIP credentials
    const devices = await prisma.device.findMany({
      where: { sipUsername: { not: null } },
      select: { 
        id: true, 
        name: true, 
        sipUsername: true, 
        sipDomain: true,
        userId: true,
      },
    });

    const results = [];
    let fixedCount = 0;

    for (const device of devices) {
      const status = {
        id: device.id,
        name: device.name,
        sipUsername: device.sipUsername,
        currentDomain: device.sipDomain,
        correctDomain,
        needsFix: device.sipDomain !== correctDomain,
      };

      if (status.needsFix) {
        await prisma.device.update({
          where: { id: device.id },
          data: { sipDomain: correctDomain },
        });
        fixedCount++;
        (status as any).fixed = true;
      }

      results.push(status);
    }

    return NextResponse.json({ 
      success: true, 
      correctDomain,
      totalDevices: devices.length,
      fixedCount,
      devices: results,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * GET: Just check device domains without fixing
 */
export async function GET() {
  try {
    const correctDomain = process.env.TWILIO_SIP_DOMAIN || 'ringringclub.sip.twilio.com';
    
    const devices = await prisma.device.findMany({
      select: { 
        id: true, 
        name: true, 
        sipUsername: true, 
        sipDomain: true,
        userId: true,
      },
    });

    return NextResponse.json({ 
      correctDomain,
      devices: devices.map(d => ({
        id: d.id,
        name: d.name,
        sipUsername: d.sipUsername,
        sipDomain: d.sipDomain,
        needsFix: d.sipDomain !== correctDomain,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
