import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import AdminDashboard from './AdminDashboard';

const ADMIN_EMAILS = ['bliuser@gmail.com', 'christophepoirrier@gmail.com'];

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  if (!ADMIN_EMAILS.includes(user.email ?? '')) redirect('/dashboard');

  const users = await prisma.user.findMany({
    orderBy: { id: 'desc' },
    select: {
      id: true,
      email: true,
      plan: true,
      twilioNumber: true,
      areaCode: true,
      stripeCustomerId: true,
      stripeSubId: true,
    },
  });

  const devices = await prisma.device.findMany({
    orderBy: { id: 'desc' },
  });

  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: 'asc' },
  });

  return (
    <AdminDashboard
      initialUsers={users.map(u => ({
        ...u,
        stripeSubscriptionId: u.stripeSubId || null,
      }))}
      initialDevices={devices.map(d => ({
        ...d,
        status: d.isOnline,
        quietHoursEnabled: d.quietHoursEnabled || false,
        quietHoursStart: d.quietHoursStart || null,
        quietHoursEnd: d.quietHoursEnd || null,
        usageCapEnabled: d.usageCapEnabled || false,
        usageCapMinutes: d.usageCapMinutes || null,
      }))}
      initialContacts={contacts.map(c => ({
        ...c,
        phone: c.phoneNumber || '',
        phone_number: c.phoneNumber,
        contact_type: c.contactType || 'phone_number',
        sip_username: c.sipUsername,
        friendship_id: c.friendshipId,
        friend_device_id: c.friendDeviceId,
        quickDialSlot: c.quickDialSlot,
        deviceId: c.deviceId,
      }))}
      adminUser={{ id: user.id, email: user.email ?? '' }}
    />
  );
}
