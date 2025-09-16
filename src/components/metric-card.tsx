import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  status?: 'Critical' | 'Warning' | 'Normal';
  className?: string;
}

const statusClasses = {
  Critical: 'border-l-destructive',
  Warning: 'border-l-yellow-500',
  Normal: 'border-l-green-500',
};

export function MetricCard({ title, value, icon, status, className }: MetricCardProps) {
  const statusClass = status ? statusClasses[status] : '';
  return (
    <Card className={cn('border-l-4', statusClass, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-6 w-6 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
