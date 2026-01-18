import { useRef, useState, useEffect, Suspense, lazy } from 'react';

// Lazy load Three.js components to prevent build failures
const ThreeCanvas = lazy(() => 
  import('@react-three/fiber').then(mod => ({ default: mod.Canvas }))
);

// CSS-based animated cat fallback (works without Three.js)
const CSSAnimatedCat = () => {
  const [isWaving, setIsWaving] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const enterTimer = setTimeout(() => setHasEntered(true), 100);
    const waveTimer = setTimeout(() => setIsWaving(true), 1500);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(waveTimer);
    };
  }, []);

  return (
    <div 
      className={`relative transition-all duration-1000 ease-out ${
        hasEntered ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      }`}
    >
      {/* Cat SVG with animations */}
      <svg 
        viewBox="0 0 200 200" 
        className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96"
        style={{ filter: 'drop-shadow(0 10px 20px rgba(249, 115, 22, 0.3))' }}
      >
        {/* Body */}
        <ellipse cx="100" cy="140" rx="45" ry="40" fill="#f97316" className="animate-pulse" style={{ animationDuration: '3s' }} />
        
        {/* Belly */}
        <ellipse cx="100" cy="145" rx="28" ry="25" fill="#fed7aa" />
        
        {/* Head */}
        <circle cx="100" cy="85" r="38" fill="#f97316" />
        
        {/* Left Ear */}
        <polygon points="65,60 55,25 80,50" fill="#f97316" />
        <polygon points="68,55 62,32 77,50" fill="#fda4af" />
        
        {/* Right Ear */}
        <polygon points="135,60 145,25 120,50" fill="#f97316" />
        <polygon points="132,55 138,32 123,50" fill="#fda4af" />
        
        {/* Left Eye */}
        <ellipse cx="82" cy="80" rx="10" ry="12" fill="white" />
        <circle cx="84" cy="82" r="6" fill="#1c1917" />
        <circle cx="86" cy="79" r="2" fill="white" />
        
        {/* Right Eye */}
        <ellipse cx="118" cy="80" rx="10" ry="12" fill="white" />
        <circle cx="116" cy="82" r="6" fill="#1c1917" />
        <circle cx="114" cy="79" r="2" fill="white" />
        
        {/* Nose */}
        <ellipse cx="100" cy="95" rx="5" ry="4" fill="#fda4af" />
        
        {/* Mouth */}
        <path d="M92 102 Q100 110 108 102" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
        
        {/* Cheeks */}
        <circle cx="70" cy="95" r="8" fill="#fed7aa" opacity="0.7" />
        <circle cx="130" cy="95" r="8" fill="#fed7aa" opacity="0.7" />
        
        {/* Whiskers Left */}
        <line x1="50" y1="90" x2="72" y2="95" stroke="#d4d4d4" strokeWidth="1.5" />
        <line x1="48" y1="100" x2="70" y2="100" stroke="#d4d4d4" strokeWidth="1.5" />
        
        {/* Whiskers Right */}
        <line x1="150" y1="90" x2="128" y2="95" stroke="#d4d4d4" strokeWidth="1.5" />
        <line x1="152" y1="100" x2="130" y2="100" stroke="#d4d4d4" strokeWidth="1.5" />
        
        {/* Front Paws */}
        <ellipse cx="70" cy="175" rx="12" ry="10" fill="#f97316" />
        <ellipse cx="130" cy="175" rx="12" ry="10" fill="#f97316" />
        
        {/* Waving Paw */}
        <g 
          className={`origin-bottom transition-transform ${isWaving ? 'animate-wave' : ''}`}
          style={{ transformOrigin: '55px 160px' }}
        >
          <ellipse cx="55" cy="145" rx="12" ry="10" fill="#f97316" />
          {/* Paw pads */}
          <circle cx="52" cy="142" r="3" fill="#fda4af" />
          <circle cx="58" cy="142" r="3" fill="#fda4af" />
          <circle cx="55" cy="148" r="4" fill="#fda4af" />
        </g>
        
        {/* Tail */}
        <path 
          d="M145 140 Q170 120 165 90 Q162 75 155 80" 
          fill="none" 
          stroke="#f97316" 
          strokeWidth="12" 
          strokeLinecap="round"
          className="animate-tail-wag"
          style={{ transformOrigin: '145px 140px' }}
        />
        <circle cx="155" cy="82" r="8" fill="#ea580c" />
      </svg>
      
      {/* Speech Bubble */}
      <div 
        className={`absolute -top-2 -right-4 sm:top-0 sm:right-0 bg-white rounded-2xl px-3 py-2 shadow-lg transition-all duration-500 ${
          isWaving ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
        }`}
      >
        <p className="text-sm font-semibold text-primary">Hi there! 👋</p>
        <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white transform rotate-45" />
      </div>
    </div>
  );
};

const AnimatedCat3D = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    return null;
  }
  
  return (
    <div 
      ref={containerRef}
      className="w-full h-[200px] sm:h-[280px] md:h-[320px] lg:h-[380px] flex items-center justify-center"
      style={{ touchAction: 'pan-y' }}
    >
      <CSSAnimatedCat />
    </div>
  );
};

export default AnimatedCat3D;
