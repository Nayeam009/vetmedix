import { Package, PackageCheck, PackageX, AlertTriangle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductStats {
  total: number;
  inStock: number;
  outOfStock: number;
  lowStock: number;
  featured?: number;
}

interface ProductStatsBarProps {
  stats: ProductStats;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const statCards = [
  { 
    key: 'all', label: 'Total', icon: Package,
    gradient: 'from-primary/10 to-accent/10',
    iconColor: 'text-primary',
    valueColor: 'text-foreground',
    activeRing: 'ring-primary/50',
  },
  { 
    key: 'in-stock', label: 'In Stock', icon: PackageCheck,
    gradient: 'from-emerald-500/10 to-green-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    valueColor: 'text-emerald-700 dark:text-emerald-300',
    activeRing: 'ring-emerald-400/50',
  },
  { 
    key: 'out-of-stock', label: 'Out of Stock', icon: PackageX,
    gradient: 'from-red-500/10 to-rose-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    valueColor: 'text-red-700 dark:text-red-300',
    activeRing: 'ring-red-400/50',
  },
  { 
    key: 'low-stock', label: 'Low Stock', icon: AlertTriangle,
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    valueColor: 'text-amber-700 dark:text-amber-300',
    activeRing: 'ring-amber-400/50',
  },
  { 
    key: 'featured', label: 'Featured', icon: Star,
    gradient: 'from-amber-400/10 to-yellow-500/10',
    iconColor: 'text-amber-500 dark:text-amber-300',
    valueColor: 'text-amber-600 dark:text-amber-200',
    activeRing: 'ring-amber-400/50',
  },
] as const;

function getStatValue(key: string, stats: ProductStats): number {
  switch (key) {
    case 'all': return stats.total;
    case 'in-stock': return stats.inStock;
    case 'out-of-stock': return stats.outOfStock;
    case 'low-stock': return stats.lowStock;
    case 'featured': return stats.featured ?? 0;
    default: return 0;
  }
}

export function ProductStatsBar({ stats, activeFilter, onFilterChange }: ProductStatsBarProps) {
  return (
    <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 mb-4 sm:mb-6">
      {statCards.map(({ key, label, icon: Icon, gradient, iconColor, valueColor, activeRing }) => {
        const value = getStatValue(key, stats);
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
                {value}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap mt-0.5">{label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
