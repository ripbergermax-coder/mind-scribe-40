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
          content:
            "Hello! I'm your AI Second Brain. Upload documents, ask questions, or switch to voice mode. How can I help you today?",
          timestamp: "just now",
        },
      ],
    },
  ]);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Personal",
      chats: [],
    },
  ]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const currentChat = chats.find((c) => c.id === currentChatId);
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
          content:
            "Hello! I'm your AI Second Brain. Upload documents, ask questions, or switch to voice mode. How can I help you today?",
          timestamp: "just now",
        },
      ],
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setUploadedFiles([]);
    toast({
      title: "New chat created",
      description: "Started a fresh conversation",
    });
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setUploadedFiles([]);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter((c) => c.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        handleCreateNewChat();
      }
    }
    toast({
      title: "Chat deleted",
      description: "Conversation removed",
    });
  };

  const handleCreateProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: "New Project",
      chats: [],
    };
    setProjects((prev) => [...prev, newProject]);
    toast({
      title: "Project created",
      description: "New project added",
    });
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    toast({
      title: "Project deleted",
      description: "Project removed",
    });
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: "just now",
    };

    setChats((prev) =>
      prev.map((chat) => (chat.id === currentChatId ? { ...chat, messages: [...chat.messages, userMessage] } : chat)),
    );

    // Update chat title if it's the first user message
    if (currentChat && currentChat.messages.length === 1) {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      setChats((prev) => prev.map((chat) => (chat.id === currentChatId ? { ...chat, title } : chat)));
    }

    try {
      // Send to N8N and wait for RAG response
      const n8nResponse = await sendTextToN8N(content, {
        messageId: userMessage.id,
        chatId: currentChatId,
        source: "chat",
        isVoiceMode,
      });

      // DEBUG: Log the actual response to see what we get
      console.log("N8N Full Response:", n8nResponse);
      console.log("N8N Response Data:", n8nResponse.data);

      if (!n8nResponse.success) {
        toast({
          title: "Error",
          description: n8nResponse.message,
          variant: "destructive",
        });

        // Show error message in chat
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: "just now",
        };
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === currentChatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat,
          ),
        );
        return;
      }

      // Extract the actual AI response from multiple possible paths
      let aiResponseContent = "I received your message but couldn't generate a response.";

      // Try different possible response paths from n8n
      if (n8nResponse.data?.data?.response) {
        // Path: data.data.response
        aiResponseContent = n8nResponse.data.data.response;
      } else if (n8nResponse.data?.response) {
        // Path: data.response
        aiResponseContent = n8nResponse.data.response;
      } else if (n8nResponse.data?.message) {
        // Path: data.message
        aiResponseContent = n8nResponse.data.message;
      } else if (typeof n8nResponse.data === "string") {
        // Direct string response
        aiResponseContent = n8nResponse.data;
      } else if (n8nResponse.data?.choices?.[0]?.message?.content) {
        // OpenAI direct format
        aiResponseContent = n8nResponse.data.choices[0].message.content;
      }

      console.log("Extracted AI Response:", aiResponseContent);

      // Use actual RAG response from N8N
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponseContent,
        timestamp: "just now",
      };

      setChats((prev) =>
        prev.map((chat) => (chat.id === currentChatId ? { ...chat, messages: [...chat.messages, aiMessage] } : chat)),
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: Date.now().toString() + file.name,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

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
          source: "upload",
        },
      });

      if (!n8nResponse.success) {
        toast({
          title: "N8N Error",
          description: `Failed to send ${file.name} to N8N`,
          variant: "destructive",
        });
      }
    }

    toast({
      title: "Files uploaded",
      description: `${newFiles.length} file(s) sent to N8N for processing`,
    });
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    try {
      toast({
        title: "Transcribing...",
        description: "Converting audio to text",
      });

      // Convert audio blob to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Send to OpenAI STT via edge function
      const sttResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (!sttResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const { text } = await sttResponse.json();

      if (!text) {
        toast({
          title: "Error",
          description: "No speech detected in audio",
          variant: "destructive",
        });
        return;
      }

      // Display the transcribed text as a user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: "just now",
      };

      setChats((prev) =>
        prev.map((chat) => (chat.id === currentChatId ? { ...chat, messages: [...chat.messages, userMessage] } : chat)),
      );

      toast({
        title: "Transcribed",
        description: "Sending to N8N for processing",
      });

      // Now send the transcribed text to N8N
      const n8nResponse = await sendTextToN8N(text, {
        chatId: currentChatId,
        source: "voice",
        originalFormat: "audio",
      });

      if (!n8nResponse.success) {
        toast({
          title: "Error",
          description: "Failed to process with N8N",
          variant: "destructive",
        });
        return;
      }

      // Handle N8N response
      let aiResponseContent = "Audio processed but no response received.";

      if (n8nResponse.data?.data?.response) {
        aiResponseContent = n8nResponse.data.data.response;
      } else if (n8nResponse.data?.response) {
        aiResponseContent = n8nResponse.data.response;
      } else if (n8nResponse.data?.message) {
        aiResponseContent = n8nResponse.data.message;
      } else if (typeof n8nResponse.data === "string") {
        aiResponseContent = n8nResponse.data;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponseContent,
        timestamp: "just now",
      };

      setChats((prev) =>
        prev.map((chat) => (chat.id === currentChatId ? { ...chat, messages: [...chat.messages, aiMessage] } : chat)),
      );
    } catch (error) {
      console.error("Error processing audio:", error);
      toast({
        title: "Error",
        description: "Failed to process audio",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleToggleVoice = () => {
    setIsVoiceMode(!isVoiceMode);
    toast({
      title: isVoiceMode ? "Voice mode disabled" : "Voice mode enabled",
      description: isVoiceMode ? "Switched to text mode" : "You can now speak to the AI",
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
          onAudioUpload={handleAudioUpload}
          isVoiceMode={isVoiceMode}
          onToggleVoice={handleToggleVoice}
        />
      </div>
    </div>
  );
};

export default Index;
