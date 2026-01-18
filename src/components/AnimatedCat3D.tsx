import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// Cute stylized cat made with basic geometries
const CuteCat = ({ isVisible }: { isVisible: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const pawRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const leftEarRef = useRef<THREE.Mesh>(null);
  const rightEarRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'sitting' | 'waving'>('entering');
  const [entranceProgress, setEntranceProgress] = useState(0);
  
  // Animation timing
  useEffect(() => {
    if (!isVisible) return;
    
    const enterTimer = setTimeout(() => {
      setAnimationPhase('sitting');
    }, 1500);
    
    const waveTimer = setTimeout(() => {
      setAnimationPhase('waving');
    }, 2000);
    
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(waveTimer);
    };
  }, [isVisible]);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Entrance animation - slide in from left
    if (animationPhase === 'entering' && entranceProgress < 1) {
      setEntranceProgress(prev => Math.min(prev + 0.02, 1));
      const easeOut = 1 - Math.pow(1 - entranceProgress, 3);
      groupRef.current.position.x = THREE.MathUtils.lerp(-3, 0, easeOut);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(0.3, 0, easeOut);
    }
    
    // Subtle body bob
    groupRef.current.position.y = Math.sin(time * 2) * 0.03;
    
    // Tail swaying
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(time * 3) * 0.3;
      tailRef.current.rotation.x = Math.sin(time * 2) * 0.1;
    }
    
    // Ear twitching
    if (leftEarRef.current && rightEarRef.current) {
      const earTwitch = Math.sin(time * 8) * 0.05;
      if (Math.floor(time) % 4 === 0) {
        leftEarRef.current.rotation.z = earTwitch;
        rightEarRef.current.rotation.z = -earTwitch;
      }
    }
    
    // Eye blinking
    if (leftEyeRef.current && rightEyeRef.current) {
      const blinkCycle = Math.floor(time) % 5;
      const blinkProgress = time % 1;
      if (blinkCycle === 0 && blinkProgress < 0.15) {
        const blinkScale = blinkProgress < 0.075 ? 1 - blinkProgress * 10 : (blinkProgress - 0.075) * 10;
        leftEyeRef.current.scale.y = Math.max(0.1, blinkScale);
        rightEyeRef.current.scale.y = Math.max(0.1, blinkScale);
      } else {
        leftEyeRef.current.scale.y = 1;
        rightEyeRef.current.scale.y = 1;
      }
    }
    
    // Waving animation
    if (pawRef.current && animationPhase === 'waving') {
      const waveAngle = Math.sin(time * 4) * 0.4 + 0.6;
      pawRef.current.rotation.z = waveAngle;
      pawRef.current.position.y = 0.3 + Math.sin(time * 4) * 0.1;
    }
  });
  
  // Cat colors - warm orange to match brand
  const bodyColor = '#f97316';
  const lightColor = '#fed7aa';
  const darkColor = '#ea580c';
  const pinkColor = '#fda4af';
  const whiteColor = '#ffffff';
  const blackColor = '#1c1917';
  
  return (
    <group ref={groupRef} position={[-3, 0, 0]} scale={0.8}>
      {/* Body */}
      <mesh position={[0, -0.3, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      
      {/* Belly patch */}
      <mesh position={[0, -0.3, 0.35]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshToonMaterial color={lightColor} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.35, 0.1]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      
      {/* Cheeks */}
      <mesh position={[-0.25, 0.2, 0.35]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshToonMaterial color={lightColor} />
      </mesh>
      <mesh position={[0.25, 0.2, 0.35]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshToonMaterial color={lightColor} />
      </mesh>
      
      {/* Nose */}
      <mesh position={[0, 0.22, 0.5]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshToonMaterial color={pinkColor} />
      </mesh>
      
      {/* Left Eye */}
      <group ref={leftEyeRef} position={[-0.15, 0.4, 0.38]}>
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshToonMaterial color={whiteColor} />
        </mesh>
        <mesh position={[0.02, 0, 0.08]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshToonMaterial color={blackColor} />
        </mesh>
        <mesh position={[0.04, 0.03, 0.12]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshToonMaterial color={whiteColor} />
        </mesh>
      </group>
      
      {/* Right Eye */}
      <group ref={rightEyeRef} position={[0.15, 0.4, 0.38]}>
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshToonMaterial color={whiteColor} />
        </mesh>
        <mesh position={[-0.02, 0, 0.08]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshToonMaterial color={blackColor} />
        </mesh>
        <mesh position={[-0.04, 0.03, 0.12]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshToonMaterial color={whiteColor} />
        </mesh>
      </group>
      
      {/* Left Ear */}
      <mesh ref={leftEarRef} position={[-0.3, 0.7, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.15, 0.3, 32]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      <mesh position={[-0.28, 0.65, 0.02]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.08, 0.18, 32]} />
        <meshToonMaterial color={pinkColor} />
      </mesh>
      
      {/* Right Ear */}
      <mesh ref={rightEarRef} position={[0.3, 0.7, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.15, 0.3, 32]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.28, 0.65, 0.02]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.08, 0.18, 32]} />
        <meshToonMaterial color={pinkColor} />
      </mesh>
      
      {/* Whiskers - Left */}
      <mesh position={[-0.35, 0.22, 0.4]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.005, 0.005, 0.2, 8]} />
        <meshToonMaterial color={whiteColor} />
      </mesh>
      <mesh position={[-0.38, 0.18, 0.4]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.2, 8]} />
        <meshToonMaterial color={whiteColor} />
      </mesh>
      
      {/* Whiskers - Right */}
      <mesh position={[0.35, 0.22, 0.4]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.005, 0.005, 0.2, 8]} />
        <meshToonMaterial color={whiteColor} />
      </mesh>
      <mesh position={[0.38, 0.18, 0.4]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.2, 8]} />
        <meshToonMaterial color={whiteColor} />
      </mesh>
      
      {/* Front Left Paw (waving paw) */}
      <group ref={pawRef} position={[-0.35, 0, 0.3]}>
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshToonMaterial color={bodyColor} />
        </mesh>
        {/* Paw pad */}
        <mesh position={[0, 0, 0.08]} rotation={[0.3, 0, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshToonMaterial color={pinkColor} />
        </mesh>
        {/* Small toe pads */}
        <mesh position={[-0.04, 0.05, 0.1]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshToonMaterial color={pinkColor} />
        </mesh>
        <mesh position={[0.04, 0.05, 0.1]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshToonMaterial color={pinkColor} />
        </mesh>
      </group>
      
      {/* Front Right Paw */}
      <mesh position={[0.35, -0.45, 0.3]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      
      {/* Back Paws */}
      <mesh position={[-0.3, -0.55, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.3, -0.55, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      
      {/* Tail */}
      <mesh ref={tailRef} position={[0, -0.3, -0.45]} rotation={[0.5, 0, 0]}>
        <capsuleGeometry args={[0.08, 0.5, 8, 16]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      {/* Tail tip */}
      <mesh position={[0, -0.05, -0.7]} rotation={[0.3, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshToonMaterial color={darkColor} />
      </mesh>
      
      {/* Mouth (smile) */}
      <mesh position={[0, 0.15, 0.48]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[0.04, 0.01, 8, 16, Math.PI]} />
        <meshToonMaterial color={darkColor} />
      </mesh>
    </group>
  );
};

const AnimatedCat3D = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Delay visibility for smooth entrance
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
      className="w-full h-[200px] sm:h-[280px] md:h-[320px] lg:h-[380px]"
      style={{ touchAction: 'pan-y' }}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, 3, 2]} intensity={0.4} color="#fef3c7" />
        <pointLight position={[0, 2, 3]} intensity={0.3} color="#fed7aa" />
        
        <Suspense fallback={null}>
          <Float
            speed={2}
            rotationIntensity={0.1}
            floatIntensity={0.3}
          >
            <CuteCat isVisible={isVisible} />
          </Float>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default AnimatedCat3D;
