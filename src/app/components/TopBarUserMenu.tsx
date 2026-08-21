import {
  useNavigate
} from "react-router";

import {
  User as UserIcon, ChevronDown,
  ArrowLeft
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger
} from "./ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
} from "./ui/avatar";
import { getInitials } from "../lib/uiHelpers";
import { useAuth } from "../context/AuthContext";

export function TopBarUserMenu() {
  const { currentUser, logout, isClubAdmin, isSuperAdmin } =
    useAuth();
  const navigate = useNavigate();

  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : isClubAdmin
      ? "Club Admin"
      : "Student";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2 h-9">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {getInitials(currentUser?.name ?? "U")}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-xs font-medium max-w-[100px] truncate">
            {currentUser?.name?.split(" ")[0]}
          </span>
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold truncate">
            {currentUser?.name}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
            {currentUser?.email}
          </p>
          <span className="inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary font-medium">
            {roleLabel}
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <UserIcon className="size-4 mr-2" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <ArrowLeft className="size-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

