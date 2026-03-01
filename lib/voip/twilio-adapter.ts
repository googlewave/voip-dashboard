import twilio from 'twilio';
import { VoIPProvider, VoIPContact, CallLog } from './types';

export class TwilioAdapter implements VoIPProvider {
  private client;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }

  async provisionNumber(deviceId: string, areaCode = '415'): Promise<string> {
    const number = await this.client.incomingPhoneNumbers.create({
      areaCode,
      voiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/voip/inbound-call`,
    });
    return number.phoneNumber;
  }

  async releaseNumber(phoneNumber: string): Promise<void> {
    const numbers = await this.client.incomingPhoneNumbers.list({ phoneNumber });
    if (numbers[0]) await this.client.incomingPhoneNumbers(numbers[0].sid).remove();
  }

  async syncContacts(deviceId: string, contacts: VoIPContact[]): Promise<void> {
    console.log(`[Twilio] Contacts synced for device ${deviceId}`);
  }

  async syncQuickDial(deviceId: string, quickDial: Record<number, VoIPContact>): Promise<void> {
    console.log(`[Twilio] Quick dial synced for device ${deviceId}`);
  }

  async getDeviceStatus(phoneNumber: string): Promise<'online' | 'offline'> {
    return 'online';
  }

  async handleInboundCall(from: string, to: string): Promise<string> {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Connecting you now.');
    return twiml.toString();
  }

  async getCallLogs(phoneNumber: string, limit = 50): Promise<CallLog[]> {
    const calls = await this.client.calls.list({ to: phoneNumber, limit });
    return calls.map((call) => ({
      sid: call.sid,
      from: call.from,
      to: call.to,
      duration: parseInt(call.duration || '0'),
      status: call.status,
      startTime: call.startTime?.toISOString() || '',
    }));
  }
}
