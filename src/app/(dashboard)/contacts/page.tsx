
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContactsList } from '@/components/contacts/contacts-list';

export const metadata = {
  title: 'Клиенты',
};

const MAX_CONTACTS = 200;

export default async function ContactsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/contacts')}`);
  }

  const { organizationId } = session.user;

  const contacts = await prisma.contact.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: MAX_CONTACTS,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      telegramUsername: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { deals: true } },
    },
  });

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Клиенты</h1>
        <p className="text-sm text-muted-foreground">
          База контактов вашей организации.
        </p>
      </div>

      <ContactsList initialContacts={contacts} />
    </div>
  );
}