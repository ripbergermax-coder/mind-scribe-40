import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import DocumentUpload from "@/components/DocumentUpload";
import { useToast } from "@/components/ui/use-toast";
import { sendToN8N, sendTextToN8N } from "@/services/n8n";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
}

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI Second Brain. Upload documents, ask questions, or switch to voice mode. How can I help you today?",
      timestamp: "just now"
    }
  ]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: "just now"
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Send to N8N
    const n8nResponse = await sendTextToN8N(content, {
      messageId: userMessage.id,
      source: 'chat',
      isVoiceMode
    });

    if (!n8nResponse.success) {
      toast({
        title: "N8N Error",
        description: n8nResponse.message,
        variant: "destructive"
      });
    }

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I understand your question. This is a demo response. In a full implementation, I would process your input and provide intelligent insights based on your documents and conversation history.",
        timestamp: "just now"
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const handleFileUpload = async (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: Date.now().toString() + file.name,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB"
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Send each file to N8N
    for (const file of Array.from(files)) {
      const n8nResponse = await sendToN8N({
        textPrompt: `Document uploaded: ${file.name}`,
        document: file,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          source: 'upload'
        }
      });

      if (!n8nResponse.success) {
        toast({
          title: "N8N Error",
          description: `Failed to send ${file.name} to N8N`,
          variant: "destructive"
        });
      }
    }

    toast({
      title: "Files uploaded",
      description: `${newFiles.length} file(s) sent to N8N for processing`
    });
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleToggleVoice = () => {
    setIsVoiceMode(!isVoiceMode);
    toast({
      title: isVoiceMode ? "Voice mode disabled" : "Voice mode enabled",
      description: isVoiceMode ? "Switched to text mode" : "You can now speak to the AI"
    });
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <ChatSidebar collapsed={sidebarCollapsed} />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 flex items-center px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hover:bg-secondary"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">New Conversation</h1>
            <p className="text-sm text-muted-foreground">Ask questions, upload docs, or use voice</p>
          </div>
        </div>

        {/* Document Upload Area */}
        <DocumentUpload files={uploadedFiles} onRemoveFile={handleRemoveFile} />

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
          isVoiceMode={isVoiceMode}
          onToggleVoice={handleToggleVoice}
        />
      </div>
    </div>
  );
};

export default Index;
