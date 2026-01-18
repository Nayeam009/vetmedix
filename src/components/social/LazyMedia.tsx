import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Lazy loading image with progressive loading effect
 * Uses Intersection Observer for efficient viewport detection
 */
export const LazyImage = ({ src, alt = '', className, onClick }: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {/* Placeholder skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/80 to-muted" />
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <span className="text-xs">Failed to load</span>
        </div>
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        data-src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        onClick={onClick}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          onClick && 'cursor-pointer hover:brightness-95'
        )}
      />
    </div>
  );
};

interface LazyVideoProps {
  src: string;
  className?: string;
  poster?: string;
}

/**
 * Lazy loading video with poster frame
 */
export const LazyVideo = ({ src, className, poster }: LazyVideoProps) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(videoRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/80 to-muted flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-black/30 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={isInView ? src : undefined}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        onLoadedData={() => setIsLoaded(true)}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
};
