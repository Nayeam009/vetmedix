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
  { key: 'all', label: 'Total', icon: Package, color: 'text-primary' },
  { key: 'in-stock', label: 'In Stock', icon: PackageCheck, color: 'text-green-600' },
  { key: 'out-of-stock', label: 'Out of Stock', icon: PackageX, color: 'text-destructive' },
  { key: 'low-stock', label: 'Low Stock', icon: AlertTriangle, color: 'text-amber-600' },
  { key: 'featured', label: 'Featured', icon: Star, color: 'text-amber-500' },
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
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {statCards.map(({ key, label, icon: Icon, color }) => {
        const value = getStatValue(key, stats);
        const isActive = activeFilter === key;
        
        return (
          <button
            key={key}
            onClick={() => onFilterChange(isActive ? 'all' : key)}
            className={cn(
              'relative flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-xl border transition-all duration-200',
              'hover:shadow-md active:scale-95',
              isActive
                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                : 'border-border bg-card hover:border-primary/30'
            )}
          >
            <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', color)} />
            <span className="text-lg sm:text-xl font-bold leading-none">{value}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground leading-none">{label}</span>
            {isActive && key !== 'all' && (
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
