import { MessageSquare, FolderKanban, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
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

interface ChatSidebarProps {
  collapsed?: boolean;
  chats: Chat[];
  projects: Project[];
  currentChatId: string;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
}

const ChatSidebar = ({ 
  collapsed = false, 
  chats, 
  projects, 
  currentChatId,
  onNewChat,
  onSelectChat 
}: ChatSidebarProps) => {
  const recentChats = chats.slice(0, 10);

  return (
    <div className={cn(
      "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-16" : "w-72"
    )}>
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Second Brain
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-sidebar-accent"
          onClick={onNewChat}
          title="New Chat"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6">
          {/* Recent Chats */}
          <div>
            <div className="flex items-center gap-2 px-2 mb-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              {!collapsed && (
                <span className="text-sm font-medium text-muted-foreground">Recent Chats</span>
              )}
            </div>
            <div className="space-y-1">
              {recentChats.map((chat) => (
                <Button
                  key={chat.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start hover:bg-sidebar-accent group",
                    collapsed && "px-2",
                    currentChatId === chat.id && "bg-sidebar-accent border-l-2 border-primary"
                  )}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <MessageSquare className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  {!collapsed && (
                    <div className="flex-1 text-left overflow-hidden">
                      <p className="text-sm truncate">{chat.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {chat.messages.length} messages
                      </p>
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {!collapsed && <Separator className="bg-sidebar-border" />}

          {/* Projects */}
          <div>
            <div className="flex items-center gap-2 px-2 mb-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              {!collapsed && (
                <span className="text-sm font-medium text-muted-foreground">Projects</span>
              )}
            </div>
            <div className="space-y-1">
              {projects.map((project) => (
                <Button
                  key={project.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start hover:bg-sidebar-accent group",
                    collapsed && "px-2"
                  )}
                >
                  <FolderKanban className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-accent transition-colors" />
                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm">{project.name}</span>
                      <span className="text-xs text-muted-foreground">{project.chats.length}</span>
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
