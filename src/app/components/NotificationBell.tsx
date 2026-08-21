import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router";

import { toast, Toaster } from "sonner";
import { format, parseISO, isPast } from "date-fns";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Bell,
  User as UserIcon,
  Menu,
  ChevronRight,
  Search,
  Plus,
  Clock,
  MapPin,
  Ticket,
  AlertCircle,
  CheckCircle2,
  XCircle,
  List,
  UserCheck,
  Settings,
  Trash2,
  Edit3,
  BookOpen,
  Shield,
  UserCog,
  BadgeCheck,
  Hourglass,
  ChevronDown,
  ArrowLeft,
  Globe,
  CalendarCheck,
  Share2,
  CalendarPlus,
  Download,
  Repeat,
  MailCheck,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Avatar,
  AvatarFallback,
} from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  downloadICS,
  googleCalendarUrl,
  shareEvent,
  checkInCode,
  parseCheckInCode,
  getOccurrences,
  recurrenceLabel,
  formatEventTime,
} from "../lib/eventUtils";
import { QRCodeSVG } from "qrcode.react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type {
  StoreState,
  User,
  UserRole,
  ClubRole,
  Club,
  Event,
  Notification,
  RoleRequest,
} from "../lib/store";
import {
  initialState,
  registerForEvent,
  cancelRegistration,
  applyToClub,
  reviewMembership,
  removeMember,
  assignClubRoles,
  updateMemberRole,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEventAdmin,
  deleteClubAdmin,
  markNotificationsRead,
  updateProfile,
  registerUser,
  submitRoleRequest,
  reviewRoleRequest,
  changeUserRole,
  seedCounters,
  setCheckIn,
  toggleEventException,
  sendDigest,
} from "../lib/store";
import { authService } from "../services/authService";
import {
  fetchAppState,
  persistAppState,
} from "../services/stateService";
import {
  fetchClubMembers,
  assignRoles as assignClubRolesApi,
  updateMemberRole as updateMemberRoleApi,
  deleteMember as deleteMemberApi,
  addMember as addMemberApi,
  updateMemberDetails as updateMemberDetailsApi,
  type GetClubMembersResponse,
  type MemberSummary,
} from "../services/memberService";
import { notifIcon } from "../lib/uiHelpers";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export function NotificationBell() {
  const { store, doMarkNotificationsRead } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const myNotifs = store.notifications
    .filter((n) => n.user_id === currentUser?.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8);

  const unread = store.notifications.filter(
    (n) => n.user_id === currentUser?.id && !n.is_read,
  ).length;

  const notifIcon = (type: Notification["type"]) => {
    const map: Record<string, React.ElementType> = {
      registration: CheckCircle2,
      waitlist: Hourglass,
      event_update: AlertCircle,
      membership: UserCheck,
      role_request: BadgeCheck,
      general: Bell,
    };
    return map[type] ?? Bell;
  };

  function handleOpen(val: boolean) {
    setOpen(val);
    if (val && unread > 0) doMarkNotificationsRead();
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-[480px] overflow-y-auto"
      >
        <DropdownMenuLabel className="flex items-center justify-between sticky top-0 bg-popover z-10">
          <span>Notifications</span>
          {myNotifs.length > 0 && (
            <button
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="text-xs text-primary hover:underline font-normal"
            >
              View all
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {myNotifs.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          </div>
        ) : (
          myNotifs.map((n) => {
            const Icon = notifIcon(n.type);
            return (
              <div
                key={n.id}
                className={`flex gap-3 px-3 py-3 border-b border-border/50 last:border-0 ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                <div
                  className={`mt-0.5 shrink-0 size-7 rounded-full flex items-center justify-center ${!n.is_read ? "bg-primary/10" : "bg-muted"}`}
                >
                  <Icon
                    className={`size-3.5 ${!n.is_read ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed text-foreground">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">
                    {n.created_at.slice(0, 10)}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="size-2 rounded-full bg-accent shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

