import { VoIPProvider, VoIPContact, CallLog } from './types';

export class TelnyxAdapter implements VoIPProvider {
  async provisionNumber(deviceId: string, areaCode = '415'): Promise<string> {
    throw new Error('Telnyx adapter not yet implemented');
  }

  async releaseNumber(phoneNumber: string): Promise<void> {
    throw new Error('Telnyx adapter not yet implemented');
  }

  async syncContacts(deviceId: string, contacts: VoIPContact[]): Promise<void> {
    throw new Error('Telnyx adapter not yet implemented');
  }

  async syncQuickDial(deviceId: string, quickDial: Record<number, VoIPContact>): Promise<void> {
    throw new Error('Telnyx adapter not yet implemented');
  }

  async getDeviceStatus(phoneNumber: string): Promise<'online' | 'offline'> {
    throw new Error('Telnyx adapter not yet implemented');
  }

  async handleInboundCall(from: string, to: string): Promise<string> {
    throw new Error('Telnyx adapter not yet implemented');
  }

  async getCallLogs(phoneNumber: string, limit = 50): Promise<CallLog[]> {
    throw new Error('Telnyx adapter not yet implemented');
  }
}
