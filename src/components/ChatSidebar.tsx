import { MessageSquare, FolderKanban, Plus, Trash2 } from "lucide-react";
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
  onDeleteChat: (chatId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
}

const ChatSidebar = ({ 
  collapsed = false, 
  chats, 
  projects, 
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onCreateProject,
  onDeleteProject
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
                <div key={chat.id} className="relative group/item">
                  <Button
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
                  {!collapsed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover/item:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
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
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-5 w-5 hover:bg-sidebar-accent"
                onClick={onCreateProject}
                title="New Project"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {projects.map((project) => (
                <div key={project.id} className="relative group/item">
                  <Button
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
                  {!collapsed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover/item:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
