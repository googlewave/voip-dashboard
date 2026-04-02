/**
 * Cloudflare Worker: Provision Proxy
 * 
 * Proxies HT801 provisioning requests to the Vercel backend.
 * Cloudflare supports older TLS (1.0/1.1) that the HT801 firmware 1.0.19.11 needs,
 * while Vercel requires TLS 1.2+ which the old firmware can't do.
 *
 * HT801 Config Server Path: https://<worker-subdomain>.workers.dev/
 * The device requests: /cfg<MAC>.xml
 * This worker forwards to: https://voip-dashboard-sigma.vercel.app/api/provision/mac/cfg<MAC>.xml
 */

const BACKEND_URL = 'https://voip-dashboard-sigma.vercel.app';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Log request for debugging
    console.log(`[provision-proxy] ${request.method} ${path} UA=${request.headers.get('user-agent')}`);

    // Match cfg<MAC>.xml pattern (Grandstream auto-provisioning request)
    const cfgMatch = path.match(/\/(cfg[a-fA-F0-9]{12}\.xml)$/);
    if (cfgMatch) {
      const filename = cfgMatch[1];
      const backendUrl = `${BACKEND_URL}/api/provision/mac/${filename}`;

      try {
        const response = await fetch(backendUrl, {
          headers: {
            'User-Agent': request.headers.get('user-agent') || 'provision-proxy',
          },
        });

        const body = await response.text();

        return new Response(body, {
          status: response.status,
          headers: {
            'Content-Type': 'text/xml',
            'Content-Length': new TextEncoder().encode(body).length.toString(),
            'Cache-Control': 'no-cache, no-store',
            'Connection': 'close',
          },
        });
      } catch (error) {
        console.error(`[provision-proxy] Backend fetch failed: ${error.message}`);
        return new Response('Backend unavailable', { status: 502 });
      }
    }

    // Health check
    if (path === '/' || path === '/health') {
      return new Response('provision-proxy OK', { status: 200 });
    }

    return new Response('Not found', { status: 404 });
  },
};
