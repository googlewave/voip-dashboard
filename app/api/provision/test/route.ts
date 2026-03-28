import { NextRequest, NextResponse } from 'next/server';

/**
 * Minimal test provisioning endpoint.
 * No DB lookup, no comments in XML, explicit Content-Length.
 * Used to debug why HT801 fails to apply provisioned config.
 */
export async function GET(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const ts = new Date().toISOString();
  
  // Log every request for debugging
  console.log(`[PROVISION-TEST] ${ts} UA="${userAgent}" URL="${req.url}"`);

  // Minimal Grandstream config — NO comments, NO whitespace bloat
  const config = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gs_provision version="1">',
    '<config version="1">',
    '<P47>ringringclub.sip.twilio.com</P47>',
    '<P48>5060</P48>',
    '<P35>sip_20b40a_1773796436200</P35>',
    '<P36>sip_20b40a_1773796436200</P36>',
    '<P34>TestPass123!</P34>',
    '<P3>testdevice2-auto</P3>',
    '<P271>1</P271>',
    '<P32>60</P32>',
    '<P52>2</P52>',
    '<P76>20</P76>',
    '<P130>1</P130>',
    '<P278>{ x+ }</P278>',
    '<P331>+</P331>',
    '<P258>1</P258>',
    '<P183>0</P183>',
    '</config>',
    '</gs_provision>',
  ].join('\n');

  const body = Buffer.from(config, 'utf-8');

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': body.length.toString(),
      'Cache-Control': 'no-cache, no-store',
      'Connection': 'close',
    },
  });
}
