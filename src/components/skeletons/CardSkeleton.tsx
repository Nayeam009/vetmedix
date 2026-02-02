import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loading component for product cards.
 * Matches the dimensions and layout of ProductCard.
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="aspect-square w-full" />
      
      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <Skeleton className="h-4 w-3/4" />
        
        {/* Category */}
        <Skeleton className="h-3 w-1/4" />
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        
        {/* Button */}
        <Skeleton className="h-9 w-full rounded-lg mt-2" />
      </div>
    </div>
  );
}

/**
 * Skeleton loading component for doctor cards.
 * Matches the dimensions and layout of DoctorCard.
 */
export function DoctorCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      {/* Avatar and name */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      
      {/* Qualifications */}
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      
      {/* Button */}
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

/**
 * Skeleton loading component for clinic cards.
 * Matches the dimensions and layout of ClinicCard.
 */
export function ClinicCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="aspect-video w-full" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name and badge */}
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        
        {/* Address */}
        <Skeleton className="h-3 w-full" />
        
        {/* Services */}
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        {/* Button */}
        <Skeleton className="h-10 w-full rounded-lg mt-2" />
      </div>
    </div>
  );
}

/**
 * Skeleton loading component for appointment cards.
 */
export function AppointmentCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      
      {/* Details */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      {/* Date/Time */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

/**
 * Skeleton loading component for social post cards.
 */
export function PostCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Image */}
      <div className="mt-3">
        <Skeleton className="aspect-square w-full" />
      </div>
      
      {/* Actions */}
      <div className="p-4 flex gap-6">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

/**
 * Grid skeleton for multiple product cards
 */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Grid skeleton for multiple doctor cards
 */
export function DoctorGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <DoctorCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Grid skeleton for multiple clinic cards
 */
export function ClinicGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ClinicCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * List skeleton for posts in feed
 */
export function PostListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
