'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type BrowserTestResult = {
  ok: boolean;
  status: number;
  contentType: string | null;
  durationMs: number;
  looksLikeProvisioning: boolean;
  preview: string;
  error?: string;
};

type ServerTestResult = {
  ok: boolean;
  checkedAt: string;
  durationMs: number;
  targetUrl: string;
  status: number;
  statusText: string;
  contentType: string | null;
  matchedPath: string | null;
  cacheStatus: string | null;
  looksLikeProvisioning: boolean;
  preview: string;
  error?: string;
};

type ClientInfo = {
  checkedAt: string;
  origin: string;
  host: string;
  clientIp: string;
  userAgent: string;
  online: boolean;
};

function resultTone(ok: boolean) {
  return ok
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : 'border-red-200 bg-red-50 text-red-900';
}

export default function NetworkTestPage() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState('');
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [browserResult, setBrowserResult] = useState<BrowserTestResult | null>(null);
  const [serverResult, setServerResult] = useState<ServerTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [browserOnline, setBrowserOnline] = useState(true);

  useEffect(() => {
    const initialUrl = searchParams.get('url');
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    setBrowserOnline(window.navigator.onLine);
    fetch('/api/network-test', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setClientInfo(data))
      .catch(() => {
        // Keep page usable even if the info call fails.
      });
  }, []);

  const runTest = async () => {
    if (!url.trim()) {
      setError('Enter the provisioning URL you want to test.');
      return;
    }

    setLoading(true);
    setError(null);
    setBrowserResult(null);
    setServerResult(null);

    const normalizedUrl = new URL(url, window.location.origin).toString();

    const browserPromise = (async (): Promise<BrowserTestResult> => {
      const startedAt = performance.now();
      try {
        const response = await fetch(normalizedUrl, { cache: 'no-store' });
        const preview = await response.text();
        return {
          ok: response.ok,
          status: response.status,
          contentType: response.headers.get('content-type'),
          durationMs: Math.round(performance.now() - startedAt),
          looksLikeProvisioning: /<flat-profile>|<gs_provision|Provisioning failed|Device not found/i.test(preview),
          preview: preview.slice(0, 280),
        };
      } catch (browserError: any) {
        return {
          ok: false,
          status: 0,
          contentType: null,
          durationMs: Math.round(performance.now() - startedAt),
          looksLikeProvisioning: false,
          preview: '',
          error: browserError?.message || 'Browser fetch failed',
        };
      }
    })();

    const serverPromise = fetch('/api/network-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: normalizedUrl }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          checkedAt: new Date().toISOString(),
          durationMs: 0,
          targetUrl: normalizedUrl,
          status: res.status,
          statusText: res.statusText,
          contentType: null,
          matchedPath: null,
          cacheStatus: null,
          looksLikeProvisioning: false,
          preview: '',
          error: data.error || 'Server-side test failed',
        } satisfies ServerTestResult;
      }
      return data as ServerTestResult;
    });

    const [browser, server] = await Promise.all([browserPromise, serverPromise]);
    setBrowserResult(browser);
    setServerResult(server);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f1ede3_100%)] px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-[2rem] border-2 border-stone-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-stone-400">Ring Ring Network Test</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-stone-900">Test provisioning from the customer&apos;s current router</h1>
          <p className="mt-3 max-w-3xl text-sm text-stone-600">
            Run this page from the same Wi-Fi or wired network as the adapter. The browser test uses the customer&apos;s real network path, and the server test confirms the provisioning URL is valid on our side.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://voip-dashboard-sigma.vercel.app/api/provision/auto/DEVICE_ID?type=linksys"
              className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-900 outline-none focus:border-[#C4531A]"
            />
            <button
              onClick={runTest}
              disabled={loading}
              className="rounded-2xl bg-[#C4531A] px-6 py-4 text-sm font-black text-white transition hover:bg-[#a84313] disabled:opacity-50"
            >
              {loading ? 'Running…' : 'Run Test'}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-900">
            Safe to run: this performs the same GET request the adapter would make. On first run it may also create SIP credentials if the device has not been provisioned yet.
          </div>
        </section>

        {clientInfo && (
          <section className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'Checked At', value: new Date(clientInfo.checkedAt).toLocaleString() },
              { label: 'Server Sees IP', value: clientInfo.clientIp },
              { label: 'Origin', value: clientInfo.origin },
              { label: 'Browser Online', value: browserOnline ? 'Yes' : 'No' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">{item.label}</p>
                <p className="mt-2 break-all text-sm font-semibold text-stone-900">{item.value}</p>
              </div>
            ))}
          </section>
        )}

        <section className="grid gap-6 md:grid-cols-2">
          <div className={`rounded-[2rem] border-2 p-6 ${browserResult ? resultTone(browserResult.ok) : 'border-stone-200 bg-white text-stone-900'}`}>
            <h2 className="text-xl font-black">Browser Test</h2>
            <p className="mt-2 text-sm opacity-80">Runs in this browser on the current customer network.</p>
            {browserResult ? (
              <div className="mt-5 space-y-3 text-sm">
                <p><strong>Status:</strong> {browserResult.status || 'Request failed'}</p>
                <p><strong>Content-Type:</strong> {browserResult.contentType || 'None'}</p>
                <p><strong>Latency:</strong> {browserResult.durationMs} ms</p>
                <p><strong>Looks like provisioning:</strong> {browserResult.looksLikeProvisioning ? 'Yes' : 'No'}</p>
                {browserResult.error && <p><strong>Error:</strong> {browserResult.error}</p>}
                <pre className="overflow-x-auto rounded-2xl bg-white/70 p-4 text-xs text-stone-700">{browserResult.preview || 'No response body preview available.'}</pre>
              </div>
            ) : (
              <p className="mt-5 text-sm text-stone-500">No browser test run yet.</p>
            )}
          </div>

          <div className={`rounded-[2rem] border-2 p-6 ${serverResult ? resultTone(serverResult.ok) : 'border-stone-200 bg-white text-stone-900'}`}>
            <h2 className="text-xl font-black">Server Validation</h2>
            <p className="mt-2 text-sm opacity-80">Confirms the URL is valid and our edge can serve it correctly.</p>
            {serverResult ? (
              <div className="mt-5 space-y-3 text-sm">
                <p><strong>Status:</strong> {serverResult.status} {serverResult.statusText}</p>
                <p><strong>Content-Type:</strong> {serverResult.contentType || 'None'}</p>
                <p><strong>Latency:</strong> {serverResult.durationMs} ms</p>
                <p><strong>Matched Path:</strong> {serverResult.matchedPath || 'Unknown'}</p>
                <p><strong>Looks like provisioning:</strong> {serverResult.looksLikeProvisioning ? 'Yes' : 'No'}</p>
                {serverResult.error && <p><strong>Error:</strong> {serverResult.error}</p>}
                <pre className="overflow-x-auto rounded-2xl bg-white/70 p-4 text-xs text-stone-700">{serverResult.preview || 'No response body preview available.'}</pre>
              </div>
            ) : (
              <p className="mt-5 text-sm text-stone-500">No server-side validation run yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}