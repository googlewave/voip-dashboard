import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Log the exact request the HT801 makes
  const log = {
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent'),
    host: req.headers.get('host'),
    allHeaders: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString(),
  };

  console.log('=== HT801 Debug Request ===');
  console.log(JSON.stringify(log, null, 2));

  // Return a simple XML response for testing
  const testConfig = `<?xml version="1.0" encoding="UTF-8"?>
<gs_provision version="1">
  <config version="1">
    <P47>ringringclub.sip.twilio.com</P47>
    <P48>5060</P48>
    <P35>sip_20b40a_1773796436200</P35>
    <P36>sip_20b40a_1773796436200</P36>
    <P34>.6gw6m7lz59wA1!</P34>
    <P3>testdevice2</P3>
    <P271>1</P271>
    <P32>60</P32>
  </config>
</gs_provision>`;

  return new NextResponse(testConfig, {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'no-cache',
    },
  });
}
