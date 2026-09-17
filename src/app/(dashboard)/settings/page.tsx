import { SettingsForm } from '@/components/settings/SettingsForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pt-10 px-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground">Персонализируйте ваш рабочий профиль</p>
      </div>

      <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-md ring-1 ring-border/50">
        <CardHeader>
          <CardTitle>Публичный профиль</CardTitle>
          <CardDescription>Это имя будет отображаться в чатах и задачах проектов</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm />
        </CardContent>
      </Card>
    </div>
  );
}