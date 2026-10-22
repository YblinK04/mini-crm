import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TodayView } from '@/components/tasks/TodayView';
import { CalendarView } from '@/components/tasks/CalendarView';
import { CalendarDays, ListTodo } from 'lucide-react';

export const metadata = {
  title: 'Задачи',
};

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/today')}`);
  }
  if (!session.user.organizationId) {
    redirect('/onboarding');
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Планер</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Управляйте задачи и планируйте свой график.
        </p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
          <TabsTrigger value="list" className="gap-2">
            <ListTodo className="h-4 w-4" aria-hidden="true" /> Срочные
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarDays className="h-4 w-4" aria-hidden="true" /> Календарь
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="list"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <TodayView />
        </TabsContent>

        <TabsContent
          value="calendar"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <CalendarView />
        </TabsContent>
      </Tabs>
    </div>
  );
}