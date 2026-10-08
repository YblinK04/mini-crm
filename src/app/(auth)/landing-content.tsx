'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Wallet,
  ArrowRight,
  Smartphone,
  Layers,
  Building2,
  HardDrive,
  History,
  type LucideIcon,
} from 'lucide-react';

interface Feature {
  id: string;
  icon: LucideIcon;
  title: string;
  text: string;
}

const CRM_FEATURES: Feature[] = [
  {
    id: 'feature-kanban',
    icon: Wallet,
    title: 'Финансовый канбан',
    text: 'Видите, сколько денег в работе на каждом этапе. Суммы считаются автоматически — не нужно ничего вводить руками.',
  },
  {
    id: 'feature-secure',
    icon: ShieldCheck,
    title: 'Данные не утекут',
    text: 'Даже если сотрудник уйдёт, клиентская база останется у вас. Каждое действие записывается — видно, кто что менял.',
  },
  {
    id: 'feature-custom-fields',
    icon: Layers,
    title: 'Настраивается под вас',
    text: 'Добавляйте свои поля: VIN-код для автосервиса, дату рождения для салона, ИНН для B2B. Без программиста.',
  },
  {
    id: 'feature-mobile',
    icon: Smartphone,
    title: 'Работает на телефоне',
    text: 'Ведите клиентов прямо с выезда, из зала или из кафе. Перетаскивайте сделки пальцем — так же удобно, как на компьютере.',
  },
  {
    id: 'feature-history',
    icon: History,
    title: 'История всех действий',
    text: 'Кто создал сделку, кто поменял бюджет, кто удалил контакт. Полная картина работы — без домыслов.',
  },
  {
    id: 'feature-offline',
    icon: HardDrive,
    title: 'Не зависит от интернета',
    text: 'Работает в подвале, в поле, на складе. Данные хранятся у вас, а не в чужом облаке — никто их не отключит и не заблокирует.',
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1 } },
};

export function LandingContent() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden text-foreground">
      <Header />
      <main className="flex-1">
        <HeroSection isMounted={isMounted} />
        <FeaturesSection isMounted={isMounted} />
      </main>
      <Footer />
    </div>
  );
}


function Header() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6 text-primary" aria-hidden="true" />
        <span className="font-bold text-xl tracking-tight">RealCRM</span>
      </div>
      <nav className="ml-auto flex gap-4 items-center">
        <Link
          href="/login"
          className="text-sm font-medium hover:text-primary transition-colors duration-200"
        >
          Войти
        </Link>
        <Button asChild size="sm" className="shadow-sm">
          <Link href="/login">Запустить систему</Link>
        </Button>
      </nav>
    </header>
  );
}


function HeroSection({ isMounted }: { isMounted: boolean }) {
  return (
    <section className="relative py-20 lg:py-32 px-4 overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-500 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-medium mb-6">
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          Данные хранятся только у вас
        </div>

        {isMounted ? (
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mb-6 max-w-5xl mx-auto leading-none text-foreground"
          >
            Управляйте продажами бизнеса
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
              Данные — только у вас
            </span>
          </motion.h1>
        ) : (
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mb-6 max-w-5xl mx-auto leading-none text-foreground">
            Управляйте продажами бизнеса
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
              Данные — только у вас
            </span>
          </h1>
        )}

        {isMounted ? (
          <motion.p
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-[800px] text-muted-foreground md:text-xl mb-10 leading-relaxed"
          >
            CRM для мастеров, фрилансеров и малого бизнеса. Одна оплата,
            без подписок и лимитов. Работает офлайн — в подвале, в поле,
            на складе.
          </motion.p>
        ) : (
          <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl mb-10 leading-relaxed">
            CRM для мастеров, фрилансеров и малого бизнеса. Одна оплата,
            без подписок и лимитов. Работает офлайн — в подвале, в поле,
            на складе.
          </p>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {isMounted ? (
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
            >
              <Button
                asChild
                size="lg"
                className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-200"
              >
                <Link href="/login" className="flex items-center gap-2">
                  Запустить систему
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </motion.div>
          ) : (
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 shadow-lg shadow-primary/20"
            >
              <Link href="/login" className="flex items-center gap-2">
                Запустить систему
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}


function FeaturesSection({ isMounted }: { isMounted: boolean }) {
  return (
    <section className="py-20 bg-muted/30 px-4 border-t">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
            Простая CRM для тех, кто работает с клиентами
          </h2>
          <p className="text-muted-foreground text-sm">
            Одна оплата. Без подписок, без лимитов, без привязки к чужим
            серверам.
          </p>
        </div>

        {isMounted ? (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {CRM_FEATURES.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} animated />
            ))}
          </motion.div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {CRM_FEATURES.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  animated = false,
}: {
  feature: Feature;
  animated?: boolean;
}) {
  const Icon = feature.icon;

  const content = (
    <>
      <div className="p-3 bg-primary/10 rounded-xl mb-4 text-primary">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold mb-2 text-foreground">
        {feature.title}
      </h3>
      <p className="text-muted-foreground text-xs leading-relaxed">
        {feature.text}
      </p>
    </>
  );

  if (animated) {
    return (
      <motion.div
        variants={fadeInUp}
        whileHover={{ y: -4, scale: 1.01 }}
        className="flex flex-col items-start p-8 bg-background rounded-2xl border shadow-sm hover:border-primary/40 transition-all duration-200 text-left"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-start p-8 bg-background rounded-2xl border shadow-sm text-left">
      {content}
    </div>
  );
}


function Footer() {
  return (
    <footer className="py-10 border-t text-center px-4 bg-muted/20">
      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} RealCRM. Простая CRM для малого бизнеса и
        мастеров.
      </p>
    </footer>
  );
}