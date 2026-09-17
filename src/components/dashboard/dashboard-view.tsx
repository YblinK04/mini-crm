import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Briefcase, Users, AlertCircle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface HotDeal {
  id: string;
  title: string;
  budget: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  pipelineId: string;
  company: { name: string } | null;
}

interface DashboardViewProps {
  totalBudgetRaw: number;
  activeDealsCount: number;
  totalContactsCount: number;
  urgentDeals: HotDeal[];
}

export function DashboardView({
  totalBudgetRaw,
  activeDealsCount,
  totalContactsCount,
  urgentDeals,
}: DashboardViewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Панель управления</h1>
        <p className="text-sm text-muted-foreground">
          Сводная коммерческая аналитика и показатели эффективности вашей команды.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none shadow-md bg-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase text-muted-foreground/60 tracking-wider">
              Объем воронки (в деньгах)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              {formatCurrency(totalBudgetRaw / 100)}
            </div>
            <p className="text-[10px] text-muted-foreground pt-1">
              Сумма всех потенциальных сделок филиала
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase text-muted-foreground/60 tracking-wider">
              Сделки в работе
            </CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{activeDealsCount} шт.</div>
            <p className="text-[10px] text-muted-foreground pt-1">
              Активные карточки на Kanban-досках
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase text-muted-foreground/60 tracking-wider">
              База контактов
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{totalContactsCount} конт.</div>
            <p className="text-[10px] text-muted-foreground pt-1">
              Уникальные клиенты в локальной СУБД
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card className="border-none shadow-md bg-background">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <CardTitle className="text-base font-bold text-foreground">
                Горящие сделки высокого приоритета
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentDeals.length > 0 ? (
                urgentDeals.map((deal) => (
                  <div 
                    key={deal.id}
                    className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 rounded-xl transition-all duration-200 border border-transparent hover:border-muted-foreground/10"
                  >
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {deal.title}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {deal.company?.name || 'Компания не привязана'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge 
                        variant="destructive" 
                        className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md"
                      >
                        {deal.priority === 'URGENT' ? 'Критично' : 'Высокий'}
                      </Badge>
                      <span className="text-sm font-extrabold text-foreground tabular-nums">
                        {formatCurrency(deal.budget / 100)}
                      </span>
                      <Link 
                        href={`/pipelines/${deal.pipelineId}`}
                        className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors"
                        aria-label={`Открыть воронку сделки ${deal.title}`}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground italic">
                  Сделок с критическим или высоким приоритетом не обнаружено. Отличная работа!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
