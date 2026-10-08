// src/app/page.tsx

import type { Metadata } from 'next';
import { LandingContent } from './(auth)/landing-content';

export const metadata: Metadata = {
  title: 'RealCRM — CRM для малого бизнеса и мастеров',
  description:
    'CRM для мастеров, фрилансеров и малого бизнеса. Одна оплата, без подписок и лимитов. Данные хранятся у вас, работа офлайн.',
};

export default function LandingPage() {
  return <LandingContent />;
}