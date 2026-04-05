import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type',
};

export function withCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export function jsonWithCors(body: unknown, init?: ResponseInit) {
  return withCors(NextResponse.json(body, init));
}

export function corsPreflight() {
  return withCors(new NextResponse(null, { status: 204 }));
}