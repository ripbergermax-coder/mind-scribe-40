import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import DocumentUpload from "@/components/DocumentUpload";
import StarBackground from "@/components/StarBackground";
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

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: string;
}

interface Project {
  id: string;
  name: string;
  chats: Chat[];
}

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string>("1");
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "New Conversation",
      timestamp: new Date().toISOString(),
      messages: [
        {
          id: "1",
          role: "assistant",
          content: "Hello! I'm your AI Second Brain. Upload documents, ask questions, or switch to voice mode. How can I help you today?",
          timestamp: "just now"
        }
      ]
    }
  ]);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Personal",
      chats: []
    }
  ]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const currentChat = chats.find(c => c.id === currentChatId);
  const messages = currentChat?.messages || [];

  const handleCreateNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Conversation",
      timestamp: new Date().toISOString(),
      messages: [
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Hello! I'm your AI Second Brain. Upload documents, ask questions, or switch to voice mode. How can I help you today?",
          timestamp: "just now"
        }
      ]
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setUploadedFiles([]);
    toast({
      title: "New chat created",
      description: "Started a fresh conversation"
    });
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setUploadedFiles([]);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(c => c.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        handleCreateNewChat();
      }
    }
    toast({
      title: "Chat deleted",
      description: "Conversation removed"
    });
  };

  const handleCreateProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: "New Project",
      chats: []
    };
    setProjects(prev => [...prev, newProject]);
    toast({
      title: "Project created",
      description: "New project added"
    });
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    toast({
      title: "Project deleted",
      description: "Project removed"
    });
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: "just now"
    };
    
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: [...chat.messages, userMessage] }
        : chat
    ));

    // Update chat title if it's the first user message
    if (currentChat && currentChat.messages.length === 1) {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      setChats(prev => prev.map(chat =>
        chat.id === currentChatId
          ? { ...chat, title }
          : chat
      ));
    }

    // Send to N8N and wait for RAG response
    const n8nResponse = await sendTextToN8N(content, {
      messageId: userMessage.id,
      chatId: currentChatId,
      source: 'chat',
      isVoiceMode
    });

    if (!n8nResponse.success) {
      toast({
        title: "Error",
        description: n8nResponse.message,
        variant: "destructive"
      });
      
      // Show error message in chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: "just now"
      };
      setChats(prev => prev.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, errorMessage] }
          : chat
      ));
      return;
    }

    // Use actual RAG response from N8N
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: n8nResponse.data?.response || n8nResponse.data?.message || "I received your message but couldn't generate a response.",
      timestamp: "just now"
    };
    setChats(prev => prev.map(chat =>
      chat.id === currentChatId
        ? { ...chat, messages: [...chat.messages, aiMessage] }
        : chat
    ));
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
          chatId: currentChatId,
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
      <ChatSidebar
        collapsed={sidebarCollapsed} 
        chats={chats}
        projects={projects}
        currentChatId={currentChatId}
        onNewChat={handleCreateNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
      />
      
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
            <h1 className="text-lg font-semibold">{currentChat?.title || "New Conversation"}</h1>
            <p className="text-sm text-muted-foreground">Ask questions, upload docs, or use voice</p>
          </div>
        </div>

        {/* Document Upload Area */}
        <DocumentUpload files={uploadedFiles} onRemoveFile={handleRemoveFile} />

        {/* Messages */}
        <ScrollArea className="flex-1 relative">
          <StarBackground />
          <div className="max-w-4xl mx-auto relative z-10">
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
