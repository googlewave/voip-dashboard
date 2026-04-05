export type NetworkTestProbe = {
  ok: boolean;
  status: number;
  durationMs: number;
  looksLikeProvisioning: boolean;
  contentType?: string | null;
  error?: string | null;
};

export type NetworkTestOutcome = 'ready' | 'router-blocking' | 'wrong-url' | 'server-issue' | 'mixed-failure' | 'unknown';

export type NetworkTestAnalysis = {
  outcome: NetworkTestOutcome;
  severity: 'success' | 'warning' | 'error';
  title: string;
  summary: string;
  actions: string[];
};

const ROUTER_ACTIONS = [
  'Turn off router security filtering, parental controls, ad blocking, or web protection for the adapter network and rerun the test.',
  'Set router DNS to 1.1.1.1 or 8.8.8.8, then rerun the test.',
  'Avoid guest Wi-Fi or client isolation; keep the adapter on the main LAN.',
  'If calls fail after provisioning, disable SIP ALG or SIP Passthrough on the router.',
  'If the router sits behind another router or modem/router combo, use bridge/AP mode to avoid double NAT.',
];

export function analyzeNetworkTest(browser: NetworkTestProbe, server: NetworkTestProbe): NetworkTestAnalysis {
  const browserProvisioningReady = browser.ok && browser.looksLikeProvisioning;
  const serverProvisioningReady = server.ok && server.looksLikeProvisioning;
  const browserReturnedWrongContent = browser.ok && !browser.looksLikeProvisioning;
  const serverReturnedWrongContent = server.ok && !server.looksLikeProvisioning;

  if (browserProvisioningReady && serverProvisioningReady) {
    return {
      outcome: 'ready',
      severity: 'success',
      title: 'Network ready for provisioning',
      summary: 'The provisioning URL loaded successfully from this customer network and our server validation also passed. Continue with the adapter setup.',
      actions: [
        'Paste the provisioning URL into the adapter and reboot or resync it.',
        'If the adapter still fails later, treat it as a SIP/NAT issue and disable SIP ALG on the router.',
      ],
    };
  }

  if (browserReturnedWrongContent || serverReturnedWrongContent) {
    return {
      outcome: 'wrong-url',
      severity: 'error',
      title: 'Provisioning URL is not returning a device config',
      summary: 'The request returned a response, but it does not look like a Linksys or Grandstream provisioning profile. The device ID, route, or copied URL is likely wrong.',
      actions: [
        'Copy the provisioning URL again from the setup guide instead of reusing an older saved URL.',
        'Make sure the URL path includes the correct device ID and adapter type.',
        'If this still fails, check the admin diagnostics panel for recent provisioning errors on that device.',
      ],
    };
  }

  if (!browser.ok && serverProvisioningReady) {
    return {
      outcome: 'router-blocking',
      severity: 'warning',
      title: 'Customer router is likely blocking or altering the request',
      summary: 'Our server can serve the provisioning profile, but the browser on this network could not fetch it cleanly. That usually points to router DNS, security filtering, or LAN policy issues.',
      actions: ROUTER_ACTIONS,
    };
  }

  if (browserProvisioningReady && !server.ok) {
    return {
      outcome: 'server-issue',
      severity: 'error',
      title: 'Provisioning endpoint needs backend review',
      summary: 'The browser reached the URL, but the server-side validation did not pass cleanly. This usually means the route or backend response needs review rather than the customer network.',
      actions: [
        'Open the admin diagnostics panel and inspect the latest provisioning status for this device.',
        'Confirm the device exists and has a valid provisioning route.',
        'Retry after the current deployment finishes if the code was just updated.',
      ],
    };
  }

  if (!browser.ok && !server.ok) {
    return {
      outcome: 'mixed-failure',
      severity: 'error',
      title: 'Provisioning failed on both network and backend validation',
      summary: 'Both checks failed. This can mean the URL is stale or malformed, or there is an active backend issue on the provisioning route.',
      actions: [
        'Copy a fresh provisioning URL from the setup guide.',
        'If the URL is correct, inspect the admin diagnostics panel for the device before troubleshooting the router.',
        'If the backend looks healthy, then apply the router changes and rerun the test.',
      ],
    };
  }

  return {
    outcome: 'unknown',
    severity: 'warning',
    title: 'Network test finished with an inconclusive result',
    summary: 'The test completed, but the outcome did not clearly match a known router or backend pattern.',
    actions: [
      'Rerun the test once from the same network as the adapter.',
      'If it remains inconclusive, compare the browser and server previews and use the admin diagnostics panel for the device.',
    ],
  };
}