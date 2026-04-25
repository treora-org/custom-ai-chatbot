"use client";

import { useSpring, animated } from '@react-spring/web';
import { useEffect } from 'react';

export function AuroraBackground({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const [{ bgPosition }, api] = useSpring(() => ({
    bgPosition: '0% 50%',
    config: { tension: 10, friction: 50 },
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      api.start({
        bgPosition: `${Math.random() * 100}% ${Math.random() * 100}%`,
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-black ${className}`}>
      <animated.div
        className="absolute inset-0 w-[200%] h-[200%] -left-[50%] -top-[50%] opacity-30 mix-blend-screen pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(100, 100, 100, 0.4) 0%, transparent 50%),
                       radial-gradient(circle at 80% 20%, rgba(150, 150, 150, 0.2) 0%, transparent 40%),
                       radial-gradient(circle at 20% 80%, rgba(200, 200, 200, 0.1) 0%, transparent 60%)`,
          backgroundSize: '100% 100%',
          filter: 'blur(60px)',
          transform: bgPosition.to((pos) => `translate3d(0, 0, 0) scale(1) ${pos}`), // Simulate movement, you can improve this with a true framer-motion/react-spring organic movement
        }}
      />
      {children}
    </div>
  );
}
