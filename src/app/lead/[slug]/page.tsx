
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { LeadForm } from '@/components/public/Lead-form';

export const dynamic = 'force-dynamic';
const SLUG_PATTERN = /^[a-z0-9-]{1,64}$/i;

async function getOrganization(slug: string) {
  if (!SLUG_PATTERN.test(slug)) return null;

  try {
    return await prisma.organization.findUnique({
      where: { publicSlug: slug.toLowerCase() },
      select: { name: true, isActive: true },
    });
  } catch (error) {
    console.error('[PUBLIC_LEAD_PAGE]', { slug, error });
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org || !org.isActive) {
    return {
      title: 'Форма недоступна',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Оставить заявку — ${org.name}`,
    description: 'Оставьте свои контакты, и мы свяжемся с вами',
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false },
    },
    referrer: 'no-referrer',
  };
}

export default async function PublicLeadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org || !org.isActive) notFound();

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md space-y-6 bg-background p-6 rounded-2xl shadow-lg border border-muted-foreground/10">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight break-words">
            {org.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Оставьте заявку, и мы свяжемся с вами
          </p>
        </div>

        <LeadForm slug={slug.toLowerCase()} />
      </div>
    </div>
  );
}