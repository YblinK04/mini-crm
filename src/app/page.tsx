'use client';

import { useState, useEffect } from 'react';
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
  MessageSquareCode
} from 'lucide-react';


const CRM_FEATURES = [
  {
    id: "feature-kanban",
    icon: Wallet,
    title: "Финансовый Канбан",
    text: "Интерактивная доска автоматически суммирует и отображает объём денег на каждом этапе воронки в копейках с абсолютной точностью. Вы всегда видите, где зависла выручка."
  },
  {
    id: "feature-dlp",
    icon: ShieldCheck,
    title: "Защита от утечки базы (DLP)",
    text: "Строгое разграничение прав доступа (OWNER, ADMIN, MANAGER). Менеджеры ведут клиентов, но полностью заблокированы от выгрузки базы контактов. Каждое действие пишется в аудит-лог."
  },
  {
    id: "feature-json",
    icon: Layers,
    title: "Конструктор кастомных полей",
    text: "CRM подстраивается под специфику вашей ниши. Добавляйте любые плоские текстовые поля к контактам клиентов: от ИНН компании до даты рождения директора."
  },
  {
    id: "feature-touch",
    icon: Smartphone,
    title: "Mobile-First Touch Сенсоры",
    text: "Интегрированные Pointer и Touch фильтры для dnd-kit. Менеджеры на выезде или мастера в залах могут комфортно перетаскивать сделки прямо со смартфонов."
  },
  {
    id: "feature-logs",
    icon: MessageSquareCode,
    title: "Локальный аудит безопасности",
    text: "Система фиксирует IP-адреса, User-Agent и метаданные каждого критического действия персонала. Полная прозрачность работы команды на локальном сервере."
  },
  {
    id: "feature-onpremise",
    icon: HardDrive,
    title: "100% Автономная экосистема",
    text: "Разворачивается внутри вашей локальной сети на базе PostgreSQL. Полная независимость от облачных провайдеров, санкций и сбоев глобального интернета."
  }
];

export default function LandingPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: isMounted ? 1 : 0, y: isMounted ? 0 : 20 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden text-foreground">
   
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
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

      <main className="flex-1">
       
        <section className="relative py-20 lg:py-32 px-4 overflow-hidden">
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20 pointer-events-none">
             <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary rounded-full blur-[120px]" />
             <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-500 rounded-full blur-[120px]" />
          </div>

          <div className="container mx-auto text-center">
                        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-medium mb-6">
              <HardDrive className="w-3.5 h-3.5" /> 100% Автономная On-Premise CRM система
            </div>
            {isMounted ? (
              <motion.h1 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mb-6 max-w-5xl mx-auto leading-none text-foreground"
              >
                Управляйте продажами бизнеса <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
                 на собственном локальном сервере
                </span>
              </motion.h1>
            ) : (
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mb-6 max-w-5xl mx-auto leading-none text-foreground">
                Управляйте продажами бизнеса <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
                 на собственном локальном сервере
                </span>
              </h1>
            )}
            
            {isMounted ? (
              <motion.p 
                initial="initial"
                animate="animate"
                variants={fadeIn}
                transition={{ delay: 0.2 }}
                className="mx-auto max-w-[800px] text-muted-foreground md:text-xl mb-10 leading-relaxed"
              >
                Конструктор воронки под любую нишу: от барбершопа до автосервиса. Полный контроль бюджетов, защита клиентской базы от кражи и моментальный оффлайн-интерфейс. Данные принадлежат только вам.
              </motion.p>
            ) : (
              <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl mb-10 leading-relaxed">
                Конструктор воронки под любую нишу: от барбершопа до автосервиса. Полный контроль бюджетов, защита клиентской базы от кражи и моментальный оффлайн-интерфейс. Данные принадлежат только вам.
              </p>
            )}

            {isMounted ? (
              <motion.div 
                initial="initial"
                animate="animate"
                variants={fadeIn}
                transition={{ delay: 0.3 }}
                className="flex justify-center gap-4"
              >
                <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-200">
                  <Link href="/login" className="flex items-center gap-2">
                    Открыть воронку продаж <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            ) : (
              <div className="flex justify-center gap-4">
                <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
                  <Link href="/login" className="flex items-center gap-2">
                    Открыть воронку продаж <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="py-20 bg-muted/30 px-4 border-t">
          <div className="container mx-auto">
            
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
                Разработано для защиты и масштабирования бизнеса
              </h2>
              <p className="text-muted-foreground text-sm">
                Никаких ежемесячных подписок. Один раз установили — пользуетесь всей командой бесплатно.
              </p>
            </div>

            {isMounted ? (
              <motion.div 
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: "-100px" }}
                className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
              >
                {CRM_FEATURES.map((feature) => (
                  <motion.div 
                    key={feature.id} 
                    variants={fadeIn}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="flex flex-col items-start p-8 bg-background rounded-2xl border shadow-sm hover:border-primary/40 transition-all duration-200 text-left"
                  >
                    <div className="p-3 bg-primary/10 rounded-xl mb-4 text-primary">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{feature.text}</p>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {CRM_FEATURES.map((feature) => (
                  <div 
                    key={feature.id}
                    className="flex flex-col items-start p-8 bg-background rounded-2xl border shadow-sm text-left"
                  >
                    <div className="p-3 bg-primary/10 rounded-xl mb-4 text-primary">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{feature.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="py-10 border-t text-center px-4 bg-muted/20">
        <p className="text-xs text-muted-foreground">
          © 2026 RealCRM. Локальная безопасность и автоматизация коммерческих продаж.
        </p>
      </footer>
    </div>
  );
}
