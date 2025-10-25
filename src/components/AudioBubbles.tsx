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
      {bubbles.map((id, index) => {
        const delay = index * 0.1;
        const scale = 0.6 + Math.random() * 0.8;
        const duration = 1 + Math.random() * 0.5;
        
        return (
          <div
            key={id}
            className={cn(
              "absolute w-3 h-3 rounded-full bg-destructive/40",
              "animate-[scale-in_0.3s_ease-out,fade-out_1.5s_ease-out]"
            )}
            style={{
              left: `${30 + Math.random() * 40}%`,
              top: `${30 + Math.random() * 40}%`,
              animationDelay: `${delay}s`,
              transform: `scale(${scale})`,
              animationDuration: `0.3s, ${duration}s`,
            }}
          />
        );
      })}
      
      {/* Concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-destructive/30 animate-ping" 
             style={{ animationDuration: '2s' }} />
        <div className="absolute w-16 h-16 rounded-full border-2 border-destructive/20 animate-ping" 
             style={{ animationDuration: '2.5s' }} />
        <div className="absolute w-20 h-20 rounded-full border-2 border-destructive/10 animate-ping" 
             style={{ animationDuration: '3s' }} />
      </div>
    </div>
  );
};

export default AudioBubbles;
