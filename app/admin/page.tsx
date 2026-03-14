import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect('/');
  if (user.email !== 'bliuser@gmail.com') redirect('/');

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
    orderBy: { id: 'desc' },
  });

  const devices = await prisma.device.findMany({
    select: {
      id: true,
      userId: true,
      name: true,
      sipUsername: true,
      adapterType: true,
      adapterIp: true,
    },
    orderBy: { id: 'desc' },
  });

  return <AdminClient users={users} devices={devices} />;
}
