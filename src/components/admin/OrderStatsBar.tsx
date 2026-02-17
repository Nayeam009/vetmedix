import { 
  Clock, 
  Loader2 as Processing, 
  Truck, 
  CheckCircle, 
  XCircle, 
  ShoppingCart,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderStats {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  flagged: number;
  trashed: number;
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
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    valueColor: 'text-amber-700 dark:text-amber-300',
    activeRing: 'ring-amber-400/50',
  },
  { 
    key: 'processing', 
    label: 'Processing', 
    icon: Processing, 
    gradient: 'from-blue-500/10 to-cyan-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    valueColor: 'text-blue-700 dark:text-blue-300',
    activeRing: 'ring-blue-400/50',
  },
  { 
    key: 'shipped', 
    label: 'Shipped', 
    icon: Truck, 
    gradient: 'from-purple-500/10 to-indigo-500/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
    valueColor: 'text-purple-700 dark:text-purple-300',
    activeRing: 'ring-purple-400/50',
  },
  { 
    key: 'delivered', 
    label: 'Delivered', 
    icon: CheckCircle, 
    gradient: 'from-emerald-500/10 to-green-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    valueColor: 'text-emerald-700 dark:text-emerald-300',
    activeRing: 'ring-emerald-400/50',
  },
  { 
    key: 'cancelled', 
    label: 'Cancelled', 
    icon: XCircle, 
    gradient: 'from-red-500/10 to-rose-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    valueColor: 'text-red-700 dark:text-red-300',
    activeRing: 'ring-red-400/50',
  },
] as const;

export function OrderStatsBar({ stats, activeFilter, onFilterChange }: OrderStatsBarProps) {
  return (
    <div className="mb-4 sm:mb-6 space-y-3">
      {/* Scrollable stat cards */}
      <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {/* All orders card */}
        <button
          onClick={() => onFilterChange('all')}
          className={cn(
            'flex-shrink-0 bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm hover:shadow-md transition-all',
            'flex items-center gap-2.5 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 min-w-[100px] sm:min-w-[120px]',
            'active:scale-[0.98]',
            activeFilter === 'all'
              ? 'ring-2 ring-primary/50 border-primary/30 hover:scale-[1.02]'
              : 'hover:border-primary/20'
          )}
        >
          <div className={cn(
            'h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0',
            'bg-gradient-to-br from-primary/10 to-accent/10'
          )}>
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-base sm:text-lg lg:text-xl font-display font-bold leading-none text-foreground">
              {stats.total}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap mt-0.5">All Orders</p>
          </div>
        </button>

        {statCards.map(({ key, label, icon: Icon, gradient, iconColor, valueColor, activeRing }) => {
          const count = stats[key as keyof OrderStats] as number;
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => onFilterChange(isActive ? 'all' : key)}
              className={cn(
                'flex-shrink-0 bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm hover:shadow-md transition-all',
                'flex items-center gap-2.5 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 min-w-[100px] sm:min-w-[120px]',
                'active:scale-[0.98]',
                isActive
                  ? `ring-2 ${activeRing} border-transparent hover:scale-[1.02]`
                  : 'hover:border-primary/20'
              )}
            >
              <div className={cn(
                'h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0',
                `bg-gradient-to-br ${gradient}`
              )}>
                <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', iconColor)} />
              </div>
              <div className="text-left min-w-0">
                <p className={cn('text-base sm:text-lg lg:text-xl font-display font-bold leading-none', valueColor)}>
                  {count}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap mt-0.5">{label}</p>
              </div>
            </button>
          );
        })}

        {/* Flagged card */}
        {stats.flagged > 0 && (
          <button
            onClick={() => onFilterChange(activeFilter === 'flagged' ? 'all' : 'flagged')}
            className={cn(
              'flex-shrink-0 bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm hover:shadow-md transition-all',
              'flex items-center gap-2.5 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 min-w-[100px] sm:min-w-[120px]',
              'active:scale-[0.98]',
              activeFilter === 'flagged'
                ? 'ring-2 ring-destructive/50 border-transparent hover:scale-[1.02]'
                : 'hover:border-primary/20'
            )}
          >
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-destructive/10 to-destructive/5">
              <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-base sm:text-lg lg:text-xl font-display font-bold leading-none text-destructive">
                {stats.flagged}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap mt-0.5">Flagged</p>
            </div>
          </button>
        )}

        {/* Trashed card */}
        {stats.trashed > 0 && (
          <button
            onClick={() => onFilterChange(activeFilter === 'trashed' ? 'all' : 'trashed')}
            className={cn(
              'flex-shrink-0 bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm hover:shadow-md transition-all',
              'flex items-center gap-2.5 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 min-w-[100px] sm:min-w-[120px]',
              'active:scale-[0.98]',
              activeFilter === 'trashed'
                ? 'ring-2 ring-muted-foreground/50 border-transparent hover:scale-[1.02]'
                : 'hover:border-primary/20'
            )}
          >
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-muted-foreground/10 to-muted/10">
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-base sm:text-lg lg:text-xl font-display font-bold leading-none text-muted-foreground">
                {stats.trashed}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap mt-0.5">Trashed</p>
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
