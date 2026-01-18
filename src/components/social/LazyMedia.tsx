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
 * Auto-playing video with viewport detection (like Facebook/Instagram)
 * - Auto-plays when >50% visible
 * - Pauses when scrolled out of view
 * - Muted by default for autoplay compatibility
 */
export const LazyVideo = ({ src, className, poster }: LazyVideoProps) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle viewport detection for autoplay
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsInView(visible);
        
        if (videoRef.current && isLoaded) {
          if (visible) {
            // Auto-play when entering viewport
            videoRef.current.play().catch(() => {
              // Autoplay blocked, user needs to interact
            });
          } else {
            // Pause when leaving viewport
            videoRef.current.pause();
          }
        }
      },
      {
        rootMargin: '0px',
        threshold: 0.5, // Trigger when 50% visible
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [isLoaded]);

  // Sync playing state with video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-hidden bg-muted group', className)}
    >
      {/* Placeholder skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/80 to-muted flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-black/30 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        loop
        muted={isMuted}
        preload="metadata"
        onLoadedData={() => setIsLoaded(true)}
        onClick={togglePlay}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300 cursor-pointer',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Play/Pause overlay - shows on hover or when paused */}
      {isLoaded && (
        <div 
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-opacity duration-200',
            isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          )}
          onClick={togglePlay}
        >
          <div className="h-14 w-14 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            {isPlaying ? (
              <div className="flex gap-1">
                <div className="w-1.5 h-5 bg-white rounded-sm" />
                <div className="w-1.5 h-5 bg-white rounded-sm" />
              </div>
            ) : (
              <div className="w-0 h-0 border-l-[14px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1" />
            )}
          </div>
        </div>
      )}

      {/* Mute/Unmute button */}
      {isLoaded && (
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
        >
          {isMuted ? (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      )}

      {/* Progress bar */}
      {isLoaded && isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: '0%' }}
            ref={(el) => {
              if (el && videoRef.current) {
                const updateProgress = () => {
                  const video = videoRef.current;
                  if (video && el) {
                    el.style.width = `${(video.currentTime / video.duration) * 100}%`;
                  }
                };
                videoRef.current.addEventListener('timeupdate', updateProgress);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
