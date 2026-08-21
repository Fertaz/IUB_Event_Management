
import {
  User as UserIcon, CheckCircle2, Settings, Shield,
  UserCog, ChevronDown
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export function RoleSwitcher() {
  const { currentUser, switchRole } = useAuth();
  const { store } = useData();

  const roles = [
    { id: "user_1", label: "Student", icon: UserIcon },
    { id: "user_2", label: "Club Admin", icon: UserCog },
    { id: "user_3", label: "Super Admin", icon: Shield },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs border-border font-mono"
        >
          <Settings className="size-3" />
          Demo Role
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Switch demo user
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map(({ id, label, icon: Icon }) => {
          const user = store.users.find((u) => u.id === id);
          return (
            <DropdownMenuItem
              key={id}
              onClick={() => switchRole(id)}
              className={`gap-2 ${currentUser?.id === id ? "bg-secondary" : ""}`}
            >
              <Icon className="size-3.5" />
              <div>
                <div className="text-xs font-medium">
                  {label}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {user?.name}
                </div>
              </div>
              {currentUser?.id === id && (
                <CheckCircle2 className="size-3.5 ml-auto text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────

