import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'green' | 'blue' | 'orange' | 'purple' | 'red';
}

const colorClasses = {
  green: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400',
  blue: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
  orange: 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400',
  purple: 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400',
  red: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
};

export function StatCard({ title, value, icon: Icon, trend, color = 'green' }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-foreground">{value}</p>

        {trend && (
          <span
            className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
          >
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}
