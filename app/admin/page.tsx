import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import AdminClient from './AdminClient';

const ADMIN_EMAILS = ['bliuser@gmail.com', 'christophepoirrier@gmail.com'];

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect('/');
  if (!ADMIN_EMAILS.includes(user.email ?? '')) redirect('/');

  const users = await prisma.user.findMany({
    orderBy: { id: 'desc' },
    select: {
      id: true,
      email: true,
      plan: true,
      twilioNumber: true,
      areaCode: true,
    },
  });

  const devices = await prisma.device.findMany({
    orderBy: { id: 'desc' },
    select: {
      id: true,
      userId: true,
      name: true,
      sipUsername: true,
      adapterType: true,
      adapterIp: true,
      isOnline: true,
    },
  });

  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      userId: true,
      deviceId: true,
      name: true,
      phoneNumber: true,
      quickDialSlot: true,
    },
  });

  return <AdminClient users={users} devices={devices} contacts={contacts} />;
}
