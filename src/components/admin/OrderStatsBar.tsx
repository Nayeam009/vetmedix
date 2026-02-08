import { 
  Clock, 
  Loader2 as Processing, 
  Truck, 
  CheckCircle, 
  XCircle, 
  ShoppingCart,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderStats {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  flagged: number;
  total: number;
  revenue: number;
}

interface OrderStatsBarProps {
  stats: OrderStats;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const statCards = [
  { 
    key: 'pending', 
    label: 'Pending', 
    icon: Clock, 
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    activeBg: 'bg-amber-100 dark:bg-amber-900/40 ring-2 ring-amber-400/50',
  },
  { 
    key: 'processing', 
    label: 'Processing', 
    icon: Processing, 
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    activeBg: 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-400/50',
  },
  { 
    key: 'shipped', 
    label: 'Shipped', 
    icon: Truck, 
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    activeBg: 'bg-purple-100 dark:bg-purple-900/40 ring-2 ring-purple-400/50',
  },
  { 
    key: 'delivered', 
    label: 'Delivered', 
    icon: CheckCircle, 
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    activeBg: 'bg-green-100 dark:bg-green-900/40 ring-2 ring-green-400/50',
  },
  { 
    key: 'cancelled', 
    label: 'Cancelled', 
    icon: XCircle, 
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    activeBg: 'bg-red-100 dark:bg-red-900/40 ring-2 ring-red-400/50',
  },
] as const;

export function OrderStatsBar({ stats, activeFilter, onFilterChange }: OrderStatsBarProps) {
  return (
    <div className="mb-4 sm:mb-6 space-y-3">
      {/* Scrollable stat cards */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {/* All orders card */}
        <button
          onClick={() => onFilterChange('all')}
          className={cn(
            'flex-shrink-0 flex items-center gap-2 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 transition-all min-w-0 active:scale-95',
            activeFilter === 'all'
              ? 'bg-primary/10 ring-2 ring-primary/50'
              : 'bg-muted/50 hover:bg-muted'
          )}
        >
          <ShoppingCart className={cn('h-4 w-4 shrink-0', activeFilter === 'all' ? 'text-primary' : 'text-muted-foreground')} />
          <div className="text-left">
            <p className={cn('text-lg sm:text-xl font-bold leading-none', activeFilter === 'all' ? 'text-primary' : 'text-foreground')}>
              {stats.total}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">All Orders</p>
          </div>
        </button>

        {statCards.map(({ key, label, icon: Icon, color, bg, activeBg }) => {
          const count = stats[key as keyof OrderStats] as number;
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => onFilterChange(isActive ? 'all' : key)}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 transition-all min-w-0 active:scale-95',
                isActive ? activeBg : `${bg} hover:opacity-80`
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', color)} />
              <div className="text-left">
                <p className={cn('text-lg sm:text-xl font-bold leading-none', color)}>
                  {count}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{label}</p>
              </div>
            </button>
          );
        })}

        {/* Flagged card - only show if there are flagged orders */}
        {stats.flagged > 0 && (
          <button
            onClick={() => onFilterChange(activeFilter === 'flagged' ? 'all' : 'flagged')}
            className={cn(
              'flex-shrink-0 flex items-center gap-2 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 transition-all min-w-0 active:scale-95',
              activeFilter === 'flagged'
                ? 'bg-red-100 dark:bg-red-900/40 ring-2 ring-red-400/50'
                : 'bg-red-50 dark:bg-red-900/20 hover:opacity-80'
            )}
          >
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <div className="text-left">
              <p className="text-lg sm:text-xl font-bold leading-none text-red-600 dark:text-red-400">
                {stats.flagged}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">Flagged</p>
            </div>
          </button>
        )}
      </div>

      {/* Revenue summary */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs text-muted-foreground">Active Revenue:</span>
        <span className="text-sm font-bold text-primary">
          ৳{stats.revenue.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
