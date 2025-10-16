import { Button } from "@/components/ui/button";
import { Menu, Settings, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

export const ChatHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Agentic
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
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
