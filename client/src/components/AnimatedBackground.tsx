import React, { useMemo } from 'react';

export default function AnimatedBackground() {
  // Memoize the dots to prevent recalculation on every render
  const dots = useMemo(() => {
    return Array.from({ length: 220 }).map((_, i) => {
      const size = Math.random() * 5 + 1.2;
      const delay = Math.random() * 5;
      const duration = Math.random() * 8 + 10; // Faster movement
      const left = Math.random() * 100 + '%';
      const top = Math.random() * 100 + '%';
      const opacity = Math.random() * 0.45 + 0.15;
      const animationType = i % 4; // Use 4 types now

      return {
        id: i,
        size,
        delay,
        duration,
        left,
        top,
        opacity,
        animationType,
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden bg-[#f0f9ff]">
      {/* Soft background gradient - adjusted for more "sky" components */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{ 
          background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 30%, #ecfeff 60%, #e0f2fe 100%)' 
        }}
      />

      {/* Floating points container */}
      <div className="absolute inset-0">
        {dots.map((dot) => (
          <div
            key={dot.id}
            className="absolute rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]"
            style={{
              width: (dot.size + 1.2) + 'px',
              height: (dot.size + 1.2) + 'px',
              left: dot.left,
              top: dot.top,
              opacity: dot.opacity + 0.15,
              animation: 
                dot.animationType === 0 ? `vibrant-float ${dot.duration}s ease-in-out infinite` :
                dot.animationType === 1 ? `vibrant-drift ${dot.duration * 1.5}s linear infinite` :
                dot.animationType === 2 ? `twinkle ${dot.duration * 0.5}s ease-in-out infinite` :
                `erratic-orbit ${dot.duration * 2}s linear infinite`,
              animationDelay: dot.delay + 's',
              filter: 'blur(0.2px)',
            }}
          />
        ))}

        <style>{`
          @keyframes vibrant-float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(40px, -60px) scale(1.2); }
            66% { transform: translate(-30px, -90px) scale(0.8); }
          }
          
          @keyframes vibrant-drift {
            0% { transform: translate(-50px, 50px) rotate(0deg); }
            100% { transform: translate(50px, -50px) rotate(360deg); }
          }
          
          @keyframes twinkle {
            0%, 100% { opacity: 0.15; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.5); }
          }

          @keyframes erratic-orbit {
            0% { transform: rotate(0deg) translateX(40px) rotate(0deg); }
            100% { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
          }
        `}</style>
      </div>

      {/* Very soft sky/teal radial highlights */}
      <div className="absolute top-[10%] -left-[10%] w-3/4 h-3/4 bg-sky-200/40 rounded-full blur-[140px]" />
      <div className="absolute bottom-[10%] -right-[10%] w-3/4 h-3/4 bg-teal-100/30 rounded-full blur-[140px]" />
    </div>
  );
}
