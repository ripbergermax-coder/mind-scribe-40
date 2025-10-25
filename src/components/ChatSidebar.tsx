import { MessageSquare, FolderKanban, Plus, Trash2, Edit2, LogOut } from "lucide-react";
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
  project_id?: string | null;
}

interface Project {
  id: string;
  name: string;
}

interface ChatSidebarProps {
  collapsed?: boolean;
  chats: Chat[];
  projects: Project[];
  currentChatId: string;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string) => void;
  onMoveToProject: (chatId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string) => void;
  onLogout: () => void;
}

const ChatSidebar = ({ 
  collapsed = false, 
  chats, 
  projects, 
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onMoveToProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
  onLogout
}: ChatSidebarProps) => {
  const unassignedChats = chats.filter(chat => !chat.project_id).slice(0, 10);

  return (
    <div className={cn(
      "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-16" : "w-full"
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
              {unassignedChats.map((chat) => (
                <div key={chat.id} className="relative group/item">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start hover:bg-sidebar-accent group",
                      collapsed ? "px-2" : "pr-2",
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
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity bg-sidebar z-10 pr-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-primary/20 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRenameChat(chat.id);
                        }}
                        title="Rename"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-accent/20 hover:text-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToProject(chat.id);
                        }}
                        title="Move to project"
                      >
                        <FolderKanban className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
              {projects.map((project) => {
                const projectChats = chats.filter(chat => chat.project_id === project.id);
                return (
                  <div key={project.id} className="space-y-1">
                    <div className="relative group/item">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start hover:bg-sidebar-accent group",
                          collapsed ? "px-2" : "pr-2"
                        )}
                      >
                        <FolderKanban className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-accent transition-colors" />
                        {!collapsed && (
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-sm truncate">{project.name}</span>
                            <span className="text-xs text-muted-foreground">{projectChats.length}</span>
                          </div>
                        )}
                      </Button>
                      {!collapsed && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity bg-sidebar z-10 pr-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-primary/20 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRenameProject(project.id);
                            }}
                            title="Rename"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject(project.id);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {!collapsed && projectChats.map((chat) => (
                      <div key={chat.id} className="relative group/item ml-6">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start hover:bg-sidebar-accent group pr-2",
                            currentChatId === chat.id && "bg-sidebar-accent border-l-2 border-primary"
                          )}
                          onClick={() => onSelectChat(chat.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                          <div className="flex-1 text-left overflow-hidden">
                            <p className="text-sm truncate">{chat.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {chat.messages.length} messages
                            </p>
                          </div>
                        </Button>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity bg-sidebar z-10 pr-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-primary/20 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRenameChat(chat.id);
                            }}
                            title="Rename"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-accent/20 hover:text-accent"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveToProject(chat.id);
                            }}
                            title="Move to project"
                          >
                            <FolderKanban className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteChat(chat.id);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-sidebar-accent text-muted-foreground hover:text-foreground"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;
