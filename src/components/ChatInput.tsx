import { useState } from "react";
import { Send, Paperclip, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileUpload: (files: FileList) => void;
  isVoiceMode: boolean;
  onToggleVoice: () => void;
}

const ChatInput = ({ onSendMessage, onFileUpload, isVoiceMode, onToggleVoice }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-end gap-3">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            onChange={(e) => e.target.files && onFileUpload(e.target.files)}
          />
          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0 border-border hover:bg-secondary"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything or upload documents..."
              className="min-h-[60px] max-h-[200px] resize-none bg-secondary border-border focus:border-primary transition-colors pr-12"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={isVoiceMode ? "default" : "outline"}
              size="icon"
              onClick={onToggleVoice}
              className={cn(
                "flex-shrink-0 transition-all",
                isVoiceMode && "bg-gradient-to-br from-primary to-accent shadow-glow"
              )}
            >
              {isVoiceMode ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>

            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              className="flex-shrink-0 bg-gradient-to-br from-primary to-accent hover:opacity-90 shadow-glow disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
