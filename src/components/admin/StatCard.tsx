import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = ({ title, value, icon, trend, className }: StatCardProps) => {
  return (
    <div className={cn(
      "bg-card rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-border shadow-sm hover:shadow-md transition-all",
      className
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1 truncate">{title}</p>
          <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-display font-bold text-foreground truncate">{value}</p>
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium",
              trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              )}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal hidden sm:inline">vs last month</span>
            </div>
          )}
        </div>
        
        <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
};
