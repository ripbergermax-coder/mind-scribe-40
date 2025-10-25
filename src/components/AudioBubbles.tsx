import { cn } from "@/lib/utils";

interface AudioBubblesProps {
  isActive: boolean;
}

const AudioBubbles = ({ isActive }: AudioBubblesProps) => {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Pulsing popup overlay */}
      <div className="absolute inset-0 animate-pulse">
        <div className="w-full h-full rounded-lg bg-primary/20 shadow-[0_0_30px_rgba(255,119,0,0.4)]" />
      </div>
      
      {/* Expanding rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="absolute w-12 h-12 rounded-lg border-2 border-primary/60 animate-ping" 
          style={{ animationDuration: '1.5s' }} 
        />
        <div 
          className="absolute w-16 h-16 rounded-lg border-2 border-primary/40 animate-ping" 
          style={{ animationDuration: '2s' }} 
        />
        <div 
          className="absolute w-20 h-20 rounded-lg border-2 border-primary/20 animate-ping" 
          style={{ animationDuration: '2.5s' }} 
        />
      </div>

      {/* Center glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-primary/30 blur-md animate-pulse" 
             style={{ animationDuration: '1s' }} />
      </div>
    </div>
  );
};

export default AudioBubbles;
