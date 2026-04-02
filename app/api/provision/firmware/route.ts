import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Return a simple "no firmware available" response
  // HT801 will be happy that the endpoint exists and responds
  const response = `<?xml version="1.0" encoding="UTF-8"?>
<firmware>
  <version>1.0.19.11</version>
  <message>No firmware update available</message>
</firmware>`;

  return new NextResponse(response, {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'public, max-age=3600', // 1 hour
    },
  });
}
