 import { VoIPProvider } from './types';
import { TwilioAdapter } from './twilio-adapter';
import { TelnyxAdapter } from './telnyx-adapter';

export function getProviderForDevice(providerName: string): VoIPProvider {
  switch (providerName) {
    case 'twilio':
      return new TwilioAdapter();
    case 'telnyx':
      return new TelnyxAdapter();
    default:
      throw new Error(`Unknown VoIP provider: ${providerName}`);
  }
}

export function getDefaultProvider(): VoIPProvider {
  return getProviderForDevice(process.env.VOIP_PROVIDER || 'twilio');
}
