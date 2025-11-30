import { Button } from "@/components/ui/button";
import { Menu, Settings, User, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";

interface ChatHeaderProps {
  onToggleSidebar?: () => void;
  onToggleDocumentManager?: () => void;
}

export const ChatHeader = ({ onToggleSidebar, onToggleDocumentManager }: ChatHeaderProps) => {
  const navigate = useNavigate();

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
        {onToggleDocumentManager && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={onToggleDocumentManager}
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        )}

        <ThemeToggle />

        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/")}>
              Home
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/auth/login")}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
