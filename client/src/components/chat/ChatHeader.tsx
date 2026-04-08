import { Button } from "@/components/ui/button";
import { Menu, GitBranch } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  onToggleSidebar?: () => void;
  onToggleDocumentManager?: () => void;
  onOpenTreeView?: () => void;
  isTreeViewOpen?: boolean;
  onOpenMCP?: () => void;
  isMCPOpen?: boolean;
}

export const ChatHeader = ({
  onToggleSidebar,
  onToggleDocumentManager: _onToggleDocumentManager,
  onOpenTreeView,
  isTreeViewOpen = false,
  onOpenMCP,
  isMCPOpen = false
}: ChatHeaderProps) => {
  return (
    <header className="h-14 sm:h-16 border-b border-border flex items-center justify-between px-3 sm:px-6 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-10 sm:w-10"
          onClick={onToggleSidebar}
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <div onClick={() => window.location.href = "/"}>
          <h1 className="text-base sm:text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Perception
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {onOpenTreeView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 sm:h-10 sm:w-10 transition-colors",
                  isTreeViewOpen && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
                onClick={onOpenTreeView}
              >
                <GitBranch className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isTreeViewOpen ? "Close Tree View" : "Open Tree View"}
            </TooltipContent>
          </Tooltip>
        )}

        {onOpenMCP && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 sm:h-10 sm:w-10 transition-colors",
                  isMCPOpen && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
                onClick={onOpenMCP}
              >
                <div className="flex items-center justify-center font-mono text-xs font-bold border border-current rounded w-5 h-5">
                  M
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isMCPOpen ? "Close MCP Explorer" : "Open MCP Explorer"}
            </TooltipContent>
          </Tooltip>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
};
