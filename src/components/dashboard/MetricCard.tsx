'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string;
  suffix?: string;
  hint: string;
  icon: ReactNode;
}

export function MetricCard({ title, value, suffix, hint, icon }: MetricCardProps) {
  return (
    <Card className="border-none shadow-md bg-background">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 truncate pr-2">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1 overflow-hidden">
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground truncate">
            {value}
          </span>
          {suffix && (
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground shrink-0">
              {suffix}
            </span>
          )}
        </div>
        <p className="pt-1 text-[10px] text-muted-foreground truncate">{hint}</p>
      </CardContent>
    </Card>
  );
}