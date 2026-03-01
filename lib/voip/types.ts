export type VoIPProviderName = 'twilio' | 'telnyx' | 'freeswitch';

export type DevicePlan = 'pay_per_min' | 'unlimited';

export interface VoIPContact {
  name: string;
  phone: string;
}

export interface CallLog {
  sid: string;
  from: string;
  to: string;
  duration: number;
  status: string;
  startTime: string;
}

export interface VoIPProvider {
  provisionNumber(deviceId: string, areaCode?: string): Promise<string>;
  releaseNumber(phoneNumber: string): Promise<void>;
  syncContacts(deviceId: string, contacts: VoIPContact[]): Promise<void>;
  syncQuickDial(deviceId: string, quickDial: Record<number, VoIPContact>): Promise<void>;
  getDeviceStatus(phoneNumber: string): Promise<'online' | 'offline'>;
  handleInboundCall(from: string, to: string): Promise<string>;
  getCallLogs(phoneNumber: string, limit?: number): Promise<CallLog[]>;
}
