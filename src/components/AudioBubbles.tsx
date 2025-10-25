import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AudioBubblesProps {
  isActive: boolean;
}

const AudioBubbles = ({ isActive }: AudioBubblesProps) => {
  const [bubbles, setBubbles] = useState<number[]>([]);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setBubbles(prev => {
          const newBubbles = [...prev];
          if (newBubbles.length < 8) {
            newBubbles.push(Date.now());
          }
          return newBubbles.slice(-8);
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      setBubbles([]);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Animated bubbles */}
      {bubbles.map((id, index) => {
        const delay = index * 0.1;
        const scale = 0.5 + Math.random() * 0.6;
        const duration = 1.2 + Math.random() * 0.8;
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;
        
        return (
          <div
            key={id}
            className="absolute w-2 h-2 rounded-full bg-primary/60 shadow-[0_0_8px_rgba(255,119,0,0.5)]"
            style={{
              left: `calc(50% + ${offsetX}px)`,
              top: `calc(50% + ${offsetY}px)`,
              animationDelay: `${delay}s`,
              animation: `bubble-float ${duration}s ease-out forwards`,
              transform: `scale(${scale})`,
            }}
          />
        );
      })}
      
      {/* Pulsing rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary/40 animate-ping" 
             style={{ animationDuration: '1.5s' }} />
        <div className="absolute w-14 h-14 rounded-full border-2 border-primary/25 animate-ping" 
             style={{ animationDuration: '2s' }} />
        <div className="absolute w-18 h-18 rounded-full border-2 border-primary/15 animate-ping" 
             style={{ animationDuration: '2.5s' }} />
      </div>
    </div>
  );
};

export default AudioBubbles;
